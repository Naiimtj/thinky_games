/**
 * localStorage-backed persistence so board progress and elapsed time survive
 * page reloads. Keys are scoped per game/mode/puzzle so switching puzzles
 * (a new daily challenge) never leaks state from a previous one.
 */

import { useEffect, useState } from 'react';

const PREFIX = 'thinky:game';

/** Build a storage key, or null when there's no puzzle to scope it to yet. */
export const buildStorageKey = (gameId, mode, puzzleId, part) =>
  puzzleId ? `${PREFIX}:${gameId}:${mode}:${puzzleId}:${part}` : null;

export const readStorage = (key) => {
  if (!key) return undefined;
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export const writeStorage = (key, value) => {
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable or full — progress just won't persist.
  }
};

/** Remove every persisted entry for a given game/mode/puzzle (session + board). */
export const clearGameStorage = (gameId, mode, puzzleId) => {
  const prefix = buildStorageKey(gameId, mode, puzzleId, '');
  if (!prefix) return;
  try {
    Object.keys(localStorage)
      .filter((storedKey) => storedKey.startsWith(prefix))
      .forEach((storedKey) => localStorage.removeItem(storedKey));
  } catch {
    // ignore
  }
};

/**
 * Drop-in replacement for `useState` whose value is mirrored to
 * localStorage under `storageKey`. When `storageKey` changes (a new puzzle
 * loaded) it re-syncs from storage instead of keeping the previous puzzle's
 * value around.
 */
export const usePersistedState = (storageKey, createInitial) => {
  const [value, setValue] = useState(() => {
    const saved = readStorage(storageKey);
    return saved === undefined ? createInitial() : saved;
  });

  useEffect(() => {
    const saved = readStorage(storageKey);
    setValue(saved === undefined ? createInitial() : saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    writeStorage(storageKey, value);
  }, [storageKey, value]);

  return [value, setValue];
};
