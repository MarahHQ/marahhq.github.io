<script setup lang="ts">
// The feature strip's drawings, by name.
import type { FeatureIcon } from "@/content/features";

defineProps<{ name: FeatureIcon }>();
</script>

<template>
  <svg viewBox="0 0 24 24" width="24" height="24">
    <template v-if="name === 'library'">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </template>
    <template v-else-if="name === 'controller'">
      <path d="M7 8h10a4 4 0 0 1 4 4v3a3 3 0 0 1-5.4 1.8L14 15h-4l-1.6 1.8A3 3 0 0 1 3 15v-3a4 4 0 0 1 4-4z" />
      <path d="M8 11v3M6.5 12.5h3" />
      <circle cx="16" cy="12" r=".6" />
    </template>
    <template v-else-if="name === 'palette'">
      <path
        d="M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.8 1.5-1.5 0-1.2-1-1.5-1-2.5s.7-1.5 1.7-1.5H17a4 4 0 0 0 4-4c0-4.7-4-8.5-9-8.5z"
      />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="11" cy="7" r="1" />
      <circle cx="16" cy="8.5" r="1" />
    </template>
    <path v-else d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" />
  </svg>
</template>
