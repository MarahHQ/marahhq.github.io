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
  - `ui/`: the parts the page repeats: `CopyButton`, `Commands`, `RepoItem` and `Chevron`.
  - `Header.astro` and `Footer.astro`.
- `src/styles/site.css`: Tailwind's entry.
  - **The theme:** the logo's colours, the fonts (Inter, and Outfit for headings), the text sizes
    and the three widths. The page is
    written for a desktop first: `max-lg:` is up to 1200 px, `max-md:` up to 960 px, `max-sm:` up
    to 600 px.
  - **The base styles.**
  - **A few utilities of our own:** `wrap`, `eyebrow`, `pill`, `accent-text` and `hint`.
  - **The components:** the parts with states, pseudo-elements or SVG, such as the buttons, the
    download cards, the package panel, the controller drawing and the menu.
- `src/scripts/site.js`: the page's live parts. The page reads in full without it.
  - The menu, the scroll reveal, the screenshot switcher and the light on the download cards.
  - The tabs, the copy buttons, the download for the visitor's system, and the package panel.
  - The latest version, date and sizes of Marah Launcher and Marah OS, read from GitHub's API and
    kept for an hour in the browser. The HTML has no version numbers, so it is never out of date.
  - The controller: a key, a click or a real controller lights what each button does.
  - All motion stops when the visitor asks for reduced motion.
- `astro.config.mjs`: the build. Astro bundles the stylesheet and the script into `dist/_astro/`
  with hashed names, so a browser never pairs a new page with an old cached file. The HTML keeps
  its whitespace as written: Astro 7's default trims it, which would join words and move the
  controller's labels.
- `public/`: copied as it is, so its URLs never change.
  - `assets/fonts/`: Latin-only subsets, made with fontTools (`pyftsubset … --flavor=woff2`), each
    under the SIL Open Font License:
    - Inter (`inter-*.woff2`, `OFL-Inter.txt`), the text: the Default theme's own TTF files.
    - Outfit (`outfit.woff2`, `OFL-Outfit.txt`), the headings and the logo's name: the variable
      font from google/fonts. `--font-display` in `src/styles/site.css` picks it.
  - `assets/logo.svg` (animated) and `logo-static.svg`: the logo. `logo-mark.svg` is the gamepad
    alone.
  - `assets/icon-180.png`: the icon for a phone's home screen.
  - `assets/og.png`: the picture a shared link to the site shows, 1200 by 630.
  - `assets/mascot.webp`: the mascot.
  - `assets/screen-*.webp`: screenshots of Marah Launcher, from `docs/screenshots/` in the
    launcher repository.
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

The facts on the page come from the launcher and OS repositories. Change them there first:

- the keys: `docs/user-guide.md`;
- what a PC needs: each emulator's `plugin.toml` (`[requires]`);
- the OS steps: the Marah OS README.
