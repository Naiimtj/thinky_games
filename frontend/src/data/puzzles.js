/**
 * Zip puzzle definitions.
 *
 * A puzzle is described by:
 *  - `size`: the grid is `size x size`.
 *  - `checkpoints`: numbered cells that must be visited in ascending `order`.
 *  - `walls`: blocked edges between two adjacent cells. The path may never
 *    cross a wall, exactly like LinkedIn's Zip.
 *
 * This puzzle has a single, unique solution: one continuous path that starts
 * on "1", visits every number in ascending order and fills all 36 cells.
 */
export const ZIP_PUZZLES = [
  {
    id: 'zip-6x6-001',
    size: 6,
    checkpoints: [
      { row: 5, col: 2, order: 1 },
      { row: 5, col: 1, order: 2 },
      { row: 0, col: 3, order: 3 },
      { row: 0, col: 4, order: 4 },
      { row: 3, col: 5, order: 5 },
      { row: 5, col: 5, order: 6 },
      { row: 3, col: 3, order: 7 },
      { row: 1, col: 1, order: 8 },
    ],
    walls: [
      { from: { row: 2, col: 1 }, to: { row: 3, col: 1 } },
      { from: { row: 2, col: 2 }, to: { row: 2, col: 3 } },
      { from: { row: 4, col: 2 }, to: { row: 5, col: 2 } },
      { from: { row: 3, col: 0 }, to: { row: 4, col: 0 } },
      { from: { row: 2, col: 2 }, to: { row: 3, col: 2 } },
      { from: { row: 4, col: 4 }, to: { row: 4, col: 5 } },
      { from: { row: 1, col: 1 }, to: { row: 1, col: 2 } },
      { from: { row: 1, col: 4 }, to: { row: 1, col: 5 } },
    ],
  },
];

export const DEFAULT_PUZZLE = ZIP_PUZZLES[0];
