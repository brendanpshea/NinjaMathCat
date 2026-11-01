// tests/browser.test.js — the game itself, in a real browser: the screens, the
// stage, the pictures, the keyboard, and the save surviving a reload. The rest
// of the suite tests the parts in Node; this checks they work together on a page.
//
// Needs Chrome or Edge. Without one these tests are SKIPPED, loudly; set
// NINJA_BROWSER to point at a browser. CI sets NINJA_REQUIRE_BROWSER so that a
// missing browser fails there instead of quietly skipping.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, findBrowser, runScenario } from "./helpers/browser.js";
import { TREASURES } from "../src/treasures.js";
import { GRADES } from "../src/curriculum.js";

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

  it("opens on a title with every hero and grade, and no record for a new player", () => {
    assert.equal(played.title.heading, "Ninja Math Cat");
    assert.equal(played.title.heroes, 6);
    assert.equal(played.title.grades, GRADES.length);
    assert.match(played.title.practice, /^New in 2nd grade .*Bar graphs.* Plus \d+ kinds of question from earlier grades\.$/);
    assert.equal(played.title.returningRecord, false);
  });

  it("starts a battle of eight monsters with the chosen hero, both on stage", () => {
    assert.equal(played.battle.journey, 8);
    assert.equal(played.battle.title, "Monster 1 of 8");
    assert.match(played.battle.arrival, /^Here comes /);
    assert.equal(played.battle.heroName, "Owl Wizard");
    assert.equal(played.battle.choices, 4);
  });

  it("gives a hint after a wrong answer, rules that choice out, then shows the answer", () => {
    assert.match(played.battle.hint, /^Not quite\. Try again! Hint: /);
    assert.equal(played.battle.ruledOutDisabled, true);
    assert.match(played.battle.reveal, /^The answer is /);
    assert.equal(played.battle.revealShowsRight, true);
    assert.equal(played.battle.nextFocused, true);
  });

  it("draws the question's picture, and the monster's health falls with each blow", () => {
    assert.ok(played.battle.visualQuestions > 0, "no question with a picture came up");
    assert.equal(played.battle.picturesDrawn, played.battle.visualQuestions);
    assert.equal(played.battle.monsterHurt, true);
  });

  it("ends in a victory that sums up the adventure and shows the treasures found", () => {
    assert.equal(played.victory.heading, "You won!");
    assert.match(played.victory.facts[0], /right the first time/);
    assert.match(played.victory.facts[1], /^Level \d+/);
    assert.ok(played.victory.treasuresShown >= 1);
  });

  it("saves the hero, grade, experience and treasures as it goes", () => {
    const { saved } = played.victory;
    assert.equal(saved.heroId, "owl_wizard");
    assert.equal(saved.grade, 2);
    assert.ok(saved.xp > 0);
    assert.equal(saved.treasures.length, played.victory.treasuresShown);
  });

  it("shows the record and the treasure collection, and remembers them after a reload", () => {
    const found = played.victory.saved.treasures.length;
    assert.match(played.home.record, new RegExp(`^Level \\d+ · ${found} of ${TREASURES.length} treasures found`));
    assert.equal(played.treasures.found, found);
    assert.equal(played.treasures.missing, TREASURES.length - found);
    assert.equal(played.reload.record, played.home.record);
    assert.equal(played.reload.hero, "owl_wizard");
    assert.equal(played.reload.grade, "2");
  });

  it("answers with the number keys, and asks before resting", () => {
    assert.equal(played.keys, true);
    assert.equal(played.restAsks, true);
    assert.equal(played.keysWaitWhileAsking, true, "a number key answered while Leave was being asked");
    assert.equal(played.escapeKeepsPlaying, true);
    assert.equal(played.rested, true);
  });

  it("plays on with reduced motion", () => {
    assert.equal(still.reducedMotion, true);
    assert.equal(still.answered, 12);
    assert.ok(still.xp > 0);
  });
});
