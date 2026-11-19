<script setup lang="ts">
// Themes: a theme file beside the Home it draws, and the login session.
import RichText from "@/components/common/RichText.vue";
import { Button } from "@/components/ui/button";
import { themes } from "@/content/themes";
import { vReveal } from "@/directives/reveal";
</script>

<template>
  <section
    id="themes"
    class="wrap grid grid-cols-[1fr_1.1fr] items-center gap-x-18 gap-y-10 py-24 max-md:grid-cols-1 max-md:gap-8 max-sm:py-16"
    aria-labelledby="more-title"
  >
    <div v-reveal>
      <p class="eyebrow">{{ themes.eyebrow }}</p>
      <h2 id="more-title" class="mt-4 mb-5 text-section">
        {{ themes.title }}<br />
        <span class="accent-text">{{ themes.accent }}</span>
      </h2>
      <RichText
        as="p"
        class="my-[1em] max-w-[560px] text-lead text-muted-foreground [&_code]:text-body [&_code]:text-foreground"
        :html="themes.lead"
      />
      <ul class="mt-5 flex flex-wrap gap-2" aria-label="What a theme changes">
        <li
          v-for="change in themes.changes"
          :key="change"
          class="rounded-full border border-edge bg-card/70 px-3.5 py-1.5 text-small font-semibold"
        >
          {{ change }}
        </li>
      </ul>
      <div class="mt-7 flex flex-wrap gap-3.5">
        <Button as="a" variant="outline" :href="themes.write.href">{{ themes.write.label }}</Button>
        <Button as="a" variant="outline" :href="themes.guide.href">{{ themes.guide.label }}</Button>
      </div>
    </div>
    <figure v-reveal class="theme-art relative pb-[150px] max-md:pb-10" style="--i: 1">
      <div
        class="editor relative z-1 w-[78%] overflow-hidden rounded-2xl border border-border bg-ink shadow-[0_24px_50px_rgba(0,0,0,.45)] max-md:w-full"
        aria-hidden="true"
      >
        <div class="flex items-center gap-[7px] border-b border-border bg-[#0c1a28] px-3.5 py-[11px]">
          <span class="size-2.5 rounded-full bg-[#2a4560]"></span>
          <span class="size-2.5 rounded-full bg-[#2a4560]"></span>
          <span class="size-2.5 rounded-full bg-[#2a4560]"></span>
          <b class="ml-2 text-[12.5px] leading-[normal] font-semibold text-muted-foreground">{{ themes.file }}</b>
        </div>
        <!-- prettier-ignore -->
        <pre class="overflow-x-auto px-4.5 py-4"><code class="font-mono text-[15px] leading-[1.65] text-code"><i>id</i> = <s>"default"</s>
<i>name</i> = <s>"Default"</s>

<u>[theme.tokens]</u>
<em># The logo's blues</em>
<i>color-accent</i> = <s>"#4c8bdc"</s> <span class="sw" style="--c:#4c8bdc"></span>
<i>color-accent-soft</i> = <s>"#82d8f5"</s> <span class="sw" style="--c:#82d8f5"></span>

<u>[theme.assets.sounds]</u>
<i>move</i> = <s>"sounds/move.wav"</s>
<i>select</i> = <s>"sounds/select.wav"</s></code></pre>
      </div>
      <div
        class="theme-shot absolute right-0 bottom-[34px] z-2 w-[54%] overflow-hidden rounded-[14px] border-2 border-primary shadow-[0_0_25px_rgba(130,216,245,.45),0_24px_50px_rgba(0,0,0,.5)] max-md:relative max-md:bottom-auto max-md:mt-[-40px] max-md:ml-auto max-md:w-[88%]"
      >
        <img
          src="/assets/screen-home.webp"
          :alt="themes.shotAlt"
          width="1600"
          height="900"
          loading="lazy"
          decoding="async"
          class="block"
        />
      </div>
      <figcaption
        class="absolute bottom-0 left-0 mt-3.5 text-left text-caption text-muted-foreground max-md:static max-md:mt-4"
      >
        {{ themes.caption }}
      </figcaption>
    </figure>
    <div
      v-reveal
      class="col-span-full flex items-center gap-5 rounded-[20px] border border-border bg-[linear-gradient(110deg,var(--card-hi),var(--card))] px-6.5 py-5.5 max-sm:flex-col max-sm:items-start"
    >
      <div class="icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </svg>
      </div>
      <div>
        <h3 class="mb-1 text-[19px]">{{ themes.session.title }}</h3>
        <p class="text-[15.5px] text-muted-foreground">{{ themes.session.text }}</p>
      </div>
    </div>
  </section>
</template>
