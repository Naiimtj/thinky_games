/**
 * Global Zip game store (Zustand).
 *
 * Responsibilities:
 *  - Hold the puzzle, grid and the path currently being drawn.
 *  - Expose small, intention-revealing actions to mutate that state.
 *
 * Timing, win detection and score submission are handled by the shared
 * `useGameSession` hook, same as every other game in the app.
 */

import { create } from 'zustand';

import { DEFAULT_PUZZLE } from '../data/puzzles';
import {
  buildGrid,
  buildWallSet,
  canConnect,
  coordsEqual,
  isPuzzleSolved,
  pathIncludes,
} from '../logic/zipLogic';

/** Build the pristine state for a given puzzle. */
const createInitialState = (puzzle) => ({
  puzzle,
  grid: buildGrid(puzzle),
  currentPath: [],
  isDrawing: false,
});

/** True when moving to `cell` means stepping back onto the previous cell. */
const isBacktrackStep = (path, cell) =>
  path.length >= 2 && coordsEqual(path[path.length - 2], cell);

export const useZipStore = create((set, get) => ({
  ...createInitialState(DEFAULT_PUZZLE),

  /** Load a puzzle from scratch (resets the drawn path). */
  initGame: (puzzle = DEFAULT_PUZZLE) => set(createInitialState(puzzle)),

  /** Restart the currently loaded puzzle. */
  resetGame: () => set(createInitialState(get().puzzle)),

  /**
   * Start a stroke. Following LinkedIn's Zip, a new stroke may only begin
   * on the "1" checkpoint; grabbing the current head resumes the stroke.
   */
  beginPath: (cell) =>
    set((state) => {
      if (isPuzzleSolved(state.puzzle, state.currentPath)) return state;

      const head = state.currentPath[state.currentPath.length - 1];
      if (head && coordsEqual(head, cell)) {
        return { isDrawing: true };
      }

      const start = state.puzzle.checkpoints.find((c) => c.order === 1);
      const canStartHere =
        start && start.row === cell.row && start.col === cell.col;
      if (!canStartHere) return state;

      return { isDrawing: true, currentPath: [cell] };
    }),

  /** Extend the current stroke to an adjacent cell (or backtrack). */
  extendPath: (cell) => {
    const state = get();
    if (!state.isDrawing || isPuzzleSolved(state.puzzle, state.currentPath)) {
      return;
    }

    const { currentPath, puzzle } = state;
    const head = currentPath[currentPath.length - 1];
    if (!head || coordsEqual(head, cell)) return;

    if (isBacktrackStep(currentPath, cell)) {
      set({ currentPath: currentPath.slice(0, -1) });
      return;
    }

    const wallSet = buildWallSet(puzzle.walls);
    const canExtend =
      canConnect(wallSet, head, cell) && !pathIncludes(currentPath, cell);
    if (!canExtend) return;

    set({ currentPath: [...currentPath, cell] });
  },

  /** Finish the current stroke without clearing the drawn path. */
  endPath: () => set({ isDrawing: false }),

  /** Replace the drawn path outright (used to resume a persisted session). */
  restorePath: (path) => set({ currentPath: path ?? [] }),
}));
