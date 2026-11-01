// The width and height of a WebP image, read from its header, for checking
// images without an image library. Two kinds turn up here: the sprite strips
// are extended WebP (a VP8X chunk, which saving with transparency makes), and
// the painted backdrops are plain lossy WebP (a VP8 chunk).

/**
 * @param {Uint8Array} bytes  the file's contents
 * @returns {{ width: number, height: number }}
 */
export function webpSize(bytes) {
  const ascii = (/** @type {number} */ from, /** @type {number} */ length) => String.fromCharCode(...bytes.subarray(from, from + length));
  if (ascii(0, 4) !== "RIFF" || ascii(8, 4) !== "WEBP") throw new Error("Not a WebP file");
  const chunk = ascii(12, 4);
  if (chunk === "VP8X") {
    const u24 = (/** @type {number} */ at) => bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16);
    return { width: u24(24) + 1, height: u24(27) + 1 };
  }
  if (chunk === "VP8 ") {
    // After the 3-byte frame tag and the 9d 01 2a start code: 14-bit width and height.
    const u14 = (/** @type {number} */ at) => (bytes[at] | (bytes[at + 1] << 8)) & 0x3fff;
    return { width: u14(26), height: u14(28) };
  }
  throw new Error(`Unsupported WebP (${chunk})`);
}
