---
agent: agent
model: claude-sonnet
description: 'Initialize or refresh .github Copilot customization files for a new project based on the detected tech stack'
name: 'init-github'
---

# /init-github - Initialize GitHub Copilot Customization

## Command Usage

Use `/init-github` when you have copied the `.github/` folder (agents, skills, prompts) into a new project and want to adapt all files to the current project's tech stack, folder structure, and conventions.

**Syntax:**

- `/init-github` — Full scan, regeneration, and pruning of all `.github/` files
- `/init-github --help` or `/init-github -h` — Display help information
- `/init-github --dry-run` or `/init-github -d` — Show what would change without writing files
- `/init-github --keep-all` or `/init-github -k` — Skip the pruning step (Step 5): adapt files but delete nothing

## Purpose

Automatically adapt the entire `.github/` customization suite (instructions, agents, skills, prompts) to match the project where the folder has been copied. Detects frameworks, languages, state management, styling, testing, i18n, and folder conventions, then rewrites all files so they are accurate for the new codebase instead of retaining references to the original project. Finally, **prunes** skills, agents, prompts, and templates that have no use in the detected stack.

## When to Use /init-github

- After copying `.github/` from a template or another repo into a new project
- When the project's tech stack has significantly changed (e.g., migrated from Vue to React)
- When you notice agents/skills still reference old project names, old frameworks, or non-existent folders

## Workflow

When the user types `/init-github`, execute the following steps in order.

---

### Step 1: Detect Tech Stack

Explore the workspace to understand what technologies and conventions the project uses.

**Read these files if they exist (use read_file):**

- `package.json` — detect framework, UI library, state management, test framework, i18n, CSS tooling, Node version
- `tsconfig.json` — confirm TypeScript usage and aliases
- `nuxt.config.ts` / `next.config.ts` / `vite.config.ts` / `vue.config.js` / `angular.json` — detect meta-framework
- `tailwind.config.ts` / `postcss.config.js` / `uno.config.ts` — detect CSS approach
- `vitest.config.ts` / `jest.config.js` / `playwright.config.ts` — detect testing
- Any README.md in the repo root — extract project name and description

**List these directories (use list_dir) if they exist:**

- Root level: note top-level folders (src/, app/, pages/, components/, stores/, composables/, hooks/, public/, locales/, tests/, etc.)
- `src/` or `app/` subfolders: understand module/component organization

**From this exploration, build a detection summary with these fields:**

| Field               | Detected Value                                                          | Notes                            |
| ------------------- | ----------------------------------------------------------------------- | -------------------------------- |
| Project Name        | e.g., "[TODO: project name]"                                            | From package.json name or README |
| Framework           | e.g., Nuxt 4, Next.js 14, Vite + Vue 3, Angular 17                      | Primary meta-framework           |
| Language            | TypeScript / JavaScript / Python / etc.                                 |                                  |
| Component Model     | Vue SFC / React JSX / Angular Component / etc.                          |                                  |
| Script Setup        | `<script setup>` / hooks / classes                                      |                                  |
| UI Library          | PrimeVue / Shadcn / Material-UI / etc.                                  |                                  |
| State Management    | createGlobalState (VueUse) / Pinia / Redux / Zustand / Context API      |                                  |
| Styling             | TailwindCSS v4 / v3 / CSS Modules / Styled Components / SCSS            |                                  |
| i18n                | vue-i18n / react-intl / next-intl / None                                |                                  |
| Testing             | Vitest + @vue/test-utils / Jest + React Testing Library / Playwright    |                                  |
| HTTP Client         | Custom composables / Axios / fetch / $fetch / RTK Query                 |                                  |
| Component Hierarchy | base/shared/feature or atoms/molecules/organisms or none                |                                  |
| Key Folders         | components/, stores/, composables/, hooks/, utils/, interfaces/, types/ |                                  |
| API Docs            | Any OpenAPI / Swagger URLs?                                             | Usually none in new project      |

