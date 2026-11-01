// tests/choices.test.js — how answer choices are written on the battle screen
// (choiceHtml in src/ui/battle_screen.js), for every kind of answer the
// questions give.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { choiceHtml, feedbackFor } from "../src/ui/battle_screen.js";
import { CURRICULUM } from "../src/curriculum.js";
import { questionsOf, wellFormed } from "./helpers.js";

describe("answer choices", () => {
  it("write numbers with commas and a true minus sign", () => {
    assert.equal(choiceHtml(45210), "45,210");
    assert.equal(choiceHtml(-8), "−8");
  });

  it("stack fractions, and put a mixed number's whole beside its fraction", () => {
    assert.match(choiceHtml("3/4"), /^<math aria-label="3\/4"><mfrac><mn>3<\/mn><mn>4<\/mn><\/mfrac><\/math>$/);
    assert.match(choiceHtml("2 1/2"), /<mn>2<\/mn><mfrac><mn>1<\/mn><mn>2<\/mn><\/mfrac>/);
  });

  it("leave everything else as text, never mistaken for a fraction", () => {
    for (const text of ["(3, −2)", "y = 4x", "5/4 × 12", "992 R 2", "$4.75", "3:4", "25%", "0.75", "n ÷ 9", "Every square is a rectangle."]) {
      assert.equal(choiceHtml(text), text, text);
    }
    assert.equal(choiceHtml("What is my teacher's favorite color?"), "What is my teacher&#39;s favorite color?");
  });

  it("show a picture on its own as big as the question's pictures", () => {
    assert.equal(choiceHtml("🔴"), '<span class="choice-picture">🔴</span>');
  });

  it("are well formed for every question the game asks", () => {
    for (const { type } of CURRICULUM) {
      for (const { question: q, at } of questionsOf(type, 30)) {
        for (const c of q.choices) assert.ok(wellFormed(choiceHtml(c)), `${at} → ${c}`);
      }
    }
  });

  it("name a revealed answer the way the choice showed it", () => {
    const round = answer => ({ then: "reveal", answer, hint: null, defeatedFoe: false });
    assert.equal(feedbackFor(round(45210)), "The answer is 45,210.");
    assert.equal(feedbackFor(round(-8)), "The answer is −8.");
    assert.equal(feedbackFor(round("2 1/2")), "The answer is 2 1/2.");
  });
});
