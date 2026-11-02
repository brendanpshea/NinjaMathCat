// Plays whole grade adventures in headless Chrome or Edge, through the real
// screens: every chapter note, every level, most answers right and some
// wrong. Reports what it saw, and any problem or error in the page.
//
//   npm run playthrough                  every grade
//   npm run playthrough -- 3 10          3rd grade, the first 10 levels
//   npm run playthrough -- all all 390   every grade, on a phone-wide screen

import { startServer, findBrowser, runScenario } from "../tests/helpers/browser.js";
import { ADVENTURE_GRADES } from "../src/adventures.js";

const [gradeArg = "all", levelsArg = "all", widthArg] = process.argv.slice(2);
const grades = gradeArg === "all" ? ADVENTURE_GRADES : [Number(gradeArg)];
const browser = findBrowser();
if (!browser) {
  console.error("No Chrome or Edge found. Set NINJA_BROWSER to one.");
  process.exit(1);
}
const server = await startServer();
let failed = false;
try {
  for (const grade of grades) {
    const started = Date.now();
    const query = `marathon&grade=${grade}${levelsArg !== "all" ? `&levels=${levelsArg}` : ""}${widthArg ? `&width=${widthArg}` : ""}`;
    try {
      const r = await runScenario(browser, server.origin, query);
      const kinds = Object.entries(r.kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(", ");
      console.log(`Grade ${grade}: ${r.levels} levels (${r.saved} saved), ${r.questions} questions, ${r.wrongOnce} wrong once, ${r.wrongTwice} wrong twice, ${r.notes.length} notes, ended on ${r.finalScreen}, ${((Date.now() - started) / 1000).toFixed(0)} s`);
      console.log(`  pictures: ${kinds || "none"}`);
      for (const p of r.problems) console.log(`  problem: ${p}`);
      for (const e of r.errors) console.log(`  page error: ${e}`);
      if (r.problems.length || r.errors.length) failed = true;
    } catch (error) {
      console.log(`Grade ${grade}: ${error.message}`);
      failed = true;
    }
  }
} finally {
  await server.close();
}
process.exit(failed ? 1 : 0);
