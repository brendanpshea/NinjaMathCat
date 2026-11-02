// Starts the game in index.html.

import { createApp } from "./ui/app.js";
import { SoundSystem } from "./sound.js";
import { Speaker } from "./speech.js";
import { createRng } from "./rng.js";
import { browserStorage } from "./save.js";

const params = new URLSearchParams(location.search);
const seed = Number(params.get("seed"));
const app = createApp(/** @type {HTMLElement} */ (document.getElementById("game")), {
  storage: browserStorage(),
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
// Installed as an app, ask the browser to keep the save even when space runs low.
if (globalThis.matchMedia?.("(display-mode: standalone)").matches) navigator.storage?.persist?.().catch(() => {});
