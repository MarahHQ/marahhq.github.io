<script setup lang="ts">
// Two ways in: the launcher and Marah OS. The launcher's card has three tabs: a download (the
// visitor's own, then every system), a Linux command, and the package repositories. Without
// JavaScript every panel shows, one under the other, and the tabs stay hidden.
import { computed, onMounted, ref } from "vue";
import CommandBlock from "@/components/common/CommandBlock.vue";
import CopyButton from "@/components/common/CopyButton.vue";
import RichText from "@/components/common/RichText.vue";
import ChevronIcon from "@/components/icons/ChevronIcon.vue";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadFor, downloads, installCommand, repos } from "@/content/downloads";
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

// The download for this visitor's system, with its size once GitHub has said it. A phone, an
// unknown system, and a visitor without JavaScript get the list only.
const forYou = computed(() => {
  if (!mine.value) return null;
  const bytes = launcherSize(mine.value.file);
  return {
    label: `Download for ${mine.value.label}${bytes ? ` · ${bytes}` : ""}`,
    href: `${links.launcherDownload}${mine.value.file}`,
  };
});
const shown = (name: string) => !hydrated.value || tab.value === name;

// The distros: all open on the server, then the first one only. One at a time: opening one shuts
// the others.
const openRepos = ref<string[]>(repos.map((repo) => repo.id));
onMounted(() => (openRepos.value = repos.slice(0, 1).map((repo) => repo.id)));
function setRepos(value: string[] | string | undefined) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  openRepos.value = list.slice(-1);
}
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
        id="download"
        class="flex flex-col gap-4.5 rounded-3xl border border-border bg-[linear-gradient(160deg,var(--card-hi),var(--card))] p-8 max-sm:p-[22px]"
        aria-labelledby="way-launcher"
      >
        <h3 id="way-launcher" class="text-[28px]">{{ getIt.launcher.title }}</h3>
        <p class="text-lead text-muted-foreground">{{ getIt.launcher.lead }}</p>
        <Tabs v-model="tab" class="gap-4.5" :unmount-on-hide="false">
          <TabsList :aria-label="getIt.launcher.tabsLabel" :hidden="!hydrated">
            <TabsTrigger value="download">Download</TabsTrigger>
            <TabsTrigger value="terminal">Linux terminal</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
          </TabsList>
          <TabsContent
            value="download"
            class="flex flex-col gap-2.5"
            data-panel="download"
            force-mount
            :hidden="!shown('download')"
          >
            <Button v-if="forYou" as="a" class="self-start" data-for-you :href="forYou.href">{{ forYou.label }}</Button>
            <p class="eyebrow mt-3">{{ getIt.launcher.filesLabel }}</p>
            <ul id="launcher-files" class="grid gap-2">
              <li v-for="d in downloads" :key="d.file">
                <a
                  class="flex items-baseline gap-3 rounded-xl border border-border bg-card px-4 py-3 text-foreground no-underline transition-colors hover:border-primary focus-visible:border-primary"
                  :href="d.href"
                >
                  <strong class="text-[16px]">{{ d.name }}</strong>
                  <span class="text-small text-muted-foreground">{{ d.note }}</span>
                  <small class="ml-auto text-small whitespace-nowrap text-muted-foreground" :data-size="d.file">{{
                    launcherSize(d.file)
                  }}</small>
                </a>
              </li>
            </ul>
            <RichText as="p" class="hint" :html="getIt.launcher.sumsHint" />
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
          <TabsContent
            value="packages"
            class="flex flex-col gap-2.5"
            data-panel="packages"
            force-mount
            :hidden="!shown('packages')"
          >
            <!-- The tabs give the panel its own id, so the packages' id is on a box inside it. -->
            <div id="repos" class="flex flex-col gap-2.5">
              <RichText as="p" class="hint" :html="getIt.launcher.packagesHint" />
              <Accordion
                type="multiple"
                class="grid gap-2.5"
                :model-value="openRepos"
                :unmount-on-hide="false"
                @update:model-value="setRepos"
              >
                <AccordionItem v-for="repo in repos" :key="repo.id" :value="repo.id" class="repo" data-repo>
                  <AccordionTrigger
                    class="repo-head flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left text-[16px] font-bold text-foreground"
                  >
                    <span class="distro">{{ repo.name }}</span>
                    <span
                      class="rounded-full border border-edge px-2.5 py-0.5 text-[12px] font-semibold text-muted-foreground"
                      >{{ repo.manager }}</span
                    >
                    <template #icon><ChevronIcon class="ml-auto flex-none" /></template>
                  </AccordionTrigger>
                  <AccordionContent>
                    <RichText
                      v-if="repo.intro"
                      as="p"
                      class="mx-4 mt-0 mb-3 text-left text-body text-muted-foreground [&_code]:whitespace-nowrap [&_code]:text-foreground"
                      :html="repo.intro"
                    />
                    <CommandBlock :id="`cmd-${repo.id}`" class="mx-4 mb-4" :text="repo.commands" />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
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
