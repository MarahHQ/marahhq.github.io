<script setup lang="ts">
// A small, live Home: game cards to move through with the arrow keys, the mouse or a finger, and
// a download whose progress shows in the top bar, as the launcher's does. The focused card grows,
// and its colour tints the picture behind. The games that are not installed download one after
// another while the demo is on screen. Its block in ScreenshotsSection stays hidden without
// JavaScript.
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { games } from "@/content/homeDemo";
import { prefersReducedMotion } from "@/composables/motion";

const cards = reactive(games.map((game) => ({ ...game })));
type Card = (typeof cards)[number];

const demo = ref<HTMLElement | null>(null);
const row = ref<HTMLElement | null>(null);
const current = ref(0);
const getting = ref<Card | null>(null); // The card that downloads.
const done = ref(0); // Its share done, from 0 to 1.
const pillShown = ref(false);
const pillText = ref("Downloading");
const news = ref("");
const playing = ref(false);
const clock = ref("12:00");

const focused = computed(() => cards[current.value]!);
function fact(card: Card) {
  if (card === getting.value) return `Downloading · ${Math.floor(done.value * 100)}%`;
  return card.state === "get" ? "Not installed · ✕ downloads it" : "On this PC · Should run well";
}
// Each card's name, for a screen reader, is its title and these words.
function say(card: Card) {
  const state = card === getting.value ? "downloading" : card.state === "get" ? "not installed" : "installed";
  return `, ${card.system}, ${card.size}, ${state}`;
}

