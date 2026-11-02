// A battle as a state machine. The state is plain data, and answering a
// question turns one state into the next, reporting what happened on the way.
// Nothing here waits, animates or touches the page: the UI acts out each
// round and asks for the next answer when it is ready. (The old game ran its
// rules on timers, which is where its races came from.)

import { mixForGrade, pickQuestion, questionKey } from "./curriculum.js";
import { isCorrect } from "./questions/common.js";
import { heroStats, monsterStats, monsterLevel, hitDamage, streakMultiplier, XP, levelForXp, victoryHeal } from "./combat.js";
import { pickTreasure } from "./treasures.js";

/** @import { Rng } from "./rng.js" */
/** @import { Answer, Question } from "./questions/common.js" */
/** @import { Mix } from "./curriculum.js" */
/** @import { Outcome } from "./mastery.js" */
/** @import { Monster } from "./monsters.js" */
/** @import { Treasure } from "./treasures.js" */

/** Tries at each question before the answer is shown. */
export const TRIES = 2;

/**
 * @typedef {object} Hero
 * @property {number} level
 * @property {number} xp  all the experience ever earned
 * @property {number} hp
 */

/**
 * @typedef {object} Foe
 * @property {Monster} monster
 * @property {number} level  set by its tier, or the level's pitch, and the level the hero started at
 * @property {number} hp
 * @property {number} toughness  how much its health is scaled
 * @property {boolean} dropsTreasure  whether beating it still earns a treasure; knocking the hero out costs that
 */

/**
 * How a child has done so far.
 * @typedef {object} Tally
 * @property {number} firstTry  questions right the first time
 * @property {number} secondTry  right after a hint
 * @property {number} missed  shown the answer
 * @property {number} knockouts
 * @property {Record<string, { asked: number, firstTry: number }>} byType  by question type
 * @property {{ type: string, outcome: Outcome }[]} answers  every question finished, in order
 */

/**
 * @typedef {object} Battle
 * @property {number} grade
 * @property {Mix} mix  which questions it asks
 * @property {number[]} pitch  how many levels above the hero each monster fights at
 * @property {number[]} toughness  how much each monster's health is scaled
 * @property {Hero} hero
 * @property {number} startLevel  the hero's level when the battle began, which the monsters are pitched at
 * @property {readonly Monster[]} adventure  the monsters to beat, in order
 * @property {number} beaten  how many of them are beaten
 * @property {Foe | null} foe  the one being fought; null once all are beaten
 * @property {Question | null} question  null once all are beaten
 * @property {Answer[]} ruledOut  wrong choices already tried on this question
 * @property {{ type: string, in: number }[]} again  kinds of question to ask again soon, each after `in` more questions
 * @property {string[]} opening  kinds of question still to bring in, one of each, before any others
 * @property {string[]} asked  every question asked so far, by questionKey, so none comes up twice
 * @property {number} streak  questions right the first time in a row
 * @property {string[]} treasures  ids of every treasure collected, in earlier battles too
 * @property {Tally} tally
 */

/**
 * What one answer did, for the stage to act out and the screen to report.
 * @typedef {object} Round
 * @property {boolean} correct
 * @property {number} heroDamage  dealt to the monster
 * @property {number} foeDamage  dealt to the hero
 * @property {number} streakMultiplier  how much the streak added to heroDamage
 * @property {boolean} defeatedFoe
 * @property {boolean} knockedOut  the hero fell, and got back up
 * @property {number} healed  health given back, for beating the monster or levelling up
 * @property {number} xpGained
 * @property {boolean} leveledUp
 * @property {Treasure | null} drop
 * @property {"again" | "reveal" | "next" | "won"} then  what comes next:
 *   "again" is the same question, with the wrong choice ruled out and a hint;
 *   "reveal" shows the right answer before the next question; "next" moves
 *   straight on; "won" means every monster is beaten
 * @property {string | null} hint  when then is "again"
 * @property {Answer | null} answer  the right answer, when then is "reveal"
 */

/**
 * Start a battle. Unless told otherwise, it asks every question type of its
 * grade, and each monster fights as many levels above the hero as its tier
 * is above 1, at its usual toughness.
 * @param {Rng} rng
 * @param {object} setup
 * @param {number} setup.grade
 * @param {readonly Monster[]} setup.adventure
 * @param {Mix} [setup.mix]
 * @param {number[]} [setup.pitch]  for each monster
 * @param {number[]} [setup.toughness]  for each monster
 * @param {string[]} [setup.opening]  kinds of question to ask one of each first, in order, as a level that brings in new topics does
 * @param {{ level: number, xp: number }} [setup.hero]  carried over from earlier battles; a new player starts at level 1
 * @param {string[]} [setup.treasures]  collected in earlier battles
 * @returns {Battle}
 */
