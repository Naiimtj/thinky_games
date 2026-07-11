/**
 * Global authentication store (Zustand + persist).
 *
 * Holds the bearer token and the current user, persisted to localStorage so the
 * session survives reloads. Non-authenticated visitors have `token === null`.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { fetchCurrentUser, loginUser, registerUser } from '../api/authApi';
import { useDailyGamesStore } from './useDailyGamesStore';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      /** Log in and load the user profile. */
      login: async ({ username, password }) => {
        useDailyGamesStore.getState().resetDaily();
        const { access_token: token } = await loginUser({ username, password });
        const user = await fetchCurrentUser(token);
        set({ token, user });
        return user;
      },

      /** Register, then immediately log in. */
      register: async ({ username, email, password }) => {
        await registerUser({ username, email, password });
        return get().login({ username, password });
      },

      /** Clear the session. */
      logout: () => {
        useDailyGamesStore.getState().resetDaily();
        set({ token: null, user: null });
      },
    }),
    {
      name: 'thinky-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);

/** Read the current token outside React (e.g. from the API client). */
export const getAuthToken = () => useAuthStore.getState().token;
