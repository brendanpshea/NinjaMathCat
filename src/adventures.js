// A grade's adventure: its chapters in the order a school year usually takes
// them, each a topic in one setting, and each split into levels short enough
// to finish in a few minutes. Progress is kept level by level, so a class can
// stop anywhere and pick up next time.
//
// A chapter brings in a topic gently: its first level asks the easiest
// questions of it, the next two harder ones, then a review mixes it with the
// chapters before, and a boss asks everything so far. Each level also keeps
// up some review of earlier chapters, most of it on what the player finds
// hardest or hasn't practised lately, and pitches each kind of question by
// how well the player knows it (src/mastery.js).

import { CURRICULUM, pickQuestion } from "./curriculum.js";
import { MONSTERS } from "./monsters.js";
import { createRng } from "./rng.js";
import { need, steer, dueToday, canType } from "./mastery.js";

/** @import { Mix } from "./curriculum.js" */
/** @import { Question } from "./questions/common.js" */
/** @import { Mastery } from "./mastery.js" */
/** @import { Monster } from "./monsters.js" */
/** @import { Tally } from "./battle.js" */

/**
 * @typedef {object} Chapter
 * @property {string} id  stable, since progress is saved by it
 * @property {string} title
 * @property {string} note  what to know before starting, for a child to read
 * @property {number} at  the point in the year its questions are pitched at, such as 3 or 3.5
 * @property {string[]} learn  the question types it brings in or builds up
 * @property {string[]} [warmup]  types from earlier grades it keeps up
 * @property {string} setting  where it happens: a different setting for each chapter of a grade, suited to its topic where one is
 * @property {Record<string, string>} [focus]  for a type it brings in, one of the type's focuses, to ask something narrower than the grade does
 */

