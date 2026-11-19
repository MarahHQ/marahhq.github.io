// The Home demo's games: real ones from a library that Marah Launcher manages, with their titles,
// folder sizes and official cover art, here to show the launcher. `cover` is in
// public/assets/demo/, 360 px wide. `tint` is a colour from the cover, for the picture behind.
// `state` is "ready", or "get" for a game that downloads.
export interface DemoGame {
  title: string;
  system: string;
  size: string;
  cover: string;
  tint: string;
  state: "ready" | "get";
}

export const games: DemoGame[] = [
  {
    title: "Mario Kart World",
    system: "Switch",
    size: "23.2 GB",
    cover: "mario-kart-world",
    tint: "#e40716",
    state: "ready",
  },
  {
    title: "Hollow Knight: Silksong",
    system: "PS5",
    size: "8.4 GB",
    cover: "hollow-knight-silksong",
    tint: "#a81a1d",
    state: "ready",
  },
  {
    title: "Teenage Mutant Ninja Turtles: Shredder's Revenge",
    system: "PS4",
    size: "983 MB",
    cover: "tmnt-shredders-revenge",
    tint: "#f1ca65",
    state: "ready",
  },
  { title: "World of Goo 2", system: "PC", size: "937 MB", cover: "world-of-goo-2", tint: "#ac517c", state: "ready" },
  {
    title: "Sonic Racing: CrossWorlds",
    system: "PS5",
    size: "14.2 GB",
    cover: "sonic-racing-crossworlds",
    tint: "#3b6fd8",
    state: "ready",
  },
  {
    title: "Hot Wheels Monster Trucks: Stunt Mayhem",
    system: "PS4",
    size: "9.2 GB",
    cover: "hot-wheels-monster-trucks",
    tint: "#ddad59",
    state: "get",
  },
  {
    title: "Donkey Kong Bananza",
    system: "Switch",
    size: "8.9 GB",
    cover: "donkey-kong-bananza",
    tint: "#e40f1b",
    state: "ready",
  },
  {
    title: "Command & Conquer: Red Alert 2",
    system: "PC",
    size: "5.1 GB",
    cover: "red-alert-2",
    tint: "#c95534",
    state: "get",
  },
];
