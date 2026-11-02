// Screenshots of the game's screens, at desktop and phone sizes, taken in
// headless Chrome or Edge by way of the test harness: out/screens/*.png.
//
//   npm run screens

import { mkdirSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { startServer, findBrowser } from "../tests/helpers/browser.js";

const SHOTS = [
  ["title", 1000, 1100], ["players", 1000, 1100], ["player", 1000, 1300], ["map", 1000, 1600], ["note", 1000, 1100],
  ["battle", 1000, 1150], ["hint", 1000, 1150], ["reveal", 1000, 1150], ["level-done", 1000, 1100],
  ["victory", 1000, 1300], ["treasures", 1000, 1300], ["report", 1000, 1300],
  ["players", 390, 1200, "phone-"], ["map", 390, 2200, "phone-"], ["note", 390, 1300, "phone-"],
  ["battle", 390, 1400, "phone-"], ["level-done", 390, 1300, "phone-"], ["report", 390, 1500, "phone-"],
  // A school laptop's window: is everything needed to play in sight without scrolling?
  ["map", 1366, 650, "laptop-"], ["battle", 1366, 650, "laptop-"],
  // Teaching scenes: a step pointing at the picture, and a check after a wrong try.
  ["scene-k", 1000, 1150, "", "screen=scene&chapter=0-teens&step=1"],
  ["scene-k-check", 1000, 1150, "", "screen=scene&chapter=0-teens&step=4&wrong"],
  ["scene-4", 1000, 1150, "", "screen=scene&chapter=4-decimals&step=1"],
  ["scene-4-check", 1000, 1300, "", "screen=scene&chapter=4-decimals&step=4&wrong"],
  ["scene-k", 390, 1300, "phone-", "screen=scene&chapter=0-teens&step=1"],
  ["how", 1000, 1150], ["how", 390, 1400, "phone-"],
  // The grown-up lock's question, over the map.
  ["lock", 1000, 900], ["lock", 390, 1000, "phone-"],
  ["scene-4-check", 390, 1500, "phone-", "screen=scene&chapter=4-decimals&step=5&wrong"],
];
// npm run screens -- scene: only the shots whose screen has "scene" in its name.
// npm run screens -- scene 2-money: every step of that chapter's scene, on a laptop and a phone.
const [only, chapter] = process.argv.slice(2);
if (only === "scene" && chapter) {
  const { sceneFor } = await import("../src/scenes.js");
  const { createRng } = await import("../src/rng.js");
  const scene = sceneFor(chapter);
  if (!scene) {
    console.error(`No scene opens ${chapter}.`);
    process.exit(1);
  }
  SHOTS.length = 0;
  scene.steps(createRng(1), { monster: "M", hero: "H" }).forEach((_, step) => {
    SHOTS.push([`scene-${chapter}-${step}`, 1000, 1300, "", `screen=scene&chapter=${chapter}&step=${step}`]);
    SHOTS.push([`scene-${chapter}-${step}`, 390, 1500, "phone-", `screen=scene&chapter=${chapter}&step=${step}`]);
  });
}

const browser = findBrowser();
if (!browser) {
  console.error("No Chrome or Edge found. Set NINJA_BROWSER to one.");
  process.exit(1);
}
mkdirSync("out/screens", { recursive: true });
const server = await startServer();
try {
  for (const [screen, width, height, prefix = "", query = `screen=${screen}`] of SHOTS.filter(([screen]) => !only || String(screen).includes(only))) {
    const profile = mkdtempSync(join(tmpdir(), "ninja-shot-"));
    const file = resolve(`out/screens/${prefix}${screen}.png`);
    await promisify(execFile)(browser, [
      "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--mute-audio", "--hide-scrollbars",
      `--user-data-dir=${profile}`, `--window-size=${width},${height}`, "--virtual-time-budget=120000", `--screenshot=${file}`,
      `${server.origin}/__harness.html?scenario=pose&${query}&width=${width}&height=${height}`,
    ], { timeout: 120000 });
    rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
    console.log(`out/screens/${prefix}${screen}.png`);
  }
} finally {
  await server.close();
}
