<script setup lang="ts">
// The screenshots, the buttons that switch them, and a small live Home to try. Without
// JavaScript one screenshot shows, and the buttons and the Home demo stay hidden.
import { onMounted, onUnmounted, ref } from "vue";
import HomeDemo from "./HomeDemo.vue";
import { screenshots } from "@/content/screenshots";
import { prefersReducedMotion } from "@/composables/motion";
import { useHydrated } from "@/composables/useHydrated";
import { vReveal } from "@/directives/reveal";

type Shot = (typeof screenshots)[number];
const first = screenshots[0];

const hydrated = useHydrated();
const section = ref<HTMLElement | null>(null);
const stack = ref<HTMLElement | null>(null);
const screen = ref<HTMLImageElement | null>(null);
const layer = ref<HTMLImageElement | null>(null);
const chosen = ref<Shot>(first);
const base = ref<Shot>(first);
const next = ref<string>(first.src);
const showing = ref(false);
const leaving = ref(false);

// Each picture is loaded and decoded before it shows, so the swap never shows an empty frame.
const decoded = new Map<string, Promise<void>>();
function load(src: string) {
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
  return decoded.get(src)!;
}

// Load the other pictures when the section is near, and only after the first screen has loaded,
// so they don't compete with the hero's pictures.
let near: IntersectionObserver | null = null;
function warmWhenNear() {
  near = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      near?.disconnect();
      screenshots.forEach((shot) => load(shot.src));
    },
    { rootMargin: "600px 0px" },
  );
  if (section.value) near.observe(section.value);
}
onMounted(() => {
  if (!("IntersectionObserver" in window)) return;
  if (document.readyState === "complete") warmWhenNear();
  else addEventListener("load", warmWhenNear, { once: true });
});

let turn = 0;
let fadeDone = 0;
onUnmounted(() => {
  near?.disconnect();
  clearTimeout(fadeDone);
});
const frames = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));

// Puts `src` on the base picture and hides the layer, both at once, with no transition.
function settle(shot: Shot) {
  for (const img of [screen.value, layer.value]) if (img) img.style.transition = "none";
  base.value = shot;
  if (screen.value) screen.value.src = shot.src;
  leaving.value = false;
  showing.value = false;
  layer.value?.classList.remove("show");
  screen.value?.classList.remove("leaving");
  void screen.value?.offsetWidth;
  for (const img of [screen.value, layer.value]) if (img) img.style.transition = "";
}

// The new picture slides in from the right on a layer over the old one; the old one slides out to
// the left and the card behind swings. With reduced motion, the new picture only fades in.
async function show(shot: Shot) {
  const mine = ++turn;
  chosen.value = shot;
  if (shot.src === base.value.src && !showing.value) return;
  await load(shot.src);
  if (mine !== turn) return; // A later click won.
  clearTimeout(fadeDone);
  if (showing.value) {
    // A click during a switch: the layer's picture becomes the base at once, then the next one
    // comes in from the start.
    const onLayer = screenshots.find((s) => s.src === next.value) ?? shot;
    settle(onLayer);
    await screen.value?.decode().catch(() => {});
    if (mine !== turn) return;
    await frames();
    if (mine !== turn) return;
  }
  const reduced = prefersReducedMotion();
  next.value = shot.src;
  showing.value = true;
  if (!reduced) {
    leaving.value = true;
    // Starts the swing again: off, a layout, on, in one go (a class binding would wait a tick).
    stack.value?.classList.remove("swing");
    void stack.value?.offsetWidth;
    stack.value?.classList.add("swing");
  }
  // A timer, not transitionend: the timer fires even when the transition does not run.
  fadeDone = window.setTimeout(
    async () => {
      if (screen.value) screen.value.src = shot.src;
      await screen.value?.decode().catch(() => {});
      if (mine === turn) settle(shot);
    },
    reduced ? 320 : 620,
  );
}
</script>

<template>
  <section
    id="screens"
    ref="section"
    class="relative overflow-hidden border-t border-border pt-18 pb-24 [background:radial-gradient(ellipse_at_30%_60%,rgba(76,139,220,.25),transparent_55%),var(--muted)] max-sm:pt-12 max-sm:pb-16"
    aria-labelledby="screens-title"
  >
    <div class="wrap grid grid-cols-2 items-center gap-18 *:min-w-0 max-md:grid-cols-1 max-md:gap-8">
      <figure ref="stack" v-reveal class="screen-stack relative px-5 pt-6">
        <div class="screen-back" aria-hidden="true"></div>
        <img
          id="screen"
          ref="screen"
          :class="{ leaving }"
          :src="base.src"
          :alt="chosen.alt"
          width="1600"
          height="900"
          loading="lazy"
          decoding="async"
        />
        <img
          v-if="hydrated"
          ref="layer"
          class="screen-next"
          :class="{ show: showing }"
          :src="next"
          alt=""
          aria-hidden="true"
          width="1600"
          height="900"
          decoding="async"
        />
        <figcaption class="mt-7 text-center text-caption text-muted-foreground">
          Default theme, with a real library.
        </figcaption>
      </figure>
      <div v-reveal class="max-md:text-center" style="--i: 1">
        <p class="pill">The experience</p>
        <h2 id="screens-title" class="my-5 text-[clamp(30px,3.1vw,46px)]">A home for your games on the TV</h2>
        <p class="my-[1em] text-lead text-muted-foreground">
          Marah Launcher finds your games and shows their art and details. It downloads and updates the emulators,
          installs games and starts them. When a game closes, it comes back to the front.
        </p>
        <div
          class="switcher mt-6 flex flex-wrap gap-2.5 max-md:justify-center"
          role="group"
          aria-label="Choose a screenshot"
          :hidden="!hydrated"
        >
          <button
            v-for="shot in screenshots"
            :key="shot.src"
            type="button"
            class="chip-button"
            :aria-pressed="chosen.src === shot.src"
            :data-src="shot.src"
            @click="show(shot)"
          >
            {{ shot.label }}
          </button>
        </div>
      </div>
    </div>
    <div v-reveal class="wrap mt-20 max-sm:mt-14" data-demo-wrap :hidden="!hydrated">
      <div class="mb-6 flex flex-wrap items-end justify-between gap-3 max-md:justify-center max-md:text-center">
        <div>
          <p class="eyebrow">Try it here</p>
          <h3 class="mt-2 text-[clamp(24px,2.4vw,32px)]">Move through Home</h3>
        </div>
        <p class="hint max-w-[460px]">
          A demo of the Home screen, with games from a real library. Click the games, then use the arrow keys, or tap
          them on a phone. The download is pretend.
        </p>
      </div>
      <HomeDemo />
    </div>
  </section>
</template>
