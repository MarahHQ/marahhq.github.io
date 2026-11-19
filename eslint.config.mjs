// Lint: Vue's recommended rules and typescript-eslint's, for .vue and .ts files. Prettier does the
// formatting, so eslint-config-prettier turns off the rules that would fight it.
import pluginVue from "eslint-plugin-vue";
import { vueTsConfigs, withVueTs } from "@vue/eslint-config-typescript";
import prettier from "eslint-config-prettier/flat";

export default withVueTs(
  { ignores: ["dist/", "node_modules/", ".vite-ssg-temp/"] },
  pluginVue.configs["flat/recommended"],
  vueTsConfigs.recommended,
  {
    rules: {
      // An optional prop typed `?: T` is undefined when left out, on purpose.
      "vue/require-default-prop": "off",
    },
  },
  {
    // shadcn-vue's components keep their one-word names (Button, Sheet, Tabs).
    files: ["src/components/ui/**/*.vue"],
    rules: { "vue/multi-word-component-names": "off" },
  },
  prettier,
);
