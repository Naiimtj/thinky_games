---
description: 'Analyze recent code changes and identify which .github/ files are affected indirectly'
name: 'check-impact'
argument-hint: "Optional: commit hash, branch name, or timeframe (e.g. '7 days', 'HEAD~5', 'development'). If omitted, you will be asked."
tools: [read, search, run]
---

# /check-impact — .github Indirect Impact Checker

## Purpose

Scan recent codebase changes (outside `.github/`) and detect which `.github/` files
are indirectly affected — because agents, skills, and configurations reference things
like file structure, component names, store patterns, API contracts, and conventions.

Run this after:

- `git merge` or `git pull` from another branch
- A sprint with significant structural changes (new stores, components, pages)
- Before creating a merge request that touches architecture

**This prompt is read-only.** It generates a report and recommends actions.
It does NOT modify any file.

---

## Step 0 — Ask for scope

**Before doing anything else**, check if the user already provided an argument (commit hash, branch name, or timeframe).

- **If yes** — skip this step and proceed directly to Step 1 using that argument.
- **If no** — ask exactly this question and **wait for the answer** before continuing:

> How many days back do you want to analyze?
> (You can also provide a commit hash, branch name, or number of commits — e.g. `14`, `development`, `HEAD~10`, `abc1234`)

Once the user replies, proceed to Step 1 with their input.

---

## Step 1 — Determine scope

Use the argument from Step 0 (or the one passed directly).
If the user gave a plain number, treat it as days (e.g. `14` → `--since="14 days ago"`).
If no input was given, default to 7 days.

Run the appropriate git command:

```bash
# Default (last 7 days)
git log --oneline --since="7 days ago" --all

# Specific merge commit
git show <commit> --stat

# Diff between branches
git diff <branch>..HEAD --name-only

# Last N commits
git log --oneline -N --name-only
```

Collect the **full list of changed files**, excluding `.github/` itself.

---

## Step 2 — Categorize changed files

Classify each changed file by type using these path patterns (all relative to `[TODO: your app root folder, e.g. src/ or nuxt/]`).

> **Adapt this table** to your project's folder structure. Examples below use a Nuxt 4 / Vue 3 stack — replace with your actual paths and framework conventions.

| Category             | Path pattern (example)               | Severity if new/renamed/deleted |
| -------------------- | ------------------------------------ | ------------------------------- |
| Store                | `stores/*.ts`                        | HIGH                            |
| Composable / Hook    | `composables/use*.ts`                | HIGH                            |
| Utility              | `utils/*.ts`                         | HIGH                            |
| Base component       | `components/base/*.[TODO:ext]`       | HIGH                            |
| Shared component     | `components/shared/*.[TODO:ext]`     | HIGH                            |
| Feature component    | `components/{feature}/*.[TODO:ext]`  | MEDIUM                          |
| Page / Route         | `pages/**/*.[TODO:ext]`              | HIGH                            |
| Interface (backend)  | `interfaces/backend/*.interface.ts`  | MEDIUM                          |
| Interface (frontend) | `interfaces/frontend/*.interface.ts` | MEDIUM                          |
| Core                 | `core/*.ts`                          | MEDIUM                          |
| Layout               | `layouts/*.[TODO:ext]`               | HIGH                            |
| Middleware           | `middleware/*.ts`                    | MEDIUM                          |
| Plugin               | `plugins/*.ts`                       | MEDIUM                          |
| HTTP/API helper      | `[TODO: your HTTP helper file path]` | CRITICAL                        |
| Dependencies         | `package.json` / `pyproject.toml`    | HIGH                            |
| Framework config     | `[TODO: e.g. nuxt.config.ts]`        | MEDIUM                          |
| Styling config       | `[TODO: e.g. unocss.config.ts]`      | MEDIUM                          |
| Test setup           | `[TODO: e.g. tests/setup.ts]`        | MEDIUM                          |
| Non-structural       | anything else                        | LOW                             |

For each changed file, record: **Added / Modified / Deleted / Renamed**.

---

## Step 3 — Cross-reference with .github/ files

For each category with HIGH or CRITICAL severity changes, check the corresponding `.github/` file:

### 3a. Structural changes → `project-overview/SKILL.md`

Read `.github/skills/project-overview/SKILL.md`.

Check for each changed file:

- **Added** → Is it listed in the overview? If not → needs `/refresh-overview`
- **Deleted** → Is it still listed? If yes → needs removal via `/refresh-overview`
- **Renamed** → Is the old name still in the overview? → needs update

### 3b. New/changed base components → `[TODO: your design-system/atoms skill]`

Read `.github/skills/[TODO: e.g. atoms-usage or components]/SKILL.md`.

