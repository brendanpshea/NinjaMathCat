// tests/speech.test.js — reading aloud (src/speech.js): math as a child hears it.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { speakable, questionSpeech, Speaker } from "../src/speech.js";
import { CURRICULUM } from "../src/curriculum.js";
import { questionsOf } from "./helpers.js";

describe("reading aloud", () => {
  it("says fractions and mixed numbers in words", () => {
    assert.equal(speakable("What is 3/4 + 1/4?"), "What is 3 fourths plus 1 fourth?");
    assert.equal(speakable("2 1/2"), "2 and 1 half");
    assert.equal(speakable("25/100"), "25 hundredths");
    assert.equal(speakable("7/15"), "7 over 15");
  });

  it("says the signs of arithmetic, comparison and equations", () => {
    assert.equal(speakable("What number goes in the box? 6 × □ = 42"), "What number goes in the box? 6 times what number equals 42");
    assert.equal(speakable("12 ÷ 4 − 1"), "12 divided by 4 minus 1");
    assert.equal(speakable("x ≥ 5"), "x is greater than or equal to 5");
    assert.equal(speakable("3 < 5"), "3 is less than 5");
    assert.equal(speakable("n² + 4"), "n squared plus 4");
    assert.equal(speakable("90° and 25%"), "90 degrees and 25 percent");
  });

  it("tells a negative number from taking away", () => {
    assert.equal(speakable("−3 is less than −1"), "negative 3 is less than negative 1");
    assert.equal(speakable("(−4, 2)"), "(negative 4, 2)");
    assert.equal(speakable("8 − 3"), "8 minus 3");
  });

  it("reads a time as a time, and a ratio as a ratio", () => {
    assert.equal(speakable("3:45"), "3:45");
    assert.equal(speakable("2:3"), "2 to 3");
    assert.equal(speakable("5:13", { ratios: true }), "5 to 13");
  });

  it("says money in dollars and cents, as a child would", () => {
    assert.equal(speakable("$2.75"), "2 dollars and 75 cents");
    assert.equal(speakable("$1.00"), "1 dollar");
    assert.equal(speakable("$0.05"), "5 cents");
    assert.equal(speakable("$10"), "10 dollars");
    assert.equal(speakable("55¢ and 1¢"), "55 cents and 1 cent");
    assert.equal(speakable("A toy car costs $4.50. Malik has 90¢."), "A toy car costs 4 dollars and 50 cents. Malik has 90 cents.");
  });

  it("reads a question's choices with their numbers", () => {
    assert.equal(questionSpeech("What comes next?", [5, "seven"]), "What comes next? 1, 5. 2, seven.");
  });

  it("leaves no math sign unspoken in any question the game asks", () => {
    for (const { type } of CURRICULUM) {
      for (const { question: q, at } of questionsOf(type, 30)) {
        const said = speakable(questionSpeech(q.prompt, q.choices), { ratios: type.id === "ratios" });
        assert.ok(!/[+×÷−=□≤≥<>²³⁴⁵°$¢]/.test(said), `${at}: "${said}"`);
        assert.ok(!/\d\/\d/.test(said), `${at}: "${said}"`);
      }
    }
  });

  it("says nothing, and breaks nothing, where the browser can't speak", () => {
    const speaker = new Speaker(undefined);
    assert.equal(speaker.available, false);
    speaker.say("Hello");
    speaker.stop();
  });

  it("cuts off what it was saying, and can speak higher or lower, as a monster and a hero do", () => {
    const spoken = [];
    let cancels = 0;
    const synth = /** @type {any} */ ({ speak: u => spoken.push(u), cancel: () => { cancels++; } });
    const before = globalThis.SpeechSynthesisUtterance;
    globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; this.pitch = 1; } };
    try {
      const speaker = new Speaker(synth);
      speaker.say("I rain 3/4 of the dots!", { pitch: 0.75 });
      speaker.say("Not too many for me!");
      assert.deepEqual(spoken.map(u => [u.text, u.pitch]), [["I rain 3 fourths of the dots!", 0.75], ["Not too many for me!", 1]]);
      assert.equal(cancels, 2);
    } finally {
      globalThis.SpeechSynthesisUtterance = before;
    }
  });
});