> If a field cannot be detected, mark it as "Unknown — ask user".

---

### Step 2: Read Existing .github Files as Templates

Read the current `.github/` files that need adaptation. These are the BASE files from the original project.

**Read all of these (use read_file):**

- `.github/copilot-instructions.md`
- `.github/GUARDRAILS.md`
- `.github/ROUTER.md`
- `.github/MEMORY.md`
- `.github/TOOLS.md`
- `.github/ORCHESTRATORS.md`
- `.github/skills/SKILLS-DIGEST.md`
- `.github/skills/api/SKILL.md`
- `.github/skills/styling/SKILL.md`
- `.github/skills/testing/SKILL.md`
- `.github/skills/state-management/SKILL.md`
- `.github/skills/quality/SKILL.md`
- `.github/skills/accessibility/SKILL.md`
- `.github/skills/atoms-usage/SKILL.md`
- `.github/skills/caveman/SKILL.md`
- `.github/skills/arc42/SKILL.md`
- `.github/skills/project-overview/SKILL.md`
- `.github/agents/api.agent.md`
- `.github/agents/component.agent.md`
- `.github/agents/store.agent.md`
- `.github/agents/test.agent.md`
- `.github/agents/i18n.agent.md`
- `.github/agents/overview.agent.md`
- `.github/agents/planner.agent.md`
- `.github/agents/merge-request.agent.md`
- `.github/prompts/history.prompt.md`
- `.github/prompts/learnings.prompt.md`
- `.github/prompts/memory.prompt.md`
- `.github/prompts/plan.prompt.md`
- `.github/prompts/modelUsage.prompt.md`
- `.github/prompts/refresh-overview.prompt.md`
- `.github/prompts/thought.prompt.md`
- `.github/prompts/skills.prompt.md`

---

### Step 3: Detect and Absorb `.github-old` (Legacy Merge)

Before generating updated files, check whether a `.github-old/` folder exists in the workspace root. This folder represents the previous `.github/` renamed before copying in the new template.

**Check for legacy folder:**

Use `list_dir` on the workspace root.

- If `.github-old/` is **not found** → skip this step entirely. Note: "No `.github-old/` detected — legacy merge skipped."
- If `.github-old/` is **found** → **MANDATORY DELEGATION** to `legacy-merger` agent (see below).

---

#### When `.github-old/` IS found → DELEGATE TO LEGACY-MERGER AGENT

**DO NOT attempt to merge `.github-old/` inline.** The complexity and requirement for exhaustive reading makes delegation mandatory.

**Delegation command:**

```
Invoke runSubagent tool:
- agentName: "legacy-merger"
- description: "Absorb .github-old/ into current .github/"
- prompt: "
  Execute legacy-audit skill protocol (Phases 1-5) on .github-old/.

  Context from /init-github:
  - Tech stack detected (Step 1): [insert detection summary from Step 1]
  - Current .github/ baseline: [list files read in Step 2]

  Your mission:
  1. Map ALL files in .github-old/ (Phase 1)
  2. Read EVERY file COMPLETELY — no truncation, no skipping (Phase 2)
  3. Diff section-by-section against current .github/ (Phase 3)
  4. Merge ALL unique knowledge relevant to detected stack (Phase 4)
  5. Verify completion and produce Legacy Audit Report (Phase 5)

  Constraints:
  - ZERO tolerance for partial reads or skipped files
  - Every file must show final status: READ + MERGED/NO MERGE/DISCARDED
  - All merged content annotated with <!-- absorbed from .github-old -->
  - Memory files: append only, never overwrite

  Deliverable: Legacy Audit Report + all merged .github/ files ready for Step 4
  "
```

**Why delegation is mandatory:**

- `.github-old/` may contain 40-60 files totaling 10,000-20,000 lines
- Exhaustive reading requires multiple `read_file` calls per large file
- Section-by-section comparison demands consistent context across all files
- Token cost is justified — this is ONE-TIME initialization, correctness > cost
- Attempting inline merge risks skipping content, partial reads, and lost knowledge

