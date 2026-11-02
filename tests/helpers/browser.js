// tests/helpers/browser.js — the game in a real browser.
//
// A tiny web server for the repository, which also serves a harness page.
// Headless Chrome (or Edge) opens the harness, which loads the game in a frame,
// plays it as the scenario says, and leaves a JSON report in the page for
// --dump-dom to hand back. The approach is Loop of the Recursive Dragon's.

import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { execFile, spawn, spawnSync } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join, extname, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HARNESS = fileURLToPath(new URL("./harness.html", import.meta.url));
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
};

/**
 * Serve the repository, and the harness at /__harness.html. /__offline?on=1
 * makes the server drop every other request, as if the network were gone,
 * until /__offline?on=0: for the test that the game plays offline.
 */
export async function startServer() {
  let offline = false;
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    const path = decodeURIComponent(url.pathname);
    if (path === "/__offline") {
      offline = url.searchParams.get("on") === "1";
      res.writeHead(204, { "cache-control": "no-store" }).end();
      return;
    }
    if (offline && path !== "/__harness.html") {
      req.socket.destroy();
      return;
    }
    const file = path === "/__harness.html" ? HARNESS : normalize(join(ROOT, path === "/" ? "index.html" : path));
    if (file !== HARNESS && !file.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep)) {
      res.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve(undefined)));
  const { port } = /** @type {import("node:net").AddressInfo} */ (server.address());
  return { origin: `http://127.0.0.1:${port}`, close: () => new Promise(resolve => server.close(resolve)) };
}

/** A Chromium-family browser on this machine, or null. NINJA_BROWSER names one. */
export function findBrowser() {
  const candidates = [
    process.env.NINJA_BROWSER,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ].filter(Boolean);
  for (const path of candidates) if (existsSync(path)) return path;
  for (const name of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge"]) {
    const found = spawnSync(process.platform === "win32" ? "where" : "which", [name], { encoding: "utf8" });
    if (found.status === 0 && found.stdout.trim()) return found.stdout.trim().split(/\r?\n/)[0];
  }
  return null;
}

/**
 * Run one scenario of the harness in a fresh browser profile, and return its report.
 * @param {string} browser
 * @param {string} origin
 * @param {string} scenario
 * @param {string[]} [flags]  more browser flags
 */
export async function runScenario(browser, origin, scenario, flags = []) {
  const profile = mkdtempSync(join(tmpdir(), "ninja-browser-"));
  try {
    // Asynchronously: this process is also the web server the browser is talking to.
    const { stdout: dom } = await promisify(execFile)(browser, [
      "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--mute-audio",
      ...(process.env.CI ? ["--no-sandbox"] : []), ...flags,
      `--user-data-dir=${profile}`, "--virtual-time-budget=600000", "--dump-dom",
      `${origin}/__harness.html?scenario=${scenario}`,
    ], { encoding: "utf8", timeout: 180000, maxBuffer: 64 * 1024 * 1024 });
    const match = /<pre id="out">([\s\S]*?)<\/pre>/.exec(dom);
    if (!match) throw new Error("the harness produced no report");
    const text = match[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&amp;/g, "&");
    if (text === "pending") throw new Error("the scenario did not finish inside the time budget");
    const report = JSON.parse(text);
    if (report.error) throw new Error(`in the browser: ${report.error}`);
    return report;
  } finally {
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 5 }); } catch { /* the OS will tidy it */ }
  }
}

/**
 * Run one scenario as runScenario does, but in real time, watching the page
 * through the DevTools protocol until its report is in. For a scenario that
 * waits on a service worker, which virtual time leaves behind.
 * @param {string} browser
 * @param {string} origin
 * @param {string} scenario
 * @param {number} [ms]  how long to give it
 */
export async function runScenarioLive(browser, origin, scenario, ms = 120000) {
  const profile = mkdtempSync(join(tmpdir(), "ninja-browser-"));
  const child = spawn(browser, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--mute-audio",
    ...(process.env.CI ? ["--no-sandbox"] : []), `--user-data-dir=${profile}`, "--remote-debugging-port=0", "about:blank",
  ]);
  /** @type {WebSocket | null} */
  let socket = null;
  try {
    const endpoint = await new Promise((resolve, reject) => {
      let said = "";
      child.stderr.on("data", chunk => {
        said += chunk;
        const found = /DevTools listening on (ws:\/\/\S+)/.exec(said);
        if (found) resolve(found[1]);
      });
      child.on("exit", () => reject(new Error("the browser closed before it could be watched")));
      setTimeout(() => reject(new Error("the browser never offered DevTools")), 20000);
    });
    const ws = new WebSocket(endpoint);
    socket = ws;
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let sent = 0;
    /** @type {Map<number, (message: any) => void>} */
    const waiting = new Map();
    ws.onmessage = event => {
      const message = JSON.parse(String(event.data));
      waiting.get(message.id)?.(message);
      waiting.delete(message.id);
    };
    /** @param {string} method @param {object} [params] @param {string} [sessionId] @returns {Promise<any>} */
    const send = (method, params = {}, sessionId) => new Promise(resolve => {
      waiting.set(++sent, resolve);
      ws.send(JSON.stringify({ id: sent, method, params, sessionId }));
    });
    const { result: { targetId } } = await send("Target.createTarget", { url: `${origin}/__harness.html?scenario=${scenario}` });
    const { result: { sessionId } } = await send("Target.attachToTarget", { targetId, flatten: true });
    const started = Date.now();
    for (;;) {
      const answer = await send("Runtime.evaluate", { expression: `document.getElementById("out")?.textContent ?? "pending"`, returnByValue: true }, sessionId);
      const text = answer.result?.result?.value ?? "pending";
      if (text !== "pending") {
        const report = JSON.parse(text);
        if (report.error) throw new Error(`in the browser: ${report.error}`);
        return report;
      }
      if (Date.now() - started > ms) throw new Error("the scenario did not finish in time");
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  } finally {
    socket?.close();
    child.kill();
    await new Promise(resolve => setTimeout(resolve, 200));
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 5 }); } catch { /* the OS will tidy it */ }
  }
}
