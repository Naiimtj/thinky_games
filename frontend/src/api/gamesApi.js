/** HTTP calls for the backend-generated games catalogue and daily puzzles. */

import { API_BASE_URL } from './apiConfig';

/** List the games the backend can serve (id, name, tagline, emoji, playable). */
export const fetchGames = async () => {
  const response = await fetch(`${API_BASE_URL}/games`);
  if (!response.ok) {
    throw new Error(`Failed to fetch games (HTTP ${response.status})`);
  }
  return response.json();
};

/**
 * Fetch a game puzzle for a locale. The response never includes the solution
 * — win checking happens server-side on score submit.
 */
export const fetchDailyPuzzle = async (
  gameType,
  mode = 'daily',
  locale = 'es',
) => {
  const query = new URLSearchParams({ mode, lang: locale });
  const response = await fetch(
    `${API_BASE_URL}/games/${gameType}/daily?${query}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch puzzle (HTTP ${response.status})`);
  }
  return response.json();
};
