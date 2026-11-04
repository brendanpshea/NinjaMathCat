// Screenshots of the game's screens, at desktop and phone sizes, taken in
// headless Chrome or Edge by way of the test harness: out/screens/*.png.
//
//   npm run screens
//   npm run screens -- store    Google Play's screenshots, in out/store/
//   npm run screens -- store tablet7    just one device's: phone, tablet7, tablet10 or desktop

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
  ["victory", 1000, 1300], ["treasures", 1000, 1300], ["book", 1000, 1500], ["report", 1000, 1300],
  ["players", 390, 1200, "phone-"], ["map", 390, 2200, "phone-"], ["note", 390, 1300, "phone-"],
  ["battle", 390, 1400, "phone-"], ["level-done", 390, 1500, "phone-"], ["treasures", 390, 1800, "phone-"], ["book", 390, 1800, "phone-"], ["report", 390, 1500, "phone-"],
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
  // The one-minute challenge, running and done.
  ["challenge", 1000, 1000], ["challenge", 390, 1300, "phone-"], ["challenge-done", 1000, 1100],
  // The class view, for teachers.
  ["class", 1000, 1300], ["class", 390, 1800, "phone-"],
  // A question answered by tapping the number line, tried wrong once: whole numbers, fractions, negatives.
  ["line", 1000, 1150], ["line", 390, 1400, "phone-"],
  ["line-fractions", 1000, 1150, "", "screen=line&chapter=3-fractions"],
  ["line-negatives", 390, 1400, "phone-", "screen=line&chapter=6-negatives"],
  ["scene-4-check", 390, 1500, "phone-", "screen=scene&chapter=4-decimals&step=5&wrong"],
];
// Google Play's screenshots, in the order docs/STORE.md tells the story in,
// as the Android app shows them. Play wants 16:9 or 9:16 for every device.
const STORE = [
  ["battle-k", "screen=battle&chapter=0-adding"], ["scene-k", "screen=scene&chapter=0-teens&step=1"], ["map"], ["level-done"],
  ["battle-graphs", "screen=battle&chapter=1-graphs"], ["book"], ["report"], ["class"],
];
/** Each device's screen, in CSS pixels, and how many pixels to each. */
const STORE_DEVICES = [
  // 1080 x 1920, at least 1080 wide so Play can feature it. (At 480 wide or
  // less the answers stack in one column, and a battle's run off the bottom.)
  ["phone", 540, 960, 2],
  // A 7-inch tablet on its side: 1920 x 1080.
  ["tablet7", 1024, 576, 1.875],
  // A 10-inch tablet on its side: 2560 x 1440 (each side at least 1080).
  ["tablet10", 1280, 720, 2],
  // A laptop, for Google Play Games on PC and for desktops: 1920 x 1080.
  ["desktop", 1536, 864, 1.25],
];

// npm run screens -- scene: only the shots whose screen has "scene" in its name.
// npm run screens -- scene 2-money: every step of that chapter's scene, on a laptop and a phone.
const [only, chapter] = process.argv.slice(2);
// npm run screens -- store [device]: Google Play's screenshots, for every device or one.
const store = only === "store";
/** @type {Map<string, number>} each shot's pixels to a CSS pixel, by file */
const scales = new Map();
if (store) {
  SHOTS.length = 0;
  for (const [device, width, height, scale] of STORE_DEVICES.filter(([d]) => !chapter || d === chapter)) {
    STORE.forEach(([screen, query = `screen=${screen}`], i) => {
      SHOTS.push([screen, width, height, `${device}-${i + 1}-`, `${query}&app`]);
      scales.set(`${device}-${i + 1}-${screen}`, scale);
    });
  }
}
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
const folder = store ? "out/store" : "out/screens";
mkdirSync(folder, { recursive: true });
const server = await startServer();
try {
  for (const [screen, width, height, prefix = "", query = `screen=${screen}`] of SHOTS.filter(([screen]) => store || !only || String(screen).includes(only))) {
    const profile = mkdtempSync(join(tmpdir(), "ninja-shot-"));
    const file = resolve(`${folder}/${prefix}${screen}.png`);
    await promisify(execFile)(browser, [
      "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--mute-audio", "--hide-scrollbars",
      ...(store ? [`--force-device-scale-factor=${scales.get(`${prefix}${screen}`)}`] : []),
      `--user-data-dir=${profile}`, `--window-size=${width},${height}`, "--virtual-time-budget=120000", `--screenshot=${file}`,
      `${server.origin}/__harness.html?scenario=pose&${query}&width=${width}&height=${height}`,
    ], { timeout: 120000 });
    rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
    console.log(`${folder}/${prefix}${screen}.png`);
  }
} finally {
  await server.close();
}
