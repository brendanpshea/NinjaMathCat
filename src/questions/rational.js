// Fractions as exact pairs of whole numbers, so 1/3 + 1/6 is 1/2 and never
// 0.4999…, and whole numbers' greatest common factors and least multiples.

/**
 * A fraction n/d, with d above zero.
 * @typedef {{ n: number, d: number }} Fraction
 */

/**
 * @param {number} a
 * @param {number} b
 */
export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/**
 * @param {number} a
 * @param {number} b
 */
export function lcm(a, b) {
  return (a / gcd(a, b)) * b;
}

/**
 * @param {number} n
 * @param {number} [d]
 * @returns {Fraction}
 */
export function frac(n, d = 1) {
  if (d === 0) throw new RangeError("A fraction can't have 0 at the bottom");
  return d < 0 ? { n: -n, d: -d } : { n, d };
}

/**
 * In lowest terms: 6/8 is 3/4.
 * @param {Fraction} f
 * @returns {Fraction}
 */
export function simplify({ n, d }) {
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
}

/** @param {Fraction} a @param {Fraction} b */
export const add = (a, b) => simplify({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
/** @param {Fraction} a @param {Fraction} b */
export const subtract = (a, b) => simplify({ n: a.n * b.d - b.n * a.d, d: a.d * b.d });
/** @param {Fraction} a @param {Fraction} b */
export const multiply = (a, b) => simplify({ n: a.n * b.n, d: a.d * b.d });
/** @param {Fraction} a @param {Fraction} b */
export const divide = (a, b) => simplify(frac(a.n * b.d, a.d * b.n));
/** Whether two fractions are worth the same: 2/4 and 1/2 are. @param {Fraction} a @param {Fraction} b */
export const same = (a, b) => a.n * b.d === b.n * a.d;
/** -1, 0 or 1, as a is less than, equal to or more than b. @param {Fraction} a @param {Fraction} b */
export const compare = (a, b) => Math.sign(a.n * b.d - b.n * a.d);

/**
 * As a child writes it, without simplifying: 3/4, 6/4, or with `mixed`,
 * 1 2/4. A whole number is written as one: 2, not 2/1, and as a mixed
 * number 1, not 4/4.
 * @param {Fraction} f
 * @param {{ mixed?: boolean }} [options]
 */
export function formatFraction({ n, d }, { mixed = false } = {}) {
  if (d === 1) return String(n);
  if (mixed && Math.abs(n) >= d) {
    const whole = Math.trunc(n / d);
    const rest = Math.abs(n % d);
    return rest === 0 ? String(whole) : `${whole} ${rest}/${d}`;
  }
  return `${n}/${d}`;
}

/**
 * A whole number of 1/den steps as a ruler is read: simplest form, mixed.
 * 6 eighths is 3/4, 10 fourths is 2 1/2, 8 fourths is 2.
 * @param {number} units
 * @param {number} den
 */
export function rulerText(units, den) {
  return formatFraction(simplify(frac(units, den)), { mixed: true });
}

/**
 * The fraction in "3/4", "1 1/4" or "2".
 * @param {string} text
 * @returns {Fraction}
 */
export function parseFraction(text) {
  const mixed = text.match(/^(-?\d+) (\d+)\/(\d+)$/);
  if (mixed) {
    const [whole, n, d] = mixed.slice(1).map(Number);
    return frac(whole * d + Math.sign(whole || 1) * n, d);
  }
  const plain = text.match(/^(-?\d+)\/(\d+)$/);
  if (plain) return frac(Number(plain[1]), Number(plain[2]));
  if (/^-?\d+$/.test(text)) return frac(Number(text));
  throw new RangeError(`"${text}" is not a fraction`);
}
