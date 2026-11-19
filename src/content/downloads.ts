import { links } from "./site";

// Each file has the same name in every release, so the link always gives the latest.
export const downloads = [
  { name: "Windows", note: "Installer, x86-64", file: "marah-launcher-windows-x86_64-setup.exe" },
  { name: "macOS", note: "Apple Silicon and Intel", file: "marah-launcher-macos-universal.dmg" },
  { name: "Linux", note: "AppImage, x86-64", file: "Marah-Launcher-x86_64.AppImage" },
  { name: "Linux", note: "Archive with install.sh, x86-64", file: "marah-launcher-linux-x86_64.tar.gz" },
].map((d) => ({ ...d, href: `${links.launcherDownload}${d.file}` }));

// The download a visitor's system gets on the Get it card, by its user agent. Phones and unknown
// systems get none: the card's list of every system is all they see.
export function downloadFor(userAgent: string): { label: string; file: string } | null {
  if (/Android|iPhone|iPad/.test(userAgent)) return null;
  if (/Windows/.test(userAgent)) return { label: "Windows", file: "marah-launcher-windows-x86_64-setup.exe" };
  if (/Mac OS X|Macintosh/.test(userAgent)) return { label: "macOS", file: "marah-launcher-macos-universal.dmg" };
  if (/Linux|X11/.test(userAgent)) return { label: "Linux (AppImage)", file: "Marah-Launcher-x86_64.AppImage" };
  return null;
}

// The Linux command on the Get it card.
export const installCommand =
  "curl -fsSL https://github.com/MarahHQ/marah-launcher/releases/latest/download/marah-launcher-linux-x86_64.tar.gz | tar xz && ./marah-launcher-linux-x86_64/install.sh";

// The packages repository's own commands (MarahHQ/packages). `intro` is HTML above the commands.
export const repos = [
  {
    id: "dnf",
    name: "Fedora",
    manager: "DNF",
    commands: `sudo curl -fsSLo /etc/yum.repos.d/marah.repo https://marahhq.github.io/packages/rpm/marah.repo
sudo dnf install marah-launcher`,
  },
  {
    id: "apt",
    name: "Debian and Ubuntu",
    manager: "APT",
    commands: `sudo curl -fsSLo /usr/share/keyrings/marah.asc https://marahhq.github.io/packages/marah.asc
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/marah.asc] https://marahhq.github.io/packages/deb stable main" |
  sudo tee /etc/apt/sources.list.d/marah.list
sudo apt update && sudo apt install marah-launcher`,
  },
  {
    id: "pacman",
    name: "Arch Linux",
    manager: "pacman",
    intro: `There is no repository yet. Download the <code>.pkg.tar.zst</code> file from
<a href="${links.launcherLatest}">the latest release</a>, then install it:`,
    commands: "sudo pacman -U ./marah-launcher-*-x86_64.pkg.tar.zst",
  },
];
