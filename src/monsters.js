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

/**
 * Progress codes (src/progress_code.js) keep the monster book by where each
 * monster comes in this list, so a new monster goes at the end.
 * @type {readonly Monster[]}
 */
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
  { id: "claw", name: "Pinchy Crab", tier: 1, setting: "seaside", description: "It pinches first and says sorry later." },
  { id: "otter_corsair", name: "Pirate Otter", tier: 2, setting: "seaside", description: "It wants your treasure, and a fish snack." },
  { id: "coral_colussus", name: "Coral Giant", tier: 4, setting: "seaside", description: "A giant made of bright coral from the sea." },
  { id: "stirge", name: "Beaky Puff", tier: 1, setting: "mushrooms", description: "A fluffy puff with a very pointy beak." },
  { id: "pixie", name: "Prank Pixie", tier: 1, setting: "mushrooms", description: "A tiny fairy who loves a good trick." },
  { id: "fungal_knight", name: "Mushroom Knight", tier: 2, setting: "mushrooms", description: "A brave knight with a mushroom for a hat." },
  { id: "crystal_warrior", name: "Icicle Knight", tier: 2, setting: "frozen", description: "Its armor is made of ice. Brrr!" },
  { id: "echo_knight", name: "Frost Echo", tier: 3, setting: "frozen", description: "It repeats what you say. What you say!" },
  { id: "storm_sovereign", name: "Blizzard King", tier: 4, setting: "frozen", description: "It rules the snow with a crackle of cold." },
  { id: "flumph", name: "Jelly Floater", tier: 1, setting: "candy", description: "A wobbly jelly that floats on the breeze." },
  { id: "soap_golem", name: "Marshmallow Golem", tier: 2, setting: "candy", description: "Soft, sweet and much too fluffy to stop." },
  { id: "candy_witch", name: "Gingerbread Witch", tier: 3, setting: "candy", description: "She casts spells with a candy cane wand." },
  { id: "ink_elemental", name: "Inky Blot", tier: 1, setting: "library", description: "A splash of ink that got out of the pen." },
  { id: "bookwyrm", name: "Bookworm Dragon", tier: 3, setting: "library", description: "It eats books, but only the math ones." },
  { id: "library_leviathan", name: "Book Whale", tier: 4, setting: "library", description: "A whale made of books, with a tower on top." },
  { id: "haunted_lantern", name: "Lantern Imp", tier: 1, setting: "clocktower", description: "A little flame that lives in a lamp." },
  { id: "rusty", name: "Rust Muncher", tier: 2, setting: "clocktower", description: "It munches on old bolts and gears." },
  { id: "clockwork_phoenix", name: "Clockwork Phoenix", tier: 4, setting: "clocktower", description: "A bird of fire and gears. Tick, tick, whoosh!" },
  { id: "beholder", name: "Many-Eyes", tier: 2, setting: "observatory", description: "It has seven eyes and still loses its keys." },
  { id: "constellation", name: "Star Knight", tier: 3, setting: "observatory", description: "A knight made of night sky and stars." },
  { id: "quantum_dragon", name: "Star Dragon", tier: 4, setting: "observatory", description: "A dragon that shimmers like the stars." },
  { id: "mosaic", name: "Tile Guardian", tier: 3, setting: "peak", description: "A guard built from tiny colored tiles." },
  { id: "orchestra_elemental", name: "Thunder Tuba", tier: 3, setting: "peak", description: "Its music is loud enough to shake hills." },
  { id: "recursion_wyrm", name: "Mountain Dragon", tier: 4, setting: "peak", description: "The oldest dragon of all, at the very top." },
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
