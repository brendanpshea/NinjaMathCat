// The pictures that show the game off outside it, drawn from its own
// backdrop, sprites and fonts in headless Chrome or Edge:
//
//   npm run card
//
// assets/social-card.png (1200 × 630) is what a shared link shows, in a
// class's message board, an email or a chat (og:image in index.html).
// out/store/feature-graphic.png (1024 × 500) is the banner Google Play asks
// for at the top of a listing (docs/STORE.md).

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { startServer, findBrowser } from "../tests/helpers/browser.js";
import { backdropFor } from "../src/backdrops.js";
import { HEROES, heroSprite } from "../src/heroes.js";
import { MONSTERS, monsterSprite } from "../src/monsters.js";

const hero = HEROES[0];
const foe = /** @type {import("../src/monsters.js").Monster} */ (MONSTERS.find(m => m.id === "evil_duck"));
const scene = backdropFor(foe.setting);

/**
 * The card as a page, the size it will be drawn.
 * @param {number} width
 * @param {number} height
 * @param {boolean} facts  free, no ads, offline: for the web, but not on Google Play,
 *   whose rules keep words like "free" off a listing's pictures
 */
function card(width, height, facts) {
  return `<!doctype html><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${width}px; height: ${height}px; overflow: hidden; }
  body {
    position: relative; font-family: "Trebuchet MS", "Avenir Next", system-ui, sans-serif; color: #1b2333;
    background: url("/${scene.file}") center bottom / cover;
  }
  /* A haze over the sky, so the words sit clearly on it. */
  body::before { content: ""; position: absolute; inset: 0; background: linear-gradient(to bottom, rgb(223 234 255 / 0.92), rgb(223 234 255 / 0.55) 48%, rgb(0 0 0 / 0) 70%); }
  .words { position: absolute; top: ${Math.round(height * 0.08)}px; left: 0; right: 0; text-align: center; }
  h1 { font-size: ${Math.round(height * 0.2)}px; font-weight: 800; letter-spacing: 0.01em; color: #3f3cbb; text-shadow: 0 4px 0 #fff, 0 8px 18px rgb(0 0 0 / 0.18); }
  p { font-size: ${Math.round(height * 0.062)}px; font-weight: 700; margin-top: ${Math.round(height * 0.01)}px; }
  .facts { margin-top: ${Math.round(height * 0.03)}px; display: flex; gap: 12px; justify-content: center; }
  .facts span { padding: 6px 16px; border-radius: 999px; background: #e8620f; color: #fff; font-size: ${Math.round(height * 0.04)}px; font-weight: 800; }
  .fighter { position: absolute; bottom: ${Math.round(height * 0.06)}px; height: ${Math.round(height * 0.46)}px; background-repeat: no-repeat; background-size: 300% 100%; image-rendering: pixelated; }
  .hero { left: ${Math.round(width * 0.1)}px; }
  .foe { right: ${Math.round(width * 0.1)}px; transform: scaleX(-1); }
</style>
<div class="words">
  <h1>Whiskerblade</h1>
  <p>Math battles, kindergarten to 6th grade</p>
  ${facts ? `<div class="facts"><span>Free</span><span>No ads</span><span>Plays offline</span></div>` : ""}
</div>
<div class="fighter hero" data-strip="/${heroSprite(hero)}"></div>
<div class="fighter foe" data-strip="/${monsterSprite(foe)}"></div>
<script>
  // Each strip holds three poses side by side; the first is standing.
  for (const el of document.querySelectorAll("[data-strip]")) {
    const img = new Image();
    img.onload = () => {
      el.style.backgroundImage = \`url("\${el.dataset.strip}")\`;
      el.style.aspectRatio = \`\${img.naturalWidth / 3} / \${img.naturalHeight}\`;
    };
    img.src = el.dataset.strip;
  }
</script>`;
}

const browser = findBrowser();
if (!browser) {
  console.error("No Chrome or Edge found. Set NINJA_BROWSER to one.");
  process.exit(1);
}
mkdirSync("out/store", { recursive: true });
const server = await startServer();
try {
  for (const [file, width, height, facts] of /** @type {const} */ ([["assets/social-card.png", 1200, 630, true], ["out/store/feature-graphic.png", 1024, 500, false]])) {
    const page = `out/store/card-${width}.html`;
    writeFileSync(page, card(width, height, facts));
    const profile = mkdtempSync(join(tmpdir(), "ninja-card-"));
    await promisify(execFile)(browser, [
      "--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", `--user-data-dir=${profile}`,
      `--window-size=${width},${height}`, "--virtual-time-budget=5000", `--screenshot=${resolve(file)}`, `${server.origin}/${page}`,
    ], { timeout: 60000 });
    rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
    console.log(file);
  }
} finally {
  await server.close();
}
