import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export { default as Tabs } from "./Tabs.vue";
export { default as TabsContent } from "./TabsContent.vue";
export { default as TabsList } from "./TabsList.vue";
export { default as TabsTrigger } from "./TabsTrigger.vue";

export const tabsListVariants = cva(
  // The site's look: a pill of tabs on the muted surface; the chosen tab is filled (`tab` in
  // src/styles/components.css).
  "group/tabs-list flex w-fit gap-1.5 self-start rounded-full border border-border p-1",
  {
    variants: {
      variant: {
        default: "bg-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type TabsListVariants = VariantProps<typeof tabsListVariants>;
