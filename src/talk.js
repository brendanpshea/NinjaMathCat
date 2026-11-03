// Something for a grown-up to talk about with a child after a level, on a
// topic the level asked: a question to ask, or a thing to do together. Math
// talk at home helps children's math, even a few minutes a week, and most of
// all when the grown-up isn't sure of math themselves (Berkowitz et al.,
// Science, 2015). So each one is everyday and easy, and needs no math from
// the grown-up: the child does the explaining.

/** @import { Rng } from "./rng.js" */

/** For each kind of question, a few things to talk about. */
export const TALK = {
  counting: ["Count something together: the stairs, the spoons, the cars going by. Touch each one as you count.", "Ask: if we count these again in a different order, will we get the same number?"],
  measuring: ["Line up two things, like two shoes or two spoons. Ask: which is longer? How can you tell?", "Ask: how many of your hands long is the table?"],
  sequence: ["Count up together, then back down. Ask: what comes just before 10? Just after 19?"],
  skip_counting: ["Count by 2s, 5s or 10s together as you walk, one count for each step."],
  comparison: ["Ask: which is more, 8 or 5? How do you know?", "Take two handfuls of something. Ask: which has more? How could you check?"],
  patterns: ["Make a pattern together with spoons and forks, or claps and stamps. Ask: what comes next?"],
  number_pairs: ["Hold up 10 fingers and fold some down. Ask: how many are up, and how many are down?"],
  tens_and_ones: ["Ask: in 43, what does the 4 mean? (It means four tens: forty.)", "Bundle 10 straws or sticks together. Ask: how many bundles and how many left over make 23?"],
  equal_sign: ["Ask: does 4 + 3 = 5 + 2 make sense? Why?"],
  odd_even: ["Ask: can you share 7 crackers between two people fairly? What about 8?"],
  shapes: ["Go on a shape hunt. Ask: how many corners does that window have? Is the clock a circle?"],
  addition: ["Ask: how did you add them? Did you count on, make a ten, or something else?", "Ask: what's another way to work out 8 + 7?"],
  subtraction: ["Ask: how did you take them away? Is there another way, like counting up?", "Ask: if you have 12 and eat 5, how many are left? How did you know?"],
  missing_number: ["Ask: I'm thinking of a number. If I add 4, I get 10. What's my number?"],
  word_addition: ["Make up a story problem together about something that happened today. Ask: will the answer be more or less?"],
  word_subtraction: ["Make up a taking-away story together. Ask: how many are left, and how do you know?"],
  time: ["Ask what time the clock shows at dinner, and how long it is until bedtime.", "Ask: how long does it take to walk to the corner? Let's time it."],
  money: ["Count some coins together, starting with the ones worth the most.", "At a store, ask: if this costs 75 cents and we pay a dollar, how much change?"],
  picture_graph: ["Make a graph together: how many of each color car go by in five minutes?"],
  fractions: ["Cut a sandwich or a pancake into equal parts together. Ask: what is each part called?", "Ask: would you rather have a half or a quarter of a pizza? Why?"],
  bar_graph: ["Ask everyone in the family a question, like their favorite fruit, and draw a bar graph together."],
  number_line: ["Ask: on a ruler, where is 7? How far is it from 7 to 10?"],
  word_multiplication: ["Ask: how many wheels are on 4 bikes? How did you work it out?"],
  multiplication: ["Ask: what does 3 × 4 look like? Draw 3 rows of 4 dots together.", "Ask: you know 5 × 6. How can that help you with 6 × 6?"],
  division: ["Share something out together, like 12 crackers among 3 plates. Ask: how many each? Any left over?", "Ask: how does knowing 4 × 6 help with 24 ÷ 4?"],
  word_division: ["Ask: if 20 stickers are shared by 4 friends, how many does each get? What if there were 22?"],
  word_two_step: ["Make up a story with two steps, like buying two things and getting change. Ask: what do we work out first?"],
  fraction_line: ["Ask: on a ruler, where is half an inch? A quarter?"],
  rounding: ["At the store, round each price to the nearest dollar together, and guess the total.", "Ask: is 48 closer to 40 or 50? How do you know?"],
  fraction_compare: ["Ask: which is bigger, 1/3 or 1/4 of the same pizza? Why isn't the bigger number bigger?"],
  area: ["Ask: how many tiles cover the floor of a small room? How could you count them without counting each one?", "Ask: what's the difference between the fence around a garden and the grass inside it?"],
  line_plot: ["Measure everyone's hand in the family, and mark each length on a line."],
  conversions: ["Ask: how many minutes until dinner? How many seconds is that?", "Ask: about how many centimeters tall are you? How many meters is that?"],
  place_value: ["Ask: in 4,720, what is the 7 worth?", "Read a big number together, like a car's mileage or a price. Ask what each digit is worth."],
  decimals: ["Ask: which is more, 0.5 or 0.25? Why isn't the longer one bigger?", "Look at prices together. Ask: what does the .75 in $3.75 mean?"],
  fraction_arithmetic: ["Ask: why do the bottom numbers stay the same when you add 1/4 + 2/4?", "Ask: what does 1/2 × 1/2 look like? Fold a piece of paper to see."],
  factors: ["Ask: in how many ways can you put 12 chairs in equal rows?"],
  fraction_stories: ["Cook something together. Ask: if the recipe needs 3/4 cup and we make half as much, how much do we need?"],
  angles: ["Ask: which corners in this room are square corners? Can you find a smaller angle? A bigger one?"],
  volume: ["Ask: how many small boxes or cubes would fill a big box? How could you work it out?"],
  coordinates: ["Play a game of finding things on a map or a grid: across first, then up."],
  expressions: ["Ask: what's 2 + 3 × 4? Is it 20 or 14? Why?"],
  common_factors: ["Ask: hot dogs come 10 to a pack and buns 8 to a pack. How many packs of each to have none left over?"],
  equations: ["Ask: I'm thinking of a number. I double it and add 3, and get 11. What was my number? How did you undo it?"],
  ratios: ["Ask: if a recipe for 2 people needs 3 eggs, how many eggs for 6 people?", "Ask: at a sale, what is 25% off a $20 shirt?"],
  integers: ["Look at a thermometer or the weather together. Ask: what does below zero mean? Which is colder, −5 or −2?"],
  statistics: ["Ask: what is the middle age of everyone in the family? What is the average?"],
  data_displays: ["Ask: if you lined up everyone in a class by height, where would the middle person be?"],
};

/** For when nothing more particular fits. */
const ANY = ["Ask: which question was the hardest? How did you work it out? Is there another way?"];

/**
 * Something to talk about after a battle: about a kind of question that was
 * missed, if any was, since talking it through helps most there; otherwise
 * about any kind asked.
 * @param {Rng} rng
 * @param {readonly { type: string, outcome: string }[]} answers  the battle's answers
 */
export function talkAbout(rng, answers) {
  const known = (/** @type {string} */ type) => type in TALK;
  const missed = [...new Set(answers.filter(a => a.outcome !== "firstTry").map(a => a.type))].filter(known);
  const asked = [...new Set(answers.map(a => a.type))].filter(known);
  const pool = missed.length > 0 ? missed : asked;
  if (pool.length === 0) return rng.pick(ANY);
  return rng.pick(TALK[/** @type {keyof typeof TALK} */ (rng.pick(pool))]);
}
