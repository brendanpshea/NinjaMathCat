// The game's own icons, for its buttons and menus: drawn the same on every
// device, in whatever colour the button is (currentColor), and crisp at any
// size. Emoji stay for what the game is about, such as treasures and things
// to count, where their variety is part of the fun; but a button's icon
// should look the same on a Chromebook, an iPad and an old Android tablet.

/** Each icon's drawing, on a 24 by 24 grid, in strokes 2 wide with round ends. */
const DRAWINGS = {
  play: `<path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke-linejoin="round"/>`,
  training: `<path d="M3 10v4M6 7.5v9M18 7.5v9M21 10v4M6 12h12"/>`,
  // Two swords crossed: blades from the top corners, guards across them, grips and pommels below.
  battle: `<path d="M4 4l9.5 9.5M11.5 15.5l4-4M13.5 13.5l3.5 3.5M20 4l-9.5 9.5M8.5 11.5l4 4M10.5 13.5L7 17"/><circle cx="18.2" cy="18.2" r="1.3"/><circle cx="5.8" cy="18.2" r="1.3"/>`,
  challenge: `<circle cx="12" cy="13.5" r="7"/><path d="M12 13.5V10M10 3h4M12 3v3.5M18 7l1.5-1.5"/>`,
  treasures: `<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9.5 4L8 9l4 11 4-11-1.5-5"/>`,
  lock: `<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
  star: `<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill="currentColor" stroke-linejoin="round"/>`,
  players: `<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.2a4.5 4.5 0 0 1 6 4.3"/>`,
  watch: `<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z" fill="currentColor" stroke-linejoin="round"/>`,
  back: `<path d="M9 5h11v14H9l-6-7z"/><path d="M12 9.5l5 5M17 9.5l-5 5"/>`,
};

/** @typedef {keyof typeof DRAWINGS} IconName */

/**
 * An icon as SVG markup, hidden from screen readers: the button it is on says
 * what it does in words.
 * @param {IconName} name
 * @param {string} [className]
 */
export function icon(name, className = "icon") {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${DRAWINGS[name]}</svg>`;
}

/** Every icon's name, for the tests. */
export const ICONS = /** @type {IconName[]} */ (Object.keys(DRAWINGS));
