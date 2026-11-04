// The monster book: every monster a child has beaten, page by page for the
// places they live, each with its picture and a line about it. It is a record
// of the adventure, not a prize to chase (docs/TREASURES.md): the monsters
// come from playing, and the book remembers them.
//
// A level always fights the same monsters (monstersOf in src/adventures.js),
// so the levels done say most of who has been met, from before the book
// existed too. Quick battles meet monsters at random, so every monster beaten
// is also kept in the save (`met` in src/save.js).

import { MONSTERS } from "./monsters.js";
import { BACKDROPS } from "./backdrops.js";
import { ADVENTURES, ADVENTURE_GRADES, levelsFor, monstersOf, residents } from "./adventures.js";

/** @import { Monster } from "./monsters.js" */
/** @import { Player } from "./save.js" */

/**
 * The ids of every monster a player has beaten: in the levels they have done,
 * and in any battle since the book began.
 * @param {Pick<Player, "met" | "adventures">} player
 * @returns {Set<string>}
 */
export function monstersMet(player) {
  const met = new Set(player.met);
  for (const grade of ADVENTURE_GRADES) {
    const progress = player.adventures[grade];
    if (!progress) continue;
    for (const level of levelsFor(grade)) {
      if (progress.done[level.id]) for (const m of monstersOf(level)) met.add(m.id);
    }
  }
  return met;
}

/**
 * @typedef {object} Page
 * @property {string} setting
 * @property {string} place  what the place is called
 * @property {Monster[]} monsters  the ones who live there, weakest first
 */

/**
 * The book's pages: one for each place, in the order the adventures first go
 * there, kindergarten on.
 * @returns {Page[]}
 */
export function bookPages() {
  const order = [...new Set([
    ...ADVENTURE_GRADES.flatMap(g => ADVENTURES[g].map(c => c.setting)),
    ...MONSTERS.map(m => m.setting),
  ])];
  return order.map(setting => ({
    setting,
    place: BACKDROPS.find(b => b.id === setting)?.name ?? setting,
    monsters: residents(setting),
  }));
}
