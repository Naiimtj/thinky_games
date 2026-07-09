# Styling React Components

Stack: **TailwindCSS v3** (PostCSS + Autoprefixer) with plain HTML elements — no UI library (no PrimeVue/shadcn/Vuetify). Config: `tailwind.config.js`, `postcss.config.js`.

## Core Principles

1. **TailwindCSS utility classes over raw CSS** — style directly in JSX `className` instead of writing custom CSS in `src/index.css`
2. **Built-in utilities over arbitrary values** — prefer `px-4` over `px-[16px]`, `text-lg` over `text-[18px]`, `rounded-lg` over `rounded-[8px]`
3. **Closest built-in utility first** — when a design value doesn't match exactly, choose the closest built-in Tailwind value before considering arbitrary values
4. **Arbitrary values are exception-only** — allow them only when no built-in utility can reasonably preserve layout/UX
5. **No design-token layer yet** — `tailwind.config.js` has an empty `theme.extend`; colors are used directly (`slate-*`, `indigo-*`) matching existing patterns in `src/components/Layout.jsx`
6. **Extend the theme when a pattern emerges** — if a color/spacing combo repeats across 3+ components, propose adding it to `theme.extend` in `tailwind.config.js` — ask the user before introducing a new token system

## Current Color Usage (ad hoc, not tokenized)

Observed in the codebase (`Layout.jsx`, game components) — reuse these rather than introducing new ones without reason:

| Purpose                  | Classes                                                     |
| ------------------------- | ------------------------------------------------------------ |
| Page background           | `bg-slate-100`                                               |
| Card/header background    | `bg-white`, border `border-slate-200`                        |
| Primary text / links      | `text-slate-800`, `text-slate-600`                            |
| Active nav link           | `text-indigo-600`                                             |
| Primary action button     | `bg-slate-800 text-white hover:bg-slate-700`                  |
| Secondary/outline button  | `border border-slate-300 text-slate-600 hover:bg-slate-50`     |

## Guidelines

### Do

```jsx
// Use built-in Tailwind values
<div className="px-4 py-2 rounded-lg text-sm font-semibold">...</div>

// Match existing color patterns instead of inventing new ones
<div className="bg-slate-100 text-slate-800 border border-slate-200">...</div>
```

### Don't

```jsx
// Don't hardcode raw color values
<div className="text-[#004A96]">...</div>
<div style={{ color: 'rgb(0, 74, 150)' }}>...</div>

// Don't use arbitrary values when a built-in utility exists
<div className="px-[16px] py-[8px] rounded-[4px] text-[14px]">...</div>
```

### Closest-match policy

When translating a design value:

1. Try the nearest built-in utility first (e.g. `w-7/12` instead of `w-[58%]`, `text-xl` instead of `text-[20px]`).
2. If the visual result is acceptable, keep the built-in utility.
3. Use arbitrary values only when built-ins cannot preserve intended layout/behavior.

### Responsive & interactive states

Use Tailwind's built-in modifiers (`hover:`, `focus-visible:`, `sm:`, `md:`) rather than custom media queries or JS-driven style toggling.

```jsx
<button className="rounded-lg bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500">
  {label}
</button>
```

### When to extend the theme

If you find yourself repeating the same arbitrary color or spacing pattern in **3+ components**:

1. Propose adding a named color/spacing token to `theme.extend` in `tailwind.config.js`
2. Ask the user before introducing a new design-token system (per project convention, none exists today)
3. Update this skill file if a new significant token is added
