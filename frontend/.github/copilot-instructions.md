# AI Agent Development Guidelines

> **⛔ STOP — READ BEFORE DOING ANYTHING ⛔**
>
> Before writing ANY code or making ANY edit, you MUST check `ROUTER.md` §2 to see if this task belongs to a specialized agent. If it does, compare the declared model vs. current model **by family only, ignoring version numbers** (`GUARDRAILS.md` §0 rule 1a — e.g. `claude-sonnet` and "Claude Sonnet 4.5" are the SAME family). **If the family matches → proceed directly, no gate.** Only if the family genuinely differs (e.g. Sonnet vs Opus, Claude vs GPT) must you show the **Routing Gate block** (defined in `GUARDRAILS.md` §0) and WAIT for user choice. Skipping the gate when families genuinely differ is a guardrail violation — but showing the gate when families already match is ALSO a violation (unnecessary interruption). This applies to ALL models, ALL agents, ALL conversations.
>
> **⛔ ABSOLUTE RULE**: You can NEVER skip, ignore, or override ANY rule in `.github/` on your own. Rules can ONLY be bypassed when the USER explicitly grants permission. If unsure whether a rule applies — ASK. Assuming implicit permission is forbidden.

## Project Profile

| Field            | Value                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Project          | Thinky Games (frontend)                                                                                                                   |
| Framework        | Vite + React 18                                                                                                                           |
| Language         | JavaScript (no TypeScript, no build-time type checking)                                                                                   |
| UI library       | None — plain HTML elements styled with TailwindCSS                                                                                        |
| Styling          | TailwindCSS v3 (PostCSS + Autoprefixer)                                                                                                   |
| State management | Zustand (`create` + `persist` middleware), stores in `src/store/`                                                                         |
| i18n             | `react-i18next` + `i18next` + `i18next-browser-languagedetector`; locales in `src/locales/{es,en,de}.json`, config in `src/i18n/index.js` |
| Testing          | Vitest installed (`npm test`) — no test files currently exist (puzzle generation moved to the backend)                                    |
| Git platform     | Unknown — no git remote configured; `merge-request.agent.md` supports either `gh` or `glab`, confirm with user first                      |

> Run `/init-github` again if the stack changes significantly. Code examples in this file and in skills use the **actual project stack** (Vite + React 18 + Zustand + TailwindCSS + react-router-dom + fetch-based API layer).

## Operating Pipeline (read these first)

Every request flows through these layers, in order:

1. **Guardrails** — `.github/GUARDRAILS.md` — hard safety rules; override everything else.
2. **Router** — `.github/ROUTER.md` — decides which agent, skills, and model handle the request.
3. **Planner** — `.github/agents/planner.agent.md` — decomposes multi-domain tasks before execution (`/plan`).
4. **Agents & Skills** — `.github/agents/`, `.github/skills/SKILLS-DIGEST.md` — do the work, with declared tools per `.github/TOOLS.md`.
5. **Memory** — `.github/MEMORY.md` + `.github/memory/` — consulted before work, updated after (`/memory`, `/learnings`).

> **Skills reference**: For in-depth guidance on specific topics, see `.github/skills/SKILLS-DIGEST.md`.

## Caveman Mode (Always On)

Load and follow `.github/skills/caveman/SKILL.md` for every response. This skill is always active by default — no need to trigger it manually.

## Ponytail — Lazy Senior Dev Mode (Always On)

Load and follow `.github/skills/ponytail/SKILL.md` for every response. Before writing any code, walk the decision ladder: YAGNI → stdlib → platform → installed dep → one-liner → minimum that works. Stop at the first rung that holds. Never lazy about security, accessibility, data-loss prevention, or trust-boundary validation.

## Mandatory Skill Selection (Strict)

- Before proposing or writing code, always select at least one relevant skill from `.github/skills/SKILLS-DIGEST.md`.
- Skill selection is required for every non-trivial task (implementation, refactor, bug fix, tests, styling updates).
- If multiple concerns are present, combine all relevant skills (for example: `quality` + `testing`).
- If no skill clearly applies, ask one clarification question before proceeding.
- In every substantive response, include a short line: `Skill used: <skill-name(s)>`.
- If the task is truly trivial and no skill is needed, explicitly state: `Skill used: none (trivial task)`.

