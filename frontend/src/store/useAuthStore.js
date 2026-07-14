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

localStorage.removeItem('thinky-auth');
let sessionCheckPromise = null;

export const useAuthStore = create((set, get) => ({
  user: null,
  initialized: false,

  /** Log in and load the user profile. */
  login: async ({ username, password }) => {
    useDailyGamesStore.getState().resetDaily();
    await loginUser({ username, password });
    const user = await fetchCurrentUser();
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
    useDailyGamesStore.getState().resetDaily();
    void logoutUser();
    set({ user: null, initialized: true });
  },
}));
