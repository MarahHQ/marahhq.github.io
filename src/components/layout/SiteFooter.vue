<script setup lang="ts">
// The footer: the logo, the notes and the links.
import { footerLinks, footerNotes } from "@/content/footer";
</script>

<template>
  <footer class="border-t border-border pb-(--safe-bottom)">
    <div class="wrap flex items-center justify-between gap-8 py-10 max-sm:flex-col max-sm:text-center">
      <a
        class="flex items-center gap-3 font-display text-[20px] leading-[1.05] font-extrabold tracking-[-.03em] text-foreground no-underline max-sm:text-[17px]"
        href="#top"
      >
        <img
          class="logo-mark max-sm:size-10"
          src="/assets/logo-mark.svg"
          alt=""
          width="44"
          height="44"
          loading="lazy"
          decoding="async"
        />
        <span>Marah<br />Launcher</span>
      </a>
      <div>
        <p v-for="note in footerNotes" :key="note" class="my-1 text-small text-muted-foreground">{{ note }}</p>
      </div>
      <ul class="flex flex-wrap gap-5 max-sm:justify-center">
        <li v-for="link in footerLinks" :key="link.href">
          <a class="text-body" :href="link.href">{{ link.label }}</a>
        </li>
      </ul>
    </div>
  </footer>
</template>
