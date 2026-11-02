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