**Agent output → Step 3 completion:**

When `legacy-merger` agent returns:

1. Receive **Legacy Audit Report** (see `legacy-audit` skill output format)
2. Verify report shows:
   - All files marked `[✓] READ COMPLETE`
   - All files have final status (MERGED / NO MERGE / DISCARDED + reason)
   - No "SKIPPED", "PARTIAL", or "PENDING" statuses
3. Note files with merged content for Step 4 (they now contain absorbed knowledge)
4. Proceed to Step 4

**If agent reports incomplete audit:**

- Agent will stop and report which files/sections are incomplete
- Review agent's progress notes
- Either:
  - Resume agent with remaining files, OR
  - Ask user for guidance on ambiguous merge decisions

---

#### Legacy Merge Protocol Summary (enforced by agent)

The `legacy-merger` agent follows the `legacy-audit` skill protocol:

**Phase 1:** Complete file discovery — map every file in `.github-old/`
**Phase 2:** Exhaustive reading — read ALL lines of ALL files (chunked if >500 lines)
**Phase 3:** Deep comparison — section-by-section diff vs. current `.github/`
**Phase 4:** Intelligent merge — integrate unique knowledge, annotate absorbed content
**Phase 5:** Verification — cross-reference, inventory completion check, produce report

**Checkpoints (agent MUST pass all 5):**

1. No files missing from inventory
2. All files marked READ COMPLETE before Phase 3
3. Every section of every file compared
4. All extracted content merged (no orphan notes)
5. No files with incomplete status

**Output from agent:**

```
LEGACY MERGE COMPLETE

Summary:
- Files scanned: 47
- Lines read: 15,234
- Files merged: 28
- Files discarded: 5

[Detailed merge log listing every file and action taken]

Ready for Step 4 (Generate Updated Files).
```

---

#### What the Agent Merges (Extraction Rules)

Agent applies these rules during Phase 4 (detailed in `legacy-audit` skill):

**TO merge:**

- Project-specific patterns (naming, component patterns, code-style rules)
- Domain knowledge in skills (extra API patterns, state management conventions, testing utilities, design system rules)
- Custom agent rules/constraints (forbidden patterns, architectural decisions, delegation rules, checklist items)
- Memory files (`.github-old/memory/`) → append non-duplicate entries to current `memory/` files
- Hooks/workflow scripts present in old but absent in new
- Extra agents/skills (if relevant to current stack)

**NOT to merge:**

- Old project name, old API URLs, removed framework references
- Stack-specific code examples for tech pruned in Step 5
- Content semantically equivalent to what already exists in new file
- `skills-templates/` from old (bootstrap material)
- Outdated architectural decisions superseded by new template

**Merge strategy:**

- Skills: absorb unique knowledge into corresponding sections
- Agents: add missing constraints/patterns/checklist items to tables
- Core files: fill [TODO] placeholders, append custom sections
- Memory files: APPEND only (never overwrite)

**Annotation:**
All merged content marked with `<!-- absorbed from .github-old — verify still applies -->`

**`--dry-run` behavior:**
Agent performs full read and audit but does NOT write. Outputs preview report.

---

### Step 4: Generate Updated Files

For each file read in Step 2, rewrite it so all project-specific references are replaced with the detected (or inferred) values from Step 1.

**Replacement rules (apply to ALL files):**

