# API Integration

Stack: **plain `fetch()`** wrapped in domain modules under `src/api/` — no Axios, no RTK Query, no OpenAPI spec published. Reference: `src/api/authApi.js`, `src/api/gamesApi.js`, `src/api/scoreApi.js`.

> **Puzzle generation and win validation now live entirely on the backend.** The frontend only fetches puzzles (`gamesApi.js`) and submits results (`scoreApi.js`) — never generates or authoritatively validates a solution client-side.

## API Architecture Overview

The frontend talks to a single backend, base URL from the env var:

```js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
```

| Env var             | Purpose          | Default (fallback)      |
| ------------------- | ---------------- | ----------------------- |
| `VITE_API_BASE_URL` | Backend base URL | `http://localhost:8000` |

No OpenAPI/Swagger spec is published — endpoint shapes are inferred from `src/api/*.js` and the backend response handling in each function. When adding a new endpoint and the shape is unclear, ask the user for the backend contract rather than guessing.

## Module Organization

- One file per domain in `src/api/`: `authApi.js` (auth), `gamesApi.js` (games catalogue + backend-generated puzzles), `scoreApi.js` (scores/rankings/daily status)
- Each exported function makes exactly one HTTP call and returns the parsed JSON (or throws an `Error` with a message)
- Auth: the bearer token is read from the Zustand auth store via `getAuthToken()` (`src/store/useAuthStore.js`), never passed around manually by callers

```js
// src/api/scoreApi.js
import { getAuthToken } from '../store/useAuthStore';

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
```

## Rules

1. **Use `fetch()` directly** — this project has no HTTP-client abstraction/composable; do not introduce Axios or a custom wrapper without asking
2. **Never hardcode the base URL** — always read `import.meta.env.VITE_API_BASE_URL`
3. **Check `response.ok`** before parsing — throw a descriptive `Error` on failure (see `readDetail()` pattern in `authApi.js` for extracting a backend `detail` message)
4. **Attach auth headers via `getAuthToken()`** for endpoints that require a session — never store or pass tokens by any other means
5. **API calls belong in `src/api/*.js`**, called from store actions (see `login`/`register` in `useAuthStore.js`) or directly from components/hooks when no store involvement is needed (see `submitScore`/`fetchRankings` usage in game components)

## Adding a New API Call — Checklist

1. Determine which domain file it belongs to (`src/api/authApi.js`, `src/api/gamesApi.js`, `src/api/scoreApi.js`, or a new file for a new domain)
2. Confirm the endpoint path, method, and expected request/response shape with the user if not already established in the codebase
3. Write the function using `fetch()`, following the existing error-handling pattern (check `response.ok`, throw `Error` with a clear message)
4. Attach `Authorization` header via `authHeaders()`/`getAuthToken()` if the endpoint requires auth
5. If the result feeds global state, call it from a store action; if it's local to one component, call it directly (or from a custom hook)

## Example: Adding a New API Call

```js
// src/api/myFeatureApi.js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export const fetchMyFeature = async (id) => {
  const response = await fetch(`${API_BASE_URL}/my-feature/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch my-feature (HTTP ${response.status})`);
  }
  return response.json();
};
```

## Anti-Patterns — Do NOT

- Do not hardcode `http://localhost:8000` or any other absolute URL outside the `API_BASE_URL` constant
- Do not introduce Axios, RTK Query, or a new HTTP abstraction without asking the user first
- Do not call `fetch()` directly from components for data that should live in a store — put it in a store action instead
- Do not swallow fetch errors silently — always check `response.ok` and throw/report
- Do not invent endpoints or response shapes — confirm with the user or read existing `src/api/*.js` files for precedent
