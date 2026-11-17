// Small extras. The page works without this file: the nav stays open, one screenshot shows,
// and every section is visible (the head script shows them if this file does not run).
window.marahReady = true;
document.documentElement.classList.add("js");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

// The mobile menu.
const menu = document.querySelector(".menu");
const nav = document.querySelector("#nav");
menu.hidden = false;
menu.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menu.setAttribute("aria-expanded", String(open));
});
nav.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
  })
);

// Scroll reveal: a part fades up the first time it comes into view. The CSS hides the
// parts only when motion is allowed, so with reduced motion this only adds a class.
const parts = document.querySelectorAll("[data-reveal], [data-stagger]");
if ("IntersectionObserver" in window) {
  const seen = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("in");
        seen.unobserve(entry.target);
      }
    },
    // A low threshold: on a phone a part can be taller than the screen.
    { rootMargin: "0px 0px -8% 0px", threshold: 0 }
  );
  parts.forEach((part) => seen.observe(part));
  // A link or button that gets keyboard focus is shown at once, even at the screen's edge.
  document.addEventListener("focusin", (event) => {
    for (let part = event.target.closest("[data-reveal], [data-stagger]"); part;
      part = part.parentElement.closest("[data-reveal], [data-stagger]")) {
      part.classList.add("in");
      seen.unobserve(part);
    }
  });
} else {
  parts.forEach((part) => part.classList.add("in"));
}

// The screenshot switcher. Each picture is loaded and decoded before it shows, so the
// swap never shows an empty frame. With motion allowed, the new picture fades in on a
// layer over the old one; then #screen takes the new picture under the layer.
const screen = document.querySelector("#screen");
const switcher = document.querySelector(".switcher");
const buttons = [...switcher.querySelectorAll("button")];
const layer = screen.cloneNode();
layer.removeAttribute("id");
layer.removeAttribute("loading");
layer.className = "screen-next";
layer.alt = "";
layer.setAttribute("aria-hidden", "true");
screen.after(layer);

const decoded = new Map();
function load(src) {
  if (!decoded.has(src)) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    // If the decode fails, the swap still goes on and the browser shows what it can.
    decoded.set(src, img.decode().catch(() => {}));
  }
  return decoded.get(src);
}

// Load the other pictures when the section is near, and only after the first screen has
// loaded, so they do not compete with the hero pictures.
function warmWhenNear() {
  const near = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      near.disconnect();
      buttons.forEach((button) => load(button.dataset.src));
    },
    { rootMargin: "600px 0px" }
  );
  near.observe(document.querySelector("#screens"));
}
if ("IntersectionObserver" in window) {
  if (document.readyState === "complete") warmWhenNear();
  else addEventListener("load", warmWhenNear, { once: true });
}

let turn = 0;
let fadeDone = 0;
async function show(button) {
  const mine = ++turn;
  buttons.forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
  const { src, alt } = button.dataset;
  if (src === screen.getAttribute("src") && !layer.classList.contains("show")) return;
  await load(src);
  if (mine !== turn) return; // A later click won.
  screen.alt = alt;
  clearTimeout(fadeDone);
  if (layer.classList.contains("show")) {
    // A click during a switch: the picture on the layer becomes the base at once, then the
    // next one comes in from the start.
    settle(layer.src);
    await screen.decode().catch(() => {});
    if (mine !== turn) return;
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    if (mine !== turn) return;
  }
  // The new picture slides in from the right on the layer; the old one slides out to the
  // left and the card behind swings. With reduced motion, the new picture only fades in.
  layer.src = src;
  layer.classList.add("show");
  if (!reduced.matches) {
    screen.classList.add("leaving");
    stack.classList.remove("swing");
    void stack.offsetWidth; // Starts the swing again.
    stack.classList.add("swing");
  }
  // A timer, not transitionend: the timer fires even when the transition does not run.
  fadeDone = setTimeout(async () => {
    screen.src = src;
    await screen.decode().catch(() => {});
    if (mine === turn) settle(src);
  }, reduced.matches ? 320 : 620);
}
// Puts `src` on #screen and hides the layer, both at once, with no transition.
function settle(src) {
  for (const img of [screen, layer]) img.style.transition = "none";
  screen.src = src;
  screen.classList.remove("leaving");
  layer.classList.remove("show");
  void screen.offsetWidth;
  for (const img of [screen, layer]) img.style.transition = "";
}
const stack = screen.closest(".screen-stack");
switcher.hidden = false;
buttons.forEach((button) => button.addEventListener("click", () => show(button)));

