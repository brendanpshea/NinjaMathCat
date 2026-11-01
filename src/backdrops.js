// The settings battles happen in. Each monster lives in one (src/monsters.js),
// and the stage puts its backdrop behind the fight.
//
// New painted backdrops are made from tools/backdrop_prompts.js and cut by
// tools/cut_backdrops.py into assets/backdrops/<id>.webp. Until a setting has
// its own, it borrows the nearest of the original game's backgrounds.

/**
 * @typedef {object} Backdrop
 * @property {string} id
 * @property {string} name
 * @property {string} file
 * @property {number} floor  where the fighters' feet go: how far down the picture the ground is, from 0 at the top to 1 at the bottom
 */

/** @type {readonly Backdrop[]} */
export const BACKDROPS = [
  { id: "meadow", name: "Sunny Meadow", file: "assets/backgrounds/background_01.png", floor: 0.9 },
  { id: "kitchen", name: "Cottage Kitchen", file: "assets/backgrounds/background_05.png", floor: 0.9 },
  { id: "attic", name: "Toy Attic", file: "assets/backgrounds/background_08.png", floor: 0.92 },
  { id: "hilltop", name: "Windy Hilltop", file: "assets/backgrounds/background_10.png", floor: 0.86 },
  { id: "farm", name: "Pumpkin Farm", file: "assets/backgrounds/background_01.png", floor: 0.9 },
  { id: "castle", name: "Castle Hall", file: "assets/backgrounds/background_04.png", floor: 0.9 },
  { id: "swamp", name: "Swamp Bridge", file: "assets/backgrounds/background_03.png", floor: 0.9 },
  { id: "temple", name: "Crystal Temple", file: "assets/backgrounds/background_10.png", floor: 0.86 },
];

/**
 * The backdrop for a setting; the meadow if there is no such setting.
 * @param {string} setting
 */
export function backdropFor(setting) {
  return BACKDROPS.find(b => b.id === setting) ?? BACKDROPS[0];
}
