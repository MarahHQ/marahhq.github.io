import { links } from "./site";

// Get it: two ways in, the launcher (a download, a Linux command or a package) and Marah OS. HTML
// where a line holds code or a link.
export const getIt = {
  eyebrow: "Get it",
  title: "Two ways in.",
  lead: "An app for the computer you have, or a whole PC that starts into your games.",
  launcher: {
    title: "Marah Launcher",
    lead: "An app for Linux, macOS and Windows. Your desktop stays as it is.",
    tabsLabel: "How to get Marah Launcher",
    filesLabel: "Every system",
    sumsHint: `Every file, with its SHA-256: <a href="${links.launcherLatest}">the latest release</a>.`,
    packagesHint:
      'Install from a repository, and Marah Launcher updates with the rest of your system. The repositories\' metadata is signed with <a href="https://marahhq.github.io/packages/marah.asc">this key</a>.',
    terminalHint:
      "Installs for you only, with no sudo, in <code>~/.local/lib/marah-launcher</code>. <code>install.sh --uninstall</code> removes it.",
    ticks: ["Updates itself"],
  },
  os: {
    title: "Marah OS",
    lead: "The whole PC becomes the console. Try it from a USB stick first.",
    steps: [
      "Download the image and write it to a USB stick",
      "Start the PC from the stick",
      "Play from the stick, or install it",
    ],
    cta: "Get the USB stick image",
    more: "How it works",
    ticks: ["Updates itself, the whole system"],
  },
};
