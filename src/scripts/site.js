"use strict";
// Small extras. The page works without this file: the nav stays open, one screenshot shows,
// and every section is visible (the head script shows them if this file does not run).
window.marahReady = true;
document.documentElement.classList.add("js");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

// The menu: on a tablet or a phone, a panel that slides in from the right, over a dimmed page.
// It closes on its close button, the dim page, Escape or a link, and gives the focus back.
const menu = document.querySelector(".menu");
const nav = document.querySelector("#nav");
const folded = matchMedia("(width < 961px)");
function setMenu(open) {
  nav.classList.toggle("open", open);
  document.documentElement.classList.toggle("menu-open", open);
  menu.setAttribute("aria-expanded", String(open));
  if (open) nav.querySelector(".nav-link").focus({ preventScroll: true });
}
menu.hidden = false;
menu.addEventListener("click", () => setMenu(true));
nav.querySelector(".nav-close").addEventListener("click", () => {
  setMenu(false);
  menu.focus();
});
document.querySelector(".nav-scrim").addEventListener("click", () => setMenu(false));
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !nav.classList.contains("open")) return;
  setMenu(false);
  menu.focus();
});
// A window that grows past the tablet width shows the links in the header again.
folded.addEventListener("change", () => folded.matches || setMenu(false));

// The header: see-through at the top of the page, a thin bar once it scrolls. One read a frame.
const root = document.documentElement;
let headerFrame = 0;
function headerState() {
  headerFrame = 0;
  const top = scrollY < 8;
  root.classList.toggle("hdr-top", top);
  root.classList.toggle("hdr-scrolled", !top);
  // Back to top shows once the page is a screen down.
  root.classList.toggle("far-down", scrollY > innerHeight);
}
addEventListener("scroll", () => (headerFrame ||= requestAnimationFrame(headerState)), { passive: true });
headerState();

// Dark or light. The head script already set the theme before the first paint; this keeps the
// switches in step, keeps the visitor's choice, and follows the system's setting until there is one.
const THEME_KEY = "marah-theme";
const systemLight = matchMedia("(prefers-color-scheme: light)");
const themeSwitches = document.querySelectorAll("[data-theme-switch]");
const themeBars = document.querySelectorAll('meta[name="theme-color"]');
function chosenTheme() {
  try {
    const theme = localStorage.getItem(THEME_KEY);
    return theme === "light" || theme === "dark" ? theme : null;
  } catch {
    return null;
  }
}
function setTheme(theme) {
  root.dataset.theme = theme;
  themeBars.forEach((bar) => (bar.content = bar.dataset[theme]));
  // Each switch says the theme it switches to: a label on the round one, words on the menu's.
  const label = `Switch to ${theme === "light" ? "dark" : "light"} theme`;
  themeSwitches.forEach((button) => {
    const words = button.querySelector("[data-theme-label]");
    if (words) words.textContent = label;
    else {
      button.setAttribute("aria-label", label);
      button.title = label;
    }
  });
}
themeSwitches.forEach((button) => {
  button.hidden = false;
  button.addEventListener("click", () => {
    const theme = root.dataset.theme === "light" ? "dark" : "light";
    setTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {} // A browser that keeps nothing still switches, for this visit.
  });
});
systemLight.addEventListener("change", () => chosenTheme() || setTheme(systemLight.matches ? "light" : "dark"));
setTheme(chosenTheme() || (systemLight.matches ? "light" : "dark"));

