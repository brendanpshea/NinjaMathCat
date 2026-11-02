// tests/challenge.test.js — the one-minute challenge (src/challenge.js): what
// it asks, how it scores, and the best score kept.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { challengeMix, startChallenge, answerChallenge, recordChallenge, CHALLENGE_FROM } from "../src/challenge.js";
import { chaptersFor, levelsFor, newProgress, ADVENTURE_GRADES } from "../src/adventures.js";
import { questionKey } from "../src/curriculum.js";
import { createRng } from "../src/rng.js";

/** Progress with every level of the first `chapters` chapters done. */
function doneThrough(grade, chapters) {
  const progress = newProgress();
  for (const level of levelsFor(grade).filter(l => l.chapter < chapters)) progress.done[level.id] = { stars: 3, firstTry: 8, asked: 8 };
  return progress;
}

describe("the one-minute challenge", () => {
  it("is offered from 3rd grade, so the youngest play untimed", () => {
    assert.equal(CHALLENGE_FROM, 3);
  });

  it("asks what the chapters reached so far bring in, and nothing from later on", () => {
    for (const grade of ADVENTURE_GRADES.filter(g => g >= CHALLENGE_FROM)) {
      const chapters = chaptersFor(grade);
      const mix = challengeMix(grade, doneThrough(grade, 2));
      const reached = new Set(chapters.slice(0, 3).flatMap(c => [...c.learn, ...(c.warmup ?? [])]));
      assert.deepEqual(new Set(mix.map(p => p.type)), reached, `grade ${grade}`);
      assert.ok(mix.every(p => p.grade === chapters[2].at && p.weight === 1), `grade ${grade}: pitched where the year has got to, all equally`);
      // At the very start, the first chapter's topics.
      assert.deepEqual(new Set(challengeMix(grade, newProgress()).map(p => p.type)), new Set([...chapters[0].learn, ...(chapters[0].warmup ?? [])]));
    }
  });

  it("scores right answers, moves on after wrong ones, and never asks a question twice", () => {
    const rng = createRng(4);
    let challenge = startChallenge(rng, 4, doneThrough(4, 8));
    const kinds = new Set(challenge.mix.map(p => p.type));
    for (let i = 0; i < 40; i++) {
      const q = challenge.question;
      assert.ok(kinds.has(q.type), q.type);
      const right = i % 3 !== 2;
      const result = answerChallenge(challenge, right ? q.answer : q.choices.find(c => c !== q.answer), rng);
      assert.equal(result.correct, right);
      assert.notEqual(result.challenge.question.type, q.type, "another kind each time, where there is one");
      assert.deepEqual(result.challenge.answers.at(-1), { type: q.type, outcome: right ? "firstTry" : "missed", prompt: q.prompt, answer: q.answer, pictured: Boolean(q.visual) });
      challenge = result.challenge;
    }
    assert.equal(challenge.answers.length, 40);
    assert.equal(challenge.score, challenge.answers.filter(a => a.outcome === "firstTry").length);
    assert.equal(new Set(challenge.asked).size, challenge.asked.length);
    assert.equal(challenge.asked.at(-1), questionKey(challenge.question));
  });

  it("keeps the best score in each grade, and says when it is beaten", () => {
    let result = recordChallenge({}, 3, 12);
    assert.deepEqual(result, { best: { 3: 12 }, before: null, newBest: true });
    result = recordChallenge(result.best, 3, 9);
    assert.deepEqual(result, { best: { 3: 12 }, before: 12, newBest: false });
    result = recordChallenge(result.best, 3, 15);
    assert.deepEqual(result, { best: { 3: 15 }, before: 12, newBest: true });
    assert.deepEqual(recordChallenge(result.best, 4, 0), { best: { 3: 15 }, before: null, newBest: false }, "nothing right sets no best");
  });
});