export function startBattle(rng, { grade, adventure, mix = mixForGrade(grade), pitch, toughness, opening = [], hero = { level: 1, xp: 0 }, treasures = [] }) {
  if (adventure.length === 0) throw new RangeError("An adventure needs at least one monster");
  const setup = {
    pitch: adventure.map((m, i) => pitch?.[i] ?? m.tier - 1),
    toughness: adventure.map((_, i) => toughness?.[i] ?? 1),
  };
  return {
    grade,
    mix,
    ...setup,
    hero: { ...hero, hp: heroStats(hero.level).maxHp },
    startLevel: hero.level,
    adventure,
    beaten: 0,
    foe: meet(setup, adventure, 0, hero.level),
    ...ask(rng, { mix, opening, asked: [] }, undefined, []),
    ruledOut: [],
    streak: 0,
    treasures: [...treasures],
    tally: { firstTry: 0, secondTry: 0, missed: 0, knockouts: 0, byType: {}, answers: [] },
  };
}

/**
 * Answer the current question.
 * @param {Battle} battle
 * @param {Answer} choice  one of the question's choices, and not one already ruled out
 * @param {Rng} rng
 * @returns {{ battle: Battle, round: Round }}
 */
export function answer(battle, choice, rng) {
  const { question, foe } = battle;
  if (!question || !foe) throw new Error("The battle is over");
  if (!question.choices.includes(choice) || battle.ruledOut.includes(choice)) {
    throw new RangeError(`"${choice}" cannot be picked now`);
  }
  return isCorrect(question, choice)
    ? strike(battle, question, foe, rng)
    : takeHit(battle, question, foe, choice, rng);
}

/**
 * The next monster to fight.
 * @param {{ pitch: number[], toughness: number[] }} setup
 * @param {readonly Monster[]} adventure
 * @param {number} index
 * @param {number} startLevel
 * @returns {Foe}
 */
function meet({ pitch, toughness }, adventure, index, startLevel) {
  const level = monsterLevel(pitch[index] + 1, startLevel);
  return { monster: adventure[index], level, toughness: toughness[index], hp: monsterStats(level, toughness[index]).maxHp, dropsTreasure: true };
}

/**
 * A right answer: the hero strikes.
 * @param {Battle} battle
 * @param {Question} question
 * @param {Foe} foe
 * @param {Rng} rng
 * @returns {{ battle: Battle, round: Round }}
 */
function strike(battle, question, foe, rng) {
  const { hero } = battle;
  const secondTry = battle.ruledOut.length > 0;
  const streak = secondTry ? 0 : battle.streak + 1;
  const heroDamage = hitDamage({ attack: heroStats(hero.level).attack, difficulty: question.difficulty, streak, secondTry });
  const foeHp = Math.max(0, foe.hp - heroDamage);
  const defeatedFoe = foeHp === 0;

  const xpGained = (secondTry ? XP.secondTry : XP.firstTry) + (defeatedFoe ? XP.perTier * foe.monster.tier : 0);
  const xp = hero.xp + xpGained;
  const level = levelForXp(xp);
  const leveledUp = level > hero.level;
  // Levelling up restores all health; beating a monster restores some.
  const oldMax = heroStats(hero.level).maxHp;
  const hp = leveledUp ? heroStats(level).maxHp
    : defeatedFoe ? Math.min(oldMax, hero.hp + victoryHeal(oldMax))
    : hero.hp;

  const beaten = battle.beaten + Number(defeatedFoe);
  const won = beaten === battle.adventure.length;
  const drop = defeatedFoe && foe.dropsTreasure ? pickTreasure(rng, battle.treasures) : null;
  const nextFoe = !defeatedFoe ? { ...foe, hp: foeHp } : won ? null : meet(battle, battle.adventure, beaten, battle.startLevel);
  const outcome = secondTry ? "secondTry" : "firstTry";
  const next = won ? { question: null, again: [], opening: [], asked: battle.asked } : ask(rng, battle, question.type, queueAgain(battle.again, question.type, outcome));

  return {
    battle: {
      ...battle,
      hero: { level, xp, hp },
      beaten,
      foe: nextFoe,
      ...next,
      ruledOut: [],
      streak,
      treasures: drop && !battle.treasures.includes(drop.id) ? [...battle.treasures, drop.id] : battle.treasures,
      tally: record(battle.tally, question, outcome),
    },
    round: {
      correct: true,
      heroDamage,
      foeDamage: 0,
      streakMultiplier: secondTry ? 1 : streakMultiplier(streak),
      defeatedFoe,
      knockedOut: false,
      healed: hp - hero.hp,
      xpGained,
      leveledUp,
      drop,
      then: won ? "won" : "next",
      hint: null,
      answer: null,
    },
  };
}

