/** HTTP calls for the backend-generated games catalogue and daily puzzles. */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

/** List the games the backend can serve (id, name, tagline, emoji, playable). */
export const fetchGames = async () => {
  const response = await fetch(`${API_BASE_URL}/games`);
  if (!response.ok) {
    throw new Error(`Failed to fetch games (HTTP ${response.status})`);
  }
  return response.json();
};

/**
 * Fetch today's daily puzzle for a game. Demo puzzles are hardcoded on the
 * frontend (see `../games/demoPuzzles.js`) and never go through this API.
 * The response never includes the solution — win checking happens
 * server-side on score submit.
 */
export const fetchDailyPuzzle = async (gameType, mode = 'daily') => {
  const response = await fetch(
    `${API_BASE_URL}/games/${gameType}/daily?mode=${mode}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch puzzle (HTTP ${response.status})`);
  }
  return response.json();
};
