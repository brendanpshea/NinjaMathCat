// Print sample questions, to read them the way a child will meet them.
//
//   npm run sample -- <grade> [count] [type]
//   npm run sample -- 2.5            ten questions of any type for mid-second grade
//   npm run sample -- 1 5 money      five money questions for first grade
//
// Each line shows the prompt, what is drawn beside it, the choices, and the
// answer. A seed is printed too: pass it as SEED=<n> to see the same set again.

import { createRng } from "../src/rng.js";
import { GRADES, typesForGrade, generateQuestion } from "../src/curriculum.js";
import { makeQuestion } from "../src/questions/common.js";

const [gradeArg, countArg = "10", typeId] = process.argv.slice(2);
const grade = Number(gradeArg);
if (gradeArg === undefined || !GRADES.some(g => g.grade === grade)) {
  console.error(`Usage: npm run sample -- <grade> [count] [type]\nGrades: ${GRADES.map(g => g.grade).join(", ")}`);
  process.exit(1);
}
const types = typesForGrade(grade);
const type = typeId && types.find(t => t.id === typeId);
if (typeId && !type) {
  console.error(`No ${typeId} questions at grade ${grade}. There are: ${types.map(t => t.id).join(", ")}`);
  process.exit(1);
}

const seed = Number(process.env.SEED ?? Math.floor(Math.random() * 2 ** 32));
const rng = createRng(seed);
console.log(`${GRADES.find(g => g.grade === grade)?.label} — seed ${seed}\n`);

for (let i = 0; i < Number(countArg); i++) {
  const q = type ? makeQuestion(rng, type, grade) : generateQuestion(rng, grade);
  const v = q.visual;
  const shown = !v ? ""
    : v.kind === "objects" ? v.emoji.repeat(v.count)
    : v.kind === "pattern" ? v.items.map(x => x ?? "__").join(" ")
    : v.kind === "money" ? v.items.join(", ")
    : v.kind === "clock" ? `clock at ${v.hours}:${String(v.minutes).padStart(2, "0")}`
    : v.kind === "shape" ? `shape: ${v.shape}`
    : v.kind === "number_line" ? `line ${v.from}–${v.to}${v.den > 1 ? ` in steps of 1/${v.den}` : ""}, ticks ${v.tick}, labels ${v.label}`
        + `${v.points.length ? `, dot at ${v.points}` : ""}${v.jumps.length ? `, jump ${v.jumps[0].join("→")}` : ""}`
    : v.kind === "picture_graph" ? `${v.title}: ${v.rows.map(r => `${r.label} ${r.value}`).join(", ")} (each picture = ${v.each})`
    : v.kind === "bar_graph" ? `${v.title}: ${v.bars.map(b => `${b.label} ${b.value}`).join(", ")} (gridlines every ${v.scale}, up to ${v.max})`
    : v.kind === "fraction" ? `${v.shaded} of ${v.parts} parts of a ${v.model} shaded`
    : v.kind === "area" ? `${v.shape} ${v.width} by ${v.height}${v.grid ? " on a grid" : ""}${v.labels ? `, labelled ${v.labels.base} and ${v.labels.height}` : ""}`
    : v.kind === "cubes" ? `box ${v.length} by ${v.width} by ${v.height}${v.cubes ? " of cubes" : ""}${v.labels ? `, labelled ${Object.values(v.labels).join(", ")}` : ""}`
    : v.kind === "angle" ? `${v.degrees}° angle from a ray pointing ${v.base}${v.protractor ? ", on a protractor" : ""}`
    : v.kind === "solid" ? `solid: ${v.solid}`
    : v.kind === "groups" ? `groups: ${v.rows.map(r => `${r.count} ${r.name}`).join(", ")}`
    : v.kind === "scene" ? `a ${v.thing} ${v.place} a ${v.landmark}`
    : v.kind === "lengths" ? `ribbons ${v.ribbons.map(r => `${r.color} ${r.from}+${r.length}`).join(", ")}${v.ruler ? `, ruler in ${v.ruler}` : ""}${v.cubes ? ", cubes" : ""}`
    : v.kind === "ten_frame" ? `${v.filled} counters in ${v.frames} ten ${v.frames === 1 ? "frame" : "frames"}`
    : v.kind === "base_ten" ? `blocks: ${v.hundreds} hundreds, ${v.tens} tens, ${v.ones} ones`
    : v.kind === "line_plot" ? `${v.title}: ${v.counts.map((c, i) => `${v.from + i}/${v.den}×${c}`).join(" ")}`
    : `grid ${v.min} to ${v.max}: ${v.points.map(p => `${p.label}(${p.x}, ${p.y})`).join(" ")}`;
  console.log(`[${q.type}, difficulty ${q.difficulty}] ${q.prompt}${shown ? `   [${shown}]` : ""}`);
  console.log(`    ${q.choices.map(c => (c === q.answer ? `*${c}*` : String(c))).join("   ")}`);
  console.log(`    hint: ${q.hint}\n`);
}