// The questions: each answer slides open and shut on its own. They start closed.
document.querySelectorAll("[data-qa]").forEach((item) => {
  const head = item.querySelector(".qa-head");
  const answer = item.querySelector(".fold");
  const set = (open) => {
    item.classList.toggle("open", open);
    head.setAttribute("aria-expanded", String(open));
    answer.inert = !open;
  };
  set(false);
  head.addEventListener("click", () => set(!item.classList.contains("open")));
});

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
    { rootMargin: "0px 0px -8% 0px", threshold: 0 },
  );
  parts.forEach((part) => seen.observe(part));
  // A link or button that gets keyboard focus is shown at once, even at the screen's edge.
  document.addEventListener("focusin", (event) => {
    for (
      let part = event.target.closest("[data-reveal], [data-stagger]");
      part;
      part = part.parentElement.closest("[data-reveal], [data-stagger]")
    ) {
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
    decoded.set(
      src,
      img.decode().catch(() => {}),
    );
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
    { rootMargin: "600px 0px" },
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
  fadeDone = setTimeout(
    async () => {
      screen.src = src;
      await screen.decode().catch(() => {});
      if (mine === turn) settle(src);
    },
    reduced.matches ? 320 : 620,
  );
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

// Will it run: the example PCs, one at a time. Without this script all three show.
const pcSwitcher = document.querySelector("[data-pc-switcher]");
if (pcSwitcher) {
  const pcButtons = [...pcSwitcher.querySelectorAll("[data-pc]")];
  const choosePc = (chosen) => {
    for (const button of pcButtons) {
      const on = button === chosen;
      button.setAttribute("aria-pressed", String(on));
      document.querySelector(`[data-pc-panel="${button.dataset.pc}"]`).hidden = !on;
    }
  };
  pcButtons.forEach((button) => button.addEventListener("click", () => choosePc(button)));
  pcSwitcher.hidden = false;
  choosePc(pcButtons[0]);
}

// ── The Home demo ──
// Cards to move through: the arrow keys while the row has the focus, the mouse, or a tap. The
// focused card grows, and its colours tint the picture behind. The games that are not installed
// download one after another, with the progress in the top bar, while the demo is on screen.
const demo = document.querySelector("[data-demo]");
if (demo) {
  const row = demo.querySelector("[data-demo-row]");
  const cards = [...row.querySelectorAll(".demo-card")];
  const part = (name) => demo.querySelector(`[data-demo-${name}]`);
  const toGet = cards.filter((card) => card.dataset.state === "get");
  let current = 0;
  let getting = null; // The card that downloads, and its share done, from 0 to 1.
  let done = 0;

  function fact(card) {
    if (card === getting) return `Downloading · ${Math.floor(done * 100)}%`;
    return card.dataset.state === "get" ? "Not installed · ✕ downloads it" : "On this PC · Should run well";
  }
  // Each card's name, for a screen reader, is its title and these words.
  function sayState(card) {
    const state = card === getting ? "downloading" : card.dataset.state === "get" ? "not installed" : "installed";
    card.querySelector("[data-demo-say]").textContent = `, ${card.dataset.system}, ${card.dataset.size}, ${state}`;
  }
  function showInfo() {
    const card = cards[current];
    part("system").textContent = `${card.dataset.system} · ${card.dataset.size}`;
    part("title").textContent = card.dataset.title;
    part("fact").textContent = fact(card);
  }
  function select(i) {
    current = Math.max(0, Math.min(cards.length - 1, i));
    const card = cards[current];
    cards.forEach((other) => other.setAttribute("aria-selected", String(other === card)));
    row.setAttribute("aria-activedescendant", card.id);
    demo.style.setProperty("--a", card.style.getPropertyValue("--a"));
    // The focused card to the middle of the row. Only the row scrolls, never the page; on a
    // desktop all the cards fit, so it stays put. The row is the cards' offset parent.
    const middle = card.offsetLeft - (row.clientWidth - card.offsetWidth) / 2;
    row.scrollTo({ left: middle, behavior: reduced.matches ? "auto" : "smooth" });
    showInfo();
  }
  // ✕ on a card: an installed game "starts" (the Play hint lights); another one downloads.
  function press() {
    const card = cards[current];
    if (card.dataset.state === "get") {
      if (!getting) startDownload(card);
      return;
    }
    const play = part("play");
    play.classList.add("on");
    part("news").textContent = `${card.dataset.title} would start now.`;
    setTimeout(() => play.classList.remove("on"), 700);
  }

  row.addEventListener("keydown", (event) => {
    const to = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: cards.length - 1 }[event.key];
    if (to !== undefined) select(to);
    else if (event.key === "Enter" || event.key === " ") press();
    else return;
    event.preventDefault(); // The arrows and Space would scroll the page.
  });
  row.addEventListener("pointerover", (event) => {
    const card = event.target.closest(".demo-card");
    if (event.pointerType === "mouse" && card) select(cards.indexOf(card));
  });
  // A click or a tap on the focused card presses ✕; on another card, it moves the focus there.
  row.addEventListener("click", (event) => {
    const card = event.target.closest(".demo-card");
    if (!card) return;
    const i = cards.indexOf(card);
    if (i === current) press();
    else select(i);
  });

  // The download: a step every 200 ms (a second with reduced motion), only while it shows.
  let onScreen = false;
  let timer = 0;
  const meter = part("meter");
  const pill = part("download");
  function startDownload(card) {
    if (getting) return; // One download at a time.
    getting = card;
    done = 0;
    sayState(card);
    pill.hidden = false;
    tick();
  }
  function tick() {
    clearTimeout(timer);
    if (!getting) return;
    part("download-text").textContent = `${getting.dataset.title} · ${Math.floor(done * 100)}%`;
    meter.style.setProperty("--done", String(done));
    if (cards[current] === getting) showInfo();
    if (done >= 1) return finish();
    if (!onScreen || document.hidden) return; // Goes on when the demo shows again.
    const slow = reduced.matches;
    timer = setTimeout(
      () => {
        done = Math.min(1, done + (slow ? 0.125 : 0.025));
        tick();
      },
      slow ? 1000 : 200,
    );
  }
  function finish() {
    const card = getting;
    card.dataset.state = "ready";
    getting = null;
    sayState(card);
    part("download-text").textContent = `${card.dataset.title} · Installed`;
    part("news").textContent = `${card.dataset.title} is installed.`;
    showInfo();
    // The next game after a pause; once all are in, they start over, so the demo stays alive.
    timer = setTimeout(() => {
      pill.hidden = true;
      let next = toGet.find((other) => other.dataset.state === "get");
      if (!next) {
        toGet.forEach((other) => {
          other.dataset.state = "get";
          sayState(other);
        });
        next = toGet[0];
        showInfo();
      }
      if (onScreen) startDownload(next);
      else queued = next;
    }, 3000);
  }
  let queued = toGet[0];
  function resume() {
    if (!onScreen || document.hidden) return;
    if (getting) tick();
    else if (queued) {
      const next = queued;
      queued = null;
      timer = setTimeout(() => startDownload(next), 1200);
    }
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      resume();
    }).observe(demo);
  }
  document.addEventListener("visibilitychange", resume);

  // The clock, in the visitor's own time, as the launcher shows the PC's.
  const clock = part("clock");
  const showTime = () =>
    (clock.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  showTime();
  setInterval(showTime, 30_000);

  cards.forEach(sayState);
  select(0);
  demo.closest("[data-demo-wrap]").hidden = false;
}

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
function chooseTab(tab) {
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
    tab.addEventListener("click", () => chooseTab(tab));
    tab.addEventListener("keydown", (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      chooseTab(next);
      next.focus();
    });
  });
  // A Linux visitor sees the terminal first.
  chooseTab(/Linux/.test(navigator.userAgent) && !/Android/.test(navigator.userAgent) ? tabs[1] : tabs[0]);
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
    undo = setTimeout(() => {
      button.classList.remove("done");
      button.setAttribute("aria-label", label);
    }, 1800);
  });
});

