# Unit Testing

> **Vitest is installed** (`npm test` runs `vitest run --passWithNoTests`) but **no test files currently exist**. Puzzle generation and win validation moved to the backend, so the `{game}Generator.test.js` files that used to be tested no longer exist client-side. This skill/agent stays low-priority until the user asks to add tests for the remaining client-side code.

## Adding Tests (framework already installed)

No extra setup needed — just add `*.test.js` files, Vitest picks them up automatically via the Vite pipeline. No React Testing Library / jsdom is installed yet; add it only if component tests are needed (confirm with the user first).

## What Should Be Tested First (if the user asks)

Priority order, given the current codebase:

1. **Logic modules** (`src/logic/*.js`, `src/games/{game}/{game}Logic.js`) — pure functions, easiest and highest-value to test (input validation, pure helpers)
2. **Zustand stores** (`src/store/use*Store.js`) — actions and state transitions
3. **API modules** (`src/api/*.js`) — mock `fetch`, verify request shape and error handling
4. **Components with non-trivial logic** (conditionals, derived state, event handling)

## Example Patterns (Vitest already installed; add React Testing Library only if component tests are needed)

### Logic module test

```js
import { describe, it, expect } from 'vitest';
import { isValidPath } from '../../src/logic/zipLogic';

describe('zipLogic', () => {
  it('rejects a path that crosses a wall', () => {
    expect(isValidPath(samplePath, sampleWalls)).toBe(false);
  });
});
```

### Zustand store test

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../src/store/useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => useAuthStore.setState({ token: null, user: null }));

  it('clears session on logout', () => {
    useAuthStore.setState({ token: 'abc', user: { username: 'x' } });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().token).toBeNull();
  });
});
```

Do not create test files or install extra dependencies (e.g. React Testing Library) until the user explicitly asks for tests.
