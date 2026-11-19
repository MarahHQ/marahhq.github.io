// The latest versions, dates and sizes of Marah Launcher and Marah OS, read from GitHub's API and
// kept for an hour in the browser, and the SHA-256 that GitHub has for each part of the Marah OS
// ISO. The page carries no version numbers, so it is never wrong without this. GitHub allows 60
// calls an hour per visitor; the hour's cache keeps it to two.
import { computed, reactive } from "vue";

export interface Release {
  tag: string;
  date: string;
  /** Each file's size in bytes, by name. */
  assets: Record<string, number>;
  /** GitHub's own SHA-256 of each file, "sha256:<hex>", where it has one. */
  digests: Record<string, string>;
}

const state = reactive<{ launcher: Release | null; os: Release | null }>({ launcher: null, os: null });
let started = false;

export const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
export const size = (bytes: number) =>
  bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.round(bytes / 1e6)} MB`;

async function latest(repo: string): Promise<Release> {
  const key = `marah-release-${repo}`;
  try {
    const kept = JSON.parse(localStorage.getItem(key) || "null");
    // A release kept before the page read the digests is read again.
    if (kept?.release?.digests && Date.now() - kept.at < 36e5) return kept.release;
  } catch {
    // A broken or blocked store: read GitHub instead.
  }
  const res = await fetch(`https://api.github.com/repos/MarahHQ/${repo}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(String(res.status));
  const body = (await res.json()) as {
    tag_name: string;
    published_at: string;
    assets?: { name: string; size: number; digest?: string }[];
  };
  const assets = body.assets ?? [];
  const release: Release = {
    tag: body.tag_name,
    date: body.published_at,
    assets: Object.fromEntries(assets.map((a) => [a.name, a.size])),
    digests: Object.fromEntries(assets.filter((a) => a.digest).map((a) => [a.name, a.digest as string])),
  };
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), release }));
  } catch {
    // Not kept: the next visit reads GitHub again.
  }
  return release;
}

/** Reads both releases once per page load. Call it in the browser only. */
export function loadReleases() {
  if (started) return;
  started = true;
  latest("marah-launcher")
    .then((r) => (state.launcher = r))
    .catch(() => {});
  latest("marah-os")
    .then((r) => (state.os = r))
    .catch(() => {});
}

const ISO_PART = /\.iso(\.part-[a-z]+)?$/;

export function useReleases() {
  const launcherLine = computed(() => {
    const r = state.launcher;
    return r ? `${r.tag} · ${day(r.date)}` : "The latest release";
  });
  /** The ISO's files, whole or in parts, with their sizes; not the checksums. */
  const isoFiles = computed(() => Object.entries(state.os?.assets ?? {}).filter(([name]) => ISO_PART.test(name)));
  const osLine = computed(() => {
    const r = state.os;
    if (!r) return "The latest release";
    const total = isoFiles.value.reduce((sum, [, bytes]) => sum + bytes, 0);
    return `${r.tag} · ${total ? `${size(total)} · ` : ""}${day(r.date)}`;
  });
  const launcherSize = (file: string) => {
    const bytes = state.launcher?.assets[file];
    return bytes ? size(bytes) : "";
  };
  // Marah OS's checksums: the .sha256 file, the ISO's name, and the SHA-256 GitHub has for the
  // ISO or for each of its parts. The joined ISO is not on the release, so its SHA-256 is only in
  // the .sha256 file.
  const osSums = computed(() => {
    const r = state.os;
    if (!r) return null;
    const sumFile = Object.keys(r.assets).find((name) => /\.iso\.sha256$/.test(name)) ?? null;
    const isoName = sumFile
      ? sumFile.slice(0, -".sha256".length)
      : (isoFiles.value.find(([name]) => /\.iso$/.test(name))?.[0] ?? null);
    const hashes = isoFiles.value
      .map(([name]) => [name, r.digests[name] ?? ""] as const)
      .filter(([, digest]) => /^sha256:[0-9a-f]{64}$/.test(digest))
      .map(([name, digest]) => ({ name, hash: digest.slice("sha256:".length) }));
    const whole = hashes.length === 1 && hashes[0]?.name === isoName;
    const sumUrl = sumFile
      ? `https://github.com/MarahHQ/marah-os/releases/download/${encodeURIComponent(r.tag)}/${sumFile}`
      : null;
    return { sumFile, isoName, hashes, whole, sumUrl };
  });
  return { state, launcherLine, osLine, launcherSize, osSums };
}
