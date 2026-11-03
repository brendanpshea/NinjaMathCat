// tests/save.test.js — what the game remembers (src/save.js): its players and
// their progress.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadSave, writeSave, newSave, addPlayer, importPlayer, updatePlayer, removePlayer, currentPlayer, progressIn, MOST_PLAYERS, LONGEST_NAME } from "../src/save.js";
import { levelsFor, recordLevel, newProgress } from "../src/adventures.js";
import { KEEPSAKES } from "../src/treasures.js";

/** A stand-in for localStorage. */
function memoryStorage(initial = {}) {
  const items = new Map(Object.entries(initial));
  return { getItem: key => items.get(key) ?? null, setItem: (key, value) => items.set(key, String(value)), items };
}

const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("full"); } };

describe("the save", () => {
  const owl = { name: "Maya", heroId: "owl_wizard", grade: 3 };

  it("starts with nobody playing yet, and the sound on", () => {
    assert.deepEqual(loadSave(memoryStorage()), newSave());
    assert.deepEqual(newSave(), { players: [], current: null, muted: false, locked: false, classCodes: [] });
  });

  it("adds players, each new one the current one, and names a blank one by number", () => {
    let { save, player } = addPlayer(newSave(), owl);
    assert.deepEqual(player, { id: "p1", name: "Maya", heroId: "owl_wizard", grade: 3, readAloud: false, xp: 0, treasures: [], remembered: {}, adventures: {}, mastery: {}, played: 0, backedUp: 0, challenges: {} });
    ({ save, player } = addPlayer(save, { name: "   ", heroId: "dragon_king", grade: 9 }));
    assert.deepEqual([player.name, player.heroId, player.grade], ["Player 2", "cat_ninja", 0]);
    // Questions are read aloud for the youngest, unless chosen otherwise.
    assert.equal(player.readAloud, true);
    assert.equal(addPlayer(save, { name: "Kim", heroId: "owl_wizard", grade: 1, readAloud: false }).player.readAloud, false);
    assert.equal(currentPlayer(save), player);
    assert.equal(addPlayer(save, { name: "A name much too long to fit on a card", heroId: "owl_wizard", grade: 1 }).player.name.length, LONGEST_NAME);
  });

  it("changes and removes players", () => {
    let { save } = addPlayer(newSave(), owl);
    save = updatePlayer(save, "p1", { xp: 300, grade: 4 });
    assert.deepEqual([currentPlayer(save).xp, currentPlayer(save).grade], [300, 4]);
    save = removePlayer(save, "p1");
    assert.deepEqual([save.players, save.current], [[], null]);
  });

  it("keeps no more than a dozen players", () => {
    let save = newSave();
    for (let i = 0; i < MOST_PLAYERS; i++) save = addPlayer(save, owl).save;
    assert.throws(() => addPlayer(save, owl), RangeError);
  });

  it("comes back as it was written, progress and all", () => {
    const storage = memoryStorage();
    let { save, player } = addPlayer(newSave(), owl);
    const level = levelsFor(3)[0];
    const progress = recordLevel(progressIn(player, 3), level, { firstTry: 7, secondTry: 1, missed: 0, knockouts: 0, byType: {} });
    save = updatePlayer({ ...save, muted: true, locked: true, classCodes: ["NMC1-abc"] }, player.id, {
      xp: 730, treasures: [KEEPSAKES[3].id, KEEPSAKES[0].id], remembered: { [KEEPSAKES[0].id]: { type: "addition", after: 6, day: 20759 } }, adventures: { 3: progress },
      mastery: { addition: { score: 0.72, seen: 9, last: 4, day: 20760 } }, played: 5, backedUp: 4, challenges: { 3: 17 },
    });
    assert.equal(writeSave(storage, save), true);
    assert.deepEqual(loadSave(storage), save);
    assert.deepEqual(progressIn(currentPlayer(loadSave(storage)), 3).done[level.id], { stars: 2, firstTry: 7, asked: 8 });
    assert.deepEqual(progressIn(player, 5), newProgress());
  });

  it("puts right anything that no longer makes sense", () => {
    const level = levelsFor(2)[0].id;
    const storage = memoryStorage({
      "ninja-math-cat": JSON.stringify({
        players: [
          { id: "p1", name: 42, heroId: "dragon_king", grade: 2.5, xp: -5, treasures: ["nope", KEEPSAKES[1].id, KEEPSAKES[1].id, 7, KEEPSAKES[2].id], played: 3, backedUp: 9,
            // What a keepsake was for is kept only for one that is had, for a kind that was met, with a sensible gap and day.
            remembered: {
              [KEEPSAKES[1].id]: { type: "addition", after: 4, day: 20750 },
              [KEEPSAKES[2].id]: { type: "addition", after: -1, day: 20750 },
              [KEEPSAKES[5].id]: { type: "addition", after: 4, day: 20750 },
              nope: { type: "addition", after: 4, day: 20750 },
            },
            challenges: { 3: 14, 4: -2, 5: "lots", 6: 2.5, 12: 9 },
            mastery: { addition: { score: 0.4, seen: 2, last: 9 }, subtraction: { score: 7, seen: 1, last: 0 }, gone_type: { score: 0.5, seen: 1, last: 0 }, shapes: { score: 0.9, seen: 0, last: 1 } },
            adventures: { 2: { done: { [level]: { stars: 2, firstTry: 6, asked: 8 }, "2-gone.1": { stars: 3, firstTry: 8, asked: 8 }, [levelsFor(2)[1].id]: { stars: 9, firstTry: 1, asked: 1 } }, opened: 99 }, 12: { done: {} } } },
          { id: "p1", name: "A copy" },
          { id: "nobody" },
        ],
        current: "p7",
        muted: "yes",
        locked: "yes",
        classCodes: ["NMC1-abc", 42, "hello", null],
      }),
    });
    const save = loadSave(storage);
    assert.equal(save.players.length, 1);
    assert.deepEqual(save.players[0], {
      id: "p1", name: "Player 1", heroId: "cat_ninja", grade: 0, readAloud: true, xp: 0, treasures: [KEEPSAKES[1].id, KEEPSAKES[2].id],
      remembered: { [KEEPSAKES[1].id]: { type: "addition", after: 4, day: 20750 } },
      adventures: { 2: { done: { [level]: { stars: 2, firstTry: 6, asked: 8 } }, opened: 7 } },
      // A kind's last time can't be after the battles played; a score outside 0 to 1, a kind
      // the game no longer has, or one never seen, is dropped.
      mastery: { addition: { score: 0.4, seen: 2, last: 3 } },
      played: 3,
      // Nor can the last copy kept.
      backedUp: 3,
      // Best challenge scores are whole numbers, for grades that have an adventure.
      challenges: { 3: 14 },
    });
    assert.deepEqual([save.current, save.muted, save.locked, save.classCodes], [null, false, false, ["NMC1-abc"]]);
  });

  it("turns a save from before there were players into the first player", () => {
    const storage = memoryStorage({
      "ninja-math-cat": JSON.stringify({ heroId: "owl_wizard", grade: 2.5, xp: 730, treasures: [KEEPSAKES[3].id], muted: true }),
    });
    const save = loadSave(storage);
    assert.deepEqual(save, {
      players: [{ id: "p1", name: "Player 1", heroId: "owl_wizard", grade: 2, readAloud: true, xp: 730, treasures: [KEEPSAKES[3].id], remembered: {}, adventures: {}, mastery: {}, played: 0, backedUp: 0, challenges: {} }],
      current: "p1",
      muted: true,
      locked: false,
      classCodes: [],
    });
  });

  it("counts a player brought by a progress code as just copied, so no reminder comes at once", () => {
    const { save, player } = /** @type {{ save: any, player: any }} */ (importPlayer(newSave(), { name: "Maya", heroId: "owl_wizard", grade: 3, played: 26 }));
    assert.deepEqual([player.played, player.backedUp, save.current], [26, 26, player.id]);
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
