// tests/backdrops.test.js — the settings battles happen in (src/backdrops.js),
// and the pipeline that paints them (assets/backdrops/, tools/).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { BACKDROPS, backdropFor } from "../src/backdrops.js";
import { MONSTERS } from "../src/monsters.js";
import { buildPrompts, promptFor } from "../tools/backdrop_prompts.js";
import { webpSize } from "../tools/webp_size.js";

const { sheets } = JSON.parse(readFileSync("assets/backdrops/scenes.json", "utf8"));

describe("settings", () => {
  it("are each home to three monsters, and every monster lives in one", () => {
    for (const backdrop of BACKDROPS) {
      assert.equal(MONSTERS.filter(m => m.setting === backdrop.id).length, 3, backdrop.id);
    }
    for (const m of MONSTERS) assert.ok(BACKDROPS.some(b => b.id === m.setting), `${m.id} lives in "${m.setting}"`);
  });

  it("have a picture, and a floor line low in it", () => {
    for (const b of BACKDROPS) {
      assert.ok(existsSync(b.file), `${b.id}: ${b.file} is missing`);
      assert.ok(b.floor >= 0.7 && b.floor <= 0.97, `${b.id}: floor ${b.floor}`);
    }
    assert.equal(new Set(BACKDROPS.map(b => b.id)).size, BACKDROPS.length);
  });

  it("fall back to the meadow for a setting there isn't", () => {
    assert.equal(backdropFor("castle").id, "castle");
    assert.equal(backdropFor("moon").id, "meadow");
  });
});

describe("painted backdrops", () => {
  it("are planned for every setting, four to a sheet", () => {
    assert.deepEqual(sheets.flatMap(s => s.scenes.map(c => c.id)).sort(), BACKDROPS.map(b => b.id).sort());
    for (const sheet of sheets) assert.equal(sheet.scenes.length, 4, `sheet ${sheet.id}`);
  });

  it("have prompts.md up to date with scenes.json", () => {
    assert.equal(readFileSync("assets/backdrops/prompts.md", "utf8"), buildPrompts(), "run npm run backdrop-prompts");
  });

  it("ask for the layout the stage needs", () => {
    for (const sheet of sheets) {
      const prompt = promptFor(sheet);
      for (const must of ["portrait 9:16", "pure white line", "bottom fifth", "far left and far right edges", "No people, animals, monsters", "Not pixel art"]) {
        assert.ok(prompt.includes(must), `sheet ${sheet.id}: missing "${must}"`);
      }
    }
  });

  it("are 1920 by 800, light enough to load quickly, and all in use", () => {
    const used = new Set(BACKDROPS.map(b => b.file));
    for (const name of readdirSync("assets/backdrops").filter(n => n.endsWith(".webp"))) {
      const file = `assets/backdrops/${name}`;
      assert.deepEqual(webpSize(readFileSync(file)), { width: 1920, height: 800 }, file);
      assert.ok(statSync(file).size <= 300 * 1024, `${file} is over 300 KB`);
      assert.ok(used.has(file), `${file} is not used by src/backdrops.js`);
    }
  });
});

describe("reading WebP sizes", () => {
  it("reads both kinds the game uses: lossy backdrops and strips with transparency", () => {
    assert.deepEqual(webpSize(readFileSync("tests/fixtures/lossy.webp")), { width: 37, height: 15 });
    assert.deepEqual(webpSize(readFileSync("tests/fixtures/alpha.webp")), { width: 37, height: 15 });
  });
});
