// tests/measuring.test.js — measuring length from kindergarten to 2nd grade
// (src/questions/measuring.js): each answer worked out again from the
// picture or the prompt.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { measuring } from "../src/questions/measuring.js";
import { questionsOf, numbersIn } from "./helpers.js";

/** The ribbon of a color in a question's picture. */
const ribbonOf = (q, color) => q.visual.ribbons.find(r => r.color === color);

describe("measuring length", () => {
  it("compares, orders, counts cubes, reads rulers and answers stories correctly", () => {
    const seen = new Set();
    for (const { grade, question: q, at } of questionsOf(measuring)) {
      const p = q.prompt;
      const v = q.visual;
      let kind;
      if (/^Which ribbon is the (longest|shortest)\?$/.test(p)) {
        kind = "longest";
        const most = p.includes("longest");
        const lengths = v.ribbons.map(r => r.length);
        const best = most ? Math.max(...lengths) : Math.min(...lengths);
        for (const c of q.choices) assert.equal(ribbonOf(q, c.split(" ")[1]).length === best, c === q.answer, `${at} → ${c}`);
      } else if (/^Which puts the ribbons in order/.test(p)) {
        kind = "order";
        const upward = p.includes("shortest to longest");
        const inOrder = c => {
          const lengths = c.split(", ").map(color => ribbonOf(q, color).length);
          return lengths.every((n, i) => i === 0 || (upward ? n > lengths[i - 1] : n < lengths[i - 1]));
        };
        for (const c of q.choices) assert.equal(inOrder(c), c === q.answer, `${at} → ${c}`);
      } else if (/is longer than the .+ ribbon\. The/.test(p)) {
        kind = "through";
        const [, a, , c] = p.match(/^The (\w+) ribbon is longer than the (\w+) ribbon\. The \w+ ribbon is longer than the (\w+) ribbon\. Which/);
        assert.equal(q.answer, `the ${p.endsWith("longest?") ? a : c} ribbon`, at);
      } else if (p === "How many cubes long is the ribbon?") {
        kind = "cubes";
        assert.ok(v.cubes && !v.ruler, at);
        assert.equal(q.answer, v.ribbons[0].length, at);
      } else if (/^How long is the ribbon, in (inches|centimeters)\?$/.test(p)) {
        kind = "ruler";
        assert.equal(v.ruler, p.match(/in (\w+)\?$/)[1], at);
        const [ribbon] = v.ribbons;
        assert.equal(q.answer, ribbon.length, at);
        assert.ok(ribbon.from + ribbon.length <= v.span, at);
      } else if (/^How much longer is the (\w+) ribbon than the (\w+) ribbon/.test(p)) {
        kind = "longer";
        const [, long, short] = p.match(/^How much longer is the (\w+) ribbon than the (\w+) ribbon/);
        assert.equal(q.answer, ribbonOf(q, long).length - ribbonOf(q, short).length, at);
        assert.ok(q.answer > 0, at);
      } else if (/Which is longer, a (.+) or a (.+)\?$/.test(p)) {
        kind = "twoUnits";
        const [, few, big, many, small] = p.match(/It is (\d+) (.+?)s long, and (\d+) (.+?)s long\./);
        assert.ok(Number(few) < Number(many), at);
        assert.equal(q.answer, `a ${big}`, at);
        assert.notEqual(big, small, at);
      } else if (/Which number will be bigger\?$/.test(p)) {
        kind = "twoUnits";
        const [, small] = p.match(/ in (\w+), and then in (\w+)\./);
        assert.equal(q.answer, `the number of ${small}`, at);
      } else if (/^About how (long|tall|high) is/.test(p)) {
        kind = "estimate";
        assert.match(q.answer, /^\d+ (inches|feet|centimeters|meters)$/, at);
      } else {
        kind = "story";
        const [a, b] = numbersIn(p);
        assert.equal(q.answer, /end to end/.test(p) ? a + b : a - b, at);
        if (/ribbons/.test(p)) assert.match(p, /centimeters|inches/, `${at}: ribbons are measured in small units`);
        assert.ok(q.answer > 0 && q.answer <= 100, `${at}: within 100 (2.MD.5)`);
      }
      seen.add(kind);
      // Kindergarten compares; first grade orders and counts cubes; rulers, estimates and stories come in second.
      const expected = grade < 1 ? ["longest"] : grade < 2 ? ["order", "through", "cubes"] : ["ruler", "longer", "twoUnits", "estimate", "story"];
      assert.ok(expected.includes(kind), `${at}: ${kind} at grade ${grade}`);
    }
    assert.equal(seen.size, 9);
  });
});
