<script setup lang="ts">
// The four things it is, in a strip.
import FeatureIcon from "@/components/icons/FeatureIcon.vue";
import { features } from "@/content/features";
import { vReveal } from "@/directives/reveal";
</script>

<template>
  <section
    id="features"
    v-reveal.stagger
    class="wrap grid grid-cols-4 gap-6 border-y border-border py-7 max-lg:grid-cols-2 max-sm:grid-cols-1"
    aria-label="Features"
  >
    <article v-for="feature in features" :key="feature.title" class="group flex items-center gap-4">
      <div
        class="icon group-hover:-translate-y-[3px] group-hover:-rotate-4 group-hover:border-primary"
        aria-hidden="true"
      >
        <FeatureIcon :name="feature.icon" />
      </div>
      <div>
        <h2 class="mb-1.5 text-lead tracking-[-.01em]">{{ feature.title }}</h2>
        <p class="text-small text-muted-foreground">{{ feature.text }}</p>
      </div>
    </article>
  </section>
</template>
