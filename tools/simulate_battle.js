// How adventures go for children of different accuracy: a quick check on the
// balance after changing src/combat.js.
//
//   npm run simulate -- [grade] [runs]      e.g. npm run simulate -- 2 200

import { simulateAdventure, median } from "./simulate.js";

const grade = Number(process.argv[2] ?? 2);
const runs = Number(process.argv[3] ?? 200);

console.log(`Grade ${grade}, ${runs} adventures each (medians, with the range of the middle 80% in brackets)\n`);
console.log("right  questions        knockouts   level   treasures");
for (const accuracy of [0.25, 0.5, 0.7, 0.85, 0.95]) {
  const results = Array.from({ length: runs }, (_, i) => simulateAdventure(i + 1, { grade, accuracy }));
  /** @param {(r: ReturnType<typeof simulateAdventure>) => number} pick */
  const spread = pick => {
    const values = results.map(pick).sort((a, b) => a - b);
    const at = (/** @type {number} */ p) => values[Math.floor(p * (values.length - 1))];
    return `${median(values)} [${at(0.1)}–${at(0.9)}]`;
  };
  console.log(
    `${String(Math.round(accuracy * 100)).padStart(4)}%  ${spread(r => r.questions).padEnd(16)} ${spread(r => r.knockouts).padEnd(11)} ` +
    `${spread(r => r.level).padEnd(7)} ${spread(r => r.treasures)}`,
  );
}
