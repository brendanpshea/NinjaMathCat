// Telling time on a clock face, and working out how long things take.

import { atGrade } from "./common.js";

/** @import { Draft, QuestionType } from "./common.js" */
/** @import { Rng } from "../rng.js" */

/**
 * The minutes a grade reads a clock to: hours and then half hours in first
 * grade (1.MD.3), quarter hours and then five minutes in second (2.MD.7), any
 * minute in third (3.MD.1).
 * @type {readonly [number, number][]}
 */
export const CLOCK_STEP = [[1, 60], [1.5, 30], [2, 15], [2.5, 5], [Infinity, 1]];

/**
 * A clock reading without a.m. or p.m., as on a clock face: 3:05.
 * @param {number} hours  1 to 12
 * @param {number} minutes
 */
export function formatClock(hours, minutes) {
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

/**
 * A time of day from minutes after midnight: 3:05 PM.
 * @param {number} minutesAfterMidnight
 */
export function formatTime(minutesAfterMidnight) {
  const minutes = ((minutesAfterMidnight % 1440) + 1440) % 1440;
  const hours24 = Math.floor(minutes / 60);
  return `${formatClock(hours24 % 12 || 12, minutes % 60)} ${hours24 < 12 ? "AM" : "PM"}`;
}

/**
 * A length of time: 45 minutes, 1 hour, 2 hours 10 minutes.
 * @param {number} minutes
 */
export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hours = `${h} ${h === 1 ? "hour" : "hours"}`;
  const mins = `${m} ${m === 1 ? "minute" : "minutes"}`;
  return h === 0 ? mins : m === 0 ? hours : `${hours} ${mins}`;
}

const ACTIVITIES = [
  "The movie", "Soccer practice", "The birthday party", "The school play", "Dance class",
  "The swimming lesson", "Band practice", "Art class", "The nature hike", "The piano lesson",
];

/**
 * Things a child does, each at a fitting time of day, in minutes after
 * midnight (2.MD.7).
 */
export const DAY = [
  { doing: "eat breakfast", at: 7 * 60 },
  { doing: "wake up for school", at: 7 * 60 + 15 },
  { doing: "get to school", at: 8 * 60 + 30 },
  { doing: "eat lunch at school", at: 12 * 60 + 30 },
  { doing: "go home from school", at: 15 * 60 },
  { doing: "play at the park after school", at: 16 * 60 },
  { doing: "eat dinner", at: 18 * 60 },
  { doing: "go to bed", at: 20 * 60 },
];

/** @type {QuestionType} */
export const time = {
  id: "time",
  name: "Telling time",
  generate(rng, grade) {
    // AM and PM in second grade (2.MD.7).
    if (grade >= 2 && grade < 3 && rng.chance(0.3)) return amPm(rng);
    // Elapsed time comes in third grade, alongside reading to the minute (3.MD.1).
    return grade >= 3 && rng.chance(0.5) ? elapsed(rng) : readClock(rng, atGrade(grade, CLOCK_STEP));
  },
};

/**
 * Telling AM from PM: the best time of day for something, or what the two
 * mean.
 * @param {Rng} rng
 * @returns {Draft}
 */
function amPm(rng) {
  const hint = "AM times run from midnight until noon: the night and the morning. PM times run from noon until midnight: the afternoon and the evening.";
  if (rng.chance(0.25)) {
    const pm = rng.chance(0.5);
    const [right, other] = pm ? ["from noon until midnight", "from midnight until noon"] : ["from midnight until noon", "from noon until midnight"];
    return {
      prompt: `Which times of day are written with ${pm ? "PM" : "AM"}?`,
      answer: right,
      wrong: [other, ...rng.shuffle(["only when it is dark outside", "only when the sun is up"])],
      hint,
      difficulty: 2,
    };
  }
  const { doing, at } = rng.pick(DAY);
  // The same time the other half of the day, and two in the middle of the night.
  const flipped = at + 720;
  const night = rng.shuffle([1, 2, 3, 4].filter(h => h !== Math.floor(flipped / 60) % 24)).slice(0, 2).map(h => h * 60 + (at % 60));
  return {
    prompt: `Which is the best time to ${doing}?`,
    answer: formatTime(at),
    wrong: [formatTime(flipped), ...night.map(formatTime)],
    hint,
    difficulty: 1,
  };
}

