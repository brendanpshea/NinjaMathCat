// Treasures, of two kinds. Each is given for something a child did, never at
// random for taking part (docs/TREASURES.md says why):
//
// - A chapter treasure, from a chapter's boss the first time it is beaten,
//   says what the chapter taught. A grade's own treasure comes with the last
//   of its chapters. Both are worked out from the adventure's progress, so
//   they need no saving of their own.
// - A keepsake comes as a surprise when a child gets something right first
//   time that they last met days ago: it stuck. At most one comes a day, so
//   playing more can't bring one sooner.
//
// Each has a picture in assets/treasures/ once it is drawn (src/treasure_art.js
// lists those), and an emoji until then.

/** @import { Rng } from "./rng.js" */
/** @import { TypeMastery } from "./mastery.js" */
/** @import { AdventureProgress } from "./adventures.js" */

import { ADVENTURES } from "./adventures.js";

/**
 * @typedef {object} Keepsake
 * @property {string} id
 * @property {string} emoji
 * @property {string} name
 */

/**
 * Progress codes (src/progress_code.js) keep keepsakes by where they come in
 * this list, so a new one goes at the end, and none is taken out. The first
 * 75 were the old game's treasures, which monsters used to drop.
 * @type {readonly Keepsake[]}
 */
export const KEEPSAKES = [
  { id: "sparkly_gemstone", emoji: "💎", name: "Sparkly Gemstone" },
  { id: "crystal_ball_of_mild_predictions", emoji: "🔮", name: "Crystal Ball of Mild Predictions" },
  { id: "wand_of_whimsy", emoji: "🪄", name: "Wand of Whimsy" },
  { id: "rainbow_power", emoji: "🌈", name: "Rainbow Power" },
  { id: "magical_butterfly", emoji: "🦋", name: "Magical Butterfly" },
  { id: "mirror_of_many_faces", emoji: "🪞", name: "Mirror of Many Faces" },
  { id: "moon_charm", emoji: "🌙", name: "Moon Charm" },
  { id: "transformation_frog", emoji: "🐸", name: "Transformation Frog" },
  { id: "mystic_hook", emoji: "🪝", name: "Mystic Hook" },
  { id: "sun_medallion", emoji: "☀️", name: "Sun Medallion" },
  { id: "time_yo_yo", emoji: "🪀", name: "Time Yo-Yo" },
  { id: "cookie_of_speed", emoji: "🍪", name: "Cookie of Speed" },
  { id: "rainbow_brush", emoji: "🎨", name: "Rainbow Brush" },
  { id: "bard_s_guitar", emoji: "🎸", name: "Bard's Guitar" },
  { id: "disco_crystal", emoji: "🪩", name: "Disco Crystal" },
  { id: "bag_of_giggling_gold", emoji: "💰", name: "Bag of Giggling Gold" },
  { id: "crown_of_mild_command", emoji: "👑", name: "Crown of Mild Command" },
  { id: "mask_of_many_voices", emoji: "🎭", name: "Mask of Many Voices" },
  { id: "shield_of_selective_bouncing", emoji: "🛡️", name: "Shield of Selective Bouncing" },
  { id: "bow_of_boomerang_arrows", emoji: "🏹", name: "Bow of Boomerang Arrows" },
  { id: "heart_of_helpfulness", emoji: "❤️", name: "Heart of Helpfulness" },
  { id: "ever_changing_apple", emoji: "🍎", name: "Ever-Changing Apple" },
  { id: "scroll_of_silly_spells", emoji: "📜", name: "Scroll of Silly Spells" },
  { id: "ring_of_random_ringing", emoji: "💍", name: "Ring of Random Ringing" },
  { id: "amulet_of_awesome_alibis", emoji: "🧿", name: "Amulet of Awesome Alibis" },
  { id: "compass_of_curiosity", emoji: "🧭", name: "Compass of Curiosity" },
  { id: "hourglass_of_holding_on", emoji: "⌛️", name: "Hourglass of Holding On" },
  { id: "seed_of_sudden_songs", emoji: "🌱", name: "Seed of Sudden Songs" },
  { id: "mushroom_of_many_moods", emoji: "🍄", name: "Mushroom of Many Moods" },
  { id: "dragon_scale_mail", emoji: "🐉", name: "Dragon Scale Mail" },
  { id: "fox_tail_of_mischief", emoji: "🦊", name: "Fox Tail of Mischief" },
  { id: "owl_specs_of_wisdom", emoji: "🦉", name: "Owl Specs of Wisdom" },
  { id: "horn_of_heroic_hints", emoji: "📯", name: "Horn of Heroic Hints" },
  { id: "vessel_of_various_voices", emoji: "⚱️", name: "Vessel of Various Voices" },
  { id: "water_drop_of_wetness", emoji: "💧", name: "Water Drop of Wetness" },
  { id: "fireball_of_friendship", emoji: "🔥", name: "Fireball of Friendship" },
  { id: "pocket_tornado", emoji: "🌪️", name: "Pocket Tornado" },
  { id: "ice_shard_of_infinite_brain_freeze", emoji: "❄️", name: "Ice Shard of Infinite Brain Freeze" },
  { id: "rod_of_ridiculous_fishing", emoji: "🎣", name: "Rod of Ridiculous Fishing" },
  { id: "shooting_star_fragment", emoji: "🌠", name: "Shooting Star Fragment" },
  { id: "ancient_allowance_coin", emoji: "🪙", name: "Ancient Allowance Coin" },
  { id: "pocket_fireworks", emoji: "🎆", name: "Pocket Fireworks" },
  { id: "thread_of_tangled_tales", emoji: "🧶", name: "Thread of Tangled Tales" },
  { id: "magnet_of_mystery", emoji: "🧲", name: "Magnet of Mystery" },
  { id: "balloon_of_bouncy_bravery", emoji: "🎈", name: "Balloon of Bouncy Bravery" },
  { id: "honey_of_heroic_happiness", emoji: "🍯", name: "Honey of Heroic Happiness" },
  { id: "coconut_of_clever_comebacks", emoji: "🥥", name: "Coconut of Clever Comebacks" },
  { id: "berries_of_better_bedtime", emoji: "🫐", name: "Berries of Better Bedtime" },
  { id: "pretzel_of_protection", emoji: "🥨", name: "Pretzel of Protection" },
  { id: "wonder_wheel_of_why_not", emoji: "🎡", name: "Wonder Wheel of Why Not" },
  { id: "pocket_circus", emoji: "🎪", name: "Pocket Circus" },
  { id: "stone_face_of_seriousness", emoji: "🗿", name: "Stone Face of Seriousness" },
  { id: "battery_of_boundless_bounciness", emoji: "🔋", name: "Battery of Boundless Bounciness" },
  { id: "clover_of_convenient_coincidences", emoji: "☘️", name: "Clover of Convenient Coincidences" },
  { id: "piano_keys_of_possibility", emoji: "🎹", name: "Piano Keys of Possibility" },
  { id: "drum_of_daily_dancing", emoji: "🪘", name: "Drum of Daily Dancing" },
  { id: "sparkler_of_spectacular_speeches", emoji: "🎇", name: "Sparkler of Spectacular Speeches" },
  { id: "robe_of_rushing_ready", emoji: "👗", name: "Robe of Rushing Ready" },
  { id: "hat_of_hundred_happenings", emoji: "🎩", name: "Hat of Hundred Happenings" },
  { id: "pebble_of_peak_performance", emoji: "🗻", name: "Pebble of Peak Performance" },
  { id: "dolls_of_delightful_duplication", emoji: "🎎", name: "Dolls of Delightful Duplication" },
  { id: "ladder_of_unlikely_locations", emoji: "🪜", name: "Ladder of Unlikely Locations" },
  { id: "sparkles_of_spontaneous_style", emoji: "✨", name: "Sparkles of Spontaneous Style" },
  { id: "trophy_of_trying_your_best", emoji: "🏆", name: "Trophy of Trying Your Best" },
  { id: "key_of_keeping_secrets", emoji: "🔑", name: "Key of Keeping Secrets" },
  { id: "sword_of_silliness", emoji: "⚔️", name: "Sword of Silliness" },
  { id: "star_of_starting_over", emoji: "⭐️", name: "Star of Starting Over" },
  { id: "potion_of_peculiar_perspectives", emoji: "🧪", name: "Potion of Peculiar Perspectives" },
  { id: "lightning_in_a_bottle", emoji: "⚡️", name: "Lightning in a Bottle" },
  { id: "bell_of_brilliant_ideas", emoji: "🔔", name: "Bell of Brilliant Ideas" },
  { id: "beads_of_better_bedtime", emoji: "📿", name: "Beads of Better Bedtime" },
  { id: "skeleton_key_of_sneaking", emoji: "🗝️", name: "Skeleton Key of Sneaking" },
  { id: "comet_crumbs_of_chaos", emoji: "☄️", name: "Comet Crumbs of Chaos" },
  { id: "moon_phase_phaser", emoji: "🌗", name: "Moon Phase Phaser" },
  { id: "forever_firework", emoji: "🎉", name: "Forever Firework" },
  { id: "teapot_of_tiny_tempests", emoji: "🫖", name: "Teapot of Tiny Tempests" },
  { id: "snail_shell_of_steady_speed", emoji: "🐌", name: "Snail Shell of Steady Speed" },
  { id: "lantern_of_lost_things", emoji: "🏮", name: "Lantern of Lost Things" },
  { id: "acorn_of_ambitious_oaks", emoji: "🌰", name: "Acorn of Ambitious Oaks" },
  { id: "kite_of_kind_winds", emoji: "🪁", name: "Kite of Kind Winds" },
  { id: "umbrella_of_upside_down_weather", emoji: "☂️", name: "Umbrella of Upside-Down Weather" },
];

