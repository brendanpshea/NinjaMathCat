// Factors and multiples: what divides what, primes and composites (4.OA.4),
// and the greatest common factor and least common multiple (6.NS.4).

import { wrongNumbers } from "./common.js";
import { gcd, lcm } from "./rational.js";

/** @import { Draft, QuestionType } from "./common.js" */
/** @import { Rng } from "../rng.js" */

/**
 * @param {number} n
 */
export function isPrime(n) {
  if (n < 2) return false;
  for (let f = 2; f * f <= n; f++) if (n % f === 0) return false;
  return true;
}

/** Odd composites that look prime at a glance, to sit beside primes. */
const LOOKALIKES = [21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 81, 87, 91, 93];
const PRIMES = Array.from({ length: 87 }, (_, i) => i + 11).filter(isPrime);

/**
 * Three numbers from a pool, spread across it, so the answer's place among
 * the choices gives nothing away.
 * @param {Rng} rng
 * @param {number[]} pool
 */
function spreadPick(rng, pool) {
  return rng.shuffle(pool).slice(0, 3);
}

/** @type {QuestionType} */
export const factors = {
  id: "factors",
  name: "Factors and multiples",
  generate(rng) {
    const kind = rng.pick(["factor", "multiple", "prime", "composite"]);
    if (kind === "factor") {
      const n = rng.pick([12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48, 54, 56, 60, 63, 72, 80, 84, 90, 96]);
      const divisors = Array.from({ length: n - 2 }, (_, i) => i + 2).filter(f => n % f === 0 && f < n);
      const answer = rng.pick(divisors.filter(f => f <= n / 2));
      const others = Array.from({ length: n - 2 }, (_, i) => i + 2).filter(f => n % f !== 0);
      return {
        prompt: `Which number is a factor of ${n}?`,
        answer,
        wrong: spreadPick(rng, others),
        hint: `A factor of ${n} divides it with nothing left over.`,
        difficulty: 1 + Number(n > 50) + Number(answer > 9),
      };
    }
    if (kind === "multiple") {
      const n = rng.int(3, 9);
      const answer = n * rng.int(4, 12);
      const near = Array.from({ length: 4 * n + 1 }, (_, i) => answer - 2 * n + i).filter(v => v > n && v % n !== 0);
      return {
        prompt: `Which number is a multiple of ${n}?`,
        answer,
        wrong: spreadPick(rng, near),
        hint: `Multiples of ${n} are what you get counting by ${n}s.`,
        difficulty: 1 + Number(answer > 50),
      };
    }
    const prime = kind === "prime";
    return {
      prompt: prime ? "Which number is prime?" : "Which number is composite (not prime)?",
      answer: rng.pick(prime ? PRIMES : LOOKALIKES),
      wrong: spreadPick(rng, prime ? LOOKALIKES : PRIMES),
      hint: prime ? "A prime number has exactly two factors: 1 and itself." : "A composite number has a factor other than 1 and itself. Try 3 and 7.",
      difficulty: 2 + Number(!prime),
    };
  },
};

/** @type {QuestionType} */
export const commonFactors = {
  id: "common_factors",
  name: "Common factors and multiples",
  generate(rng) {
    return rng.chance(0.5) ? greatestCommonFactor(rng) : leastCommonMultiple(rng);
  },
};

/**
 * @param {Rng} rng
 * @returns {Draft}
 */
function greatestCommonFactor(rng) {
  const g = rng.int(2, 12);
  let [m1, m2] = [rng.int(2, 9), rng.int(2, 9)];
  while (m1 === m2 || gcd(m1, m2) !== 1 || g * Math.max(m1, m2) > 100) [m1, m2] = [rng.int(2, 9), rng.int(2, 9)];
  const [a, b] = [g * m1, g * m2];
  const smallerShared = Array.from({ length: g - 1 }, (_, i) => i + 1).filter(f => g % f === 0 && f > 1);
  return {
    prompt: `What is the greatest common factor of ${a} and ${b}?`,
    answer: g,
    // The least common multiple instead, a common factor that isn't the greatest, or the smaller number.
    wrong: wrongNumbers(rng, g, [lcm(a, b), ...smallerShared, Math.min(a, b), 2 * g], { min: 1 }),
    hint: `List the factors of ${a} and of ${b}, and find the biggest one they share.`,
    difficulty: 2 + Number(g > 6),
  };
}

/**
 * @param {Rng} rng
 * @returns {Draft}
 */
function leastCommonMultiple(rng) {
  let [a, b] = [rng.int(2, 12), rng.int(2, 12)];
  while (a === b || a % b === 0 || b % a === 0) [a, b] = [rng.int(2, 12), rng.int(2, 12)];
  const answer = lcm(a, b);
  return {
    prompt: `What is the least common multiple of ${a} and ${b}?`,
    answer,
    // Multiplying them (which is a common multiple, but not always the least),
    // the greatest common factor instead, or the next common multiple.
    wrong: wrongNumbers(rng, answer, [a * b, gcd(a, b), 2 * answer, a + b, Math.max(a, b)], { min: 1 }),
    hint: `Count by ${Math.max(a, b)}s until you reach a number ${Math.min(a, b)} goes into.`,
    difficulty: 2 + Number(answer > 40),
  };
}
