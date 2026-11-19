<script setup lang="ts">
// The dark or light switch: a round outline button, in the header and in the menu. Its label says
// the theme it switches to. Hidden without JavaScript: the system's setting chooses then.
import ThemeIcons from "@/components/icons/ThemeIcons.vue";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/composables/useHydrated";
import { useTheme } from "@/composables/useTheme";

const hydrated = useHydrated();
const { toggle, label } = useTheme();
</script>

<template>
  <Button
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
</template>
