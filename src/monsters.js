// The monsters an adventure is made from. Each is a sprite strip (stand,
// attack, recoil) from Loop of the Recursive Dragon, in
// assets/sprites/monsters/ under its id, with a name and a line about it
// written for young readers.

/** @import { Rng } from "./rng.js" */

/**
 * @typedef {object} Monster
 * @property {string} id  its sprite's name
 * @property {string} name
 * @property {string} description  one short sentence a beginning reader can manage
 * @property {number} tier  1 to 4: how tough it is, and so how late in an adventure it comes
 * @property {string} setting  where it lives: a backdrop in src/backdrops.js
 */

/** @type {readonly Monster[]} */
export const MONSTERS = [
  { id: "evil_duck", name: "Sneaky Duck", tier: 1, setting: "meadow", description: "A duck with a very sneaky plan." },
  { id: "broom", name: "Swishy Broom", tier: 1, setting: "attic", description: "It sweeps up anything in its way." },
  { id: "shrub", name: "Grumbly Bush", tier: 1, setting: "meadow", description: "A grumpy bush that hates being trimmed." },
  { id: "grumpy_cloud", name: "Grumpy Cloud", tier: 1, setting: "hilltop", description: "It rains on all the fun." },
  { id: "yarn", name: "Tangle Ball", tier: 1, setting: "attic", description: "A ball of yarn that loves to tie knots." },
  { id: "soup_spirit", name: "Tomato Trouble", tier: 1, setting: "kitchen", description: "A tomato with a giant soup spoon." },

  { id: "goblin", name: "Grabby Goblin", tier: 2, setting: "farm", description: "It grabs shiny things and won't give them back." },
  { id: "kobold", name: "Ladle Lizard", tier: 2, setting: "kitchen", description: "Look out for its giant spoon!" },
  { id: "jelly", name: "Wobble Cube", tier: 2, setting: "swamp", description: "A wiggly, jiggly cube of lime jelly." },
  { id: "flying_sword", name: "Swoosh Sword", tier: 2, setting: "hilltop", description: "A sword that zooms through the clouds." },
  { id: "origami", name: "Paper Dragon", tier: 2, setting: "hilltop", description: "Folded from one big sheet of paper." },
  { id: "teapot_dragon", name: "Teapot Dragon", tier: 2, setting: "kitchen", description: "It's short and stout, and very, very hot." },

  { id: "mimic", name: "Chompy Chest", tier: 3, setting: "castle", description: "It looks like treasure until it opens its mouth." },
  { id: "cheese_golem", name: "Big Cheese", tier: 3, setting: "farm", description: "A giant made of cheese. It thinks it's the boss." },
  { id: "scarecrow", name: "Silly Scarecrow", tier: 3, setting: "farm", description: "It can't scare crows, so it tries to scare you." },
  { id: "topiary", name: "Bushicorn", tier: 3, setting: "meadow", description: "A unicorn trimmed out of a hedge." },
  { id: "puzzle_golem", name: "Jigsaw Giant", tier: 3, setting: "attic", description: "Made of puzzle pieces, with a few missing." },
  { id: "pseudo_dragon", name: "Spiky Dragonling", tier: 3, setting: "castle", description: "A baby dragon with a spiky club." },

  { id: "troll", name: "Bridge Troll", tier: 4, setting: "swamp", description: "Beat it to cross its bridge." },
  { id: "dozing_drake", name: "Sleepy Dragon", tier: 4, setting: "temple", description: "Shh! It gets cranky when you wake it up." },
  { id: "swamp_dragon", name: "Swamp Chomper", tier: 4, setting: "swamp", description: "It lives in the mud and puffs out fire." },
  { id: "clockwork_knight", name: "Tick-Tock Knight", tier: 4, setting: "castle", description: "A wind-up knight. Tick, tock, here it comes!" },
  { id: "prism_beast", name: "Rainbow Rumbler", tier: 4, setting: "temple", description: "A gem that shines in every color." },
  { id: "sphinx", name: "Riddle Sphinx", tier: 4, setting: "temple", description: "It loves riddles, and math ones most of all." },
];

/**
 * @param {Monster} monster
 */
export function monsterSprite(monster) {
  return `assets/sprites/monsters/${monster.id}.webp`;
}

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
