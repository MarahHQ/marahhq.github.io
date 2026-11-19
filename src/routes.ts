import type { RouteRecordRaw } from "vue-router";

// The site's pages. "/404" is rendered to dist/404.html, which GitHub Pages serves for a missing
// address at any depth; the catch-all gives the browser's router the same page there.
const NotFound = () => import("./pages/NotFoundPage.vue");

export const routes: RouteRecordRaw[] = [
  { path: "/", component: () => import("./pages/HomePage.vue") },
  { path: "/404", component: NotFound },
  { path: "/:missing(.*)*", component: NotFound },
];