Check:

- Any new base/atomic component → should appear in the component list
- Any deleted base component → should be removed from the list
- Look for usage examples that reference renamed components

### 3c. API pattern changes → `api/SKILL.md` + `agents/api.agent.md`

If `[TODO: your HTTP helper file, e.g. composables/useRequest.ts]` or your auth helper changed significantly:

- Read `.github/skills/api/SKILL.md`
- Check if the helper function signatures (`[TODO: e.g. useGet, usePost, usePut, useDelete]`) are still accurate
- Check if the environment URL detection pattern in the skill matches the code

If new store/service files were added that call APIs:

- Verify the pattern shown in `api/SKILL.md` (store integration section) still matches

### 3d. State/store pattern changes → `state-management/SKILL.md`

If any `stores/*.ts` changed significantly (not just new computed/actions but structural pattern change):

- Read `.github/skills/state-management/SKILL.md`
- Check if the store pattern shown (`[TODO: e.g. defineStore, createGlobalState, Redux slice]`) is still the project standard
- Check if the state exposure pattern is still used (`[TODO: e.g. readonly(), selectors]`)

### 3e. Test setup changes → `testing/SKILL.md`

If `[TODO: e.g. jest.config.js / vitest.config.ts]`, `[TODO: e.g. tests/setup.ts]`, or `__mocks__/` changed:

- Read `.github/skills/testing/SKILL.md`
- Check if mock setup and store/state initialization patterns are still accurate (`[TODO: e.g. setActivePinia, createPinia, vi.mock]`)

### 3f. Styling/config changes → `styling/SKILL.md`

If `[TODO: e.g. unocss.config.ts / tailwind.config.ts / tokens.json]` changed (new color tokens, new shortcuts):

- Read `.github/skills/styling/SKILL.md`
- Check if the color token table and reusable class table are still accurate

### 3g. Dependencies → `copilot-instructions.md` Project Profile

If `package.json` (or `pyproject.toml`, `Cargo.toml`, etc.) changed:

- Run: `cat [TODO: path/to/package.json] | grep -E '[TODO: key deps — e.g. "framework"|"ui-lib"|"state"|"test-runner"]'`
- Compare against the Project Profile table in `.github/copilot-instructions.md`
- Flag any version mismatches

### 3h. Layout changes → `copilot-instructions.md` Layouts section

If `layouts/*.vue` changed (added/deleted):

- Check the "Layouts & Pages" section in `copilot-instructions.md`
- Verify listed layouts still exist

### 3i. Feature folder renames → agent file scopes → `TOOLS.md`

If a major feature folder was renamed (e.g., `[TODO: old path]` → `[TODO: new path]`):

- Read `.github/TOOLS.md`
- Check if any agent's file scope declaration references the old path

---

## Step 4 — Generate impact report

Output the following structured report:

```
# .github Impact Report — [current date]
Scope: [commits/timeframe analyzed]
Files changed (outside .github/): [count]

---

## ✅ No impact ([count] files)
Files that changed but have no .github/ reference.
[list file names only, one per line]

---

## ⚠️ Needs review ([count] files)

For each affected file:

### [filename] ([Added|Modified|Deleted|Renamed])
- Category: [Store / Composable / Base Component / etc.]
- .github/ file affected: [path]
- Reason: [specific explanation — e.g., "new store not listed in project-overview"]
- Recommended action: [run /refresh-overview | update skill X | update agent Y]

---

## 🔴 Breaking / critical ([count] files)
Changes where .github/ guidance is now WRONG or MISLEADING.

### [filename] ([Modified])
- Category: [e.g., HTTP composable]
- .github/ file affected: [path]
- Reason: [e.g., "useGet() signature changed — api/SKILL.md shows old API"]
- Recommended action: [specific edit needed]

---

## 📋 Summary of recommended actions

Priority order (do these first):

1. [action] — [why]
2. [action] — [why]
...

Prompts to run:
- /refresh-overview  (if any store/composable/util/page/component was added or removed)
- /learnings         (if a non-obvious pattern or gotcha was discovered)
```

---

## Rules

1. **Read-only** — do NOT modify any file, only report
2. **Focus on indirect impact** — skip files that only changed internal logic with no structural/naming effect
3. **Severity = scope of the change** — a renamed store is more impactful than a modified one
4. **When unsure** — mark as ⚠️ Needs review, not ✅ No impact
5. **Skip test files** as changed targets — they don't affect `.github/` (they are affected BY `.github/testing/SKILL.md`, not the reverse)
6. **If no changes found** — report "No indirect impact detected" and suggest running `/refresh-overview` as a sanity check
