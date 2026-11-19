<script setup lang="ts">
// Commands to paste into a terminal, as they are, with a copy button.
import CopyButton from "./CopyButton.vue";

defineProps<{ id: string; text: string }>();
</script>

<template>
  <div class="cmd">
    <pre><code :id="id">{{ text }}</code></pre>
    <CopyButton :target="id" />
  </div>
</template>
