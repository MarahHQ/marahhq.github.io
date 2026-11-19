// v-reveal: a part fades up the first time it comes into view; v-reveal.stagger does it for each
// child in turn. The attribute (data-reveal or data-stagger) is in the prerendered HTML; the CSS
// hides the parts only when the head script added .reveal and motion is allowed, so a visitor
// without JavaScript, or one who asks for less motion, sees them at once.
import type { Directive } from "vue";

const SELECTOR = "[data-reveal], [data-stagger]";
let observer: IntersectionObserver | null = null;

function show(part: Element) {
  part.setAttribute("data-in", "");
  observer?.unobserve(part);
}

function watcher(): IntersectionObserver | null {
  if (observer || !("IntersectionObserver" in window)) return observer;
  observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.isIntersecting && show(entry.target)),
    // A low threshold: on a phone a part can be taller than the screen.
    { rootMargin: "0px 0px -8% 0px", threshold: 0 },
  );
  // A link or button that gets keyboard focus is shown at once, even at the screen's edge.
  document.addEventListener("focusin", (event) => {
    for (
      let part = (event.target as Element).closest(SELECTOR);
      part;
      part = part.parentElement?.closest(SELECTOR) ?? null
    )
      show(part);
  });
  return observer;
}

const attribute = (stagger: boolean) => (stagger ? "data-stagger" : "data-reveal");

export const vReveal: Directive<HTMLElement> = {
  getSSRProps: ({ modifiers }) => ({ [attribute(!!modifiers.stagger)]: "" }),
  created(el, { modifiers }) {
    el.setAttribute(attribute(!!modifiers.stagger), "");
  },
  mounted(el) {
    const seen = watcher();
    if (seen) seen.observe(el);
    else show(el);
  },
  unmounted(el) {
    observer?.unobserve(el);
  },
};