1. **Project name**: Replace `[TODO: project name]` with the detected project name.
2. **Framework references**: Replace "Nuxt 4 / Vue 3" with the detected framework stack.
3. **Component syntax**: Replace `<script setup lang="ts">` with the detected component model.
4. **State management**: Replace "createGlobalState from `@vueuse/core`" / "Pinia" with the detected state approach.
5. **Styling**: Replace "TailwindCSS v4" / "PrimeVue" with the detected styling stack.
6. **i18n**: Replace "vue-i18n" / "locales/en.json fr.json de.json" with the detected i18n setup.
7. **Testing**: Replace "Vitest + `@vue/test-utils` + happy-dom" with the detected testing stack.
8. **HTTP helpers**: Replace references to `useHttpGet`, `useHttpPost`, `composables/useHttpRequest.ts` with the detected HTTP approach.
9. **Folder paths**: Replace hardcoded paths (`components/base/`, `store/`, `composables/`, etc.) with the detected actual paths.
10. **API URLs**: Remove or generify specific OpenAPI / Swagger URLs unless they exist in the new project.
11. **Agents constraints**: Update each agent's "Allowed files" and "Delegates to" tables to match the new folder structure.
12. **`[TODO]` placeholders**: Fill every `[TODO: ...]` placeholder across **all `.github/` files** — including `copilot-instructions.md`, `GUARDRAILS.md`, `ROUTER.md`, `TOOLS.md`, agent files, skill files, and **prompt files** (`prompts/*.prompt.md`) — with detected values from Step 1. Leave as `[TODO]` + explanatory note only if the value is genuinely undetectable from the codebase.
13. **Memory folder**: NEVER overwrite `.github/memory/*` contents — they hold accumulated project knowledge. Only create the seed files if missing.

**If a technology is NOT detected (e.g., no i18n library found):**

- The related skills/agents/prompts become **pruning candidates** — handled in Step 5.
- Only when the detection is ambiguous (might exist but unconfirmed): keep the file and mark it "Not detected — configure manually" / "Optional — configure if needed".

**If `--dry-run` was used:**

- Do NOT write any files.
- Output a summary of what each file would change (project name, framework, key replacements).
- Ask the user for confirmation before proceeding.

---

### Step 5: Coherence Verification (MANDATORY — prevents template drift)

After generating all files (Step 4), perform an automated coherence audit. This step catches cases where files were created from generic templates but NOT fully adapted to the detected stack.

**Why this exists:** Past init-github runs left skills referencing TailwindCSS (project uses UnoCSS), Vitest (project uses Jest), and createGlobalState (project uses Pinia). This step prevents that class of error permanently.

#### 5.1 — Skill Content Verification

For EACH skill file in `.github/skills/*/SKILL.md`:

1. Read the first 5 lines (header + stack note)
2. Check that **technology names in the skill match the detected stack from Step 1**:
   - Styling skill → must reference the detected CSS solution (e.g., UnoCSS, not TailwindCSS)
   - Testing skill → must reference the detected test runner (e.g., Jest, not Vitest)
   - State management skill → must reference the detected state lib (e.g., Pinia, not createGlobalState/Zustand)
   - Accessibility skill → must reference the detected UI library (e.g., Vuetify, not PrimeVue)
   - API skill → must reference the detected HTTP helpers
3. Scan code examples for **wrong imports or API calls** (`import { describe } from 'vitest'` when Jest is used, `vi.mock` when `jest.mock` is correct, `createGlobalState` when `defineStore` is correct)
4. If ANY mismatch found → **rewrite the skill** with correct stack references and code examples

**Quick-check matrix:**

| Skill file          | Must NOT contain (if stack differs)                  | Must contain                                   |
| ------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| `styling/SKILL.md`  | TailwindCSS, `@theme`, `assets/app.css`, PrimeVue    | Detected CSS tool + actual config file paths   |
| `testing/SKILL.md`  | Vitest, `vi.mock`, `vi.fn`, happy-dom                | Detected test runner + its API (`jest.mock`)   |
| `state-management/` | createGlobalState, VueUse store, `store/*.store.ts`  | Detected state lib + actual store folder path  |
| `accessibility/`    | PrimeVue, PrimeIcons, `pi pi-*`                      | Detected UI lib + its accessibility patterns   |
| `api/SKILL.md`      | `[TODO]` placeholders in endpoint URLs, wrong client | Detected HTTP helpers + actual composable path |
| `atoms-usage/`      | `[TODO]` placeholders unfilled                       | Adapted to detected design system or removed   |

