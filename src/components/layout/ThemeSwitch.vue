<script setup lang="ts">
// The dark or light switch: a round button in the header, or a row with words in the menu. It
// says the theme it switches to. Hidden without JavaScript: the system's setting chooses then.
import ThemeIcons from "@/components/icons/ThemeIcons.vue";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/composables/useHydrated";
import { useTheme } from "@/composables/useTheme";

defineProps<{ withWords?: boolean }>();
const hydrated = useHydrated();
const { toggle, label } = useTheme();
</script>

<template>
  <Button v-if="withWords" variant="outline" type="button" data-theme-switch :hidden="!hydrated" @click="toggle">
    <ThemeIcons />
    <span data-theme-label>{{ label }}</span>
  </Button>
  <button
    v-else
    class="theme-switch max-sm:hidden"
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