### Skill Routing Rules

> Full intent → agent → skill → model routing lives in `.github/ROUTER.md`. The quick matrix below covers skill selection only.

- **UI/Tailwind/component/layout** → use `.github/skills/styling/SKILL.md`
- **Tests/mocks/coverage/spec files** → use `.github/skills/testing/SKILL.md`
- **Refactor/readability/naming/error handling/maintainability** → use `.github/skills/quality/SKILL.md`
- **Accessibility/a11y/ARIA/keyboard navigation/contrast/headings** → use `.github/skills/accessibility/SKILL.md`
- **Store/state/Zustand actions/selectors** → use `.github/skills/state-management/SKILL.md`
- **Architecture documentation/arc42/design decisions** → use `.github/skills/arc42/SKILL.md`
- **API calls/endpoints/schemas/fetch requests** → use `.github/skills/api/SKILL.md`
- **Project structure/file locations/folder purposes/orientation** → use `.github/skills/project-overview/SKILL.md`
- **Translations/labels/locale keys** (standby — no i18n library installed yet) → use `.github/skills/i18n/SKILL.md`
- **Multi-concern work** → apply all matching skills in parallel

## Orchestrator Routing (Meta-Agents)

When a task spans **multiple domains**, do not try to handle everything in a single step. Use an orchestrator agent to decompose the work, enforce dependency ordering, and delegate to specialized agents.

| Situation                                                                   | What to invoke                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Task needs scoping/estimation first, or complexity is unclear               | Load `.github/agents/planner.agent.md` (Planner, read-only)         |
| New feature that needs **UI + state + API + tests + i18n**                  | Load `.github/agents/feature.agent.md` (Feature Orchestrator)       |
| Refactor, cleanup, or rename that affects **multiple files across domains** | Load `.github/agents/refactor.agent.md` (Refactor Orchestrator)     |
| Full code review across quality, styling, accessibility, state, testing     | Load `.github/agents/reviewer.agent.md` (Review Orchestrator)       |
| Single-domain task (only UI, only store, only API, only tests, only i18n)   | Use the relevant agent directly (component, store, api, test, i18n) |
| Question about project structure or file locations                          | Use `.github/agents/overview.agent.md` (read-only)                  |

### Dependency Order (strict)

When an orchestrator dispatches subtasks, they follow this sequence:

1. **Store** → **Component** (component reads from store)
2. **API** → **Store** (store makes HTTP calls)
3. **Component** → **i18n** (i18n needs new labels)
4. **Implementation** → **Test** (tests need code to exist)
5. **Overview** (scan) can run anytime; usually first

### Orchestrator visibility

When an orchestrator delegates to a sub-agent, output this format so the user can follow the chain:

```
▶︎ Step N: [Domain Agent] — [Goal]
  Scope: [exact files]
Loading agent: .github/agents/[domain].agent.md
Executing...
```

See `.github/ORCHESTRATORS.md` for the full registry and conventions.

## Language & Type Safety

- The project is **plain JavaScript** (JSX) — no TypeScript, no `tsconfig.json`, no build-time type checking
- Use **JSDoc comments** for non-obvious function signatures when it aids readability — not required for every function
- Avoid introducing TypeScript files unless the user explicitly asks to migrate the project
- Validate shapes at runtime only where it matters (API responses, form input) — don't over-engineer runtime validation for internal data

## Component Architecture

### Folder Layout (flat — no base/shared/feature tiers)

The project does not enforce a base/shared/feature component hierarchy. Structure is:

- **`src/components/`** — shared UI used across pages (`Layout.jsx`, `AuthForm.jsx`, `Leaderboard.jsx`, `ProtectedRoute.jsx`, plus game-agnostic pieces like `ZipCell.jsx`, `ZipGameBoard.jsx`)
- **`src/pages/`** — route-level components rendered by `react-router-dom` (`HomePage.jsx`, `GamePage.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`, `RankingsPage.jsx`)
- **`src/games/{game}/`** — one self-contained folder per puzzle game (e.g. `crossword/`, `queens/`, `sudoku/`, `tango/`, `wend/`, `zip/`, `patches/`, `pinpoint/`), each holding its own `*Game.jsx`, `*Logic.js`, and `*Puzzles.js`
- **`src/games/registry.jsx`** — central registry wiring every game into `GameShell.jsx`
- Before creating a new component, check `src/components/` for an existing reusable one — don't duplicate

