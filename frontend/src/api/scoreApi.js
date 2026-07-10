/**
 * Thin HTTP client for the Thinky Games API. The bearer token is read from the
 * auth store (which persists it to localStorage), so it survives reloads.
 */

import { getAuthToken } from '../store/useAuthStore';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** Persist the final completion time for the authenticated user. */
export const submitScore = async ({
  completion_time,
  game_type = 'zip',
  solution = null,
}) => {
  const response = await fetch(`${API_BASE_URL}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ completion_time, game_type, solution }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit score (HTTP ${response.status})`);
  }
  return response.json();
};

/** Fetch a leaderboard for a period ('daily'|'monthly'|'global') and game. */
export const fetchRankings = async (period, gameType = 'zip') => {
  const response = await fetch(
    `${API_BASE_URL}/rankings?period=${period}&game_type=${gameType}`,
    { headers: { ...authHeaders() } },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch rankings (HTTP ${response.status})`);
  }
  return response.json();
};

/** Whether the authenticated user already solved today's daily puzzle. */
export const fetchDailyStatus = async (gameType = 'zip') => {
  const response = await fetch(
    `${API_BASE_URL}/scores/daily-status?game_type=${gameType}`,
    { headers: { ...authHeaders() } },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch daily status (HTTP ${response.status})`);
  }
  return response.json();
};

/** Game types the authenticated user already solved today, in one request. */
export const fetchDailyPlayedGames = async () => {
  const response = await fetch(`${API_BASE_URL}/scores/daily-played`, {
    headers: { ...authHeaders() },
  });

  if (!response.ok) {
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
    headers: { ...authHeaders() },
  });

  if (!response.ok) {
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
    headers: { ...authHeaders() },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch my ranks (HTTP ${response.status})`);
  }
  return response.json();
};

/** The authenticated user's own scores for a game, fastest first. */
export const fetchMyScores = async (gameType = 'zip') => {
  const response = await fetch(
    `${API_BASE_URL}/scores/me?game_type=${gameType}`,
    { headers: { ...authHeaders() } },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch my scores (HTTP ${response.status})`);
  }
  return response.json();
};
