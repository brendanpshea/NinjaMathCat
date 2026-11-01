// Starts the game in index.html.

import { createApp } from "./ui/app.js";
import { SoundSystem } from "./sound.js";
import { createRng } from "./rng.js";
import { browserStorage } from "./save.js";

const params = new URLSearchParams(location.search);
const seed = Number(params.get("seed"));
const app = createApp(/** @type {HTMLElement} */ (document.getElementById("game")), {
  storage: browserStorage(),
  sound: new SoundSystem(),
  // ?seed=n plays the same questions and monsters every time, for tests.
  rng: createRng(params.has("seed") && Number.isInteger(seed) ? seed : undefined),
});

// The browser tests (tests/browser.test.js) watch the game through this.
if (params.has("test")) /** @type {any} */ (globalThis).ninjaMathCat = app;
