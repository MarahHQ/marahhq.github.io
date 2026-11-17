// The site's checks, on the built dist/ (npm run build first; npm run check does both).
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { after, before, describe, it } from "node:test";
import { ANDROID, chrome, open, serve } from "./browser.mjs";

const page = readFileSync("dist/index.html", "utf8");
const css = readdirSync("dist/assets").find((f) => /^site\.[0-9a-f]{8}\.css$/.test(f));
const js = readdirSync("dist/assets").find((f) => /^site\.[0-9a-f]{8}\.js$/.test(f));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("the build", () => {
  it("links the stylesheet and the script by their hashed names", () => {
    assert.ok(css && js, "dist/assets has site.<hash>.css and site.<hash>.js");
    assert.ok(page.includes(`assets/${css}`) && page.includes(`assets/${js}`));
    assert.ok(readFileSync("dist/404.html", "utf8").includes(`/assets/${css}`));
  });

  it("has no component class that is also a Tailwind utility", () => {
    // A component named like a utility gets the utility's style too: `.outline` once drew a
    // second border, and `.collapse` hid the panels.
    const source = readFileSync("src/site.css", "utf8");
    const components = new Set([...source.matchAll(/\.([a-z][a-z0-9-]*)(?=[\s,.:{>\[)])/g)].map((m) => m[1]));
    const built = readFileSync(`dist/assets/${css}`, "utf8");
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
    assert.equal(await browser.run(`return document.activeElement.textContent`), "Get it", "the focus moves into the menu");
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
      document.querySelectorAll('#faq details').forEach((d) => (d.open = true));
      await new Promise((r) => setTimeout(r, 300));
      const visible = (e) => getComputedStyle(e).visibility !== 'hidden';
      return { scroll: document.scrollingElement.scrollWidth - innerWidth,
        past: [...document.querySelectorAll('body *')].filter((e) => visible(e) && e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.gamepad, pre, .overflow-x-auto'))
          .map((e) => e.tagName + '.' + (e.getAttribute('class') ?? '').split(' ')[0]).slice(0, 5) }`);
    assert.deepEqual(wide, { scroll: 0, past: [] });
  });

  it("shows the 404 page for a missing address", async () => {
    await browser.load(`${site.url}no-such-page`);
    assert.match(await browser.run(`return document.querySelector('h1').textContent`), /isn't here/);
  });
});
