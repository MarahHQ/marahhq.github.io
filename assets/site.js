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
  await load(src);
  if (mine !== turn) return; // A later click won.
  screen.alt = alt;
  if (reduced.matches) {
    screen.src = src;
    return;
  }
  clearTimeout(fadeDone);
  layer.src = src;
  layer.classList.add("show");
  // A timer, not transitionend: the timer fires even when the transition does not run.
  fadeDone = setTimeout(async () => {
    screen.src = src;
    await screen.decode().catch(() => {});
    if (mine === turn) layer.classList.remove("show");
  }, 450);
}
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
