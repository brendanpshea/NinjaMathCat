// Pictures of the things questions show: apples to count, cats in a graph,
// balls in a pattern. Each is an emoji in the questions themselves, and is
// drawn as the game's own picture (assets/pictures/<id>.webp) once there is
// one, so it looks the same on every device and matches the game. The
// pictures are made from tools/icon_sheets.json, and src/picture_art.js
// lists the ones made so far.

import { DRAWN } from "./picture_art.js";

/**
 * For each emoji: its picture's id, and what it is called, for a screen
 * reader where the picture stands alone (an answer to pick).
 * @type {Record<string, [string, string]>}
 */
export const PICTURES = {
  "🍎": ["apple_red", "red apple"],
  "🍏": ["apple_green", "green apple"],
  "🍌": ["banana", "banana"],
  "🍇": ["grapes", "grapes"],
  "🍊": ["orange", "orange"],
  "🍐": ["pear", "pear"],
  "🍓": ["strawberry", "strawberry"],
  "🍪": ["cookie", "cookie"],
  "🍅": ["tomato", "tomato"],
  "🥕": ["carrot", "carrot"],
  "🌽": ["corn", "corn"],
  "🍬": ["sweet", "sweet"],
  "🍭": ["lollipop", "lollipop"],
  "🐱": ["cat", "cat"],
  "🐶": ["dog", "dog"],
  "🐦": ["bird", "bird"],
  "🐟": ["fish", "fish"],
  "🐰": ["bunny", "bunny"],
  "🐸": ["frog", "frog"],
  "🐵": ["monkey", "monkey"],
  "🐷": ["pig", "pig"],
  "🐞": ["ladybug", "ladybug"],
  "🐙": ["octopus", "octopus"],
  "🐢": ["turtle", "turtle"],
  "🦀": ["crab", "crab"],
  "🐳": ["whale", "whale"],
  "🐚": ["shell", "shell"],
  "🌼": ["daisy", "daisy"],
  "🌻": ["sunflower", "sunflower"],
  "🌵": ["cactus", "cactus"],
  "🍄": ["mushroom", "mushroom"],
  "🌲": ["pine_tree", "pine tree"],
  "🍁": ["maple_leaf", "leaf"],
  "⭐": ["star", "star"],
  "🌙": ["moon", "moon"],
  "🌞": ["sun", "sun"],
  "🌈": ["rainbow", "rainbow"],
  "⚡": ["lightning", "lightning"],
  "☔": ["umbrella", "umbrella in the rain"],
  "⛅": ["cloud", "cloud"],
  "⛄": ["snowman", "snowman"],
  "⚽": ["soccer_ball", "soccer ball"],
  "🏀": ["basketball", "basketball"],
  "🎾": ["tennis_ball", "tennis ball"],
  "🏈": ["football", "football"],
  "⚾": ["baseball", "baseball"],
  "🎈": ["balloon", "balloon"],
  "🧸": ["teddy_bear", "teddy bear"],
  "🚗": ["car", "car"],
  "🚲": ["bike", "bike"],
  "🚀": ["rocket", "rocket"],
  "🚂": ["train", "train"],
  "⛵": ["sailboat", "sailboat"],
  "🚌": ["bus", "bus"],
  "🛴": ["scooter", "scooter"],
  "🚶": ["walker", "walking"],
  "💎": ["gem", "gem"],
  "🪙": ["coin", "coin"],
  "📦": ["box", "box"],
  "🪑": ["chair", "chair"],
  "🧺": ["basket", "basket"],
};

/**
 * Coloured counters need no picture: they are drawn as circles, as a ten
 * frame's are. For each: its fill, its edge, and its name.
 * @type {Record<string, [string, string, string]>}
 */
export const COUNTERS = {
  "🔴": ["#ef4444", "#991b1b", "red counter"],
  "🔵": ["#3b82f6", "#1e3a8a", "blue counter"],
  "🟢": ["#22c55e", "#14532d", "green counter"],
  "🟡": ["#facc15", "#854d0e", "yellow counter"],
  "🟣": ["#a855f7", "#581c87", "purple counter"],
  "⚫": ["#374151", "#111827", "dot"],
};

/**
 * A coloured counter's colours and name, or null for any other emoji.
 * @param {string} emoji
 * @returns {{ fill: string, edge: string, name: string } | null}
 */
export function counterOf(emoji) {
  const entry = COUNTERS[bare(emoji)];
  return entry ? { fill: entry[0], edge: entry[1], name: entry[2] } : null;
}

/** An emoji without the selector that asks for its colour version, which some are written with. */
const bare = (/** @type {string} */ emoji) => emoji.replace(/️/g, "");

const BY_EMOJI = new Map(Object.entries(PICTURES).map(([emoji, entry]) => [bare(emoji), entry]));

/**
 * The picture for an emoji, once it is drawn: its file and its name. Null
 * for an emoji with no picture, or one not drawn yet, which shows as itself.
 * @param {string} emoji
 * @param {ReadonlySet<string>} [drawn]  the pictures made so far
 * @returns {{ file: string, name: string } | null}
 */
export function pictureOf(emoji, drawn = DRAWN) {
  const entry = BY_EMOJI.get(bare(emoji));
  return entry && drawn.has(entry[0]) ? { file: `assets/pictures/${entry[0]}.webp`, name: entry[1] } : null;
}
