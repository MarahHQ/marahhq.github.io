<script setup lang="ts">
// The launcher and Marah OS, side by side. On a phone the table's buttons move under it.
import { Button } from "@/components/ui/button";
import { comparison } from "@/content/whichOne";
import { links } from "@/content/site";
import { vReveal } from "@/directives/reveal";
</script>

<template>
  <section id="which" class="wrap max-w-[980px] pt-22 pb-6" aria-labelledby="which-title">
    <h2 id="which-title" v-reveal class="mt-4 mb-3 text-center text-section">Which one is for you?</h2>
    <div v-reveal class="mt-8 overflow-x-auto">
      <table class="compare">
        <thead>
          <tr>
            <th scope="col">
              <span class="sr-only">Question</span>
            </th>
            <th scope="col">Marah Launcher</th>
            <th scope="col">Marah OS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="[question, launcher, os] in comparison" :key="question">
            <th scope="row">{{ question }}</th>
            <td>{{ launcher }}</td>
            <td>{{ os }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td></td>
            <td><Button as="a" size="small" href="#get">Get the launcher</Button></td>
            <td><Button as="a" size="small" :href="links.osLatest">Get Marah OS</Button></td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div class="mt-5 hidden grid-cols-2 gap-2.5 max-sm:grid">
      <Button as="a" class="max-sm:px-2.5 max-sm:py-[13px] max-sm:text-small max-sm:whitespace-nowrap" href="#get">
        Get the launcher
      </Button>
      <Button
        as="a"
        class="max-sm:px-2.5 max-sm:py-[13px] max-sm:text-small max-sm:whitespace-nowrap"
        :href="links.osLatest"
      >
        Get Marah OS
      </Button>
    </div>
  </section>
</template>
