// tests/adventures.test.js — each grade's adventure (src/adventures.js): its
// chapters, its levels, how long it takes, and progress through it.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ADVENTURE_GRADES, chaptersFor, levelsFor, levelName, planLevel, pitchFor, residents, settingFor, exampleFor,
  newProgress, recordLevel, levelStates, nextLevel, openChapter, starsFor,
} from "../src/adventures.js";
import { CURRICULUM, GRADES, typesForGrade, pickQuestion, mixForGrade } from "../src/curriculum.js";
import { startBattle, answer } from "../src/battle.js";
import { createRng } from "../src/rng.js";

const rowFor = type => CURRICULUM.find(r => r.type.id === type);

describe("adventures", () => {
  it("cover every whole grade on the ladder, eight chapters of five levels each", () => {
    assert.deepEqual(ADVENTURE_GRADES, [...new Set(GRADES.map(g => Math.floor(g.grade)))]);
    for (const grade of ADVENTURE_GRADES) {
      assert.equal(chaptersFor(grade).length, 8, `grade ${grade}`);
      assert.equal(levelsFor(grade).length, 40, `grade ${grade}`);
    }
    const ids = ADVENTURE_GRADES.flatMap(g => levelsFor(g).map(l => l.id));
    assert.equal(new Set(ids).size, ids.length, "level ids are unique");
  });

  it("bring in only types the grade asks, at a point in the year that suits them", () => {
    for (const grade of ADVENTURE_GRADES) {
      for (const chapter of chaptersFor(grade)) {
        assert.ok(chapter.at === grade || chapter.at === grade + 0.5, chapter.id);
        assert.ok(chapter.learn.length > 0, chapter.id);
        for (const type of chapter.learn) {
          const row = rowFor(type);
          assert.ok(row, `${chapter.id}: no type ${type}`);
          assert.ok(chapter.at >= row.from && chapter.at <= row.to, `${chapter.id}: ${type} isn't asked at ${chapter.at}`);
        }
        for (const type of chapter.warmup ?? []) assert.ok(rowFor(type), `${chapter.id}: no type ${type}`);
        assert.ok(chapter.title.length > 0 && chapter.note.length > 20 && chapter.note.length < 200, chapter.id);
      }
    }
  });

  it("get to every kind of question the grade asks, some time in the year", () => {
    for (const grade of ADVENTURE_GRADES) {
      const asked = new Set([...typesForGrade(grade), ...typesForGrade(grade + 0.5)].map(t => t.id));
      const covered = new Set(chaptersFor(grade).flatMap(c => [...c.learn, ...(c.warmup ?? [])]));
      for (const type of asked) assert.ok(covered.has(type), `grade ${grade} never asks ${type}`);
    }
  });

  it("open each chapter with a worked example of its topic, the same every time", () => {
    for (const grade of ADVENTURE_GRADES) {
      for (const chapter of chaptersFor(grade)) {
        const example = exampleFor(chapter);
        assert.equal(example.type, chapter.learn[0], chapter.id);
        assert.ok(!["0", "1"].includes(String(example.answer)), `${chapter.id}: an example whose answer is ${example.answer}`);
        assert.deepEqual(exampleFor(chapter), example, chapter.id);
      }
    }
  });

  it("happen in settings with monsters to fight", () => {
    for (const grade of ADVENTURE_GRADES) {
      chaptersFor(grade).forEach((chapter, c) => assert.ok(residents(settingFor(grade, c)).length >= 3, chapter.id));
    }
  });
});

