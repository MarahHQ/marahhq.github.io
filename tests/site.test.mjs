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

  it("copies the example game file", async () => {
    await browser.load(site.url);
    const text = await browser.run(`document.querySelector('[data-copy=add-game-json]').click();
      await new Promise((r) => setTimeout(r, 200)); return navigator.clipboard.readText()`);
    const file = JSON.parse(text);
    assert.equal(file.format, 1, "a game file without format 1 is skipped");
    assert.ok(file.starts.length && file.art.cover.startsWith("launcher_art/"));
  });

  it("shows the 404 page for a missing address", async () => {
    await browser.load(`${site.url}no-such-page`);
    assert.match(await browser.run(`return document.querySelector('h1').textContent`), /isn't here/);
  });
});
