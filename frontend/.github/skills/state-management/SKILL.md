# State Management

Stack: **Zustand** (`create` + `persist` middleware). Stores live in `src/store/`, named `use<Domain>Store.js`. Reference: `src/store/useAuthStore.js`, `src/store/useZipStore.js`.

## Store Boundaries & Scope

### One domain, one store

Each store file should own a **single domain concern**. If you can describe a store with "and", it is likely doing too much — split it.

```js
// Bad — two concerns in one store
export const useItemsAndUsersStore = create((set) => ({
  items: [],
  users: [],
  // ...mixing items logic and users logic
}));

// Good — separate stores
// store/useItemsStore.js
export const useItemsStore = create((set) => ({
  items: [],
  setItems: (items) => set({ items }),
}));

// store/useUsersStore.js
export const useUsersStore = create((set) => ({
  users: [],
  setUsers: (users) => set({ users }),
}));
```

### Detect duplicated or overlapping stores

Before creating a new store, search existing stores in `src/store/` for overlapping state. If two stores manage the same data (e.g., both hold a `selectedGameId`), consolidate into one authoritative source — read it via `useOtherStore.getState()` or the hook rather than duplicating.

## Store vs Custom Hook vs Logic Module

| Need                                                              | Use               | Location                          |
| ------------------------------------------------------------------ | ------------------ | ----------------------------------- |
| Global state shared across multiple components/pages              | **Store**         | `src/store/use*Store.js`          |
| Reactive logic reusable but tied to one component's lifecycle     | **Custom hook**    | colocated (e.g. `src/games/use*.js`) |
| Pure data transformation, validation, win-condition checks         | **Logic module**  | `src/logic/*.js` or a game's `*Logic.js` |
| Fetching data tied to a specific component's mount/unmount         | **Custom hook**    | `useEffect` inside a hook          |
| Fetching data that feeds global state (e.g. auth session)          | **Store action**  | `src/store/use*Store.js`          |

### Boundary violations to flag

- A hook that stores state in a module-level variable so all callers share it → should be a Zustand store instead
- A store consumed by only one component → consider inlining as local `useState` or a custom hook
- A "logic" file that imports React hooks → it's not pure logic anymore, move the hook usage to a component/hook

## Mutating Store State

### Only actions defined in the store should mutate state

Components must call store actions — never reach into `set`/`getState` to mutate arbitrary fields from outside the store definition.

```js
// store/useFiltersStore.js
import { create } from 'zustand';

export const useFiltersStore = create((set, get) => ({
  activeFilters: [],

  addFilter: (filter) =>
    set((state) => ({ activeFilters: [...state.activeFilters, filter] })),

  removeFilter: (filter) =>
    set((state) => ({
      activeFilters: state.activeFilters.filter((f) => f !== filter),
    })),

  resetFilters: () => set({ activeFilters: [] }),
}));
```

```jsx
// Bad — component reaches into the store internals
const filters = useFiltersStore((state) => state.activeFilters);
filters.push('new-filter'); // Direct mutation of selected state!

// Good — component calls a store action
const addFilter = useFiltersStore((state) => state.addFilter);
addFilter('new-filter');
```

### Selector usage

Always select only what you need from a store to avoid unnecessary re-renders:

```jsx
// Bad — subscribes to the entire store, re-renders on any change
const store = useAuthStore();

// Good — subscribes only to what's needed
const token = useAuthStore((state) => state.token);
const logout = useAuthStore((state) => state.logout);
```

## Persistence

- Only wrap a store with `persist()` when its state must survive page reloads (e.g. auth session in `useAuthStore.js`)
- Give each persisted store a unique `name` (localStorage key), prefixed `thinky-*` to match existing convention (`thinky-auth`)
- Use `partialize` to persist only the fields that need to survive — don't persist loading flags or transient UI state

```js
export const useMyStore = create(
  persist(
    (set, get) => ({
      value: null,
      setValue: (value) => set({ value }),
    }),
    { name: 'thinky-my-store', partialize: (state) => ({ value: state.value }) },
  ),
);
```

## Reading State Outside React

Use `useMyStore.getState()` to read state outside components (e.g. from an API module) — see `getAuthToken()` in `useAuthStore.js`, consumed by `src/api/scoreApi.js`.

## Store Organization Patterns

### Naming conventions

- File: `src/store/use<Domain>Store.js`
- Export: `use<Domain>Store` (matches file name)
- Actions: verb-first camelCase (`login`, `logout`, `resetFilters`, `setItems`)

### Recommended internal structure

```js
export const useExampleStore = create((set, get) => ({
  // 1. State
  items: [],
  isLoading: false,

  // 2. Actions
  setItems: (items) => set({ items }),
  fetchItems: async () => {
    set({ isLoading: true });
    const items = await fetchItemsApi();
    set({ items, isLoading: false });
  },
  reset: () => set({ items: [], isLoading: false }),
}));
```

## Anti-Patterns — Do NOT

- Do not mutate arrays/objects in state directly (`state.items.push(...)`) — always return a new array/object from `set()`
- Do not subscribe to the whole store (`useMyStore()`) in a component when only one field is needed
- Do not put API call logic directly in components — call it through a store action (see `login`/`register` in `useAuthStore.js`)
- Do not create a second store for state that already exists elsewhere — search `src/store/` first
