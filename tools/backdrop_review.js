// A sheet for judging the backdrops: each one behind real fighters, at desktop
// and phone sizes, with the setting's biggest monster facing Ninja Cat.
// Writes out/backdrop-review.html and takes a picture of it in headless
// Chrome or Edge: out/screens/backdrops.png.
//
//   npm run backdrops

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { BACKDROPS } from "../src/backdrops.js";
import { startServer, findBrowser } from "../tests/helpers/browser.js";

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Backdrop review</title>
<!-- The game's paths are from the site's root, and this page is in out/. -->
<base href="../">
<link rel="stylesheet" href="css/stage.css">
<style>
  body { margin: 0; padding: 20px; background: #e9eef6; font: 16px/1.4 system-ui, sans-serif; color: #1b2333; }
  h2 { margin: 18px 0 8px; font-size: 18px; }
  h2 small { font-weight: 400; color: #55607a; margin-left: 8px; }
  .row { display: flex; gap: 20px; align-items: flex-start; }
  .desktop { width: 928px; }
  .phone { width: 358px; }
</style>
</head>
<body>
<div id="sheet"></div>
<script type="module">
  import { BACKDROPS } from "./src/backdrops.js";
  import { MONSTERS } from "./src/monsters.js";
  import { DEFAULT_HERO } from "./src/heroes.js";
  import { startBattle } from "./src/battle.js";
  import { createRng } from "./src/rng.js";
  import { createStage } from "./src/ui/stage_view.js";

  const sheet = document.getElementById("sheet");
  for (const backdrop of BACKDROPS) {
    const residents = MONSTERS.filter(m => m.setting === backdrop.id).sort((a, b) => b.tier - a.tier);
    const heading = document.createElement("h2");
    heading.innerHTML = backdrop.name + "<small>" + backdrop.file + " · floor " + backdrop.floor + " · " + residents.map(m => m.name).join(", ") + "</small>";
    const row = document.createElement("div");
    row.className = "row";
    for (const size of ["desktop", "phone"]) {
      const frame = document.createElement("div");
      frame.className = size;
      row.append(frame);
      const battle = startBattle(createRng(1), { grade: 0, adventure: [residents[0]] });
      createStage(frame).show(battle, DEFAULT_HERO);
    }
    sheet.append(heading, row);
  }
</script>
</body>
</html>
`;

const browser = findBrowser();
if (!browser) {
  console.error("No Chrome or Edge found. Set NINJA_BROWSER to one.");
  process.exit(1);
}
mkdirSync("out/screens", { recursive: true });
writeFileSync("out/backdrop-review.html", page);
const server = await startServer();
const profile = mkdtempSync(join(tmpdir(), "ninja-backdrops-"));
try {
  const file = resolve("out/screens/backdrops.png");
  await promisify(execFile)(browser, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
    `--user-data-dir=${profile}`, `--window-size=1350,${80 + BACKDROPS.length * 445}`, "--virtual-time-budget=20000",
    `--screenshot=${file}`, `${server.origin}/out/backdrop-review.html`,
  ], { timeout: 120000 });
  console.log("Wrote out/backdrop-review.html and out/screens/backdrops.png");
} finally {
  rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
  await server.close();
}
