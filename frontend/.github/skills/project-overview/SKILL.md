# Project Overview

Living reference map of **Thinky Games (frontend)** — a Vite + React 18 puzzle-game platform. Use this skill to quickly orient yourself before any task. Regenerate with `/refresh-overview` when structure changes.

## Tech Stack

| Layer      | Technology                                                    |
| ---------- | ------------------------------------------------------------- |
| Framework  | Vite + React 18                                               |
| Language   | JavaScript (JSX) — no TypeScript                              |
| Styling    | TailwindCSS v3 (PostCSS + Autoprefixer)                       |
| Components | None — plain HTML elements                                    |
| State      | Zustand (`create` + `persist`)                                |
| Routing    | react-router-dom (manual `<Routes>`/`<Route>` in `App.jsx`)   |
| i18n       | None — hardcoded Spanish text                                 |
| Testing    | Vitest installed (`npm test`) — no test files currently exist |
| HTTP       | Plain `fetch()` in `src/api/*.js`                             |
| Icons      | None installed                                                |

## Folder Map

```
src/
├── App.jsx                # Route definitions (react-router-dom)
├── main.jsx                # Entry point
├── index.css                # Global styles (Tailwind directives)
├── api/                     # HTTP calls (fetch-based), one file per domain
│   ├── authApi.js
│   ├── gamesApi.js            # Games catalogue + backend-generated puzzles
│   └── scoreApi.js
├── components/               # Shared UI, flat (no base/shared/feature tiers)
│   ├── Layout.jsx            # App shell: header, nav, <Outlet />
│   ├── AuthForm.jsx           # Login/register form
│   ├── Leaderboard.jsx        # Rankings table
│   ├── ProtectedRoute.jsx      # Auth-gated route wrapper
│   ├── ZipCell.jsx             # Zip game cell (shared render piece)
│   └── ZipGameBoard.jsx         # Zip game board (shared render piece)
├── data/
│   └── puzzles.js              # Legacy Zip fallback puzzle (initial state for useZipStore before the backend puzzle loads)
├── games/                       # One self-contained folder per puzzle game
│   ├── GameShell.jsx              # Wraps whichever game is active
│   ├── PuzzleGate.jsx               # Loading/error placeholder while the backend puzzle is fetched
│   ├── registry.jsx                # GAMES array — single source of truth for homepage + routing
│   ├── useDailyPuzzle.js             # Hook: fetches the backend-generated puzzle for a game/mode
│   ├── useDailyCountdown.js          # Hook: countdown to next daily puzzle
│   ├── useGameSession.js              # Hook: session timer + one-shot score submission
│   ├── crossclimb/  {CrossclimbGame.jsx, crossclimbLogic.js}
│   ├── patches/      {PatchesGame.jsx, patchesLogic.js}
│   ├── pinpoint/     {PinpointGame.jsx}
│   ├── queens/       {QueensGame.jsx, queensLogic.js}
│   ├── sudoku/       {SudokuGame.jsx, sudokuLogic.js}
│   ├── tango/        {TangoGame.jsx, tangoLogic.js}
│   ├── wend/         {WendGame.jsx, wendLogic.js}
│   └── zip/          {ZipGame.jsx}
├── logic/
│   └── zipLogic.js              # Pure Zip game logic (validation, solving)
├── utils/
│   ├── prng.js                   # Seeded PRNG (mulberry32) + shuffle/randInt — currently unused (kept from the pre-backend puzzle generators)
│   ├── formatTime.js             # Format seconds as mm:ss (shared by Leaderboard + GameShell)
│   └── range.js                    # Build [0..n-1] — shared array-of-indices helper
├── pages/                         # Route-level components
│   ├── HomePage.jsx
│   ├── GamePage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   └── RankingsPage.jsx
└── store/
    ├── useAuthStore.js            # Auth session (token, user) — persisted
    └── useZipStore.js              # Zip game state
```

## Pages & Routing

Routing is manual (not file-based) — defined in `src/App.jsx`:

| Route                   | Component        | Purpose                                              |
| ----------------------- | ---------------- | ---------------------------------------------------- |
| `/`                     | `HomePage`       | Game selection landing page                          |
| `/games/:gameId/:mode`  | `GamePage`       | Renders the selected game via `GameShell`/`registry` |
| `/login`                | `LoginPage`      | Login form (`AuthForm`)                              |
| `/register`             | `RegisterPage`   | Registration form (`AuthForm`)                       |
| `/rankings` (protected) | `RankingsPage`   | Leaderboard — requires auth (`ProtectedRoute`)       |
| `*`                     | Redirects to `/` | Catch-all                                            |

All routes render inside `Layout` (header/nav + `<Outlet />`).

## Store Files

All stores use **Zustand** (`create`, optionally `+ persist`). One domain per store.

| Store file         | Domain   | Key responsibilities                                                                                               |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `useAuthStore.js`  | Auth     | `token`, `user`; `login`, `register`, `logout`; persisted to `localStorage` (`thinky-auth`)                        |
| `useThemeStore.js` | Theme    | `theme` ('light'\|'dark'); `toggleTheme`, `setTheme`; toggles `dark` class on `<html>`, persisted (`thinky-theme`) |
| `useZipStore.js`   | Zip game | Zip-specific game state                                                                                            |