/** @type {Record<number, Chapter[]>} */
export const ADVENTURES = {
  0: [
    { id: "0-counting", setting: "meadow", title: "Counting", at: 0, learn: ["counting"], note: "Touch each thing once as you count. The last number you say tells how many there are." },
    { id: "0-next", setting: "attic", title: "What comes next", at: 0, learn: ["sequence", "patterns", "skip_counting"], note: "Numbers always come in the same order, and a pattern repeats the same way again and again. Say them to find what comes next." },
    { id: "0-shapes", setting: "kitchen", title: "Shapes", at: 0, learn: ["shapes"], note: "Flat shapes lie flat on paper: count their sides and corners to name them. Solid shapes, like a ball or a block, you can pick up. Words like above, below and behind say where things are." },
    { id: "0-more", setting: "farm", title: "More and fewer, longer and shorter", at: 0, learn: ["comparison", "measuring"], note: "When you count, the number you say later is the bigger one. To see which is longer, line things up at one end." },
    { id: "0-adding", setting: "candy", title: "Adding", at: 0, learn: ["addition", "word_addition"], note: "Adding puts groups together. Count them all to find how many there are now." },
    { id: "0-taking", setting: "seaside", title: "Taking away", at: 0, learn: ["subtraction", "word_subtraction"], note: "Taking away makes a group smaller. Count what is left." },
    { id: "0-pairs", setting: "mushrooms", title: "Number pairs and making 10", at: 0, learn: ["number_pairs"], note: "A number can be split into two parts: 7 is 4 and 3. To make 10, count the empty spaces in a ten frame." },
    { id: "0-teens", setting: "hilltop", title: "Teen numbers", at: 0.5, learn: ["tens_and_ones"], note: "Teen numbers are 10 and some more. 14 is 10 and 4 more." },
  ],
  1: [
    { id: "1-facts", setting: "meadow", title: "Adding and taking away", at: 1, learn: ["addition", "subtraction", "number_line"], warmup: ["sequence", "comparison"], note: "Count on from the bigger number to add, and count back to take away. A fact you know helps: 5 + 5 is 10, so 5 + 6 is 11." },
    { id: "1-stories", setting: "farm", title: "Number stories", at: 1, learn: ["word_addition", "word_subtraction"], note: "Read the story and ask: are things being put together, or taken away? Then add or subtract." },
    { id: "1-missing", setting: "attic", title: "Missing numbers and the equal sign", at: 1, learn: ["missing_number", "equal_sign", "number_pairs"], note: "The equal sign means both sides are worth the same: 8 + 2 = 10 and 10 = 8 + 2 are both true." },
    { id: "1-tens", setting: "seaside", title: "Tens and ones", at: 1, learn: ["tens_and_ones"], note: "Tens and ones build every number. 34 is 3 tens and 4 ones." },
    { id: "1-to-120", setting: "hilltop", title: "Counting to 120, and ten more", at: 1.5, learn: ["sequence", "comparison", "skip_counting", "tens_and_ones", "placing"], warmup: ["patterns"], note: "Ten more than 34 is 44: only the tens change. Counting by tens is the quick way up to 120." },
    { id: "1-time", setting: "clocktower", title: "Measuring and telling time", at: 1, learn: ["measuring", "time"], note: "Measure with cubes laid end to end, with no gaps. On a clock, the short hand points to the hour." },
    { id: "1-graphs", setting: "kitchen", title: "Picture graphs", at: 1.5, learn: ["picture_graph"], note: "Each picture stands for something that was counted. Count the pictures in a row to find how many." },
    { id: "1-shares", setting: "candy", title: "Shapes and equal shares", at: 1.5, learn: ["shapes", "fractions"], note: "A shape cut into equal parts can be shared fairly. Two equal parts are halves; four are fourths." },
  ],
  2: [
    { id: "2-to-100", setting: "meadow", title: "Adding and subtracting to 100", at: 2, learn: ["addition", "subtraction"], warmup: ["missing_number", "equal_sign"], note: "Add the tens, then the ones. If the ones make 10 or more, trade 10 ones for a ten." },
    { id: "2-stories", setting: "farm", title: "Number stories", at: 2, learn: ["word_addition", "word_subtraction"], note: "What do you know, and what do you need to find? Then decide whether to add or subtract." },
    { id: "2-to-1000", setting: "library", title: "Numbers to 1000", at: 2, learn: ["tens_and_ones", "comparison", "skip_counting"], note: "In 352, the 3 means 3 hundreds, the 5 means 5 tens and the 2 means 2 ones: 300 + 50 + 2." },
    { id: "2-lines", setting: "hilltop", title: "Rulers and number lines", at: 2, learn: ["measuring", "number_line", "placing"], note: "A ruler is a number line. Line the start of a thing up with 0, then read the number at its end." },
    { id: "2-bigger", setting: "kitchen", title: "Bigger sums", at: 2.5, learn: ["addition", "subtraction", "tens_and_ones"], note: "Line up the hundreds, tens and ones, and work one place at a time. Adding 10 or 100 changes just one digit." },
    { id: "2-groups", setting: "mushrooms", title: "Equal groups, odd and even", at: 2.5, learn: ["word_multiplication", "multiplication", "odd_even"], note: "Equal groups have the same number in each: 3 groups of 4 is 12. An even number splits into two equal groups." },
    { id: "2-money", setting: "seaside", title: "Money and graphs", at: 2.5, learn: ["money", "picture_graph", "bar_graph", "line_plot"], note: "A bar graph shows how many by how tall each bar is. Read across from the top of a bar to the numbers." },
    { id: "2-time", setting: "clocktower", title: "Time, shapes and fractions", at: 2.5, learn: ["time", "shapes", "fractions"], note: "The long hand counts minutes by fives. When it points at the 3, it is 15 minutes past the hour." },
  ],
  3: [
    { id: "3-groups", setting: "candy", title: "Equal groups", at: 3, learn: ["multiplication", "word_multiplication"], focus: { multiplication: "easy" }, warmup: ["addition", "subtraction", "skip_counting"], note: "Multiplying counts equal groups quickly. 4 × 5 means 4 groups of 5: count by 5s to get 5, 10, 15, 20." },
    { id: "3-sharing", setting: "kitchen", title: "Sharing equally", at: 3, learn: ["division", "word_division", "missing_number"], focus: { division: "easy" }, note: "Dividing shares things into equal groups. To find 20 ÷ 4, ask: 4 times what makes 20?" },
    { id: "3-measures", setting: "clocktower", title: "Time, measures and rounding", at: 3, learn: ["time", "conversions", "rounding"], warmup: ["number_line", "money"], note: "To round to the nearest ten, find the two tens a number sits between and see which is closer. Halfway rounds up." },
    { id: "3-two-step", setting: "farm", title: "Harder facts, patterns and two-step stories", at: 3.5, learn: ["multiplication", "division", "word_two_step", "odd_even"], focus: { multiplication: "harder", division: "harder" }, warmup: ["word_addition", "word_subtraction", "comparison"], note: "Some stories take two steps. Find the first answer, then use it to find the second. Patterns help with facts: 4 times any number is always even." },
    { id: "3-area", setting: "attic", title: "Area", at: 3, learn: ["area"], focus: { area: "area" }, note: "Area is how many squares cover a shape. For a rectangle, count the squares in one row, then multiply by the number of rows." },
    { id: "3-fractions", setting: "swamp", title: "Fractions", at: 3.5, learn: ["fractions", "fraction_line", "fraction_compare", "placing"], note: "A fraction is equal parts of a whole. 3/4 means the whole is cut into 4 equal parts, and we have 3 of them." },
    { id: "3-graphs", setting: "library", title: "Graphs and line plots", at: 3.5, learn: ["picture_graph", "bar_graph", "line_plot"], note: "Read a graph's key and scale first. One picture, or one step up the scale, can stand for more than one." },
    { id: "3-perimeter", setting: "castle", title: "Shapes and perimeter", at: 3.5, learn: ["shapes", "area"], note: "Perimeter is the distance all the way around a shape. Add up the lengths of all its sides." },
  ],
  4: [
    { id: "4-place", setting: "library", title: "Place value", at: 4, learn: ["place_value", "rounding", "comparison"], warmup: ["addition", "subtraction", "skip_counting"], note: "Each place is worth ten times the place to its right. In 4,382, the 4 is worth 4,000." },
    { id: "4-measures", setting: "clocktower", title: "Measuring and converting", at: 4, learn: ["conversions", "time", "money"], note: "A bigger unit holds many smaller ones: 1 foot is 12 inches. To change to the smaller unit, multiply." },
    { id: "4-multiply", setting: "farm", title: "Multiplying bigger numbers", at: 4, learn: ["multiplication", "word_multiplication", "factors"], warmup: ["missing_number"], note: "Split a number into tens and ones, multiply each part, and add: 6 × 23 is 6 × 20 plus 6 × 3." },
    { id: "4-divide", setting: "seaside", title: "Dividing and remainders", at: 4, learn: ["division", "word_division", "word_two_step"], warmup: ["word_addition", "word_subtraction"], note: "When things don't share out evenly, what is left over is the remainder. It is always less than the number you divide by." },
    { id: "4-angles", setting: "observatory", title: "Angles and shapes", at: 4.5, learn: ["angles", "shapes"], note: "Angles are measured in degrees. A square corner, a right angle, is 90 degrees, and a full turn is 360." },
    { id: "4-fractions", setting: "kitchen", title: "Fractions", at: 4.5, learn: ["fraction_compare", "fraction_arithmetic"], warmup: ["placing"], focus: { fraction_arithmetic: "adding" }, note: "To add fractions with the same bottom number, add the tops and keep the bottom: 2/8 + 3/8 = 5/8." },
    { id: "4-decimals", setting: "frozen", title: "Fraction stories and decimals", at: 4.5, learn: ["fraction_stories", "decimals"], note: "Decimals are another way to write tenths and hundredths: 0.3 is 3/10, and 0.25 is 25/100." },
    { id: "4-area", setting: "castle", title: "Area, perimeter and line plots", at: 4.5, learn: ["area", "line_plot"], note: "A rectangle's area is its length times its width. Its perimeter is two lengths and two widths added up." },
  ],
  5: [
    { id: "5-decimals", setting: "library", title: "Decimals and place value", at: 5, learn: ["place_value", "decimals", "rounding"], focus: { decimals: "place value" }, note: "After the decimal point come tenths, hundredths and thousandths. Each place is worth a tenth of the place to its left." },
    { id: "5-multiply", setting: "mushrooms", title: "Multiplying and dividing", at: 5, learn: ["multiplication", "division"], note: "Multiply big numbers one place at a time and add the parts. Check a division by multiplying back." },
    { id: "5-expressions", setting: "clocktower", title: "Expressions", at: 5, learn: ["expressions"], note: "Work out what is in parentheses first, then multiply and divide, then add and subtract." },
    { id: "5-fractions", setting: "candy", title: "Adding fractions", at: 5, learn: ["fraction_arithmetic"], warmup: ["placing"], focus: { fraction_arithmetic: "adding" }, note: "To add fractions with different bottoms, make the bottoms the same first: 1/2 + 1/3 is 3/6 + 2/6, which is 5/6." },
    { id: "5-stories", setting: "seaside", title: "Fraction stories", at: 5.5, learn: ["fraction_stories"], note: "A fraction is a division too: 3 pizzas shared by 4 friends is 3/4 of a pizza each." },
    { id: "5-units", setting: "frozen", title: "Units and line plots", at: 5.5, learn: ["conversions", "line_plot"], note: "To change to a bigger unit, divide: 250 centimeters is 2.5 meters." },
    { id: "5-volume", setting: "temple", title: "Volume", at: 5.5, learn: ["volume", "area"], note: "Volume is how many cubes fill a box: its length times its width times its height." },
    { id: "5-coordinates", setting: "observatory", title: "The coordinate plane", at: 5.5, learn: ["coordinates", "shapes"], note: "A point's first number says how far across to go, and the second how far up." },
  ],
  6: [
    { id: "6-ratios", setting: "kitchen", title: "Ratios and rates", at: 6, learn: ["ratios"], note: "A ratio compares two amounts. With 2 cats for every 3 dogs, the ratio of cats to dogs is 2:3." },
    { id: "6-dividing", setting: "library", title: "Dividing fractions and decimals", at: 6, learn: ["fraction_arithmetic", "decimals", "division"], focus: { fraction_arithmetic: "dividing", decimals: "dividing" }, note: "To divide by a fraction, ask how many of it fit. 2 ÷ 1/4 is 8, because eight quarters make 2." },
    { id: "6-factors", setting: "castle", title: "Factors and multiples", at: 6, learn: ["common_factors"], note: "The greatest common factor is the biggest number that divides both. The least common multiple is the smallest number both divide into." },
    { id: "6-negatives", setting: "frozen", title: "Negative numbers", at: 6.5, learn: ["integers", "coordinates", "placing"], note: "Numbers below zero are negative. −3 is 3 steps to the left of 0 on a number line, so it is less than −1." },
    { id: "6-expressions", setting: "clocktower", title: "Expressions with letters", at: 6.5, learn: ["expressions"], note: "A letter stands for a number. 3n means 3 times n, so when n is 4, 3n is 12." },
    { id: "6-equations", setting: "swamp", title: "Equations", at: 6.5, learn: ["equations"], note: "To solve an equation, undo what is done to x. If x + 5 = 12, then x = 12 − 5." },
    { id: "6-area", setting: "temple", title: "Area and volume", at: 6.5, learn: ["area", "volume"], note: "A triangle's area is half of its base times its height. A box's surface area is the areas of its six faces added up." },
    { id: "6-statistics", setting: "peak", title: "Statistics", at: 6.5, learn: ["statistics", "data_displays"], note: "The mean shares everything out evenly, the median is the middle value, and the range is the highest take away the lowest." },
  ],
};