#### 5.2 — Agent Frontmatter Verification

For EACH agent file in `.github/agents/*.agent.md`:

1. Verify YAML frontmatter contains ALL required fields:
   - `description:` — non-empty
   - `tools:` — array matching TOOLS.md matrix
   - `user-invocable: true` (for user-facing agents)
   - `model:` — matches the model declared in ROUTER.md §2
2. Verify agent body references correct stack:
   - No mentions of UI libraries not in the project (PrimeVue when using Vuetify, etc.)
   - No i18n rules if project has no i18n
   - File scope paths match actual project folder structure
3. Cross-check `tools:` array against TOOLS.md matrix row — must match exactly

**Common errors to catch:**

| Error                                                            | Fix                                                      |
| ---------------------------------------------------------------- | -------------------------------------------------------- |
| Agent says `tools: [read, search]` but TOOLS.md gives `edit: ✅` | Align one to the other (agent behavior is authoritative) |
| Agent references `assets/css/` but project has `assets/scss/`    | Update path in agent constraints                         |
| Agent enforces `$t('key')` but project has no i18n               | Remove i18n constraint                                   |
| `model:` missing or wrong format                                 | Add matching ROUTER.md value                             |
| `user-invocable:` missing                                        | Add `user-invocable: true`                               |

#### 5.3 — Cross-File Reference Integrity

Verify these cross-references are consistent:

1. **ROUTER.md §2 matrix** ↔ **agent files** — every agent listed in the matrix must have a `.agent.md` file; every model in the matrix must match the agent's `model:` frontmatter
2. **TOOLS.md matrix** ↔ **agent frontmatter `tools:`** — must match exactly
3. **SKILLS-DIGEST.md table** ↔ **actual skill folders** — every entry in the digest must have a corresponding `SKILL.md`; skill descriptions must match actual content
4. **ORCHESTRATORS.md dependency rules** — no references to capabilities the project doesn't have (e.g., i18n step if no i18n)
5. **Prompt files** — `model:` in frontmatter uses correct format (lowercase-kebab, not display name)

#### 5.4 — Verification Report

Output a brief verification result:

```
Coherence check:
  Skills: [N] verified, [M] rewritten
  Agents: [N] verified, [M] fixed
  Cross-refs: [issues found or "all consistent"]

  [List any remaining issues that need user input]
```

If ALL checks pass, proceed to Step 6 (Prune). If issues are found that cannot be auto-fixed (ambiguous stack, multiple possible interpretations), list them and ask the user.

---

### Step 6: Prune Unused Files

Remove customization files that have **no use** in the detected project. Skipped entirely when `--keep-all` is passed.

**Pruning matrix:**

| Condition (clearly absent from stack)                           | Delete                                                                                                                                         |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| No i18n library and no `locales/` folder                        | `agents/i18n.agent.md`, `skills/i18n/`                                                                                                         |
| No test framework (no vitest/jest/playwright config or dep)     | `agents/test.agent.md`, `skills/testing/`                                                                                                      |
| No backend API integration (no HTTP client/helpers, no OpenAPI) | `agents/api.agent.md`, `skills/api/`                                                                                                           |
| No global state solution (no store folder, no state lib)        | `agents/store.agent.md`, `skills/state-management/`                                                                                            |
| No Atoms/BASF design system                                     | `skills/atoms-usage/`                                                                                                                          |
| No GitLab and no GitHub CLI workflow wanted                     | `agents/merge-request.agent.md`                                                                                                                |
| Stack template chosen (e.g., Pinia selected)                    | All non-matching `skills/skills-templates/*` variants (keep only the matching one, promoted into the real skill)                               |
| Prompt depends on a deleted capability                          | The dependent prompt (e.g., delete nothing core: `/init-github`, `/plan`, `/memory`, `/learnings`, `/skills`, `/refresh-overview` always stay) |

