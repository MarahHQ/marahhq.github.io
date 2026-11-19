<script setup lang="ts">
// Back to top: a round button in the bottom corner, shown once the page is a screen down (the
// `far-down` class on <html>). It goes to the top smoothly, unless the visitor asks for less
// motion, and gives the focus to the start of the page for a keyboard. Without JavaScript it is a
// plain link to #top.
import { prefersReducedMotion } from "@/composables/motion";

function toTop() {
  scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  document.querySelector<HTMLElement>(".site-header a")?.focus({ preventScroll: true });
}
</script>

<template>
  <a
    class="back-to-top"
    href="#top"
    data-back-to-top
    aria-label="Back to top"
    title="Back to top"
    @click.prevent="toTop"
  >
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
      <path
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 19V5M5 12l7-7 7 7"
      />
    </svg>
  </a>
</template>
