// A small driver for headless Chrome over the DevTools protocol, and a static server for dist/.
// The server answers a missing address with 404.html, as GitHub Pages does.
// No packages: Node's own fetch, WebSocket and http. CI runs on ubuntu-latest, which has Chrome.
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";

const TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

/** Serves `root` on a free port; resolves to { url, close }. */
export function serve(root) {
  const server = createServer((req, res) => {
    let path = join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (existsSync(path) && statSync(path).isDirectory()) path = join(path, "index.html");
    if (!existsSync(path)) {
      res.writeHead(404, { "content-type": "text/html" });
      res.end(readFileSync(join(root, "404.html")));
      return;
    }
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
    res.end(readFileSync(path));
  });
  const close = () => {
    server.close();
    server.closeAllConnections(); // A browser's kept-alive connection would hold the process open.
  };
  return new Promise((done) =>
    server.listen(0, "127.0.0.1", () => done({ url: `http://127.0.0.1:${server.address().port}/`, close })),
  );
}

export const ANDROID =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36";
export const LINUX =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
export const chrome = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"].find((name) =>
  process.env.PATH.split(":").some((dir) => existsSync(join(dir, name))),
);

/** Ends Chrome and every process it started. */
function kill(proc) {
  try {
    process.kill(-proc.pid, "SIGKILL");
  } catch {
    proc.kill("SIGKILL");
  }
}

/** Starts Chrome on a free port: it may take a while on a cold CI machine, so it gets 30 s, and
 * one more try on another port. Resolves to the process, its port and its first page. */
async function launch(reducedMotion) {
  for (let attempt = 1; ; attempt++) {
    const port = 9500 + Math.floor(Math.random() * 400);
    const args = [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${mkdtempSync(join(tmpdir(), "site-test-"))}`,
      "--hide-scrollbars",
      "--no-first-run",
      "--host-resolver-rules=MAP api.github.com 127.0.0.1:1",
      "about:blank",
    ];
    if (reducedMotion) args.push("--force-prefers-reduced-motion");
    // Its own process group: closing it ends Chrome's helper processes too, not only the main one.
    const proc = spawn(chrome, args, { stdio: "ignore", detached: true });
    let tabs;
    for (let i = 0; i < 300 && !tabs?.length; i++) {
      try {
        tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    const page = tabs?.find((t) => t.type === "page");
    if (page) return { proc, page };
    kill(proc);
    if (attempt === 2) throw new Error(`Chrome didn't start in 30 s, twice`);
  }
}

/** Starts Chrome and opens one page. GitHub's API is blocked: the page then shows its own text. */
export async function open({ reducedMotion = true } = {}) {
  const { proc, page } = await launch(reducedMotion);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const waiting = new Map();
  // The page's console errors and warnings, and its uncaught errors, since the last load.
  const problems = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.method === "Runtime.consoleAPICalled" && ["error", "warning", "assert"].includes(d.params.type))
      problems.push(`${d.params.type}: ${d.params.args.map((a) => a.value ?? a.description).join(" ")}`);
    if (d.method === "Runtime.exceptionThrown")
      problems.push(`uncaught: ${d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text}`);
    waiting.get(d.id)?.(d);
    waiting.delete(d.id);
  };
  // Every message to Chrome gets an answer within 20 s, or the test fails: it never waits forever.
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      const timer = setTimeout(() => {
        waiting.delete(n);
        reject(new Error(`Chrome didn't answer ${method} in 20 s`));
      }, 20_000);
      waiting.set(n, (d) => {
        clearTimeout(timer);
        resolve(d);
      });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  await send("Runtime.enable");
  // The page counts as focused, as a visitor's would be: the clipboard needs it.
  await send("Emulation.setFocusEmulationEnabled", { enabled: true });
  return {
    send,
    problems,
    /** Loads `url` at `width` CSS pixels, as a phone or a desktop browser. */
    async load(url, { width = 1440, ua = LINUX } = {}) {
      await send("Emulation.setUserAgentOverride", { userAgent: ua });
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: width < 600,
      });
      await send("Browser.grantPermissions", {
        origin: new URL(url).origin,
        permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"],
      });
      problems.length = 0;
      await send("Page.navigate", { url });
      await new Promise((r) => setTimeout(r, 1500));
    },
    /** Clicks the middle of the first element for `selector` (or a point) with the real mouse, as a visitor would. */
    async click(selector, { x, y } = {}) {
      if (selector) {
        const box = await this
          .run(`const e = document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({ block: "center", behavior: "instant" });
          const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }`);
        ({ x, y } = box);
      }
      for (const type of ["mouseMoved", "mousePressed", "mouseReleased"])
        await send("Input.dispatchMouseEvent", {
          type,
          x,
          y,
          button: "left",
          clickCount: type === "mouseMoved" ? 0 : 1,
        });
    },
    /** Runs `expression` in the page and returns its value; a thrown error fails the test. */
    async run(expression) {
      const { result } = await send("Runtime.evaluate", {
        expression: `(async () => { ${expression} })()`,
        awaitPromise: true,
        returnByValue: true,
      });
      if (result.exceptionDetails)
        throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
      return result.result.value;
    },
    close() {
      ws.close();
      kill(proc);
    },
  };
}
