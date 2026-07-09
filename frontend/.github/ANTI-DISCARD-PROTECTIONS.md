# Anti-Discard Protections — Complete System

This document records ALL protections implemented on 2026-06-15 to permanently prevent the "discard code without verifying/consulting" error that occurred during the initial legacy merge.

## Original Problem

During `/init-github`, the agent:

1. **Discarded `.github-old/hooks/`** assuming PostToolUse hooks don't work in GitHub Copilot Chat (without verifying)
2. **Used generic templates** in `store.agent.md` and `test.agent.md` instead of adapting RDCP-specific content from `.github-old/`
3. **Did not verify** that `api.agent.md` was correctly adapted (left with [TODO] placeholders)

**Consequence**: Loss of valuable content, duplicated work, trust affected.

---

## Implemented Protections

### 1. GUARDRAILS.md §11 — ABSOLUTE Anti-Discard Rule

**File**: [`.github/GUARDRAILS.md`](/.github/GUARDRAILS.md) line 182

**Key content:**

```markdown
## 11. Zero-Assumption Code Preservation (CRITICAL for legacy audits and file reviews)

⛔ MANDATORY RULE — NO EXCEPTIONS

NEVER discard code, files, folders, or documentation based on assumptions about:

- Whether it will "work" in the current environment
- Whether it "applies" to the current stack
- Whether it's "probably outdated" or "not needed anymore"

Mandatory Actions Instead:

1. COPY FIRST, ASK SECOND
2. DOCUMENT UNCERTAINTY, DON'T DISCARD
3. EXPLICIT DISCARD LOG (must have user approval)
```

**When it applies:** ALL code reviews, legacy merges, file cleanups, refactors.

**Enforcement:** If any agent attempts to discard something → VIOLATION of guardrail §11 → MUST ask user first.

---

### 2. Skill `legacy-audit` — §§ Critical Rule: Zero-Assumption Discard

**File**: [`.github/skills/legacy-audit/SKILL.md`](/.github/skills/legacy-audit/SKILL.md) line 256

**Key content:**

```markdown
## §§ Critical Rule: Zero-Assumption Descarte

THIS IS THE MOST IMPORTANT RULE IN THIS SKILL.

⛔ ABSOLUTE PRINCIPLE: You MUST NEVER discard, skip, or ignore ANY file, folder,
or code block from `.github-old/` based on assumptions.

Examples of VIOLATIONS (what caused the hooks incident):

WRONG:
"I see hooks/ folder with PostToolUse scripts. These don't apply to GitHub Copilot Chat.
I'll skip copying them and document the practice instead."

RIGHT:
"I see hooks/ folder with PostToolUse scripts. I'm uncertain if these work in GitHub
Copilot Chat — let me copy them AND ask."
```

**When it applies:** Specifically during legacy audits (`/init-github`, `/verify-legacy-merge`).

**Added verification (Phase 5):**

- [ ] Zero files discarded without user approval
- [ ] All assumptions documented
- [ ] Explicit discard log created

---

### 3. Prompt `/verify-legacy-merge` — Post-Init Audit

**File**: [`.github/prompts/verify-legacy-merge.prompt.md`](/.github/prompts/verify-legacy-merge.prompt.md)

**Purpose**: Exhaustively verify that `.github-old/` was completely absorbed without losses.

**Protocol** (5 steps):

1. **Inventory comparison** — Map each file OLD → NEW
2. **Content verification** — Diff section-by-section for renamed files
3. **Template adaptation check** — Verify that [TODO]s were filled and correct stack was used
4. **Discard audit** — List any uncopied files + verify user approval
5. **Generate report** — Summary with flags: ✅ COPIED, ⚠️ VERIFY, ❌ MISSING, 🗑️ DISCARDED

**When to use:**

- **Mandatory:** BEFORE deleting `.github-old/` after `/init-github`
- After any manual editing of files originating from `-old`
- If user suspects content loss

**Success criteria:** 100% of files verified, zero ⚠️ VERIFY, zero ❌ VIOLATIONS, zero 🗑️ without approval.

---

### 4. Learnings.md — Root Cause Analysis

**File**: [`.github/memory/learnings.md`](/.github/memory/learnings.md) section "Mistakes"

**Added entries:**

1. **Incorrectly discarded PostToolUse hooks** — Documented the original error
2. **Template files not adapted during init-github** — Documented the systemic error (store.agent.md, test.agent.md)
3. **Assumed api.agent.md was correctly merged** — Documented the pattern of not verifying merges

**Each entry includes:**

- What was done wrong
- Why it was an error
- Correct rule
- Where it was codified (GUARDRAILS §11, legacy-audit skill, etc.)

**Purpose**: Institutional memory — prevent repeating these errors even in new conversations.

---

### 5. Hooks Documented — README.md

