// Whether the app runs in the browser yet. The prerendered HTML is the page as a visitor without
// JavaScript sees it; the parts that need the script (switches, tabs, folding panels) change once
// this turns true, in App.vue's onMounted. It is always false on the server.
import { readonly, ref } from "vue";

const hydrated = ref(false);

export function markHydrated() {
  hydrated.value = true;
}

export function useHydrated() {
  return readonly(hydrated);
}
