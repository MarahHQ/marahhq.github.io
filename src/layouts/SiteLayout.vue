<script setup lang="ts">
// The frame of the home page: the skip link, the header, main, the footer and Back to top.
import BackToTop from "@/components/layout/BackToTop.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";
import SiteHeader from "@/components/layout/SiteHeader.vue";
import { onMounted } from "vue";
import { usePageScroll } from "@/composables/usePageScroll";
import { loadReleases } from "@/composables/useReleases";

usePageScroll();
// The latest versions, read from GitHub in the browser; the HTML says "The latest release".
onMounted(loadReleases);
</script>

<template>
  <a
    class="absolute -top-[60px] left-4 z-20 rounded-[10px] bg-primary px-4 py-2.5 font-bold text-background focus:top-[calc(12px+var(--safe-top))]"
    href="#main"
  >
    Skip to content
  </a>
  <SiteHeader />
  <main id="main">
    <slot />
  </main>
  <SiteFooter />
  <BackToTop />
</template>
