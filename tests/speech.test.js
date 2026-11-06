// tests/speech.test.js — reading aloud (src/speech.js): math as a child hears it.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { speakable, questionSpeech, Speaker, readButton } from "../src/speech.js";
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

  it("knows while it is speaking, to the end of what it says, not of what it cut off", () => {
    const { synth, restore } = fakeSynth();
    try {
      const speaker = new Speaker(synth);
      const heard = [];
      speaker.watch(speaking => heard.push(speaking));
      speaker.say("What is 1 + 4?");
      const [first] = synth.spoken;
      speaker.say("Not quite!");
      first.onerror(); // the browser says the cut-off one ended, late
      assert.equal(speaker.speaking, true);
      synth.spoken[1].onend();
      assert.equal(speaker.speaking, false);
      speaker.say("Again");
      speaker.stop();
      assert.equal(speaker.speaking, false);
      assert.deepEqual(heard, [true, false, true, false]);
    } finally {
      restore();
    }
  });

  it("makes Read to me the way to stop reading, too, while anything is read", () => {
    const { synth, restore } = fakeSynth();
    try {
      const speaker = new Speaker(synth);
      const button = fakeButton("Read to me");
      const stopping = () => button.hasAttribute("data-speaking");
      let reads = 0;
      readButton(/** @type {any} */ (button), speaker, () => { reads++; speaker.say("What is 1 + 4?"); });
      assert.match(button.innerHTML, /Read to me.*Stop/, "both labels, so the button keeps one width");
      button.dispatchEvent(new Event("click"));
      assert.equal(reads, 1);
      assert.ok(stopping());
      button.dispatchEvent(new Event("click"));
      assert.equal(speaker.speaking, false, "a tap on Stop stops it");
      assert.equal(reads, 1);
      assert.ok(!stopping());
      speaker.say("Read by itself"); // the question read as it comes, not by the button
      assert.ok(stopping());
      synth.spoken.at(-1).onend();
      assert.ok(!stopping());
      button.isConnected = false; // its screen is gone: it stops watching
      speaker.say("On the next screen");
      assert.ok(!stopping());
    } finally {
      restore();
    }
  });
});

/** Just enough of a button for readButton. @param {string} label */
function fakeButton(label) {
  const attributes = new Set();
  return Object.assign(new EventTarget(), {
    innerHTML: label,
    isConnected: true,
    classList: { add() {} },
    /** @param {string} name @param {boolean} on */
    toggleAttribute(name, on) { if (on) attributes.add(name); else attributes.delete(name); return on; },
    /** @param {string} name */
    hasAttribute: name => attributes.has(name),
  });
}

/** A speech engine that only keeps what it is asked to say, with an utterance to match. */
function fakeSynth() {
  const synth = /** @type {any} */ ({ spoken: [], speak(u) { this.spoken.push(u); }, cancel() {} });
  const before = globalThis.SpeechSynthesisUtterance;
  globalThis.SpeechSynthesisUtterance = /** @type {any} */ (class { constructor(text) { this.text = text; this.pitch = 1; } });
  return { synth, restore: () => { globalThis.SpeechSynthesisUtterance = before; } };
}