**Pruning rules:**

1. **Confirm before deleting** — present the full deletion list to the user and wait for explicit approval (this is a destructive operation per `GUARDRAILS.md` §2). With `--dry-run`, only list candidates.
2. **Clearly absent only** — delete when the technology is verifiably missing (not in `package.json`, no config file, no matching folder). If ambiguous → keep + mark "Optional".
3. **Cascade the cleanup** — after deleting a file, remove ALL references to it:
   - Routing rows in `ROUTER.md` (intent matrix, model routing)
   - Tool matrix rows in `TOOLS.md`
   - Tables in `ORCHESTRATORS.md`, `SKILLS-DIGEST.md`, `copilot-instructions.md`
   - Dispatch/delegation references in orchestrator agents (`feature`, `refactor`, `planner`)
   - Structure trees and tables in `README.md` / guides if present
4. **Never prune**: core pipeline files (`copilot-instructions.md`, `GUARDRAILS.md`, `ROUTER.md`, `TOOLS.md`, `MEMORY.md`, `ORCHESTRATORS.md`), `memory/` contents, orchestrators (`planner`, `feature`, `refactor`), `overview.agent.md`, and cross-cutting skills (`quality`, `accessibility`, `caveman`, `project-overview`).
5. **`skills-templates/` consumed on init** — once the correct template is merged into the real skill, delete the whole `skills-templates/` folder (it's bootstrap material, not runtime context).

---

### Step 7: Write Files

Use `insert_edit_into_file` or `create_file` to write the updated content for each file.

**Order matters:**

1. `.github/copilot-instructions.md` — global instructions + Project Profile first
2. `.github/GUARDRAILS.md`, `.github/ROUTER.md`, `.github/TOOLS.md`, `.github/MEMORY.md` — pipeline modules
3. `.github/skills/SKILLS-DIGEST.md` — digest index
4. `.github/skills/*/SKILL.md` — all skills
5. `.github/agents/*.agent.md` — all agents
6. `.github/prompts/*.prompt.md` — all prompts (including this `init-github.prompt.md` itself — keep it generic so it works again in the future)

**When writing:**

- Preserve YAML frontmatter (`---` blocks at the top of agents/prompts).
- Preserve Markdown structure and tables.
- Keep the "Caveman Mode" references intact (it's a meta-skill, framework-agnostic).
- Keep generic workflow structures (e.g., the `/history`, `/learnings`, `/thought` workflows are mostly project-agnostic — only update file paths if they differ).

---

### Step 8: Report

Output a concise summary:

```
/init-github completed.
Project detected: [Project Name] — [Framework] / [Language]
Skills updated: [count]
Agents updated: [count]
Prompts updated: [count]
Pruned (unused): [list of deleted files, or "none"]

Key changes:
- Framework: [old] → [new]
- State: [old] → [new]
- Styling: [old] → [new]
- Testing: [old] → [new]
- i18n: [old] → [new]

Next: Run `/refresh-overview` (if available) to index the new project structure.
```

If any detections were "Unknown", list them and ask the user to review those specific skills/agents.

## Important Rules

- **Never assume the old stack**: If you can't detect a technology, generify rather than carry over Nuxt/Vue assumptions.
- **Preserve file structure**: Keep the same `.github/` layout (copilot-instructions.md, agents/, prompts/, skills/) so it remains a drop-in template.
- **Keep init-github itself reusable**: When rewriting this file, keep the command name `/init-github` and the workflow intact so it can be run again later.
- **Prune only what is clearly absent**: Verified-missing tech → delete (Step 5, with user confirmation). Ambiguous → keep and mark "Optional — update manually". `--keep-all` disables pruning.
- **Deletions always cascade**: Never leave dangling references in ROUTER, TOOLS, ORCHESTRATORS, SKILLS-DIGEST, or orchestrator agents after pruning.
