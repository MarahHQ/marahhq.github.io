<script setup lang="ts">
// The controller: press a key, click a button or press a real controller's button, and it lights
// what that does. On a tablet or a phone the list of keys says it instead of the drawing's lines
// (both light).
import { onMounted, onUnmounted, reactive, ref } from "vue";
import ControllerDrawing from "./ControllerDrawing.vue";
import RichText from "@/components/common/RichText.vue";
import {
  HOLD_MS,
  PS_BUTTON,
  keyActs,
  keyParts,
  keys,
  padActs,
  padHere,
  padParts,
  waiting,
  words,
  type Act,
} from "@/content/controller";
import { vReveal } from "@/directives/reveal";

const pad = ref<HTMLElement | null>(null);
const said = ref(waiting);
const live = ref(false);
const lit = reactive<{ part: string | null; call: string | null; key: Act | null }>({
  part: null,
  call: null,
  key: null,
});
let unlight = 0;

// The drawing's own parts: the first part for an act, and the line for a part.
const firstPart = (act: Act) => pad.value?.querySelector<SVGElement>(`[data-act="${act}"]`)?.dataset.part ?? null;
const hasCall = (part: string) => !!pad.value?.querySelector(`.call[data-for="${part}"]`);
const firstCall = (act: Act) => pad.value?.querySelector<SVGElement>(`.call[data-call="${act}"]`)?.dataset.for ?? null;

function hit(act: Act | "hold", part: string | null = null) {
  const which: Act = act === "hold" ? "home" : act;
  said.value = words[act];
  lit.part = part ?? firstPart(which);
  lit.key = which;
  // The line to what the button does: the pressed part's own (the D-pad has one for its four
  // keys), else the first for the act.
  const own = lit.part?.replace(/^dpad-.*/, "dpad") ?? null;
  lit.call = own && hasCall(own) ? own : firstCall(which);
  clearTimeout(unlight);
  unlight = window.setTimeout(() => {
    lit.part = null;
    lit.call = null;
    lit.key = null;
  }, 900);
}

function onClick(event: MouseEvent) {
  const button = (event.target as Element).closest<SVGElement>("[data-act]");
  if (button) hit(button.dataset.act as Act, button.dataset.part ?? null);
}
function onKey(event: KeyboardEvent) {
  if (event.target !== pad.value) return; // A focused button answers Enter with its own click.
  const act = keyActs[event.key];
  if (!act) return;
  if (act !== "bar") event.preventDefault(); // Tab still moves the focus on.
  hit(act, keyParts[event.key] ?? null);
}

// A real controller: read only while the drawing is on screen and a controller is there.
let onScreen = false;
let polling = false;
let was: boolean[] = [];
let psSince = 0;
let psHeld = false;
let stickWas = false;
function poll() {
  const gp = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(Boolean);
  if (!gp || !onScreen) {
    polling = false;
    live.value = false;
    return;
  }
  live.value = true;
  const now = gp.buttons.map((b) => b.pressed);
  now.forEach((down, i) => {
    if (i === PS_BUTTON) {
      if (down && !was[i]) {
        psSince = performance.now();
        psHeld = false;
      }
      if (down && !psHeld && performance.now() - psSince >= HOLD_MS) {
        psHeld = true;
        hit("hold");
      }
      if (!down && was[i] && !psHeld) hit("home");
      return;
    }
    const act = padActs[i];
    if (down && !was[i] && act) hit(act, padParts[i] ?? null);
  });
  const stick = Math.hypot(gp.axes[0] || 0, gp.axes[1] || 0) > 0.5;
  if (stick && !stickWas) hit("move", "ls");
  stickWas = stick;
  was = now;
  requestAnimationFrame(poll);
}
function start() {
  if (polling || !onScreen) return;
  polling = true;
  said.value = padHere;
  requestAnimationFrame(poll);
}

let watcher: IntersectionObserver | null = null;
onMounted(() => {
  addEventListener("gamepadconnected", start);
  if ("IntersectionObserver" in window && pad.value) {
    watcher = new IntersectionObserver(([entry]) => {
      onScreen = !!entry?.isIntersecting;
      if (onScreen && navigator.getGamepads && [...navigator.getGamepads()].some(Boolean)) start();
    });
    watcher.observe(pad.value);
  }
});
onUnmounted(() => {
  removeEventListener("gamepadconnected", start);
  watcher?.disconnect();
  clearTimeout(unlight);
});
</script>

<template>
  <section id="pad" class="wrap border-t border-border pt-24 pb-18 max-sm:py-16" aria-labelledby="pad-title">
    <div v-reveal class="text-center">
      <p class="eyebrow">Made for a controller</p>
      <h2 id="pad-title" class="mt-4 mb-3 text-section">
        Press a button.<br />
        <span class="accent-text">See what it does.</span>
      </h2>
      <p class="mx-auto my-[1em] max-w-[640px] text-lead text-muted-foreground">
        Every screen works with a controller, a keyboard or a mouse. Try it here: plug in a controller and press a
        button, or click the controller and press a key.
      </p>
      <RichText
        as="p"
        class="mx-auto my-[1em] min-h-[3.2em] max-w-[640px] rounded-[14px] border border-border bg-card px-4.5 py-3.5 text-lead font-semibold text-foreground [&_strong]:text-primary"
        data-pad-say
        aria-live="polite"
        :html="said"
      />
    </div>
    <div v-reveal class="mt-6" style="--i: 1">
      <div
        ref="pad"
        class="gamepad mx-auto w-full max-w-[1120px] rounded-3xl outline-offset-8"
        :class="{ live }"
        data-pad
        tabindex="0"
        role="group"
        aria-label="A controller. Press a key or a controller button to see what it does in Marah Launcher."
        @click="onClick"
        @keydown="onKey"
      >
        <ControllerDrawing :lit="lit" />
      </div>
    </div>
    <dl v-reveal.stagger class="keys mt-4 hidden grid-cols-5 gap-2.5 max-lg:grid-cols-3 max-md:grid max-sm:grid-cols-1">
      <div
        v-for="k in keys"
        :key="k.act"
        class="rounded-[14px] border border-border bg-card px-3.5 py-3 transition-colors duration-150 [&.on]:border-primary [&.on]:bg-accent"
        :class="{ on: lit.key === k.act }"
        :data-key="k.act"
      >
        <dt class="text-small font-bold">
          {{ k.button }}
          <kbd v-if="k.key">{{ k.key }}</kbd>
        </dt>
        <dd class="mt-1 text-[13.5px] leading-[1.4] text-muted-foreground">{{ k.does }}</dd>
      </div>
    </dl>
  </section>
</template>
