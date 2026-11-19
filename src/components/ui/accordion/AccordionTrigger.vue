<script setup lang="ts">
import type { AccordionTriggerProps } from "reka-ui";

import type { HTMLAttributes } from "vue";
import { reactiveOmit } from "@vueuse/core";
import { cn } from "@/lib/utils";
import { AccordionHeader, AccordionTrigger } from "reka-ui";

const props = defineProps<
  AccordionTriggerProps & { class?: HTMLAttributes["class"]; headerClass?: HTMLAttributes["class"] }
>();

const delegatedProps = reactiveOmit(props, "class", "headerClass");
</script>

<template>
  <AccordionHeader :class="headerClass">
    <AccordionTrigger
      data-slot="accordion-trigger"
      v-bind="delegatedProps"
      :class="cn('group/accordion-trigger', props.class)"
    >
      <slot />
      <!-- The site draws its own mark: a chevron in the slot, or a CSS plus. -->
      <slot name="icon" />
    </AccordionTrigger>
  </AccordionHeader>
</template>