### Component Conventions

- Functional components only, using React hooks (`useState`, `useEffect`, `useMemo`, etc.) — no class components
- Props are plain JS objects (no TypeScript interfaces) — destructure in the function signature
- One component per file, named exactly as the file (`Layout.jsx` exports `Layout`)
- Game-specific logic (win conditions, board state transitions) belongs in each game's `*Logic.js`, not inside the `.jsx` component

### Component Simplicity

- Keep components **simple and focused** — rendering + user interaction only
- Move shared or complex logic to:
  - **Store files** in `src/store/` (Zustand)
  - **Custom hooks** colocated where used (e.g. `useGameSession.js`, `useDailyCountdown.js` in `src/games/`)
  - **Pure logic modules** in `src/logic/` or a game's own `*Logic.js`
- Components should primarily handle template rendering, user interactions, and calling store actions/hooks

## Styling Guidelines

### TailwindCSS

- Use **TailwindCSS utility classes** for all styling (TailwindCSS v3 via PostCSS, config in `tailwind.config.js`)
- Prioritize **built-in TailwindCSS utility classes** over arbitrary values (e.g. prefer `px-4` over `px-[16px]`)
- Use arbitrary values only when built-in utilities cannot reasonably preserve the intended layout/UX
- No design-token/theme layer is configured yet (`tailwind.config.js` has an empty `theme.extend`) — colors are used directly (`slate-*`, `indigo-*`, etc.) matching existing patterns in `Layout.jsx`
- If a color/spacing pattern repeats across 3+ components, consider extending `tailwind.config.js` `theme.extend` — ask the user before introducing a new token system

### Icons

- No icon library is installed — the project currently uses text-only UI (see `Layout.jsx`)
- If icons are needed, ask the user which library to add (e.g. `lucide-react`, `heroicons`) rather than assuming one

### Images

- No dedicated images/assets folder exists yet — colocate new image assets under `src/` and import them directly (Vite handles static asset imports)

## Internationalization (i18n)

- The project uses **react-i18next** with `i18next-browser-languagedetector`; configuration lives in `src/i18n/index.js`
- Locale JSON files are in `src/locales/{es,en,de}.json`; Spanish (`es`) is the fallback/source language
- Use `useTranslation()` from `react-i18next` in components; name keys with the patterns in `skills/i18n/SKILL.md`
- When adding/changing user-facing text, add the key to **all three locale files** (`es`, `en`, `de`) and keep them in sync

## State Management

### Store Files (Zustand)

- Stores live in `src/store/` and use **Zustand** — `create()` optionally wrapped with `persist()` middleware for localStorage persistence
- Pattern (see `src/store/useAuthStore.js`):

  ```js
  import { create } from 'zustand';
  import { persist } from 'zustand/middleware';

  export const useMyStore = create(
    persist(
      (set, get) => ({
        value: null,

        doSomething: async (arg) => {
          set({ value: arg });
        },

        reset: () => set({ value: null }),
      }),
      {
        name: 'thinky-my-store',
        partialize: (state) => ({ value: state.value }),
      },
    ),
  );
  ```

- File naming: `use<Domain>Store.js`, export name `use<Domain>Store`
- Only wrap with `persist()` when the state must survive page reloads (auth session, etc.) — otherwise plain `create()` is enough
- Read state outside React components via `useMyStore.getState()` (see `getAuthToken()` in `useAuthStore.js`)
- Key rules:
  - **Single domain per store** — if you can describe it with "and", split it
  - **No duplicated state** — every piece of data has one authoritative store
  - **Mutate through actions only** — components must call store actions, never reassign store values directly
- For in-depth guidance, see `.github/skills/state-management/SKILL.md`

## Code Organization

### Custom Hooks

- Create hooks for **reusable stateful/effectful logic**, prefixed with `use` (e.g. `useDailyCountdown.js`, `useGameSession.js` in `src/games/`)
- Return state values and functions, same as any React hook

### Logic Modules (`src/logic/`, `*Logic.js` per game)

