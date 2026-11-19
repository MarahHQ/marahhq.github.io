<script setup lang="ts">
// Marah OS: what it is, the three steps, how to check the download, and four cards about living
// with it. The release line, the file names and the checksums come from GitHub once the app runs.
import { computed } from "vue";
import RichText from "@/components/common/RichText.vue";
import { Button } from "@/components/ui/button";
import { marahOs } from "@/content/marahOs";
import { links } from "@/content/site";
import { useReleases } from "@/composables/useReleases";
import { vReveal } from "@/directives/reveal";

const { osLine, osSums } = useReleases();
const check = marahOs.check;
const sumFile = computed(() => osSums.value?.sumFile ?? check.sumFile);
const isoFile = computed(() => osSums.value?.isoName ?? check.isoFile);
const commands = computed(() => [
  { os: "Linux", before: "sha256sum -c ", file: sumFile.value, kind: "sum", after: "" },
  { os: "macOS", before: "shasum -a 256 -c ", file: sumFile.value, kind: "sum", after: "" },
  { os: "Windows", before: "certutil -hashfile ", file: isoFile.value, kind: "iso", after: " SHA256" },
]);
</script>

<template>
  <section
    id="os"
    class="border-y border-border py-24 [background:radial-gradient(ellipse_at_80%_10%,rgba(76,139,220,.2),transparent_55%),var(--night)] max-sm:py-16"
    aria-labelledby="os-title"
  >
    <div class="wrap grid grid-cols-[1.1fr_1fr] items-center gap-18 max-md:grid-cols-1 max-md:gap-8">
      <div v-reveal>
        <p class="eyebrow">{{ marahOs.eyebrow }}</p>
        <h2 id="os-title" class="mt-4 mb-5 text-section">
          {{ marahOs.title }}<br />
          <span class="accent-text">{{ marahOs.accent }}</span>
        </h2>
        <p class="my-[1em] max-w-[560px] text-lead text-muted-foreground">{{ marahOs.lead }}</p>
        <div class="mt-7 flex flex-wrap gap-3.5">
          <Button as="a" :href="links.osLatest">{{ marahOs.cta }}</Button>
          <Button as="a" variant="outline" href="#needs"
            >{{ marahOs.needsLink }} <span aria-hidden="true">↓</span></Button
          >
        </div>
        <p class="mt-4 max-w-[560px] text-lead text-muted-foreground" data-release="os">{{ osLine }}</p>
        <div id="check-iso" class="mt-6 max-w-[560px] rounded-[18px] border border-border bg-card p-5">
          <h3 class="text-lead">{{ check.title }}</h3>
          <RichText as="p" class="mt-1.5 text-small text-muted-foreground" :html="check.text" />
          <dl class="mt-3 grid gap-2 text-small">
            <div
              v-for="command in commands"
              :key="command.os"
              class="grid grid-cols-[72px_minmax(0,1fr)] gap-3 max-sm:grid-cols-1 max-sm:gap-0.5"
            >
              <dt class="font-bold">{{ command.os }}</dt>
              <dd class="sum-cmd">
                <code
                  >{{ command.before }}<span :data-os-file="command.kind">{{ command.file }}</span
                  >{{ command.after }}</code
                >
                <RichText v-if="command.kind === 'iso'" class="block text-muted-foreground" :html="check.windowsNote" />
              </dd>
            </div>
          </dl>
          <div class="mt-3 grid gap-1.5" data-os-sums :hidden="!osSums?.hashes.length">
            <p class="text-small text-muted-foreground">{{ osSums?.whole ? check.wholeTitle : check.partsTitle }}</p>
            <ul class="grid gap-1.5">
              <li v-for="part in osSums?.hashes" :key="part.name">
                <span class="text-caption text-muted-foreground">{{ part.name }}</span>
                <code class="sum-hash">{{ part.hash }}</code>
              </li>
            </ul>
          </div>
          <p class="mt-3 text-small text-muted-foreground">
            {{ check.linkLead }}
            <a data-os-sum-link :href="osSums?.sumUrl ?? links.osLatest">{{ osSums?.sumFile ?? check.linkText }}</a>
          </p>
        </div>
      </div>
      <ol v-reveal.stagger class="steps grid gap-4">
        <li v-for="step in marahOs.steps" :key="step.title">
          <strong class="block text-lead">{{ step.title }}</strong>
          <RichText class="text-body text-muted-foreground" :html="step.text" />
        </li>
      </ol>
    </div>
    <div v-reveal.stagger class="wrap mt-16 grid grid-cols-4 gap-4.5 max-lg:grid-cols-2 max-sm:grid-cols-1">
      <article class="rounded-[20px] border border-border bg-card p-6">
        <h3 class="mb-2.5 text-[19px]">{{ marahOs.sofa.title }}</h3>
        <p class="mb-3.5 text-body text-muted-foreground">{{ marahOs.sofa.text }}</p>
        <ul class="grid gap-1.5" aria-hidden="true">
          <li
            v-for="[name, value] in marahOs.sofa.rows"
            :key="name"
            class="flex justify-between gap-3 rounded-[10px] bg-muted px-3 py-[9px] text-[13.5px]"
          >
            <span>{{ name }}</span>
            <em class="text-muted-foreground not-italic">{{ value }}</em>
          </li>
        </ul>
      </article>
      <article class="rounded-[20px] border border-border bg-card p-6">
        <h3 class="mb-2.5 text-[19px]">{{ marahOs.updates.title }}</h3>
        <p class="mb-3.5 text-body text-muted-foreground">{{ marahOs.updates.text }}</p>
        <ul class="grid gap-1.5" aria-hidden="true">
          <li
            v-for="([name, value], i) in marahOs.updates.rows"
            :key="value"
            class="flex justify-between gap-3 rounded-[10px] bg-muted px-3 py-[9px] text-[13.5px]"
            :class="{ 'outline-2 outline-primary': i === 0 }"
          >
            <span>{{ name }}</span>
            <em class="text-muted-foreground not-italic">{{ value }}</em>
          </li>
        </ul>
      </article>
      <article id="needs" class="rounded-[20px] border border-border bg-card p-6">
        <h3 class="mb-2.5 text-[19px]">{{ marahOs.needs.title }}</h3>
        <dl class="grid gap-2.5">
          <div v-for="row in marahOs.needs.rows" :key="row.name">
            <dt class="text-small font-bold">{{ row.name }}</dt>
            <RichText as="dd" class="mt-0.5 text-small leading-[1.45] text-muted-foreground" :html="row.text" />
          </div>
        </dl>
        <p class="mt-3 text-caption text-muted-foreground">{{ marahOs.needs.note }}</p>
      </article>
      <article class="rounded-[20px] border border-border bg-card p-6">
        <h3 class="mb-2.5 text-[19px]">{{ marahOs.keep.title }}</h3>
        <RichText as="p" class="mb-3.5 text-body text-muted-foreground" :html="marahOs.keep.text" />
      </article>
    </div>
  </section>
</template>
