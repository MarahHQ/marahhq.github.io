# marahhq.github.io

The Marah site. Tailwind CSS 4 builds its stylesheet. A GitHub Actions workflow builds the site,
checks it in a browser, and publishes `dist/` to GitHub Pages on each push to `main`.

## Work on it

You need Node.js 24.

```sh
npm ci            # the exact versions of package-lock.json
npm run build     # dist/: the site as GitHub Pages serves it
npm test          # the checks, on dist/ (they need Chrome for the browser part)
npm run check     # build, then test: what CI runs before it publishes
npm run format    # Prettier, which also sorts the Tailwind classes
```

To look at it, serve `dist/` with any static server, for example `python3 -m http.server -d dist`.

## Files

- `src/index.html`: the page. Layout, spacing and type are Tailwind utilities in the markup.
- `src/404.html`: the page for a missing address. Its paths start with `/`, because it is served
  at any depth.
- `src/site.css`: Tailwind's entry.
  - **The theme:** the logo's colours, Inter, the text sizes and the three widths. The page is
    written for a desktop first: `max-lg:` is up to 1200 px, `max-md:` up to 960 px, `max-sm:` up
    to 600 px.
  - **The base styles.**
  - **A few utilities of our own:** `wrap`, `eyebrow`, `pill`, `accent-text` and `hint`.
  - **The components:** the parts with states, pseudo-elements or SVG, such as the buttons, the
    download cards, the package panel, the controller drawing and the menu.
- `src/site.js`: the page's live parts. The page reads in full without it.
  - The menu, the scroll reveal, the screenshot switcher and the light on the download cards.
  - The Download and Linux terminal tabs, the copy buttons, the download for the visitor's
    system, and the package panel.
  - The latest version, date and sizes of Marah Launcher and Marah OS, read from GitHub's API and
    kept for an hour in the browser. The HTML has no version numbers, so it is never out of date.
  - The controller: a key, a click or a real controller lights what each button does.
  - All motion stops when the visitor asks for reduced motion.
- `scripts/build.mjs`: runs Tailwind, and gives the stylesheet and the script a hash of their
  content in their names (`site.1a2b3c4d.css`). A browser then never pairs a new page with an
  old cached file.
- `tests/`: the checks, with Node's own test runner and headless Chrome. No test packages.
- `assets/`: copied as they are.
  - `fonts/`: Inter in Latin only (`inter-*.woff2`), under the SIL Open Font License
    (`OFL-Inter.txt`). Made from the Default theme's TTF files with fontTools
    (`pyftsubset … --flavor=woff2`).
  - `logo.svg` (animated) and `logo-static.svg`: the logo. `logo-mark.svg` is the gamepad alone.
  - `icon-180.png`: the icon for a phone's home screen.
  - `og.png`: the picture a shared link to the site shows, 1200 by 630.
  - `mascot.webp`: the mascot.
  - `screen-*.webp`: screenshots of Marah Launcher, from `docs/screenshots/` in the launcher
    repository.

## Rules that keep it working

- **A state the script sets** (`.on`, `.open`, `aria-expanded`): style it in a component, or with
  a state variant such as `[&.on]:border-ice`. A plain utility on the same element beats the
  component's rule for that state.
- **A component's name** must not be a Tailwind utility. `outline` and `collapse` are both
  utilities. A test checks this.
- **Utility names** stay whole strings in the HTML. Tailwind only finds a class it can read in
  `src/`, so never build a name in the script.

The facts on the page come from the launcher and OS repositories. Change them there first:

- the keys: `docs/user-guide.md`;
- what a PC needs: each emulator's `plugin.toml` (`[requires]`);
- the OS steps: the Marah OS README.