## Custom Hooks

| Hook                   | Location     | Purpose                                              |
| ---------------------- | ------------ | ---------------------------------------------------- |
| `useDailyPuzzle.js`    | `src/games/` | Fetches the backend-generated puzzle for a game/mode |
| `useDailyCountdown.js` | `src/games/` | Countdown timer to the next daily puzzle             |
| `useGameSession.js`    | `src/games/` | Ascending timer + one-shot score submission on win   |

## API

| File          | Purpose                                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `authApi.js`  | `registerUser`, `loginUser`, `fetchCurrentUser` — plain `fetch()` calls to `/auth/*`                                                     |
| `gamesApi.js` | `fetchGames`, `fetchDailyPuzzle(gameType, mode)` — games catalogue + backend-generated puzzle, `/games/*`                                |
| `scoreApi.js` | `submitScore`, `fetchRankings`, `fetchDailyStatus`, `fetchDailyPlayedGames` — `/scores`, `/rankings`, bearer-authed via `getAuthToken()` |

All three read `VITE_API_BASE_URL` (fallback `http://localhost:8000`). There is no `dictionaryApi.js` anymore — clue/definition data (e.g. crossclimb) is now part of the puzzle payload returned by `fetchDailyPuzzle`.

## Logic Modules

| File                              | Purpose                                                                |
| --------------------------------- | ---------------------------------------------------------------------- |
| `src/logic/zipLogic.js`           | Pure Zip game logic (path validation, solving)                         |
| `src/games/{game}/{game}Logic.js` | Per-game pure logic (crossclimb, patches, queens, sudoku, tango, wend) |
| `src/utils/formatTime.js`         | Shared mm:ss formatter (Leaderboard, GameShell)                        |
| `src/utils/range.js`              | Shared `[0..n-1]` helper (GameShell, PatchesGame)                      |

## Puzzle Fetching (backend-generated)

**Puzzle generation and win validation now live entirely on the backend.** There are no more `{game}Generator.js` files, no per-game `*Puzzles.js`/`*Categories.js` static data, and no client-side seeding (`dailySelection.js` is gone). Every game:

1. Calls `useDailyPuzzle(gameType, mode)` (`src/games/useDailyPuzzle.js`), which hits `fetchDailyPuzzle` in `gamesApi.js`
2. Renders `PuzzleGate` (`src/games/PuzzleGate.jsx`) while `loading`/`error`, then the board once `puzzle.payload` arrives
3. On win, `useGameSession` submits the result via `submitScore` (`scoreApi.js`) — the backend re-checks the solution server-side; the frontend never validates authoritatively for scoring

`src/games/{game}/{game}Logic.js` files still hold **pure client-side helper logic** (e.g. `crossclimbLogic.js` validates letter-ladder input as the user types), but they no longer generate puzzles.

## Games

Registered in `src/games/registry.jsx` (`GAMES` array), rendered via `src/games/GameShell.jsx`. All games are currently `playable: true`:

| Game        | Folder        | Playable | Notes                                                 |
| ----------- | ------------- | :------: | ----------------------------------------------------- |
| Zip         | `zip/`        |    ✅    | Has dedicated Zustand store + `src/logic/zipLogic.js` |
| Queens      | `queens/`     |    ✅    |                                                       |
| Tango       | `tango/`      |    ✅    |                                                       |
| Mini Sudoku | `sudoku/`     |    ✅    |                                                       |
| Pinpoint    | `pinpoint/`   |    ✅    | No `*Logic.js` file (data-only puzzles)               |
| Crossclimb  | `crossclimb/` |    ✅    |                                                       |
| Wend        | `wend/`       |    ✅    |                                                       |
| Patches     | `patches/`    |    ✅    |                                                       |

> Check `src/games/registry.jsx` for the current `playable` status of each game — it changes as games are finished.

## Data Flow

```
User interaction (component in src/pages/ or src/games/{game}/)
    │
    ▼
Store action (src/store/use*Store.js) — for cross-page/global state
    │
    ▼
API module (src/api/*.js) — plain fetch()
    │
    ├── GET  /games, /games/{type}/daily ──► gamesApi.js (backend generates the puzzle)
    ├── POST /scores, GET /rankings, /scores/daily-* ──► scoreApi.js
    ├── POST/GET /auth/* ──► authApi.js
    │
    ▼
Response JSON used directly (no dedicated mapping layer / no TS types)
    │
    ▼
Component re-renders from store selector or local state
```

## Quick Lookup — "Where does X live?"

| I need to…                                       | Look in…                                                  |
| ------------------------------------------------ | --------------------------------------------------------- |
| Add a new page / route                           | `src/pages/` + wire in `src/App.jsx`                      |
| Add a shared UI component                        | `src/components/`                                         |
| Add or modify a puzzle game                      | `src/games/{game}/`, register in `src/games/registry.jsx` |
| Add global state                                 | `src/store/` — new `use*Store.js` (Zustand)               |
| Add reactive/session logic reusable across games | `src/games/use*.js` (custom hook)                         |
| Add a pure helper / client-side validation logic | `src/logic/` or the game's own `*Logic.js`                |
| Add an API call                                  | `src/api/` — new or existing domain file                  |
| Change puzzle generation / win validation        | Backend repo — not in this frontend anymore               |
