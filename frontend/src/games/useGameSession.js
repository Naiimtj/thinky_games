/**
 * Shared game session: an ascending timer plus one-shot score submission.
 *
 * The clock counts up while playing and freezes on win. Only the authenticated
 * daily challenge submits its time to the leaderboard. Manually resetting the
 * board (the "Reiniciar" button) never restarts the clock — only loading a
 * new puzzle does.
 *
 * Progress (elapsed time + win state) is mirrored to localStorage per
 * game/mode/puzzle, so refreshing the page resumes mid-game instead of
 * resetting. Once a game is won, its storage is dropped rather than kept
 * around: a demo win clears it immediately (replaying should start fresh),
 * and a daily win clears it after the celebration once the score is confirmed
 * saved on the backend, which is the source of truth from then on.
 */

import { useEffect, useRef, useState } from 'react';

import { submitScore } from '../api/scoreApi';
import { useAuthStore } from '../store/useAuthStore';
import { useDailyGamesStore } from '../store/useDailyGamesStore';
import {
  buildStorageKey,
  clearGameStorage,
  readStorage,
  writeStorage,
} from './gamePersistence';

export const GAME_STATE = { PLAYING: 'PLAYING', WON: 'WON' };
const DAILY_CELEBRATION_MS = 5_000;

export const useGameSession = ({
  gameId,
  mode,
  puzzleId,
  locale = 'es',
  isSolved,
  getSolution,
}) => {
  const storageKey = buildStorageKey(gameId, mode, puzzleId, 'session');

  const [elapsed, setElapsed] = useState(
    () => readStorage(storageKey)?.elapsed ?? 0,
  );
  const [state, setState] = useState(
    () => readStorage(storageKey)?.state ?? GAME_STATE.PLAYING,
  );
  const hasSubmitted = useRef(false);
  // Kept in a ref so the win effect reads the latest solution without
  // re-subscribing on every board change.
  const getSolutionRef = useRef(getSolution);
  getSolutionRef.current = getSolution;

  // Re-sync whenever the puzzle changes (new storage key) instead of keeping
  // the previous puzzle's timer/state around.
  useEffect(() => {
    const saved = readStorage(storageKey);
    setElapsed(saved?.elapsed ?? 0);
    setState(saved?.state ?? GAME_STATE.PLAYING);
    hasSubmitted.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (state !== GAME_STATE.PLAYING) return undefined;
    const intervalId = setInterval(
      () => setElapsed((value) => value + 1),
      1000,
    );
    return () => clearInterval(intervalId);
  }, [state]);

  useEffect(() => {
    if (state === GAME_STATE.PLAYING && isSolved) setState(GAME_STATE.WON);
  }, [isSolved, state]);

  useEffect(() => {
    if (state !== GAME_STATE.WON || hasSubmitted.current) return;
    // Belt-and-suspenders: if the store already knows this game was played
    // today (e.g. after a StrictMode remount clears local state but the
    // Zustand store survives), treat it as already submitted instead of
    // sending a duplicate request that would fail validation.
    if (
      mode === 'daily' &&
      useDailyGamesStore.getState().playedGameIds.has(gameId)
    ) {
      hasSubmitted.current = true;
      return;
    }
    hasSubmitted.current = true;
    if (mode === 'daily' && useAuthStore.getState().user) {
      submitScore({
        completion_time: elapsed,
        game_type: gameId,
        locale,
        solution: getSolutionRef.current?.() ?? null,
      })
        .then(() => {
          // Keep the solved board available during the celebration. Cleanup
          // after it finishes, once GamePage is ready to show the leaderboard.
          useDailyGamesStore.getState().markGamePlayed(gameId);
          setTimeout(
            () => clearGameStorage(gameId, mode, puzzleId),
            DAILY_CELEBRATION_MS,
          );
        })
        .catch(() => {
          hasSubmitted.current = false;
        });
    }
  }, [state, elapsed, gameId, locale, mode, puzzleId]);

  // Persist progress so a reload resumes mid-game. A finished demo puzzle
  // clears its storage on win (see above for daily): since demos never
  // change, reloading after winning one starts a fresh attempt rather than
  // reopening the solved board.
  useEffect(() => {
    if (!storageKey) return;
    if (state === GAME_STATE.WON && mode === 'demo') {
      clearGameStorage(gameId, mode, puzzleId);
      return;
    }
    writeStorage(storageKey, { elapsed, state });
  }, [storageKey, elapsed, state, mode, gameId, puzzleId]);

  // Resetting the board is not a new attempt: the clock keeps running so
  // restarting never gives back time already spent.
  const reset = () => {
    hasSubmitted.current = false;
    setState(GAME_STATE.PLAYING);
  };

  const addSeconds = (seconds) => setElapsed((value) => value + seconds);

  return { elapsed, state, reset, addSeconds };
};
