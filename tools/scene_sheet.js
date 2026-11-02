// A sheet for reviewing teaching scenes: every step of a grade's scenes, or
// of one chapter's, on one page, with each step's speaker, line and picture,
// what it points at ringed, and what each check takes. It prints the scripts,
// writes out/scene-sheet.html, and takes a picture of the page in headless
// Chrome or Edge: out/screens/scenes-<grade or chapter>.png.
//
//   npm run scene-sheet -- 2          every 2nd grade scene
//   npm run scene-sheet -- 2-money    one chapter's scene
//   npm run scene-sheet -- 2 5        with seed 5, for other numbers

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { SCENES } from "../src/scenes.js";
import { ADVENTURE_GRADES, chaptersFor, residents, settingFor } from "../src/adventures.js";
import { createRng } from "../src/rng.js";
import { startServer, findBrowser } from "../tests/helpers/browser.js";

const [what = "0", seedArg = "1"] = process.argv.slice(2);
const seed = Number(seedArg);
const chapters = ADVENTURE_GRADES.flatMap(grade => chaptersFor(grade).map((chapter, place) => ({ grade, place, chapter })));
const picked = SCENES
  .map(scene => ({ scene, ...chapters.find(c => c.chapter.id === scene.chapter) }))
  .filter(s => s.chapter && (s.chapter.id === what || String(s.grade) === what));
if (picked.length === 0) {
  console.error(`No scenes for ${what}. Give a grade (0 to 6) or a chapter id.`);
  process.exit(1);
}

// The scripts, as text.
let rows = 0;
for (const { scene, grade, place, chapter } of picked) {
  const monster = residents(settingFor(grade, place))[0].name;
  const steps = scene.steps(createRng(seed), { monster, hero: "Ninja Cat" });
  rows += Math.ceil(steps.length / 3);
  console.log(`\n${chapter.id}: ${chapter.title} (grade ${grade}), with ${monster}`);
  steps.forEach((step, i) => {
    const focus = step.picture?.focus ? ` [ring: ${[step.picture.focus].flat().join(", ")}]` : "";
    const picture = step.picture ? ` {${step.picture.kind}}` : "";
    console.log(`  ${i + 1}. ${step.who === "hero" ? "Hero" : "Monster"}: ${step.say}${picture}${focus}`);
    const check = step.check;
    if (check?.kind === "tap") console.log(`     tap: ${check.answers.join(", ")} | retry: ${check.retry} | right: ${check.right}`);
    if (check?.kind === "choose") console.log(`     choose: ${check.choices.map(c => (String(c) === String(check.answer) ? `*${c}*` : c)).join(", ")} | retry: ${check.retry} | right: ${check.right}`);
  });
}

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Scene sheet</title>
<base href="../">
<link rel="stylesheet" href="css/game.css">
<style>
  body { margin: 0; padding: 16px; background: #fff; font: 15px/1.4 system-ui, sans-serif; color: #1b2333; }
  h2 { margin: 22px 0 8px; font-size: 19px; }
  .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .card { border: 2px solid #d3dbea; border-radius: 12px; padding: 10px; display: grid; gap: 6px; align-content: start; }
  .who { font-weight: 800; font-size: 12px; text-transform: uppercase; color: #55607a; }
  .who.monster { color: #b94c08; }
  .line { font-weight: 700; }
  .card .picture svg { max-height: 200px; }
  .check-info { font-size: 13px; background: #f1f0ff; border-radius: 8px; padding: 6px 8px; }
</style>
</head>
<body>
<div id="sheet"></div>
<script type="module">
  import { SCENES } from "./src/scenes.js";
  import { ADVENTURE_GRADES, chaptersFor, residents, settingFor } from "./src/adventures.js";
  import { createRng } from "./src/rng.js";
  import { renderVisual } from "./src/visuals/index.js";
  import { ringFocus } from "./src/ui/scene_view.js";
  import { escapeXml as esc } from "./src/visuals/svg.js";

  const what = ${JSON.stringify(what)};
  const chapters = ADVENTURE_GRADES.flatMap(grade => chaptersFor(grade).map((chapter, place) => ({ grade, place, chapter })));
  const sheet = document.getElementById("sheet");
  for (const scene of SCENES) {
    const found = chapters.find(c => c.chapter.id === scene.chapter);
    if (!found || (found.chapter.id !== what && String(found.grade) !== what)) continue;
    const monster = residents(settingFor(found.grade, found.place))[0].name;
    const steps = scene.steps(createRng(${seed}), { monster, hero: "Ninja Cat" });
    const heading = document.createElement("h2");
    heading.textContent = found.chapter.title + " (" + found.chapter.id + "), with " + monster;
    const grid = document.createElement("div");
    grid.className = "steps";
    let picture;
    steps.forEach((step, i) => {
      picture = step.picture ?? picture;
      const check = step.check;
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = '<div class="who ' + step.who + '">' + (i + 1) + ". " + (step.who === "hero" ? "Ninja Cat" : esc(monster)) + "</div>"
        + '<div class="line">' + esc(step.say) + "</div>"
        + (picture ? '<div class="picture">' + renderVisual(picture) + "</div>" : "")
        + (check ? '<div class="check-info">' + (check.kind === "tap" ? "Tap: " + esc(check.answers.join(", ")) : "Choose: " + check.choices.map(c => String(c) === String(check.answer) ? "<strong>" + esc(c) + "</strong>" : esc(c)).join(" · "))
          + "<br>Wrong: " + esc(check.retry) + "<br>Right: " + esc(check.right) + "</div>" : "");
      grid.append(card);
      const svg = card.querySelector("svg");
      const focus = step.picture?.focus; // a ring lasts only for the step that sets it
      if (svg) requestAnimationFrame(() => ringFocus(svg, focus));
    });
    sheet.append(heading, grid);
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
writeFileSync("out/scene-sheet.html", page);
const server = await startServer();
const profile = mkdtempSync(join(tmpdir(), "ninja-scenes-"));
try {
  const file = resolve(`out/screens/scenes-${what}.png`);
  await promisify(execFile)(browser, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--hide-scrollbars",
    `--user-data-dir=${profile}`, `--window-size=1340,${120 + picked.length * 60 + rows * 380}`, "--virtual-time-budget=20000",
    `--screenshot=${file}`, `${server.origin}/out/scene-sheet.html`,
  ], { timeout: 120000 });
  console.log(`\nWrote out/scene-sheet.html and out/screens/scenes-${what}.png`);
} finally {
  await server.close();
  rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
}
