<script setup lang="ts">
// The dark or light switch: a round button in the header, or a round outline button in the menu.
// Its label says the theme it switches to. Hidden without JavaScript: the system's setting
// chooses then.
import ThemeIcons from "@/components/icons/ThemeIcons.vue";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/composables/useHydrated";
import { useTheme } from "@/composables/useTheme";

defineProps<{ inMenu?: boolean }>();
const hydrated = useHydrated();
const { toggle, label } = useTheme();
</script>

<template>
  <Button
    v-if="inMenu"
    variant="outline"
    size="icon"
    type="button"
    data-theme-switch
    :aria-label="label"
    :title="label"
    :hidden="!hydrated"
    @click="toggle"
  >
    <ThemeIcons />
  </Button>
  <button
    v-else
    class="theme-switch max-md:in-[.js]:hidden max-sm:hidden"
    type="button"
    data-theme-switch
    :aria-label="label"
    :title="label"
    :hidden="!hydrated"
    @click="toggle"
  >
    <ThemeIcons />
  </button>
</template>
