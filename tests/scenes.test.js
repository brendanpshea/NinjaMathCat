// tests/scenes.test.js — teaching scenes (src/scenes.js): every scene, over
// many examples, keeps to the rules in docs/SCENES.md.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SCENES, sceneFor } from "../src/scenes.js";
import { ADVENTURE_GRADES, chaptersFor, residents, settingFor } from "../src/adventures.js";
import { renderVisual } from "../src/visuals/index.js";
import { speakable } from "../src/speech.js";
import { createRng } from "../src/rng.js";
import { wellFormed, elementsIn } from "./helpers.js";

/** Every chapter, with its grade and its place in the grade. */
const CHAPTERS = ADVENTURE_GRADES.flatMap(grade => chaptersFor(grade).map((chapter, place) => ({ grade, place, chapter })));
const words = text => text.split(/\s+/).filter(Boolean).length;

/** Each scene's chapter, and its steps for many seeds. */
function* played() {
  for (const scene of SCENES) {
    const { grade, place, chapter } = CHAPTERS.find(c => c.chapter.id === scene.chapter);
    const monster = residents(settingFor(grade, place))[0].name;
    for (let seed = 1; seed <= 150; seed++) {
      yield { scene, grade, chapter, steps: scene.steps(createRng(seed), { monster, hero: "Ninja Cat" }), at: `${scene.chapter}, seed ${seed}` };
    }
  }
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
    for (const { grade, steps, at } of played()) {
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

  it("draw every picture, and give each check one right answer among others", () => {
    for (const { grade, steps, at } of played()) {
      let picture;
      for (const step of steps) {
        picture = step.picture ?? picture;
        const svg = renderVisual(picture);
        assert.ok(wellFormed(svg) && !/NaN|undefined/.test(svg), at);
        const check = step.check;
        if (!check) continue;
        if (check.kind === "tap") {
          const parts = elementsIn(svg, "[a-z]+").map(e => e["data-part"]).filter(Boolean);
          assert.ok(check.answers.length > 0 && check.answers.every(a => parts.includes(a)), `${at}: an answer that isn't in the picture`);
          assert.ok(parts.some(p => !check.answers.includes(p)), `${at}: every part is right, so the check can't be got wrong`);
        } else {
          assert.ok(check.choices.length >= 3 && check.choices.length <= 4, at);
          assert.equal(new Set(check.choices.map(String)).size, check.choices.length, `${at}: the same choice twice`);
          assert.equal(check.choices.filter(c => String(c) === String(check.answer)).length, 1, at);
          // Children still learning to read pick numbers, not words.
          if (grade < 3) assert.ok(check.choices.every(c => /^\d+$/.test(String(c))), `${at}: a choice to read`);
        }
      }
    }
  });

  it("work the example through rightly", () => {
    for (const { scene, steps, at } of played()) {
      if (scene.chapter === "0-teens") {
        const { filled } = steps[0].picture;
        assert.ok(filled >= 11 && filled <= 19, at);
        assert.equal(steps[3].say, `10 and ${filled - 10} more make ${filled}.`, at);
      }
      if (scene.chapter === "4-decimals") {
        const [frozen] = steps[0].picture.grids;
        assert.match(steps[3].say, new RegExp(`^${Math.floor(frozen / 10)} full columns and ${frozen % 10} more blocks make ${frozen} hundredths\\. So 0\\.${frozen} of`), at);
        // The check's wall, read the same way.
        const choose = steps.find(s => s.check?.kind === "choose");
        assert.equal(choose.check.answer, `0.${choose.picture.grids[0]}`, at);
        assert.notEqual(choose.picture.grids[0], frozen, `${at}: the check repeats the example`);
      }
    }
  });

  it("are a new example each time they are watched", () => {
    for (const scene of SCENES) {
      const firsts = new Set(Array.from({ length: 20 }, (_, i) => JSON.stringify(scene.steps(createRng(i + 1), { monster: "M", hero: "H" })[0].picture)));
      assert.ok(firsts.size >= 5, `${scene.chapter}: only ${firsts.size} different examples`);
    }
  });
});
