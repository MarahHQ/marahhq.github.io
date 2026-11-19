<script setup lang="ts">
// Add a game by hand: a PC game's folder, and the files that tell Marah Launcher about it.
import CodeCard from "@/components/common/CodeCard.vue";
import RichText from "@/components/common/RichText.vue";
import { gameFile, referenceUrl, startScript, steps, tree } from "@/content/addGame";
import { vReveal } from "@/directives/reveal";
</script>

<template>
  <section id="add-game" class="border-t border-border py-24 max-sm:py-16" aria-labelledby="add-game-title">
    <div class="wrap grid grid-cols-[1fr_1.05fr] items-start gap-x-18 gap-y-10 max-md:grid-cols-1 max-md:gap-8">
      <div v-reveal>
        <p class="eyebrow">Add a game</p>
        <h2 id="add-game-title" class="mt-4 mb-5 text-section">
          Bring a game you have.<br />
          <span class="accent-text">It does the rest.</span>
        </h2>
        <p class="my-[1em] max-w-[560px] text-lead text-muted-foreground">
          Marah Launcher finds a PC game in your game folders and works out what starts it. A few files let you say
          more: its name, its art, and how it starts.
        </p>
        <ol class="mt-8 grid gap-5">
          <li v-for="(step, i) in steps" :key="step.title" class="flex gap-4">
            <span
              class="grid size-9 flex-none place-items-center rounded-full border border-edge bg-card font-display text-[15px] font-bold text-primary"
              >{{ i + 1 }}</span
            >
            <div class="[&_code]:text-[15px] [&_code]:text-foreground">
              <h3 class="text-lead">{{ step.title }}</h3>
              <RichText as="p" class="mt-1 text-body text-muted-foreground" :html="step.text" />
            </div>
          </li>
        </ol>
        <p class="hint mt-8">
          The kinds a start can be: <code class="text-foreground">script</code>,
          <code class="text-foreground">appimage</code> and <code class="text-foreground">native</code> run on Linux,
          <code class="text-foreground">macapp</code> on macOS, and
          <code class="text-foreground">windows</code> everywhere, with Proton or Wine off Windows. Every rule is in
          <a :href="referenceUrl">the reference</a>.
        </p>
      </div>
      <div v-reveal.stagger class="grid gap-5">
        <CodeCard name="~/Games/PC/" :text="tree" />
        <CodeCard id="add-game-json" name="launcher_game.json" :text="gameFile" />
        <CodeCard id="add-game-script" name="start.sh" :text="startScript" />
      </div>
    </div>
  </section>
</template>
