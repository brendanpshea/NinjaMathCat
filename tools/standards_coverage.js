// Which Common Core standards the game covers, grade by grade, and which it
// doesn't yet.
//
//   npm run coverage            a summary for every grade
//   npm run coverage -- 4       grade 4 in full, standard by standard

import { STANDARDS } from "../src/standards.js";
import { CURRICULUM } from "../src/curriculum.js";

const only = process.argv[2] === undefined ? null : process.argv[2] === "K" ? 0 : Number(process.argv[2]);

/** @type {Map<string, string[]>} */
const coveredBy = new Map();
for (const { type, standards } of CURRICULUM) {
  for (const code of standards) coveredBy.set(code, [...(coveredBy.get(code) ?? []), type.id]);
}

for (const grade of [0, 1, 2, 3, 4, 5, 6]) {
  if (only !== null && grade !== only) continue;
  const all = STANDARDS.filter(s => s.grade === grade);
  const playable = all.filter(s => !s.handsOn);
  const covered = playable.filter(s => coveredBy.has(s.code));
  const label = grade === 0 ? "Kindergarten" : `Grade ${grade}`;
  console.log(`${label}: ${covered.length} of ${playable.length} covered${all.length > playable.length ? ` (and ${all.length - playable.length} hands-on)` : ""}`);
  if (only === null) continue;
  for (const s of all) {
    const mark = s.handsOn ? " *" : coveredBy.has(s.code) ? " ✓" : "  ";
    console.log(`${mark} ${s.code.padEnd(8)} ${s.title}${coveredBy.has(s.code) ? `  [${coveredBy.get(s.code)?.join(", ")}]` : ""}`);
  }
}
