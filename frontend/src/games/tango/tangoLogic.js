/** Pure logic for the Tango game. */

export const SUN = 0;
export const MOON = 1;
export const EMPTY = -1;

const key = (row, col) => `${row},${col}`;

/** Build the working grid, seeding the puzzle's fixed cells. */
export const buildTangoGrid = (puzzle) => {
  const grid = Array.from({ length: puzzle.size }, () =>
    Array.from({ length: puzzle.size }, () => EMPTY),
  );
  puzzle.given.forEach(({ row, col, value }) => {
    grid[row][col] = value;
  });
  return grid;
};

/** Keys of the cells fixed by the puzzle (cannot be edited). */
export const givenKeys = (puzzle) =>
  new Set(puzzle.given.map(({ row, col }) => key(row, col)));

/** Cycle empty -> sun -> moon -> empty. */
export const cycleSymbol = (value) => {
  if (value === EMPTY) return SUN;
  if (value === SUN) return MOON;
  return EMPTY;
};

/** Sign markers positioned at the midpoint between the two constrained cells. */
export const constraintMarkers = (constraints) =>
  constraints.map(({ a, b, type }) => ({
    x: (a.col + b.col) / 2 + 0.5,
    y: (a.row + b.row) / 2 + 0.5 - 0.02,
    label: type === '=' ? '=' : '×',
  }));

const satisfiesConstraint = (grid, { a, b, type }) => {
  const av = grid[a.row][a.col];
  const bv = grid[b.row][b.col];
  return type === '=' ? av === bv : av !== bv;
};

/** Keys of cells that currently violate a Tango rule (three in a row, row/col
 * over quota, or a broken =/× constraint). Used to highlight mistakes live. */
export const findTangoErrors = (grid, size, constraints) => {
  const errors = new Set();
  const half = size / 2;

  for (let i = 0; i < size; i++) {
    const rowCells = { [SUN]: [], [MOON]: [] };
    const colCells = { [SUN]: [], [MOON]: [] };

    for (let j = 0; j < size; j++) {
      const rowVal = grid[i][j];
      if (rowVal === SUN || rowVal === MOON) rowCells[rowVal].push(key(i, j));

      const colVal = grid[j][i];
      if (colVal === SUN || colVal === MOON) colCells[colVal].push(key(j, i));

      if (j >= 2) {
        const [a, b, c] = [grid[i][j - 2], grid[i][j - 1], grid[i][j]];
        if (a !== EMPTY && a === b && b === c) {
          errors.add(key(i, j - 2));
          errors.add(key(i, j - 1));
          errors.add(key(i, j));
        }
        const [ca, cb, cc] = [grid[j - 2][i], grid[j - 1][i], grid[j][i]];
        if (ca !== EMPTY && ca === cb && cb === cc) {
          errors.add(key(j - 2, i));
          errors.add(key(j - 1, i));
          errors.add(key(j, i));
        }
      }
    }

    if (rowCells[SUN].length > half)
      rowCells[SUN].forEach((k) => errors.add(k));
    if (rowCells[MOON].length > half)
      rowCells[MOON].forEach((k) => errors.add(k));
    if (colCells[SUN].length > half)
      colCells[SUN].forEach((k) => errors.add(k));
    if (colCells[MOON].length > half)
      colCells[MOON].forEach((k) => errors.add(k));
  }

  constraints.forEach(({ a, b, type }) => {
    const av = grid[a.row][a.col];
    const bv = grid[b.row][b.col];
    if (av === EMPTY || bv === EMPTY) return;
    const ok = type === '=' ? av === bv : av !== bv;
    if (!ok) {
      errors.add(key(a.row, a.col));
      errors.add(key(b.row, b.col));
    }
  });

  return errors;
};

export const isTangoSolved = (grid, size, constraints) => {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) if (grid[r][c] === EMPTY) return false;
  }
  const half = size / 2;
  for (let i = 0; i < size; i++) {
    let rowSun = 0;
    let colSun = 0;
    for (let j = 0; j < size; j++) {
      if (grid[i][j] === SUN) rowSun++;
      if (grid[j][i] === SUN) colSun++;
      if (j >= 2) {
        if (grid[i][j] === grid[i][j - 1] && grid[i][j] === grid[i][j - 2])
          return false;
        if (grid[j][i] === grid[j - 1][i] && grid[j][i] === grid[j - 2][i])
          return false;
      }
    }
    if (rowSun !== half || colSun !== half) return false;
  }
  return constraints.every((constraint) =>
    satisfiesConstraint(grid, constraint),
  );
};

const placementOk = (grid, rowCount, colCount, size, row, col, value) => {
  const half = size / 2;
  if (rowCount[row][value] + 1 > half) return false;
  if (colCount[col][value] + 1 > half) return false;
  if (col >= 2 && grid[row][col - 1] === value && grid[row][col - 2] === value)
    return false;
  if (row >= 2 && grid[row - 1][col] === value && grid[row - 2][col] === value)
    return false;
  return true;
};

const constraintsByTrigger = (constraints, size) => {
  const map = new Map();
  constraints.forEach((constraint) => {
    const trigger = Math.max(
      constraint.a.row * size + constraint.a.col,
      constraint.b.row * size + constraint.b.col,
    );
    if (!map.has(trigger)) map.set(trigger, []);
    map.get(trigger).push(constraint);
  });
  return map;
};

/**
 * Solve a Tango puzzle via backtracking, mirroring the backend generator's
 * solver. Puzzles are built to have a unique solution, so the first
 * complete grid found is returned.
 */
export const solveTango = (puzzle) => {
  const { size, given, constraints } = puzzle;
  const fixed = Array.from({ length: size }, () => new Array(size).fill(EMPTY));
  given.forEach(({ row, col, value }) => {
    fixed[row][col] = value;
  });
  const triggers = constraintsByTrigger(constraints, size);

  const grid = Array.from({ length: size }, () => new Array(size).fill(EMPTY));
  const rowCount = Array.from({ length: size }, () => [0, 0]);
  const colCount = Array.from({ length: size }, () => [0, 0]);
  let solution = null;

  const tryValue = (pos, row, col, value) => {
    if (!placementOk(grid, rowCount, colCount, size, row, col, value))
      return false;
    grid[row][col] = value;
    rowCount[row][value] += 1;
    colCount[col][value] += 1;
    const triggered = triggers.get(pos);
    const constraintsHold =
      !triggered || triggered.every((c) => satisfiesConstraint(grid, c));
    const advanced = constraintsHold && recurse(pos + 1);
    if (!advanced) {
      grid[row][col] = EMPTY;
      rowCount[row][value] -= 1;
      colCount[col][value] -= 1;
    }
    return advanced;
  };

  const recurse = (pos) => {
    if (pos === size * size) {
      solution = grid.map((row) => [...row]);
      return true;
    }
    const row = Math.floor(pos / size);
    const col = pos % size;
    const forced = fixed[row][col];
    if (forced !== EMPTY) return tryValue(pos, row, col, forced);
    return tryValue(pos, row, col, SUN) || tryValue(pos, row, col, MOON);
  };

  recurse(0);
  return solution;
};
