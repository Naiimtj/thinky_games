/**
 * Global theme store (Zustand + persist).
 *
 * Tracks the active color scheme ('light' | 'dark') and toggles the `dark`
 * class on <html> so Tailwind's `dark:` variants apply. The preference is
 * persisted to localStorage; first-time visitors follow their OS setting.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const THEME_STORAGE_KEY = 'thinky-theme';

/** Read the OS-level color scheme, defaulting to light when unavailable. */
const getSystemTheme = () =>
  globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

/** Reflect the active theme on the <html> element for Tailwind's `dark:`. */
const applyThemeClass = (theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: getSystemTheme(),

      /** Switch to an explicit theme and reflect it on <html>. */
      setTheme: (theme) => {
        applyThemeClass(theme);
        set({ theme });
      },

      /** Flip between light and dark. */
      toggleTheme: () => {
        get().setTheme(get().theme === 'dark' ? 'light' : 'dark');
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

// Apply the persisted (or system) theme at module load, before first paint,
// so there is no flash of the wrong color scheme.
applyThemeClass(useThemeStore.getState().theme);
