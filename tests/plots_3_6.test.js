// tests/plots_3_6.test.js — line plots, dot plots and histograms
// (src/questions/plots.js): each answer read off the picture again.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { linePlot, dataDisplays, STATISTICAL, NOT_STATISTICAL } from "../src/questions/plots.js";
import { parseFraction, same, frac, multiply, add, rulerText } from "../src/questions/rational.js";
import { questionsOf, numbersIn } from "./helpers.js";

/** The lengths in a prompt, as the line plot writes them: "3", "3/4", "2 1/2". */
const lengthsIn = text => [...text.matchAll(/(\d+ \d+\/\d+|\d+\/\d+|\d+) inch/g)].map(m => m[1]);

describe("line plots", () => {
  it("are read correctly: counts, the most common length, differences and totals", () => {
    for (const { question: q, at } of questionsOf(linePlot)) {
      const v = q.visual;
      const p = q.prompt;
      const value = i => frac(v.from + i, v.den);
      /** Which stack a length names. */
      const position = text => v.counts.findIndex((_, i) => same(parseFraction(text), value(i)));
      const lengths = lengthsIn(p).map(position);
      for (const i of lengths) assert.ok(i >= 0, `${at}: the prompt names a length on the plot`);
      const total = v.counts.reduce((a, b) => a + b, 0);
      const filled = v.counts.map((c, i) => (c > 0 ? i : -1)).filter(i => i >= 0);

      let expected;
      if (/^How many \w+ were measured\?$/.test(p)) expected = total;
      else if (/^Which length do the most/.test(p)) expected = rulerText(v.from + v.counts.indexOf(Math.max(...v.counts)), v.den);
      else if (/^How many more/.test(p)) expected = v.counts[lengths[0]] - v.counts[lengths[1]];
      else if (/^How many \w+ are (longer|taller) than/.test(p)) expected = v.counts.slice(lengths[0] + 1).reduce((a, b) => a + b, 0);
      else if (/^How many \w+ are /.test(p)) expected = v.counts[lengths[0]];
      else if (/^How much/.test(p)) expected = rulerText(filled[filled.length - 1] - filled[0], v.den);
      else if (/^All the \w+ that are/.test(p)) expected = multiply(frac(v.counts[lengths[0]]), value(lengths[0]));
      else expected = v.counts.reduce((sum, c, i) => add(sum, multiply(frac(c), value(i))), frac(0));

      if (typeof expected === "object") assert.ok(same(parseFraction(q.answer), expected), `${at} → ${q.answer}`);
      else assert.equal(q.answer, expected, at);
      // Lengths are written as a ruler reads them, so equal lengths are written alike.
      if (typeof q.answer === "string") {
        for (const c of q.choices) assert.equal(c, rulerText(parseFraction(c).n, parseFraction(c).d), `${at} → ${c}`);
      }
    }
  });

  it("say inch for a length up to 1, and inches for more", () => {
    for (const { question: q, at } of questionsOf(linePlot)) {
      for (const [, length, unit] of q.prompt.matchAll(/(\d+ \d+\/\d+|\d+\/\d+|\d+) (inch(?:es)?)\b/g)) {
        const f = parseFraction(length);
        assert.equal(unit, f.n > f.d ? "inches" : "inch", at);
      }
    }
  });
});

describe("dot plots and histograms", () => {
  it("are read correctly: median, mode, range and counts", () => {
    for (const { question: q, at } of questionsOf(dataDisplays)) {
      const v = q.visual;
      const p = q.prompt;
      if (!v) {
        assert.ok(STATISTICAL.includes(q.answer), at);
        for (const c of q.choices) if (c !== q.answer) assert.ok(NOT_STATISTICAL.includes(c), at);
        continue;
      }
      if (v.kind === "bar_graph") {
        assert.ok(v.histogram, at);
        const range = p.match(/ (\d+) to (\d+) /);
        const expected = range
          ? v.bars.find(b => b.label === `${range[1]}–${range[2]}`).value
          : v.bars.filter(b => Number(b.label.split("–")[1]) < numbersIn(p)[0]).reduce((s, b) => s + b.value, 0);
        assert.equal(q.answer, expected, at);
        continue;
      }
      assert.equal(v.den, 1, at);
      const values = v.counts.flatMap((c, i) => Array(c).fill(v.from + i));
      assert.equal(values.length % 2, 1, `${at}: an odd number of dots, so the median is one of them`);
      const expected = /median/.test(p) ? values[(values.length - 1) / 2]
        : /mode/.test(p) ? v.from + v.counts.indexOf(Math.max(...v.counts))
        : /range/.test(p) ? values[values.length - 1] - values[0]
        : values.filter(x => x > numbersIn(p)[0]).length;
      assert.equal(q.answer, expected, at);
      if (/mode/.test(p)) assert.equal(v.counts.filter(c => c === Math.max(...v.counts)).length, 1, `${at}: one mode`);
    }
  });
});
