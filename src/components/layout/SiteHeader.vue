<script setup lang="ts">
// The header: the logo, the links, the dark or light switch, GitHub and Download. On a tablet or
// a phone, with JavaScript, the links move into a menu that slides in from the right (a Sheet);
// without it they stay in the header. The menu also holds the switch, GitHub and Download, so the
// header hides them while the menu is there.
import { onMounted, onUnmounted, ref } from "vue";
import SiteActions from "./SiteActions.vue";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navLinks } from "@/content/nav";
import { useHydrated } from "@/composables/useHydrated";

const hydrated = useHydrated();
const menuOpen = ref(false);

// The header's icon buttons are a size smaller once the page scrolls. With JavaScript, the menu
// holds them below 961 px; without it, a phone hides them.
const headerButton =
  "transition-[transform,border-color,width,height] duration-200 in-[.hdr-scrolled]:size-9 max-md:in-[.js]:hidden max-sm:hidden";

// The focus goes to the first link as the menu opens, not to its close button.
function focusFirstLink(event: Event) {
  event.preventDefault();
  document.querySelector<HTMLElement>("#menu .nav-link")?.focus({ preventScroll: true });
}

// A window that grows past the tablet width shows the links in the header again.
let wide: MediaQueryList | null = null;
const closeWhenWide = () => wide?.matches && (menuOpen.value = false);
onMounted(() => {
  wide = matchMedia("(width >= 961px)");
  wide.addEventListener("change", closeWhenWide);
});
onUnmounted(() => wide?.removeEventListener("change", closeWhenWide));
</script>

<template>
  <header class="site-header sticky top-0 z-10">
    <div
      class="wrap flex min-h-20 items-center justify-between gap-6 transition-[min-height] duration-300 ease-out in-[.hdr-scrolled]:min-h-14 max-lg:gap-3 max-md:flex-wrap max-md:in-[.js]:flex-nowrap max-sm:min-h-17 max-sm:in-[.hdr-scrolled]:min-h-13"
    >
      <a
        class="flex items-center gap-3 font-display text-[20px] leading-[1.05] font-extrabold tracking-[-.03em] text-foreground no-underline transition-[font-size] duration-300 ease-out in-[.hdr-scrolled]:text-[15px] max-sm:text-[17px] max-sm:in-[.hdr-scrolled]:text-[14px]"
        href="#top"
      >
        <img
          class="logo-mark size-13 transition-[width,height] duration-300 ease-out in-[.hdr-scrolled]:size-8 max-sm:size-10 max-sm:in-[.hdr-scrolled]:size-8"
          src="/assets/logo-mark.svg"
          alt=""
          width="52"
          height="52"
          decoding="async"
        />
        <!-- One line. A phone, and a screen where the links are in the bar but crowded, have room for "Marah" only. -->
        <span class="whitespace-nowrap"
          >Marah<span class="max-sm:sr-only md:max-[1280px]:sr-only"> Launcher</span></span
        >
      </a>
      <Sheet v-model:open="menuOpen">
        <SheetTrigger as-child>
          <button class="menu" type="button" :hidden="!hydrated">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            <span class="sr-only">Menu</span>
          </button>
        </SheetTrigger>
        <SheetContent
          id="menu"
          side="right"
          class="menu-panel"
          :show-close-button="false"
          @open-auto-focus="focusFirstLink"
        >
          <SheetTitle class="nav-title">Menu</SheetTitle>
          <SheetDescription class="sr-only">The page's sections, the theme, Download and GitHub.</SheetDescription>
          <SheetClose class="nav-close" aria-label="Close the menu">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </SheetClose>
          <nav class="grid gap-1" aria-label="Main">
            <a v-for="link in navLinks" :key="link.href" class="nav-link" :href="link.href" @click="menuOpen = false">
              {{ link.label }}
            </a>
          </nav>
          <div class="nav-extra">
            <SiteActions @download="menuOpen = false" />
          </div>
        </SheetContent>
      </Sheet>
      <nav id="nav" aria-label="Main">
        <a v-for="link in navLinks" :key="link.href" class="nav-link" :href="link.href">{{ link.label }}</a>
      </nav>
      <div class="flex items-center gap-4 max-lg:gap-2">
        <SiteActions :button-class="headerButton" />
      </div>
    </div>
  </header>
</template>
