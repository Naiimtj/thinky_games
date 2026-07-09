/** Pure logic for Wend (connect adjacent letters into words). */

export const cellKey = (row, col) => `${row},${col}`;

/** Official Wend rule: only orthogonal neighbors connect — no diagonals (matches backend generation). */
export const areAdjacent = (a, b) => {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return dr + dc === 1;
};

export const pathIncludes = (path, cell) =>
  path.some((step) => step.row === cell.row && step.col === cell.col);

/** Finds an orthogonal path spelling `word` on `grid`, skipping cells in `blocked`. */
export const findWordPath = (grid, word, blocked = new Set()) => {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const visited = new Set();

  const search = (row, col, index, path) => {
    if (grid[row][col] !== word[index]) return null;
    const key = cellKey(row, col);
    if (blocked.has(key) || visited.has(key)) return null;

    const nextPath = [...path, { row, col }];
    if (index === word.length - 1) return nextPath;

    visited.add(key);
    const deltas = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, dc] of deltas) {
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
      const found = search(r, c, index + 1, nextPath);
      if (found) return found;
    }
    visited.delete(key);
    return null;
  };

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const found = search(row, col, 0, []);
      if (found) return found;
    }
  }
  return null;
};

/** The word spelled by walking the path across the grid. */
export const wordFromPath = (grid, path) =>
  path.map(({ row, col }) => grid[row][col]).join('');
