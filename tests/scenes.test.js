// tests/scenes.test.js — teaching scenes (src/scenes.js, src/scenes/): every
// scene, over many examples, keeps to the rules in docs/SCENES.md. Each
// grade's tests/scenes_grade<N>.test.js works its examples through.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SCENES, sceneFor } from "../src/scenes.js";
import { renderVisual } from "../src/visuals/index.js";
import { speakable } from "../src/speech.js";
import { createRng } from "../src/rng.js";
import { wellFormed, elementsIn } from "./helpers.js";
import { CHAPTERS, playedScenes, picturesOf } from "./helpers/scenes.js";

const words = text => text.split(/\s+/).filter(Boolean).length;

/** The parts of a drawn picture to tap, and every name it can be ringed by. */
function namesIn(svg) {
  const elements = elementsIn(svg, "[a-z]+");
  const parts = elements.map(e => e["data-part"]).filter(Boolean);
  const marks = elements.flatMap(e => (e["data-marks"] ?? "").split(" ")).filter(Boolean);
  return { parts, rings: new Set([...parts, ...marks]) };
}

describe("teaching scenes", () => {
  it("each open a chapter of the adventures, one scene to a chapter", () => {
    for (const scene of SCENES) {
      assert.ok(CHAPTERS.some(c => c.chapter.id === scene.chapter), scene.chapter);
      assert.equal(sceneFor(scene.chapter), scene);
    }
    assert.equal(new Set(SCENES.map(s => s.chapter)).size, SCENES.length);
    assert.equal(sceneFor("no-such-chapter"), null);
  });

  it("keep each step to one short line, shorter for children still learning to read", () => {
    for (const { grade, steps, at } of playedScenes()) {
      assert.ok(steps.length >= 3 && steps.length <= 8, `${at}: ${steps.length} steps`);
      assert.ok(steps[0].picture, `${at}: the picture comes first`);
      assert.ok(!steps[steps.length - 1].check, `${at}: the scene ends on a line, not a question, before the battle`);
      const most = grade < 3 ? 14 : 28;
      for (const step of steps) {
        assert.ok(["hero", "monster"].includes(step.who), at);
        const lines = [step.say, ...(step.check ? [step.check.retry, step.check.right] : [])];
        for (const line of lines) {
          assert.ok(line.trim(), `${at}: an empty line`);
          assert.ok(words(line) <= most, `${at}: "${line}" is over ${most} words`);
          const said = speakable(line);
          assert.ok(!/[+×÷−=□≤≥<>$¢]|\d\/\d/.test(said), `${at}: "${said}" leaves a sign unspoken`);
        }
      }
    }
  });

  it("draw every picture, and point only at parts it has", () => {
    for (const { steps, at } of playedScenes()) {
      for (const picture of picturesOf(steps)) {
        const svg = renderVisual(picture);
        assert.ok(wellFormed(svg) && !/NaN|undefined/.test(svg), at);
        const { rings } = namesIn(svg);
        for (const name of [picture.focus ?? []].flat()) assert.ok(rings.has(name), `${at}: nothing called "${name}" to ring in the ${picture.kind}`);
      }
    }
  });

  it("give each check one right answer among others", () => {
    for (const { grade, steps, at } of playedScenes()) {
      const pictures = picturesOf(steps);
      steps.forEach((step, i) => {
        const check = step.check;
        if (!check) return;
        if (check.kind === "tap") {
          const { parts } = namesIn(renderVisual(pictures[i]));
          assert.ok(check.answers.length > 0 && check.answers.every(a => parts.includes(a)), `${at}: an answer that isn't in the picture`);
          assert.ok(parts.some(p => !check.answers.includes(p)), `${at}: every part is right, so the check can't be got wrong`);
          // A ring round the answer while asking for it would give it away.
          assert.ok(!step.picture?.focus, `${at}: a tap check that rings part of its picture`);
        } else {
          assert.ok(check.choices.length >= 3 && check.choices.length <= 4, at);
          assert.equal(new Set(check.choices.map(String)).size, check.choices.length, `${at}: the same choice twice`);
          assert.equal(check.choices.filter(c => String(c) === String(check.answer)).length, 1, at);
          // Children still learning to read pick numbers, not words.
          if (grade < 3) assert.ok(check.choices.every(c => /^\d+$/.test(String(c))), `${at}: a choice to read`);
        }
      });
    }
  });

  it("are a new example each time they are watched", () => {
    for (const scene of SCENES) {
      const firsts = new Set(Array.from({ length: 20 }, (_, i) => JSON.stringify(scene.steps(createRng(i + 1), { monster: "M", hero: "H" })[0].picture)));
      assert.ok(firsts.size >= 5, `${scene.chapter}: only ${firsts.size} different examples`);
    }
  });
});