**File**: [`.github/hooks/README.md`](/.github/hooks/README.md)

**Content**: Complete documentation of how PostToolUse hooks work (auto-test.json + detect-source-change.sh):

- How It Works
- Configuration
- Detection Script logic
- Testable Files table
- Disabling instructions
- Troubleshooting
- Tech Stack Note (extensions to add)

**Purpose**: Any future developer or agent can understand what they are and why they exist.

---

## Applied Corrections (2026-06-15)

### Corrected files:

1. **`store.agent.md`** ✅
   - **Before**: Used `createGlobalState` from `@vueuse/core` (generic template)
   - **After**: Uses Pinia `defineStore` with setup-store pattern (correct RDCP)

2. **`test.agent.md`** ✅
   - **Before**: Used Vitest + happy-dom (generic template)
   - **After**: Uses Jest 26.6.3 + Vue Test Utils (correct RDCP)

3. **`api.agent.md`** ⚠️ MARKED FOR MANUAL MERGE
   - **Problem**: 150 lines of difference between OLD (real RDCP URLs) and NEW (template with [TODO])
   - **Required action**: Manual merge of RDCP-specific content
   - **Status**: Pending user review

4. **`arc42/SKILL.md`** ✅
   - **Problem**: Minor frontmatter differences
   - **Decision**: Differences acceptable, not critical

### Restored files:

5. **`hooks/auto-test.json`** ✅ Copied from `.github-old/`
6. **`hooks/scripts/detect-source-change.sh`** ✅ Copied from `.github-old/` + chmod +x
7. **`hooks/README.md`** ✅ Created (new documentation)

---

## Verification Checklist (for future legacy merges)

Before declaring `/init-github` complete:

- [ ] **All files from `.github-old/` inventoried** (use `find`)
- [ ] **Each file has a status**: ✅ COPIED, ✅ MERGED, ✅ ADAPTED, or 🗑️ DISCARDED (with approval)
- [ ] **Zero [TODO] in Project Profile** (copilot-instructions.md)
- [ ] **Zero references to incorrect stack** (search for "Vitest", "createGlobalState", etc. if project uses Jest/Pinia)
- [ ] **All agent files use the correct stack** (grep verification)
- [ ] **Hooks copied** if they existed in `-old`
- [ ] **`/verify-legacy-merge` executed** and reports 100% success
- [ ] **Learnings.md updated** with any gotchas found

---

## Ideal Flow for Future Projects

```mermaid
graph TD
    A[User runs /init-github] --> B[Step 1: Detect stack]
    B --> C[Step 2: legacy-merger reads .github-old/ EXHAUSTIVELY]
    C --> D{All files read completely?}
    D -->|NO| E[ERROR: Re-read with larger chunks]
    D -->|YES| F[Step 3: Section-by-section diff]
    F --> G[Step 4: Merge + adapt to detected stack]
    G --> H[Step 5: Verification - run internal checks]
    H --> I{Any [TODO] remain? Any generic templates?}
    I -->|YES| J[ERROR: Templates not adapted - STOP]
    I -->|NO| K[Step 6: User runs /verify-legacy-merge]
    K --> L{100% verified?}
    L -->|NO| M[ERROR: Fix violations - STOP]
    L -->|YES| N[SUCCESS: Safe to delete .github-old/]
```

---

## Red Flags

If you see any of these signals after `/init-github`, run `/verify-legacy-merge` immediately:

🚩 **You find [TODO] in files that should be filled** (Project Profile, TOOLS.md file scopes, ROUTER.md models)

🚩 **Agent files have examples from incorrect stack** (Vitest when project uses Jest, createGlobalState when it uses Pinia)

🚩 **Some file from `.github-old/` doesn't exist in `.github/`** without explanation

🚩 **Agent says "I skipped X because..."** without having consulted the user first

🚩 **Learnings.md has no legacy merge entry** (should document what was absorbed)

---

## Responsibility

**All agents** (especially `legacy-merger`, but also `store`, `test`, `api`, `component`, etc.) MUST:

1. **Read GUARDRAILS.md §11** before any file operation
2. **Never discard code without asking** — even if it seems obvious it doesn't apply
3. **Copy first, document uncertainty, let the user decide**
4. **If they encounter a file/pattern they don't understand** → copy + flag with `<!-- REVIEW: ... -->` + ask

**The user** has final authority over what is kept and what is discarded.

---

## Change History

- **2026-06-15**: Complete system implemented after discarded hooks incident
  - GUARDRAILS.md §11 added
  - legacy-audit/SKILL.md reinforced with §§ Critical Rule
  - verify-legacy-merge.prompt.md created
  - learnings.md updated with 3 mistake entries
  - store.agent.md and test.agent.md corrected
  - hooks/ restored and documented

---

**This system guarantees that knowledge is NEVER lost again during a legacy merge.**
