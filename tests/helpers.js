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

/**
 * The whole numbers in a piece of text, in order. Commas group digits
 * (452,318), and a minus sign right before the digits makes one negative.
 */
export function numbersIn(text) {
  return (text.match(/[−-]?\d+(?:,\d{3})*/g) ?? []).map(n => Number(n.replace(/,/g, "").replace("−", "-")));
}

/**
 * The attributes of every element in some SVG markup with this tag and,
 * if given, this class.
 * @returns {Record<string, string>[]}
 */
export function elementsIn(svg, tag, className) {
  const found = [];
  for (const [, attrs] of svg.matchAll(new RegExp(`<${tag}\\b([^>]*?)/?>`, "g"))) {
    const parsed = Object.fromEntries([...attrs.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]));
    if (!className || (parsed.class ?? "").split(" ").includes(className)) found.push(parsed);
  }
  return found;
}

/**
 * The things drawn to count or match (src/visuals/svg.js glyph), with this
 * class if given: an emoji as text, its picture as an image once drawn, or a
 * coloured counter as a circle.
 * @returns {Record<string, string>[]}
 */
export function picturesIn(svg, className) {
  return [...elementsIn(svg, "text", className), ...elementsIn(svg, "image", className), ...elementsIn(svg, "circle", className)];
}

/** HTML's elements that never close, such as <img>. (SVG's <image> does, as XML.) */
const VOID = new Set(["area", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);

/** Whether markup opens and closes its tags in order, with no stray & or <. */
export function wellFormed(markup) {
  const open = [];
  for (const [tag, closing, name, selfClosing] of markup.matchAll(/<(\/?)([a-zA-Z]+)\b[^>]*?(\/?)>/g)) {
    if (selfClosing || VOID.has(name)) continue;
    if (closing) {
      if (open.pop() !== name) return false;
    } else {
      open.push(name);
    }
    void tag;
  }
  const text = markup.replace(/<[^>]*>/g, "");
  return open.length === 0 && !/[<>]/.test(text) && !/&(?!amp;|lt;|gt;|quot;|#39;)/.test(markup);
}
