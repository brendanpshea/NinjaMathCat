// tests/roster.test.js — the monsters (src/monsters.js) and treasures (src/treasures.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MONSTERS, buildAdventure } from "../src/monsters.js";
import { TREASURES, pickTreasure } from "../src/treasures.js";
import { createRng } from "../src/rng.js";

describe("monsters", () => {
  it("have unique ids, and six in each of the four tiers", () => {
    assert.equal(new Set(MONSTERS.map(m => m.id)).size, MONSTERS.length);
    for (const tier of [1, 2, 3, 4]) assert.equal(MONSTERS.filter(m => m.tier === tier).length, 6, `tier ${tier}`);
  });

  it("make adventures of two per tier, weakest first, varying from one to the next", () => {
    const seen = new Set();
    for (let seed = 1; seed <= 20; seed++) {
      const adventure = buildAdventure(createRng(seed));
      assert.deepEqual(adventure.map(m => m.tier), [1, 1, 2, 2, 3, 3, 4, 4]);
      assert.equal(new Set(adventure).size, 8);
      seen.add(adventure.map(m => m.id).join());
    }
    assert.ok(seen.size > 15);
  });
});

describe("treasures", () => {
  it("are all different", () => {
    assert.equal(new Set(TREASURES.map(t => t.id)).size, TREASURES.length);
    assert.equal(new Set(TREASURES.map(t => t.name)).size, TREASURES.length);
    assert.equal(new Set(TREASURES.map(t => t.emoji)).size, TREASURES.length);
  });

  it("drop ones not collected yet while there are any", () => {
    const rng = createRng(4);
    const collected = [];
    for (let i = 0; i < TREASURES.length; i++) {
      const t = pickTreasure(rng, collected);
      assert.ok(!collected.includes(t.id), `${t.id} again after ${i}`);
      collected.push(t.id);
    }
    assert.ok(TREASURES.includes(pickTreasure(rng, collected)), "and any once all are collected");
  });
});
