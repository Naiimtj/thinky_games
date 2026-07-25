/**
 * Fetch the puzzle for a game/mode.
 *
 * Daily puzzles are fetched from the backend.
 * Guest demos are local/offline and locale-aware, so unauthenticated users
 * can play without any backend call.
 * Returns `{ id, payload, seed, date, fallback, ... }` plus loading and error
 * flags so games can show a placeholder until the board is ready.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { fetchDailyPuzzle } from '../api/gamesApi';
import { useAuthStore } from '../store/useAuthStore';
import { getDemoPuzzle } from './demoPuzzles';

const initialState = () => ({ puzzle: null, loading: true, error: null });

const supportedLocales = new Set(['es', 'en', 'de']);

export const useDailyPuzzle = (gameType, mode) => {
  const { i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const locale = supportedLocales.has(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : 'es';
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let cancelled = false;
    setState(initialState());

    if (mode === 'demo' && !user) {
      const puzzle = getDemoPuzzle(gameType, locale);
      setState({
        puzzle,
        loading: false,
        error: puzzle
          ? null
          : new Error(`Missing local demo puzzle: ${gameType}`),
      });
      return () => {
        cancelled = true;
      };
    }

    fetchDailyPuzzle(gameType, mode, locale)
      .then((puzzle) => {
        if (!cancelled) setState({ puzzle, loading: false, error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        const fallback =
          mode === 'demo' ? getDemoPuzzle(gameType, locale) : null;
        setState({
          puzzle: fallback,
          loading: false,
          error: fallback ? null : error,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [gameType, mode, locale, user]);

  return state;
};
