/**
 * Global authentication store.
 *
 * Holds the current user. The session token stays in an HttpOnly cookie and is
 * never exposed to JavaScript.
 */

import { create } from 'zustand';
import {
  fetchCurrentUser,
  hasSessionHint,
  loginUser,
  logoutUser,
  registerUser,
} from '../api/authApi';
import { useDailyGamesStore } from './useDailyGamesStore';
import { useZipStore } from './useZipStore';

try {
  localStorage.removeItem('thinky-auth');
} catch {
  // ignore
}

const LOCAL_STORAGE_KEYS_TO_KEEP = [
  'i18nextLng',
  'LOCATOR_OPTIONS',
  'thinky-theme',
];

const clearBrowserStorage = () => {
  try {
    const preserved = LOCAL_STORAGE_KEYS_TO_KEEP.reduce((acc, key) => {
      const value = localStorage.getItem(key);
      if (value !== null) acc[key] = value;
      return acc;
    }, {});
    localStorage.clear();
    Object.entries(preserved).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  } catch {
    // ignore
  }
  try {
    sessionStorage.clear();
  } catch {
    // ignore
  }
};

const resetClientGameState = () => {
  useDailyGamesStore.getState().resetDaily();
  useZipStore.getState().resetGame();
  clearBrowserStorage();
};

let sessionCheckPromise = null;

export const useAuthStore = create((set, get) => ({
  user: null,
  initialized: false,

  setUser: (user) => set({ user, initialized: true }),

  /** Log in and load the user profile. */
  login: async ({ username, password }) => {
    useDailyGamesStore.getState().resetDaily();
    await loginUser({ username, password });
    const user = await fetchCurrentUser();
    resetClientGameState();
    set({ user, initialized: true });
    return user;
  },

  /** Register, then immediately log in. */
  register: async ({ username, email, password }) => {
    await registerUser({ username, email, password });
    return get().login({ username, password });
  },

  checkSession: async () => {
    if (get().initialized) return;
    if (!hasSessionHint()) {
      set({ initialized: true });
      return;
    }
    if (sessionCheckPromise) return sessionCheckPromise;

    sessionCheckPromise = fetchCurrentUser()
      .then((user) => set({ user, initialized: true }))
      .catch(() => set({ user: null, initialized: true }))
      .finally(() => {
        sessionCheckPromise = null;
      });
    return sessionCheckPromise;
  },

  /** Clear the session. */
  logout: () => {
    resetClientGameState();
    void logoutUser();
    set({ user: null, initialized: true });
  },
}));
