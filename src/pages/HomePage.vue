<script setup lang="ts">
// The site's one page: its head tags, then the sections in order.
import { useHead } from "@unhead/vue";
import SiteLayout from "@/layouts/SiteLayout.vue";
import HeroSection from "@/components/sections/HeroSection.vue";
import FeaturesSection from "@/components/sections/FeaturesSection.vue";
import PlatformsSection from "@/components/sections/PlatformsSection.vue";
import GetItSection from "@/components/sections/GetItSection.vue";
import ScreenshotsSection from "@/components/sections/ScreenshotsSection.vue";
import WillItRunSection from "@/components/sections/WillItRunSection.vue";
import ControllerSection from "@/components/sections/ControllerSection.vue";
import ThemesSection from "@/components/sections/ThemesSection.vue";
import AddGameSection from "@/components/sections/AddGameSection.vue";
import MarahOsSection from "@/components/sections/MarahOsSection.vue";
import WhichOneSection from "@/components/sections/WhichOneSection.vue";
import FaqSection from "@/components/sections/FaqSection.vue";
import { site } from "@/content/site";

useHead({
  title: site.title,
  meta: [
    { name: "description", content: site.description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: site.name },
    { property: "og:url", content: site.url },
    { property: "og:title", content: site.title },
    { property: "og:description", content: site.ogDescription },
    { property: "og:image", content: site.ogImage },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: site.ogImageAlt },
    { name: "twitter:card", content: "summary_large_image" },
  ],
  link: [{ rel: "canonical", href: site.url }],
});
</script>

<template>
  <SiteLayout>
    <HeroSection />
    <FeaturesSection />
    <PlatformsSection />
    <GetItSection />
    <ScreenshotsSection />
    <WillItRunSection />
    <ControllerSection />
    <ThemesSection />
    <AddGameSection />
    <MarahOsSection />
    <WhichOneSection />
    <FaqSection />
  </SiteLayout>
</template>
