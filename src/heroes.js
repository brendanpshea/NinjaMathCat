// The heroes a child can play as. The choice is only how the hero looks;
// every hero fights the same. Each is a sprite strip (stand, attack, recoil)
// from Loop of the Recursive Dragon, in assets/sprites/heroes/.

/**
 * @typedef {object} Hero
 * @property {string} id  its sprite's name
 * @property {string} name
 */

/** @type {readonly Hero[]} */
export const HEROES = [
  { id: "cat_ninja", name: "Ninja Cat" },
  { id: "rabbit_samurai", name: "Samurai Rabbit" },
  { id: "owl_wizard", name: "Owl Wizard" },
  { id: "lion_barbarian", name: "Lion Warrior" },
  { id: "raven_thief", name: "Raven Scout" },
  { id: "tiger_assassin", name: "Snow Tiger" },
];

/** The hero the game is named for. */
export const DEFAULT_HERO = HEROES[0];

/**
 * @param {Hero} hero
 */
export function heroSprite(hero) {
  return `assets/sprites/heroes/${hero.id}.webp`;
}
