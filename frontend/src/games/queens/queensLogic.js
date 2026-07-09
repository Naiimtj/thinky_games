/** Pure logic for the Queens game. */

export const REGION_COLORS = [
  '#fca5a5',
  '#fdba74',
  '#fde047',
  '#86efac',
  '#67e8f9',
  '#93c5fd',
  '#c4b5fd',
  '#f0abfc',
  '#f9a8d4',
  '#a7f3d0',
  '#bef264',
  '#fca5a5',
];

export const CELL = { EMPTY: 'empty', MARK: 'mark', QUEEN: 'queen' };

/** Cycle a cell through empty -> mark -> queen -> empty. */
export const nextCellState = (current) => {
  if (current === CELL.QUEEN) return CELL.EMPTY;
  if (current === CELL.MARK) return CELL.QUEEN;
  return CELL.MARK;
};

const areTouching = (a, b) =>
  Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1;

/** Extract queen coordinates from the cell-state map. */
export const queensFromState = (cellState, size) => {
  const queens = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cellState[`${row},${col}`] === CELL.QUEEN) queens.push({ row, col });
    }
  }
  return queens;
};

/**
 * Solved when there is exactly one queen per row, column and colour region,
 * and no two queens touch (including diagonally).
 */
export const isQueensSolved = (queens, regions, size) => {
  if (queens.length !== size) return false;

  const rows = new Set();
  const cols = new Set();
  const regionIds = new Set();
  for (const queen of queens) {
    rows.add(queen.row);
    cols.add(queen.col);
    regionIds.add(regions[queen.row][queen.col]);
  }
  if (rows.size !== size || cols.size !== size || regionIds.size !== size) {
    return false;
  }

  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      if (areTouching(queens[i], queens[j])) return false;
    }
  }
  return true;
};

/** Whether a placed queen conflicts with any other placed queen. */
export const queenHasConflict = (queen, queens, regions) =>
  queens.some((other) => {
    if (other.row === queen.row && other.col === queen.col) return false;
    if (other.row === queen.row || other.col === queen.col) return true;
    if (regions[other.row][other.col] === regions[queen.row][queen.col])
      return true;
    return areTouching(queen, other);
  });

export const cellKey = (row, col) => `${row},${col}`;

const DIAGONALS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

/**
 * Cells a single queen "attacks": its whole row and column, every cell of its
 * colour region, and the four diagonally adjacent cells. The queen's own cell
 * is excluded.
 */
const attackedKeys = (queen, regions, size) => {
  const keys = new Set();
  for (let i = 0; i < size; i++) {
    keys.add(cellKey(queen.row, i));
    keys.add(cellKey(i, queen.col));
  }
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (regions[row][col] === regions[queen.row][queen.col]) {
        keys.add(cellKey(row, col));
      }
    }
  }
  DIAGONALS.forEach(([dr, dc]) => {
    const row = queen.row + dr;
    const col = queen.col + dc;
    if (row >= 0 && col >= 0 && row < size && col < size) {
      keys.add(cellKey(row, col));
    }
  });
  keys.delete(cellKey(queen.row, queen.col));
  return keys;
};

/** Union of the cells to auto-mark with ✕ given the currently placed queens. */
export const autoMarkKeys = (queens, regions, size) => {
  const keys = new Set();
  queens.forEach((queen) => {
    attackedKeys(queen, regions, size).forEach((k) => keys.add(k));
  });
  return keys;
};

/** Solve the (uniquely solvable) puzzle, returning one queen per row. */
export const solveQueens = (regions, size) => {
  const cols = [];
  const usedCol = new Set();
  const usedRegion = new Set();
  const place = (row) => {
    if (row === size) return true;
    for (let col = 0; col < size; col++) {
      if (usedCol.has(col)) continue;
      if (row > 0 && Math.abs(col - cols[row - 1]) < 2) continue;
      const region = regions[row][col];
      if (usedRegion.has(region)) continue;
      cols[row] = col;
      usedCol.add(col);
      usedRegion.add(region);
      if (place(row + 1)) return true;
      cols.pop();
      usedCol.delete(col);
      usedRegion.delete(region);
    }
    return false;
  };
  return place(0) ? cols.map((col, row) => ({ row, col })) : null;
};
