<script setup lang="ts">
// The page for a missing address. Its paths start with "/": it is served at any depth.
import { useHead } from "@unhead/vue";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";

useHead({
  title: site.notFoundTitle,
  meta: [{ name: "robots", content: "noindex" }],
});
</script>

<template>
  <main class="grid min-h-screen place-content-center justify-items-center gap-2 p-8 text-center">
    <img
      class="w-[220px] drop-shadow-[0_10px_22px_rgba(130,216,245,.3)]"
      src="/assets/mascot.webp"
      alt="The Marah mascot, a smiling gamepad"
      width="720"
      height="720"
    />
    <p class="eyebrow max-w-[460px] text-lead text-muted-foreground">Error 404</p>
    <h1 class="mt-4 text-[clamp(34px,5vw,56px)]">This level <span class="accent-text">isn't here.</span></h1>
    <p class="max-w-[460px] text-lead text-muted-foreground">
      The page you were looking for moved, or never was. Start again from Home.
    </p>
    <div class="mt-7 flex flex-wrap gap-3.5">
      <Button as="a" href="/">Back to Home</Button>
      <Button as="a" variant="outline" href="/#get">Get Marah Launcher</Button>
    </div>
  </main>
</template>
