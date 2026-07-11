/**
 * Shared cache for "today's daily challenge" data.
 *
 * Several pages independently needed overlapping backend calls: HomePage
 * fetched which games were already played today (for the checkmarks),
 * GamePage fetched the same fact for a single game (to lock/unlock the
 * board), and the Rankings page fetched the personal summary/ranks/top-3.
 * All of that now lives here, fetched once and reused, instead of once per
 * page visit/mount.
 *
 * Also caches the (effectively static) games catalogue from `/games`.
 */

import { create } from 'zustand';

import { fetchGames } from '../api/gamesApi';
import {
  fetchDailyPlayedGames,
  fetchDailySummary,
  fetchDailyTop,
  fetchMyRanks,
} from '../api/scoreApi';

const DAILY_STALE_MS = 60_000;

const isFresh = (loadedAt) =>
  loadedAt !== null && Date.now() - loadedAt < DAILY_STALE_MS;

export const useDailyGamesStore = create((set, get) => ({
  // Games catalogue: public, essentially static for the session.
  gamesCatalog: null,

  // "Today" facts shared across Home/Game/Rankings pages.
  playedGameIds: new Set(),
  summary: [],
  ranks: [],
  dailyTop: [],
  dailyLoadedAt: null,
  isLoadingDaily: false,
  dailyError: null,

  /** Fetch the games catalogue once per session; reused by every caller. */
  loadGamesCatalog: async () => {
    if (get().gamesCatalog !== null) return get().gamesCatalog;
    try {
      const games = await fetchGames();
      set({ gamesCatalog: games });
      return games;
    } catch {
      return null; // callers fall back to the local registry
    }
  },

  /**
   * Fetch played-today games + personal summary/ranks/top-3 together.
   * Skipped when a fresh copy is already cached, unless `force` is set.
   */
  loadDailyData: async ({ force = false } = {}) => {
    const { dailyLoadedAt, isLoadingDaily } = get();
    if (isLoadingDaily) return;
    if (!force && isFresh(dailyLoadedAt)) return;

    set({ isLoadingDaily: true, dailyError: null });
    try {
      const [played, summary, ranks, dailyTop] = await Promise.all([
        fetchDailyPlayedGames(),
        fetchDailySummary(),
        fetchMyRanks(),
        fetchDailyTop(3),
      ]);
      set({
        playedGameIds: new Set(played.game_types),
        summary,
        ranks,
        dailyTop,
        dailyLoadedAt: Date.now(),
        isLoadingDaily: false,
      });
    } catch (error) {
      set({ dailyError: error, isLoadingDaily: false });
    }
  },

  /**
   * Called right after a score submission succeeds: marks the game as
   * played immediately (no extra request, so the UI never blocks on it) and
   * refreshes the cached summary/ranks/top-3 in the background. Crucially,
   * `dailyLoadedAt` is never reset to null here — pages like GamePage treat
   * `dailyLoadedAt === null` as "still checking", so nulling it mid-session
   * would flash a loading screen instead of the just-earned win state.
   */
  markGamePlayed: (gameId) => {
    set((state) => ({
      playedGameIds: new Set(state.playedGameIds).add(gameId),
    }));
    get().loadDailyData({ force: true });
  },

  /** Wipe every cached "today" fact. Call on login/logout so accounts never share data. */
  resetDaily: () =>
    set({
      playedGameIds: new Set(),
      summary: [],
      ranks: [],
      dailyTop: [],
      dailyLoadedAt: null,
      isLoadingDaily: false,
      dailyError: null,
    }),
}));
