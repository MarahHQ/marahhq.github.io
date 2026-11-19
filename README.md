# marahhq.github.io

The Marah site, built with Vue 3, shadcn-vue and Tailwind CSS 4. vite-ssg renders each page to
static HTML at build time, and the same Vue app then hydrates that HTML in the browser. A GitHub
Actions workflow builds it, checks it in a browser, and publishes `dist/` to GitHub Pages on each
push to `main`.

## Work on it

You need Node.js 24, and Chrome for the browser checks.

```sh
npm ci                # the exact versions of package-lock.json
npm run dev           # a live preview while you edit (rendered in the browser only)
npm run build         # dist/: the site as GitHub Pages serves it
npm test              # the checks, on dist/ (they need Chrome for the browser part)
npm run check         # type check, ESLint, Prettier, build, then test: what CI runs
npm run format        # Prettier, which also sorts the Tailwind classes
```

## The stack

- **Vite and Vue 3**, with `<script setup lang="ts">` and TypeScript in strict mode.
- **vite-ssg** prerenders `/` to `index.html` and `/404` to `404.html`. A visitor without
  JavaScript, a search engine and a link preview get the whole page as HTML.
- **shadcn-vue** on Reka UI: its CLI copied `Button`, `Accordion`, `Tabs` and `Sheet` into
  `src/components/ui/`. They are our code now, restyled to the site's look. Add another with
  `npx shadcn-vue@latest add <name>` (`components.json` has the settings). The state variants
  they use (`data-open:` and the rest) are a copy in `src/styles/shadcn.css`, so the build doesn't
  need the CLI's package.
- **Tailwind CSS 4**, through `@tailwindcss/vite`.
- **@unhead/vue** writes each page's title, description, canonical and Open Graph tags.

## Files

- `index.html`: the head both pages share. Its first script sets the theme, dark or light,
  before the first paint: the visitor's choice, else the system's setting. It also marks the
  page for the scroll reveal and the header's state.
- `src/main.ts`, `src/routes.ts`, `src/App.vue`: the app, its two pages, and the root. `App.vue`
  marks the page as live once it runs (`useHydrated`).
- `src/pages/`: `HomePage.vue` lists the sections in order and sets the head tags;
  `NotFoundPage.vue` is the page for a missing address. Its paths start with `/`, because it is
  served at any depth.
- `src/layouts/SiteLayout.vue`: the skip link, the header, `main`, the footer and Back to top.
- `src/content/`: the words and lists of the page, one file per section. Change the text here;
  the components only lay it out. A string that holds a link or `<code>` is HTML, shown by
  `RichText`.
- `src/components/`:
  - `sections/`: one component per section, from `HeroSection` to `FaqSection`, with the parts
    only one section uses: `HomeDemo` (the small live Home) and `ControllerDrawing` (the SVG).
  - `layout/`: the header (with the phone's menu), the footer, the theme switch, Back to top.
  - `common/`: `CopyButton`, `CommandBlock`, `CodeCard` and `RichText`.
  - `icons/`: the site's own SVG icons.
  - `ui/`: the shadcn-vue components.
- `src/composables/`: the theme (`useTheme`), the latest releases from GitHub (`useReleases`),
  the header's scroll state, and `useHydrated`.
- `src/directives/reveal.ts`: `v-reveal`, the fade-up as a part comes into view.
- `src/lib/`: `cn` (the class helper shadcn-vue's components use) and the "Will it run?"
  verdicts.
- `src/style.css`: Tailwind's entry and the theme: the colours as CSS variables in the shadcn
  format (`--background`, `--foreground`, `--card`, `--primary`, `--muted-foreground` and the
  rest, plus the site's own: `--night`, `--edge`, `--haze`...), the fonts, the text sizes and the
  three widths. `src/styles/` holds the base styles, the components and the motion.
- `public/`: copied as it is, so its URLs never change.
  - `assets/fonts/`: Ubuntu (`ubuntu-*.woff2`) for all text and Ubuntu Mono
    (`ubuntu-mono-*.woff2`) for commands and code, under the Ubuntu Font Licence
    (`UFL-Ubuntu.txt`). Latin-only subsets, with the box-drawing characters, made from
    google/fonts' TTF files with fontTools (`pyftsubset … --flavor=woff2`).
  - `assets/logo.svg` (animated) and `logo-static.svg`: the logo. `logo-mark.svg` is the gamepad
    alone.
  - `assets/icon-180.png`: the icon for a phone's home screen.
  - `assets/og.png`: the picture a shared link to the site shows, 1200 by 630.
  - `assets/mascot.webp`: the mascot.
  - `assets/screen-*.webp`: screenshots of Marah Launcher, from `docs/screenshots/` in the
    launcher repository.
  - `assets/demo/*.webp`: the Home demo's covers, the games' official art, 360 px wide, as the
    launcher downloads it for each game. They are here to show the launcher.
- `tests/`: the checks, with Node's own test runner and headless Chrome. No test packages.

## Rules that keep it working

- **The HTML is the page without JavaScript.** The server renders every panel open, every answer
  shown, both of the launcher's tabs and all three example PCs, and hides the parts that need the
  script (`:hidden="!hydrated"`). Once the app runs, it folds them in `onMounted`. A value that
  only the browser knows (the time, the visitor's system, the stored theme) is set in
  `onMounted` too, or the hydration doesn't match.
- **The light theme** goes through the `light` variant: `light:` in the markup, `@variant light`
  in the CSS. It applies under `[data-theme="light"]`, and also with JavaScript off when the
  system's setting is light. Write each light rule through it, never with `[data-theme="light"]`
  alone, or the no-JavaScript case loses it. `dark:` is its opposite. Commands, code and the Home
  demo stay dark. Each text colour is at least 4.5:1 on each surface in both themes, and a test
  checks it. The page is written for a desktop first: `max-lg:` is up to 1200 px, `max-md:` up
  to 960 px, `max-sm:` up to 600 px.
- **`cn` joins classes and doesn't merge them.** shadcn-vue's default merges clashing Tailwind
  classes, at about 12 kB (gzip) a page. To change a `ui/` component's look, change its own
  classes rather than override them from outside.
- **Whitespace is kept** as written in templates (`whitespace: "preserve"` in `vite.config.ts`):
  Vue's default would join words around inline elements such as `<kbd>`.
- **A component's class name** in `src/styles/` must not be a Tailwind utility. `outline` and
  `collapse` are both utilities. A test checks this.
- **Utility names** stay whole strings in the templates. Tailwind only finds a class it can read
  in `src/`, so never build a name in a script.
- **The controller's SVG** (`ControllerDrawing.vue`) has `<!-- prettier-ignore -->`: Prettier
  would re-wrap its labels, and spaces inside SVG text show. Each part has a `data-part`
  (`cross`, `l2`, `dpad-up`, `ls`, `touchpad` and the rest); each line's `data-for` names its
  part. The drawing is line art after a seeklogo drawing, with its brand logo taken out; a test
  checks that no shape sits where the logo was.

The facts on the page come from the launcher and OS repositories. Change them there first:

- the keys: `docs/user-guide.md` (here `src/content/controller.ts`);
- what a PC needs: each emulator's `plugin.toml` (`[requires]`), here
  `src/content/willItRun.ts`;
- the words for how a game runs: `crates/core/src/view.rs` and `crates/core/src/hardware.rs`;
- the OS steps: the Marah OS README.
