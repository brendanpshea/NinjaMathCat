// tests/combat.test.js — the numbers behind a fight (src/combat.js), checked
// as the feel they are meant to have.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  heroStats, monsterStats, monsterLevel, hitDamage, streakMultiplier, xpToReach, levelForXp, victoryHeal, XP,
} from "../src/combat.js";

const LEVELS = [1, 2, 3, 5, 10, 25, 50];

describe("heroes and monsters", () => {
  it("start where the game was tuned: a hero at 100 health and 20 attack, a monster at 80 and 15", () => {
    assert.deepEqual(heroStats(1), { maxHp: 100, attack: 20 });
    assert.deepEqual(monsterStats(1), { maxHp: 80, attack: 15 });
  });

  it("grow stronger at every level, in friendly steps of 5", () => {
    for (let level = 1; level < 50; level++) {
      for (const stats of [heroStats, monsterStats]) {
        const [now, next] = [stats(level), stats(level + 1)];
        assert.ok(next.maxHp > now.maxHp && next.attack >= now.attack, `level ${level}`);
        assert.equal(next.maxHp % 5 + next.attack % 5, 0, `level ${level + 1}`);
      }
    }
  });

  it("fight evenly at any level: four or five plain right answers beat an equal monster", () => {
    for (const level of LEVELS) {
      const hits = Math.ceil(monsterStats(level).maxHp / heroStats(level).attack);
      assert.ok(hits >= 4 && hits <= 5, `level ${level}: ${hits} hits`);
    }
  });

  it("let a hero take at least five wrong answers from an equal monster", () => {
    for (const level of LEVELS) {
      const blows = Math.ceil(heroStats(level).maxHp / monsterStats(level).attack) - 1;
      assert.ok(blows >= 5, `level ${level}: knocked out after ${blows + 1}`);
    }
  });

  it("pitch an adventure's monsters from the hero's level up to three above", () => {
    assert.equal(monsterLevel(1, 1), 1);
    assert.equal(monsterLevel(4, 1), 4);
    assert.equal(monsterLevel(1, 7), 7);
    assert.equal(monsterLevel(4, 7), 10);
  });
});

describe("hitting", () => {
  const plain = { attack: 20, difficulty: 1, streak: 0, secondTry: false };

  it("hits harder for harder questions", () => {
    assert.equal(hitDamage(plain), 20);
    assert.equal(hitDamage({ ...plain, difficulty: 2 }), 25);
    assert.equal(hitDamage({ ...plain, difficulty: 3 }), 30);
  });

  it("hits half as hard on a second try, with no streak bonus", () => {
    assert.equal(hitDamage({ ...plain, secondTry: true }), 10);
    assert.equal(hitDamage({ ...plain, secondTry: true, streak: 8 }), 10);
  });

  it("builds up with a streak: 1.25 at three in a row, 1.5 at five, double at eight", () => {
    assert.deepEqual([1, 2, 3, 4, 5, 7, 8, 20].map(streakMultiplier), [1, 1, 1.25, 1.25, 1.5, 1.5, 2, 2]);
    assert.equal(hitDamage({ ...plain, streak: 8, difficulty: 3 }), 60);
  });
});

describe("growing", () => {
  it("levels up every 250 experience points", () => {
    assert.equal(xpToReach(1), 0);
    assert.equal(xpToReach(2), 250);
    assert.deepEqual([0, 249, 250, 499, 500, 2500].map(levelForXp), [1, 1, 2, 2, 3, 11]);
    for (let level = 1; level < 30; level++) assert.equal(levelForXp(xpToReach(level)), level);
  });

  it("makes an adventure of eight monsters worth about three levels", () => {
    const beating = 2 * XP.perTier * (1 + 2 + 3 + 4);
    const answering = 30 * XP.firstTry;
    const levels = (beating + answering) / XP.perLevel;
    assert.ok(levels >= 2.5 && levels <= 4, `${levels}`);
  });

  it("heals a quarter of the hero's health for beating a monster", () => {
    assert.equal(victoryHeal(100), 25);
    assert.equal(victoryHeal(150), 38);
  });
});
