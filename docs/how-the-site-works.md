# How the site works

This page has the file map and the rules that keep the page working. The
[README](../README.md) has the commands, the deploy and how to add a component.

## Files

- `index.html`: the head that both pages share. Its first script sets the theme, dark or light,
  before the first paint: the visitor's choice, else the system's setting. It also marks the page
  for the scroll reveal.
- `src/main.ts`: the app's entry. It hydrates the prerendered HTML in a build only.
- `src/routes.ts`: the two pages, `/` and `/404`, and a catch-all that shows the 404 page.
- `src/App.vue`: the root. It marks the page as hydrated once it runs (`useHydrated`).
- `src/pages/HomePage.vue`: the sections in order, and the page's head tags.
- `src/pages/NotFoundPage.vue`: the page for a missing address. Its paths start with `/`, because
  GitHub Pages serves it at any depth.
- `src/layouts/SiteLayout.vue`: the skip link, the header, `main`, the footer and Back to top. It
  also starts the release fetch (`loadReleases`).
- `src/content/`: the words and lists of the page, one file per section.
- `src/components/`:
  - `sections/`: one component per section, from `HeroSection` to `FaqSection`. Also the parts
    that only one section uses: `HomeDemo` (the small live Home screen) and `ControllerDrawing`
    (the controller's SVG).
  - `layout/`: the header with the phone's menu, the footer, the theme switch and Back to top.
  - `common/`: `CopyButton`, `CommandBlock`, `CodeCard` and `RichText`.
  - `icons/`: the site's own SVG icons.
  - `ui/`: the shadcn-vue components.
- `src/composables/`: the theme (`useTheme`), the latest releases (`useReleases`), the header's
  scroll state (`usePageScroll`), `useHydrated`, and the check for a visitor who asks for less motion (`motion.ts`).
- `src/directives/reveal.ts`: `v-reveal`, which fades a part up as it comes into view.
- `src/lib/`: `cn`, the class helper of the shadcn-vue components (`utils.ts`), and the
  "Will it run?" verdicts (`verdict.ts`).
- `src/style.css`: Tailwind's entry and the theme: the fonts, the text sizes, the three page
  widths, and the dark theme's colours as CSS variables in the shadcn format (`--background`,
  `--foreground`, `--primary` and the rest, plus the site's own, such as `--night` and `--edge`).
- `src/styles/`: the base styles with the light theme's colours (`base.css`), the components
  (`components.css`), the motion (`motion.css`), and shadcn-vue's state variants (`shadcn.css`).
- `public/`: Vite copies it as it is, so its URLs never change.
  - `assets/fonts/`: Ubuntu for all text and Ubuntu Mono for commands and code. Latin-only
    subsets, with the box-drawing characters.
  - `assets/logo.svg` (animated) and `assets/logo-static.svg`: the logo. `logo-mark.svg` is the
    gamepad alone.
  - `assets/icon-180.png`: the icon for a phone's home screen.
  - `assets/og.png`: the share card, 1200 by 630 pixels.
  - `assets/mascot.webp`: the mascot.
  - `assets/screen-*.webp`: screenshots of Marah Launcher.
  - `assets/demo/*.webp`: the covers in the Home demo.
- `tests/`: the tests, with Node's test runner and headless Chrome.

## Rules that keep the page working

### The HTML is the page without JavaScript

The server render shows every panel open and every answer shown. It hides the parts that need a
script with `:hidden="!hydrated"`. Once the app runs, it folds the panels in `onMounted`.

Set a value that only the browser knows in `onMounted` too: the time, the visitor's system, the
stored theme. Else the server's HTML and the browser's first render differ, and the hydration
fails to match.

### Write each light rule through the `light` variant

The light theme applies under `[data-theme="light"]`. With JavaScript off, it also applies when
the system's setting is light. The `light` variant in `src/style.css` covers both cases. So write
each light rule as `@variant light` in CSS, or `light:` on a class. Never write
`[data-theme="light"]` alone, or a visitor without JavaScript loses the rule. `dark:` is the
opposite variant.

Commands, code and the Home demo stay dark in both themes.

The page is written for a desktop first. `max-lg:` is up to 1200 px, `max-md:` up to 960 px, and
`max-sm:` up to 600 px.

### Keep Tailwind class names whole

Tailwind only finds a class that it can read as a whole string in `src/`. Never build a class name
in a script.

A component's class name in `src/styles/` must not be a Tailwind utility. For example, `outline`
and `collapse` are both utilities. A test checks this.

### Templates keep their whitespace

`vite.config.ts` sets `whitespace: "preserve"`. Vue's default drops a line break between two
elements, which joins the words around inline elements such as `<kbd>`.

### The controller's drawing

`ControllerDrawing.vue` has `<!-- prettier-ignore -->`, because Prettier would re-wrap its labels,
and spaces inside SVG text show. Each part has a `data-part` (`cross`, `l2`, `dpad-up` and the
rest), and each line's `data-for` names its part. The drawing has no brand logo, and a test checks
that no shape sits where the logo was.
