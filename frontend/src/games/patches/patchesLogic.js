/** Pure logic for Patches (draw each clued figure to tile the whole board). */

export const cellKey = (row, col) => `${row},${col}`;

/** owner map with every seed cell assigned to its own figure. */
export const buildInitialOwner = (seeds) => {
  const owner = {};
  seeds.forEach((seed, index) => {
    owner[cellKey(seed.row, seed.col)] = index;
  });
  return owner;
};

/** Map of the fixed seed cells: cellKey -> seed index. */
export const seedCellMap = (seeds) => {
  const map = {};
  seeds.forEach((seed, index) => {
    map[cellKey(seed.row, seed.col)] = index;
  });
  return map;
};

const ORTHO = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export const regionCells = (owner, index) =>
  Object.keys(owner)
    .filter((k) => owner[k] === index)
    .map((k) => k.split(',').map(Number));

const isContiguous = (cells) => {
  const set = new Set(cells.map(([r, c]) => cellKey(r, c)));
  const seen = new Set([cellKey(cells[0][0], cells[0][1])]);
  const stack = [cells[0]];
  while (stack.length) {
    const [r, c] = stack.pop();
    ORTHO.forEach(([dr, dc]) => {
      const k = cellKey(r + dr, c + dc);
      if (set.has(k) && !seen.has(k)) {
        seen.add(k);
        stack.push([r + dr, c + dc]);
      }
    });
  }
  return seen.size === cells.length;
};

const boundingBox = (cells) => {
  const rowsArr = cells.map((cell) => cell[0]);
  const colsArr = cells.map((cell) => cell[1]);
  return {
    height: Math.max(...rowsArr) - Math.min(...rowsArr) + 1,
    width: Math.max(...colsArr) - Math.min(...colsArr) + 1,
  };
};

/** Whether a figure's cells satisfy its shape constraint and optional size. */
export const figureMatches = (cells, shape, size) => {
  if (cells.length === 0) return false;
  if (size != null && cells.length !== size) return false;
  if (!isContiguous(cells)) return false;
  const { width, height } = boundingBox(cells);
  const isSolidRect = cells.length === width * height;
  if (shape === 'SQUARE') return isSolidRect && width === height;
  if (shape === 'HRECT') return isSolidRect && width > height;
  if (shape === 'VRECT') return isSolidRect && height > width;
  return true; // ANY
};

/** Solved when every cell is filled and each figure matches its clue. */
export const isPatchesSolved = (owner, seeds, rows, cols) => {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (owner[cellKey(r, c)] === undefined) return false;
    }
  }
  return seeds.every((seed, index) => {
    const cells = regionCells(owner, index);
    const containsSeed = cells.some(
      ([r, c]) => r === seed.row && c === seed.col,
    );
    return containsSeed && figureMatches(cells, seed.shape, seed.size);
  });
};
