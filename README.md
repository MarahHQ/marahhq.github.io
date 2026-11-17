# marahhq.github.io

The Marah site, served by GitHub Pages from `main`. No build step.

- `index.html`: the page.
- `404.html`: the page for a missing address. Its paths start with `/`, because it is served at any depth.
- `assets/site.css`: the styles.
- `assets/site.js`: the page's live parts. The page reads in full without it.
  - The mobile menu, the scroll reveal, the screenshot switcher (it decodes each picture before a
    crossfade) and the light on the download cards.
  - The Download and Linux terminal tabs, the copy button, and the download for the visitor's system.
  - The latest version, date and sizes of Marah Launcher and Marah OS, read from GitHub's API and
    kept for an hour in the browser. The HTML has no version numbers, so it is never out of date.
  - The controller: a key, a click or a real controller lights what each button does in Marah Launcher.
  - All motion stops when the visitor asks for reduced motion.
- `assets/fonts/`: Inter, the Default theme's font, in Latin only (`inter-*.woff2`), under the SIL
  Open Font License (`OFL-Inter.txt`). Made from the theme's TTF files with fontTools
  (`pyftsubset … --flavor=woff2`).
- `assets/logo.svg` (animated) and `assets/logo-static.svg`: the logo.
- `assets/icon-180.png`: the icon for a phone's home screen.
- `assets/og.png`: the picture a shared link to the site shows, 1200 by 630.
- `assets/mascot.webp`: the mascot.
- `assets/screen-*.webp`: screenshots of Marah Launcher, from `docs/screenshots/` in the launcher repository.

The facts on the page come from the launcher and OS repositories. Change them there first:

- the keys: `docs/user-guide.md`;
- what a PC needs: each emulator's `plugin.toml` (`[requires]`);
- the OS steps: the Marah OS README.
