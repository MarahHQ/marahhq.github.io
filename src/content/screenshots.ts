// The screenshots the switcher shows, the first one by default.
export const screenshots = [
  {
    label: "Home",
    src: "/assets/screen-home.webp",
    alt: "The Marah Launcher home screen: a list of game sources on the right, with All games, Steam, PC, Nintendo Switch and PlayStation 5",
  },
  {
    label: "Library",
    src: "/assets/screen-library.webp",
    alt: "The Library: a grid of game covers from Steam, PC, Switch and PS5, with search, sort and genre filters above them",
  },
  {
    label: "Game page",
    src: "/assets/screen-hub.webp",
    alt: "A game's page: its cover, a Play button, how well it runs on this PC, its size and screenshots",
  },
  {
    label: "Settings",
    src: "/assets/screen-settings.webp",
    alt: "The Settings screen on one page: a rail of section icons, the Games section with its folders and a Rescan button, then Downloads",
  },
] as const;
