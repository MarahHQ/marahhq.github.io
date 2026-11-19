<script setup lang="ts">
// The site's three icon buttons: the dark or light switch, GitHub and Download. The header and
// the menu both show them.
import type { HTMLAttributes } from "vue";
import DownloadIcon from "@/components/icons/DownloadIcon.vue";
import GitHubIcon from "@/components/icons/GitHubIcon.vue";
import ThemeSwitch from "./ThemeSwitch.vue";
import { Button } from "@/components/ui/button";
import { links } from "@/content/site";

// `buttonClass` goes on each button: the three are siblings, with no wrapper of their own.
defineProps<{ buttonClass?: HTMLAttributes["class"] }>();
// A press on Download, so the menu can shut as the page scrolls to Get it.
const emit = defineEmits<{ download: [] }>();
</script>

<template>
  <ThemeSwitch :class="buttonClass" />
  <Button
    as="a"
    variant="outline"
    size="icon"
    :class="buttonClass"
    :href="links.org"
    target="_blank"
    rel="noopener"
    aria-label="MarahHQ on GitHub"
    title="MarahHQ on GitHub"
  >
    <GitHubIcon />
  </Button>
  <Button
    as="a"
    size="icon"
    :class="buttonClass"
    href="#get"
    aria-label="Download Marah Launcher"
    title="Download Marah Launcher"
    @click="emit('download')"
  >
    <DownloadIcon />
  </Button>
</template>
