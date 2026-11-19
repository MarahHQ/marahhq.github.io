<script setup lang="ts">
// The questions. Each answer slides open and shut on its own. The server renders them all open,
// so a visitor without JavaScript reads every answer; the app shuts them once it runs.
import { onMounted, ref } from "vue";
import RichText from "@/components/common/RichText.vue";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { questions } from "@/content/faq";
import { vReveal } from "@/directives/reveal";

const open = ref<string[]>(questions.map((_, i) => `qa-${i}`));
onMounted(() => (open.value = []));
</script>

<template>
  <section id="faq" class="wrap max-w-[860px] py-20" aria-labelledby="faq-title">
    <h2 id="faq-title" v-reveal class="mb-6 text-center text-[clamp(30px,3vw,42px)]">Questions</h2>
    <Accordion v-model="open" v-reveal.stagger type="multiple" :unmount-on-hide="false">
      <AccordionItem v-for="(item, i) in questions" :key="item.q" :value="`qa-${i}`" class="qa" data-qa>
        <AccordionTrigger class="qa-head" header-class="font-sans text-[16px] leading-[inherit] tracking-normal">
          {{ item.q }}
          <template #icon></template>
        </AccordionTrigger>
        <AccordionContent>
          <RichText as="p" :html="item.a" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
</template>
