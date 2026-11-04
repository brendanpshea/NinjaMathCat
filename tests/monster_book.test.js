// tests/monster_book.test.js — the monster book (src/monster_book.js): who a
// child has met, and the book's pages.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { monstersMet, bookPages } from "../src/monster_book.js";
import { MONSTERS } from "../src/monsters.js";
import { levelsFor, monstersOf, planLevel, residents, newProgress, recordLevel } from "../src/adventures.js";

/** Progress in a grade with these levels won, by place in the grade. */
function won(grade, places) {
  const levels = levelsFor(grade);
  return places.reduce((p, i) => recordLevel(p, levels[i], { firstTry: 8, secondTry: 0, missed: 0, knockouts: 0, byType: {}, answers: [] }), newProgress());
}

describe("the monster book", () => {
  it("has a page for each place, kindergarten's first, with every monster on one page, weakest first", () => {
    const pages = bookPages();
    assert.equal(pages.length, 16);
    assert.deepEqual(pages.slice(0, 2).map(p => p.place), ["Sunny Meadow", "Toy Attic"]);
    assert.deepEqual(pages.flatMap(p => p.monsters.map(m => m.id)).sort(), MONSTERS.map(m => m.id).sort());
    for (const page of pages) assert.deepEqual(page.monsters, residents(page.setting));
  });

  it("knows who was met from the levels done, which always fight the same monsters", () => {
    for (const level of levelsFor(3)) assert.deepEqual(planLevel(level).adventure, monstersOf(level), level.id);
    assert.deepEqual([...monstersMet({ met: [], adventures: {} })], []);
    // Kindergarten's first level: the meadow's two weakest.
    const first = monstersMet({ met: [], adventures: { 0: won(0, [0]) } });
    assert.deepEqual([...first].sort(), residents("meadow").slice(0, 2).map(m => m.id).sort());
    // A boss adds the toughest, and a quick battle's monsters are kept too.
    const more = monstersMet({ met: ["mimic"], adventures: { 0: won(0, [0, 4]) } });
    assert.deepEqual([...more].sort(), [...residents("meadow").slice(0, 3).map(m => m.id), "mimic"].sort());
  });
});