describe("levels", () => {
  it("bring a topic in, practise it, review it and end with a boss", () => {
    const kinds = levelsFor(3).slice(0, 5).map(l => l.kind);
    assert.deepEqual(kinds, ["learn", "practice", "practice", "review", "boss"]);
    assert.equal(levelName(levelsFor(3)[4]), "Level 5: Boss");
  });

  it("ask mostly the chapter's topic, keep up earlier ones, and start it easy", () => {
    for (const grade of ADVENTURE_GRADES) {
      const chapters = chaptersFor(grade);
      for (const level of levelsFor(grade)) {
        const { mix, adventure, pitch, toughness } = planLevel(level);
        const total = mix.reduce((sum, p) => sum + p.weight, 0);
        assert.ok(Math.abs(total - 1) < 1e-9, level.id);
        const chapter = chapters[level.chapter];
        const fresh = mix.filter(p => chapter.learn.includes(p.type));
        const share = fresh.reduce((sum, p) => sum + p.weight, 0);
        assert.ok(share >= 0.4 - 1e-9, `${level.id}: only ${share} of it is the chapter's topic`);
        if (level.chapter > 0) assert.ok(share < 1, `${level.id} reviews nothing`);
        if (level.kind === "learn") for (const p of fresh) assert.equal(p.most, 1, level.id);
        for (const p of mix) {
          const row = rowFor(p.type);
          assert.ok(p.grade >= row.from && p.grade <= row.to, `${level.id}: ${p.type} at ${p.grade}`);
        }
        assert.equal(adventure.length, pitch.length);
        assert.equal(adventure.length, toughness.length);
        if (level.kind === "boss") assert.equal(adventure.length, 1);
      }
    }
  });

  it("pitch a type as near the point in the year as it allows", () => {
    assert.equal(pitchFor("addition", 3.5), 3.5);
    assert.equal(pitchFor("time", 5), 4);
    assert.equal(pitchFor("multiplication", 2), 2.5);
  });

  it("take about eight questions each, and a few hours for a grade", () => {
    // A player who gets three in four right the first time, and half the rest on the second try.
    for (const grade of [0, 3, 6]) {
      let hero = { level: 1, xp: 0 };
      const counts = [];
      for (const level of levelsFor(grade)) {
        const rng = createRng(level.number * 31 + grade);
        let battle = startBattle(rng, { grade, ...planLevel(level), hero });
        let asked = 0;
        while (battle.question) {
          const q = battle.question;
          if (battle.ruledOut.length === 0) asked++;
          const right = rng.next() < (battle.ruledOut.length === 0 ? 0.75 : 0.5);
          battle = answer(battle, right ? q.answer : q.choices.find(c => c !== q.answer && !battle.ruledOut.includes(c)), rng).battle;
        }
        hero = { level: battle.hero.level, xp: battle.hero.xp };
        counts.push(asked);
      }
      const median = [...counts].sort((a, b) => a - b)[counts.length / 2];
      const total = counts.reduce((a, b) => a + b, 0);
      assert.ok(median >= 6 && median <= 11, `grade ${grade}: a level takes ${median} questions`);
      assert.ok(total >= 250 && total <= 450, `grade ${grade}: ${total} questions in all`);
    }
  });
});

describe("picking questions from a mix", () => {
  it("asks each part about as often as its weight, and keeps to its difficulty when it can", () => {
    const mix = [
      { type: "addition", grade: 2, weight: 0.75, most: 1 },
      { type: "subtraction", grade: 2, weight: 0.25, most: 3 },
    ];
    const rng = createRng(5);
    const asked = Array.from({ length: 2000 }, () => pickQuestion(rng, mix));
    const additions = asked.filter(q => q.type === "addition");
    assert.ok(Math.abs(additions.length / 2000 - 0.75) < 0.04, `${additions.length} additions`);
    const easyShare = list => list.filter(q => q.difficulty === 1).length / list.length;
    const anyDifficulty = Array.from({ length: 1000 }, () => pickQuestion(rng, [{ ...mix[0], most: 3 }]));
    const [held, free] = [easyShare(additions), easyShare(anyDifficulty)];
    assert.ok(held > 0.8 && held > 2 * free, `${held} of the held additions were easy, and ${free} of the free ones`);
  });

  it("doesn't ask the type it is told to avoid, unless there is nothing else", () => {
    const rng = createRng(9);
    for (let i = 0; i < 200; i++) assert.notEqual(pickQuestion(rng, mixForGrade(2), "addition").type, "addition");
    assert.equal(pickQuestion(rng, [{ type: "addition", grade: 2, weight: 1, most: 3 }], "addition").type, "addition");
  });
});

describe("progress", () => {
  const levels = levelsFor(2);
  const tally = (firstTry, missed) => ({ firstTry, secondTry: 0, missed, knockouts: 0, byType: {} });

  it("starts with only the first level open", () => {
    const states = levelStates(levels, newProgress());
    assert.equal(states[0], "open");
    assert.ok(states.slice(1).every(s => s === "locked"));
    assert.equal(nextLevel(levels, newProgress()), levels[0]);
  });

  it("opens each level when the one before is done, and keeps the best result", () => {
    let progress = recordLevel(newProgress(), levels[0], tally(9, 1));
    assert.deepEqual(levelStates(levels, progress).slice(0, 3), ["done", "open", "locked"]);
    assert.equal(nextLevel(levels, progress), levels[1]);
    assert.equal(progress.done[levels[0].id].stars, 3);
    progress = recordLevel(progress, levels[0], tally(5, 5));
    assert.equal(progress.done[levels[0].id].stars, 3, "a worse try doesn't replace a better one");
  });

  it("lets a grown-up open a chapter ahead, with everything before it", () => {
    const progress = openChapter(newProgress(), 3);
    const states = levelStates(levels, progress);
    assert.ok(levels.every((l, i) => l.chapter < 3 ? states[i] === "open" : l.chapter === 3 && l.step === 1 ? states[i] === "open" : states[i] === "locked"));
    assert.equal(nextLevel(levels, progress), levels.find(l => l.chapter === 3 && l.step === 1));
    assert.equal(openChapter(progress, 1).opened, 3, "opening an earlier chapter closes nothing");
  });

  it("gives stars for answers right the first time", () => {
    assert.deepEqual([starsFor(9, 10), starsFor(7, 10), starsFor(6, 10), starsFor(0, 0)], [3, 2, 1, 1]);
  });

  it("ends when every level is done", () => {
    const all = levels.reduce((p, l) => recordLevel(p, l, tally(8, 0)), newProgress());
    assert.equal(nextLevel(levels, all), null);
  });
});

