// tests/measurement_3_6.test.js — area, volume, units, angles and coordinates
// (src/questions/measurement.js, geometry.js): each answer worked out again
// from the prompt and the picture.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { area, volume, conversions } from "../src/questions/measurement.js";
import { angles, coordinates, coordinateText } from "../src/questions/geometry.js";
import { parseFraction, multiply, same, frac } from "../src/questions/rational.js";
import { thousandths } from "../src/questions/decimals.js";
import { gcd } from "../src/questions/rational.js";
import { questionsOf, numbersIn } from "./helpers.js";

/** The number at the start of a label: "8 cm" is 8, "4 1/2 in" is 9/2. */
const labelValue = label => parseFraction(label.replace(/ [a-z]+$/, ""));
const UNITS = { cm: "centimeters", m: "meters", in: "inches", ft: "feet" };

describe("area and perimeter", () => {
  it("are worked out from the sides shown or given", () => {
    for (const { question: q, at } of questionsOf(area)) {
      const v = q.visual;
      const p = q.prompt;
      if (v?.grid) {
        assert.equal(q.answer, v.width * v.height, at);
        continue;
      }
      if (v) {
        // The picture is drawn to the numbers written on it, in the unit the prompt asks about.
        const [base, side] = [v.labels.base, v.labels.height];
        assert.equal(labelValue(base).n, v.width, at);
        if (side !== "?") assert.equal(labelValue(side).n, v.height, at);
        assert.ok(p.includes(UNITS[base.split(" ")[1]]), at);
      }
      const [w, h] = v ? [v.width, v.height] : [0, 0];
      let expected;
      if (/^What is the area of this rectangle/.test(p)) expected = w * h;
      else if (/^What is the perimeter of this rectangle/.test(p)) expected = 2 * (w + h);
      else if (/^What is the area of this triangle/.test(p)) expected = (w * h) / 2;
      else if (/^What is the area of this parallelogram/.test(p)) expected = w * h;
      else if (/^This rectangle has an area of/.test(p)) {
        expected = numbersIn(p)[0] / w;
        assert.equal(v.labels.height, "?", at);
      } else if (/^This rectangle has a perimeter of/.test(p)) {
        expected = numbersIn(p)[0] / 2 - w;
        assert.equal(v.labels.height, "?", at);
      } else if (/^This triangle has an area of/.test(p)) {
        expected = (2 * numbersIn(p)[0]) / w;
      } else {
        const [a, b] = numbersIn(p);
        expected = /How wide is it/.test(p) ? a / b : /square/.test(p.split(".").pop()) ? a * b : 2 * (a + b);
      }
      assert.equal(q.answer, expected, at);
      if (v && /\?$/.test(v.labels.height)) assert.equal(v.height, q.answer, `${at}: the "?" side is drawn to scale`);
    }
  });
});

describe("volume", () => {
  it("is worked out from the cubes, the edges, or the story", () => {
    for (const { question: q, at } of questionsOf(volume)) {
      const v = q.visual;
      const p = q.prompt;
      if (v?.cubes) {
        assert.equal(q.answer, v.length * v.width * v.height, at);
        continue;
      }
      if (v) {
        const edges = [v.labels.length, v.labels.width, v.labels.height].map(labelValue);
        assert.deepEqual([v.length, v.width, v.height], edges.map(e => e.n / e.d), at);
        assert.ok(same(parseFraction(String(q.answer)), edges.reduce(multiply, frac(1))), `${at} → ${q.answer}`);
        continue;
      }
      const n = numbersIn(p);
      const expected = /two boxes/.test(p) ? n[0] * n[1] * n[2] + n[3] * n[4] * n[5]
        : /How tall is it/.test(p) ? n[0] / (n[1] * n[2])
        : n[0] * n[1];
      assert.equal(q.answer, expected, at);
    }
  });
});

