<script setup lang="ts">
// A file as an editor shows it: its name in a bar, then its text. With an `id`, a copy button
// copies the text.
import CopyButton from "./CopyButton.vue";

defineProps<{ name: string; text: string; id?: string }>();
</script>

<template>
  <div class="editor overflow-hidden rounded-2xl border border-border bg-ink shadow-[0_24px_50px_rgba(0,0,0,.45)]">
    <div class="flex min-h-[46px] items-center gap-[7px] border-b border-border bg-[#0c1a28] py-1.5 pr-1.5 pl-3.5">
      <span class="size-2.5 rounded-full bg-[#2a4560]"></span>
      <span class="size-2.5 rounded-full bg-[#2a4560]"></span>
      <span class="size-2.5 rounded-full bg-[#2a4560]"></span>
      <b class="ml-2 text-[12.5px] leading-[normal] font-semibold text-muted-foreground">{{ name }}</b>
      <CopyButton v-if="id" :target="id" :label="`Copy ${name}`" class="ml-auto size-8" />
    </div>
    <pre
      class="overflow-x-auto px-4.5 py-4"
    ><code :id="id" class="font-mono text-[15px] leading-[1.65] text-code">{{ text }}</code></pre>
  </div>
</template>
