<script setup lang="ts">
// Two ways in: the launcher (a download or a Linux command, in tabs) and Marah OS. Without
// JavaScript both of the launcher's panels show, one under the other, and the tabs stay hidden.
import { computed, onMounted, ref } from "vue";
import CopyButton from "@/components/common/CopyButton.vue";
import RichText from "@/components/common/RichText.vue";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadFor, installCommand } from "@/content/downloads";
import { getIt } from "@/content/getIt";
import { links } from "@/content/site";
import { useHydrated } from "@/composables/useHydrated";
import { useReleases } from "@/composables/useReleases";
import { vReveal } from "@/directives/reveal";

const hydrated = useHydrated();
const { launcherLine, osLine, launcherSize } = useReleases();
const tab = ref("download");
const mine = ref<ReturnType<typeof downloadFor>>(null);

onMounted(() => {
  const ua = navigator.userAgent;
  // A Linux visitor sees the terminal first.
  if (/Linux/.test(ua) && !/Android/.test(ua)) tab.value = "terminal";
  mine.value = downloadFor(ua);
});

// The download for this visitor's system, with its size once GitHub has said it.
const forYou = computed(() => {
  if (!mine.value) return { label: getIt.launcher.chooseLabel, href: "#download" };
  const bytes = launcherSize(mine.value.file);
  return {
    label: `Download for ${mine.value.label}${bytes ? ` · ${bytes}` : ""}`,
    href: `${links.launcherDownload}${mine.value.file}`,
  };
});
const shown = (name: string) => !hydrated.value || tab.value === name;
</script>

<template>
  <section id="get" class="wrap pt-22 pb-18 max-sm:py-16" aria-labelledby="get-title">
    <div v-reveal class="text-center">
      <p class="eyebrow">{{ getIt.eyebrow }}</p>
      <h2 id="get-title" class="mt-4 mb-3 text-section">{{ getIt.title }}</h2>
      <p class="text-lead text-muted-foreground">{{ getIt.lead }}</p>
    </div>
    <div v-reveal.stagger class="mt-10 grid grid-cols-2 gap-6 max-md:grid-cols-1 max-md:gap-8">
      <article
        class="flex flex-col gap-4.5 rounded-3xl border border-border bg-[linear-gradient(160deg,var(--card-hi),var(--card))] p-8 max-sm:p-[22px]"
        aria-labelledby="way-launcher"
      >
        <h3 id="way-launcher" class="text-[28px]">{{ getIt.launcher.title }}</h3>
        <p class="text-lead text-muted-foreground">{{ getIt.launcher.lead }}</p>
        <Tabs v-model="tab" class="gap-4.5" :unmount-on-hide="false">
          <TabsList :aria-label="getIt.launcher.tabsLabel" :hidden="!hydrated">
            <TabsTrigger value="download">Download</TabsTrigger>
            <TabsTrigger value="terminal">Linux terminal</TabsTrigger>
          </TabsList>
          <TabsContent
            value="download"
            class="flex flex-col gap-2.5"
            data-panel="download"
            force-mount
            :hidden="!shown('download')"
          >
            <Button as="a" class="self-start" data-for-you :href="forYou.href">{{ forYou.label }}</Button>
            <p class="hint">
              <a href="#download">{{ getIt.launcher.everyLabel }}</a>
            </p>
          </TabsContent>
          <TabsContent
            value="terminal"
            class="flex flex-col gap-2.5"
            data-panel="terminal"
            force-mount
            :hidden="!shown('terminal')"
          >
            <div class="cmd">
              <code id="install-cmd">{{ installCommand }}</code>
              <CopyButton target="install-cmd" label="Copy the command" />
            </div>
            <RichText as="p" class="hint" :html="getIt.launcher.terminalHint" />
          </TabsContent>
        </Tabs>
        <ul
          class="ticks mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-2 text-small text-muted-foreground"
        >
          <li v-for="tick in getIt.launcher.ticks" :key="tick">{{ tick }}</li>
          <li data-release="launcher">{{ launcherLine }}</li>
        </ul>
      </article>
      <article
        class="flex flex-col gap-4.5 rounded-3xl border border-border bg-[linear-gradient(160deg,var(--card-hi),var(--card))] p-8 max-sm:p-[22px]"
        aria-labelledby="way-os"
      >
        <h3 id="way-os" class="text-[28px]">{{ getIt.os.title }}</h3>
        <p class="text-lead text-muted-foreground">{{ getIt.os.lead }}</p>
        <ol class="grid gap-2.5">
          <li v-for="(step, i) in getIt.os.steps" :key="step" class="flex items-baseline gap-3.5 text-[16px]">
            <span class="font-extrabold text-primary tabular-nums">{{ String(i + 1).padStart(2, "0") }}</span>{{ step }}
          </li>
        </ol>
        <div class="flex flex-wrap gap-3.5">
          <Button as="a" :href="links.osLatest">{{ getIt.os.cta }}</Button>
          <Button as="a" variant="outline" href="#os">{{ getIt.os.more }}</Button>
        </div>
        <ul
          class="ticks mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-2 text-small text-muted-foreground"
        >
          <li v-for="tick in getIt.os.ticks" :key="tick">{{ tick }}</li>
          <li data-release="os">{{ osLine }}</li>
        </ul>
      </article>
    </div>
  </section>
</template>
