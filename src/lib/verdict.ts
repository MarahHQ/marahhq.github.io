// The launcher's verdict for one PC and one emulator, in the order hardware.rs checks: what stops
// the games first, then the first reason they would be slow.
import type { Emulator, Pc } from "@/content/willItRun";

export type Level = "good" | "slow" | "no";
export interface Verdict {
  name: string;
  level: Level;
  headline: string;
  why: string;
}
export interface PcResult extends Pc {
  rows: Verdict[];
  /** The notice the launcher posts once for a PC that can't run a console's games, or "". */
  notice: string;
}

export function verdict(pc: Pc, emu: Emulator): Verdict {
  const { name } = emu;
  if (pc.vulkan < emu.vulkan) return { name, level: "no", headline: "Won't start", why: `No Vulkan ${emu.vulkan}` };
  if (emu.avx2 && !pc.avx2) return { name, level: "no", headline: "Won't start", why: "No AVX2 in the processor" };
  const why =
    emu.discrete && !pc.discrete
      ? "Integrated GPU"
      : pc.gpuMemory !== null && pc.gpuMemory < emu.gpuMemory
        ? `${Math.round(pc.gpuMemory)} GB GPU`
        : pc.threads < emu.threads
          ? `${pc.threads}-thread CPU`
          : pc.memory < emu.memory
            ? `${Math.round(pc.memory)} GB RAM`
            : "";
  return why
    ? { name, level: "slow", headline: "May run slowly", why }
    : { name, level: "good", headline: "Should run well", why };
}

export function results(pcs: Pc[], emulators: Emulator[]): PcResult[] {
  return pcs.map((pc) => {
    const rows = emulators.map((emu) => verdict(pc, emu));
    const blocked = rows.filter((row) => row.level === "no");
    const notice = blocked.length
      ? `This PC can't run ${blocked.map((row) => row.name).join(" or ")} games: ${[...new Set(blocked.map((row) => row.why))].join(", ")}`
      : "";
    return { ...pc, rows, notice };
  });
}
