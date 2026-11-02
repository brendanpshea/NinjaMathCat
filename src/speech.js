// Reading aloud, for children still learning to read, with the browser's own
// speech. Math is turned into the words a child would hear: "3/4" is "3
// fourths", "7 × 8" is "7 times 8", "−3" is "negative 3", "$2.75" is "2
// dollars and 75 cents", and the box in an equation is "what number". Where
// there is no speech, nothing is said and nothing breaks.

/** Fraction words, one and many, by denominator. */
const PARTS = {
  2: ["half", "halves"], 3: ["third", "thirds"], 4: ["fourth", "fourths"], 5: ["fifth", "fifths"],
  6: ["sixth", "sixths"], 7: ["seventh", "sevenths"], 8: ["eighth", "eighths"], 9: ["ninth", "ninths"],
  10: ["tenth", "tenths"], 11: ["eleventh", "elevenths"], 12: ["twelfth", "twelfths"],
  100: ["hundredth", "hundredths"], 1000: ["thousandth", "thousandths"],
};

/**
 * A fraction in words: "3 fourths", "1 half", or "7 over 15" where there is no word.
 * @param {string} top
 * @param {string} bottom
 */
function fractionWords(top, bottom) {
  const words = PARTS[/** @type {keyof typeof PARTS} */ (Number(bottom))];
  return words ? `${top} ${top === "1" ? words[0] : words[1]}` : `${top} over ${bottom}`;
}

/**
 * An amount of money in words: "2 dollars and 75 cents", "1 dollar", "5 cents".
 * Voices differ on "$2.75" and "55¢", and some read out "cent sign".
 * @param {number} dollars
 * @param {number} cents
 */
function moneyWords(dollars, cents) {
  const d = dollars > 0 ? `${dollars} ${dollars === 1 ? "dollar" : "dollars"}` : "";
  const c = cents > 0 ? `${cents} ${cents === 1 ? "cent" : "cents"}` : "";
  return d && c ? `${d} and ${c}` : d || c || "0 dollars";
}

/**
 * Text as it should be spoken. A colon with two digits after it is a time,
 * "3:45", unless the text is about ratios, where "5:13" is "5 to 13".
 * @param {string} text
 * @param {{ ratios?: boolean }} [options]
 */
export function speakable(text, { ratios = false } = {}) {
  return text
    .replace(/\$(\d[\d,]*)(?:\.(\d{2}))?/g, (_, dollars, cents = "0") => moneyWords(Number(dollars.replace(/,/g, "")), Number(cents)))
    .replace(/(\d+)¢/g, (_, cents) => moneyWords(0, Number(cents)))
    .replace(/(\d+) (\d+)\/(\d+)/g, (_, whole, top, bottom) => `${whole} and ${fractionWords(top, bottom)}`)
    .replace(/(\d+)\/(\d+)/g, (_, top, bottom) => fractionWords(top, bottom))
    .replace(/(^|[\s(,])−(?=\d)/g, "$1negative ")
    .replace(/(\d+):(\d+)/g, (whole, a, b) => (b.length === 2 && !ratios ? whole : `${a} to ${b}`))
    .replace(/\+/g, " plus ")
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/−/g, " minus ")
    .replace(/≤/g, " is less than or equal to ")
    .replace(/≥/g, " is greater than or equal to ")
    .replace(/</g, " is less than ")
    .replace(/>/g, " is greater than ")
    .replace(/=/g, " equals ")
    .replace(/□/g, " what number ")
    .replace(/²/g, " squared").replace(/³/g, " cubed").replace(/⁴/g, " to the 4th").replace(/⁵/g, " to the 5th")
    .replace(/°/g, " degrees")
    .replace(/%/g, " percent")
    .replace(/\s+([.,?!])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A question, read out: the prompt, then each choice with its number, so a
 * child can answer with the number keys or by pointing.
 * @param {string} prompt
 * @param {readonly (string | number)[]} choices
 */
export function questionSpeech(prompt, choices) {
  return `${prompt} ${choices.map((c, i) => `${i + 1}, ${c}.`).join(" ")}`;
}

/**
 * Says things aloud, one at a time: something new to say cuts off whatever
 * was being said.
 */
export class Speaker {
  /** @param {SpeechSynthesis | undefined} [synth] */
  constructor(synth = globalThis.speechSynthesis) {
    this.synth = synth;
  }

  /** Whether this browser can speak. */
  get available() {
    return Boolean(this.synth && typeof globalThis.SpeechSynthesisUtterance === "function");
  }

  /**
   * @param {string} text
   * @param {{ ratios?: boolean, pitch?: number }} [options]  ratios as for speakable; pitch from 0 to 2, 1 as usual, so a monster can sound unlike the hero
   */
  say(text, options) {
    if (!this.available || !this.synth) return;
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(speakable(text, options));
    utterance.rate = 0.9;
    if (options?.pitch !== undefined) utterance.pitch = options.pitch;
    this.synth.speak(utterance);
  }

  stop() {
    if (this.available) this.synth?.cancel();
  }
}
