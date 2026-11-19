// Dark or light. The head script in index.html already set data-theme on <html> before the first
// paint; this keeps the switches in step, keeps the visitor's choice, and follows the system's
// setting until there is one. Without JavaScript the CSS follows the system's setting alone.
import { computed, onMounted, onUnmounted, ref } from "vue";

export type Theme = "dark" | "light";
const STORAGE_KEY = "marah-theme";

// One theme for the whole page, shared by every switch. The server renders the dark labels.
const theme = ref<Theme>("dark");

function chosenTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function apply(next: Theme) {
  theme.value = next;
  document.documentElement.dataset.theme = next;
  // The browser bar's colour: each theme-color meta carries both colours.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((bar) => {
    bar.content = bar.dataset[next] ?? bar.content;
  });
}

export function useTheme() {
  const systemLight = typeof window === "undefined" ? null : matchMedia("(prefers-color-scheme: light)");
  const followSystem = () => chosenTheme() || apply(systemLight?.matches ? "light" : "dark");

  onMounted(() => {
    apply(chosenTheme() || (systemLight?.matches ? "light" : "dark"));
    systemLight?.addEventListener("change", followSystem);
  });
  onUnmounted(() => systemLight?.removeEventListener("change", followSystem));

  function toggle() {
    const next: Theme = theme.value === "light" ? "dark" : "light";
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // A browser that keeps nothing still switches, for this visit.
    }
  }

  // Each switch says the theme it switches to.
  const label = computed(() => `Switch to ${theme.value === "light" ? "dark" : "light"} theme`);
  return { theme, toggle, label };
}
