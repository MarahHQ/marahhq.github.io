// The site's checks, on the built dist/ (npm run build first; npm run check does both).
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { after, before, describe, it } from "node:test";
import { ANDROID, chrome, open, serve } from "./browser.mjs";

const page = readFileSync("dist/index.html", "utf8");
// Astro puts the bundled stylesheet and script in dist/_astro/, with a hash in their names.
const linked = (html, ext) => [...html.matchAll(new RegExp(`"/_astro/([\\w.-]+\\.[\\w-]{8}\\.${ext})"`, "g"))].map((m) => m[1]);
const [css] = linked(page, "css");
const [js] = linked(page, "js");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("the build", () => {
  it("links the stylesheet and the script by their hashed names", () => {
    assert.ok(css && js, "the page links /_astro/<name>.<hash>.css and .js");
    assert.ok(existsSync(`dist/_astro/${css}`) && existsSync(`dist/_astro/${js}`));
    assert.deepEqual(linked(readFileSync("dist/404.html", "utf8"), "css"), [css]);
  });

  it("has no component class that is also a Tailwind utility", () => {
    // A component named like a utility gets the utility's style too: `.outline` once drew a
    // second border, and `.collapse` hid the panels.
    const source = readFileSync("src/styles/site.css", "utf8");
    const components = new Set([...source.matchAll(/\.([a-z][a-z0-9-]*)(?=[\s,.:{>\[)])/g)].map((m) => m[1]));
    const built = readFileSync(`dist/_astro/${css}`, "utf8");
    const utilities = built.slice(built.indexOf("@layer utilities"));
    // A utility's own rule starts right after a brace: `}.outline{` or `}.outline:hover{`. A state
    // variant like `[&.on]:border-ice` compiles to `.\[\&\.on\]\:border-ice.on`, which is no clash.
    const ownUtilities = new Set(["wrap", "eyebrow", "pill", "accent-text", "hint"]);
    const clashes = [...components].filter((name) => !ownUtilities.has(name) && new RegExp(`[{}]\\.${name}[{:,]`).test(utilities));
    assert.deepEqual(clashes, []);
  });
});

describe("in a browser", { skip: chrome ? false : "no Chrome on this machine" }, () => {
  let site, browser;
  before(async () => { site = await serve("dist"); browser = await open(); });
  after(() => { browser?.close(); site?.close(); });

  it("switches the launcher's tabs on a phone", async () => {
    await browser.load(site.url, { width: 390, ua: ANDROID });
    const shown = () => browser.run(`return [...document.querySelectorAll('[role=tab]')].map((t) => !document.getElementById(t.getAttribute('aria-controls')).hidden)`);
    assert.deepEqual(await shown(), [true, false], "Download first on a phone");
    await browser.run(`document.querySelector('#tab-terminal').click()`);
    assert.deepEqual(await shown(), [false, true]);
    await browser.run(`document.querySelector('#tab-download').click()`);
    assert.deepEqual(await shown(), [true, false]);
  });

  it("opens the package panel in place, one distro at a time", async () => {
    await browser.load(site.url);
    const state = () => browser.run(`const r = document.querySelector('#repos');
      return { panel: r.classList.contains('open'), height: Math.round(r.getBoundingClientRect().height), hash: location.hash,
        open: [...r.querySelectorAll('[data-repo]')].map((i) => i.classList.contains('open')) }`);
    assert.equal((await state()).height, 0, "closed at first");
    await browser.run(`document.querySelector('.repos-toggle').click()`);
    await sleep(300);
    let now = await state();
    assert.ok(now.panel && now.height > 200 && now.hash === "", JSON.stringify(now));
    assert.deepEqual(now.open, [true, false, false]);
    await browser.run(`document.querySelectorAll('.repo-head')[1].click()`);
    assert.deepEqual((await state()).open, [false, true, false]);
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
      return [[...p.querySelectorAll('.b.on')].map((b) => b.getAttribute('class')), [...p.querySelectorAll('.call.on')].map((c) => c.dataset.for),
        document.querySelector('[data-pad-say]').textContent]`);
    assert.deepEqual(lit[0], ["b fc crs on"]);
    assert.deepEqual(lit[1], ["crs"]);
    assert.match(lit[2], /Select/);
  });

  it("opens and closes the menu on a phone", async () => {
    await browser.load(site.url, { width: 390, ua: ANDROID });
    const shown = () => browser.run(`const n = document.querySelector('#nav'); const r = n.getBoundingClientRect();
      return getComputedStyle(n).visibility !== 'hidden' && r.right > 0 && r.left < innerWidth && r.width > 0`);
    assert.equal(await shown(), false, "folded at first");
    await browser.run(`document.querySelector('.menu').click()`);
    await sleep(500);
    assert.equal(await shown(), true);
    assert.equal(await browser.run(`return document.activeElement.textContent.trim()`), "Get it", "the focus moves into the menu");
    assert.equal(await browser.run(`return getComputedStyle(document.documentElement).overflow`), "hidden", "the page doesn't scroll behind it");
    await browser.run(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
    await sleep(500);
    assert.equal(await shown(), false, "Escape closes it");
    assert.ok(await browser.run(`return document.activeElement.classList.contains('menu')`), "the focus goes back to the menu button");
    await browser.run(`document.querySelector('.menu').click()`);
    await sleep(500);
    await browser.run(`document.querySelector('.nav-scrim').click()`);
    await sleep(500);
    assert.equal(await shown(), false, "the dim page closes it");
    await browser.run(`document.querySelector('.menu').click()`);
    await sleep(500);
    await browser.run(`document.querySelector('#nav a').click()`);
    await sleep(500);
    assert.equal(await shown(), false, "a link closes it");
  });

  it("doesn't scroll sideways on a phone, with every panel open", async () => {
    await browser.load(site.url, { width: 390, ua: ANDROID });
    const wide = await browser.run(`document.querySelector('.repos-toggle').click();
      document.querySelectorAll('.qa-head').forEach((b) => b.click());
      await new Promise((r) => setTimeout(r, 300));
      const visible = (e) => getComputedStyle(e).visibility !== 'hidden';
      return { scroll: document.scrollingElement.scrollWidth - innerWidth,
        past: [...document.querySelectorAll('body *')].filter((e) => visible(e) && e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.gamepad, pre, .overflow-x-auto'))
          .map((e) => e.tagName + '.' + (e.getAttribute('class') ?? '').split(' ')[0]).slice(0, 5) }`);
    assert.deepEqual(wide, { scroll: 0, past: [] });
  });

  it("slides each answer open and shut on its own", async () => {
    await browser.load(site.url);
    const state = () => browser.run(`return [...document.querySelectorAll('[data-qa]')].map((q) =>
      [q.classList.contains('open'), Math.round(q.querySelector('.fold').getBoundingClientRect().height) > 0, q.querySelector('.qa-head').getAttribute('aria-expanded')])`);
    const start = await state();
    assert.ok(start.length >= 5 && start.every(([open, shown, expanded]) => !open && !shown && expanded === "false"), "all closed");
    await browser.run(`document.querySelectorAll('.qa-head')[1].click(); document.querySelectorAll('.qa-head')[3].click()`);
    await sleep(500);
    const now = await state();
    assert.deepEqual(now.map(([open]) => open).slice(0, 4), [false, true, false, true], "two open at once");
    assert.ok(now[1][1] && now[3][1], "their answers show");
  });

  it("makes the header a thin bar once the page scrolls", async () => {
    await browser.load(site.url);
    const header = () => browser.run(`const h = document.querySelector('.site-header');
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
    const notch = await browser.send("Emulation.setSafeAreaInsetsOverride", { insets: { top: 47, left: 0, right: 0, bottom: 34 } });
    try {
      for (const [width, height] of [[390, 844], [360, 780], [320, 640]]) {
        await browser.send("Emulation.setUserAgentOverride", { userAgent: ANDROID });
        await browser.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 3, mobile: true });
        await browser.send("Page.navigate", { url: site.url });
        await sleep(1500);
        if (notch.error) await browser.run(`document.documentElement.style.setProperty("--safe-top", "47px")`);
        for (const scrolled of [false, true]) {
          if (scrolled) await browser.run(`document.querySelector("[data-demo]").scrollIntoView({ block: "center", behavior: "instant" })`);
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
          assert.deepEqual(bar, { scrolled, lines: 1, name: "Marah Launcher", oneRow: true, inside: true, headerTop: 0 }, `${width} px, ${scrolled ? "scrolled" : "at the top"}`);
        }
      }
      await browser.run(`document.querySelector(".menu").click()`);
      await sleep(500);
      const menu = await browser.run(`const n = document.querySelector("#nav"), c = n.querySelector(".nav-close");
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

  it("copies the example game file", async () => {
    await browser.load(site.url);
    const text = await browser.run(`document.querySelector('[data-copy=add-game-json]').click();
      await new Promise((r) => setTimeout(r, 200)); return navigator.clipboard.readText()`);
    const file = JSON.parse(text);
    assert.equal(file.format, 1, "a game file without format 1 is skipped");
    assert.ok(file.starts.length && file.art.cover.startsWith("launcher_art/"));
  });

  // The theme tests share the browser's storage and settings with the rest: each one puts them back.
  async function fresh({ scheme = "dark", blockScript = false, theme = null } = {}) {
    await browser.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
    await browser.send("Network.enable");
    await browser.send("Network.setBlockedURLs", { urls: blockScript ? ["*/_astro/*.js"] : [] });
    await browser.load(site.url);
    await browser.run(`localStorage.clear(); ${theme ? `localStorage.setItem("marah-theme", "${theme}")` : ""}`);
    await browser.load(site.url);
  }
  async function reset() {
    await browser.run(`localStorage.clear()`);
    await browser.send("Network.setBlockedURLs", { urls: [] });
    await browser.send("Emulation.setEmulatedMedia", { features: [] });
  }
  const theme = () => browser.run(`return document.documentElement.dataset.theme`);
  const background = () => browser.run(`return getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim()`);

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
      await browser.run(`document.querySelector("[data-theme-label]").closest("button").click()`);
      assert.equal(await theme(), "dark", "the menu's switch works too");
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
    } finally {
      await reset();
    }
  });

  it("sets the theme before the first paint, without site.js", async () => {
    try {
      // With the bundled script blocked, only the head script can set the theme, and it runs
      // before the body exists.
      await fresh({ blockScript: true, theme: "light" });
      assert.equal(await browser.run(`return window.marahReady === undefined`), true, "site.js didn't run");
      assert.equal(await theme(), "light");
      assert.equal(await background(), "#f2f6fa");
      assert.equal(await browser.run(`return getComputedStyle(document.body).color`), "rgb(13, 25, 38)");
    } finally {
      await reset();
    }
  });

  it("keeps text and buttons readable in both themes (WCAG AA)", async () => {
    try {
      const pairs = [
        ["text", "bg"], ["text", "panel"], ["text", "deep"], ["text", "night"],
        ["muted", "bg"], ["muted", "panel"], ["muted", "panel-hi"], ["muted", "deep"], ["muted", "night"],
        ["ice", "bg"], ["ice", "panel"], ["ice", "deep"], ["ice", "night"], ["text", "panel-lit"],
        ["bg", "ice"], ["bg", "ice-hi"], ["bg", "sky"], // the buttons' text on their gradient
      ];
      for (const scheme of ["dark", "light"]) {
        await fresh({ theme: scheme });
        const low = await browser.run(`const css = getComputedStyle(document.documentElement);
          // The minified CSS may write #ffffff as #fff.
          const long = (hex) => (hex.length === 4 ? "#" + [...hex.slice(1)].map((c) => c + c).join("") : hex);
          const lum = (short) => { const hex = long(short); const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
            .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
          const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
          const token = (name) => css.getPropertyValue("--color-" + name).trim();
          return ${JSON.stringify(pairs)}.map(([f, b]) => [f + " on " + b, token(f), token(b), ratio(token(f), token(b))]).filter((p) => !(p[3] >= 4.5))`);
        assert.deepEqual(low, [], `${scheme}: pairs under 4.5:1`);
      }
    } finally {
      await reset();
    }
  });

  it("answers Will it run? with the launcher's three sources", async () => {
    await browser.load(site.url);
    const cards = await browser.run(`return [...document.querySelectorAll("#will-it-run [data-run]")].map((c) => c.dataset.run)`);
    assert.deepEqual(cards, ["community", "protondb", "this-pc"]);
    const shown = () => browser.run(`return [...document.querySelectorAll("[data-pc-panel]")].filter((p) => !p.hidden)
      .map((p) => [p.dataset.pcPanel, [...p.querySelectorAll(".verdict")].map((v) => v.textContent.replace(/\\s+/g, " ").trim())])`);
    assert.deepEqual(await shown(), [["gaming", ["PS4 Should run well", "PS5 Should run well"]]]);
    await browser.run(`document.querySelector('[data-pc="laptop"]').click()`);
    assert.deepEqual(await shown(), [["laptop", ["PS4 May run slowly · Integrated GPU", "PS5 May run slowly · Integrated GPU"]]]);
    await browser.run(`document.querySelector('[data-pc="older"]').click()`);
    assert.deepEqual(await shown(), [["older", ["PS4 Won't start · No AVX2 in the processor", "PS5 May run slowly · 4 GB GPU"]]]);
    assert.match(await browser.run(`return document.querySelector('[data-pc-panel="older"] .hint').textContent`),
      /This PC can't run PS4 games: No AVX2 in the processor/);
  });

  it("shows the Marah OS release's checksums", async () => {
    const digest = (c) => "sha256:" + c.repeat(64);
    const release = { tag: "v9.9.9", date: "2026-01-01T00:00:00Z",
      assets: { "marah-os-x86_64-9.9.9.iso.part-aa": 2e9, "marah-os-x86_64-9.9.9.iso.part-ab": 1e9, "marah-os-x86_64-9.9.9.iso.sha256": 92 },
      digests: { "marah-os-x86_64-9.9.9.iso.part-aa": digest("a"), "marah-os-x86_64-9.9.9.iso.part-ab": digest("b"), "marah-os-x86_64-9.9.9.iso.sha256": digest("c") } };
    try {
      await browser.load(site.url);
      await browser.run(`localStorage.setItem("marah-release-marah-os", ${JSON.stringify(JSON.stringify({ at: Date.now(), release }))})`);
      await browser.load(site.url);
      const sums = await browser.run(`const box = document.querySelector("#check-iso");
        return { link: box.querySelector("[data-os-sum-link]").href, names: [...box.querySelectorAll("[data-os-file]")].map((e) => e.textContent),
          shown: !box.querySelector("[data-os-sums]").hidden, hashes: [...box.querySelectorAll(".sum-hash")].map((e) => e.textContent) }`);
      assert.equal(sums.link, "https://github.com/MarahHQ/marah-os/releases/download/v9.9.9/marah-os-x86_64-9.9.9.iso.sha256");
      assert.deepEqual(sums.names, ["marah-os-x86_64-9.9.9.iso.sha256", "marah-os-x86_64-9.9.9.iso.sha256", "marah-os-x86_64-9.9.9.iso"]);
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
    const state = () => browser.run(`const cards = [...document.querySelectorAll(".demo-card")];
      return [cards.findIndex((c) => c.getAttribute("aria-selected") === "true"), document.querySelector("[data-demo-title]").textContent,
        document.querySelector("[data-demo-row]").getAttribute("aria-activedescendant")]`);
    assert.deepEqual(await state(), [0, "Mario Kart World", "demo-game-0"]);
    const key = (name) => browser.run(`const row = document.querySelector("[data-demo-row]"); row.focus({ preventScroll: true });
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
    await browser.run(`document.querySelector("#demo-game-0").dispatchEvent(new PointerEvent("pointerover", { pointerType: "mouse", bubbles: true }))`);
    assert.equal((await state())[0], 0, "the mouse moves the focus");
    await browser.run(`document.querySelector("#demo-game-3").click()`);
    assert.equal((await state())[0], 3, "a tap moves the focus");
    assert.match(await browser.run(`return document.querySelector("#demo-game-3").textContent.replace(/\\s+/g, " ")`), /World of Goo 2 , PC, 937 MB, installed/);
  });

  it("shows each game's cover in the Home demo", async () => {
    await browser.load(site.url);
    const covers = await browser.run(`document.querySelector("[data-demo]").scrollIntoView({ block: "center", behavior: "instant" });
      const images = [...document.querySelectorAll(".demo-card img")];
      await Promise.all(images.map((i) => i.decode().catch(() => {})));
      return images.map((i) => i.naturalWidth)`);
    assert.deepEqual(covers, Array(8).fill(360));
  });

  it("shows the demo's download in its top bar while it is on screen", async () => {
    await browser.load(site.url);
    const pill = () => browser.run(`const p = document.querySelector("[data-demo-download]"); return [p.hidden, p.textContent.trim()]`);
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

  it("keeps the Home demo hidden without site.js", async () => {
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
});
