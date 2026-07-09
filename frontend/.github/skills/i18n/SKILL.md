# Internationalization (i18n)

> **Standby — not currently adopted.** No i18n library is installed and no `locales/` folder exists. All user-facing text is hardcoded directly in JSX (currently in Spanish, e.g. `src/components/Layout.jsx`). This skill/agent is kept on standby for when the project adopts an i18n library.

## Current Convention (until i18n is adopted)

- Hardcode user-facing text directly in JSX, matching the existing language and tone (Spanish)
- Do **not** invent `$t()`, `useTranslation()`, or locale JSON files — none of this exists in the codebase today
- Keep text consistent with existing labels (e.g. "Entrar", "Salir", "Registrarse", "Inicio" in `Layout.jsx`)

## If/When i18n Is Adopted

The natural fit for Vite + React is **`react-i18next`** (or `react-intl`). When the user decides to adopt one:

1. Confirm the library and locale set with the user (e.g. `es` as source language, given existing hardcoded Spanish text)
2. Create `src/locales/{lang}.json` files and update `.github/copilot-instructions.md` + this skill with the actual convention
3. Migrate hardcoded strings incrementally — don't attempt a big-bang rewrite unless asked
4. Re-run `/init-github` or manually update `.github/TOOLS.md` (i18n agent file scope) once locale files exist

## Suggested Key Naming (once adopted)

| Scope            | Pattern                         | Example                                |
| ------------------ | ---------------------------------- | ------------------------------------------|
| Page-specific     | `{page}.{label}`                  | `rankingsPage.title`                    |
| Feature-specific  | `{feature}.{label}`               | `authForm.submit`                       |
| Shared labels     | `shared.{label}`                  | `shared.loading`, `shared.error`         |

Do not create these files or keys until the user explicitly adopts an i18n library.