/**
 * @param {Rng} rng
 * @param {number} step  minutes between the times the clock can show
 * @returns {Draft}
 */
function readClock(rng, step) {
  const hours = rng.int(1, 12);
  const minutes = step * rng.int(0, 60 / step - 1);
  const next = (hours % 12) + 1;
  const previous = ((hours + 10) % 12) + 1;
  const off = Math.max(step, 5);
  const wrong = [
    // Reading the hour hand as the next hour, which it is nearly pointing at.
    formatClock(minutes >= 30 ? next : previous, minutes),
    // Mixing up the hands.
    ...(minutes % 5 === 0 ? [formatClock(minutes / 5 || 12, (hours * 5) % 60)] : []),
    formatClock(hours, (minutes + off) % 60),
    formatClock(hours, (minutes + 60 - off) % 60),
    formatClock(minutes >= 30 ? previous : next, minutes),
    // For o'clock times, where a minute off is no different: hours further away.
    formatClock(((hours + 5) % 12) + 1, minutes),
    formatClock(((hours + 1) % 12) + 1, minutes),
  ];
  return {
    prompt: "What time does the clock show?",
    visual: { kind: "clock", hours, minutes },
    answer: formatClock(hours, minutes),
    wrong: [...rng.shuffle(wrong.slice(0, 2)), ...rng.shuffle(wrong.slice(2))],
    hint: minutes === 0 ? "The short hand points to the hour." : "The short hand shows the hour. The long hand shows the minutes.",
    difficulty: minutes === 0 ? 1 : minutes % 15 === 0 ? 2 : 3,
  };
}

/**
 * How long something lasts, or when it ends. Times and lengths are in
 * five-minute steps.
 * @param {Rng} rng
 * @returns {Draft}
 */
function elapsed(rng) {
  const activity = rng.pick(ACTIVITIES);
  const start = 5 * rng.int(8 * 12, 18 * 12); // between 8 AM and 6 PM
  const length = 5 * rng.int(3, 30); // 15 minutes to 2½ hours
  const end = start + length;
  const crossesHour = Math.floor(start / 60) !== Math.floor(end / 60);
  /** @param {number} m */
  const fits = m => m > 0 && m !== length;
  // The hints take the first step with the story's own times: the whole hours, or up to the next o'clock.
  const [hours, minutes] = [Math.floor(length / 60), length % 60];
  const hoursText = `${hours} ${hours === 1 ? "hour" : "hours"}`;
  const oClock = formatTime(Math.ceil(start / 60) * 60);
  // Going on past an o'clock, but not ending on one, which would be the answer.
  const past = crossesHour && end % 60 !== 0;
  if (rng.chance(0.5)) {
    return {
      prompt: `${activity} starts at ${formatTime(start)} and ends at ${formatTime(end)}. How long does it last?`,
      answer: formatDuration(length),
      wrong: rng.shuffle([length + 10, length - 10, length + 60, length - 60, length + 5, length - 5].filter(fits)).map(formatDuration),
      hint: hours > 0 && minutes > 0 ? `From ${formatTime(start)} to ${formatTime(start + 60 * hours)} is ${hoursText}. Then count the minutes on to ${formatTime(end)}.`
        : hours > 0 ? `Count the whole hours from ${formatTime(start)} to ${formatTime(end)}.`
        : past ? `Count the minutes from ${formatTime(start)} up to ${oClock}, then on to ${formatTime(end)}.`
        : `Count the minutes from ${formatTime(start)} to ${formatTime(end)}, in 5-minute steps.`,
      difficulty: 2 + Number(crossesHour),
    };
  }
  return {
    prompt: `${activity} starts at ${formatTime(start)} and lasts ${formatDuration(length)}. When does it end?`,
    answer: formatTime(end),
    wrong: rng.shuffle([end + 10, end - 10, end + 60, end - 60, end + 5, end - 5]).map(formatTime),
    hint: hours > 0 && minutes > 0 ? `${formatTime(start)} and ${hoursText} is ${formatTime(start + 60 * hours)}. Then add the ${minutes} minutes.`
      : hours > 0 ? `Count on ${hoursText} from ${formatTime(start)}.`
      : past ? `Count on from ${formatTime(start)} up to ${oClock}, then add the rest of the ${minutes} minutes.`
      : `Count on ${minutes} minutes from ${formatTime(start)}.`,
    difficulty: 2 + Number(crossesHour),
  };
}
