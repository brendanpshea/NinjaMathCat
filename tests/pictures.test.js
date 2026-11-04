// tests/pictures.test.js — the game's own pictures for what questions show
// (src/pictures.js): every emoji a question shows has one planned, and each
// is drawn as itself until its picture is made.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { PICTURES, COUNTERS, pictureOf, counterOf } from "../src/pictures.js";
import { DRAWN } from "../src/picture_art.js";
import { glyph } from "../src/visuals/svg.js";
import { CURRICULUM } from "../src/curriculum.js";
import { questionsOf, elementsIn } from "./helpers.js";

/** Every emoji a question's picture shows, or offers as an answer. */
function emojiShown() {
  const shown = new Set();
  for (const { type } of CURRICULUM) {
    for (const { question: q } of questionsOf(type, 60)) {
      const v = q.visual;
      if (v?.kind === "objects") shown.add(v.emoji);
      if (v?.kind === "groups") v.rows.forEach(r => shown.add(r.emoji));
      if (v?.kind === "pattern") v.items.forEach(i => i !== null && shown.add(i));
      if (v?.kind === "picture_graph") v.rows.forEach(r => shown.add(r.icon));
      for (const c of q.choices) if (typeof c === "string" && !/[\p{L}\p{N}]/u.test(c)) shown.add(c);
    }
  }
  return shown;
}

describe("question pictures", () => {
  it("are planned for every emoji a question shows, or drawn as a circle for a coloured counter", () => {
    const bare = e => e.replace(/️/g, "");
    const planned = new Set([...Object.keys(PICTURES), ...Object.keys(COUNTERS)].map(bare));
    assert.deepEqual([...emojiShown()].filter(e => !planned.has(bare(e))), []);
  });

  it("are each asked for once in tools/icon_sheets.json, and listed as drawn only when there", () => {
    const groups = JSON.parse(readFileSync("tools/icon_sheets.json", "utf8")).groups;
    const asked = groups.filter(g => g.folder === "assets/pictures").flatMap(g => g.sheets.flatMap(s => s.items.map(i => i.id)));
    for (const [id] of Object.values(PICTURES)) assert.equal(asked.filter(a => a === id).length, 1, id);
    for (const id of DRAWN) {
      assert.ok(asked.includes(id), `${id} is not asked for`);
      assert.ok(existsSync(`assets/pictures/${id}.webp`), `${id} has no picture`);
    }
  });

  it("show as the emoji until drawn, then as the picture, with the same attributes either way", () => {
    const attrs = { x: 30, y: 40, size: 34, class: "counter", "data-part": "item-0" };
    const plain = glyph(attrs, "🍎", new Set());
    assert.equal(elementsIn(plain, "text", "counter").length, 1);
    assert.match(plain, />🍎<\/text>$/);
    const drawn = glyph(attrs, "🍎", new Set(["apple_red"]));
    const [image] = elementsIn(drawn, "image", "counter");
    assert.deepEqual([image.href, image["data-part"], image.x, image.width], ["assets/pictures/apple_red.webp", "item-0", "9.6", "40.8"], "centred where the emoji was");
    assert.deepEqual(pictureOf("⭐️", new Set(["star"])), { file: "assets/pictures/star.webp", name: "star" }, "with or without the colour selector");
    assert.equal(pictureOf("🦄", new Set(["star"])), null, "an emoji with no picture stays itself");
  });

  it("draw a coloured counter as a circle in its colour, named for a screen reader", () => {
    const [circle] = elementsIn(glyph({ x: 30, y: 40, size: 34, class: "counter" }, "🔵"), "circle", "counter");
    assert.deepEqual([circle.cx, circle.cy, circle.fill], ["30", "40", COUNTERS["🔵"][0]]);
    assert.equal(counterOf("🔵")?.name, "blue counter");
    assert.equal(counterOf("🍎"), null);
  });
});
