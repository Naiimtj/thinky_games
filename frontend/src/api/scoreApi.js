/**
 * Thin HTTP client for the Thinky Games API. Authentication uses the HttpOnly
 * session cookie managed by the browser.
 */

import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from './apiConfig';

const authOptions = { credentials: 'include' };

/**
 * An expired/invalid token (e.g. the JWT lived past its 1-day expiry) makes
 * the backend reject the request with 401 even though the frontend still
 * "thinks" the user is logged in. Force a logout + redirect so the user is
 * never left in a stale session that silently fails every request.
 */
const handleExpiredSession = (response) => {
  if (response.status === 401) {
    useAuthStore.getState().logout();
    window.location.assign('/login');
  }
};

/** Persist the final completion time for the authenticated user. */
export const submitScore = async ({
  completion_time,
  game_type = 'zip',
  locale = 'es',
  solution = null,
}) => {
  const response = await fetch(`${API_BASE_URL}/scores`, {
    method: 'POST',
    ...authOptions,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completion_time, game_type, locale, solution }),
  });

  if (!response.ok) {
    handleExpiredSession(response);
    throw new Error(`Failed to submit score (HTTP ${response.status})`);
  }
  return response.json();
};

/** Fetch a leaderboard for a period ('daily'|'monthly'|'global') and game. */
export const fetchRankings = async (period, gameType = 'zip') => {
  const response = await fetch(
    `${API_BASE_URL}/rankings?period=${period}&game_type=${gameType}`,
    authOptions,
  );

  if (!response.ok) {
    handleExpiredSession(response);
    throw new Error(`Failed to fetch rankings (HTTP ${response.status})`);
  }
  return response.json();
};

/** Game types the authenticated user already solved today, in one request. */
export const fetchDailyPlayedGames = async () => {
  const response = await fetch(`${API_BASE_URL}/scores/daily-played`, {
    ...authOptions,
  });

  if (!response.ok) {
    handleExpiredSession(response);
    throw new Error(
      `Failed to fetch daily played games (HTTP ${response.status})`,
    );
  }
  return response.json();
};

/**
 * Per-game personal stats for the authenticated user: today's time (if
 * played), trend vs their historical average, and personal best/worst times.
 */
export const fetchDailySummary = async () => {
  const response = await fetch(`${API_BASE_URL}/scores/daily-summary`, {
    ...authOptions,
  });

  if (!response.ok) {
    handleExpiredSession(response);
    throw new Error(`Failed to fetch daily summary (HTTP ${response.status})`);
  }
  return response.json();
};

/**
 * The authenticated user's own daily/monthly/global rank for every game
 * they've played (one entry per game type they have scores for).
 */
export const fetchMyRanks = async () => {
  const response = await fetch(`${API_BASE_URL}/rankings/me`, {
    ...authOptions,
  });

  if (!response.ok) {
    handleExpiredSession(response);
    throw new Error(`Failed to fetch my ranks (HTTP ${response.status})`);
  }
  return response.json();
};

/** The authenticated user's own scores for a game, fastest first. */
export const fetchMyScores = async (gameType = 'zip') => {
  const response = await fetch(
    `${API_BASE_URL}/scores/me?game_type=${gameType}`,
    { ...authOptions },
  );

  if (!response.ok) {
    handleExpiredSession(response);
    throw new Error(`Failed to fetch my scores (HTTP ${response.status})`);
  }
  return response.json();
};

/** Top N entries of today's leaderboard for every game with scores today. */
export const fetchDailyTop = async (limit = 3) => {
  const response = await fetch(
    `${API_BASE_URL}/rankings/daily-top?limit=${limit}`,
    authOptions,
  );

  if (!response.ok) {
    handleExpiredSession(response);
    throw new Error(
      `Failed to fetch daily top rankings (HTTP ${response.status})`,
    );
  }
  return response.json();
};
