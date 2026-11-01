// Plays whole adventures as a pretend child who gets a set share of answers
// right, to see how the numbers in src/combat.js feel: how long an adventure
// takes, how often the hero is knocked out, how far they level up. Used by
// tools/simulate_battle.js and by tests/balance.test.js.

import { createRng } from "../src/rng.js";
import { buildAdventure } from "../src/monsters.js";
import { startBattle, answer } from "../src/battle.js";

/**
 * @param {number} seed
 * @param {{ grade: number, accuracy: number, perTier?: number }} child
 *   accuracy: the chance of picking the right answer, on either try
 */
export function simulateAdventure(seed, { grade, accuracy, perTier = 2 }) {
  const rng = createRng(seed);
  let battle = startBattle(rng, { grade, adventure: buildAdventure(rng, perTier) });
  const rounds = [];
  while (battle.question && rounds.length < 10000) {
    const q = battle.question;
    const ruledOut = battle.ruledOut;
    const choice = rng.chance(accuracy) ? q.answer : rng.pick(q.choices.filter(c => c !== q.answer && !ruledOut.includes(c)));
    const result = answer(battle, choice, rng);
    battle = result.battle;
    rounds.push(result.round);
  }
  const { tally } = battle;
  return {
    won: battle.question === null,
    questions: tally.firstTry + tally.secondTry + tally.missed,
    knockouts: tally.knockouts,
    level: battle.hero.level,
    treasures: battle.treasures.length,
    rounds,
  };
}

/** @param {number[]} values */
export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