// The repositories card opens their panel in place, and the panel is an accordion: one distro
// open at a time. Both slide (the CSS animates each fold's height). Without this script
// everything shows, open.
const reposToggle = document.querySelector(".repos-toggle");
const repos = document.querySelector("#repos");
function setOpen(collapse, open) {
  collapse.classList.toggle("open", open);
  collapse.inert = !open; // Closed parts take no focus.
}
if (reposToggle && repos) {
  setOpen(repos, false);
  reposToggle.setAttribute("aria-expanded", "false");
  reposToggle.setAttribute("role", "button");
  reposToggle.addEventListener("click", (event) => {
    event.preventDefault();
    const open = !repos.classList.contains("open");
    setOpen(repos, open);
    reposToggle.setAttribute("aria-expanded", String(open));
    if (open)
      setTimeout(() => repos.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "nearest" }), 200);
  });
  reposToggle.addEventListener("keydown", (event) => {
    if (event.key === " ") {
      event.preventDefault();
      reposToggle.click();
    }
  });

  const items = [...repos.querySelectorAll("[data-repo]")];
  function openRepo(item) {
    for (const other of items) {
      const open = other === item && !item.classList.contains("open");
      other.classList.toggle("open", open);
      other.querySelector(".repo-head").setAttribute("aria-expanded", String(open));
      other.querySelector(".fold").inert = !open;
    }
  }
  items.forEach((item) => item.querySelector(".repo-head").addEventListener("click", () => openRepo(item)));
  // Only the first starts open.
  items.forEach((item) => item.classList.remove("open"));
  openRepo(items[0]);
}

