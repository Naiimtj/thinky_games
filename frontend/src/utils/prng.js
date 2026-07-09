/** Seeded pseudo-random number generation for deterministic puzzle generation. */

/**
 * mulberry32 — a tiny, fast, deterministic PRNG.
 * Given the same seed it always yields the same sequence, which is what makes
 * the daily puzzles identical for every player on a given day.
 *
 * @param {number} seed - Any 32-bit integer seed.
 * @returns {() => number} A function producing floats in [0, 1).
 */
export const mulberry32 = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Random integer in [0, max). */
export const randInt = (rng, max) => Math.floor(rng() * max);

/**
 * In-place Fisher–Yates shuffle driven by the provided rng.
 * Returns the same array for convenience.
 */
export const shuffleInPlace = (array, rng) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
