// The width and height of a WebP image, read from its header, for checking
// sprite strips without an image library. The strips are all extended-format
// WebP (a VP8X chunk first), which is what saving with transparency makes.

/**
 * @param {Uint8Array} bytes  the file's contents
 * @returns {{ width: number, height: number }}
 */
export function webpSize(bytes) {
  const ascii = (/** @type {number} */ from, /** @type {number} */ length) => String.fromCharCode(...bytes.subarray(from, from + length));
  if (ascii(0, 4) !== "RIFF" || ascii(8, 4) !== "WEBP") throw new Error("Not a WebP file");
  if (ascii(12, 4) !== "VP8X") throw new Error(`Expected an extended WebP (VP8X), found ${ascii(12, 4)}`);
  const u24 = (/** @type {number} */ at) => bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16);
  return { width: u24(24) + 1, height: u24(27) + 1 };
}
