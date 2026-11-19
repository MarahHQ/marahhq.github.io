<script setup lang="ts">
// The downloads, and the package repositories that open in place. Without JavaScript the
// repositories' card is a link to the panel, and the panel and every distro in it are open.
import { onMounted, ref } from "vue";
import CommandBlock from "@/components/common/CommandBlock.vue";
import RichText from "@/components/common/RichText.vue";
import ChevronIcon from "@/components/icons/ChevronIcon.vue";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { downloads, repos } from "@/content/downloads";
import { links } from "@/content/site";
import { prefersReducedMotion } from "@/composables/motion";
import { useHydrated } from "@/composables/useHydrated";
import { useReleases } from "@/composables/useReleases";
import { vReveal } from "@/directives/reveal";

const hydrated = useHydrated();
const { launcherLine, launcherSize } = useReleases();

// The panel, and the distros in it: all open on the server, then the panel shut and the first
// distro open. One distro at a time: opening one shuts the others.
const panel = ref<HTMLElement | null>(null);
const panelOpen = ref(true);
const openRepos = ref<string[]>(repos.map((repo) => repo.id));
onMounted(() => {
  panelOpen.value = false;
  openRepos.value = repos.slice(0, 1).map((repo) => repo.id);
});
function setRepos(value: string[] | string | undefined) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  openRepos.value = list.slice(-1);
}
function togglePanel() {
  panelOpen.value = !panelOpen.value;
  if (panelOpen.value)
    setTimeout(
      () => panel.value?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" }),
      200,
    );
}

// The download cards: a soft light follows the pointer. One read and one write a frame.
let lightOn = false;
onMounted(() => (lightOn = matchMedia("(hover: hover)").matches && !prefersReducedMotion()));
let frame = 0;
function light(event: PointerEvent) {
  if (!lightOn || frame) return;
  const card = event.currentTarget as HTMLElement;
  const { clientX: x, clientY: y } = event;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const box = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${x - box.left}px`);
    card.style.setProperty("--my", `${y - box.top}px`);
  });
}
</script>

<template>
  <section
    id="download"
    class="border-y border-border bg-[radial-gradient(ellipse_at_center,var(--haze),var(--background)_65%)] py-22 text-center"
    aria-labelledby="download-title"
  >
    <div v-reveal class="wrap">
      <p class="eyebrow">Ready, player one?</p>
      <h2 id="download-title" class="mt-4 mb-5 text-section">
        All your games.<br />
        <span class="accent-text">One happy place.</span>
      </h2>
      <p class="mx-auto my-[1em] max-w-[560px] text-lead text-muted-foreground">
        Download the latest Marah Launcher for your system.
      </p>
      <p class="mx-auto mt-2 max-w-[560px] text-lead text-muted-foreground" data-release="launcher">
        {{ launcherLine }}
      </p>
      <ul
        v-reveal.stagger
        class="mt-8 mb-5 grid grid-cols-5 gap-3.5 max-lg:grid-cols-3 max-sm:grid-cols-2 max-sm:[&>li:last-child]:col-span-full"
      >
        <li v-for="d in downloads" :key="d.file">
          <a class="card" :href="d.href" @pointermove="light">
            <strong>{{ d.name }}</strong>
            <span>{{ d.note }}</span>
            <small :data-size="d.file">{{ launcherSize(d.file) }}</small>
          </a>
        </li>
        <li>
          <a
            class="card repos-toggle"
            href="#repos"
            aria-controls="repos"
            :role="hydrated ? 'button' : undefined"
            :aria-expanded="hydrated ? panelOpen : undefined"
            @click.prevent="togglePanel"
            @keydown.space.prevent="togglePanel"
            @pointermove="light"
          >
            <strong>Fedora, Debian, Ubuntu</strong>
            <span>DNF and APT repositories</span>
            <span class="chev-ring" aria-hidden="true"><ChevronIcon /></span>
          </a>
        </li>
      </ul>
      <div
        id="repos"
        ref="panel"
        class="fold repos-wrap"
        :class="{ open: panelOpen }"
        role="region"
        aria-label="Install from a package repository"
        :inert="!panelOpen"
      >
        <div class="fold-inner">
          <div class="mx-auto mt-1 grid max-w-[900px] grid-cols-[minmax(0,1fr)] gap-2.5 pt-1 pb-6 text-left">
            <p class="mb-1.5 text-center text-body text-muted-foreground">
              Install from a repository, and Marah Launcher updates with the rest of your system. The repositories'
              metadata is signed with <a href="https://marahhq.github.io/packages/marah.asc">this key</a>.
            </p>
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
                    class="mx-auto mt-0 mb-3 max-w-[560px] text-left text-lead text-muted-foreground [&_code]:text-[14.5px] [&_code]:whitespace-nowrap [&_code]:text-foreground"
                    :html="repo.intro"
                  />
                  <CommandBlock :id="`cmd-${repo.id}`" class="mx-4 mb-4" :text="repo.commands" />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
      <p class="mx-auto my-[1em] max-w-[560px] text-lead text-muted-foreground">
        Every file, with its SHA-256:
        <a :href="links.launcherLatest">the latest release</a>.
      </p>
    </div>
  </section>
</template>