/** The grades with an adventure, in order. */
export const ADVENTURE_GRADES = Object.keys(ADVENTURES).map(Number).sort((a, b) => a - b);

/**
 * @typedef {"learn" | "practice" | "review" | "boss"} LevelKind
 */

/**
 * The levels of every chapter, in order: one to bring the topic in, two to
 * practise it, one to review it with what came before, and a boss.
 * @type {readonly LevelKind[]}
 */
const STEPS = ["learn", "practice", "practice", "review", "boss"];

/**
 * How each kind of level mixes the chapter's topic with review of earlier
 * ones, and how hard its new questions may be. Fights are short: each
 * monster is a little less tough than in a quick battle, so a level is about
 * eight questions, and a boss about ten. Which residents of the setting it fights, as places in the
 * setting's list from weakest to toughest, how far above the hero each
 * fights, and how tough each is.
 * @type {Record<LevelKind, { fresh: number, most: number, foes: number[], pitch: number[], toughness: number[] }>}
 */
const LEVEL_PLANS = {
  learn: { fresh: 0.7, most: 1, foes: [0, 1], pitch: [0, 0], toughness: [0.9, 0.9] },
  practice: { fresh: 0.6, most: 2, foes: [1, 2], pitch: [0, 0], toughness: [0.9, 0.9] },
  review: { fresh: 0.4, most: 3, foes: [0, 2], pitch: [0, 1], toughness: [0.9, 0.9] },
  boss: { fresh: 0.5, most: 3, foes: [2], pitch: [2], toughness: [1.8] },
};

