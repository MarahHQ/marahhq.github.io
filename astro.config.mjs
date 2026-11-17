// The site's build. Astro puts the pages in dist/ and the bundled stylesheet and script, with
// hashed names, in dist/_astro/. public/ is copied as it is, so its URLs never change.
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://marahhq.github.io",
  // Keep the HTML's whitespace as written: Astro 7's default trims it the JSX way, which joins
  // words around inline elements and moves the controller's SVG labels.
  compressHTML: false,
  build: {
    // The stylesheet is a file of its own, never inlined into the page.
    inlineStylesheets: "never",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
