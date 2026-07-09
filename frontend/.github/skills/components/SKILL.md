# Component Library

Stack: **React 18 functional components** (JSX) — no UI library (no PrimeVue/shadcn/Vuetify). No enforced base/shared/feature hierarchy; the project uses a flat layout.

## Folder Layout

```
src/components/    ← shared UI used across pages (flat, no tiers)
src/pages/         ← route-level components (rendered by react-router-dom)
src/games/{game}/  ← one self-contained folder per puzzle game
```

### Shared components (`src/components/`)

- Flat folder — no `base/`/`shared/`/`feature/` subfolders
- Used across 2+ pages or games (e.g. `Layout.jsx`, `AuthForm.jsx`, `Leaderboard.jsx`, `ProtectedRoute.jsx`, `ZipCell.jsx`, `ZipGameBoard.jsx`)
- Before creating a new one, check this folder for an existing component that already does the job

### Page components (`src/pages/`)

- One component per route, wired manually in `src/App.jsx` via `<Routes>`/`<Route>`
- Examples: `HomePage.jsx`, `GamePage.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`, `RankingsPage.jsx`

### Game components (`src/games/{game}/`)

- Each game is self-contained: `{Game}Game.jsx` (component) + `{game}Logic.js` (pure client-side helper logic, e.g. input validation) — puzzle data itself is fetched from the backend via `useDailyPuzzle` (`src/games/useDailyPuzzle.js`), there's no local `*Puzzles.js`/`*Categories.js` file per game anymore
- Registered centrally in `src/games/registry.jsx`, rendered through `src/games/GameShell.jsx`
- Games render `PuzzleGate` (`src/games/PuzzleGate.jsx`) to show loading/error state while the puzzle is fetched
- Win detection now happens server-side on score submit (`useGameSession` → `submitScore`) — client-side `*Logic.js` may still validate input/moves locally for UX, but is not the source of truth for scoring

## Component Creation Rules

### Props

- Plain JS objects — no TypeScript interfaces, no PropTypes enforced today
- Destructure props in the function signature with default values via JS default parameters

```jsx
const AuthForm = ({ mode = 'login', onSubmit }) => {
  // ...
};
```

### Events

- Standard React event handler props (`onClick`, `onChange`, `onSubmit`) — no custom event-emitter pattern
- Name handler props starting with `on` (`onSelect`, `onComplete`)

### Composition

- Prefer composition (children, small focused components) over large monolithic components
- Extract a sub-component when a JSX block exceeds ~30 lines or is reused

## Component Simplicity

Move logic out of components:

| Logic type                                       | Move to                                  |
| ------------------------------------------------ | ---------------------------------------- |
| Global shared state                              | `src/store/use*Store.js` (Zustand)       |
| Per-component reactive/stateful logic            | custom hook (`use*.js`, colocated)       |
| Pure data transform / win-condition / validation | `src/logic/*.js` or a game's `*Logic.js` |
| Template derivation (no side effects)            | `useMemo()` in the component             |

Components should handle **rendering** and **user interaction delegation only**.

## i18n in Components

- No i18n library is installed — hardcode user-facing text directly in JSX, matching the existing language/tone (currently Spanish, see `Layout.jsx`)
- Do not invent `$t()` or `useTranslation()` calls — this pattern doesn't exist in the codebase

## Duplication Check

Before creating any component:

1. Search `src/components/` for an existing component that covers the need
2. Search the relevant `src/games/{game}/` folder if the component is game-specific
3. If a pattern appears in **2+ places**, extract it into `src/components/`

## Component Review Checklist

- [ ] Functional component using hooks — no class components
- [ ] Props destructured in the function signature, sensible defaults
- [ ] No hardcoded logic that belongs in a `*Logic.js` module or store
- [ ] Styling uses TailwindCSS utility classes (see `styling/SKILL.md`)
- [ ] Logic not left in the component — moved to store / hook / logic module
- [ ] Placed in the correct location (`components/`, `pages/`, or `games/{game}/`)
- [ ] No component duplication — searched existing components first