/**
 * @typedef {object} Level
 * @property {string} id  the chapter's id and its step, such as "3-area.2"
 * @property {number} grade
 * @property {number} chapter  where its chapter comes in the grade, from 0
 * @property {number} step  where it comes in its chapter, from 1
 * @property {number} number  where it comes in the grade, from 1
 * @property {LevelKind} kind
 */

/**
 * A grade's chapters.
 * @param {number} grade  a whole grade, 0 for kindergarten
 * @returns {readonly Chapter[]}
 */
export function chaptersFor(grade) {
  const chapters = ADVENTURES[grade];
  if (!chapters) throw new RangeError(`No adventure for grade ${grade}`);
  return chapters;
}

/**
 * The setting a chapter happens in.
 * @param {number} grade
 * @param {number} chapter
 */
export function settingFor(grade, chapter) {
  return chaptersFor(grade)[chapter].setting;
}

/**
 * Every level of a grade's adventure, in order.
 * @param {number} grade
 * @returns {Level[]}
 */
export function levelsFor(grade) {
  return chaptersFor(grade).flatMap((chapter, c) => STEPS.map((kind, s) => ({
    id: `${chapter.id}.${s + 1}`,
    grade,
    chapter: c,
    step: s + 1,
    number: c * STEPS.length + s + 1,
    kind,
  })));
}

