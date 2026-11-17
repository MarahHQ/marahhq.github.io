// A small driver for headless Chrome over the DevTools protocol, and a static server for dist/.
// No packages: Node's own fetch, WebSocket and http. CI runs on ubuntu-latest, which has Chrome.
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2" };

/** Serves `root` on a free port; resolves to { url, close }. */
export function serve(root) {
  const server = createServer((req, res) => {
    let path = join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (existsSync(path) && statSync(path).isDirectory()) path = join(path, "index.html");
    if (!existsSync(path)) { res.writeHead(404, { "content-type": "text/html" }); res.end(readFileSync(join(root, "404.html"))); return; }
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
    res.end(readFileSync(path));
  });
  const close = () => {
    server.close();
    server.closeAllConnections(); // A browser's kept-alive connection would hold the process open.
  };
  return new Promise((done) => server.listen(0, "127.0.0.1", () => done({ url: `http://127.0.0.1:${server.address().port}/`, close })));
}

export const ANDROID = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36";
export const LINUX = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
export const chrome = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"].find((name) =>
  process.env.PATH.split(":").some((dir) => existsSync(join(dir, name))));

/** Ends Chrome and every process it started. */
function kill(proc) {
  try { process.kill(-proc.pid, "SIGKILL"); } catch { proc.kill("SIGKILL"); }
}

/** Starts Chrome and opens one page. GitHub's API is blocked: the page then shows its own text. */
export async function open({ reducedMotion = true } = {}) {
  const port = 9500 + Math.floor(Math.random() * 400);
  const args = ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "site-test-"))}`,
    "--hide-scrollbars", "--no-first-run", "--host-resolver-rules=MAP api.github.com 127.0.0.1:1", "about:blank"];
  if (reducedMotion) args.push("--force-prefers-reduced-motion");
  // Its own process group: closing it ends Chrome's helper processes too, not only the main one.
  const proc = spawn(chrome, args, { stdio: "ignore", detached: true });
  let tabs;
  for (let i = 0; i < 100 && !tabs?.length; i++) {
    try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  if (!tabs?.length) { kill(proc); throw new Error(`Chrome didn't answer on port ${port}`); }
  const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const waiting = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); waiting.get(d.id)?.(d); waiting.delete(d.id); };
  // Every message to Chrome gets an answer within 20 s, or the test fails: it never waits forever.
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id;
    const timer = setTimeout(() => { waiting.delete(n); reject(new Error(`Chrome didn't answer ${method} in 20 s`)); }, 20_000);
    waiting.set(n, (d) => { clearTimeout(timer); resolve(d); });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  await send("Runtime.enable");
  // The page counts as focused, as a visitor's would be: the clipboard needs it.
  await send("Emulation.setFocusEmulationEnabled", { enabled: true });
  return {
    send,
    /** Loads `url` at `width` CSS pixels, as a phone or a desktop browser. */
    async load(url, { width = 1440, ua = LINUX } = {}) {
      await send("Emulation.setUserAgentOverride", { userAgent: ua });
      await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
      await send("Browser.grantPermissions", { origin: new URL(url).origin, permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] });
      await send("Page.navigate", { url });
      await new Promise((r) => setTimeout(r, 1500));
    },
    /** Runs `expression` in the page and returns its value; a thrown error fails the test. */
    async run(expression) {
      const { result } = await send("Runtime.evaluate", { expression: `(async () => { ${expression} })()`, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
      return result.result.value;
    },
    close() { ws.close(); kill(proc); },
  };
}
