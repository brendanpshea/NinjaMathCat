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
      if (q.visual || !q.prompt.includes(" starts at ")) continue;
      asked++;
      assert.ok(grade >= 3, `${at}: elapsed time starts in third grade`);
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

describe("AM and PM", () => {
  /** When each thing is done, written out again, in hours after midnight. */
  const WHEN = {
    "eat breakfast": [6, 9], "wake up for school": [6, 8], "get to school": [7, 9], "eat lunch at school": [11, 13],
    "go home from school": [14, 16], "play at the park after school": [15, 18], "eat dinner": [17, 19], "go to bed": [19, 21],
  };

  it("pick the one time of day that fits, from times that are only right on the clock", () => {
    const seen = new Set();
    for (const { grade, question: q, at } of questionsOf(time)) {
      const doing = q.prompt.match(/^Which is the best time to (.+)\?$/)?.[1];
      const meaning = q.prompt.match(/^Which times of day are written with (AM|PM)\?$/)?.[1];
      if (!doing && !meaning) continue;
      assert.ok(grade >= 2 && grade < 3, `${at}: AM and PM are for second grade`);
      if (meaning) {
        seen.add("meaning");
        assert.equal(q.answer, meaning === "AM" ? "from midnight until noon" : "from noon until midnight", at);
        continue;
      }
      seen.add("best time");
      const [from, to] = WHEN[doing];
      const fits = c => parseTime(c) >= from * 60 && parseTime(c) <= to * 60;
      for (const c of q.choices) assert.equal(fits(c), c === q.answer, `${at} → ${c}`);
      // Every choice reads the same on a clock face, or is a time in the night.
      const clock = q.answer.split(" ")[0];
      assert.ok(q.choices.some(c => c !== q.answer && c.startsWith(`${clock} `)), `${at}: the same time the other half of the day is a choice`);
    }
    assert.equal(seen.size, 2);
  });
});
