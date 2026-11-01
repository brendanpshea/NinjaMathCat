// tests/browser.test.js — the game itself, in a real browser: the screens, the
// stage, the keyboard, players, the adventure map, and the save surviving a
// reload. The rest of the suite tests the parts in Node; this checks they work
// together on a page.
//
// Needs Chrome or Edge. Without one these tests are SKIPPED, loudly; set
// NINJA_BROWSER to point at a browser. CI sets NINJA_REQUIRE_BROWSER so that a
// missing browser fails there instead of quietly skipping.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, findBrowser, runScenario } from "./helpers/browser.js";
import { TREASURES } from "../src/treasures.js";
import { ADVENTURE_GRADES, chaptersFor, levelsFor } from "../src/adventures.js";

const browser = findBrowser();
if (!browser && process.env.NINJA_REQUIRE_BROWSER) {
  throw new Error("NINJA_REQUIRE_BROWSER is set but no Chrome or Edge was found");
}
const skip = browser ? false : "NO BROWSER FOUND: the real-browser tests did not run. Install Chrome or Edge, or set NINJA_BROWSER.";

describe("in a real browser", { skip }, () => {
  let server, played, still;

  before(async () => {
    server = await startServer();
    [played, still] = await Promise.all([
      runScenario(browser, server.origin, "adventure"),
      runScenario(browser, server.origin, "still", ["--force-prefers-reduced-motion"]),
    ]);
  });

  after(async () => { await server?.close(); });

  it("runs without a single error", () => {
    assert.deepEqual(played.errors, []);
    assert.deepEqual(still.errors, []);
  });

  it("opens on a title that asks who is playing, with nobody yet", () => {
    assert.equal(played.title.heading, "Ninja Math Cat");
    assert.equal(played.title.players, 0);
    assert.equal(played.title.newPlayer, true);
  });

  it("makes a player with a name, a hero and a grade, showing the grade's chapters", () => {
    assert.equal(played.form.heading, "New player");
    assert.equal(played.form.heroes, 6);
    assert.equal(played.form.grades, ADVENTURE_GRADES.length);
    assert.deepEqual(played.form.chapters, chaptersFor(2).map(c => c.title));
  });

  it("shows the player's map, with only the first level to play", () => {
    assert.equal(played.map.heading, "Sam's 2nd grade adventure");
    assert.equal(played.map.levels, levelsFor(2).length);
    assert.equal(played.map.open, 1);
    assert.equal(played.map.continue, `Start Level 1: New topic, ${chaptersFor(2)[0].title}`);
  });

  it("starts a chapter with its note and a worked example", () => {
    assert.equal(played.note.heading, chaptersFor(2)[0].title);
    assert.equal(played.note.text, chaptersFor(2)[0].note);
    assert.ok(played.note.example);
  });

  it("plays a level as a short battle with the chosen hero, both on stage", () => {
    assert.match(played.battle.title, /^Level 1: New topic · /);
    assert.equal(played.battle.journey, 2);
    assert.match(played.battle.arrival, /^Here comes /);
    assert.equal(played.battle.heroName, "Owl Wizard");
    assert.equal(played.battle.choices, 4);
    assert.ok(played.battle.answered < 25, `the level took ${played.battle.answered} answers`);
  });

  it("gives a hint after a wrong answer, rules that choice out, then shows the answer", () => {
    assert.match(played.battle.hint, /^Not quite\. Try again! Hint: /);
    assert.equal(played.battle.ruledOutDisabled, true);
    assert.match(played.battle.reveal, /^The answer is /);
    assert.equal(played.battle.revealShowsRight, true);
    assert.equal(played.battle.nextFocused, true);
    assert.equal(played.battle.monsterHurt, true);
  });

  it("ends a level with stars and what was earned, and saves it", () => {
    assert.equal(played.done.heading, "Level 1 done!");
    assert.match(played.done.stars, /^[123] of 3 stars$/);
    assert.match(played.done.facts[0], /right the first time/);
    assert.match(played.done.next, /^Next: Level 2: Practice/);
    assert.ok(played.done.topicNote, "a word on how each topic went");
    assert.match(played.done.topicNote, /^(Great at .+!)? ?(Keep practising .+\.)?$/);
    const sam = played.done.saved.players[0];
    assert.equal(sam.name, "Sam");
    assert.equal(sam.heroId, "owl_wizard");
    assert.equal(sam.grade, 2);
    assert.ok(sam.xp > 0);
    assert.ok(sam.adventures[2].done[levelsFor(2)[0].id]);
  });

  it("goes on to the next level, answers with the number keys, and asks before leaving", () => {
    assert.match(played.after.title, /^Level 2: Practice/);
    assert.equal(played.after.keys, true);
    assert.match(played.after.leaveAsks, /^Leave this level\?/);
    assert.equal(played.after.keysWaitWhileAsking, true, "a number key answered while Leave was being asked");
    assert.equal(played.after.escapeKeepsPlaying, true);
  });

  it("marks the level done on the map, and the next one ready", () => {
    assert.match(played.after.firstLevel, /^Level 1, New topic, [123] of 3 stars$/);
    assert.equal(played.after.secondLevel, "Level 2, Practice, ready to play");
    assert.match(played.after.count, /^1 of 40 levels done/);
  });

  it("reports each topic for grown-ups, and trains on the ones that need it", () => {
    assert.equal(played.progress.heading, "Sam's progress");
    assert.equal(played.progress.rows, new Set(chaptersFor(2).flatMap(c => [...c.learn, ...(c.warmup ?? [])])).size);
    assert.ok(played.progress.strengths.includes("Not met yet"));
    assert.ok(played.progress.strengths.some(s => s !== "Not met yet"), "the level played shows up");
    assert.match(played.training.title, /^Training ground · /);
    assert.equal(played.training.heading, "Training done!");
    assert.ok(played.training.facts.length >= 1);
    assert.match(played.training.facts[0], /^\d+ of \d+ .+, right the first time (Not met yet|Needs practice|Getting there|Strong)$/);
  });

  it("lets a grown-up open a chapter early, with every chapter before it", () => {
    assert.match(played.open.asks, /^Open Chapter 5, .*, early\?/);
    assert.equal(played.open.continue, `Play Level 21: New topic, ${chaptersFor(2)[4].title}`);
    assert.equal(played.open.earlierOpen, true);
    assert.equal(played.open.laterLocked, true);
  });

  it("shows the treasures found so far", () => {
    const found = played.done.saved.players[0].treasures.length;
    assert.equal(played.treasures.heading, "Sam's treasures");
    assert.ok(played.treasures.found >= found);
    assert.equal(played.treasures.found + played.treasures.missing, TREASURES.length);
  });

  it("still offers a quick battle of eight monsters", () => {
    assert.equal(played.quick.title, "Monster 1 of 8");
    assert.equal(played.quick.journey, 8);
  });

  it("keeps several players, and comes back to the last one after a reload", () => {
    assert.equal(played.second.editHeading, "Sam's choices");
    assert.equal(played.second.cards.length, 1);
    assert.match(played.second.cards[0], /^Sam 2nd grade · 1 of 40 levels$/);
    assert.equal(played.second.heading, "Player 2's kindergarten adventure");
    assert.equal(played.reload.screen, "map");
    assert.equal(played.reload.heading, "Player 2's kindergarten adventure");
    assert.equal(played.reload.cards, 2);
    assert.equal(played.reload.saved.players.length, 2);
    assert.equal(played.reload.saved.players[0].adventures[2].opened, 4);
  });

  it("plays on with reduced motion", () => {
    assert.equal(still.reducedMotion, true);
    assert.equal(still.answered, 12);
    assert.ok(still.xp > 2600);
  });
});
