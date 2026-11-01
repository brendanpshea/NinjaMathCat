// The monsters an adventure is made from. Each id names its sprite strip,
// which comes over from LotRD with the battle stage. The names are LotRD's
// for now; kid-friendly ones come with the sprites.

/** @import { Rng } from "./rng.js" */

/**
 * @typedef {object} Monster
 * @property {string} id  its sprite's name
 * @property {string} name
 * @property {number} tier  1 to 4: how tough it is, and so how late in an adventure it comes
 */

/** @type {readonly Monster[]} */
export const MONSTERS = [
  { id: "evil_duck", name: "Evil Duck", tier: 1 },
  { id: "broom", name: "Animated Broom", tier: 1 },
  { id: "shrub", name: "Awakened Shrub", tier: 1 },
  { id: "grumpy_cloud", name: "Grumpy Cloud", tier: 1 },
  { id: "yarn", name: "Yarn Elemental", tier: 1 },
  { id: "soup_spirit", name: "Soup Spirit", tier: 1 },

  { id: "goblin", name: "Goblin", tier: 2 },
  { id: "kobold", name: "Kobold", tier: 2 },
  { id: "jelly", name: "Jelly Cube", tier: 2 },
  { id: "flying_sword", name: "Flying Sword", tier: 2 },
  { id: "origami", name: "Origami Dragon", tier: 2 },
  { id: "teapot_dragon", name: "Teapot Dragon", tier: 2 },

  { id: "mimic", name: "Mimic", tier: 3 },
  { id: "cheese_golem", name: "Cheese Golem", tier: 3 },
  { id: "scarecrow", name: "Scarecrow", tier: 3 },
  { id: "topiary", name: "Living Topiary", tier: 3 },
  { id: "puzzle_golem", name: "Puzzle Golem", tier: 3 },
  { id: "button_golem", name: "Button Golem", tier: 3 },

  { id: "troll", name: "Troll", tier: 4 },
  { id: "dozing_drake", name: "Dozing Drake", tier: 4 },
  { id: "swamp_dragon", name: "Swamp Dragon", tier: 4 },
  { id: "clockwork_knight", name: "Clockwork Knight", tier: 4 },
  { id: "prism_beast", name: "Prism Beast", tier: 4 },
  { id: "sphinx", name: "Marble Sphinx", tier: 4 },
];

/**
 * The monsters for one adventure: `perTier` of each tier, weakest first,
 * picked at random within a tier. Two of each makes eight fights, about
 * forty questions.
 * @param {Rng} rng
 * @param {number} [perTier]
 * @returns {Monster[]}
 */
export function buildAdventure(rng, perTier = 2) {
  const tiers = [...new Set(MONSTERS.map(m => m.tier))].sort((a, b) => a - b);
  return tiers.flatMap(tier => rng.shuffle(MONSTERS.filter(m => m.tier === tier)).slice(0, perTier));
}
