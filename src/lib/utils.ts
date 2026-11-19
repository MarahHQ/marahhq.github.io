// shadcn-vue's class helper, `cn`. Here it only joins class names (strings, arrays and objects,
// as Vue's own class binding does): the merging of clashing Tailwind utilities that shadcn-vue's
// default brings would add about 12 kB (gzip) of tables to every page. The site's copies of the
// components don't rely on it: to change a component's look, change its own classes in
// src/components/ui/ rather than override them from outside.
import { normalizeClass } from "vue";

export type ClassValue = string | Record<string, unknown> | ClassValue[] | null | undefined | false;

export function cn(...inputs: ClassValue[]): string {
  return normalizeClass(inputs);
}