/**
 * A wrong answer: the monster strikes. A knocked-out hero gets straight back
 * up, so there is no game over; the monster keeps the damage it has taken,
 * but no longer drops a treasure.
 * @param {Battle} battle
 * @param {Question} question
 * @param {Foe} foe
 * @param {Answer} choice
 * @param {Rng} rng
 * @returns {{ battle: Battle, round: Round }}
 */
function takeHit(battle, question, foe, choice, rng) {
  const foeDamage = monsterStats(foe.level).attack;
  const knockedOut = battle.hero.hp <= foeDamage;
  const hp = knockedOut ? heroStats(battle.hero.level).maxHp : battle.hero.hp - foeDamage;
  const ruledOut = [...battle.ruledOut, choice];
  const again = ruledOut.length < TRIES;
  const tally = { ...battle.tally, knockouts: battle.tally.knockouts + Number(knockedOut) };
  const next = again ? { question, again: battle.again, opening: battle.opening, asked: battle.asked } : ask(rng, battle, question.type, queueAgain(battle.again, question.type, "missed"));

  return {
    battle: {
      ...battle,
      hero: { ...battle.hero, hp },
      foe: knockedOut ? { ...foe, dropsTreasure: false } : foe,
      ...next,
      ruledOut: again ? ruledOut : [],
      streak: 0,
      tally: again ? tally : record(tally, question, "missed"),
    },
    round: {
      correct: false,
      heroDamage: 0,
      foeDamage,
      streakMultiplier: 1,
      defeatedFoe: false,
      knockedOut,
      healed: 0,
      xpGained: 0,
      leveledUp: false,
      drop: null,
      then: again ? "again" : "reveal",
      hint: again ? question.hint : null,
      answer: again ? null : question.answer,
    },
  };
}

/** How many questions later to ask a kind again, after it was missed or needed a second try. */
export const ASK_AGAIN = { missed: 2, secondTry: 3 };

/**
 * The kinds to ask again, once a question of one kind is finished: right the
 * first time, it needn't come back; otherwise it comes back soon.
 * @param {Battle["again"]} again
 * @param {string} type
 * @param {Outcome} outcome
 * @returns {Battle["again"]}
 */
function queueAgain(again, type, outcome) {
  const rest = again.filter(a => a.type !== type);
  return outcome === "firstTry" ? rest : [...rest, { type, in: ASK_AGAIN[outcome] }];
}

/**
 * The next question: a kind due to be asked again, then a kind still to be
 * brought in, then any from the mix but the last kind, and never one asked
 * already if another can be found.
 * @param {Rng} rng
 * @param {Pick<Battle, "mix" | "opening" | "asked">} battle
 * @param {string | undefined} last  the kind just asked
 * @param {Battle["again"]} again
 * @returns {Pick<Battle, "question" | "again" | "opening" | "asked"> & { question: Question }}
 */
function ask(rng, { mix, opening, asked }, last, again) {
  const counted = again.map(a => ({ ...a, in: a.in - 1 }));
  const due = counted.find(a => a.in <= 0 && mix.some(p => p.type === a.type));
  const kind = due?.type ?? opening.find(type => mix.some(p => p.type === type));
  const part = kind && mix.find(p => p.type === kind);
  const question = part ? pickQuestion(rng, [{ ...part, weight: 1 }], undefined, asked) : pickQuestion(rng, mix, last, asked);
  return {
    question,
    again: due ? counted.filter(a => a !== due) : counted,
    opening: opening.filter(type => type !== question.type),
    asked: [...asked, questionKey(question)],
  };
}

/**
 * The tally with one more finished question in it.
 * @param {Tally} tally
 * @param {Question} question
 * @param {"firstTry" | "secondTry" | "missed"} outcome
 * @returns {Tally}
 */
function record(tally, question, outcome) {
  const sofar = tally.byType[question.type] ?? { asked: 0, firstTry: 0 };
  return {
    ...tally,
    firstTry: tally.firstTry + Number(outcome === "firstTry"),
    secondTry: tally.secondTry + Number(outcome === "secondTry"),
    missed: tally.missed + Number(outcome === "missed"),
    answers: [...tally.answers, { type: question.type, outcome }],
    byType: {
      ...tally.byType,
      [question.type]: { asked: sofar.asked + 1, firstTry: sofar.firstTry + Number(outcome === "firstTry") },
    },
  };
}