/**
 * What a level is called: "Level 7: Practice".
 * @param {Level} level
 */
export function levelName(level) {
  const kind = { learn: "New topic", practice: "Practice", review: "Review", boss: "Boss" }[level.kind];
  return `Level ${level.number}: ${kind}`;
}

/**
 * The grade to pitch a type at, as near as it allows to the point in the year.
 * @param {string} type
 * @param {number} at
 */
export function pitchFor(type, at) {
  const row = CURRICULUM.find(r => r.type.id === type);
  if (!row) throw new RangeError(`No question type "${type}"`);
  return Math.min(row.to, Math.max(row.from, at));
}

/**
 * A worked example for a chapter's note: an easy question of the first type
 * it brings in, the same every time, and not one whose answer is 0 or 1,
 * which would show too little. Where every easy one would (taking away
 * within 5 starts from 1 or 2), a harder one.
 * @param {Chapter} chapter
 * @returns {Question}
 */
export function exampleFor(chapter) {
  const type = chapter.learn[0];
  const focus = chapter.focus?.[type];
  let seed = 7;
  for (const c of chapter.id) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  /** @type {Question | undefined} */
  let example;
  for (const most of [1, 2, 3]) {
    const mix = [{ type, grade: pitchFor(type, chapter.at), weight: 1, most, ...(focus ? { focus } : {}) }];
    for (let k = 0; k < 10; k++) {
      example = pickQuestion(createRng(seed + k), mix);
      if (!["0", "1"].includes(String(example.answer))) return example;
    }
  }
  return /** @type {Question} */ (example);
}

/**
 * The monsters who live in a setting, weakest first.
 * @param {string} setting
 * @returns {Monster[]}
 */
export function residents(setting) {
  return MONSTERS.filter(m => m.setting === setting).sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id));
}

/**
 * A part of a mix for one kind of question, pitched for this player: easier,
 * and from earlier in the year, while it's shaky; harder once it's strong.
 * @param {string} type
 * @param {number} at  the point in the year
 * @param {number} weight
 * @param {number} most  the hardest the level asks for
 * @param {Mastery} mastery
 * @param {string} [focus]  one of the type's focuses
 * @returns {Mix[number]}
 */
