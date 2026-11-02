// The class view, for teachers: everyone who plays on this device, and anyone
// whose progress code a teacher has pasted in, grade by grade. How far each
// child has got, what each needs to practise, and which topics the most
// children need. There is still no server: codes come in by hand, through a
// class's message board or email, and stay on the teacher's device.

import { chaptersFor, levelsFor } from "./adventures.js";
import { strength } from "./mastery.js";
import { decodePlayer } from "./progress_code.js";
import { importPlayer, newSave, progressIn, MOST_CODES } from "./save.js";

/** @import { Player } from "./save.js" */

/**
 * @typedef {object} ClassRow
 * @property {string} name
 * @property {boolean} fromCode  pasted in, rather than a player on this device
 * @property {number} done  levels done in the grade's adventure
 * @property {number} levels  levels in it
 * @property {number} played  battles played in all
 * @property {string[]} practise  the grade's kinds of question that need practice, the weakest first
 * @property {number | null} best  the best one-minute challenge score in the grade
 */

/**
 * @typedef {object} ClassGrade
 * @property {number} grade
 * @property {ClassRow[]} rows  by name
 * @property {{ type: string, names: string[] }[]} topics  the kinds that children need to practise, the most children first
 */

/**
 * Every progress code in some pasted text, however it is spaced or broken up into lines.
 * @param {string} text
 */
export function codesIn(text) {
  return text.match(/NMC1-[A-Za-z0-9_-]+/g) ?? [];
}

/**
 * The player a code holds, put right as a save would put it; null if it holds nothing usable.
 * @param {string} code
 * @returns {Player | null}
 */
export function playerFromCode(code) {
  const stored = decodePlayer(code);
  return stored ? importPlayer(newSave(), stored)?.player ?? null : null;
}

/**
 * Pasted codes added to those kept. A newer code for a name replaces the
 * older one, so a child can send a code again as they get further.
 * @param {readonly string[]} kept
 * @param {readonly string[]} pasted
 * @returns {{ codes: string[], added: number, replaced: number, bad: number }}
 */
export function addCodes(kept, pasted) {
  /** @type {Map<string, string>} */
  const byName = new Map();
  for (const code of kept) {
    const player = playerFromCode(code);
    if (player) byName.set(player.name.toLowerCase(), code);
  }
  let [added, replaced, bad] = [0, 0, 0];
  for (const code of pasted) {
    const player = playerFromCode(code);
    if (!player) {
      bad++;
      continue;
    }
    const name = player.name.toLowerCase();
    if (byName.has(name)) replaced++;
    else added++;
    byName.delete(name); // so the newest comes last
    byName.set(name, code);
  }
  return { codes: [...byName.values()].slice(-MOST_CODES), added, replaced, bad };
}

/**
 * The class, grade by grade, youngest first.
 * @param {readonly { player: Player, fromCode: boolean }[]} members
 * @returns {ClassGrade[]}
 */
export function classView(members) {
  const grades = [...new Set(members.map(m => m.player.grade))].sort((a, b) => a - b);
  return grades.map(grade => {
    const levels = levelsFor(grade);
    // The grade's kinds of question, in the order its adventure brings them in.
    const kinds = [...new Set(chaptersFor(grade).flatMap(c => [...c.learn, ...(c.warmup ?? [])]))];
    const rows = members
      .filter(m => m.player.grade === grade)
      .sort((a, b) => a.player.name.localeCompare(b.player.name))
      .map(({ player, fromCode }) => {
        const progress = progressIn(player, grade);
        return {
          name: player.name,
          fromCode,
          done: levels.filter(l => progress.done[l.id]).length,
          levels: levels.length,
          played: player.played,
          practise: kinds.filter(type => strength(player.mastery[type]) === "practise").sort((a, b) => player.mastery[a].score - player.mastery[b].score),
          best: player.challenges[grade] ?? null,
        };
      });
    const topics = kinds
      .map(type => ({ type, names: rows.filter(r => r.practise.includes(type)).map(r => r.name) }))
      .filter(t => t.names.length > 0)
      .sort((a, b) => b.names.length - a.names.length);
    return { grade, rows, topics };
  });
}
