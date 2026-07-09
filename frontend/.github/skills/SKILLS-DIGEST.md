# Skills Digest

Index of all available skill guides for this project. Each skill provides detailed, topic-specific rules that complement the main `copilot-instructions.md`.

> Agent/model routing is owned by `.github/ROUTER.md` — this file owns **skill** selection. Stack: Vite + React 18 (JS) + Zustand + TailwindCSS v3 + react-router-dom + fetch-based API layer. i18n and testing skills are on standby (no library/runner installed yet).

| Skill                          | Path                        | Summary                                                                                              |
| ------------------------------ | --------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Styling React Components**   | `styling/SKILL.md`          | TailwindCSS v3 usage, utility-first classes, no design-token layer configured yet                    |
| **Component Library**          | `components/SKILL.md`       | React functional component conventions, flat folder layout, per-game component structure             |
| **Unit Testing**               | `testing/SKILL.md`          | Standby — no test runner installed; suggested Vitest + React Testing Library patterns when adopted   |
| **Code Quality & Clean Code**  | `quality/SKILL.md`          | Naming, functions, constants, error handling, JS & React best practices                              |
| **Accessibility (a11y)**       | `accessibility/SKILL.md`    | Semantic HTML, ARIA attributes, keyboard navigation, color contrast, headings                        |
| **State Management**           | `state-management/SKILL.md` | Zustand store boundaries, `create`/`persist` patterns, action-only mutation rules                    |
| **Architecture Documentation** | `arc42/SKILL.md`            | Creating arc42 architecture documentation, analyzing workspace structure, documenting design         |
| **API Integration**            | `api/SKILL.md`              | Fetch-based API calls in `src/api/`, request/response shapes, bearer-token auth                      |
| **Project Overview**           | `project-overview/SKILL.md` | Project map, folder purposes, file index, data flow, quick lookup reference                          |
| **Internationalization**       | `i18n/SKILL.md`             | Standby — no i18n library or locale files exist yet; text is hardcoded in Spanish                    |
| **Caveman Mode**               | `caveman/SKILL.md`          | Ultra-compressed communication — drops filler ~75%, keeps full technical accuracy (always on)        |
| **Ponytail (Lazy Senior Dev)** | `ponytail/SKILL.md`         | Anti-overengineering — YAGNI, stdlib-first, minimal code, decision ladder before writing (always on) |
| **Legacy Audit**               | `legacy-audit/SKILL.md`     | Exhaustive `.github-old/` merge protocol for `/init-github` — ZERO tolerance for content loss        |

## How to Use

- The **copilot-instructions.md** provides the high-level rules and project conventions
- **Skill files** go deeper into a specific topic — consult the relevant skill when working in that area
- When a task spans multiple concerns (e.g., creating a new store), combine guidance from multiple skills (quality + testing)

## Automatic Skill Routing

Use the following trigger matrix to make skill usage deterministic:

| Trigger words / intent                                                              | Required skill(s)                 |
| ----------------------------------------------------------------------------------- | --------------------------------- |
| UI, component styling, Tailwind, layout                                             | `styling/SKILL.md`                |
| new component, component hierarchy, component reuse                                 | `components/SKILL.md`             |
| test, mock, spec, coverage, regression (standby)                                    | `testing/SKILL.md`                |
| refactor, readability, naming, clean code, error handling, review                   | `quality/SKILL.md`                |
| new feature touching UI + logic + tests                                             | `styling` + `quality` + `testing` |
| a11y, accessibility, ARIA, keyboard nav, screen reader, contrast, headings          | `accessibility/SKILL.md`          |
| store, state, Zustand, action, selector, persist                                    | `state-management/SKILL.md`       |
| arc42, architecture documentation, architecture analysis, design decisions          | `arc42/SKILL.md`                  |
| API, endpoint, HTTP request, fetch, backend type                                    | `api/SKILL.md`                    |
| project structure, file location, folder purpose, where does X live, orientation    | `project-overview/SKILL.md`       |
| translation, i18n, locale, label, language (standby)                                | `i18n/SKILL.md`                   |
| caveman, terse, brief, less tokens, compressed output, caveman mode                 | `caveman/SKILL.md` (always on)    |
| ponytail, lazy, YAGNI, minimal, stdlib, skip, one-liner, over-engineering, simplify | `ponytail/SKILL.md` (always on)   |
| `/init-github` Step 3, `.github-old/` merge, legacy absorption (internal use only)  | `legacy-audit/SKILL.md`           |

### Enforcement

- For non-trivial tasks, at least one skill must be selected before implementation.
- If no trigger matches clearly, ask one concise clarification question.
- Every substantive response should include `Skill used: ...` for visibility.

## Default Model per Agent

Canonical model assignments live in `.github/MODELS.md` — edit that file to change a model. Each agent also declares its model in YAML frontmatter (`model:`), which must match `MODELS.md`.

### Model decision heuristic

> Full heuristic table: `.github/MODELS.md`.
