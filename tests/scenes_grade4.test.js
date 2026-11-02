// tests/scenes_grade4.test.js — 4th grade's teaching scenes
// (src/scenes/grade4.js): each example worked through again from its picture.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { playedScenes } from "./helpers/scenes.js";

describe("4th grade's teaching scenes", () => {
  it("Fraction stories and decimals: tenths and hundredths on a grid of 100", () => {
    for (const { steps, at } of playedScenes("4-decimals")) {
      const [frozen] = steps[0].picture.grids;
      const [tenths, ones] = [Math.floor(frozen / 10), frozen % 10];
      assert.ok(ones > 0, `${at}: a number of hundredths, not a whole number of tenths`);
      assert.match(steps[3].say, new RegExp(`^${tenths} full columns and ${ones} more ${ones === 1 ? "block" : "blocks"} make ${frozen} hundredths\\. So 0\\.${frozen} of`), at);
      // The tap check: the column only part frozen.
      const tap = steps.find(s => s.check?.kind === "tap");
      assert.deepEqual(tap.check.answers, [`column-${tenths}`], at);
      // The choice check, read the same way from its own wall.
      const choose = steps.find(s => s.check?.kind === "choose");
      const [other] = choose.picture.grids;
      assert.equal(choose.check.answer, `0.${other}`, at);
      assert.notEqual(other, frozen, `${at}: the check repeats the example`);
    }
  });
});
