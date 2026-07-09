# Code Quality & Clean Code

Clean code principles adapted for **JavaScript** (no TypeScript) and React components in this project.

## Naming

### Be descriptive and intentional

- **Variables**: describe what they hold — `activeGames`, `isModalVisible`, `selectedPuzzleId`
- **Functions**: describe what they do — `fetchRankings()`, `formatCompletionTime()`, `resetBoard()`
- **Booleans**: use `is`, `has`, `should`, `can` prefixes — `isLoading`, `hasWon`, `canSubmit`
- **Constants**: UPPER_SNAKE_CASE for true constants, camelCase for derived values — `MAX_ATTEMPTS`, `defaultBoardSize`
- **Avoid generic names**: `data`, `info`, `temp`, `flag`, `result`, `item` — unless the scope is very small (e.g., a `.map()` callback)

### Naming consistency

- Use the same term for the same concept everywhere — if it's a "puzzle" in the domain, don't call it "board" in some files and "level" in others
- Match the naming conventions in `copilot-instructions.md` (camelCase for variables/functions, PascalCase for components, camelCase for other files)

## Functions

### Single Responsibility

Every function should do **one thing**. If you can describe it with "and", split it.

```js
// Bad — does two things
async function fetchAndTransformRankings() {
  const raw = await fetchRankings('daily');
  return raw.map(mapToLeaderboardRow);
}

// Good — separated concerns
async function fetchRankingsData(period) {
  return fetchRankings(period);
}

function mapRankings(raw) {
  return raw.map(mapToLeaderboardRow);
}
```

### Keep functions short

Aim for **≤ 30 lines**. If a function grows beyond that, extract helper functions with descriptive names.

### Limit parameters

- **≤ 3 parameters** is ideal
- If more are needed, group them into an options object

```js
// Bad
function createGame(id, puzzle, mode, difficulty, seed) { ... }

// Good
function createGame(options) { ... }
```

### Prefer early returns

Reduce nesting by returning early for guard conditions:

```js
// Bad
function getLabel(item) {
  if (item) {
    if (item.label) {
      return item.label;
    } else {
      return 'Unknown';
    }
  } else {
    return '';
  }
}

// Good
function getLabel(item) {
  if (!item) return '';
  if (!item.label) return 'Unknown';
  return item.label;
}
```

### Pure functions when possible

Functions in `src/logic/` and `*Logic.js` files should be **pure** — same input always produces same output, no side effects, no React imports. This makes them easy to test and reason about.

## Constants & Magic Values

### No magic numbers or strings

Extract inline values to named constants:

```js
// Bad
if (status === 3) { ... }
setTimeout(callback, 5000);

// Good
const STATUS_APPROVED = 3;
const TOAST_DURATION_MS = 5000;

if (status === STATUS_APPROVED) { ... }
setTimeout(callback, TOAST_DURATION_MS);
```

- Place shared constants at the top of the relevant module or logic file
- Keep component-local constants at the top of the file, outside the component function

## Error Handling

### Never silently swallow errors

```js
// Bad
try {
  await fetchData();
} catch (e) {
  // silently ignored
}

// Good
try {
  await fetchData();
} catch (error) {
  console.error('Failed to fetch data:', error);
  setErrorMessage('Could not load data.');
}
```

### Be specific about what you catch

Don't wrap large blocks in try/catch. Wrap only the part that can fail and handle the specific failure.

## Code Organization

### One concern per file

- One store per file — `useAuthStore.js` handles auth, not also scores
- One custom hook per file — `useGameSession.js` handles session logic, not also countdown logic
- One logic topic per file — `zipLogic.js` has Zip game logic, not other games' logic

### Import order

Maintain a consistent import order:

1. External packages (`react`, `react-router-dom`, `zustand`)
2. Project-relative imports (`../store/useAuthStore`, `../api/scoreApi`)
3. Same-folder relative imports (`./ZipCell`)

### Remove dead code

- Delete unused variables, functions, imports, and components
- Don't commit commented-out code — use version control to retrieve old code if needed
- Remove `console.log` statements before committing (except intentional `console.error` for error tracking)

## JavaScript-Specific

### Use optional chaining and nullish coalescing

```js
// Bad
const name = user && user.profile && user.profile.name ? user.profile.name : 'Unknown';

// Good
const name = user?.profile?.name ?? 'Unknown';
```

### Avoid implicit type coercion pitfalls

- Use `===`/`!==`, never `==`/`!=`
- Be explicit when converting types (`Number(value)`, `String(value)`) rather than relying on coercion

### Immutability for state updates

- Never mutate arrays/objects held in `useState` or a Zustand store directly — always create a new array/object
- Use spread syntax or array methods that return new arrays (`map`, `filter`, `[...arr, item]`)
