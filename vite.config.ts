// The site's build. `vite-ssg build` builds the app twice, for the browser and for Node, then
// renders each route to a static HTML file in dist/. public/ is copied as it is, so its URLs
// (/assets/...) never change; the bundled scripts and stylesheet go to dist/_app/, with hashed names.
import { rm } from "node:fs/promises";
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import type { ViteSSGOptions } from "vite-ssg";

const ssgOptions: ViteSSGOptions = {
  // The stylesheet stays a file of its own, never inlined into the page.
  beastiesOptions: false,
  formatting: "none",
  // vite-ssg reads the SSR manifest during the build; the site doesn't serve it.
  onFinished: () => rm("dist/.vite", { recursive: true, force: true }),
};

export default defineConfig({
  plugins: [
    vue({
      template: {
        // Keep the whitespace as written, as the HTML had it: Vue's default drops a gap made of a
        // line break between two elements, which joins words around inline elements such as <kbd>.
        compilerOptions: { whitespace: "preserve" },
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    // Not "assets": that folder is public/assets/, whose files keep their names.
    assetsDir: "_app",
  },
  ssgOptions,
});
