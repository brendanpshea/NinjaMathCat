// tests/save.test.js — what the game remembers (src/save.js) and its grade
// suggestions (src/progress.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadSave, writeSave, newSave } from "../src/save.js";
import { suggestGrade, firstTryShare } from "../src/progress.js";
import { TREASURES } from "../src/treasures.js";

/** A stand-in for localStorage. */
function memoryStorage(initial = {}) {
  const items = new Map(Object.entries(initial));
  return { getItem: key => items.get(key) ?? null, setItem: (key, value) => items.set(key, String(value)), items };
}

const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("full"); } };

describe("the save", () => {
  it("starts fresh: Ninja Cat, kindergarten, no experience or treasures, sound on", () => {
    assert.deepEqual(loadSave(memoryStorage()), newSave());
    assert.deepEqual(newSave(), { heroId: "cat_ninja", grade: 0, xp: 0, treasures: [], muted: false });
  });

  it("comes back as it was written", () => {
    const storage = memoryStorage();
    const save = { heroId: "owl_wizard", grade: 2.5, xp: 730, treasures: [TREASURES[3].id, TREASURES[0].id], muted: true };
    assert.equal(writeSave(storage, save), true);
    assert.deepEqual(loadSave(storage), save);
  });

  it("puts right anything that no longer makes sense", () => {
    const storage = memoryStorage({
      "ninja-math-cat": JSON.stringify({ heroId: "dragon_king", grade: 9, xp: -5, treasures: ["nope", TREASURES[1].id, TREASURES[1].id, 7], muted: "yes" }),
    });
    assert.deepEqual(loadSave(storage), { ...newSave(), treasures: [TREASURES[1].id] });
  });

  it("forgives broken or blocked storage, and plays on without it", () => {
    assert.deepEqual(loadSave(memoryStorage({ "ninja-math-cat": "{not json" })), newSave());
    assert.deepEqual(loadSave(memoryStorage({ "ninja-math-cat": "42" })), newSave());
    assert.deepEqual(loadSave(throwing), newSave());
    assert.deepEqual(loadSave(null), newSave());
    assert.equal(writeSave(throwing, newSave()), false);
    assert.equal(writeSave(null, newSave()), false);
  });
});

describe("suggesting a grade", () => {
  const tally = (firstTry, secondTry, missed) => ({ firstTry, secondTry, missed, knockouts: 0, byType: {} });

  it("counts questions right the first time", () => {
    assert.equal(firstTryShare(tally(6, 2, 2)), 0.6);
    assert.equal(firstTryShare(tally(0, 0, 0)), 0);
  });

  it("offers an easier grade when most questions needed help", () => {
    assert.deepEqual(suggestGrade(tally(8, 6, 6), 2), { grade: 1.5, label: "1st grade (mid-year)", easier: true });
  });

  it("offers a harder grade when nearly everything was right straight away", () => {
    assert.deepEqual(suggestGrade(tally(28, 2, 0), 2), { grade: 2.5, label: "2nd grade (mid-year)", easier: false });
  });

  it("suggests nothing when the grade suits, too few were asked, or there is nowhere to go", () => {
    assert.equal(suggestGrade(tally(14, 4, 2), 2), null);
    assert.equal(suggestGrade(tally(1, 3, 3), 2), null);
    assert.equal(suggestGrade(tally(3, 10, 10), 0), null);
    assert.equal(suggestGrade(tally(30, 0, 0), 3), null);
  });
});