/**
 * A treasure won by finishing a chapter, or by finishing every chapter of a grade.
 * @typedef {object} ChapterTreasure
 * @property {string} id  "chapter-" and the chapter's id, or "grade-" and the grade
 * @property {number} grade
 * @property {number | null} chapter  where its chapter comes in the grade, from 0; null for a grade's own treasure
 * @property {string} name
 * @property {string} emoji  until it's drawn
 * @property {string} line  what it was won for, said to the child
 */

/**
 * For each chapter, by its id: the treasure's name, an emoji, and what the
 * chapter taught, as "You can..." to the child who finished it.
 * @type {Record<string, [string, string, string]>}
 */
const BY_CHAPTER = {
  "0-counting": ["Counting Crown", "👑", "You can count things, touching each one once."],
  "0-next": ["Pattern Beads", "📿", "You can find what comes next."],
  "0-shapes": ["Shape Shield", "🛡️", "You can name flat shapes and solid shapes."],
  "0-more": ["Big and Little Bells", "🔔", "You can tell which has more, and which is longer."],
  "0-adding": ["Jar of Joined Jewels", "🫙", "You can put two groups together and count them all."],
  "0-taking": ["Take-Away Scoop", "🐚", "You can take some away and count what's left."],
  "0-pairs": ["Make-Ten Board", "🔟", "You can split a number in two, and make 10."],
  "0-teens": ["Teen Tower", "🪙", "You know a teen number is 10 and some more."],
  "1-facts": ["Plus and Minus Medal", "🏅", "You can add and take away within 20."],
  "1-stories": ["Story Scroll", "📜", "You can tell if a story puts together or takes away."],
  "1-missing": ["Even Scales", "⚖️", "You know the equal sign means both sides are the same."],
  "1-tens": ["Bundle of Ten Wands", "🪄", "You can make numbers from tens and ones."],
  "1-to-120": ["Tower of Tens", "🗼", "You can count to 120, and find ten more."],
  "1-time": ["Hour Watch", "⏱️", "You can measure, and tell the hour on a clock."],
  "1-graphs": ["Picture-Graph Banner", "🚩", "You can read a picture graph."],
  "1-shares": ["Fair-Share Shield", "🛡️", "You can cut shapes into halves and fourths."],
  "2-to-100": ["Trading Purse", "👛", "You can add and subtract to 100, trading ten ones for a ten."],
  "2-stories": ["Clue-Finder Glass", "🔍", "You can work out what a story asks."],
  "2-to-1000": ["Hundreds Blocks", "🧊", "You know what each digit is worth, up to 1000."],
  "2-lines": ["Ruler Sword", "🗡️", "You can measure with a ruler and use a number line."],
  "2-bigger": ["Three-Lock Chest", "🧰", "You can add bigger numbers one place at a time."],
  "2-groups": ["Twin Pouches", "👝", "You can count equal groups, and tell odd from even."],
  "2-money": ["Silver Piggy Bank", "🐷", "You can count money and read bar graphs."],
  "2-time": ["Quarter-Past Clock", "⏰", "You can tell time to five minutes."],
  "3-groups": ["Golden Egg Box", "🥚", "You can multiply by counting equal groups."],
  "3-sharing": ["Sharing Platter", "🍽️", "You can share things out equally by dividing."],
  "3-measures": ["Golden Stopwatch", "⏱️", "You can tell time to the minute, and round to the nearest ten."],
  "3-two-step": ["Two-Key Lock", "🔐", "You can solve stories that take two steps."],
  "3-area": ["Square-Tile Shield", "🔲", "You can find area by counting rows of squares."],
  "3-fractions": ["Fraction Pendant", "🥧", "You know a fraction is equal parts of a whole."],
  "3-graphs": ["Bar-Graph Trophy", "📊", "You can read graphs with a key and a scale."],
  "3-perimeter": ["Fence-Around Frame", "🖼️", "You can find the distance all the way around a shape."],
  "4-place": ["Crystal Abacus", "🧮", "You know each place is worth ten times the one to its right."],
  "4-measures": ["Measuring Jug", "🫗", "You can change between units, like feet and inches."],
  "4-multiply": ["Many-Gem Mirror", "🪞", "You can multiply bigger numbers by splitting them up."],
  "4-divide": ["Leftover Jars", "🫙", "You can divide, and find what's left over."],
  "4-angles": ["Right-Angle Compass", "📐", "You can measure angles in degrees."],
  "4-fractions": ["Fraction Bottles", "🧪", "You can compare fractions, and add ones with the same bottom."],
  "4-decimals": ["Tenths Bracelet", "📿", "You can write tenths and hundredths as decimals."],
  "4-area": ["Crystal Window", "🪟", "You can find a rectangle's area and perimeter."],
  "5-decimals": ["Decimal Spoons", "🥄", "You can read decimals to the thousandths."],
  "5-multiply": ["Starry Hat", "🎩", "You can multiply and divide big numbers."],
  "5-expressions": ["Parentheses Bangle", "💫", "You know to work out what's in parentheses first."],
  "5-fractions": ["Sixths Star Box", "⭐", "You can add fractions with different bottoms."],
  "5-stories": ["Shared Moon Cakes", "🥮", "You know a fraction can be a sharing story."],
  "5-units": ["Star Tape Measure", "📏", "You can change units, like centimeters to meters."],
  "5-volume": ["Cube-Filled Box", "📦", "You can find volume: length times width times height."],
  "5-coordinates": ["Star Map", "🗺️", "You can find a point by going across, then up."],
  "6-ratios": ["Ratio Bowls", "🥣", "You can compare two amounts with a ratio."],
  "6-dividing": ["Quarter Cups", "🥛", "You can divide by fractions and decimals."],
  "6-factors": ["Turning Gears", "⚙️", "You can find common factors and multiples."],
  "6-negatives": ["Frost Thermometer", "🌡️", "You can use numbers below zero."],
  "6-expressions": ["Mystery Box", "🎁", "You know a letter can stand for a number."],
  "6-equations": ["Jade Balance", "⚖️", "You can solve an equation by undoing what's done to x."],
  "6-area": ["Unfolded Box", "📦", "You can find the area of triangles and the outside of boxes."],
  "6-statistics": ["Row of Pillars", "🏛️", "You can find the mean, the median and the range."],
};

