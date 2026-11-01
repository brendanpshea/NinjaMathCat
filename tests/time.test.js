// tests/time.test.js — clocks and elapsed time (src/questions/time.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { time, formatClock, formatTime, formatDuration, CLOCK_STEP } from "../src/questions/time.js";
import { atGrade } from "../src/questions/common.js";
import { questionsOf } from "./helpers.js";

/** Minutes after midnight from "3:05 PM". */
function parseTime(text) {
  const [, h, m, half] = text.match(/^(\d+):(\d+) (AM|PM)$/);
  return ((Number(h) % 12) + (half === "PM" ? 12 : 0)) * 60 + Number(m);
}

/** Minutes from "2 hours 5 minutes". */
function parseDuration(text) {
  const hours = Number(text.match(/(\d+) hours?/)?.[1] ?? 0);
  const minutes = Number(text.match(/(\d+) minutes?/)?.[1] ?? 0);
  return hours * 60 + minutes;
}

describe("formatting time", () => {
  it("writes clock readings and times of day", () => {
    assert.equal(formatClock(3, 5), "3:05");
    assert.equal(formatTime(0), "12:00 AM");
    assert.equal(formatTime(12 * 60), "12:00 PM");
    assert.equal(formatTime(13 * 60 + 5), "1:05 PM");
    assert.equal(formatTime(11 * 60 + 59), "11:59 AM");
  });

  it("writes lengths of time", () => {
    assert.equal(formatDuration(45), "45 minutes");
    assert.equal(formatDuration(60), "1 hour");
    assert.equal(formatDuration(61), "1 hour 1 minute");
    assert.equal(formatDuration(130), "2 hours 10 minutes");
  });
});

describe("clock questions", () => {
  it("read the clock shown, in steps the grade can read", () => {
    for (const { grade, question: q, at } of questionsOf(time)) {
      if (!q.visual) continue;
      const { hours, minutes } = q.visual;
      assert.equal(q.answer, formatClock(hours, minutes), at);
      assert.ok(hours >= 1 && hours <= 12, at);
      assert.equal(minutes % atGrade(grade, CLOCK_STEP), 0, at);
    }
  });
});

describe("elapsed time questions", () => {
  it("work out how long, or when it ends", () => {
    let asked = 0;
    for (const { grade, question: q, at } of questionsOf(time)) {
      if (q.visual) continue;
      asked++;
      assert.equal(grade, 3, `${at}: elapsed time is a third-grade skill`);
      const [, start, rest] = q.prompt.match(/starts at (\d+:\d+ [AP]M) and (.*)$/);
      const ends = rest.match(/^ends at (\d+:\d+ [AP]M)\./);
      if (ends) {
        assert.equal(parseDuration(q.answer), parseTime(ends[1]) - parseTime(start), at);
      } else {
        const length = parseDuration(rest.match(/^lasts (.+)\. When/)[1]);
        assert.equal(parseTime(q.answer), parseTime(start) + length, at);
      }
    }
    assert.ok(asked > 0);
  });
});
