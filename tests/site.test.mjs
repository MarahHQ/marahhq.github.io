// The site's checks, on the built dist/ (npm run build first; npm run check does both).
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { after, before, describe, it } from "node:test";
import { ANDROID, chrome, open, serve } from "./browser.mjs";

const page = readFileSync("dist/index.html", "utf8");
const notFound = readFileSync("dist/404.html", "utf8");
// Vite puts the bundled stylesheet and scripts in dist/_app/, with a hash in their names.
const linked = (html, ext) =>
  [...html.matchAll(new RegExp(`"/_app/([\\w.-]+-[\\w-]{8}\\.${ext})"`, "g"))].map((m) => m[1]);
const [css] = linked(page, "css");
const [js] = linked(page, "js");
// The prerendered page as text, its tags taken out: what a search engine or a link preview reads.
const text = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("the build", () => {
  it("links the stylesheet and the script by their hashed names", () => {
    assert.ok(css && js, "the page links /_app/<name>-<hash>.css and .js");
    assert.ok(existsSync(`dist/_app/${css}`) && existsSync(`dist/_app/${js}`));
    assert.deepEqual(linked(notFound, "css"), [css]);
  });

  it("keeps the public files at their addresses", () => {
    // Other sites and the launcher's docs link to these: their paths never change.
    for (const file of [
      "logo.svg",
      "logo-static.svg",
      "logo-mark.svg",
      "logo-mark-static.svg",
      "og.png",
      "icon-180.png",
      "mascot.webp",
      "screen-home.webp",
      "fonts/ubuntu-regular.woff2",
      "demo/red-alert-2.webp",
    ])
      assert.ok(existsSync(`dist/assets/${file}`), file);
    assert.ok(existsSync("dist/.nojekyll"));
    assert.ok(!existsSync("dist/.vite"), "the build's own manifest isn't published");
  });

  it("prerenders the page's words and tags for search engines and visitors without JavaScript", () => {
    const words = text(page);
    for (const line of [
      "All your games. One launcher.",
      "Two ways in.",
      "curl -fsSL https://github.com/MarahHQ/marah-launcher/releases/latest/download/marah-launcher-linux-x86_64.tar.gz",
      "Is Marah Launcher free?",
      "It is free software under the GNU GPL, version 3 or later.",
      "Know before you press Play.",
      "Gaming PC:",
      "Thin laptop:",
      "Older PC:",
      "Which one is for you?",
      "sudo dnf install marah-launcher",
      "Inspired by Azrak.",
    ])
      assert.ok(words.includes(line), line);
    assert.match(page, /<title>Marah Launcher: all your games, one launcher<\/title>/);
    assert.match(page, /<meta name="description" content="Marah Launcher puts your games/);
    assert.match(page, /<link rel="canonical" href="https:\/\/marahhq\.github\.io\/">/);
    for (const [property, value] of [
      ["og:type", "website"],
      ["og:url", "https://marahhq.github.io/"],
      ["og:image", "https://marahhq.github.io/assets/og.png"],
      ["og:image:width", "1200"],
      ["og:image:height", "630"],
    ])
      assert.ok(page.includes(`<meta property="${property}" content="${value}">`), property);
    assert.match(page, /<meta property="og:title" content="[^"]+">/);
    assert.match(page, /<meta name="twitter:card" content="summary_large_image">/);
    assert.match(page, /<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">/);
    assert.match(page, /<link rel="icon" href="\/assets\/logo-static\.svg" type="image\/svg\+xml">/);
    assert.match(page, /<link rel="apple-touch-icon" href="\/assets\/icon-180\.png">/);
    // The theme script runs before the stylesheet loads, and the HTML itself carries no theme.
    assert.ok(page.indexOf("marah-theme") < page.indexOf(`/_app/${css}`));
    assert.match(page, /<html lang="en">/);
    // The parts that need the script start hidden; the rest starts open.
    const tags = (attribute) =>
      [...page.matchAll(/<[a-z]+\b[^>]*>/g)].map((m) => m[0]).filter((tag) => tag.includes(attribute));
    const hidden = (tag) => /\shidden(=""|\s|>)/.test(tag);
    assert.deepEqual(tags("data-pc-panel=").map(hidden), [false, false, false]);
    assert.deepEqual(tags('role="tabpanel"').map(hidden), [false, false]);
    assert.deepEqual(tags('role="tablist"').map(hidden), [true]);
    assert.deepEqual(
      tags("data-qa").map((tag) => tag.includes('data-state="open"')),
      Array(7).fill(true),
      "every answer open",
    );
  });

  it("prerenders the 404 page for any depth, kept out of search results", () => {
    assert.match(notFound, /<meta name="robots" content="noindex">/);
    assert.match(notFound, /<title>Page not found · Marah Launcher<\/title>/);
    assert.ok(text(notFound).includes("This level isn't here."));
    for (const [, path] of notFound.matchAll(/(?:src|href)="([^"#]+)"/g))
      assert.ok(/^(\/|https:)/.test(path), `${path} starts with / so it works at any depth`);
  });

  it("has no component class that is also a Tailwind utility", () => {
    // A component named like a utility gets the utility's style too: `.outline` once drew a
    // second border, and `.collapse` hid the panels.
    const source = readFileSync("src/styles/components.css", "utf8") + readFileSync("src/styles/base.css", "utf8");
    const components = new Set([...source.matchAll(/\.([a-z][a-z0-9-]*)(?=[\s,.:{>\[)])/g)].map((m) => m[1]));
    const built = readFileSync(`dist/_app/${css}`, "utf8");
    const utilities = built.slice(built.indexOf("@layer utilities"));
    // A utility's own rule starts right after a brace: `}.outline{` or `}.outline:hover{`. A state
    // variant like `[&.on]:border-ice` compiles to `.\[\&\.on\]\:border-ice.on`, which is no clash.
    const ownUtilities = new Set(["wrap", "eyebrow", "pill", "accent-text", "hint"]);
    const clashes = [...components].filter(
      (name) => !ownUtilities.has(name) && new RegExp(`[{}]\\.${name}[{:,]`).test(utilities),
    );
    assert.deepEqual(clashes, []);
  });

  it("has a part on the controller for each button the script lights, and no brand names", () => {
    // The controller section finds a part by data-part and an act by data-act: each named in its
    // data (src/content/controller.ts) must be in the drawing.
    const data = readFileSync("src/content/controller.ts", "utf8");
    const component = readFileSync("src/components/sections/ControllerSection.vue", "utf8");
    const block = (name) =>
      data.slice(data.indexOf(`export const ${name}`), data.indexOf("};", data.indexOf(`export const ${name}`)));
    const values = (name) => [...block(name).matchAll(/:\s*"([\w-]+)"/g)].map((m) => m[1]);
    const parts = [
      ...values("padParts"),
      ...values("keyParts"),
      ...[...component.matchAll(/hit\("\w+", "([\w-]+)"\)/g)].map((m) => m[1]),
    ];
    const acts = [...values("keyActs"), ...values("padActs"), "home"];
    assert.ok(parts.length >= 9 && acts.length >= 10, "the script's lists were read");
    const start = page.indexOf("<svg", page.indexOf("data-pad"));
    const svg = page.slice(start, page.indexOf("</svg>", start));
    for (const part of parts)
      assert.match(svg, new RegExp(`class="b" data-act="\\w+" data-part="${part}"`), `the part ${part}`);
    for (const act of new Set(acts)) assert.match(svg, new RegExp(`data-act="${act}"`), `the act ${act}`);
    for (const [, part] of svg.matchAll(/data-for="([\w-]+)"/g))
      assert.match(svg, new RegExp(`data-part="${part}(-\\w+)?"`), `the line for ${part}`);
    assert.doesNotMatch(svg, /PS5|PlayStation|Sony|inkscape|sodipodi/i);
  });
});

describe("in a browser", { skip: chrome ? false : "no Chrome on this machine" }, () => {
  let site, browser;
  before(async () => {
    site = await serve("dist");
    browser = await open();
  });
  after(() => {
    browser?.close();
    site?.close();
  });

  it("shows Back to top a screen down, and it takes the page to the top", async () => {
    await browser.load(site.url, { width: 390, ua: ANDROID });
    const shown = () => browser.run(`return getComputedStyle(document.querySelector('[data-back-to-top]')).visibility`);
    assert.equal(await shown(), "hidden", "hidden at the top");
    await browser.run(
      `scrollTo(0, innerHeight * 2); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))`,
    );
    assert.equal(await shown(), "visible", "shown a screen down");
    await browser.run(
      `document.querySelector('[data-back-to-top]').click(); await new Promise((r) => setTimeout(r, 50))`,
    );
    assert.equal(await browser.run(`return scrollY`), 0, "at the top (reduced motion: no animation)");
  });

  it("switches the launcher's tabs on a phone", async () => {
    await browser.load(site.url, { width: 390, ua: ANDROID });
    const shown = () =>
      browser.run(
        `return [...document.querySelectorAll('[role=tab]')].map((t) => !document.getElementById(t.getAttribute('aria-controls')).hidden)`,
      );
    assert.deepEqual(await shown(), [true, false], "Download first on a phone");
    await browser.click("[role=tab]:nth-child(2)");
    await sleep(100);
    assert.deepEqual(await shown(), [false, true]);
    await browser.click("[role=tab]:nth-child(1)");
    await sleep(100);
    assert.deepEqual(await shown(), [true, false]);
    // The arrow keys move along the tabs, and the panel follows.
    await browser.run(
      `document.querySelector('[role=tab]').focus(); document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))`,
    );
    await sleep(100);
    assert.deepEqual(await shown(), [false, true]);
    assert.equal(await browser.run(`return document.activeElement.textContent.trim()`), "Linux terminal");
  });

  it("shows the terminal first on Linux, and the download for the visitor's system", async () => {
    await browser.load(site.url);
    const state = () =>
      browser.run(`return [document.querySelector('[role=tab][aria-selected=true]').textContent.trim(),
      document.querySelector('[data-for-you]').textContent.trim(), document.querySelector('[data-for-you]').href]`);
    assert.deepEqual(await state(), [
      "Linux terminal",
      "Download for Linux (AppImage)",
      "https://github.com/MarahHQ/marah-launcher/releases/latest/download/Marah-Launcher-x86_64.AppImage",
    ]);
    await browser.load(site.url, { width: 390, ua: ANDROID });
    assert.deepEqual((await state()).slice(0, 2), ["Download", "Choose your system"], "a phone keeps the choice");
  });

  it("opens the package panel in place, one distro at a time", async () => {
    await browser.load(site.url);
    const state = () =>
      browser.run(`const r = document.querySelector('#repos');
      return { panel: r.classList.contains('open'), height: Math.round(r.getBoundingClientRect().height), hash: location.hash,
        open: [...r.querySelectorAll('[data-repo]')].map((i) => i.dataset.state === 'open') }`);
    assert.equal((await state()).height, 0, "closed at first");
    await browser.run(`document.querySelector('.repos-toggle').click()`);
    await sleep(300);
    let now = await state();
    assert.ok(now.panel && now.height > 200 && now.hash === "", JSON.stringify(now));
    assert.deepEqual(now.open, [true, false, false]);
    await browser.run(`document.querySelectorAll('.repo-head')[1].click()`);
    await sleep(100);
    assert.deepEqual((await state()).open, [false, true, false]);
    assert.equal(
      await browser.run(`return document.querySelector('.repos-toggle').getAttribute('aria-expanded')`),
      "true",
    );
  });

  it("copies a command and shows a tick", async () => {
    await browser.load(site.url);
    const copied = await browser.run(`document.querySelector('.repos-toggle').click();
      const b = document.querySelector('[data-copy=cmd-dnf]'); b.click(); await new Promise((r) => setTimeout(r, 200));
      return [b.classList.contains('done'), await navigator.clipboard.readText()]`);
    assert.equal(copied[0], true);
    assert.match(copied[1], /^sudo curl .*marah\.repo\nsudo dnf install marah-launcher$/);
  });

  it("lights the controller's button and its line for a key", async () => {
    await browser.load(site.url);
    const lit = await browser.run(`const p = document.querySelector('[data-pad]'); p.focus();
      p.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      await new Promise((r) => requestAnimationFrame(r));
      return [[...p.querySelectorAll('.b.on')].map((b) => b.dataset.part), [...p.querySelectorAll('.call.on')].map((c) => c.dataset.for),
        document.querySelector('[data-pad-say]').textContent]`);
    assert.deepEqual(lit[0], ["cross"]);
    assert.deepEqual(lit[1], ["cross"]);
    assert.match(lit[2], /Select/);
  });

  it("lights each part and its line for a real controller's buttons", async () => {
    await browser.load(site.url);
    // A pretend controller in the standard layout: one button down at a time, then the left stick.
    const lit =
      await browser.run(`const p = document.querySelector('[data-pad]'); p.scrollIntoView({ block: 'center' });
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      let down = -1, axes = [0, 0];
      navigator.getGamepads = () => [{ buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: i === down })), axes }];
      await wait(200);
      dispatchEvent(new Event('gamepadconnected'));
      const seen = () => [...p.querySelectorAll('.b.on')].map((b) => b.dataset.part).join() + ' ' + [...p.querySelectorAll('.call.on')].map((c) => c.dataset.for).join();
      const out = {};
      for (const i of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16]) {
        down = i; await wait(60); down = -1; await wait(60); out[i] = seen();
      }
      axes = [1, 0]; await wait(60); out.stick = seen();
      return out`);
    assert.deepEqual(lit, {
      0: "cross cross",
      1: "circle circle",
      2: "square square",
      3: "triangle triangle",
      4: "l1 l1",
      5: "r1 r1",
      6: "l2 l2",
      7: "r2 r2",
      8: "create create",
      9: "options options",
      12: "dpad-up dpad",
      13: "dpad-down dpad",
      14: "dpad-left dpad",
      15: "dpad-right dpad",
      16: "home home",
      stick: "ls ls",
    });
  });

  it("points each of the controller's lines at its own part", async () => {
    await browser.load(site.url);
    // The lines don't take the pointer, so the element under each line's dot is the drawing's.
    const under =
      await browser.run(`const p = document.querySelector('[data-pad]'); p.scrollIntoView({ block: 'center' });
      const svg = p.querySelector('svg');
      return [...p.querySelectorAll('.call')].map((c) => {
        const dot = c.querySelector('circle');
        const at = new DOMPoint(dot.cx.baseVal.value, dot.cy.baseVal.value).matrixTransform(svg.getScreenCTM());
        const part = document.elementFromPoint(at.x, at.y)?.closest('[data-part]')?.dataset.part ?? 'nothing';
        return c.dataset.for + ' ' + part.replace(/^dpad-.*/, 'dpad');
      })`);
    assert.ok(under.length >= 13, under.join());
    for (const pair of under) assert.equal(pair.split(" ")[1], pair.split(" ")[0], `the line for ${pair}`);
  });

  it("has no brand mark in the controller's middle", async () => {
    await browser.load(site.url);
    // The drawing's source had a brand logo between the speaker and the mute button. Only the
    // home button may sit there now: any other shape in that gap is a leftover.
    const there = await browser.run(`const p = document.querySelector('[data-pad]');
      const dots = p.querySelector('.speaker').getBBox(), mute = p.querySelector('.mute').getBBox();
      const gap = { x: dots.x, y: dots.y + dots.height, right: dots.x + dots.width, bottom: mute.y };
      return [...p.querySelectorAll('.body :is(path, circle, rect, polygon, ellipse, use, text, image)')].filter((e) => {
        const b = e.getBBox();
        const meets = b.x < gap.right && b.x + b.width > gap.x && b.y < gap.bottom && b.y + b.height > gap.y;
        const around = b.x <= gap.x && b.x + b.width >= gap.right && b.y <= gap.y && b.y + b.height >= gap.bottom;
        return meets && !around;
      }).map((e) => e.closest('[data-part]')?.dataset.part ?? e.getAttribute('class'))`);
    assert.deepEqual(there, ["home"]);
  });

  it("opens and closes the menu on a phone", async () => {
    await browser.load(site.url, { width: 390, ua: ANDROID });
    // The menu's panel exists only while it is open; the header's own links are folded away.
    const shown = () =>
      browser.run(`const n = document.querySelector('#menu'); if (!n) return false; const r = n.getBoundingClientRect();
      return getComputedStyle(n).visibility !== 'hidden' && r.right > 0 && r.left < innerWidth && r.width > 0`);
    assert.equal(await shown(), false, "folded at first");
    assert.equal(
      await browser.run(`return document.querySelector('#nav').getBoundingClientRect().width`),
      0,
      "the header's links are folded",
    );
    await browser.click(".menu");
    await sleep(500);
    assert.equal(await shown(), true);
    assert.equal(
      await browser.run(`return document.activeElement.textContent.trim()`),
      "Get it",
      "the focus moves into the menu",
    );
    assert.equal(await browser.run(`return document.querySelector('.menu').getAttribute('aria-expanded')`), "true");
    assert.equal(
      await browser.run(`return getComputedStyle(document.body).overflow`),
      "hidden",
      "the page doesn't scroll behind it",
    );
    await browser.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    });
    await browser.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    });
    await sleep(500);
    assert.equal(await shown(), false, "Escape closes it");
    assert.ok(
      await browser.run(`return document.activeElement.classList.contains('menu')`),
      "the focus goes back to the menu button",
    );
    await browser.click(".menu");
    await sleep(500);
    await browser.click(null, { x: 20, y: 400 });
    await sleep(500);
    assert.equal(await shown(), false, "the dim page closes it");
    await browser.click(".menu");
    await sleep(500);
    await browser.click(".nav-close");
    await sleep(500);
    assert.equal(await shown(), false, "its close button closes it");
    await browser.click(".menu");
    await sleep(500);
    await browser.click("#menu a[href='#faq']");
    await sleep(800);
    assert.equal(await shown(), false, "a link closes it");
    const there = await browser.run(
      `return [location.hash, Math.round(document.querySelector('#faq').getBoundingClientRect().top)]`,
    );
    assert.equal(there[0], "#faq");
    assert.ok(there[1] >= 0 && there[1] < 200, `and the page goes to its section: ${there[1]}`);
  });

  it("doesn't scroll sideways on a phone, with every panel open", async () => {
    await browser.load(site.url, { width: 390, ua: ANDROID });
    // One answer at a time, as a visitor opens them: each click reads the state the last one left.
    const opened = await browser.run(`document.querySelector('.repos-toggle').click();
      for (const b of document.querySelectorAll('.qa-head')) { b.click(); await new Promise((r) => requestAnimationFrame(r)); }
      await new Promise((r) => setTimeout(r, 300));
      return [...document.querySelectorAll('[data-qa]')].filter((q) => q.dataset.state === 'open').length`);
    assert.equal(opened, 7, "every answer is open");
    const wide = await browser.run(`
      const visible = (e) => getComputedStyle(e).visibility !== 'hidden';
      return { scroll: document.scrollingElement.scrollWidth - innerWidth,
        past: [...document.querySelectorAll('body *')].filter((e) => visible(e) && e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.gamepad, pre, .overflow-x-auto'))
          .map((e) => e.tagName + '.' + (e.getAttribute('class') ?? '').split(' ')[0]).slice(0, 5) }`);
    assert.deepEqual(wide, { scroll: 0, past: [] });
  });

  it("slides each answer open and shut on its own", async () => {
    await browser.load(site.url);
    const state = () =>
      browser.run(`return [...document.querySelectorAll('[data-qa]')].map((q) =>
      [q.dataset.state === 'open', Math.round(q.querySelector('[data-slot=accordion-content]').getBoundingClientRect().height) > 0, q.querySelector('.qa-head').getAttribute('aria-expanded')])`);
    const start = await state();
    assert.ok(
      start.length >= 5 && start.every(([open, shown, expanded]) => !open && !shown && expanded === "false"),
      "all closed",
    );
    await browser.click("[data-qa]:nth-child(2) .qa-head");
    await browser.click("[data-qa]:nth-child(4) .qa-head");
    await sleep(500);
    const now = await state();
    assert.deepEqual(now.map(([open]) => open).slice(0, 4), [false, true, false, true], "two open at once");
    assert.ok(now[1][1] && now[3][1], "their answers show");
  });

  it("makes the header a thin bar once the page scrolls", async () => {
    await browser.load(site.url);
    const header = () =>
      browser.run(`const h = document.querySelector('.site-header');
      return { top: document.documentElement.classList.contains('hdr-top'), height: Math.round(h.getBoundingClientRect().height),
        border: getComputedStyle(h).borderBottomColor }`);
    const top = await header();
    assert.equal(top.top, true);
    assert.equal(top.border, "rgba(0, 0, 0, 0)", "no border at the top");
    await browser.run(`scrollTo({ top: 1500, behavior: 'instant' })`);
    await sleep(500);
    const down = await header();
    assert.equal(down.top, false);
    assert.ok(down.height < top.height, `thinner: ${top.height} → ${down.height}`);
    assert.notEqual(down.border, "rgba(0, 0, 0, 0)");
  });

  it("fits the header's bar on a phone, at the top and as the thin bar, under a notch", async () => {
    // A phone's notch or status bar: 47 px at the top. Chrome without the override still gets
    // the insets through the page's own --safe-* properties.
    const notch = await browser.send("Emulation.setSafeAreaInsetsOverride", {
      insets: { top: 47, left: 0, right: 0, bottom: 34 },
    });
    try {
      for (const [width, height] of [
        [390, 844],
        [360, 780],
        [320, 640],
      ]) {
        await browser.send("Emulation.setUserAgentOverride", { userAgent: ANDROID });
        await browser.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 3, mobile: true });
        await browser.send("Page.navigate", { url: site.url });
        await sleep(1500);
        if (notch.error) await browser.run(`document.documentElement.style.setProperty("--safe-top", "47px")`);
        for (const scrolled of [false, true]) {
          if (scrolled)
            await browser.run(
              `document.querySelector("[data-demo]").scrollIntoView({ block: "center", behavior: "instant" })`,
            );
          await sleep(500);
          const bar = await browser.run(`const h = document.querySelector(".site-header"), brand = h.querySelector("a");
            // The lines of the brand's text that shows; a part only for screen readers doesn't count.
            const texts = document.createTreeWalker(brand, NodeFilter.SHOW_TEXT), lines = new Set();
            while (texts.nextNode()) {
              if (getComputedStyle(texts.currentNode.parentElement).position === "absolute") continue;
              const range = document.createRange(); range.selectNodeContents(texts.currentNode);
              [...range.getClientRects()].filter((r) => r.width > 0).forEach((r) => lines.add(Math.round(r.top + r.height / 2)));
            }
            // The bar's parts that show: the brand, the buttons. The folded menu is a panel of its own.
            const parts = [...h.querySelector(".wrap").children].filter((e) => e.id !== "nav" && e.getBoundingClientRect().width > 0).map((e) => e.getBoundingClientRect());
            const box = h.getBoundingClientRect();
            return { scrolled: document.documentElement.classList.contains("hdr-scrolled"), lines: lines.size, name: brand.textContent.replace(/\\s+/g, " ").trim(),
              oneRow: Math.max(...parts.map((r) => r.top)) < Math.min(...parts.map((r) => r.bottom)),
              inside: parts.every((r) => r.top >= box.top + 47 && r.bottom <= box.bottom && r.left >= 0 && r.right <= innerWidth),
              headerTop: Math.round(box.top) }`);
          assert.deepEqual(
            bar,
            { scrolled, lines: 1, name: "Marah Launcher", oneRow: true, inside: true, headerTop: 0 },
            `${width} px, ${scrolled ? "scrolled" : "at the top"}`,
          );
        }
      }
      await browser.run(`document.querySelector(".menu").click()`);
      await sleep(500);
      const menu = await browser.run(`const n = document.querySelector("#menu"), c = n.querySelector(".nav-close");
        return [n.querySelector(".nav-title").getBoundingClientRect().top >= 47, c.getBoundingClientRect().top >= 47]`);
      assert.deepEqual(menu, [true, true], "the menu's title and close button sit below the notch");
    } finally {
      if (!notch.error) await browser.send("Emulation.setSafeAreaInsetsOverride", { insets: {} });
    }
  });

  it("keeps the header's links on one row from a tablet to a desktop", async () => {
    for (const width of [961, 1100, 1201, 1280, 1440]) {
      await browser.load(site.url, { width });
      for (const scrolled of [false, true]) {
        if (scrolled) await browser.run(`scrollTo({ top: 1500, behavior: "instant" })`);
        await sleep(500);
        const rows = await browser.run(`const h = document.querySelector(".site-header");
          const parts = [...h.querySelectorAll(".wrap > a, #nav > .nav-link, .wrap > div > *")].filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.getBoundingClientRect());
          return [Math.max(...parts.map((r) => r.top)) < Math.min(...parts.map((r) => r.bottom)), parts.every((r) => r.bottom <= h.getBoundingClientRect().bottom)]`);
        assert.deepEqual(rows, [true, true], `${width} px, ${scrolled ? "scrolled" : "at the top"}`);
      }
    }
  });

  it("leaves the switch, GitHub and Download to the menu while the menu is there", async () => {
    for (const [width, shown] of [
      [390, 0],
      [800, 0],
      [960, 0],
      [961, 3],
      [1440, 3],
    ]) {
      await browser.load(site.url, { width });
      const count = await browser.run(
        `return [...document.querySelectorAll(".site-header .wrap > div > *")].filter((e) => e.getClientRects().length).length`,
      );
      assert.equal(count, shown, `${width} px`);
    }
  });

  it("copies the example game file", async () => {
    await browser.load(site.url);
    const text = await browser.run(`document.querySelector('[data-copy=add-game-json]').click();
      await new Promise((r) => setTimeout(r, 200)); return navigator.clipboard.readText()`);
    const file = JSON.parse(text);
    assert.equal(file.format, 1, "a game file without format 1 is skipped");
    assert.ok(file.starts.length && file.art.cover.startsWith("launcher_art/"));
  });

  // The theme tests share the browser's storage and settings with the rest: each one puts them back.
  async function fresh({ scheme = "dark", blockScript = false, noScript = false, theme = null, path = "" } = {}) {
    await browser.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
    await browser.send("Network.enable");
    await browser.send("Network.setBlockedURLs", { urls: blockScript ? ["*/_app/*.js"] : [] });
    await browser.load(site.url);
    await browser.run(`localStorage.clear(); ${theme ? `localStorage.setItem("marah-theme", "${theme}")` : ""}`);
    // A visitor with JavaScript turned off: no script of the page runs, not even the head script.
    await browser.send("Emulation.setScriptExecutionDisabled", { value: noScript });
    await browser.load(site.url + path);
  }
  async function reset() {
    await browser.send("Emulation.setScriptExecutionDisabled", { value: false });
    await browser.run(`localStorage.clear()`);
    await browser.send("Network.setBlockedURLs", { urls: [] });
    await browser.send("Emulation.setEmulatedMedia", { features: [] });
  }
  const theme = () => browser.run(`return document.documentElement.dataset.theme`);
  const background = () =>
    browser.run(`return getComputedStyle(document.documentElement).getPropertyValue("--background").trim()`);

  it("switches to the light theme and keeps the choice", async () => {
    try {
      await fresh();
      assert.equal(await theme(), "dark");
      const label = () => browser.run(`return document.querySelector(".theme-switch").getAttribute("aria-label")`);
      assert.equal(await label(), "Switch to light theme");
      await browser.run(`document.querySelector(".theme-switch").click()`);
      assert.equal(await theme(), "light");
      assert.equal(await label(), "Switch to dark theme");
      assert.equal(await browser.run(`return localStorage.getItem("marah-theme")`), "light");
      assert.equal(await browser.run(`return document.querySelector('meta[name="theme-color"]').content`), "#f2f6fa");
      await browser.load(site.url);
      assert.equal(await theme(), "light", "kept after a reload");
      assert.equal(await label(), "Switch to dark theme", "and the switch says so");
      await browser.load(site.url, { width: 390, ua: ANDROID });
      await browser.click(".menu");
      await sleep(500);
      // The theme, Download and GitHub: icon buttons on one row, named for a screen reader.
      const extras = await browser.run(`const b = [...document.querySelectorAll("#menu .nav-extra > *")];
        return { count: b.length, oneRow: new Set(b.map((e) => Math.round(e.getBoundingClientRect().top))).size === 1,
          noWords: b.every((e) => e.textContent.trim() === ""), labels: b.map((e) => e.getAttribute("aria-label")) }`);
      assert.deepEqual(extras, {
        count: 3,
        oneRow: true,
        noWords: true,
        labels: ["Switch to dark theme", "Download Marah Launcher", "MarahHQ on GitHub"],
      });
      const menuLabel = () =>
        browser.run(`return document.querySelector("#menu [data-theme-switch]").getAttribute("aria-label")`);
      assert.equal(await menuLabel(), "Switch to dark theme");
      await browser.click("#menu [data-theme-switch]");
      assert.equal(await theme(), "dark", "the menu's switch works too");
      assert.equal(await menuLabel(), "Switch to light theme");
    } finally {
      await reset();
    }
  });

  it("follows the system's setting until the visitor chooses", async () => {
    try {
      await fresh({ scheme: "light" });
      assert.equal(await theme(), "light", "no choice: the system's light");
      await browser.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
      await sleep(100);
      assert.equal(await theme(), "dark", "a change of the system's setting follows");
      await fresh({ scheme: "light", theme: "dark" });
      assert.equal(await theme(), "dark", "the visitor's dark wins over the system's light");
      assert.equal(await background(), "#0d1926", "and the page is dark, not only its data-theme");
      await fresh({ scheme: "dark", theme: "light" });
      assert.equal(await background(), "#f2f6fa", "the visitor's light wins over the system's dark");
    } finally {
      await reset();
    }
  });

  it("sets the theme before the first paint, without the app's script", async () => {
    try {
      // With the bundled script blocked, only the head script can set the theme, and it runs
      // before the body exists.
      await fresh({ blockScript: true, theme: "light" });
      assert.equal(await browser.run(`return window.marahReady === undefined`), true, "the app didn't run");
      assert.equal(await theme(), "light");
      assert.equal(await background(), "#f2f6fa");
      assert.equal(await browser.run(`return getComputedStyle(document.body).color`), "rgb(13, 25, 38)");
    } finally {
      await reset();
    }
  });

  it("follows the system's setting with JavaScript off, and hides the theme switches", async () => {
    try {
      await fresh({ scheme: "light", noScript: true, theme: "dark" });
      assert.equal(await theme(), undefined, "no script ran");
      assert.equal(await background(), "#f2f6fa", "the system's light, as no script reads the choice");
      const look = () =>
        browser.run(`const css = (sel) => getComputedStyle(document.querySelector(sel));
        return { body: getComputedStyle(document.body).color, scheme: getComputedStyle(document.documentElement).colorScheme,
          cmd: css(".cmd").getPropertyValue("--background").trim(), cta: css(".cta").borderTopColor,
          pad: css(".gamepad").getPropertyValue("--pad-line").trim(),
          switches: [...document.querySelectorAll("[data-theme-switch]")].map((b) => b.getClientRects().length) }`);
      assert.deepEqual(await look(), {
        body: "rgb(13, 25, 38)",
        scheme: "light",
        cmd: "#0d1926",
        cta: "rgb(10, 101, 160)",
        pad: "#0d1926",
        switches: [0],
      });
      await fresh({ scheme: "dark", noScript: true });
      assert.equal(await background(), "#0d1926", "the system's dark");
      assert.equal(await browser.run(`return getComputedStyle(document.documentElement).colorScheme`), "dark");
      await fresh({ scheme: "light", noScript: true, path: "no-such-page" });
      assert.equal(await background(), "#f2f6fa", "the 404 page too");
    } finally {
      await reset();
    }
  });

  it("keeps text and buttons readable in both themes (WCAG AA)", async () => {
    try {
      const pairs = [
        ["foreground", "background"],
        ["foreground", "card"],
        ["foreground", "muted"],
        ["foreground", "night"],
        ["muted-foreground", "background"],
        ["muted-foreground", "card"],
        ["muted-foreground", "card-hi"],
        ["muted-foreground", "muted"],
        ["muted-foreground", "night"],
        ["primary", "background"],
        ["primary", "card"],
        ["primary", "muted"],
        ["primary", "night"],
        ["foreground", "accent"],
        ["background", "primary"],
        ["background", "primary-hi"],
        ["background", "sky"], // the buttons' text on their gradient
      ];
      for (const scheme of ["dark", "light"]) {
        await fresh({ theme: scheme });
        const low = await browser.run(`const css = getComputedStyle(document.documentElement);
          // The minified CSS may write #ffffff as #fff.
          const long = (hex) => (hex.length === 4 ? "#" + [...hex.slice(1)].map((c) => c + c).join("") : hex);
          const lum = (short) => { const hex = long(short); const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
            .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
          const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
          const token = (name) => css.getPropertyValue("--" + name).trim();
          return ${JSON.stringify(pairs)}.map(([f, b]) => [f + " on " + b, token(f), token(b), ratio(token(f), token(b))]).filter((p) => !(p[3] >= 4.5))`);
        assert.deepEqual(low, [], `${scheme}: pairs under 4.5:1`);
      }
    } finally {
      await reset();
    }
  });

  it("answers Will it run? with the launcher's three sources", async () => {
    await browser.load(site.url);
    const cards = await browser.run(
      `return [...document.querySelectorAll("#will-it-run [data-run]")].map((c) => c.dataset.run)`,
    );
    assert.deepEqual(cards, ["community", "protondb", "this-pc"]);
    const shown = () =>
      browser.run(`return [...document.querySelectorAll("[data-pc-panel]")].filter((p) => !p.hidden)
      .map((p) => [p.dataset.pcPanel, [...p.querySelectorAll(".verdict")].map((v) => v.textContent.replace(/\\s+/g, " ").trim())])`);
    assert.deepEqual(await shown(), [["gaming", ["PS4 Should run well", "PS5 Should run well"]]]);
    await browser.run(`document.querySelector('[data-pc="laptop"]').click()`);
    assert.deepEqual(await shown(), [
      ["laptop", ["PS4 May run slowly · Integrated GPU", "PS5 May run slowly · Integrated GPU"]],
    ]);
    await browser.run(`document.querySelector('[data-pc="older"]').click()`);
    assert.deepEqual(await shown(), [
      ["older", ["PS4 Won't start · No AVX2 in the processor", "PS5 May run slowly · 4 GB GPU"]],
    ]);
    assert.match(
      await browser.run(`return document.querySelector('[data-pc-panel="older"] .hint').textContent`),
      /This PC can't run PS4 games: No AVX2 in the processor/,
    );
  });

  it("shows the Marah OS release's checksums", async () => {
    const digest = (c) => "sha256:" + c.repeat(64);
    const release = {
      tag: "v9.9.9",
      date: "2026-01-01T00:00:00Z",
      assets: {
        "marah-os-x86_64-9.9.9.iso.part-aa": 2e9,
        "marah-os-x86_64-9.9.9.iso.part-ab": 1e9,
        "marah-os-x86_64-9.9.9.iso.sha256": 92,
      },
      digests: {
        "marah-os-x86_64-9.9.9.iso.part-aa": digest("a"),
        "marah-os-x86_64-9.9.9.iso.part-ab": digest("b"),
        "marah-os-x86_64-9.9.9.iso.sha256": digest("c"),
      },
    };
    try {
      await browser.load(site.url);
      await browser.run(
        `localStorage.setItem("marah-release-marah-os", ${JSON.stringify(JSON.stringify({ at: Date.now(), release }))})`,
      );
      await browser.load(site.url);
      const sums = await browser.run(`const box = document.querySelector("#check-iso");
        return { link: box.querySelector("[data-os-sum-link]").href, names: [...box.querySelectorAll("[data-os-file]")].map((e) => e.textContent),
          shown: !box.querySelector("[data-os-sums]").hidden, hashes: [...box.querySelectorAll(".sum-hash")].map((e) => e.textContent) }`);
      assert.equal(
        sums.link,
        "https://github.com/MarahHQ/marah-os/releases/download/v9.9.9/marah-os-x86_64-9.9.9.iso.sha256",
      );
      assert.deepEqual(sums.names, [
        "marah-os-x86_64-9.9.9.iso.sha256",
        "marah-os-x86_64-9.9.9.iso.sha256",
        "marah-os-x86_64-9.9.9.iso",
      ]);
      assert.equal(sums.shown, true);
      assert.deepEqual(sums.hashes, ["a".repeat(64), "b".repeat(64)], "the parts' hashes, not the .sha256 file's own");
    } finally {
      await reset();
    }
  });

  it("links the release page when GitHub can't be read", async () => {
    await browser.load(site.url);
    const box = await browser.run(`const box = document.querySelector("#check-iso");
      return [box.querySelector("[data-os-sum-link]").href, box.querySelector("[data-os-sums]").hidden]`);
    assert.deepEqual(box, ["https://github.com/MarahHQ/marah-os/releases/latest", true]);
  });

  it("moves through the Home demo with the keys, the mouse and a tap", async () => {
    await browser.load(site.url);
    const state = () =>
      browser.run(`const cards = [...document.querySelectorAll(".demo-card")];
      return [cards.findIndex((c) => c.getAttribute("aria-selected") === "true"), document.querySelector("[data-demo-title]").textContent,
        document.querySelector("[data-demo-row]").getAttribute("aria-activedescendant")]`);
    assert.deepEqual(await state(), [0, "Mario Kart World", "demo-game-0"]);
    const key = (name) =>
      browser.run(`const row = document.querySelector("[data-demo-row]"); row.focus({ preventScroll: true });
      const event = new KeyboardEvent("keydown", { key: "${name}", bubbles: true, cancelable: true }); row.dispatchEvent(event);
      return event.defaultPrevented`);
    const before = await browser.run(`return scrollY`);
    assert.equal(await key("ArrowRight"), true, "the arrow doesn't scroll the page");
    assert.deepEqual(await state(), [1, "Hollow Knight: Silksong", "demo-game-1"]);
    await key("End");
    assert.equal((await state())[0], 7);
    await key("ArrowRight");
    assert.equal((await state())[0], 7, "it stops at the last card");
    assert.equal(await browser.run(`return scrollY`), before, "the page stayed put");
    await browser.run(
      `document.querySelector("#demo-game-0").dispatchEvent(new PointerEvent("pointerover", { pointerType: "mouse", bubbles: true }))`,
    );
    assert.equal((await state())[0], 0, "the mouse moves the focus");
    await browser.run(`document.querySelector("#demo-game-3").click()`);
    assert.equal((await state())[0], 3, "a tap moves the focus");
    assert.match(
      await browser.run(`return document.querySelector("#demo-game-3").textContent.replace(/\\s+/g, " ")`),
      /World of Goo 2 , PC, 937 MB, installed/,
    );
  });

  it("shows each game's cover in the Home demo", async () => {
    await browser.load(site.url);
    const covers =
      await browser.run(`document.querySelector("[data-demo]").scrollIntoView({ block: "center", behavior: "instant" });
      const images = [...document.querySelectorAll(".demo-card img")];
      await Promise.all(images.map((i) => i.decode().catch(() => {})));
      return images.map((i) => i.naturalWidth)`);
    assert.deepEqual(covers, Array(8).fill(360));
  });

  it("shows the demo's download in its top bar while it is on screen", async () => {
    await browser.load(site.url);
    const pill = () =>
      browser.run(`const p = document.querySelector("[data-demo-download]"); return [p.hidden, p.textContent.trim()]`);
    assert.equal((await pill())[0], true, "nothing downloads off screen");
    await browser.run(`document.querySelector("[data-demo]").scrollIntoView({ block: "center", behavior: "instant" })`);
    await sleep(2600);
    const [hidden, first] = await pill();
    assert.equal(hidden, false);
    assert.match(first, /^Hot Wheels Monster Trucks: Stunt Mayhem · \d+%$/);
    await sleep(1100);
    const [, later] = await pill();
    assert.ok(parseInt(later.split("· ")[1]) > parseInt(first.split("· ")[1]), `${first} → ${later}`);
  });

  it("keeps the Home demo hidden without the app's script", async () => {
    try {
      await fresh({ blockScript: true });
      assert.equal(await browser.run(`return document.querySelector("[data-demo-wrap]").hidden`), true);
    } finally {
      await reset();
    }
  });

  it("shows the 404 page for a missing address", async () => {
    await browser.load(`${site.url}no-such-page`);
    assert.match(await browser.run(`return document.querySelector('h1').textContent`), /isn't here/);
  });

  it("shows the 404 page in the visitor's theme, else the system's", async () => {
    try {
      await fresh({ scheme: "dark", theme: "light", path: "no-such-page" });
      assert.equal(await theme(), "light", "the visitor's light wins over the system's dark");
      assert.equal(await background(), "#f2f6fa");
      assert.equal(await browser.run(`return getComputedStyle(document.body).color`), "rgb(13, 25, 38)");
      assert.equal(await browser.run(`return document.querySelector('meta[name="theme-color"]').content`), "#f2f6fa");
      await fresh({ scheme: "light", path: "no-such-page" });
      assert.equal(await theme(), "light", "no choice: the system's light");
      await fresh({ scheme: "light", theme: "dark", path: "no-such-page" });
      assert.equal(await theme(), "dark", "the visitor's dark wins over the system's light");
      assert.equal(await background(), "#0d1926");
    } finally {
      await reset();
    }
  });

  it("reads in full with JavaScript off", async () => {
    try {
      await fresh({ noScript: true });
      await browser.send("Emulation.setDeviceMetricsOverride", {
        width: 390,
        height: 900,
        deviceScaleFactor: 1,
        mobile: true,
      });
      await sleep(300);
      const page =
        await browser.run(`const shows = (e) => !!e && e.getClientRects().length > 0 && e.getBoundingClientRect().height > 0;
        const all = (sel) => [...document.querySelectorAll(sel)];
        return {
          answers: all("[data-qa] [data-slot=accordion-content]").map(shows),
          panels: all("[role=tabpanel]").map(shows),
          pcs: all("[data-pc-panel]").map(shows),
          repos: shows(document.querySelector("#repos")),
          distros: all("[data-repo] [data-slot=accordion-content]").map(shows),
          links: all("#nav .nav-link").filter(shows).length,
          hidden: ["[role=tablist]", ".switcher", "[data-pc-switcher]", "[data-demo-wrap]", ".menu", "[data-copy]", "[data-theme-switch]"].filter((sel) => all(sel).some(shows)),
        }`);
      assert.deepEqual(page, {
        answers: Array(7).fill(true),
        panels: [true, true],
        pcs: [true, true, true],
        repos: true,
        distros: [true, true, true],
        links: 7,
        hidden: [],
      });
    } finally {
      await reset();
    }
  });

  it("loads without errors or warnings in the console", async () => {
    for (const [url, options] of [
      [site.url, {}],
      [site.url, { width: 390, ua: ANDROID }],
      [`${site.url}no-such-page`, {}],
      [`${site.url}deep/no-such-page`, {}],
    ]) {
      await browser.load(url, options);
      assert.deepEqual(browser.problems, [], url);
    }
  });

  it("shows every part at once when the visitor asks for less motion", async () => {
    // This browser asks for reduced motion: no part waits for the scroll to fade in.
    await browser.load(site.url);
    const hidden = await browser.run(`return [...document.querySelectorAll("[data-reveal], [data-stagger] > *")]
      .filter((e) => getComputedStyle(e).opacity !== "1").length`);
    assert.equal(hidden, 0);
  });

  it("switches the screenshots, one at a time", async () => {
    await browser.load(site.url);
    const state = () =>
      browser.run(`const s = document.querySelector('#screen');
      return [s.getAttribute('src'), s.alt, [...document.querySelectorAll('.switcher button')].map((b) => b.getAttribute('aria-pressed')),
        document.querySelector('.screen-next').classList.contains('show')]`);
    const first = await state();
    assert.equal(first[0], "/assets/screen-home.webp");
    assert.deepEqual(first[2], ["true", "false", "false", "false"]);
    for (const [i, file, words] of [
      [1, "screen-library", /^The Library/],
      [2, "screen-hub", /^A game's page/],
      [3, "screen-settings", /^The Settings screen/],
      [0, "screen-home", /home screen/],
    ]) {
      await browser.click(`.switcher button:nth-child(${i + 1})`);
      await sleep(800); // The swap's fade is 320 ms with reduced motion.
      const [src, alt, pressed, layer] = await state();
      assert.equal(src, `/assets/${file}.webp`);
      assert.match(alt, words);
      assert.deepEqual(
        pressed,
        [0, 1, 2, 3].map((n) => String(n === i)),
      );
      assert.equal(layer, false, "the layer hides once the picture has swapped");
    }
  });

  it("shows the launcher's latest release, its files' sizes and the download for the visitor's system", async () => {
    const release = {
      tag: "v8.8.8",
      date: "2026-02-03T00:00:00Z",
      assets: { "Marah-Launcher-x86_64.AppImage": 123e6, "marah-launcher-windows-x86_64-setup.exe": 2.5e9 },
      digests: {},
    };
    try {
      await browser.load(site.url);
      await browser.run(
        `localStorage.setItem("marah-release-marah-launcher", ${JSON.stringify(JSON.stringify({ at: Date.now(), release }))})`,
      );
      await browser.load(site.url);
      const shown =
        await browser.run(`return { lines: [...document.querySelectorAll('[data-release="launcher"]')].map((e) => e.textContent.trim()),
        sizes: Object.fromEntries([...document.querySelectorAll("[data-size]")].map((e) => [e.dataset.size, e.textContent.trim()])),
        mine: document.querySelector("[data-for-you]").textContent.trim() }`);
      assert.deepEqual(shown.lines, ["v8.8.8 · 3 Feb 2026", "v8.8.8 · 3 Feb 2026"]);
      assert.equal(shown.sizes["Marah-Launcher-x86_64.AppImage"], "123 MB");
      assert.equal(shown.sizes["marah-launcher-windows-x86_64-setup.exe"], "2.5 GB");
      assert.equal(
        shown.sizes["marah-launcher-macos-universal.dmg"],
        "",
        "no size for a file the release doesn't list",
      );
      assert.equal(shown.mine, "Download for Linux (AppImage) · 123 MB");
    } finally {
      await reset();
    }
  });

  it("gives the logo's gamepad a glow in the dark theme and a dark edge in the light theme", async () => {
    try {
      const filters = {};
      for (const scheme of ["dark", "light"]) {
        await fresh({ theme: scheme });
        filters[scheme] = await browser.run(
          `return [...document.querySelectorAll(".logo-mark")].map((e) => getComputedStyle(e).filter)`,
        );
      }
      assert.deepEqual(filters.dark, Array(2).fill("drop-shadow(rgba(130, 216, 245, 0.35) 0px 0px 10px)"));
      assert.deepEqual(
        filters.light,
        Array(2).fill("drop-shadow(rgb(13, 25, 38) 0px 0px 1px) drop-shadow(rgba(13, 25, 38, 0.35) 0px 2px 4px)"),
      );
    } finally {
      await reset();
    }
  });

  it("shows the keyboard focus on each tab panel", async () => {
    await browser.load(site.url, { width: 390, ua: ANDROID });
    await browser.run(`document.querySelector("[role=tab]").focus()`);
    await browser.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
    });
    await browser.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    const ring = await browser.run(
      `const e = document.activeElement; return [e.getAttribute("role"), getComputedStyle(e).outlineStyle, getComputedStyle(e).outlineWidth]`,
    );
    assert.deepEqual(ring, ["tabpanel", "solid", "3px"]);
  });
});

