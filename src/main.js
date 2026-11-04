// Starts the game in index.html.

import { createApp } from "./ui/app.js";
import { SoundSystem } from "./sound.js";
import { Speaker } from "./speech.js";
import { createRng } from "./rng.js";
import { browserStorage } from "./save.js";

const params = new URLSearchParams(location.search);
const seed = Number(params.get("seed"));
// The Android app (android/twa-manifest.json) opens the game at ?app=android,
// remembered for the session, for coming back from a page like privacy.html.
const inApp = params.get("app") === "android" || remembered("app") === "android";
if (inApp) remember("app", "android");
const app = createApp(/** @type {HTMLElement} */ (document.getElementById("game")), {
  storage: browserStorage(),
  inApp,
  sound: new SoundSystem(),
  speech: new Speaker(),
  // ?seed=n plays the same questions and monsters every time, for tests.
  rng: createRng(params.has("seed") && Number.isInteger(seed) ? seed : undefined),
  // In a test, ?challenge=n makes the one-minute challenge n seconds long.
  ...(params.has("test") && Number(params.get("challenge")) > 0 ? { challengeSeconds: Number(params.get("challenge")) } : {}),
});

// The browser tests (tests/browser.test.js) watch the game through this.
if (params.has("test")) /** @type {any} */ (globalThis).ninjaMathCat = app;

// Offline play, and installing as an app (sw.js), where the browser can: not
// in the tests, unless one asks with ?sw.
if ("serviceWorker" in navigator && (!params.has("test") || params.has("sw"))) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
/**
 * Something kept for this visit (sessionStorage), which can be missing or blocked.
 * @param {string} key
 */
function remembered(key) {
  try {
    return globalThis.sessionStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {string} value
 */
function remember(key, value) {
  try {
    globalThis.sessionStorage?.setItem(key, value);
  } catch {
    // Without it, the app is still the app until the page is left.
  }
}

// Installed as an app, ask the browser to keep the save even when space runs low.
if (inApp || globalThis.matchMedia?.("(display-mode: standalone)").matches) navigator.storage?.persist?.().catch(() => {});
