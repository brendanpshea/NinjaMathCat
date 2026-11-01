// Shared by the tests: lots of questions of a type, at every grade that asks
// it, each labelled so a failure can be replayed exactly.

import { createRng } from "../src/rng.js";
import { CURRICULUM, GRADES } from "../src/curriculum.js";
import { makeQuestion } from "../src/questions/common.js";

/** How many questions of each type to make at each grade. */
export const SEEDS = 400;

/** The grades on the ladder that ask a type. */
export function gradesFor(type) {
  const entry = CURRICULUM.find(e => e.type === type);
  return GRADES.map(g => g.grade).filter(g => g >= entry.from && g <= entry.to);
}

/**
 * Questions of a type at every grade that asks it, seeds 1 to `seeds`. Each
 * comes with `at`, a label naming the grade and seed for assertion messages;
 * makeQuestion(createRng(seed), type, grade) makes the same question again.
 */
export function* questionsOf(type, seeds = SEEDS) {
  for (const grade of gradesFor(type)) {
    for (let seed = 1; seed <= seeds; seed++) {
      const question = makeQuestion(createRng(seed), type, grade);
      yield { grade, seed, question, at: `${type.id}, grade ${grade}, seed ${seed}: ${question.prompt}` };
    }
  }
}

/** The whole numbers in a piece of text, in order. */
export function numbersIn(text) {
  return (text.match(/\d+/g) ?? []).map(Number);
}
