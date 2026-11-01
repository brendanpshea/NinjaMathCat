// The numbers behind a fight: how tough heroes and monsters are, how hard a
// right answer hits, and how a hero grows. Each rule is a small function of
// plain numbers, so tests can pin down how a fight feels ("a first monster
// takes three to five right answers") and a change to the balance is deliberate.

/**
 * How much stronger everything is at a level than at level 1: a quarter more
 * for each level. Heroes and monsters grow at the same rate, so a fight
 * between equals feels the same at level 20 as at level 1. What changes over
 * an adventure is how far apart the two are.
 * @param {number} level
 */
export function growth(level) {
  return 1 + (level - 1) / 4;
}

/**
 * Rounded to the nearest 5, to keep the numbers on screen friendly.
 * @param {number} n
 */
function friendly(n) {
  return Math.round(n / 5) * 5;
}

/**
 * A hero's health and attack at a level.
 * @param {number} level
 */
export function heroStats(level) {
  return { maxHp: friendly(100 * growth(level)), attack: friendly(20 * growth(level)) };
}

/**
 * A monster's health and attack at a level.
 * @param {number} level
 */
export function monsterStats(level) {
  return { maxHp: friendly(80 * growth(level)), attack: friendly(15 * growth(level)) };
}

/**
 * The level a monster fights at. An adventure is pitched at the hero who
 * starts it: its first monsters (tier 1) are at the hero's level, its last
 * (tier 4) three above, and the hero levels up along the way to meet them.
 * @param {number} tier  the monster's tier, 1 to 4
 * @param {number} heroLevel  the hero's level when the adventure began
 */
export function monsterLevel(tier, heroLevel) {
  return heroLevel + tier - 1;
}

/** How much harder a right answer hits, by the question's difficulty (1 to 3). */
export const DIFFICULTY_BONUS = [1, 1, 1.25, 1.5];

/**
 * The damage multiplier for a streak of answers right the first time, this
 * one included: 3 in a row hit 1.25 times as hard, 5 hit 1.5 times, 8 twice.
 * @param {number} streak
 */
export function streakMultiplier(streak) {
  return streak >= 8 ? 2 : streak >= 5 ? 1.5 : streak >= 3 ? 1.25 : 1;
}

/**
 * How hard a right answer hits. A right answer on the second try hits half as
 * hard and never builds a streak, so guessing until it works is no strategy.
 * @param {{ attack: number, difficulty: number, streak: number, secondTry: boolean }} hit
 */
export function hitDamage({ attack, difficulty, streak, secondTry }) {
  const bonus = DIFFICULTY_BONUS[difficulty] * (secondTry ? 0.5 : streakMultiplier(streak));
  return Math.round(attack * bonus);
}

/**
 * Experience points. Every right answer earns some; beating a monster earns
 * more, the higher its tier. An adventure is worth about three levels, the
 * same climb as its monsters', at any level.
 */
export const XP = { firstTry: 10, secondTry: 5, perTier: 25, perLevel: 250 };

/**
 * The total experience needed to reach a level.
 * @param {number} level
 */
export function xpToReach(level) {
  return XP.perLevel * (level - 1);
}

/**
 * The level a total of experience has reached.
 * @param {number} xp
 */
export function levelForXp(xp) {
  return 1 + Math.floor(xp / XP.perLevel);
}

/**
 * The health a hero gets back for beating a monster: a quarter of their most.
 * @param {number} maxHp
 */
export function victoryHeal(maxHp) {
  return Math.round(maxHp / 4);
}
