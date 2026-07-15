/**
 * Fetch the puzzle for a game/mode.
 *
 * Both daily and demo puzzles are fetched from the backend so word games use
 * content appropriate to the selected locale. Spanish demo data remains a
 * fallback when the API is unavailable.
 * Returns `{ id, payload, seed, date, fallback, ... }` plus loading and error
 * flags so games can show a placeholder until the board is ready.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { fetchDailyPuzzle } from '../api/gamesApi';
import { DEMO_PUZZLES } from './demoPuzzles';

const initialState = () => ({ puzzle: null, loading: true, error: null });

const supportedLocales = new Set(['es', 'en', 'de']);

export const useDailyPuzzle = (gameType, mode) => {
  const { i18n } = useTranslation();
  const locale = supportedLocales.has(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : 'es';
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let cancelled = false;
    setState(initialState());

    fetchDailyPuzzle(gameType, mode, locale)
      .then((puzzle) => {
        if (!cancelled) setState({ puzzle, loading: false, error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        const fallback =
          mode === 'demo' && locale === 'es' ? DEMO_PUZZLES[gameType] : null;
        setState({
          puzzle: fallback,
          loading: false,
          error: fallback ? null : error,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [gameType, mode, locale]);

  return state;
};
