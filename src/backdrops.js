// The settings battles happen in. Each monster lives in one (src/monsters.js),
// and the stage puts its backdrop behind the fight.
//
// New painted backdrops are made from tools/backdrop_prompts.js and cut by
// tools/cut_backdrops.py into assets/backdrops/<id>.webp, from pictures made
// with Gemini.

/**
 * @typedef {object} Backdrop
 * @property {string} id
 * @property {string} name
 * @property {string} file
 * @property {number} floor  where the fighters' feet go: how far down the picture the ground is, from 0 at the top to 1 at the bottom
 */

/** @type {readonly Backdrop[]} */
export const BACKDROPS = [
  { id: "meadow", name: "Sunny Meadow", file: "assets/backdrops/meadow.webp", floor: 0.9 },
  { id: "kitchen", name: "Cottage Kitchen", file: "assets/backdrops/kitchen.webp", floor: 0.9 },
  { id: "attic", name: "Toy Attic", file: "assets/backdrops/attic.webp", floor: 0.9 },
  { id: "hilltop", name: "Windy Hilltop", file: "assets/backdrops/hilltop.webp", floor: 0.88 },
  { id: "farm", name: "Pumpkin Farm", file: "assets/backdrops/farm.webp", floor: 0.9 },
  { id: "castle", name: "Castle Hall", file: "assets/backdrops/castle.webp", floor: 0.9 },
  { id: "swamp", name: "Swamp Bridge", file: "assets/backdrops/swamp.webp", floor: 0.9 },
  { id: "temple", name: "Crystal Temple", file: "assets/backdrops/temple.webp", floor: 0.88 },
  { id: "seaside", name: "Seaside Cove", file: "assets/backdrops/seaside.webp", floor: 0.9 },
  { id: "mushrooms", name: "Mushroom Forest", file: "assets/backdrops/mushrooms.webp", floor: 0.9 },
  { id: "frozen", name: "Frozen Lake", file: "assets/backdrops/frozen.webp", floor: 0.9 },
  { id: "candy", name: "Candy Hills", file: "assets/backdrops/candy.webp", floor: 0.9 },
  { id: "library", name: "Grand Library", file: "assets/backdrops/library.webp", floor: 0.9 },
  { id: "clocktower", name: "Clock Tower", file: "assets/backdrops/clocktower.webp", floor: 0.9 },
  { id: "observatory", name: "Starry Observatory", file: "assets/backdrops/observatory.webp", floor: 0.9 },
  { id: "peak", name: "Stormy Peak", file: "assets/backdrops/peak.webp", floor: 0.9 },
];

/**
 * The backdrop for a setting; the meadow if there is no such setting.
 * @param {string} setting
 */
export function backdropFor(setting) {
  return BACKDROPS.find(b => b.id === setting) ?? BACKDROPS[0];
}