/** For each grade: its own treasure, for finishing every chapter. */
const BY_GRADE = {
  0: ["Kindergarten Star", "⭐", "kindergarten"],
  1: ["First Grade Trophy", "🏆", "1st grade"],
  2: ["Silver Crown", "👑", "2nd grade"],
  3: ["Golden Goblet", "🏆", "3rd grade"],
  4: ["Crystal Crown", "👑", "4th grade"],
  5: ["Star Scepter", "🌟", "5th grade"],
  6: ["Jade Crown", "👑", "6th grade"],
};

/**
 * The treasure for finishing a chapter.
 * @param {number} grade
 * @param {number} chapter  from 0
 * @returns {ChapterTreasure}
 */
export function chapterTreasure(grade, chapter) {
  const { id } = ADVENTURES[grade][chapter];
  const [name, emoji, line] = BY_CHAPTER[id];
  return { id: `chapter-${id}`, grade, chapter, name, emoji, line };
}

/**
 * A grade's own treasure, for finishing every chapter of it.
 * @param {number} grade
 * @returns {ChapterTreasure}
 */
export function gradeTreasure(grade) {
  const [name, emoji, words] = BY_GRADE[/** @type {keyof typeof BY_GRADE} */ (grade)];
  return { id: `grade-${grade}`, grade, chapter: null, name, emoji, line: `You finished every chapter of the ${words} adventure!` };
}