// The same page with motion on, as most visitors have it: the parts fade in as they come into
// view, and the menu and the answers slide.
describe("in a browser, with motion on", { skip: chrome ? false : "no Chrome on this machine" }, () => {
  let site, browser;
  before(async () => {
    site = await serve("dist");
    browser = await open({ reducedMotion: false });
  });
  after(() => {
    browser?.close();
    site?.close();
  });

  it("shows every part once the page has scrolled past it", async () => {
    await browser.load(site.url);
    const hiddenAtFirst = await browser.run(
      `return [...document.querySelectorAll("[data-reveal]")].filter((e) => getComputedStyle(e).opacity === "0").length`,
    );
    assert.ok(hiddenAtFirst > 5, "the parts below the screen wait to fade in");
    await browser.run(
      `for (let y = 0; y < document.scrollingElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }`,
    );
    await sleep(2500); // The last parts' fade: 0.7 s, after a stagger of up to 0.45 s.
    const hidden = await browser.run(`return [...document.querySelectorAll("[data-reveal], [data-stagger] > *")]
      .filter((e) => e.getClientRects().length && getComputedStyle(e).opacity !== "1") // A part laid out on the page, not one display: none hides (the keys' list on a desktop).
      .map((e) => e.tagName + "." + (e.getAttribute("class") ?? "").split(" ")[0] + " in #" + e.closest("section")?.id)`);
    assert.deepEqual(hidden, []);
  });

  it("slides the menu and an answer open and shut", async () => {
    await browser.load(site.url, { width: 390, ua: ANDROID });
    await browser.click(".menu");
    await sleep(600);
    assert.equal(await browser.run(`return !!document.querySelector("#menu")`), true);
    await browser.click(".nav-close");
    await sleep(800);
    assert.equal(await browser.run(`return document.querySelector("#menu")`), null, "gone once it has slid out");
    const answer = () =>
      browser.run(
        `return Math.round(document.querySelector("[data-qa] [data-slot=accordion-content]").getBoundingClientRect().height)`,
      );
    await browser.click("[data-qa] .qa-head");
    await sleep(600);
    assert.ok((await answer()) > 20, "open");
    await browser.click("[data-qa] .qa-head");
    await sleep(600);
    assert.equal(await answer(), 0, "shut");
  });
});
