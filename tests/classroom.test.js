// tests/classroom.test.js — the class view for teachers (src/classroom.js):
// codes pasted in, and the class grade by grade.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { codesIn, playerFromCode, addCodes, classView } from "../src/classroom.js";
import { encodePlayer } from "../src/progress_code.js";
import { newSave, addPlayer, updatePlayer, currentPlayer, MOST_CODES } from "../src/save.js";
import { levelsFor, chaptersFor } from "../src/adventures.js";

/**
 * A player in a grade, with some levels done, some kinds of question known well or badly, and a challenge best.
 * @param {string} name
 * @param {number} grade
 * @param {{ done?: number, mastery?: Record<string, number>, best?: number }} [how]  mastery: a score for each kind
 */
function student(name, grade, { done = 0, mastery = {}, best } = {}) {
  const { save, player } = addPlayer(newSave(), { name, heroId: "cat_ninja", grade });
  const progress = { done: Object.fromEntries(levelsFor(grade).slice(0, done).map(l => [l.id, { stars: 3, firstTry: 8, asked: 8 }])), opened: 0 };
  return /** @type {import("../src/save.js").Player} */ (currentPlayer(updatePlayer(save, player.id, {
    played: 10 + done,
    adventures: { [grade]: progress },
    mastery: Object.fromEntries(Object.entries(mastery).map(([type, score]) => [type, { score, seen: 10, last: 9 }])),
    challenges: best ? { [grade]: best } : {},
  })));
}

describe("the class view", () => {
  it("finds every progress code in pasted text, however it is spaced or split into lines", () => {
    const [a, b] = [encodePlayer(student("Ana", 3)), encodePlayer(student("Ben", 3))];
    assert.deepEqual(codesIn(`Ana: ${a}\n\nBen sent ${b}, thanks!`), [a, b]);
    assert.deepEqual(codesIn("no codes here"), []);
  });

  it("reads a player from a code, or nothing from junk", () => {
    const ana = playerFromCode(encodePlayer(student("Ana", 4, { done: 6, best: 11 })));
    assert.deepEqual([ana?.name, ana?.grade, ana?.challenges], ["Ana", 4, { 4: 11 }]);
    assert.equal(playerFromCode("NMC1-nonsense"), null);
  });

  it("adds pasted codes, a newer code for a name taking the older one's place", () => {
    const old = encodePlayer(student("Ana", 3, { done: 2 }));
    const newer = encodePlayer(student("ana", 3, { done: 9 }));
    const ben = encodePlayer(student("Ben", 3));
    let result = addCodes([], [old, ben, "NMC1-broken"]);
    assert.deepEqual(result, { codes: [old, ben], added: 2, replaced: 0, bad: 1 });
    result = addCodes(result.codes, [newer]);
    assert.deepEqual(result, { codes: [ben, newer], added: 0, replaced: 1, bad: 0 });
    // It keeps no more than so many, the newest.
    const many = Array.from({ length: MOST_CODES + 5 }, (_, i) => encodePlayer(student(`Kid ${i}`, 3)));
    assert.deepEqual(addCodes([], many).codes, many.slice(-MOST_CODES));
  });

  it("shows each grade's students by name, how far each has got, and what each needs to practise, weakest first", () => {
    const [first, second] = chaptersFor(3).map(c => c.learn[0]);
    const groups = classView([
      { player: student("Zoe", 3, { done: 12, mastery: { [first]: 0.3, [second]: 0.2 }, best: 14 }), fromCode: true },
      { player: student("Ana", 3, { done: 4, mastery: { [first]: 0.9, [second]: 0.35 } }), fromCode: false },
      { player: student("Sam", 1, { done: 1 }), fromCode: false },
      // A kind from another grade's adventure isn't this grade's to practise.
      { player: student("Ben", 3, { mastery: { counting: 0.1 } }), fromCode: false },
    ]);
    assert.deepEqual(groups.map(g => g.grade), [1, 3]);
    const third = groups[1];
    assert.deepEqual(third.rows.map(r => r.name), ["Ana", "Ben", "Zoe"]);
    assert.deepEqual(third.rows[2], { name: "Zoe", fromCode: true, done: 12, levels: 40, played: 22, practise: [second, first], best: 14 });
    assert.deepEqual(third.rows[0].practise, [second]);
    assert.deepEqual(third.rows[1].practise, []);
    // The topics the most children need come first.
    assert.deepEqual(third.topics, [{ type: second, names: ["Ana", "Zoe"] }, { type: first, names: ["Zoe"] }]);
  });
});
