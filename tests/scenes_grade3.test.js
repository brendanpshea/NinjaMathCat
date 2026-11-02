// tests/scenes_grade3.test.js — 3rd grade's teaching scenes
// (src/scenes/grade3.js): each example worked through again from its pictures.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { playedScenes, picturesOf } from "./helpers/scenes.js";

/** The choose check of a scene's steps, with the picture it is asked over. */
function choose(steps) {
  const at = steps.findIndex(s => s.check?.kind === "choose");
  return { step: steps[at], picture: picturesOf(steps)[at] };
}

/** Whether a set of values varies over the seeds. */
function varies(values) {
  return new Set(values).size > 1;
}

describe("3rd grade's teaching scenes", () => {
  it("Equal groups: count by the size of a group, once for each group", () => {
    const seen = [];
    for (const { steps, at } of playedScenes("3-groups")) {
      const rows = steps[0].picture.rows;
      const [groups, each] = [rows.length, rows[0].count];
      assert.ok(rows.every(r => r.count === each), `${at}: equal groups`);
      assert.notEqual(groups, each, at);
      seen.push(`${groups}x${each}`);
      assert.match(steps[2].say, new RegExp(`^${groups} groups of ${each} is written ${groups} times ${each}\\.`), at);
      assert.deepEqual(steps[2].picture.lines, [[String(groups), "×", String(each)]], at);
      // The first number is the groups: the card token the tap check wants.
      assert.equal(steps[2].picture.lines[0][0], String(groups), at);
      const tap = steps.find(s => s.check?.kind === "tap");
      assert.deepEqual(tap.check.answers, ["t0-0"], at);
      // The count by the group size ends on the total, at the token the last line rings.
      const counting = steps[4].picture.lines[1].filter(t => t !== ",").map(Number);
      assert.deepEqual(counting, Array.from({ length: groups }, (_, i) => each * (i + 1)), at);
      assert.equal(steps[5].picture.focus, `t1-${steps[4].picture.lines[1].length - 1}`, at);
      assert.equal(steps[4].picture.lines[1].at(-1), String(groups * each), at);
      assert.match(steps[5].say, new RegExp(`${groups} times ${each} is ${groups * each}\\.$`), at);
      const { step, picture } = choose(steps);
      const [more, per] = [picture.rows.length, picture.rows[0].count];
      assert.equal(step.check.answer, more * per, at);
      assert.equal(new Set(step.check.choices).size, 4, at);
      assert.ok(picture.rows.every(r => r.count === per), at);
      assert.ok(more !== groups || per !== each, `${at}: the check repeats the example`);
    }
    assert.ok(varies(seen), "the example varies");
  });

  it("Sharing equally: divide by asking what times the plates makes the pile", () => {
    const seen = [];
    for (const { steps, at } of playedScenes("3-sharing")) {
      const pile = steps[0].picture.count;
      assert.ok(steps[0].say.includes(`scooped ${pile} tomatoes`), at);
      const shown = steps[5].picture.rows;
      const [n, each] = [shown.length, shown[0].count];
      assert.ok(shown.every(r => r.count === each), at);
      assert.equal(n * each, pile, at);
      assert.equal(steps[0].say.includes(`onto ${n} plates`), true, at);
      seen.push(`${pile}/${n}`);
      const lines = steps[3].picture.lines;
      assert.deepEqual(lines[0], [String(pile), "÷", String(n)], at);
      assert.deepEqual(lines[1], [String(n), "×", "?", "=", String(pile)], at);
      const counting = lines[2].filter(t => t !== ",").map(Number);
      assert.equal(counting.at(-1), pile, at);
      assert.equal(counting.length, each, at);
      assert.ok(counting.every((c, i) => c === n * (i + 1)), at);
      const tap = steps.find(s => s.check?.kind === "tap");
      assert.ok(tap.check.answers.every(a => lines[Number(a[1])][Number(a[3])] === String(n)), `${at}: the tap is the number of plates`);
      const { step, picture } = choose(steps);
      const [, p2] = step.say.match(/for (\d+) plates/);
      assert.equal(step.check.answer, picture.count / Number(p2), at);
      assert.equal(Number.isInteger(step.check.answer), true, at);
      assert.equal(new Set(step.check.choices).size, 4, at);
      assert.ok(picture.count !== pile || Number(p2) !== n, at);
    }
    assert.ok(varies(seen), "the example varies");
  });

  it("Time, measures and rounding: read the hour hand, then count the minutes by 5s and 1s", () => {
    const seen = [];
    for (const { steps, at } of playedScenes("3-measures")) {
      const { hours, minutes } = steps[0].picture;
      const [fives, extra] = [Math.floor(minutes / 5), minutes % 5];
      assert.ok(extra > 0 && fives >= 2, at);
      seen.push(`${hours}:${minutes}`);
      assert.equal(steps[4].picture.focus, `number-${fives}`, at);
      assert.ok(steps[4].say.includes(`That is ${minutes - extra} minutes.`), at);
      const pad = String(minutes).padStart(2, "0");
      assert.ok(steps[5].say.endsWith(`That makes ${minutes} minutes, so the time is ${hours}:${pad}.`), at);
      assert.ok(steps[5].say.includes(`${extra} more little ${extra === 1 ? "mark" : "marks"}`), at);
      assert.ok(steps[1].say.includes(`so the hour is ${hours}.`), at);
      assert.ok(steps[1].say.includes(`passed the ${hours} but not reached the ${(hours % 12) + 1},`), at);
      const tap = steps.find(s => s.check?.kind === "tap");
      assert.deepEqual(tap.check.answers, ["minute-hand"], at);
      const { step, picture } = choose(steps);
      assert.equal(step.check.answer, `${picture.hours}:${String(picture.minutes).padStart(2, "0")}`, at);
      assert.equal(new Set(step.check.choices).size, 4, at);
      assert.ok(picture.hours !== hours || picture.minutes !== minutes, at);
    }
    assert.ok(varies(seen), "the example varies");
  });

  it("Harder facts: split the rows into 5 and the rest, and add", () => {
    const seen = [];
    for (const { steps, at } of playedScenes("3-two-step")) {
      const { width, height } = steps[0].picture;
      assert.equal(steps[0].picture.grid, true, at);
      assert.ok(height >= 6 && width >= 6 && width !== height, at);
      seen.push(`${height}x${width}`);
      assert.deepEqual(steps[1].picture.focus, [0, 1, 2, 3, 4].map(i => `row-${i}`), at);
      assert.ok(steps[1].say.endsWith(`5 times ${width} is ${5 * width}.`), at);
      const rest = height - 5;
      assert.deepEqual(steps[3].picture.focus, Array.from({ length: rest }, (_, i) => `row-${5 + i}`), at);
      assert.ok(steps[3].say.includes(`The other ${rest} ${rest === 1 ? "row makes" : "rows make"}`) && steps[3].say.endsWith(`${rest} times ${width} is ${rest * width}.`), at);
      assert.deepEqual(steps[4].picture.lines, [[String(5 * width), "+", String(rest * width)], [String(height * width)]], at);
      assert.ok(steps[4].say.endsWith(`So ${height} times ${width} is ${height * width}.`), at);
      const tap = steps.find(s => s.check?.kind === "tap");
      assert.deepEqual(tap.check.answers, ["row-4"], at);
      const { step, picture } = choose(steps);
      assert.equal(step.check.answer, picture.width * picture.height, at);
      assert.equal(new Set(step.check.choices).size, 4, at);
      assert.ok(picture.width !== width || picture.height !== height, at);
    }
    assert.ok(varies(seen), "the example varies");
  });

  it("Area: the squares in a row times the number of rows", () => {
    const seen = [];
    for (const { steps, at } of playedScenes("3-area")) {
      const { width, height } = steps[0].picture;
      assert.equal(steps[0].picture.grid, true, at);
      assert.notEqual(width, height, at);
      seen.push(`${width}x${height}`);
      assert.ok(steps[2].say.endsWith(`in one row: ${width}.`), at);
      assert.ok(steps[3].say.endsWith(`down the side: ${height}.`), at);
      assert.deepEqual(steps[4].picture.lines, [[String(height), "×", String(width), "=", String(width * height)]], at);
      assert.equal(steps[4].picture.lines[0][4], String(width * height), at);
      assert.equal(steps[4].picture.focus, "t0-4", at);
      assert.ok(steps[4].say.endsWith(`The area is ${width * height} square units.`), at);
      const { step, picture } = choose(steps);
      assert.equal(step.check.answer, picture.width * picture.height, at);
      assert.equal(new Set(step.check.choices).size, 4, at);
      assert.ok(picture.width !== width || picture.height !== height, at);
    }
    assert.ok(varies(seen), "the example varies");
  });

  it("Fractions: the bottom number counts all the parts, the top the shaded ones", () => {
    const seen = [];
    for (const { steps, at } of playedScenes("3-fractions")) {
      const { parts, shaded } = steps[0].picture;
      assert.ok(shaded >= 1 && shaded < parts, at);
      seen.push(`${shaded}/${parts}`);
      assert.equal(steps[1].picture.focus.length, parts, at);
      assert.ok(steps[1].say.startsWith(`You are cut into ${parts} equal parts.`), at);
      assert.ok(steps[2].say.startsWith(`${shaded} of the ${parts} parts ${shaded === 1 ? "is" : "are"} blue.`), at);
      assert.deepEqual(steps[3].picture.lines, [[String(shaded), "/", String(parts)]], at);
      const tap = steps.find(s => s.check?.kind === "tap");
      assert.deepEqual(tap.check.answers, ["t0-2"], at);
      assert.equal(steps[3].picture.lines[0][2], String(parts), at);
      const { step, picture } = choose(steps);
      assert.equal(step.check.answer, `${picture.shaded}/${picture.parts}`, at);
      assert.equal(new Set(step.check.choices).size, 4, at);
      assert.notEqual(picture.shaded * 2, picture.parts, `${at}: half would also equal another choice`);
      assert.ok(picture.parts !== parts || picture.shaded !== shaded, at);
    }
    assert.ok(varies(seen), "the example varies");
  });

  it("Graphs: read the key, count the pictures, multiply", () => {
    const seen = [];
    for (const { steps, at } of playedScenes("3-graphs")) {
      const graph = steps[0].picture;
      const [, page] = steps[0].say.match(/on page (\d+)\?/);
      const row = graph.rows[Number(page) - 1];
      assert.equal(row.label, `Page ${page}`, at);
      const count = row.value / graph.each;
      seen.push(`${graph.each}x${count}`);
      assert.ok(Number.isInteger(count) && count >= 3, at);
      assert.ok(steps[1].say.includes(`stands for ${graph.each} blots`), at);
      assert.equal(steps[2].picture.focus, `row-${Number(page) - 1}`, at);
      assert.ok(steps[2].say.endsWith(`Count its pictures: ${count}.`), at);
      assert.deepEqual(steps[4].picture.lines, [[String(count), "×", String(graph.each), "=", String(row.value)]], at);
      const tap = steps.find(s => s.check?.kind === "tap");
      const values = graph.rows.map(r => r.value);
      assert.equal(new Set(values).size, values.length, at);
      assert.deepEqual(tap.check.answers, [`row-${values.indexOf(Math.max(...values))}`], at);
      const { step, picture } = choose(steps);
      const [, page2] = step.say.match(/page (\d+)\?/);
      assert.equal(step.check.answer, picture.rows[Number(page2) - 1].value, at);
      assert.equal(new Set(step.check.choices).size, 4, at);
      assert.ok(step.check.answer / picture.each >= 3, at);
    }
    assert.ok(varies(seen), "the example varies");
  });

  it("Perimeter: every side added, the sides in pairs", () => {
    const seen = [];
    for (const { steps, at } of playedScenes("3-perimeter")) {
      const lid = steps[0].picture;
      const [w, h] = [lid.width, lid.height];
      seen.push(`${w}x${h}`);
      assert.equal(lid.shape, "rectangle", at);
      assert.ok(w !== h && !lid.grid, at);
      assert.deepEqual([lid.labels.base, lid.labels.height], [`${w} cm`, `${h} cm`], at);
      assert.ok(steps[4].say.startsWith(`${w} plus ${w} plus ${h} plus ${h} is ${2 * (w + h)}.`), at);
      assert.deepEqual(steps[4].picture.lines[0], [`${w}`, "+", `${w}`, "+", `${h}`, "+", `${h}`, "=", `${2 * (w + h)}`], at);
      // The side with no number, as long as the left one.
      const tap = steps.find(s => s.check?.kind === "tap");
      assert.deepEqual(tap.check.answers, ["side-right"], at);
      const { step, picture } = choose(steps);
      assert.equal(step.check.answer, 2 * (picture.width + picture.height), at);
      assert.equal(new Set(step.check.choices).size, 4, at);
      assert.ok(step.check.choices.includes(picture.width * picture.height), `${at}: the area is a choice to catch`);
      assert.notDeepEqual([picture.width, picture.height], [w, h], `${at}: the check repeats the example`);
    }
    assert.ok(varies(seen), "the example varies");
  });
});
