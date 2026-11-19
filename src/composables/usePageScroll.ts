// The header is see-through at the top of the page and a thin bar once the page scrolls; Back to
// top shows once the page is a screen down. Both read classes on <html>, which the head script
// sets first. One read a frame.
import { onMounted, onUnmounted } from "vue";

export function usePageScroll() {
  let frame = 0;
  function update() {
    frame = 0;
    const root = document.documentElement;
    const top = scrollY < 8;
    root.classList.toggle("hdr-top", top);
    root.classList.toggle("hdr-scrolled", !top);
    root.classList.toggle("far-down", scrollY > innerHeight);
  }
  const onScroll = () => (frame ||= requestAnimationFrame(update));
  onMounted(() => {
    addEventListener("scroll", onScroll, { passive: true });
    update();
  });
  onUnmounted(() => removeEventListener("scroll", onScroll));
}
