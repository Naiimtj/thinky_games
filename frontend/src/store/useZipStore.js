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
   * Start or resume a stroke. Grabbing the current head resumes drawing from
   * there. Pressing any checkpoint that is already part of the path rewinds
   * the path back to that checkpoint. Pressing checkpoint "1" starts fresh
   * when it is not yet on the path.
   */
  beginPath: (cell) =>
    set((state) => {
      if (isPuzzleSolved(state.puzzle, state.currentPath)) return state;

      const head = state.currentPath[state.currentPath.length - 1];
      if (head && coordsEqual(head, cell)) {
        return { isDrawing: true };
      }

      const clickedCheckpoint = state.puzzle.checkpoints.find(
        (c) => c.row === cell.row && c.col === cell.col,
      );
      if (!clickedCheckpoint) return state;

      const checkpointIndex = state.currentPath.findIndex((step) =>
        coordsEqual(step, cell),
      );
      if (checkpointIndex >= 0) {
        return {
          isDrawing: true,
          currentPath: state.currentPath.slice(0, checkpointIndex + 1),
        };
      }

      if (clickedCheckpoint.order !== 1) return state;

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
