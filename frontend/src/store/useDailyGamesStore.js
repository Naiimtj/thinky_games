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
let gamesCatalogRequest = null;
let playedGamesRequest = null;

const isFresh = (loadedAt) =>
  loadedAt !== null && Date.now() - loadedAt < DAILY_STALE_MS;

export const useDailyGamesStore = create((set, get) => ({
  // Games catalogue: public, essentially static for the session.
  gamesCatalog: null,

  // "Today" facts shared across Home/Game/Rankings pages.
  playedGameIds: new Set(),
  dailyPlayedLoadedAt: null,
  summary: [],
  ranks: [],
  dailyTop: [],
  dailyLoadedAt: null,
  isLoadingDaily: false,
  dailyError: null,

  /** Fetch the games catalogue once per session; reused by every caller. */
  loadGamesCatalog: async () => {
    if (get().gamesCatalog !== null) return get().gamesCatalog;
    if (gamesCatalogRequest) return gamesCatalogRequest;

    gamesCatalogRequest = fetchGames()
      .then((games) => {
        set({ gamesCatalog: games });
        return games;
      })
      .catch(() => null)
      .finally(() => {
        gamesCatalogRequest = null;
      });
    return gamesCatalogRequest;
  },

  /**
   * Fetch only the played-game flags needed by Home and GamePage.
   * Skipped when a fresh copy is already cached, unless `force` is set.
   */
  loadPlayedGames: async ({ force = false } = {}) => {
    const { dailyPlayedLoadedAt } = get();
    if (!force && isFresh(dailyPlayedLoadedAt)) return;
    if (playedGamesRequest) return playedGamesRequest;

    playedGamesRequest = fetchDailyPlayedGames()
      .then((played) => {
        set({
          playedGameIds: new Set(played.game_types),
          dailyPlayedLoadedAt: Date.now(),
          dailyError: null,
        });
      })
      .catch((error) => {
        set({ dailyError: error });
      })
      .finally(() => {
        playedGamesRequest = null;
      });
    return playedGamesRequest;
  },

  /**
   * Fetch personal summary/ranks/top-3 for RankingsPage.
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
        dailyPlayedLoadedAt: Date.now(),
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
      dailyPlayedLoadedAt: null,
      summary: [],
      ranks: [],
      dailyTop: [],
      dailyLoadedAt: null,
      isLoadingDaily: false,
      dailyError: null,
    }),
}));
