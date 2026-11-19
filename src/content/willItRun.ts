// Will it run? The three answers a game's page gives: the community's list for PS4 (and PS5),
// ProtonDB for some PC games, and what this PC can do. The facts are the launcher's: the levels'
// words from crates/core/src/view.rs, the verdicts from crates/core/src/hardware.rs.

// How far a game gets, from the worst to the best, as the launcher words it.
export const levels = ["Doesn't start", "Boots", "Menus", "In-game", "Playable"];
export const exampleLevel = "In-game";

export interface Emulator {
  name: string;
  vulkan: number;
  avx2: boolean;
  threads: number;
  memory: number;
  gpuMemory: number;
  discrete: boolean;
}
export interface Pc {
  id: string;
  name: string;
  specs: string;
  threads: number;
  memory: number;
  avx2: boolean;
  vulkan: number;
  discrete: boolean;
  /** null for graphics that share the system's memory. */
  gpuMemory: number | null;
}

// What each console's emulator needs: its plugin.toml, [requires] and [requires.recommended].
export const emulators: Emulator[] = [
  { name: "PS4", vulkan: 1.3, avx2: true, threads: 8, memory: 7.0, gpuMemory: 3.5, discrete: true },
  { name: "PS5", vulkan: 1.3, avx2: false, threads: 12, memory: 14.5, gpuMemory: 7.5, discrete: true },
];

// Three example PCs.
export const pcs: Pc[] = [
  {
    id: "gaming",
    name: "Gaming PC",
    specs: "16 threads, 32 GB of memory, a graphics card of 12 GB",
    threads: 16,
    memory: 32,
    avx2: true,
    vulkan: 1.3,
    discrete: true,
    gpuMemory: 12,
  },
  {
    id: "laptop",
    name: "Thin laptop",
    specs: "8 threads, 16 GB of memory, graphics in the processor",
    threads: 8,
    memory: 16,
    avx2: true,
    vulkan: 1.3,
    discrete: false,
    gpuMemory: null,
  },
  {
    id: "older",
    name: "Older PC",
    specs: "4 threads, 8 GB of memory, a graphics card of 4 GB, a processor without AVX2",
    threads: 4,
    memory: 8,
    avx2: false,
    vulkan: 1.3,
    discrete: true,
    gpuMemory: 4,
  },
];