function pitched(type, at, weight, most, mastery, focus) {
  const s = steer(mastery[type]);
  const hardest = Math.min(most, s.most);
  return {
    type, grade: pitchFor(type, s.earlier ? at - 0.5 : at), weight, most: hardest, least: Math.min(s.least, hardest),
    ...(focus ? { focus } : {}),
    // Known well, its whole-number answers are typed in.
    ...(canType(mastery[type], at) ? { typed: true } : {}),
  };
}

/** The least share of review a kind gets, against the most needed, so none drops out of sight. */
const LEAST_NEED = 0.25;

/**
 * Everything needed to play a level: the questions to ask, and the monsters
 * to fight and how tough each is. Without a player's mastery, review is
 * spread evenly and every kind pitched as the level asks.
 * @param {Level} level
 * @param {Mastery} [mastery]
 * @param {number} [now]  battles the player has played
 * @param {{ today?: number, warmUp?: boolean }} [when]  today: the day it is (dayNumber), so review
 *   is spaced over days; warmUp: the first level of a sitting, which opens with what is most due
 *   from earlier chapters, before anything else
 * @returns {{ mix: Mix, adventure: Monster[], pitch: number[], toughness: number[], opening: string[], warmUp: string[] }}
 */
export function planLevel(level, mastery = {}, now = 0, { today, warmUp = false } = {}) {
  const chapters = chaptersFor(level.grade);
  const chapter = chapters[level.chapter];
  const plan = LEVEL_PLANS[level.kind];
  const fresh = [...new Set(chapter.learn)];
  // Review: what earlier chapters brought in or kept up, and this one's warm-ups.
  const earlier = [...new Set([
    ...chapters.slice(0, level.chapter).flatMap(c => [...c.learn, ...(c.warmup ?? [])]),
    ...(chapter.warmup ?? []),
  ])].filter(type => !fresh.includes(type));
  const freshShare = earlier.length === 0 ? 1 : plan.fresh;
  // Review goes where it is needed most.
  const needs = earlier.map(type => Math.max(LEAST_NEED, need(mastery[type], now, today)));
  // A warm-up: two kinds from earlier chapters, the most due, asked first.
  const warm = warmUp && today !== undefined && freshShare < 1 ? dueToday(mastery, earlier, today, WARM_UP) : [];
  const allNeed = needs.reduce((a, b) => a + b, 0);
  /** @type {Mix} */
  const mix = [
    ...fresh.map(type => pitched(type, chapter.at, freshShare / fresh.length, plan.most, mastery, chapter.focus?.[type])),
    ...earlier.map((type, i) => pitched(type, chapter.at, ((1 - freshShare) * needs[i]) / allNeed, 3, mastery)),
  ];
  const who = residents(settingFor(level.grade, level.chapter));
  if (who.length < 3) throw new RangeError(`The setting for ${chapter.id} needs three residents`);
  return {
    mix,
    adventure: plan.foes.map(i => who[i]),
    pitch: plan.pitch,
    toughness: plan.toughness,
    // A learn level brings in each of the chapter's topics before anything else, after any warm-up.
    opening: [...warm, ...(level.kind === "learn" ? fresh : [])],
    warmUp: warm,
  };
}

/** How many kinds from earlier chapters a sitting's first level warms up with. */
export const WARM_UP = 2;

/** How many kinds of question a training level works on. */
export const TRAINING_KINDS = 4;

/**
 * A training level: review of the kinds that need it most, out of those met
 * in the adventure so far, at the point in the year reached. It doesn't count
 * on the map, but earns experience and treasure like any battle. Before
 * anything has been met, it practises the chapter being played.
 * @param {number} grade
 * @param {AdventureProgress} progress
 * @param {Mastery} mastery
 * @param {number} now  battles the player has played
 * @param {number} [today]  the day it is (dayNumber), so review is spaced over days
 * @returns {{ mix: Mix, adventure: Monster[], pitch: number[], toughness: number[], kinds: string[] }}
 */
