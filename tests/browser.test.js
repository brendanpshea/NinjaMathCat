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
import { startServer, findBrowser, runScenario, runScenarioLive } from "./helpers/browser.js";
import { TREASURES } from "../src/treasures.js";
import { ADVENTURE_GRADES, chaptersFor, levelsFor } from "../src/adventures.js";
import { offlineFiles } from "../tools/offline_files.js";

const browser = findBrowser();
if (!browser && process.env.NINJA_REQUIRE_BROWSER) {
  throw new Error("NINJA_REQUIRE_BROWSER is set but no Chrome or Edge was found");
}
const skip = browser ? false : "NO BROWSER FOUND: the real-browser tests did not run. Install Chrome or Edge, or set NINJA_BROWSER.";

describe("in a real browser", { skip }, () => {
  let server, lonely, played, still, marathon, showHow, grownUps, challenge, classView, offline, typed;

  before(async () => {
    server = await startServer();
    // The offline test takes its server offline, so it has one to itself.
    lonely = await startServer();
    [played, still, marathon, showHow, grownUps, challenge, classView, offline, typed] = await Promise.all([
      runScenario(browser, server.origin, "adventure"),
      runScenario(browser, server.origin, "still", ["--force-prefers-reduced-motion"]),
      runScenario(browser, server.origin, "marathon&grade=0"),
      runScenario(browser, server.origin, "showHow"),
      runScenario(browser, server.origin, "grownUps"),
      runScenario(browser, server.origin, "challenge"),
      runScenario(browser, server.origin, "classView"),
      runScenarioLive(browser, lonely.origin, "offline"),
      runScenario(browser, server.origin, "typed"),
    ]);
  });

  after(async () => { await Promise.all([server?.close(), lonely?.close()]); });

  it("runs without a single error", () => {
    assert.deepEqual(played.errors, []);
    assert.deepEqual(still.errors, []);
    assert.deepEqual(marathon.errors, []);
    assert.deepEqual(showHow.errors, []);
    assert.deepEqual(grownUps.errors, []);
    assert.deepEqual(challenge.errors, []);
    assert.deepEqual(classView.errors, []);
    assert.deepEqual(offline.errors, []);
    assert.deepEqual(typed.errors, []);
  });

  it("asks for typed answers once a kind is known: a number pad, any number taken, a repeat free, the keyboard too", () => {
    assert.ok(typed.typed, "a question of a well-known kind is typed");
    assert.ok(typed.padShown, "the number pad, not the choices");
    assert.deepEqual(typed.keys, ["back", "enter", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"], "no minus sign before sixth grade");
    assert.match(typed.hint, /^Not quite\. /);
    assert.match(typed.tried, /^Tried: \d/);
    assert.ok(typed.cleared, "the field is cleared for another go");
    assert.match(typed.again, /^You tried .+ already\. Try another number!$/);
    assert.ok(typed.unhurt, "a repeat costs nothing");
    assert.ok(typed.right, `typed on the keyboard, the right answer lands on the second try: ${JSON.stringify(typed.landed)}`);
  });

  it("installs a service worker that keeps every file, and plays with the network gone", () => {
    assert.equal(offline.manifest, "manifest.webmanifest");
    assert.equal(offline.scope, "/");
    assert.deepEqual([...offline.kept].sort(), offlineFiles().map(f => new URL(f, "http://x/").pathname).sort());
    assert.ok(offline.controlled, "the page is served by the worker");
    assert.equal(offline.title, "Whiskerblade");
    assert.ok(offline.installBefore, "no install button until the browser offers");
    assert.match(offline.installOffer, /^Install the game on this device\. It opens like an app, and plays with no internet\.$/);
    assert.ok(offline.installAfter, "once the browser has asked, the button goes");
    assert.ok(offline.sprites && offline.backdrop, "the hero, the monster and the backdrop all come from the copies");
    assert.ok(offline.played, "a question answered, offline");
  });

  it("gives teachers a class view: this device's players, students added by code, and the topics to work on", () => {
    assert.equal(classView.heading, "Class view");
    assert.deepEqual(classView.before.map(r => r[0]), ["Ben", "Maya"]);
    assert.deepEqual(classView.before[1].slice(1, 3), ["21 of 40", "26"]);
    assert.match(classView.before[1][3], /^Rounding, Division and Telling time$/);
    assert.ok(classView.topics.some(t => /^Division: 2 of 2 \(Ben and Maya\)$/.test(t)), classView.topics.join(" | "));
    assert.match(classView.added, /^Added 1 student\. 1 code didn't work/);
    assert.deepEqual(classView.after.map(r => r[0]), ["Ben", "Maya", "Zoe from a code"]);
    assert.equal(classView.updated, "Updated 1.");
    assert.deepEqual(classView.zoe.slice(1), ["9 of 40", "12", "Division", "12"]);
    assert.equal(classView.kept, 3, "pasted students stay on this device");
    assert.match(classView.asks, /^Clear all 1 pasted students/);
    assert.deepEqual(classView.cleared, ["Ben", "Maya"]);
    assert.equal(classView.savedCodes, 0);
  });

  it("runs the one-minute challenge from 3rd grade: right answers score, a wrong one shows the answer, the best is kept", () => {
    assert.equal(played.map.challenge, false, "not offered in 2nd grade");
    assert.ok(challenge.offered);
    assert.deepEqual(challenge.intro, { heading: "One-minute challenge", best: "No score yet. Set one!" });
    assert.equal(challenge.clockStart, "5");
    assert.equal(challenge.answered, 4);
    assert.match(challenge.wrongShows, /^The answer is /);
    assert.deepEqual(challenge.done, { heading: "Time's up!", final: "3 right", tagline: "Your first score. Now try to beat it!", missed: true });
    assert.equal(challenge.best, 3);
    assert.equal(challenge.played, 27, "a challenge moves the clock that review is timed by");
    assert.equal(challenge.bestShown, "Your best: 3 right");
    assert.ok(challenge.stopped, "stopping early ends it, and counts nothing");
  });

  it("with the grown-up lock on, asks a grown-up's question before the report, the choices and opening chapters", () => {
    const { lock } = grownUps;
    assert.match(lock.asked, /^What is \d+ × \d+\?$/);
    assert.ok(lock.stayed && lock.stillMap && lock.cancelled, "a wrong answer or Cancel goes nowhere");
    assert.match(lock.wrong, /isn't it/);
    assert.ok(lock.through, "the right answer goes on");
    assert.ok(lock.openAsks, "opening a chapter early asks first");
    assert.equal(lock.box, true);
    assert.ok(lock.savedOff && lock.unlocked, "turned off on the report, it asks no more");
  });

  it("offers a copy of the progress at a level's end, now and then, not every time", () => {
    const { backup } = grownUps;
    assert.ok(backup.offered && backup.marked);
    assert.equal(backup.code, "NMC1-");
    assert.ok(backup.notAgain);
  });

  it("offers to show how, with the chapter's teaching scene, once a question is missed twice, then plays on", () => {
    assert.equal(showHow.type, "tens_and_ones", "the level opens with its chapter's topic");
    assert.ok(showHow.hiddenBefore && showHow.hiddenAfterOneMiss, "not offered before the answer is shown");
    assert.ok(showHow.offered);
    assert.equal(showHow.kicker, "Show me how");
    assert.ok(showHow.onlyBack, "over a battle, the scene has no skipping, note or map");
    assert.deepEqual(showHow.scene.problems, []);
    assert.equal(showHow.scene.title, "Teen numbers");
    assert.ok(!/^I'm /.test(showHow.scene.lines[0]), `shown again, it starts where the hero explains, not "${showHow.scene.lines[0]}"`);
    assert.equal(showHow.last, "Back to the battle");
    assert.ok(showHow.closed && showHow.backInBattle && showHow.focusOnNext, "closed, back in the battle, ready to go on");
    assert.ok(showHow.goesOn, "the next question comes as usual");
  });

  it("plays kindergarten's whole adventure through the screens, every note and picture as it should be", () => {
    assert.deepEqual(marathon.problems, []);
    assert.equal(marathon.levels, 40);
    assert.equal(marathon.saved, 40);
    // Every chapter opens with its teaching scene, each played through, checks tried wrong and right.
    assert.equal(marathon.notes.length, 0);
    assert.deepEqual(marathon.scenes.map(s => s.title), chaptersFor(0).map(c => c.title));
    assert.ok(marathon.scenes.every(s => s.checks >= 1 && s.lines.every(Boolean)), "every scene has a check, and a line at every step");
    assert.ok(marathon.scenes.some(s => s.wrongTries > 0), "some checks were tried wrong first");
    assert.ok(marathon.scenes.some(s => s.rings > 0), "rings point at the pictures");
    const teens = marathon.scenes.find(s => s.title === "Teen numbers");
    assert.match(teens.lines[0], /^I'm Grumpy Cloud!/);
    assert.ok(marathon.wrongOnce > 0 && marathon.wrongTwice > 0, "some answers wrong, so hints and answers were shown");
    assert.ok(marathon.reviewTags > 0, "questions from earlier chapters say they are review");
    assert.ok(Object.keys(marathon.kinds).length >= 6, `pictures of only ${Object.keys(marathon.kinds).join(", ")}`);
  });

  it("opens on a title that asks who is playing, with nobody yet", () => {
    assert.equal(played.title.heading, "Whiskerblade");
    assert.equal(played.title.players, 0);
    assert.equal(played.title.newPlayer, true);
  });

  it("makes a player with a name, a hero and a grade, showing the grade's chapters", () => {
    assert.equal(played.form.heading, "New player");
    assert.equal(played.form.heroes, 6);
    assert.equal(played.form.grades, ADVENTURE_GRADES.length);
    assert.deepEqual(played.form.chapters, chaptersFor(2).map(c => c.title));
    assert.equal(played.form.readAloud, true, "questions are read aloud for a 2nd grader to begin with");
  });

  it("shows the player's map, with only the first level to play", () => {
    assert.equal(played.map.heading, "Sam's 2nd grade adventure");
    assert.equal(played.map.levels, levelsFor(2).length);
    assert.equal(played.map.open, 1);
    assert.equal(played.map.continue, `Start Level 1: New topic, ${chaptersFor(2)[0].title}`);
  });

  it("starts a chapter with its teaching scene, with its note and a worked example a link away", () => {
    assert.equal(played.scene.heading, chaptersFor(2)[0].title);
    assert.ok(played.scene.line && played.scene.steps >= 3 && played.scene.noteLink, JSON.stringify(played.scene));
    assert.equal(played.note.heading, chaptersFor(2)[0].title);
    assert.equal(played.note.text, chaptersFor(2)[0].note);
    assert.ok(played.note.example);
    assert.equal(played.note.read, true);
  });

  it("plays a level as a short battle with the chosen hero, both on stage", () => {
    assert.match(played.battle.title, /^Level 1: New topic · /);
    assert.equal(played.battle.journey, 2);
    assert.match(played.battle.arrival, /^Here comes /);
    assert.equal(played.battle.heroName, "Owl Wizard");
    assert.equal(played.battle.choices, 4);
    assert.equal(played.battle.read, true, "a Read to me button on every question");
    assert.ok(played.battle.answered < 25, `the level took ${played.battle.answered} answers`);
  });

  it("gives a hint after a wrong answer, rules that choice out, then shows the answer", () => {
    // The mistake behind the choice, where the question knows it, then the hint.
    assert.match(played.battle.hint, /^Not quite\. (?:[^.!?]+[.?] )*Try again! Hint: /);
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
    assert.match(played.done.talk, /^For a grown-up, to talk about together: \S/, "something for a grown-up to talk about with the child");
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
    assert.equal(played.reload.saved.players[0].adventures[2].opened, 4);
  });

  it("moves a player to another device by progress code, and turns away a bad one", () => {
    assert.equal(played.second.code, "NMC1-");
    assert.match(played.reload.badCode, /^That code didn't work/);
    assert.equal(played.reload.imported, "Sam's 2nd grade adventure");
    assert.equal(played.reload.importedCount, played.after.count);
    assert.equal(played.reload.saved.players.length, 3);
    const [sam, , copy] = played.reload.saved.players;
    assert.deepEqual([copy.name, copy.heroId, copy.grade, copy.xp, copy.treasures], [sam.name, sam.heroId, sam.grade, sam.xp, sam.treasures]);
  });

  it("plays on with reduced motion", () => {
    assert.equal(still.reducedMotion, true);
    assert.equal(still.answered, 12);
    assert.ok(still.xp > 2600);
  });
});
