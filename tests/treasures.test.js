// tests/treasures.test.js — the treasures (src/treasures.js): chapter
// treasures and keepsakes, when each is won, and their pictures
// (tools/icon_sheets.json, src/treasure_art.js, docs/prompts.md).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  KEEPSAKES, STUCK_AFTER, chapterTreasure, gradeTreasure, treasuresWon, newlyWon, stuckAfter, pickKeepsake,
} from "../src/treasures.js";
import { ADVENTURES, ADVENTURE_GRADES, levelsFor, newProgress, recordLevel } from "../src/adventures.js";
import { DRAWN } from "../src/treasure_art.js";
import { buildPrompts, buildAllPrompts, fixPrompt, fixSheets, rowsOf } from "../tools/icon_prompts.js";
import { createRng } from "../src/rng.js";

/** Every chapter and grade treasure in the game. */
const chapterAndGrade = ADVENTURE_GRADES.flatMap(g => [...ADVENTURES[g].map((_, c) => chapterTreasure(g, c)), gradeTreasure(g)]);
const everyId = [...KEEPSAKES.map(k => k.id), ...chapterAndGrade.map(t => t.id)];

/** A grade's progress with these levels won, by place in the grade. */
function won(grade, places) {
  const levels = levelsFor(grade);
  return places.reduce((p, i) => recordLevel(p, levels[i], { firstTry: 8, secondTry: 0, missed: 0, knockouts: 0, byType: {}, answers: [] }), newProgress());
}

/** The places of every boss level in a grade: the last of each chapter's five. */
const bosses = grade => ADVENTURES[grade].map((_, c) => c * 5 + 4);

describe("chapter treasures", () => {
  it("come one with every chapter, and one more with each grade, each with its own name", () => {
    assert.equal(chapterAndGrade.length, ADVENTURE_GRADES.length * 9);
    assert.equal(new Set(chapterAndGrade.map(t => t.id)).size, chapterAndGrade.length);
    assert.equal(new Set(chapterAndGrade.map(t => t.name)).size, chapterAndGrade.length);
  });

  it("each say, briefly, what the chapter taught", () => {
    for (const t of chapterAndGrade) {
      assert.match(t.line, /^You /, t.id);
      assert.ok(t.line.length <= 70, `${t.id}: "${t.line}" is long for a young reader`);
      assert.ok(t.emoji.length > 0, t.id);
    }
  });

  it("are won by beating each chapter's boss, and the grade's own with the last of them", () => {
    assert.deepEqual(treasuresWon(3, undefined), []);
    assert.deepEqual(treasuresWon(3, won(3, [0, 1, 2, 3])), [], "not before the boss");
    assert.deepEqual(treasuresWon(3, won(3, [4, 9])).map(t => t.id), ["chapter-3-groups", "chapter-3-sharing"]);
    const all = treasuresWon(3, won(3, bosses(3)));
    assert.equal(all.length, 9);
    assert.equal(all.at(-1)?.id, "grade-3");
  });

  it("are new only the first time", () => {
    const before = won(2, [4]);
    const after = won(2, [4, 9]);
    assert.deepEqual(newlyWon(2, before, after).map(t => t.id), ["chapter-2-stories"]);
    assert.deepEqual(newlyWon(2, after, after), [], "beating a boss again wins nothing new");
    const last = won(2, bosses(2));
    const allButLast = won(2, bosses(2).slice(0, -1));
    assert.deepEqual(newlyWon(2, allButLast, last).map(t => t.id), ["chapter-2-time", "grade-2"]);
  });
});

describe("keepsakes", () => {
  it("are all different, and keep their places, which progress codes count on", () => {
    assert.equal(new Set(KEEPSAKES.map(k => k.id)).size, KEEPSAKES.length);
    assert.equal(new Set(KEEPSAKES.map(k => k.name)).size, KEEPSAKES.length);
    assert.equal(new Set(KEEPSAKES.map(k => k.emoji)).size, KEEPSAKES.length);
    assert.equal(KEEPSAKES[0].id, "sparkly_gemstone");
    assert.equal(KEEPSAKES[74].id, "forever_firework");
  });

  it("come one not had yet at a time, and none once all are had", () => {
    const rng = createRng(4);
    const have = [];
    for (let i = 0; i < KEEPSAKES.length; i++) {
      const k = pickKeepsake(rng, have);
      assert.ok(k && !have.includes(k.id), `again after ${i}`);
      have.push(k.id);
    }
    assert.equal(pickKeepsake(rng, have), null);
  });

  it("come when a kind that was learned is got right after days away", () => {
    const known = { score: 0.7, seen: 5, last: 3, day: 100 };
    assert.equal(stuckAfter(known, 100 + STUCK_AFTER), STUCK_AFTER);
    assert.equal(stuckAfter(known, 112), 12);
    assert.equal(stuckAfter(known, 100 + STUCK_AFTER - 1), null, "too soon to say it stuck");
    assert.equal(stuckAfter({ ...known, score: 0.45 }, 112), null, "not learned yet");
    assert.equal(stuckAfter({ ...known, seen: 2 }, 112), null, "met too few times");
    assert.equal(stuckAfter({ score: 0.7, seen: 5, last: 3 }, 112), null, "no day known");
    assert.equal(stuckAfter(undefined, 112), null);
  });
});

