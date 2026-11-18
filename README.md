# marahhq.github.io

The Marah site, built with Astro and Tailwind CSS 4. A GitHub Actions workflow builds it, checks
it in a browser, and publishes `dist/` to GitHub Pages on each push to `main`.

## Work on it

You need Node.js 24. Astro sends usage data unless you turn it off: run
`npx astro telemetry disable` once, or set `ASTRO_TELEMETRY_DISABLED=1`.

```sh
npm ci            # the exact versions of package-lock.json
npm run dev       # a live preview while you edit
npm run build     # dist/: the site as GitHub Pages serves it
npm test          # the checks, on dist/ (they need Chrome for the browser part)
npm run check     # build, then test: what CI runs before it publishes
npm run format    # Prettier, which also sorts the Tailwind classes
```

## Files

- `src/pages/`: the pages. `index.astro` lists the sections in order; `404.astro` is the page for
  a missing address. Its paths start with `/`, because it is served at any depth.
- `src/layouts/Base.astro`: the frame of a page: the head, the header, `main` and the footer.
- `src/components/`:
  - `sections/`: one file per section of the page, from `Hero` to `Faq`. Lists such as the
    platforms, the downloads, the keys and the questions are data at the top of their file.
  - `ui/`: the parts the page repeats: `CopyButton`, `Commands`, `RepoItem`, `Chevron` and
    `ThemeIcons`. `HomeDemo` is the small live Home under the screenshots: real games from a
    library that Marah Launcher manages, with the real Home's picture behind them.
  - `Header.astro` and `Footer.astro`.
  - `ThemeHead.astro`: in the head of both pages. Its script sets the theme, dark or light, before
    the first paint: the visitor's choice, else the system's setting.
- `src/styles/site.css`: Tailwind's entry.
  - **The theme:** the logo's colours, the fonts (Ubuntu and Ubuntu Mono), the text sizes and the
    three widths.
  - **The light theme:** the same colour tokens with light values, through a `light` variant:
    `light:` in the markup, `@variant light` in the CSS. It applies under `[data-theme="light"]`,
    and also with JavaScript off when the system's setting is light. Write each light rule
    through it, never with `[data-theme="light"]` alone, or the no-JavaScript case loses it. The
    theme switches stay hidden with JavaScript off. Commands and code stay dark. Each text colour is at least 4.5:1 on each
    surface in both themes, and a test checks it. The page is
    written for a desktop first: `max-lg:` is up to 1200 px, `max-md:` up to 960 px, `max-sm:` up
    to 600 px.
  - **The base styles.**
  - **A few utilities of our own:** `wrap`, `eyebrow`, `pill`, `accent-text` and `hint`.
  - **The components:** the parts with states, pseudo-elements or SVG, such as the buttons, the
    download cards, the package panel, the controller drawing and the menu.
- `src/scripts/site.js`: the page's live parts. The page reads in full without it.
  - The menu, the scroll reveal, the screenshot switcher and the light on the download cards.
  - The tabs, the copy buttons, the download for the visitor's system, and the package panel.
  - Dark or light: the visitor's choice, kept in the browser, else the system's setting.
  - The example PCs of "Will it run?".
  - The Home demo: the arrow keys, the mouse or a tap move between the cards, and a pretend
    download shows in its top bar while the demo is on screen.
  - The latest version, date and sizes of Marah Launcher and Marah OS, read from GitHub's API and
    kept for an hour in the browser, and the SHA-256 that GitHub has for each part of the Marah OS
    ISO. The HTML has no version numbers, so it is never out of date.
  - The controller: a key, a click or a real controller lights what each button does.
  - All motion stops when the visitor asks for reduced motion.
- `astro.config.mjs`: the build. Astro bundles the stylesheet and the script into `dist/_astro/`
  with hashed names, so a browser never pairs a new page with an old cached file. The HTML keeps
  its whitespace as written: Astro 7's default trims it, which would join words and move the
  controller's labels.
- `public/`: copied as it is, so its URLs never change.
  - `assets/fonts/`: Ubuntu (`ubuntu-*.woff2`) for all text and Ubuntu Mono (`ubuntu-mono-*.woff2`)
    for commands and code, under the Ubuntu Font Licence (`UFL-Ubuntu.txt`). Latin-only subsets,
    with the box-drawing characters, made from google/fonts' TTF files with fontTools
    (`pyftsubset … --flavor=woff2`).
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

- **A state the script sets** (`.on`, `.open`, `aria-expanded`): style it in a component, or with
  a state variant such as `[&.on]:border-ice`. A plain utility on the same element beats the
  component's rule for that state.
- **A component's name** must not be a Tailwind utility. `outline` and `collapse` are both
  utilities. A test checks this.
- **Utility names** stay whole strings in the markup. Tailwind only finds a class it can read in
  `src/`, so never build a name in the script.
- **The controller's SVG** has `<!-- prettier-ignore -->`: Prettier would re-wrap its labels, and
  spaces inside SVG text show.
- **The controller's parts** each have a `data-part` (`cross`, `l2`, `dpad-up`, `ls`, `touchpad`
  and the rest), and site.js finds them by it. Each line's `data-for` names its part. The drawing is
  line art after a seeklogo drawing, with its brand logo taken out; a test checks that no shape
  sits where the logo was.

The facts on the page come from the launcher and OS repositories. Change them there first:

- the keys: `docs/user-guide.md`;
- what a PC needs: each emulator's `plugin.toml` (`[requires]`), also the data at the top of
  `WillItRun.astro`;
- the words for how a game runs: `crates/core/src/view.rs` and `crates/core/src/hardware.rs`;
- the OS steps: the Marah OS README.