describe("units of measure", () => {
  /** How many of the smaller unit make one of the bigger. */
  const FACTS = {
    "kilometers meters": 1000, "meters centimeters": 100, "centimeters millimeters": 10, "kilograms grams": 1000,
    "liters milliliters": 1000, "feet inches": 12, "yards feet": 3, "pounds ounces": 16, "gallons quarts": 4,
    "hours minutes": 60, "minutes seconds": 60, "days hours": 24, "weeks days": 7,
  };

  it("convert from bigger units to smaller, and back", () => {
    for (const { question: q, at } of questionsOf(conversions)) {
      const p = q.prompt;
      let match;
      if ((match = p.match(/^How many (\w+) are in (\d+) (\w+)\?$/))) {
        assert.equal(q.answer, Number(match[2]) * FACTS[`${match[3]} ${match[1]}`], at);
      } else if ((match = p.match(/^How many (\w+) is (\d+) (\w+) and (\d+) (\w+)\?$/))) {
        assert.equal(match[1], match[5], at);
        assert.equal(q.answer, Number(match[2]) * FACTS[`${match[3]} ${match[1]}`] + Number(match[4]), at);
      } else if ((match = p.match(/^How many (\w+) is (\d+) (\w+)\?$/))) {
        // The answer, in the bigger unit, times the factor is the measure in the smaller.
        const factor = FACTS[`${match[1]} ${match[3]}`];
        assert.equal(thousandths(String(q.answer)) * factor, Number(match[2]) * 1000, `${at} → ${q.answer}`);
      } else if ((match = p.match(/^Which unit would you use to measure (how much|how heavy)/))) {
        assert.ok((match[1] === "how much" ? ["liters", "milliliters"] : ["kilograms", "grams"]).includes(q.answer), at);
        assert.deepEqual([...q.choices].sort(), ["grams", "kilograms", "liters", "milliliters"], at);
      } else {
        const [a, b] = numbersIn(p);
        const expected = /How many liters do/.test(p) ? a * b : /shared equally/.test(p) ? a / b : /poured out/.test(p) ? a - b : a + b;
        assert.equal(q.answer, expected, at);
      }
    }
  });
});

describe("angles", () => {
  it("are named, measured and added correctly", () => {
    for (const { question: q, at } of questionsOf(angles)) {
      const p = q.prompt;
      const n = numbersIn(p);
      if (p === "What kind of angle is this?") {
        const d = q.visual.degrees;
        assert.equal(q.answer, d < 90 ? "acute" : d === 90 ? "right" : d < 180 ? "obtuse" : "straight", at);
        assert.ok(d === 90 || Math.abs(d - 90) >= 20, `${at}: ${d}° is too near a right angle to tell by eye`);
        continue;
      }
      const expected = q.visual ? q.visual.degrees
        : /of a full turn\?$/.test(p) ? (360 * n[1]) / n[2]
        : /fit together/.test(p) ? 360 / n[0]
        : /make a right angle/.test(p) ? 90 - n[0]
        : /make a straight angle/.test(p) ? 180 - n[0]
        : /side by side/.test(p) ? n[0] + n[1]
        : 360 - n[0] - n[1];
      assert.equal(q.answer, expected, at);
      if (/degrees/.test(p) && !/fit together/.test(p)) {
        // Wrong sizes come in the answer's steps, so none is ruled out by not being a mark.
        const step = gcd(q.answer, 10);
        for (const c of q.choices) assert.equal(c % step, 0, `${at} → ${c}`);
      }
    }
  });
});

describe("the coordinate plane", () => {
  /** The point a prompt names, from "(3, −2)". */
  const pointsIn = text => [...text.matchAll(/\((−?\d+), (−?\d+)\)/g)].map(m => m.slice(1).map(s => Number(s.replace("−", "-"))));

  it("reads, finds, measures and reflects points", () => {
    for (const { grade, question: q, at } of questionsOf(coordinates)) {
      const p = q.prompt;
      const v = q.visual;
      if (v) {
        for (const point of v.points) {
          assert.ok(point.x >= v.min && point.x <= v.max && point.y >= v.min && point.y <= v.max, at);
          if (grade < 6) assert.ok(point.x >= 0 && point.y >= 0, at);
        }
      }
      let match;
      if ((match = p.match(/^What are the coordinates of point (\w)\?$/))) {
        const point = v.points.find(pt => pt.label === match[1]);
        assert.equal(q.answer, coordinateText(point.x, point.y), at);
      } else if (/^Which point is at/.test(p)) {
        const [[x, y]] = pointsIn(p);
        assert.deepEqual(v.points.filter(pt => pt.x === x && pt.y === y).map(pt => pt.label), [q.answer], at);
        assert.deepEqual([...q.choices].sort(), ["A", "B", "C", "D"], at);
      } else if (/apart/.test(p)) {
        const [a, b] = v ? v.points.map(pt => [pt.x, pt.y]) : pointsIn(p);
        assert.ok(a[0] === b[0] || a[1] === b[1], `${at}: the points are level`);
        assert.equal(q.answer, Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]), at);
      } else {
        const [[x, y]] = pointsIn(p);
        assert.equal(q.answer, p.includes("x-axis") ? coordinateText(x, -y) : coordinateText(-x, y), at);
      }
    }
  });
});
