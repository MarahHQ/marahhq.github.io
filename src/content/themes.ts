import { links } from "./site";

// Themes: a theme file beside the Home it draws, and the login session. HTML where a line holds code.
export const themes = {
  eyebrow: "Themes",
  title: "Swap the whole look.",
  accent: "Keep your games.",
  lead: "A theme draws every screen: the layout, the colors, the fonts and the sounds. Marah Launcher comes with two, Default and Classic, and you can write your own: Slint files and a <code>theme.toml</code> beside them. A theme is data. It runs no code.",
  changes: ["Layout", "Colors", "Fonts", "Sounds", "Art"],
  write: { label: "Write a theme", href: `${links.launcherDocs}/themes.md` },
  guide: { label: "Read the user guide", href: `${links.launcherDocs}/user-guide.md#themes` },
  file: "themes/default/theme.toml",
  shotAlt: "The home screen that the Default theme draws: the list of systems on the right, All games in focus",
  caption: "A few lines of the Default theme, and the Home it draws.",
  session: {
    title: "The whole screen, with no desktop behind it",
    text: "The deb, rpm and Arch packages add a Marah Launcher session to the login screen. Pick it, and the launcher is all there is, as on a console.",
  },
};
