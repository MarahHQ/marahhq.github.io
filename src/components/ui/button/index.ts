import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export { default as Button } from "./Button.vue";

// The site's two buttons: the ice gradient (`cta`) and the outline. The `icon` size is a round
// button for an icon without words. Their looks, with the hover glow and the light theme's
// colours, are the `cta` and `btn-outline` components in src/styles/components.css: the parts
// with pseudo-elements and states.
export const buttonVariants = cva("", {
  variants: {
    variant: {
      cta: "cta",
      outline: "btn-outline",
    },
    size: {
      default: "",
      small: "small",
      icon: "round",
    },
  },
  defaultVariants: {
    variant: "cta",
    size: "default",
  },
});
export type ButtonVariants = VariantProps<typeof buttonVariants>;
