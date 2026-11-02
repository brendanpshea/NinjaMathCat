// tests/scenes_grade0.test.js — kindergarten's teaching scenes
// (src/scenes/grade0.js): each example worked through again from its picture.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { playedScenes } from "./helpers/scenes.js";

describe("kindergarten's teaching scenes", () => {
  it("Teen numbers: a full frame of 10 and some more", () => {
    for (const { steps, at } of playedScenes("0-teens")) {
      const { filled, frames } = steps[0].picture;
      assert.equal(frames, 2, at);
      assert.ok(filled >= 11 && filled <= 19, at);
      assert.equal(steps[2].say, `This frame has ${filled - 10} more.`, at);
      assert.equal(steps[3].say, `10 and ${filled - 10} more make ${filled}.`, at);
      // The ring follows the line: the full frame, then the one with the rest.
      assert.deepEqual([steps[1].picture.focus, steps[2].picture.focus], ["frame-0", "frame-1"], at);
      assert.deepEqual(steps[4].check.answers, ["frame-0"], at);
    }
  });
});
