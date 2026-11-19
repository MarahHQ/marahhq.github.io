// The four things it is, in the strip under the hero. `icon` names a drawing in FeatureIcon.vue.
export const features = [
  { icon: "library", title: "One library", text: "Games from emulators, PC folders and Steam, in one place." },
  {
    icon: "controller",
    title: "Made for a controller",
    text: "Every screen works with a pad. A keyboard and a mouse work too.",
  },
  {
    icon: "palette",
    title: "Themes you can swap",
    text: "The screens are Slint themes. A theme changes the whole layout.",
  },
  { icon: "code", title: "Free software", text: "GPL-3.0-or-later. Read the code, change it, share it." },
] as const;

export type FeatureIcon = (typeof features)[number]["icon"];
