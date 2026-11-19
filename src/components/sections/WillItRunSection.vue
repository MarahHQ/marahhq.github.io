<script setup lang="ts">
// Will it run? The three answers a game's page gives. The example PCs show one at a time with
// JavaScript; without it all three show, one under the other.
import { ref } from "vue";
import { emulators, exampleLevel, levels, pcs } from "@/content/willItRun";
import { useHydrated } from "@/composables/useHydrated";
import { results } from "@/lib/verdict";
import { vReveal } from "@/directives/reveal";

const hydrated = useHydrated();
const examples = results(pcs, emulators);
const chosen = ref(examples[0]?.id);
</script>

<template>
  <section id="will-it-run" class="wrap pt-22 pb-6 max-sm:pt-16" aria-labelledby="run-title">
    <div v-reveal class="text-center">
      <p class="eyebrow">Will it run?</p>
      <h2 id="run-title" class="mt-4 mb-3 text-section">Know before you press Play.</h2>
      <p class="mx-auto max-w-[760px] text-lead text-muted-foreground">
        A game's page answers in its fact cards: what other players found, and what this PC can do.
      </p>
    </div>
    <div v-reveal.stagger class="mt-10 grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1">
      <article
        class="flex flex-col gap-4 rounded-3xl border border-border bg-card p-7 max-sm:p-[22px]"
        data-run="community"
      >
        <div class="fact" aria-hidden="true">
          <span class="fact-label">Compatibility</span>
          <span class="fact-value">{{ exampleLevel }}</span>
        </div>
        <h3 class="text-[22px]">PS4: the community's list</h3>
        <p class="text-body text-muted-foreground">
          Marah Launcher reads shadPS4's compatibility list for your system, Linux, macOS or Windows. Each PS4 game
          shows how far it gets, and when it was last tested:
        </p>
        <ol class="flex flex-wrap gap-1.5" aria-label="The levels, from the worst to the best">
          <li
            v-for="level in levels"
            :key="level"
            class="rounded-full border border-edge px-3 py-0.5 text-caption font-semibold"
            :class="{ 'border-primary bg-primary text-background': level === exampleLevel }"
          >
            {{ level }}
          </li>
        </ol>
        <p class="hint">
          PS5 games get KytyPS5's list in the same way. A game no list has shows "Not tested". When a game closes, Marah
          Launcher may ask how far it got, and keeps your answer: <strong>Rate how it runs</strong>, in the game's menu,
          asks again.
        </p>
      </article>

      <article
        class="flex flex-col gap-4 rounded-3xl border border-border bg-card p-7 max-sm:p-[22px]"
        data-run="protondb"
      >
        <div class="fact" aria-hidden="true">
          <span class="fact-label">ProtonDB</span>
          <span class="fact-value">Gold</span>
        </div>
        <h3 class="text-[22px]">Some PC games: ProtonDB</h3>
        <p class="text-body text-muted-foreground">
          A Windows game from the Catalog that runs with Wine, and that Steam also has, gets ProtonDB's rating:
          Platinum, Gold, Silver, Bronze or Borked.
        </p>
        <p class="hint">
          The game's menu links to its ProtonDB page, beside <strong>Compatibility list</strong>. When Marah Launcher is
          the whole screen, the items that open a web page don't show.
        </p>
      </article>

      <article
        class="flex flex-col gap-4 rounded-3xl border border-border bg-card p-7 max-lg:col-span-full max-sm:p-[22px]"
        data-run="this-pc"
      >
        <div class="fact" aria-hidden="true">
          <span class="fact-label">On this PC</span>
          <span class="fact-value">Should run well</span>
        </div>
        <h3 class="text-[22px]">On this PC: from what it needs</h3>
        <p class="text-body text-muted-foreground">
          Marah Launcher reads the processor, the memory and the graphics, and checks them against what each emulator
          needs. Pick a PC to see what Settings → This PC says:
        </p>
        <div
          class="flex flex-wrap gap-2"
          role="group"
          aria-label="Choose an example PC"
          data-pc-switcher
          :hidden="!hydrated"
        >
          <button
            v-for="pc in examples"
            :key="pc.id"
            type="button"
            class="chip-button px-4 py-1.5 text-small"
            :aria-pressed="pc.id === chosen"
            :data-pc="pc.id"
            @click="chosen = pc.id"
          >
            {{ pc.name }}
          </button>
        </div>
        <div class="grid gap-4" aria-live="polite">
          <div
            v-for="pc in examples"
            :key="pc.id"
            class="grid gap-2"
            :data-pc-panel="pc.id"
            :hidden="hydrated && pc.id !== chosen"
          >
            <p class="text-caption text-muted-foreground">
              <strong class="text-foreground">{{ pc.name }}:</strong> {{ pc.specs }}.
            </p>
            <ul class="grid gap-1.5">
              <li v-for="row in pc.rows" :key="row.name" class="verdict" :data-level="row.level">
                <span class="font-bold">{{ row.name }}</span>
                <span class="verdict-text"
                  >{{ row.headline }}<span v-if="row.why" class="text-muted-foreground"> · {{ row.why }}</span></span
                >
              </li>
            </ul>
            <p v-if="pc.notice" class="hint">The notice it shows once: "{{ pc.notice }}".</p>
          </div>
        </div>
      </article>
    </div>
    <p class="mt-5 text-center text-caption text-muted-foreground">
      Examples. The words are the launcher's own; the levels and ratings come from each list.
    </p>
  </section>
</template>