/** The id of a chapter's boss level, whose first win brings the chapter's treasure. */
const bossOf = (/** @type {string} */ chapterId) => `${chapterId}.5`;

/**
 * The chapter and grade treasures a grade's progress has won, in the
 * adventure's order, the grade's own last.
 * @param {number} grade
 * @param {AdventureProgress | undefined} progress
 * @returns {ChapterTreasure[]}
 */
export function treasuresWon(grade, progress) {
  if (!progress) return [];
  const chapters = ADVENTURES[grade];
  const won = chapters.map((c, i) => (progress.done[bossOf(c.id)] ? chapterTreasure(grade, i) : null)).filter(t => t !== null);
  return won.length === chapters.length ? [...won, gradeTreasure(grade)] : won;
}

/**
 * The treasures a level's win brought that weren't won before: a chapter's,
 * the first time its boss is beaten, and the grade's, with its last chapter.
 * @param {number} grade
 * @param {AdventureProgress | undefined} before
 * @param {AdventureProgress} after
 */
export function newlyWon(grade, before, after) {
  const had = new Set(treasuresWon(grade, before).map(t => t.id));
  return treasuresWon(grade, after).filter(t => !had.has(t.id));
}

/** Days since a kind was last met, at least, for getting it right to show it stuck. */
export const STUCK_AFTER = 3;

/**
 * How many days ago a kind was last met, if getting it right now shows it
 * stuck: it was met a few times and was going well (so it was learned, not
 * guessed), and hasn't come up for at least STUCK_AFTER days. Otherwise null.
 * @param {TypeMastery | undefined} m  as it was before this battle
 * @param {number} today  dayNumber
 */
export function stuckAfter(m, today) {
  if (!m || m.seen < 3 || m.score < 0.5 || m.day === undefined) return null;
  const days = today - m.day;
  return days >= STUCK_AFTER ? days : null;
}

/**
 * A keepsake not yet had, or null once every one is.
 * @param {Rng} rng
 * @param {readonly string[]} have  ids
 * @returns {Keepsake | null}
 */
export function pickKeepsake(rng, have) {
  const owned = new Set(have);
  const fresh = KEEPSAKES.filter(k => !owned.has(k.id));
  return fresh.length > 0 ? rng.pick(fresh) : null;
}
