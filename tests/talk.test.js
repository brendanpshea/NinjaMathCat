// tests/talk.test.js — something for a grown-up to talk about after a level
// (src/talk.js).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TALK, talkAbout } from "../src/talk.js";
import { CURRICULUM } from "../src/curriculum.js";
import { createRng } from "../src/rng.js";

describe("talking about it", () => {
  it("has something for every kind of question the game asks", () => {
    for (const { type } of CURRICULUM) assert.ok(TALK[type.id]?.length > 0, type.id);
    for (const id of Object.keys(TALK)) assert.ok(CURRICULUM.some(r => r.type.id === id), `${id} is a kind the game asks`);
  });

  it("is short and everyday: a question to ask or a thing to do, in a sentence or two", () => {
    for (const [id, lines] of Object.entries(TALK)) {
      for (const line of lines) {
        assert.ok(line.length <= 150, `${id}: "${line}" is short`);
        assert.ok(/^[A-Z]/.test(line) && /[.?)]$/.test(line), `${id}: "${line}" is a sentence`);
      }
    }
  });

  it("picks a kind that was missed, where one was, since talking it through helps most there", () => {
    const answers = [{ type: "addition", outcome: "firstTry" }, { type: "time", outcome: "missed" }, { type: "addition", outcome: "firstTry" }];
    for (let seed = 1; seed <= 20; seed++) assert.ok(TALK.time.includes(talkAbout(createRng(seed), answers)));
    const allRight = [{ type: "money", outcome: "firstTry" }];
    assert.ok(TALK.money.includes(talkAbout(createRng(3), allRight)));
    assert.match(talkAbout(createRng(3), []), /hardest/);
  });
});
