<script setup lang="ts">
// Copies the text of the element `target`: a copy icon, then a tick for a moment. Hidden until
// the app runs in a browser with a clipboard: without them it can't copy.
import { onMounted, onUnmounted, ref } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(defineProps<{ target: string; label?: string; class?: string }>(), {
  label: "Copy the commands",
  class: "",
});

const ready = ref(false);
const done = ref(false);
const said = ref<string | null>(null);
let undo = 0;

onMounted(() => (ready.value = !!navigator.clipboard));
onUnmounted(() => clearTimeout(undo));

async function copy() {
  const text = document.getElementById(props.target)?.textContent ?? "";
  try {
    await navigator.clipboard.writeText(text);
    done.value = true;
    said.value = "Copied";
  } catch {
    said.value = "Couldn't copy: select the text instead";
  }
  clearTimeout(undo);
  undo = window.setTimeout(() => {
    done.value = false;
    said.value = null;
  }, 1800);
}
</script>

<template>
  <button
    type="button"
    :class="cn('copy', done && 'done', props.class)"
    :data-copy="target"
    :aria-label="said ?? label"
    title="Copy"
    :hidden="!ready"
    @click="copy"
  >
    <svg class="i-copy" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2"></rect>
      <path d="M5 15V6a2 2 0 0 1 2-2h9"></path>
    </svg>
    <svg class="i-done" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5"></path>
    </svg>
  </button>
</template>