// The download for this visitor's system. Phones and unknown systems keep "Choose your system".
const LATEST = "https://github.com/MarahHQ/marah-launcher/releases/latest/download/";
const forYou = document.querySelector("[data-for-you]");
const ua = navigator.userAgent;
const mine = /Android|iPhone|iPad/.test(ua)
  ? null
  : /Windows/.test(ua)
    ? ["Windows", "marah-launcher-windows-x86_64-setup.exe"]
    : /Mac OS X|Macintosh/.test(ua)
      ? ["macOS", "marah-launcher-macos-universal.dmg"]
      : /Linux|X11/.test(ua)
        ? ["Linux (AppImage)", "Marah-Launcher-x86_64.AppImage"]
        : null;
if (forYou && mine) {
  forYou.textContent = `Download for ${mine[0]}`;
  forYou.href = LATEST + mine[1];
  forYou.dataset.file = mine[1];
}

// ── The latest versions, read from GitHub ──
// The page carries no version numbers, so it is never wrong without this. GitHub allows
// 60 calls an hour per visitor; an hour's cache in the browser keeps it to two.
const day = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const size = (bytes) => (bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.round(bytes / 1e6)} MB`);
async function latest(repo) {
  const key = `marah-release-${repo}`;
  try {
    const kept = JSON.parse(localStorage.getItem(key) || "null");
    // A release kept before the page read the digests is read again.
    if (kept && kept.release.digests && Date.now() - kept.at < 36e5) return kept.release;
  } catch {}
  const res = await fetch(`https://api.github.com/repos/MarahHQ/${repo}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(res.status);
  const body = await res.json();
  const release = {
    tag: body.tag_name,
    date: body.published_at,
    assets: Object.fromEntries((body.assets || []).map((a) => [a.name, a.size])),
    // GitHub's own SHA-256 of each file, "sha256:<hex>", where it has one.
    digests: Object.fromEntries((body.assets || []).filter((a) => a.digest).map((a) => [a.name, a.digest])),
  };
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), release }));
  } catch {}
  return release;
}
function say(which, text) {
  document.querySelectorAll(`[data-release="${which}"]`).forEach((el) => {
    el.textContent = text;
  });
}
latest("marah-launcher")
  .then((r) => {
    say("launcher", `${r.tag} · ${day(r.date)}`);
    document.querySelectorAll("[data-size]").forEach((el) => {
      const bytes = r.assets[el.dataset.size];
      if (bytes) el.textContent = size(bytes);
    });
    if (forYou && forYou.dataset.file && r.assets[forYou.dataset.file]) {
      forYou.textContent += ` · ${size(r.assets[forYou.dataset.file])}`;
    }
  })
  .catch(() => {});
latest("marah-os")
  .then((r) => {
    // The ISO, whole or in parts; not the checksums.
    const iso = Object.entries(r.assets).filter(([name]) => /\.iso(\.part-[a-z]+)?$/.test(name));
    const total = iso.reduce((sum, [, bytes]) => sum + bytes, 0);
    say("os", `${r.tag} · ${total ? `${size(total)} · ` : ""}${day(r.date)}`);
    showOsSums(r, iso);
  })
  .catch(() => {});

