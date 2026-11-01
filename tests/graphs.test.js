// tests/graphs.test.js — reading graphs (src/questions/graphs.js): each
// answer worked out again from the graph's own data.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pictureGraph, barGraph } from "../src/questions/graphs.js";
import { questionsOf } from "./helpers.js";

/** The graph's categories, and which of them the prompt names, in the order it names them. */
function read(question) {
  const v = question.visual;
  const rows = v.kind === "picture_graph" ? v.rows : v.bars;
  const prompt = question.prompt.toLowerCase();
  const named = rows
    .filter(r => prompt.includes(r.label.toLowerCase()))
    .sort((a, b) => prompt.indexOf(a.label.toLowerCase()) - prompt.indexOf(b.label.toLowerCase()));
  return { v, rows, named };
}

for (const type of [pictureGraph, barGraph]) {
  describe(type.name, () => {
    it("are answered from what the graph shows", () => {
      for (const { question: q, at } of questionsOf(type)) {
        const { rows, named } = read(q);
        const values = rows.map(r => r.value);
        if (/most|fewest|least/.test(q.prompt)) {
          const pick = /most/.test(q.prompt) ? Math.max(...values) : Math.min(...values);
          assert.equal(q.answer, rows.find(r => r.value === pick).label, at);
        } else if (/more/.test(q.prompt)) {
          assert.equal(named.length, 2, at);
          assert.equal(q.answer, named[0].value - named[1].value, at);
          assert.ok(q.answer > 0, at);
        } else if (/in all/.test(q.prompt)) {
          assert.equal(q.answer, values.reduce((a, b) => a + b, 0), at);
        } else {
          assert.equal(named.length, 1, at);
          assert.equal(q.answer, named[0].value, at);
        }
      }
    });

    it("never have two categories with the same value", () => {
      for (const { question: q, at } of questionsOf(type)) {
        const values = read(q).rows.map(r => r.value);
        assert.equal(new Set(values).size, values.length, at);
      }
    });

    it("have three categories in first grade, four after, and a scale from third grade", () => {
      for (const { grade, question: q, at } of questionsOf(type)) {
        const { v, rows } = read(q);
        const scale = v.kind === "picture_graph" ? v.each : v.scale;
        assert.equal(rows.length, grade < 2 ? 3 : 4, at);
        assert.ok(grade < 3 ? scale === 1 : [2, 5, 10].includes(scale), at);
      }
    });
  });
}

describe("picture graphs", () => {
  it("only show whole pictures", () => {
    for (const { question: q, at } of questionsOf(pictureGraph)) {
      for (const row of q.visual.rows) assert.equal(row.value % q.visual.each, 0, at);
    }
  });
});

describe("bar graphs", () => {
  it("have a scale tall enough for every bar, ending on a gridline", () => {
    for (const { question: q, at } of questionsOf(barGraph)) {
      const { max, scale, bars } = q.visual;
      assert.equal(max % scale, 0, at);
      assert.ok(bars.every(b => b.value <= max) && bars.some(b => b.value > max - scale), at);
    }
  });

  it("end bars on a gridline, or halfway between from third grade", () => {
    for (const { grade, question: q, at } of questionsOf(barGraph)) {
      const step = grade >= 3 && q.visual.scale % 2 === 0 ? q.visual.scale / 2 : q.visual.scale;
      for (const bar of q.visual.bars) assert.equal(bar.value % step, 0, at);
    }
  });
});