function select(i: number) {
  current.value = Math.max(0, Math.min(cards.length - 1, i));
  // The focused card to the middle of the row. Only the row scrolls, never the page; on a desktop
  // all the cards fit, so it stays put. The row is the cards' offset parent.
  const el = row.value?.children[current.value] as HTMLElement | undefined;
  if (row.value && el) {
    const middle = el.offsetLeft - (row.value.clientWidth - el.offsetWidth) / 2;
    row.value.scrollTo({ left: middle, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }
}

// ✕ on a card: an installed game "starts" (the Play hint lights); another one downloads.
let playTimer = 0;
function press() {
  const card = focused.value;
  if (card.state === "get") {
    if (!getting.value) startDownload(card);
    return;
  }
  playing.value = true;
  news.value = `${card.title} would start now.`;
  clearTimeout(playTimer);
  playTimer = window.setTimeout(() => (playing.value = false), 700);
}

function onKey(event: KeyboardEvent) {
  const to = { ArrowLeft: current.value - 1, ArrowRight: current.value + 1, Home: 0, End: cards.length - 1 }[event.key];
  if (to !== undefined) select(to);
  else if (event.key === "Enter" || event.key === " ") press();
  else return;
  event.preventDefault(); // The arrows and Space would scroll the page.
}
function onPointerOver(event: PointerEvent, i: number) {
  if (event.pointerType === "mouse") select(i);
}
// A click or a tap on the focused card presses ✕; on another card, it moves the focus there.
function onClick(i: number) {
  if (i === current.value) press();
  else select(i);
}

// The download: a step every 200 ms (a second with reduced motion), only while it shows.
const toGet = cards.filter((card) => card.state === "get");
let onScreen = false;
let timer = 0;
let queued: Card | null = toGet[0] ?? null;

function startDownload(card: Card) {
  if (getting.value) return; // One download at a time.
  getting.value = card;
  done.value = 0;
  pillShown.value = true;
  tick();
}
function tick() {
  clearTimeout(timer);
  const card = getting.value;
  if (!card) return;
  pillText.value = `${card.title} · ${Math.floor(done.value * 100)}%`;
  if (done.value >= 1) return finish(card);
  if (!onScreen || document.hidden) return; // Goes on when the demo shows again.
  const slow = prefersReducedMotion();
  timer = window.setTimeout(
    () => {
      done.value = Math.min(1, done.value + (slow ? 0.125 : 0.025));
      tick();
    },
    slow ? 1000 : 200,
  );
}
function finish(card: Card) {
  card.state = "ready";
  getting.value = null;
  pillText.value = `${card.title} · Installed`;
  news.value = `${card.title} is installed.`;
  // The next game after a pause; once all are in, they start over, so the demo stays alive.
  timer = window.setTimeout(() => {
    pillShown.value = false;
    let next = toGet.find((other) => other.state === "get");
    if (!next) {
      toGet.forEach((other) => (other.state = "get"));
      next = toGet[0];
    }
    if (!next) return;
    if (onScreen) startDownload(next);
    else queued = next;
  }, 3000);
}
function resume() {
  if (!onScreen || document.hidden) return;
  if (getting.value) tick();
  else if (queued) {
    const next = queued;
    queued = null;
    timer = window.setTimeout(() => startDownload(next), 1200);
  }
}

let watcher: IntersectionObserver | null = null;
let clockTimer = 0;
onMounted(() => {
  if ("IntersectionObserver" in window && demo.value) {
    watcher = new IntersectionObserver(([entry]) => {
      onScreen = !!entry?.isIntersecting;
      resume();
    });
    watcher.observe(demo.value);
  }
  document.addEventListener("visibilitychange", resume);
  // The clock, in the visitor's own time, as the launcher shows the PC's.
  const showTime = () => (clock.value = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  showTime();
  clockTimer = window.setInterval(showTime, 30_000);
});
onUnmounted(() => {
  watcher?.disconnect();
  document.removeEventListener("visibilitychange", resume);
  clearTimeout(timer);
  clearTimeout(playTimer);
  clearInterval(clockTimer);
});
</script>

<template>
  <div ref="demo" class="demo" data-demo :style="{ '--a': focused.tint }">
    <div class="demo-bg" aria-hidden="true"></div>
    <div class="demo-bar">
      <p class="demo-download" data-demo-download :hidden="!pillShown">
        <span data-demo-download-text>{{ pillText }}</span>
        <span class="demo-meter" aria-hidden="true">
          <span data-demo-meter :style="{ '--done': String(done) }"></span>
        </span>
      </p>
      <span class="demo-icons" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="6"></circle>
          <path d="M20 20l-4.5-4.5"></path>
        </svg>
        <svg viewBox="0 0 24 24">
          <path d="M12 4v11M7 10l5 5 5-5M5 20h14"></path>
        </svg>
        <svg viewBox="0 0 24 24">
          <path d="M7 8h10a4 4 0 0 1 4 4v3a3 3 0 0 1-5.4 1.8L14 15h-4l-1.6 1.8A3 3 0 0 1 3 15v-3a4 4 0 0 1 4-4z"></path>
        </svg>
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8"></circle>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </span>
      <span class="demo-clock" data-demo-clock aria-hidden="true">{{ clock }}</span>
    </div>
    <div class="demo-info" aria-hidden="true">
      <p class="demo-system" data-demo-system>{{ focused.system }} · {{ focused.size }}</p>
      <p class="demo-title" data-demo-title>{{ focused.title }}</p>
      <p class="demo-fact" data-demo-fact>{{ fact(focused) }}</p>
    </div>
    <ul
      ref="row"
      class="demo-row overflow-x-auto"
      role="listbox"
      aria-orientation="horizontal"
      aria-label="Home demo: the arrow keys move between the games"
      tabindex="0"
      data-demo-row
      :aria-activedescendant="`demo-game-${current}`"
      @keydown="onKey"
    >
      <li
        v-for="(card, i) in cards"
        :id="`demo-game-${i}`"
        :key="card.cover"
        class="demo-card"
        role="option"
        :aria-selected="i === current"
        :data-state="card.state"
        :style="{ '--a': card.tint }"
        @pointerover="onPointerOver($event, i)"
        @click="onClick(i)"
      >
        <img
          class="demo-cover"
          :src="`/assets/demo/${card.cover}.webp`"
          alt=""
          width="360"
          height="540"
          loading="lazy"
          decoding="async"
        />
        <span class="demo-badge" aria-hidden="true">{{ card.system }}</span>
        <span class="sr-only">{{ card.title }}</span>
        <span class="sr-only" data-demo-say>{{ say(card) }}</span>
      </li>
    </ul>
    <p class="demo-hints" aria-hidden="true">
      <span data-demo-play :class="{ on: playing }"><kbd>✕</kbd> Play</span>
      <span><kbd>←</kbd> <kbd>→</kbd> Move</span>
    </p>
    <p class="sr-only" aria-live="polite" data-demo-news>{{ news }}</p>
  </div>
</template>
