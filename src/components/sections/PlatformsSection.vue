<script setup lang="ts">
// What it plays: one card per source of games.
import { platforms } from "@/content/platforms";
import { vReveal } from "@/directives/reveal";
</script>

<template>
  <section
    id="platforms"
    class="wrap flex items-center gap-9 py-10 max-lg:flex-col max-lg:items-stretch"
    aria-labelledby="platforms-title"
  >
    <div v-reveal class="w-[260px] flex-none max-lg:w-auto">
      <h2 id="platforms-title" class="text-[26px]">What it plays</h2>
      <p class="my-[1em] text-body text-muted-foreground">
        Each source of games is a plugin built into Marah Launcher.
      </p>
      <a class="group/link text-body font-bold" href="#screens">
        See the screens
        <span
          class="inline-block transition-transform duration-200 group-hover/link:translate-x-1 group-focus-visible/link:translate-x-1"
          aria-hidden="true"
          >→</span
        >
      </a>
    </div>
    <ul v-reveal.stagger class="grid flex-1 grid-cols-6 gap-3.5 max-lg:grid-cols-3 max-sm:grid-cols-2">
      <li v-for="p in platforms" :key="p.name" class="platform">
        <strong class="text-[18px]">{{ p.name }}</strong>
        <span class="text-caption leading-[1.35] text-muted-foreground">{{ p.with }}</span>
      </li>
    </ul>
  </section>
</template>
