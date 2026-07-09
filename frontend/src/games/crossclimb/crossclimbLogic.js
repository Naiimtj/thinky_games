/** Pure logic for Crossclimb (word-ladder). */

/** True when the two equal-length words differ in exactly one position. */
export const differsByOne = (a, b) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diff += 1;
    if (diff > 1) return false;
  }
  return diff === 1;
};

/** True when every consecutive pair of words differs by exactly one letter. */
export const isValidLadder = (words) =>
  words.every((word, i) => i === 0 || differsByOne(words[i - 1], word));

/** Normalise typed input: uppercase letters only, capped at the word length. */
export const sanitizeInput = (value, length) =>
  value
    .toUpperCase()
    .replace(/[^A-ZÑ]/g, '')
    .slice(0, length);

/** Deterministic, non-trivial starting order (never the solved order). */
export const scrambleOrder = (n) =>
  Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => ((a * 7 + 3) % n) - ((b * 7 + 3) % n),
  );

/** Return a new order with `id` moved to `targetIndex`. */
export const moveInOrder = (order, id, targetIndex) => {
  const without = order.filter((value) => value !== id);
  const clamped = Math.max(0, Math.min(targetIndex, without.length));
  return [...without.slice(0, clamped), id, ...without.slice(clamped)];
};
