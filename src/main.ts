// The app's entry. vite-ssg renders each route to HTML at build time, then the same app hydrates
// that HTML in the browser.
import { ViteSSG } from "vite-ssg";
import App from "./App.vue";
import { routes } from "./routes";
import "./style.css";

// Hydrate the prerendered HTML in a build; `npm run dev` serves no HTML to hydrate.
export const createApp = ViteSSG(App, { routes }, undefined, { hydration: import.meta.env.PROD });
