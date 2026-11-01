// Scales: turning numbers into positions, and choosing steps a child can count by.

/**
 * A function from a range of numbers onto a range of positions.
 * @param {[number, number]} domain
 * @param {[number, number]} range
 * @returns {(x: number) => number}
 */
export function linear([d0, d1], [r0, r1]) {
  return x => r0 + ((x - d0) * (r1 - r0)) / (d1 - d0);
}

/**
 * The smallest step from 1, 2, 5, 10, 20, 50, 100… that splits 0 to `max`
 * into no more than `most` steps.
 * @param {number} max
 * @param {number} [most]
 */
export function niceStep(max, most = 10) {
  for (let magnitude = 1; ; magnitude *= 10) {
    for (const m of [1, 2, 5]) {
      if (max / (m * magnitude) <= most) return m * magnitude;
    }
  }
}
