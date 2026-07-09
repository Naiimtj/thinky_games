# Accessibility (a11y)

Accessibility rules for React components and pages in this project. Every user-facing feature must be perceivable, operable, and understandable by all users, including those relying on assistive technologies. No UI library is installed, so accessibility must be handled manually on plain HTML elements.

## Semantic HTML

### Use the right element for the job

- Use `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`, `<section>`, `<article>` to convey document structure (see `Layout.jsx` for `<header>`/`<nav>`/`<main>` usage)
- Use `<ul>` / `<ol>` for lists of items, `<table>` for tabular data (e.g. `Leaderboard.jsx`) — not `<div>` grids
- Use `<label>` elements explicitly associated with form inputs via `htmlFor` / `id` (see `AuthForm.jsx`)

```jsx
// Bad — div pretending to be a button
<div className="btn" onClick={save}>Guardar</div>

// Good — semantic button
<button type="button" onClick={save}>Guardar</button>
```

### Avoid div/span soup

- If the element conveys meaning, use a semantic tag
- Only use `<div>` / `<span>` for purely presentational wrappers with no interactive or structural role

## ARIA Attributes

### When to add ARIA

ARIA is a supplement, not a replacement — **prefer native HTML semantics first**. Add ARIA only when:

- A native element cannot express the role or state (e.g., custom game cell/grid, live region)
- A component needs extra context for screen readers (e.g., `aria-label` on an icon-only button)

### Required ARIA patterns

| Pattern              | Attribute(s)                                                        | Example                                                     |
| -------------------- | ---------------------------------------------------------------------| -------------------------------------------------------------|
| Icon-only button     | `aria-label`                                                        | `<button aria-label="Eliminar"><TrashIcon /></button>`      |
| Toggle / switch      | `aria-checked`, `role="switch"`                                     | Custom toggle controls in game boards                        |
| Loading state        | `aria-busy="true"` on the container                                 | Add while data is being fetched                               |
| Live region          | `aria-live="polite"` or `aria-live="assertive"`                     | Score submission feedback, form errors                        |
| Form errors          | `aria-invalid="true"`, `aria-describedby` pointing to error message | Link input to its error text in `AuthForm.jsx`                |
| Game grid cell       | `role="gridcell"` / `role="button"` + `aria-pressed`/`aria-selected` | Puzzle board cells (Zip, Queens, Sudoku, Tango, etc.)         |
| Navigation landmarks | `aria-label` on `<nav>` when multiple navs exist                    | `<nav aria-label="Navegación principal">`                    |

### Common mistakes to avoid

- **Do not use** `aria-label` on non-interactive elements that already have visible text
- **Do not duplicate** the visible text in `aria-label` — use `aria-labelledby` to reference it instead
- **Never set** `role="button"` on a `<div>` when a real `<button>` will work
- **Do not hide** essential content with `aria-hidden="true"` — only decorative or redundant elements

## Keyboard Navigation

### Every interactive element must be keyboard-accessible

- All buttons, links, inputs, and custom game-board cells must be **reachable via `Tab`** and **activatable via `Enter` or `Space`**
- Custom interactive elements (e.g. `ZipCell.jsx`) must have `tabIndex={0}` and an `onKeyDown` handler for `Enter`/`Space` in addition to `onClick`

```jsx
<div
  role="button"
  tabIndex={0}
  onClick={handleSelect}
  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelect()}
  aria-pressed={isSelected}
>
  {label}
</div>
```

### Focus management rules

| Scenario             | Expected behavior                                            |
| --------------------- | --------------------------------------------------------------|
| Route change          | Focus moves to the `<main>` content area or page heading      |
| Form validation error | Announce via `aria-live` or move focus to the first invalid field on submit |
| Modal/overlay opens   | Focus moves to the first focusable element inside it (if any modals are added) |

### Visual focus indicators

- **Never remove** the default focus outline without providing an equally visible custom indicator
- Use Tailwind `focus-visible:ring-2 focus-visible:ring-indigo-500` (matching the existing `indigo-600` active-link color) or an equivalent style
- Focus indicators must have a **minimum 3:1 contrast ratio** against adjacent colors

```jsx
<button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
  Entrar
</button>
```

## Color Contrast

### Minimum ratios (WCAG 2.1 AA)

| Element                             | Minimum contrast ratio          |
| ------------------------------------- | ---------------------------------|
| Normal text (< 18px / < 14px bold)  | **4.5:1**                       |
| Large text (≥ 18px / ≥ 14px bold)   | **3:1**                         |
| UI components and graphical objects | **3:1**                         |
| Focus indicators                    | **3:1** against adjacent colors |

### Practical rules

- Reuse the existing slate/indigo palette from `Layout.jsx` — it already meets AA on a white/`slate-100` background
- **Never rely on color alone** to convey information — pair with icons, text, or patterns:
  - Game cell states (correct/incorrect, active/inactive) must use a shape/icon/text difference, not color alone
  - Form validation: use a border change + error message text, not color alone
- Disabled states may have reduced contrast, but must remain **distinguishable** from enabled states

## Heading Hierarchy

### Rules

- Every page must have **exactly one `<h1>`** — typically the page title
- Headings must follow a **sequential descending order**: `h1 → h2 → h3 → ...` — never skip levels
- `Layout.jsx` should not introduce headings that interfere with page-level hierarchy — the `<h1>` belongs in the page component (`src/pages/*.jsx`), not the layout

## Accessibility Review Checklist

Before considering a UI task complete, verify:

- [ ] Semantic HTML elements are used (no `<div>` buttons or click-handler spans)
- [ ] All interactive elements (including custom game-board cells) are keyboard-accessible with visible focus indicators
- [ ] Icon-only buttons have `aria-label`
- [ ] ARIA attributes are correctly applied where native semantics are insufficient
- [ ] Color is not the sole means of conveying information
- [ ] Text and UI component contrast meets WCAG 2.1 AA minimums
- [ ] Heading hierarchy is sequential and each page has exactly one `<h1>`
- [ ] Dynamic content updates (score submission, errors) use `aria-live` regions
- [ ] Form inputs are associated with `<label>` elements and error messages use `aria-describedby`
