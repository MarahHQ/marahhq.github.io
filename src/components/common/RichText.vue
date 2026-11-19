<script setup lang="ts">
// A line of the site's own copy that holds inline markup: a link, <code> or <strong>. The HTML
// comes only from the data files in src/content/, never from a visitor or an API. A render
// function, not v-html on <component :is>: the server renders that as an empty element.
import { h, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ html: string; as?: string }>(), { as: "span" });
const attrs = useAttrs();
const Markup = () => h(props.as, { ...attrs, innerHTML: props.html });
</script>

<template>
  <Markup />
</template>
