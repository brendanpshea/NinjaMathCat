// Sprite strips on the page: three poses side by side (stand, attack,
// recoil), shown one at a time as a background. A strip's frame shape is only
// known once it has loaded, so it stays hidden until then.

/** @type {Map<string, Promise<number>>} */
const aspects = new Map();

/**
 * The width-to-height shape of one frame of a strip of three, once the strip has loaded.
 * @param {string} url
 * @returns {Promise<number>}
 */
export function frameAspect(url) {
  let loading = aspects.get(url);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth / 3 / img.naturalHeight);
      img.onerror = reject;
      img.src = url;
    });
    // A failed load must not be remembered as the answer.
    loading.catch(() => aspects.delete(url));
    aspects.set(url, loading);
  }
  return loading;
}

/**
 * Point an element at a strip. It gets the class is-ready, and its frame
 * shape as --frame-aspect, when the strip has loaded.
 * @param {HTMLElement} el
 * @param {string} url
 * @param {string} [label]  what a screen reader says for it
 */
export function setStrip(el, url, label) {
  if (label) el.setAttribute("aria-label", label);
  if (el.dataset.src === url) return;
  el.dataset.src = url;
  el.style.backgroundImage = `url("${url}")`;
  el.classList.remove("is-ready");
  frameAspect(url).then(aspect => {
    if (el.dataset.src !== url) return;
    el.style.setProperty("--frame-aspect", aspect.toFixed(4));
    el.classList.add("is-ready");
  }).catch(() => {}); // a missing file leaves an empty spot; the name next to it still says who it is
}

/**
 * A still of a strip's standing pose (css/game.css .still). Without a label
 * it is decoration, and screen readers pass over it.
 * @param {string} url
 * @param {string} [label]
 */
export function still(url, label) {
  const el = document.createElement("span");
  el.className = "still";
  if (label) el.setAttribute("role", "img");
  else el.setAttribute("aria-hidden", "true");
  setStrip(el, url, label);
  return el;
}
