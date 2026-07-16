/** Pure logic for the Mini Sudoku game. */

export const buildSudokuGrid = (puzzle) =>
  puzzle.given.map((row) => row.slice());

export const givenMask = (puzzle) =>
  puzzle.given.map((row) => row.map((value) => value !== 0));

const groupComplete = (values, size) =>
  !values.includes(0) && new Set(values).size === size;

export const isSudokuSolved = (grid, size, boxHeight, boxWidth) => {
  for (let r = 0; r < size; r++) {
    if (!groupComplete(grid[r], size)) return false;
  }
  for (let c = 0; c < size; c++) {
    if (
      !groupComplete(
        grid.map((row) => row[c]),
        size,
      )
    )
      return false;
  }
  for (let br = 0; br < size; br += boxHeight) {
    for (let bc = 0; bc < size; bc += boxWidth) {
      const box = [];
      for (let i = 0; i < boxHeight; i++) {
        for (let j = 0; j < boxWidth; j++) box.push(grid[br + i][bc + j]);
      }
      if (!groupComplete(box, size)) return false;
    }
  }
  return true;
};

/** True when the value at (row, col) repeats within its row, column or box. */
export const hasConflict = (grid, size, boxHeight, boxWidth, row, col) => {
  const value = grid[row][col];
  if (value === 0) return false;

  for (let i = 0; i < size; i++) {
    if (i !== col && grid[row][i] === value) return true;
    if (i !== row && grid[i][col] === value) return true;
  }
  const br = row - (row % boxHeight);
  const bc = col - (col % boxWidth);
  for (let i = 0; i < boxHeight; i++) {
    for (let j = 0; j < boxWidth; j++) {
      const rr = br + i;
      const cc = bc + j;
      if ((rr !== row || cc !== col) && grid[rr][cc] === value) return true;
    }
  }
  return false;
};

/** True when placing `value` at (row, col) breaks no row/column/box rule. */
const canPlace = (grid, size, boxHeight, boxWidth, row, col, value) => {
  for (let i = 0; i < size; i++) {
    if (grid[row][i] === value || grid[i][col] === value) return false;
  }
  const boxRow = row - (row % boxHeight);
  const boxCol = col - (col % boxWidth);
  for (let r = 0; r < boxHeight; r++) {
    for (let c = 0; c < boxWidth; c++) {
      if (grid[boxRow + r][boxCol + c] === value) return false;
    }
  }
  return true;
};

/** First empty (0) cell in reading order, or null once the grid is full. */
const firstEmptyCell = (grid, size) => {
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col] === 0) return [row, col];
    }
  }
  return null;
};

/**
 * Solve a Mini Sudoku via backtracking, mirroring the backend generator's
 * solver. Puzzles are built to have a unique solution, so the first
 * complete grid found is returned.
 */
export const solveSudoku = (given, size, boxHeight, boxWidth) => {
  const grid = given.map((row) => row.slice());

  const search = () => {
    const cell = firstEmptyCell(grid, size);
    if (!cell) return true;
    const [row, col] = cell;
    for (let value = 1; value <= size; value++) {
      if (!canPlace(grid, size, boxHeight, boxWidth, row, col, value)) {
        continue;
      }
      grid[row][col] = value;
      if (search()) return true;
      grid[row][col] = 0;
    }
    return false;
  };

  return search() ? grid.map((row) => row.slice()) : null;
};