- Pure, stateless game logic (board validation, win conditions, move generation) lives in dedicated `*Logic.js` files — no React imports
- Examples: `src/logic/zipLogic.js`, `src/games/queens/queensLogic.js`

### Shared Utilities (`src/utils/`)

- Small, generic pure helpers reused across 2+ unrelated files (formatting, array helpers) — not game-specific logic
- Examples: `src/utils/formatTime.js` (mm:ss formatter), `src/utils/range.js` (`[0..n-1]` helper)
- If a helper is only used within one game, keep it colocated in that game's file instead

### When to use what:

- **Hook**: needs React state, effects, or lifecycle
- **Logic module**: pure function, game-specific data transformation, no React dependency
- **Util**: pure function, generic and reused across unrelated files/games
- **Store**: global state, shared across multiple components/pages

## File Structure

- **API calls**: `src/api/` (one file per domain, e.g. `authApi.js`, `scoreApi.js`)
- **Components**: `src/components/` (flat, shared across app)
- **Pages**: `src/pages/` (route-level components)
- **Games**: `src/games/{game}/` (self-contained per-game folder)
- **Static data**: `src/data/`
- **Pure game logic**: `src/logic/`
- **Shared utilities**: `src/utils/`
- **Stores**: `src/store/` (one per domain, Zustand)

## Layouts & Pages

- `src/components/Layout.jsx` wraps every route via `react-router-dom`'s `<Outlet />` — there is no separate `layouts/` folder or per-route layout switching
- **Routing** is defined manually in `src/App.jsx` using `<Routes>` / `<Route>` from `react-router-dom` — not file-based routing
- Protected routes wrap children in `<ProtectedRoute />` (`src/components/ProtectedRoute.jsx`)
- Use `useNavigate()` / `<Navigate />` from `react-router-dom` for programmatic navigation

## Naming Conventions

- **Framework**: Vite + React 18 — functional components with hooks
- **Components**: PascalCase (`Layout.jsx`, `AuthForm.jsx`) — one component per file, exported as the file name
- **Non-component JS files**: camelCase (`authApi.js`, `gamesApi.js`, `useAuthStore.js`, `zipLogic.js`)
- **Game folders**: lowercase, one word (`crossword/`, `queens/`, `sudoku/`, `tango/`, `wend/`, `zip/`, `patches/`, `pinpoint/`)
- **Custom hooks**: camelCase starting with `use` (`useDailyCountdown.js`, `useGameSession.js`)
- **Variables, functions, object properties**: camelCase (`myVariable`, `fetchData`, `user.name`)
- **Zustand stores**: `use<Domain>Store.js` exporting `use<Domain>Store`

## Unit Testing

- **Vitest is installed** (`npm test` runs `vitest run --passWithNoTests`); no config file — Vitest picks up `*.test.js` files directly via the Vite pipeline.
- **No test files currently exist.** Puzzle generation and win validation moved to the backend, so the `{game}Generator.js` + `.test.js` files that used to be tested no longer exist client-side.
- If tests are added going forward, the priority is pure logic (`src/logic/`, `src/games/*/{game}Logic.js`, `src/utils/`) — no DOM/component testing library is installed yet; add React Testing Library only if component tests are needed.
- Run a single file with `npx vitest run <path>`; tests must adapt to the code, never the reverse.

## Best Practices

1. **Functional components + hooks** — no class components
2. **Keep game logic pure** — win conditions and board transitions belong in `*Logic.js`, not the `.jsx` component
3. **Props**: plain JS objects, destructured in the function signature — no PropTypes/TS enforced today
4. **Reactive state**: `useState`/`useMemo`/`useEffect` locally, Zustand for cross-component/global state
5. **DRY principle**: extract reusable logic to custom hooks or logic modules

## Code Quality & Clean Code

- Write **readable, self-documenting code** — meaningful names, small functions, single responsibility
- Follow **clean code principles** adapted for JavaScript/React — for detailed rules, see `.github/skills/quality/SKILL.md`
- Key rules:
  - **Functions should do one thing** and be short (≤ 30 lines as a guideline)
  - **Use descriptive names** — prefer `getActiveGames()` over `getData()`, `isVisible` over `flag`
  - **Avoid magic numbers and strings** — extract to named constants at the top of the file or module
  - **Prefer early returns** over deep nesting
  - **No dead code** — remove unused variables, imports, functions, and commented-out code
  - **Handle errors explicitly** — never silently swallow exceptions
  - **Keep files focused** — one store, one hook, or one logic module per file

