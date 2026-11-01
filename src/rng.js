// Seeded random numbers. Everything random in the game draws from an Rng, so a
// test can replay any question exactly by reusing its seed.

/**
 * @typedef {object} Rng
 * @property {() => number} next  a number in [0, 1)
 * @property {(min: number, max: number) => number} int  a whole number from min to max, both included
 * @property {<T>(items: readonly T[]) => T} pick  one item; the list must not be empty
 * @property {<T>(items: readonly T[]) => T[]} shuffle  a shuffled copy; the list itself is left alone
 * @property {(p: number) => boolean} chance  true with probability p
 */

/**
 * An Rng from a 32-bit seed (mulberry32). Without a seed, each call gets a fresh one.
 * @param {number} [seed]
 * @returns {Rng}
 */
export function createRng(seed = Math.floor(Math.random() * 2 ** 32)) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: items => items[Math.floor(next() * items.length)],
    // Fisher–Yates. (The old game sorted with a random comparator, which
    // favours some orders over others.)
    shuffle: items => {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    chance: p => next() < p,
  };
}
