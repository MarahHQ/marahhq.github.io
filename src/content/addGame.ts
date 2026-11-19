// Add a game by hand: a PC game's folder, and the files that tell Marah Launcher about it. The
// facts come from the launcher's docs/user-guide.md ("Adding a PC game by hand") and
// docs/reference/archives-and-pc-games.md. A step's `text` is HTML.
import { links } from "./site";

export const referenceUrl = `${links.launcherDocs}/reference/archives-and-pc-games.md`;

export const tree = `My Game/
├── start.sh
├── MyGame.x86_64
├── MyGame.exe
├── launcher_game.json
└── launcher_art/
    ├── cover.jpg
    ├── background.jpg
    ├── logo.png
    └── screenshot_1.jpg`;

export const gameFile = `{
  "format": 1,
  "title": "My Game",
  "description": "A short line about the game.",
  "genres": ["Puzzle"],
  "release": "2026-03-14",
  "starts": [
    { "kind": "script", "path": "start.sh" },
    { "kind": "native", "path": "MyGame.x86_64" },
    { "kind": "windows", "path": "MyGame.exe" }
  ],
  "art": {
    "cover": "launcher_art/cover.jpg",
    "background": "launcher_art/background.jpg",
    "logo": "launcher_art/logo.png",
    "screenshots": ["launcher_art/screenshot_1.jpg"]
  }
}`;

export const startScript = `#!/bin/sh
# Starts the game from its own folder, in full screen.
cd "$(dirname "$0")"
exec ./MyGame.x86_64 --fullscreen`;

export const steps = [
  {
    title: "Copy the game's folder into PC/",
    text: "In a game folder: <code>~/Games/PC/</code> unless you chose others in Settings → Games. One folder is one game. A game that is already unpacked needs no install.",
  },
  {
    title: "Give it a cover, if you like",
    text: "Put <code>cover.jpg</code>, <code>cover.png</code> or <code>cover.webp</code> in the game's folder.",
  },
  {
    title: "Rescan",
    text: "In Settings → Games, choose <b>Rescan game folders</b>. Marah Launcher looks through the folder, finds every file that can start the game, and writes <code>launcher_game.json</code> beside them.",
  },
  {
    title: "Or write that file yourself",
    text: 'Name the game, choose what starts it, best first, and point to its art in <code>launcher_art/</code>. Keep <code>"format": 1</code>: a file without it is skipped.',
  },
  {
    title: "Start it your way, on Linux",
    text: "A <code>start.sh</code> runs first when it is listed first. A script without <code>#!</code> runs with <code>sh</code>.",
  },
];
