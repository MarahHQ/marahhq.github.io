<script setup lang="ts">
// The root: the page for the address. Once it runs in the browser, the parts that need the
// script turn on, and the head script's fallback for the scroll reveal stands down.
import { useHead } from "@unhead/vue";
import { onMounted } from "vue";
import { markHydrated } from "@/composables/useHydrated";

declare global {
  interface Window {
    marahReady?: boolean;
  }
}

// The page fills the whole screen of a phone with a notch (viewport-fit=cover); the CSS keeps the
// content clear of it. Here, not in index.html: the head manager writes its own viewport tag.
useHead({
  meta: [{ name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" }],
});

onMounted(() => {
  window.marahReady = true;
  document.documentElement.classList.add("js");
  markHydrated();
});
</script>

<template>
  <RouterView />
</template>
