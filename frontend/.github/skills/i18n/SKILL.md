# Internationalization (i18n)

The frontend uses **`react-i18next`** with `i18next-browser-languagedetector`.
Configuration is in `src/i18n/index.js` and locales are in `src/locales/{es,en,de}.json`.
Spanish (`es`) is the source/fallback language.

## Current Convention

- Use `useTranslation()` from `react-i18next` inside components
- Keep user-facing text in locale JSON files, not hardcoded in JSX
- Always update `es`, `en` and `de` locale files together
- Use `t('key', { value })` for interpolated strings and `t('key', defaultValue)` for fallbacks

## Key Naming

| Scope            | Pattern                  | Example                          |
| ---------------- | ------------------------ | -------------------------------- |
| Page-specific    | `{page}.{label}`         | `rankingsPage.title`             |
| Feature-specific | `{feature}.{label}`      | `authForm.submit`                |
| Shared labels    | `shared.{label}`         | `shared.loading`, `shared.error` |
| Game metadata    | `games.{gameId}.{label}` | `games.crossword.name`           |
