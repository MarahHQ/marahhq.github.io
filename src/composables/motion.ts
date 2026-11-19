// Whether the visitor asks for less motion, read when it's needed: the setting can change.
export function prefersReducedMotion(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}
