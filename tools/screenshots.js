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
  ["title", 1000, 1100], ["returning", 1000, 1100], ["battle", 1000, 1150], ["hint", 1000, 1150],
  ["reveal", 1000, 1150], ["victory", 1000, 1300], ["treasures", 1000, 1300],
  ["title", 390, 1500, "phone-"], ["battle", 390, 1400, "phone-"],
];

const browser = findBrowser();
if (!browser) {
  console.error("No Chrome or Edge found. Set NINJA_BROWSER to one.");
  process.exit(1);
}
mkdirSync("out/screens", { recursive: true });
const server = await startServer();
try {
  for (const [screen, width, height, prefix = ""] of SHOTS) {
    const profile = mkdtempSync(join(tmpdir(), "ninja-shot-"));
    const file = resolve(`out/screens/${prefix}${screen}.png`);
    await promisify(execFile)(browser, [
      "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--mute-audio", "--hide-scrollbars",
      `--user-data-dir=${profile}`, `--window-size=${width},${height}`, "--virtual-time-budget=120000", `--screenshot=${file}`,
      `${server.origin}/__harness.html?scenario=pose&screen=${screen}&width=${width}&height=${height}`,
    ], { timeout: 120000 });
    rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
    console.log(`out/screens/${prefix}${screen}.png`);
  }
} finally {
  await server.close();
}
