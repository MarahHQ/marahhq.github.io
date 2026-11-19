// The site's own facts: its address, its title and description, and the links used across pages.
export const site = {
  url: "https://marahhq.github.io/",
  name: "Marah Launcher",
  title: "Marah Launcher: all your games, one launcher",
  description:
    "Marah Launcher puts your games from emulators, PC folders and Steam in one library, played on the TV with a controller. Marah OS starts straight into it.",
  ogDescription:
    "Games from emulators, PC folders and Steam in one library, played on the TV with a controller. Free software for Linux, macOS and Windows.",
  ogImage: "https://marahhq.github.io/assets/og.png",
  ogImageAlt: "Marah Launcher: all your games, one launcher. The home screen, beside the logo.",
  notFoundTitle: "Page not found · Marah Launcher",
} as const;

export const links = {
  org: "https://github.com/MarahHQ",
  launcherRepo: "https://github.com/MarahHQ/marah-launcher",
  launcherLicense: "https://github.com/MarahHQ/marah-launcher/blob/main/LICENSE",
  launcherLatest: "https://github.com/MarahHQ/marah-launcher/releases/latest",
  launcherDownload: "https://github.com/MarahHQ/marah-launcher/releases/latest/download/",
  launcherDocs: "https://github.com/MarahHQ/marah-launcher/blob/main/docs",
  osRepo: "https://github.com/MarahHQ/marah-os",
  osLatest: "https://github.com/MarahHQ/marah-os/releases/latest",
} as const;
