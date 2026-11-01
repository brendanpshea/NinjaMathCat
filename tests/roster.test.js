// tests/roster.test.js — the monsters (src/monsters.js), heroes (src/heroes.js)
// and treasures (src/treasures.js), and the sprite strips behind them.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { MONSTERS, buildAdventure, monsterSprite } from "../src/monsters.js";
import { HEROES, DEFAULT_HERO, heroSprite } from "../src/heroes.js";
import { TREASURES, pickTreasure } from "../src/treasures.js";
import { createRng } from "../src/rng.js";
import { webpSize } from "../tools/webp_size.js";

/** Every sprite strip in the game: who it is, and its file. */
const STRIPS = [
  ...MONSTERS.map(m => ({ who: m.id, file: monsterSprite(m) })),
  ...HEROES.map(h => ({ who: h.id, file: heroSprite(h) })),
];

describe("monsters", () => {
  it("have unique ids and names, and six in each of the four tiers", () => {
    assert.equal(new Set(MONSTERS.map(m => m.id)).size, MONSTERS.length);
    assert.equal(new Set(MONSTERS.map(m => m.name)).size, MONSTERS.length);
    for (const tier of [1, 2, 3, 4]) assert.equal(MONSTERS.filter(m => m.tier === tier).length, 6, `tier ${tier}`);
  });

  it("are described in one short sentence a beginning reader can manage", () => {
    for (const m of MONSTERS) {
      assert.ok(m.description.length <= 60, `${m.id}: ${m.description.length} characters`);
      assert.match(m.description, /^[A-Z].*[.!]$/, m.id);
      const longest = Math.max(...m.description.replace(/[^A-Za-z' ]/g, "").split(" ").map(w => w.length));
      assert.ok(longest <= 9, `${m.id}: a word of ${longest} letters`);
    }
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

describe("heroes", () => {
  it("have unique ids and names, with Ninja Cat first", () => {
    assert.equal(new Set(HEROES.map(h => h.id)).size, HEROES.length);
    assert.equal(new Set(HEROES.map(h => h.name)).size, HEROES.length);
    assert.equal(DEFAULT_HERO.name, "Ninja Cat");
  });
});

describe("sprite strips", () => {
  it("exist for every monster and hero, as three equal frames 160 pixels tall", () => {
    for (const { who, file } of STRIPS) {
      const { width, height } = webpSize(readFileSync(file));
      assert.equal(height, 160, who);
      assert.equal(width % 3, 0, `${who}: ${width} wide doesn't split into three frames`);
      assert.ok(width / 3 > 100 && width / 3 < 400, `${who}: frames ${width / 3} wide`);
    }
  });

  it("are all in use, so nothing unused is shipped", () => {
    const used = new Set(STRIPS.map(s => s.file));
    for (const folder of ["assets/sprites/monsters", "assets/sprites/heroes"]) {
      for (const name of readdirSync(folder)) assert.ok(used.has(`${folder}/${name}`), `${folder}/${name} is not used`);
    }
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
