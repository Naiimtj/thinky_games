/**
 * Fetch the puzzle for a game/mode.
 *
 * 'daily' puzzles are generated on the backend, so this hook fetches today's
 * board through the API. 'demo' puzzles are hardcoded on the frontend (see
 * `demoPuzzles.js`) and are never fetched from the backend, so demo boards
 * are always the same and never depend on network/backend availability.
 * Returns `{ id, payload, seed, date, fallback, ... }` plus loading and error
 * flags so games can show a placeholder until the board is ready.
 */

import { useEffect, useState } from 'react';

import { fetchDailyPuzzle } from '../api/gamesApi';
import { DEMO_PUZZLES } from './demoPuzzles';

const initialState = (gameType, mode) =>
  mode === 'demo'
    ? { puzzle: DEMO_PUZZLES[gameType] ?? null, loading: false, error: null }
    : { puzzle: null, loading: true, error: null };

export const useDailyPuzzle = (gameType, mode) => {
  const [state, setState] = useState(() => initialState(gameType, mode));

  useEffect(() => {
    if (mode === 'demo') {
      setState(initialState(gameType, mode));
      return undefined;
    }

    let cancelled = false;
    setState({ puzzle: null, loading: true, error: null });

    fetchDailyPuzzle(gameType, mode)
      .then((puzzle) => {
        if (!cancelled) setState({ puzzle, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ puzzle: null, loading: false, error });
      });

    return () => {
      cancelled = true;
    };
  }, [gameType, mode]);

  return state;
};
