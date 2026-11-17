// Builds the site into dist/: Tailwind turns src/site.css into the stylesheet, and the stylesheet
// and the script get a hash of their content in their names (site.1a2b3c4d.css), which the pages
// link. A browser then never pairs a new page with an old cached file.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const out = "dist";
rmSync(out, { recursive: true, force: true });
mkdirSync(`${out}/assets`, { recursive: true });

const hash = (text) => createHash("sha256").update(text).digest("hex").slice(0, 8);
function emit(name, ext, text) {
  const file = `${name}.${hash(text)}.${ext}`;
  writeFileSync(`${out}/assets/${file}`, text);
  return file;
}

execFileSync("node_modules/.bin/tailwindcss", ["--input", "src/site.css", "--output", `${out}/site.css`, "--minify"], { stdio: "inherit" });
const css = emit("site", "css", readFileSync(`${out}/site.css`, "utf8"));
rmSync(`${out}/site.css`);
const js = emit("site", "js", readFileSync("src/site.js", "utf8"));

for (const page of ["index.html", "404.html"]) {
  const html = readFileSync(`src/${page}`, "utf8");
  const linked = html.replaceAll("assets/site.css", `assets/${css}`).replaceAll("assets/site.js", `assets/${js}`);
  if (linked === html) throw new Error(`${page} links neither assets/site.css nor assets/site.js`);
  writeFileSync(`${out}/${page}`, linked);
}

cpSync("assets", `${out}/assets`, { recursive: true });
writeFileSync(`${out}/.nojekyll`, "");
console.log(`built ${out}/: assets/${css}, assets/${js}`);
