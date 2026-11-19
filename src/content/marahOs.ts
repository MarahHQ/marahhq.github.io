// Marah OS: what it is, the three steps, the checksums and four cards about living with it.
// HTML where a line holds a link or code.
export const marahOs = {
  eyebrow: "Marah OS",
  title: "Turn a spare PC",
  accent: "into a game console.",
  lead: "Marah OS is a small Linux system, built on Fedora with bootc. Marah Launcher is the whole screen: turn the PC on and your games are there, with no desktop and no password to type.",
  cta: "Get the USB stick image",
  needsLink: "What my PC needs",
  check: {
    title: "Check the download",
    text: "Join the parts first. Keep the ISO's <code>.sha256</code> file beside the ISO, then run the command for your system. Linux and macOS print <code>OK</code> when the ISO is whole.",
    windowsNote: "Then compare the hash with the one in the <code>.sha256</code> file.",
    sumFile: "marah-os-x86_64-*.iso.sha256",
    isoFile: "marah-os-x86_64-<version>.iso",
    partsTitle: "Each part's SHA-256, as GitHub has it:",
    wholeTitle: "The ISO's SHA-256, as GitHub has it:",
    linkLead: "The ISO's SHA-256 file:",
    linkText: "on the latest release",
  },
  steps: [
    {
      title: "Put it on a USB stick.",
      text: 'Any stick of 4&nbsp;GB or more. The release has the image, sometimes in parts: download every part and join them, as <a href="https://github.com/MarahHQ/marah-os#readme">the README shows</a>. Then write the ISO to the stick with <a href="https://etcher.balena.io/">balenaEtcher</a> or <a href="https://github.com/FedoraQt/MediaWriter">Fedora Media Writer</a>.',
    },
    {
      title: "Start the PC from the stick.",
      text: "Press the boot menu key as the PC starts (often F12, F11, F8 or Esc) and pick the stick. Marah OS runs from it. Nothing on the PC changes.",
    },
    {
      title: "Try it, or install it.",
      text: "Play from the stick first if you like. To install, pick a disk of 40&nbsp;GB or more and wait a few minutes. From then on the PC starts straight into your games.",
    },
  ],
  sofa: {
    title: "Everything from the sofa",
    text: "Internet, Sound and Bluetooth are in Settings → System, with the system's updates. You set them up with the controller.",
    rows: [
      ["Internet", "Connected"],
      ["Sound", "TV (HDMI)"],
      ["Bluetooth", "Controller"],
      ["Marah OS updates", "Up to date"],
    ],
  },
  updates: {
    title: "Updates you never have to fear",
    text: "The system and Marah Launcher update together, as one image, in the background. An update waits for the next start, so it never stops a game. If an update breaks something, the version before it is still in the boot menu: hold Shift or Esc as the PC starts and pick it.",
    rows: [
      ["Marah OS", "the newest"],
      ["Marah OS", "the one before"],
    ],
  },
  needs: {
    title: "What your PC needs",
    rows: [
      { name: "Processor", text: "64-bit (x86-64). PS4 games need AVX2." },
      { name: "Graphics", text: "Vulkan 1.3, for PS4 and PS5 games. NVIDIA's driver is set up by itself." },
      {
        name: "To play well",
        text: "PS4: 8 threads, 8&nbsp;GB of memory, a 4&nbsp;GB graphics card. PS5: 12 threads, 16&nbsp;GB, an 8&nbsp;GB card.",
      },
      { name: "Disk", text: "40&nbsp;GB or more, and internet for games and updates." },
    ],
    note: "Marah Launcher checks your PC too: Settings → This PC says how each console's games should run.",
  },
  keep: {
    title: "Keep what you have",
    text: "Installing on a whole disk erases it, so keep your games on another one. To keep another system, or to use free space, pick <strong>Choose partitions instead</strong>: Fedora's installer does the rest.",
  },
};
