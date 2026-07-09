/** Build `[0, 1, ..., n - 1]` — used to render a fixed number of repeated elements. */
export const range = (n) => Array.from({ length: n }, (_, i) => i);