## Accessibility (a11y)

- **Every user-facing component** must follow accessibility best practices — for detailed rules, see `.github/skills/accessibility/SKILL.md`
- Key rules:
  - **Use semantic HTML** — `<button>` for actions, `<a>` for links, landmark elements (`<nav>`, `<main>`, `<aside>`) for structure
  - **Provide ARIA attributes** where native semantics are insufficient — `aria-label` on icon-only buttons, `aria-expanded` on toggles, `aria-live` for dynamic content
  - **Ensure keyboard accessibility** — all interactive elements reachable via `Tab`, activatable via `Enter`/`Space`, focus trapped in modals
  - **Meet color contrast minimums** — 4.5:1 for normal text, 3:1 for large text and UI components (WCAG 2.1 AA)
  - **Never rely on color alone** to convey information — pair with icons, text, or patterns
  - **Maintain heading hierarchy** — one `<h1>` per page, sequential levels (`h1 → h2 → h3`), no skipped levels
  - **Visible focus indicators** — never remove focus outlines without providing an equivalent custom style

## Keeping the Project Overview Up-to-Date

The file `.github/skills/project-overview/SKILL.md` is a living map of the project. **When you create, delete, or rename** any of the following, update the corresponding section in the overview:

- A **store** file (`src/store/use*Store.js`) → update the "Store Files" table
- A **custom hook** (`use*.js`) → update the "Custom Hooks" table
- An **API module** (`src/api/*.js`) → update the "API" table
- A **page** (`src/pages/*.jsx`) → update the "Pages & Routing" table
- A **shared component** (`src/components/*.jsx`) → update the "Folder Map" and component list
- A **game folder** (`src/games/{game}/`) → update the "Games" table
- A **logic module** (`src/logic/*.js` or `*Logic.js`) → update the "Logic Modules" table

**Rules:**

- Add a one-line description matching the style of existing entries
- Remove entries for deleted files
- For a full refresh, use the `/refresh-overview` prompt command

## Code Review Checklist

Before considering code complete, verify (see also `.github/GUARDRAILS.md` §7 quality gates):

- [ ] No unnecessary TypeScript/PropTypes added (project is plain JS by convention)
- [ ] Complex logic is moved to stores/hooks/logic modules, not left in components
- [ ] TailwindCSS classes are used for styling — no inline `style` unless unavoidable
- [ ] No duplicate code - logic is reusable
- [ ] Component is simple and focused
- [ ] Code is clean: no dead code, no magic values, descriptive names
- [ ] Semantic HTML, ARIA attributes, and keyboard navigation are correct
- [ ] Color contrast meets WCAG 2.1 AA and heading hierarchy is sequential
- [ ] Zustand store state is not mutated directly from components — actions are used
- [ ] No duplicated or overlapping state across stores
- [ ] Code follows existing patterns in the codebase

## Recording Learnings

The file `.github/memory/learnings.md` is a persistent, git-committed knowledge base for this project (full memory architecture: `.github/MEMORY.md`). **Proactively update it** when any of the following happens:

- You make a **mistake** and then correct it — record what went wrong and the fix
- You discover a **non-obvious pattern** or quirk in the codebase, APIs, or tooling
- You find a **gotcha** that could trip up future work (e.g., an API that behaves unexpectedly)
- You learn something about **test setup, mocking, or environment** that isn't documented elsewhere

**Rules:**

- Keep entries as **one-line bullet points** — short title in bold + concise explanation
- Add entries to the **appropriate section** (Gotchas, Patterns That Work, Common Mistakes, API & Backend Notes, Testing Notes)
- **Update or remove** entries that turn out to be wrong or outdated
- Do NOT duplicate information that already lives in a skill file — reference the skill instead
- For a full review and cleanup, use the `/learnings` prompt command
- For decisions, conventions, and glossary terms, use the `/memory` prompt command (see `.github/MEMORY.md`)