describe("treasure pictures", () => {
  const groups = JSON.parse(readFileSync("tools/icon_sheets.json", "utf8")).groups;
  const treasureItems = groups.filter(g => g.folder === "assets/treasures").flatMap(g => g.sheets.flatMap(s => s.items));

  it("are asked for, nine to a sheet, once for every treasure", () => {
    for (const group of groups) for (const sheet of group.sheets) assert.equal(sheet.items.length, 9, sheet.id);
    assert.deepEqual(treasureItems.map(i => i.id).sort(), [...everyId].sort());
    const pictures = groups.flatMap(g => g.sheets.flatMap(s => s.items.map(i => `${g.folder}/${i.id}`)));
    assert.equal(new Set(pictures).size, pictures.length);
  });

  it("are listed as drawn only when the picture is there", () => {
    for (const id of DRAWN) {
      assert.ok(everyId.includes(id), `${id} is not a treasure`);
      assert.ok(existsSync(`assets/treasures/${id}.webp`), `${id} has no picture`);
    }
  });

  it("have prompts in docs/prompts.md that match tools/icon_sheets.json (npm run icon-prompts)", () => {
    assert.equal(readFileSync("docs/prompts.md", "utf8").replace(/\r\n/g, "\n"), buildPrompts());
  });

  it("say what went wrong with each one to draw again, and keep every sheet's prompt for --all", () => {
    for (const group of groups) {
      for (const item of group.sheets.flatMap(s => s.items)) {
        if ("redo" in item) assert.match(item.redo, /^[A-Z].{10,}\.$/, `${item.id}: a "redo" says what's wrong, as a sentence`);
      }
    }
    const all = buildAllPrompts();
    for (const sheet of groups.flatMap(g => g.sheets)) assert.ok(all.includes(`/${sheet.id}.png\``), sheet.id);
  });
});

describe("the fix-up sheet, for icons to draw again", () => {
  /** @param {string} folder @param {string} style @param {number} n */
  const group = (folder, style, n) => ({
    id: style, title: style, folder, size: 256, about: "", style: `They are ${style}.`,
    sheets: [{ id: `${style}-1`, set: "polished oak", items: Array.from({ length: n }, (_, i) => ({ id: `${style}${i}`, look: `A ${style} number ${i}.`, redo: "It came out wrong." })) }],
  });

  it("lays its icons out in rows of three, the last one shorter (as tools/cut_icons.py cuts them)", () => {
    assert.deepEqual([1, 2, 3, 4, 5, 7, 9].map(rowsOf), [[1], [2], [3], [3, 1], [3, 2], [3, 3, 1], [3, 3, 3]]);
  });

  it("holds the icons marked redo, by folder, nine to a sheet", () => {
    const groups = [group("assets/treasures", "cups", 7), group("assets/pictures", "hats", 2), group("assets/treasures", "keys", 4)];
    groups[0].sheets[0].items[1].redo = "";
    const fixes = fixSheets(groups);
    assert.deepEqual(fixes.map(f => [f.folder, f.name, f.items.length]), [["assets/treasures", "fixes", 9], ["assets/treasures", "fixes-2", 1], ["assets/pictures", "fixes", 2]]);
    assert.deepEqual(fixes[0].items.map(p => p.item.id), ["cups0", "cups2", "cups3", "cups4", "cups5", "cups6", "keys0", "keys1", "keys2"]);
  });

  it("asks for each icon once, in its own group's style and its sheet's material", () => {
    for (const n of [1, 3, 5, 9]) {
      const [fixes] = fixSheets([group("assets/treasures", "cups", Math.min(n, 2)), group("assets/treasures", "keys", n - Math.min(n, 2))].filter(g => g.sheets[0].items.length));
      const prompt = fixPrompt(fixes);
      const listed = prompt.match(/^\d+\. .*$/gm) ?? [];
      assert.equal(listed.length, n, prompt);
      for (const { item } of fixes.items) assert.equal(listed.filter(line => line.includes(item.look)).length, 1, item.id);
      assert.ok(listed.every(line => line.endsWith("Made of polished oak.")));
      assert.ok(prompt.includes("They are cups."));
      if (n > 2) assert.ok(prompt.includes("They are keys.") && prompt.includes("About icons 1 and 2:"), prompt);
      assert.match(prompt, n === 1 || n === 9 ? /square picture, 1:1/ : n === 3 ? /wide picture, 16:9/ : /picture, 3:2/);
    }
  });
});
