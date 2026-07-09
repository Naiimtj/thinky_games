/**
 * Pure grid logic for the Zip puzzle.
 *
 * These helpers hold no React or store state. They describe the rules of the
 * game so both the store and the UI can rely on a single, testable source of
 * truth. Every function does exactly one thing.
 */

/** Build a stable string key for a coordinate. */
export const cellKey = (row, col) => `${row},${col}`;

/** Return true when two coordinates point to the same cell. */
export const coordsEqual = (first, second) =>
  first.row === second.row && first.col === second.col;

/** Return true when two cells share an edge (never diagonally). */
export const areAdjacent = (first, second) => {
  const rowDistance = Math.abs(first.row - second.row);
  const colDistance = Math.abs(first.col - second.col);
  return rowDistance + colDistance === 1;
};

/** Order-independent key that identifies the wall between two cells. */
const wallKey = (first, second) =>
  [cellKey(first.row, first.col), cellKey(second.row, second.col)]
    .sort()
    .join('|');

/** Build a Set of blocked edges from the puzzle's wall list. */
export const buildWallSet = (walls = []) => {
  const blockedEdges = new Set();
  walls.forEach(({ from, to }) => blockedEdges.add(wallKey(from, to)));
  return blockedEdges;
};

/** Return true when a wall blocks movement between two cells. */
export const isBlockedByWall = (wallSet, first, second) =>
  wallSet.has(wallKey(first, second));

/** Return true when the player may move directly between two cells. */
export const canConnect = (wallSet, first, second) =>
  areAdjacent(first, second) && !isBlockedByWall(wallSet, first, second);

/** Return true when the path already visited the given cell. */
export const pathIncludes = (path, cell) =>
  path.some((step) => coordsEqual(step, cell));

/** Total number of cells in a square grid of the given size. */
export const totalCells = (size) => size * size;

/** Build the 2D grid model, tagging cells that carry a checkpoint number. */
export const buildGrid = (puzzle) => {
  const checkpointByKey = new Map(
    puzzle.checkpoints.map((checkpoint) => [
      cellKey(checkpoint.row, checkpoint.col),
      checkpoint.order,
    ]),
  );

  return Array.from({ length: puzzle.size }, (_row, row) =>
    Array.from({ length: puzzle.size }, (_col, col) => ({
      row,
      col,
      checkpoint: checkpointByKey.get(cellKey(row, col)) ?? null,
    })),
  );
};

/** Return true once every cell on the grid has been visited. */
export const areAllCellsFilled = (path, size) =>
  path.length === totalCells(size);

const isStrictlyAscending = (values) =>
  values.every((value, index) => index === 0 || value > values[index - 1]);

/**
 * Return true when the path crosses the checkpoints in ascending order and
 * touches every one of them.
 */
export const isCheckpointOrderRespected = (path, checkpoints) => {
  const orderByKey = new Map(
    checkpoints.map((checkpoint) => [
      cellKey(checkpoint.row, checkpoint.col),
      checkpoint.order,
    ]),
  );

  const visitedOrders = path
    .map((step) => orderByKey.get(cellKey(step.row, step.col)))
    .filter((order) => order !== undefined);

  return (
    visitedOrders.length === checkpoints.length &&
    isStrictlyAscending(visitedOrders)
  );
};

/**
 * The puzzle is solved when the single continuous path fills the whole grid
 * and visits the numbered checkpoints in ascending order.
 */
export const isPuzzleSolved = (puzzle, path) =>
  areAllCellsFilled(path, puzzle.size) &&
  isCheckpointOrderRespected(path, puzzle.checkpoints);

/**
 * Convert the puzzle walls into drawable segments in grid coordinates, where
 * cell (row, col) spans the unit square from (col, row) to (col+1, row+1).
 * Used by the SVG overlay to render walls as thick barriers between cells.
 */
export const getWallSegments = (walls = []) =>
  walls.map(({ from, to }) => {
    if (from.row === to.row) {
      const x = Math.max(from.col, to.col);
      return { x1: x, y1: from.row, x2: x, y2: from.row + 1 };
    }
    const y = Math.max(from.row, to.row);
    return { x1: from.col, y1: y, x2: from.col + 1, y2: y };
  });

/** In-bounds neighbours of a cell (never diagonally). */
const neighboursOf = (cell, size) =>
  [
    { row: cell.row - 1, col: cell.col },
    { row: cell.row + 1, col: cell.col },
    { row: cell.row, col: cell.col - 1 },
    { row: cell.row, col: cell.col + 1 },
  ].filter(({ row, col }) => row >= 0 && row < size && col >= 0 && col < size);

/**
 * Solve a Zip puzzle via depth-first search over the constrained Hamiltonian
 * path space, mirroring the backend generator's solver. Puzzles are built to
 * have a unique solution, so the first complete path found is returned.
 */
export const solveZip = (puzzle) => {
  const { size, checkpoints, walls } = puzzle;
  const start = checkpoints.find((checkpoint) => checkpoint.order === 1);
  if (!start) return null;

  const wallSet = buildWallSet(walls);
  const orderByKey = new Map(
    checkpoints.map((checkpoint) => [
      cellKey(checkpoint.row, checkpoint.col),
      checkpoint.order,
    ]),
  );
  const total = totalCells(size);
  const visited = new Set([cellKey(start.row, start.col)]);
  const trail = [{ row: start.row, col: start.col }];
  let solution = null;

  const dfs = (cell, nextExpected) => {
    if (solution || trail.length === total) {
      if (!solution && trail.length === total) solution = [...trail];
      return;
    }
    for (const neighbour of neighboursOf(cell, size)) {
      if (solution) return;
      const key = cellKey(neighbour.row, neighbour.col);
      if (visited.has(key) || !canConnect(wallSet, cell, neighbour)) continue;

      const order = orderByKey.get(key);
      if (order !== undefined && order !== nextExpected) continue;

      visited.add(key);
      trail.push(neighbour);
      dfs(neighbour, order === undefined ? nextExpected : nextExpected + 1);
      trail.pop();
      visited.delete(key);
    }
  };

  dfs(start, 2);
  return solution;
};