// Marah OS's checksums: the file names in the commands, the link to the ISO's .sha256 file, and
// the SHA-256 GitHub has for the ISO, or for each of its parts. The joined ISO is not on the
// release, so its SHA-256 is only in the .sha256 file.
function showOsSums(r, iso) {
  const sum = Object.keys(r.assets).find((name) => /\.iso\.sha256$/.test(name));
  const isoName = sum ? sum.slice(0, -".sha256".length) : iso.find(([name]) => /\.iso$/.test(name))?.[0];
  if (isoName) document.querySelectorAll('[data-os-file="iso"]').forEach((el) => (el.textContent = isoName));
  if (sum) {
    document.querySelectorAll('[data-os-file="sum"]').forEach((el) => (el.textContent = sum));
    const link = document.querySelector("[data-os-sum-link]");
    link.href = `https://github.com/MarahHQ/marah-os/releases/download/${encodeURIComponent(r.tag)}/${sum}`;
    link.textContent = sum;
  }
  const hashed = iso
    .map(([name]) => [name, r.digests[name]])
    .filter(([, digest]) => /^sha256:[0-9a-f]{64}$/.test(digest));
  const box = document.querySelector("[data-os-sums]");
  if (!box || !hashed.length) return;
  const whole = hashed.length === 1 && hashed[0][0] === isoName;
  box.querySelector("p").textContent = whole
    ? "The ISO's SHA-256, as GitHub has it:"
    : "Each part's SHA-256, as GitHub has it:";
  box.querySelector("ul").replaceChildren(
    ...hashed.map(([name, digest]) => {
      const item = document.createElement("li");
      const label = document.createElement("span");
      label.className = "text-caption text-muted";
      label.textContent = name;
      const hash = document.createElement("code");
      hash.className = "sum-hash";
      hash.textContent = digest.slice("sha256:".length);
      item.append(label, hash);
      return item;
    }),
  );
  box.hidden = false;
}

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
  // The line to what the button does: the pressed part's own (the D-pad has one for its four
  // keys), else the first for the act.
  pad.querySelectorAll(".call.on").forEach((c) => c.classList.remove("on"));
  const part = (button || pad.querySelector(`[data-act="${which}"]`)).dataset.part.replace(/^dpad-.*/, "dpad");
  const call = pad.querySelector(`.call[data-for="${part}"]`) || pad.querySelector(`.call[data-call="${which}"]`);
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
    ArrowUp: "move",
    ArrowDown: "move",
    ArrowLeft: "move",
    ArrowRight: "move",
    Enter: "select",
    Escape: "back",
    Backspace: "back",
    "/": "search",
    t: "trailer",
    T: "trailer",
    ContextMenu: "menu",
    PageUp: "page",
    PageDown: "page",
    Delete: "notice",
    Tab: "bar",
  };
  const DPAD = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  pad.addEventListener("keydown", (event) => {
    if (event.target !== pad) return; // A focused button answers Enter with its own click.
    const act = KEYS[event.key];
    if (!act) return;
    if (act !== "bar") event.preventDefault(); // Tab still moves the focus on.
    hit(act, DPAD[event.key] ? pad.querySelector(`[data-part="dpad-${DPAD[event.key]}"]`) : null);
  });

  // A real controller, in the browser's standard layout: 0 ✕, 1 ○, 2 □, 3 △, 4 L1, 5 R1,
  // 6 L2, 7 R2, 8 Create, 9 Options, 12 to 15 the D-pad, 16 PS. Read only while the section
  // is on screen and a controller is there.
  const PADS = {
    0: "select",
    1: "back",
    2: "trailer",
    3: "search",
    4: "bar",
    5: "bar",
    6: "page",
    7: "page",
    8: "notice",
    9: "menu",
    12: "move",
    13: "move",
    14: "move",
    15: "move",
    16: "home",
  };
  const PAD_BUTTON = {
    4: "l1",
    5: "r1",
    6: "l2",
    7: "r2",
    12: "dpad-up",
    13: "dpad-down",
    14: "dpad-left",
    15: "dpad-right",
  };
  let onScreen = false,
    polling = false,
    was = [],
    psSince = 0,
    psHeld = false,
    stickWas = false;
  function poll() {
    const gp = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(Boolean);
    if (!gp || !onScreen) {
      polling = false;
      pad.classList.remove("live");
      return;
    }
    pad.classList.add("live");
    const now = gp.buttons.map((b) => b.pressed);
    now.forEach((down, i) => {
      if (i === 16) {
        if (down && !was[i]) {
          psSince = performance.now();
          psHeld = false;
        }
        if (down && !psHeld && performance.now() - psSince >= 600) {
          psHeld = true;
          hit("hold");
        }
        if (!down && was[i] && !psHeld) hit("home");
        return;
      }
      if (down && !was[i] && PADS[i])
        hit(PADS[i], PAD_BUTTON[i] ? pad.querySelector(`[data-part="${PAD_BUTTON[i]}"]`) : null);
    });
    const stick = Math.hypot(gp.axes[0] || 0, gp.axes[1] || 0) > 0.5;
    if (stick && !stickWas) hit("move", pad.querySelector('[data-part="ls"]'));
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

// Back to top: to the top of the page, smoothly unless the visitor asks for less motion, and
// the focus to the start of the page for a keyboard.
document.querySelector("[data-back-to-top]")?.addEventListener("click", (event) => {
  event.preventDefault();
  scrollTo({ top: 0, behavior: reduced.matches ? "auto" : "smooth" });
  document.querySelector(".site-header a")?.focus({ preventScroll: true });
});