// The download cards: a soft light follows the pointer. One read and one write per frame.
if (matchMedia("(hover: hover)").matches && !reduced.matches) {
  document.querySelectorAll(".card").forEach((card) => {
    let frame = 0;
    let x = 0;
    let y = 0;
    card.addEventListener("pointermove", (event) => {
      x = event.clientX;
      y = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const box = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${x - box.left}px`);
        card.style.setProperty("--my", `${y - box.top}px`);
      });
    });
  });
}

// ── Two ways in: the Download and Linux terminal tabs ──
// Without this script both panels show, one under the other.
const tabs = [...document.querySelectorAll('[role="tab"]')];
function choose(tab) {
  for (const other of tabs) {
    const on = other === tab;
    other.setAttribute("aria-selected", String(on));
    other.tabIndex = on ? 0 : -1;
    document.getElementById(other.getAttribute("aria-controls")).hidden = !on;
  }
}
if (tabs.length) {
  tabs[0].parentElement.hidden = false;
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => choose(tab));
    tab.addEventListener("keydown", (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      choose(next);
      next.focus();
    });
  });
  // A Linux visitor sees the terminal first.
  choose(/Linux/.test(navigator.userAgent) && !/Android/.test(navigator.userAgent) ? tabs[1] : tabs[0]);
}

// The copy buttons: a copy icon, and a tick for a moment once copied.
document.querySelectorAll("[data-copy]").forEach((button) => {
  if (!navigator.clipboard) return;
  button.hidden = false;
  const label = button.getAttribute("aria-label");
  let undo = 0;
  button.addEventListener("click", async () => {
    const text = document.getElementById(button.dataset.copy).textContent;
    try {
      await navigator.clipboard.writeText(text);
      button.classList.add("done");
      button.setAttribute("aria-label", "Copied");
    } catch {
      button.setAttribute("aria-label", "Couldn't copy: select the text instead");
    }
    clearTimeout(undo);
    undo = setTimeout(() => { button.classList.remove("done"); button.setAttribute("aria-label", label); }, 1800);
  });
});

// The repositories card opens their panel in place. Without this script the panel shows.
const reposToggle = document.querySelector(".repos-toggle");
const repos = document.querySelector("#repos");
if (reposToggle && repos) {
  repos.hidden = true;
  reposToggle.setAttribute("aria-expanded", "false");
  reposToggle.setAttribute("role", "button");
  reposToggle.addEventListener("click", (event) => {
    event.preventDefault();
    const open = repos.hidden;
    repos.hidden = !open;
    reposToggle.setAttribute("aria-expanded", String(open));
    if (open) {
      repos.classList.remove("opening");
      void repos.offsetWidth;
      repos.classList.add("opening");
      repos.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "nearest" });
    }
  });
  // Space on a link-turned-button opens it too.
  reposToggle.addEventListener("keydown", (event) => { if (event.key === " ") { event.preventDefault(); reposToggle.click(); } });
}

// The download for this visitor's system. Phones and unknown systems keep "Choose your system".
const LATEST = "https://github.com/MarahHQ/marah-launcher/releases/latest/download/";
const forYou = document.querySelector("[data-for-you]");
const ua = navigator.userAgent;
const mine =
  /Android|iPhone|iPad/.test(ua) ? null :
  /Windows/.test(ua) ? ["Windows", "marah-launcher-windows-x86_64-setup.exe"] :
  /Mac OS X|Macintosh/.test(ua) ? ["macOS", "marah-launcher-macos-universal.dmg"] :
  /Linux|X11/.test(ua) ? ["Linux (AppImage)", "Marah-Launcher-x86_64.AppImage"] : null;
if (forYou && mine) {
  forYou.textContent = `Download for ${mine[0]}`;
  forYou.href = LATEST + mine[1];
  forYou.dataset.file = mine[1];
}

// ── The latest versions, read from GitHub ──
// The page carries no version numbers, so it is never wrong without this. GitHub allows
// 60 calls an hour per visitor; an hour's cache in the browser keeps it to two.
const day = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const size = (bytes) => bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.round(bytes / 1e6)} MB`;
async function latest(repo) {
  const key = `marah-release-${repo}`;
  try {
    const kept = JSON.parse(localStorage.getItem(key) || "null");
    if (kept && Date.now() - kept.at < 36e5) return kept.release;
  } catch {}
  const res = await fetch(`https://api.github.com/repos/MarahHQ/${repo}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error(res.status);
  const body = await res.json();
  const release = {
    tag: body.tag_name,
    date: body.published_at,
    assets: Object.fromEntries((body.assets || []).map((a) => [a.name, a.size])),
  };
  try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), release })); } catch {}
  return release;
}
function say(which, text) {
  document.querySelectorAll(`[data-release="${which}"]`).forEach((el) => { el.textContent = text; });
}
latest("marah-launcher").then((r) => {
  say("launcher", `${r.tag} · ${day(r.date)}`);
  document.querySelectorAll("[data-size]").forEach((el) => {
    const bytes = r.assets[el.dataset.size];
    if (bytes) el.textContent = size(bytes);
  });
  if (forYou && forYou.dataset.file && r.assets[forYou.dataset.file]) {
    forYou.textContent += ` · ${size(r.assets[forYou.dataset.file])}`;
  }
}).catch(() => {});
latest("marah-os").then((r) => {
  // The ISO, whole or in parts; not the checksums.
  const iso = Object.entries(r.assets).filter(([name]) => /\.iso(\.part-[a-z]+)?$/.test(name));
  const total = iso.reduce((sum, [, bytes]) => sum + bytes, 0);
  say("os", `${r.tag} · ${total ? `${size(total)} · ` : ""}${day(r.date)}`);
}).catch(() => {});

// ── The controller: a key, a click or a real controller lights what it does ──
const pad = document.querySelector("[data-pad]");
const padSay = document.querySelector("[data-pad-say]");
const WORDS = {
  move: "<strong>Move</strong>: the D-pad, the left stick or the arrow keys.",
  select: "<strong>✕ Select</strong>: opens what has the focus. Enter on a keyboard.",
  back: "<strong>○ Back</strong>: one screen back. Escape or Backspace.",
  search: "<strong>△ Search</strong>: the Library, or the Catalog when you are in it. / on a keyboard.",
  trailer: "<strong>□ Trailer</strong>: plays the shown game's trailer. T on a keyboard.",
  menu: "<strong>Options</strong>: the shown game's menu. On Home, the system's emulator page.",
  bar: "<strong>L1, R1</strong>: along the top bar, or to the section before or after. Tab on a keyboard.",
  page: "<strong>L2, R2</strong>: a page up or down. Page Up and Page Down.",
  notice: "<strong>Create</strong>: closes the newest notice. Delete on a keyboard.",
  home: "<strong>PS, tap</strong>: back to Home. Hold it to close the game, or for the power menu.",
  hold: "<strong>PS, hold</strong>: closes the running game. With none, the power menu.",
};
let lit = 0;
function hit(act, button) {
  if (!pad) return;
  padSay.innerHTML = WORDS[act];
  pad.querySelectorAll(".b.on").forEach((b) => b.classList.remove("on"));
  document.querySelectorAll(".keys .on").forEach((k) => k.classList.remove("on"));
  (button || pad.querySelector(`[data-act="${act === "hold" ? "home" : act}"]`)).classList.add("on");
  const which = act === "hold" ? "home" : act;
  const key = document.querySelector(`.keys [data-key="${which}"]`);
  if (key) key.classList.add("on");
  // The line to what the button does: the pressed button's own, else the first for the act.
  pad.querySelectorAll(".call.on").forEach((c) => c.classList.remove("on"));
  const pressed = button || pad.querySelector(`[data-act="${which}"]`);
  const own = [...pressed.classList].map((c) => pad.querySelector(`.call[data-for="${c}"]`)).find(Boolean);
  const call = own || pad.querySelector(`.call[data-call="${which}"]`);
  if (call) call.classList.add("on");
  clearTimeout(lit);
  lit = setTimeout(() => {
    pad.querySelectorAll(".b.on, .call.on").forEach((b) => b.classList.remove("on"));
    if (key) key.classList.remove("on");
  }, 900);
}
if (pad) {
  pad.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => hit(b.dataset.act, b)));
  // Keys count only while the controller has the focus, so the page's own keys still work.
  const KEYS = {
    ArrowUp: "move", ArrowDown: "move", ArrowLeft: "move", ArrowRight: "move",
    Enter: "select", Escape: "back", Backspace: "back", "/": "search", t: "trailer", T: "trailer",
    ContextMenu: "menu", PageUp: "page", PageDown: "page", Delete: "notice", Tab: "bar",
  };
  const DPAD = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  pad.addEventListener("keydown", (event) => {
    if (event.target !== pad) return; // A focused button answers Enter with its own click.
    const act = KEYS[event.key];
    if (!act) return;
    if (act !== "bar") event.preventDefault(); // Tab still moves the focus on.
    hit(act, DPAD[event.key] ? pad.querySelector(`.dp.${DPAD[event.key]}`) : null);
  });

  // A real controller, in the browser's standard layout: 0 ✕, 1 ○, 2 □, 3 △, 4 L1, 5 R1,
  // 6 L2, 7 R2, 8 Create, 9 Options, 12 to 15 the D-pad, 16 PS. Read only while the section
  // is on screen and a controller is there.
  const PADS = { 0: "select", 1: "back", 2: "trailer", 3: "search", 4: "bar", 5: "bar", 6: "page", 7: "page",
    8: "notice", 9: "menu", 12: "move", 13: "move", 14: "move", 15: "move", 16: "home" };
  const PAD_BUTTON = { 4: ".l1", 5: ".r1", 6: ".l2", 7: ".r2", 12: ".dp.up", 13: ".dp.down", 14: ".dp.left", 15: ".dp.right" };
  let onScreen = false, polling = false, was = [], psSince = 0, psHeld = false, stickWas = false;
  function poll() {
    const gp = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(Boolean);
    if (!gp || !onScreen) { polling = false; pad.classList.remove("live"); return; }
    pad.classList.add("live");
    const now = gp.buttons.map((b) => b.pressed);
    now.forEach((down, i) => {
      if (i === 16) {
        if (down && !was[i]) { psSince = performance.now(); psHeld = false; }
        if (down && !psHeld && performance.now() - psSince >= 600) { psHeld = true; hit("hold"); }
        if (!down && was[i] && !psHeld) hit("home");
        return;
      }
      if (down && !was[i] && PADS[i]) hit(PADS[i], PAD_BUTTON[i] ? pad.querySelector(PAD_BUTTON[i]) : null);
    });
    const stick = Math.hypot(gp.axes[0] || 0, gp.axes[1] || 0) > 0.5;
    if (stick && !stickWas) hit("move", pad.querySelector(".ls"));
    stickWas = stick;
    was = now;
    requestAnimationFrame(poll);
  }
  function start() {
    if (polling || !onScreen) return;
    polling = true;
    padSay.innerHTML = "A controller is here. <strong>Press a button.</strong>";
    requestAnimationFrame(poll);
  }
  addEventListener("gamepadconnected", start);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen && navigator.getGamepads && [...navigator.getGamepads()].some(Boolean)) start();
    }).observe(pad);
  }
}