export function planTraining(grade, progress, mastery, now, today) {
  const chapters = chaptersFor(grade);
  const levels = levelsFor(grade);
  const reached = (nextLevel(levels, progress) ?? levels[levels.length - 1]).chapter;
  const chapter = chapters[reached];
  const reachedKinds = [...new Set(chapters.slice(0, reached + 1).flatMap(c => [...c.learn, ...(c.warmup ?? [])]))];
  const met = reachedKinds.filter(type => (mastery[type]?.seen ?? 0) > 0);
  const pool = met.length > 0 ? met : [...new Set(chapter.learn)];
  const kinds = pool
    .map((type, i) => ({ type, i, need: Math.max(LEAST_NEED, need(mastery[type], now, today)) }))
    .sort((a, b) => b.need - a.need || a.i - b.i)
    .slice(0, TRAINING_KINDS);
  const allNeed = kinds.reduce((sum, k) => sum + k.need, 0);
  const who = residents(settingFor(grade, reached));
  return {
    mix: kinds.map(k => pitched(k.type, chapter.at, k.need / allNeed, 3, mastery)),
    adventure: [who[0], who[1]],
    pitch: [0, 0],
    toughness: [0.9, 0.9],
    kinds: kinds.map(k => k.type),
  };
}

/**
 * @typedef {object} LevelResult
 * @property {number} stars  1 to 3
 * @property {number} firstTry  questions right the first time
 * @property {number} asked
 */

/**
 * A player's progress through one grade's adventure.
 * @typedef {object} AdventureProgress
 * @property {Record<string, LevelResult>} done  the best result for each level finished, by level id
 * @property {number} opened  the furthest chapter a grown-up has opened ahead of time; 0 when none
 */

/** @returns {AdventureProgress} */
export function newProgress() {
  return { done: {}, opened: 0 };
}

/**
 * Stars for a level: three for nine in ten right the first time, two for
 * seven in ten, and one for finishing.
 * @param {number} firstTry
 * @param {number} asked
 */
export function starsFor(firstTry, asked) {
  const share = asked === 0 ? 0 : firstTry / asked;
  return share >= 0.9 ? 3 : share >= 0.7 ? 2 : 1;
}

/**
 * Progress with a level finished, keeping the better of this and any earlier try.
 * @param {AdventureProgress} progress
 * @param {Level} level
 * @param {Tally} tally
 * @returns {AdventureProgress}
 */
export function recordLevel(progress, level, tally) {
  const asked = tally.firstTry + tally.secondTry + tally.missed;
  const result = { stars: starsFor(tally.firstTry, asked), firstTry: tally.firstTry, asked };
  const before = progress.done[level.id];
  const better = !before || result.stars > before.stars || (result.stars === before.stars && result.firstTry / Math.max(1, asked) > before.firstTry / Math.max(1, before.asked));
  return better ? { ...progress, done: { ...progress.done, [level.id]: result } } : progress;
}

/**
 * Which levels can be played: the first; any after one that's done; and, in
 * chapters a grown-up has opened ahead, every level before and the first of
 * that chapter.
 * @param {readonly Level[]} levels
 * @param {AdventureProgress} progress
 * @returns {("done" | "open" | "locked")[]}
 */
export function levelStates(levels, progress) {
  return levels.map((level, i) => {
    if (progress.done[level.id]) return "done";
    const open = i === 0
      || Boolean(progress.done[levels[i - 1].id])
      || level.chapter < progress.opened
      || (level.chapter === progress.opened && level.step === 1);
    return open ? "open" : "locked";
  });
}

/**
 * The level to play next: the first open one not yet done, from the chapter a
 * grown-up opened if there is one there; null once all are done.
 * @param {readonly Level[]} levels
 * @param {AdventureProgress} progress
 */
export function nextLevel(levels, progress) {
  const states = levelStates(levels, progress);
  const open = levels.filter((_, i) => states[i] === "open");
  return open.find(level => level.chapter >= progress.opened) ?? open[0] ?? null;
}

/**
 * Progress with a chapter, and everything before it, opened ahead of time.
 * @param {AdventureProgress} progress
 * @param {number} chapter
 * @returns {AdventureProgress}
 */
export function openChapter(progress, chapter) {
  return { ...progress, opened: Math.max(progress.opened, chapter) };
}
