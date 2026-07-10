/** Pure logic for Wend (connect letters in a straight line into words). */

export const cellKey = (row, col) => `${row},${col}`;

/**
 * Official Wend rule: words run in a single straight line — horizontal,
 * vertical or diagonal — and never bend or double back (matches backend
 * generation). These are the 8 possible directions a word can be drawn in.
 */
export const DIRECTIONS = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** The unit step from `a` to `b`, or `null` if they aren't adjacent (incl. diagonally). */
export const stepBetween = (a, b) => {
  const dr = b.row - a.row;
  const dc = b.col - a.col;
  if (Math.abs(dr) > 1 || Math.abs(dc) > 1 || (dr === 0 && dc === 0))
    return null;
  return { dr, dc };
};

/**
 * Whether appending `cell` to `path` keeps it a straight line: the first step
 * may go in any of the 8 directions, but every step after that must repeat
 * the exact same direction — no bending, no snaking.
 */
export const continuesStraightLine = (path, cell) => {
  if (path.length === 0) return true;
  const last = path[path.length - 1];
  const step = stepBetween(last, cell);
  if (!step) return false;
  if (path.length === 1) return true;
  const anchor = stepBetween(path[path.length - 2], last);
  return anchor !== null && anchor.dr === step.dr && anchor.dc === step.dc;
};

export const pathIncludes = (path, cell) =>
  path.some((step) => step.row === cell.row && step.col === cell.col);

/** The straight-line path from `(row, col)` along `(dr, dc)` if it spells `word`, else `null`. */
const matchLine = (grid, word, row, col, dr, dc) => {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const endRow = row + dr * (word.length - 1);
  const endCol = col + dc * (word.length - 1);
  if (endRow < 0 || endRow >= rows || endCol < 0 || endCol >= cols) return null;

  const path = [];
  for (let i = 0; i < word.length; i += 1) {
    const r = row + dr * i;
    const c = col + dc * i;
    if (grid[r][c] !== word[i]) return null;
    path.push({ row: r, col: c });
  }
  return path;
};

/** Finds a straight-line path (any of the 8 directions) spelling `word` on `grid`. */
export const findWordPath = (grid, word) => {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (grid[row][col] !== word[0]) continue;
      for (const [dr, dc] of DIRECTIONS) {
        const path = matchLine(grid, word, row, col, dr, dc);
        if (path) return path;
      }
    }
  }
  return null;
};

/** The word spelled by walking the path across the grid. */
export const wordFromPath = (grid, path) =>
  path.map(({ row, col }) => grid[row][col]).join('');
