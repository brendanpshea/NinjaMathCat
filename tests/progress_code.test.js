// tests/progress_code.test.js — moving a player to another device
// (src/progress_code.js, importPlayer in src/save.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { encodePlayer, decodePlayer } from "../src/progress_code.js";
import { newSave, addPlayer, updatePlayer, importPlayer, currentPlayer, MOST_PLAYERS } from "../src/save.js";
import { levelsFor, newProgress, recordLevel, openChapter } from "../src/adventures.js";
import { TREASURES } from "../src/treasures.js";

/** A player partway through 3rd grade, with some of 2nd done too. */
function maya() {
  let { save, player } = addPlayer(newSave(), { name: "Maya Ö", heroId: "owl_wizard", grade: 3, readAloud: false });
  const tally = firstTry => ({ firstTry, secondTry: 0, missed: 10 - firstTry, knockouts: 0, byType: {}, answers: [] });
  let third = newProgress();
  levelsFor(3).slice(0, 7).forEach((level, i) => { third = recordLevel(third, level, tally([9, 7, 4][i % 3])); });
  const second = openChapter(recordLevel(newProgress(), levelsFor(2)[0], tally(10)), 3);
  save = updatePlayer(save, player.id, {
    xp: 1234,
    played: 9,
    treasures: [TREASURES[5].id, TREASURES[0].id, TREASURES[40].id],
    adventures: { 2: second, 3: third },
    mastery: { multiplication: { score: 0.734, seen: 12, last: 9, day: 20760 }, division: { score: 0.2, seen: 4, last: 6 } },
    challenges: { 3: 14 },
  });
  return currentPlayer(save);
}

describe("progress codes", () => {
  it("carry a player to another device: name, hero, grade, experience, treasures, stars, mastery and challenge bests", () => {
    const player = maya();
    const code = encodePlayer(player);
    assert.match(code, /^NMC1-[A-Za-z0-9_-]+$/);
    const there = importPlayer(addPlayer(newSave(), { name: "Sam", heroId: "cat_ninja", grade: 1 }).save, decodePlayer(code));
    const moved = there.player;
    assert.equal(moved.id, "p2", "a new id on the new device");
    assert.equal(currentPlayer(there.save), moved);
    assert.deepEqual(
      [moved.name, moved.heroId, moved.grade, moved.xp, moved.played, moved.readAloud, moved.treasures],
      [player.name, player.heroId, player.grade, player.xp, player.played, player.readAloud, player.treasures],
    );
    for (const grade of [2, 3]) {
      for (const level of levelsFor(grade)) assert.equal(moved.adventures[grade].done[level.id]?.stars, player.adventures[grade].done[level.id]?.stars, level.id);
      assert.equal(moved.adventures[grade].opened, player.adventures[grade].opened);
    }
    for (const [type, m] of Object.entries(player.mastery)) {
      assert.ok(Math.abs(moved.mastery[type].score - m.score) <= 0.005, type);
      assert.deepEqual([moved.mastery[type].seen, moved.mastery[type].last, moved.mastery[type].day], [m.seen, m.last, m.day]);
    }
    assert.deepEqual(moved.challenges, { 3: 14 });
  });

  it("survive being copied with spaces and line breaks in them", () => {
    const code = encodePlayer(maya());
    const broken = `  ${code.slice(0, 20)}\n${code.slice(20, 50)} ${code.slice(50)}  `;
    assert.deepEqual(decodePlayer(broken), decodePlayer(code));
  });

  it("turn away anything that isn't a code", () => {
    for (const junk of ["", "hello", "NMC1-", "NMC1-!!!!", "NMC1-" + btoa("not json"), "NMC1-" + btoa("42"), encodePlayer(maya()).slice(0, 30)]) {
      const stored = decodePlayer(junk);
      assert.ok(stored === null || importPlayer(newSave(), stored)?.player.name, `"${junk}"`);
    }
    assert.equal(decodePlayer("hello"), null);
    assert.equal(decodePlayer("NMC1-!!!!"), null);
  });

  it("put right a code that has been changed", () => {
    const code = "NMC1-" + btoa(JSON.stringify({ n: "<b>Zed</b> with a very long name indeed", h: "dragon_king", g: 12, x: -4, p: 2, t: [0, 999, 0], a: { 3: ["39x1", 99] }, m: { addition: [500, 3, 1], made_up: [50, 2, 1] } }))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const { player } = importPlayer(newSave(), decodePlayer(code));
    assert.equal(player.name.length, 20);
    assert.deepEqual([player.heroId, player.grade, player.xp, player.played], ["cat_ninja", 0, 0, 2]);
    assert.deepEqual(player.treasures, [TREASURES[0].id]);
    // Of "39x1", only the stars that can be are kept; a chapter past the end is the last one.
    const levels = levelsFor(3);
    assert.deepEqual(Object.keys(player.adventures[3].done), [levels[0].id, levels[3].id]);
    assert.equal(player.adventures[3].opened, 7);
    assert.deepEqual(player.mastery, {});
  });

  it("can't bring a player in when the device is full", () => {
    let save = newSave();
    for (let i = 0; i < MOST_PLAYERS; i++) save = addPlayer(save, { name: `P${i}`, heroId: "cat_ninja", grade: 0 }).save;
    assert.equal(importPlayer(save, decodePlayer(encodePlayer(maya()))), null);
  });
});
