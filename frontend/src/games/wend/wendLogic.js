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

/** tan(22.5°): splits the drag angle into 8 equal 45° sectors, one per direction. */
const SNAP_RATIO = Math.tan(Math.PI / 8);

/** -1, 0 or 1: whether a drag moves along `axis`, given the `other` axis offset. */
const axisStep = (axis, other) =>
  Math.abs(axis) > SNAP_RATIO * Math.abs(other) ? Math.sign(axis) : 0;

/**
 * Drag selection: the line from `start` towards the pointer offset (in cells),
 * snapped to the nearest direction and cell, so finger wobble can't derail it.
 */
export const snapLine = (grid, start, dRow, dCol) => {
  const dr = axisStep(dRow, dCol);
  const dc = axisStep(dCol, dRow);
  const path = [start];
  if (dr === 0 && dc === 0) return path;
  const steps = Math.round((dRow * dr + dCol * dc) / (dr * dr + dc * dc));
  for (let step = 1; step <= steps; step += 1) {
    const row = start.row + dr * step;
    const col = start.col + dc * step;
    if (!grid[row]?.[col]) break;
    path.push({ row, col });
  }
  return path;
};

export const samePath = (a, b) =>
  a.length === b.length &&
  a.every(
    (cell, index) => cell.row === b[index].row && cell.col === b[index].col,
  );

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
