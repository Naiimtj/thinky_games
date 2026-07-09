---
description: Exhaustive verification that .github-old/ was completely absorbed into .github/ with zero content loss
---

# `/verify-legacy-merge` — Legacy Merge Verification Protocol

## Purpose

Verify that ALL content from `.github-old/` was correctly absorbed into `.github/` during `/init-github` execution, with ZERO content loss, ZERO silent discards, and ZERO incomplete adaptations.

This command should be run AFTER `/init-github` completes to catch any merge failures before `.github-old/` is deleted.

## What This Command Does

1. **Inventory comparison** — Enumerate ALL files in `.github-old/` and verify each has a corresponding entry in `.github/`
2. **Content verification** — For each file pair, verify that content was merged or explicitly documented as discarded
3. **Template adaptation check** — Verify that template files were ADAPTED to the detected stack, not just created with [TODO] placeholders
4. **Discard audit** — List any files NOT copied from `.github-old/` and verify user approved each discard
5. **Generate verification report** — Summary of merge status with actionable findings

## Execution Protocol

### Step 1: File Inventory Comparison

```bash
# List all files in .github-old/
find .github-old -type f | sort > /tmp/old_files.txt

# List all files in .github/
find .github -type f | sort > /tmp/new_files.txt
```

Build mapping table:

| OLD file                               | NEW file(s)                          | Status        | Notes                                         |
| -------------------------------------- | ------------------------------------ | ------------- | --------------------------------------------- |
| `agents/state-management.agent.md`     | `agents/store.agent.md`              | ⚠️ VERIFY     | Renamed — content match verification needed   |
| `agents/testing.agent.md`              | `agents/test.agent.md`               | ⚠️ VERIFY     | Renamed — content match verification needed   |
| `skills/architecture/SKILL.md`         | `skills/arc42/SKILL.md`              | ✅ EQUIVALENT | Minor frontmatter diffs only                  |
| `hooks/auto-test.json`                 | `hooks/auto-test.json`               | ✅ COPIED     | Exact copy                                    |
| `hooks/scripts/detect-source-change.sh`| `hooks/scripts/detect-source-change.sh` | ✅ COPIED  | Exact copy                                    |
| `prompts/analyze.prompt.md`            | `prompts/analyze.prompt.md`          | ✅ MERGED     | Content integrated                            |
| `copilot-instructions.md`              | `copilot-instructions.md`            | ✅ ADAPTED    | Project Profile filled, i18n removed          |

**Flags:**
- ✅ COPIED — Exact copy from OLD to NEW
- ✅ MERGED — OLD content integrated into NEW file
- ✅ ADAPTED — NEW file uses OLD data but adapted to stack
- ✅ EQUIVALENT — Content semantically identical
- ⚠️ VERIFY — Needs manual diff verification
- ❌ MISSING — File in OLD but NOT in NEW (potential loss)
- 🗑️ DISCARDED — Explicitly not copied (must have user approval)

### Step 2: Content Verification (for ⚠️ VERIFY files)

For each file flagged `⚠️ VERIFY`:

1. **Read both files completely**:
   ```
   read_file .github-old/agents/state-management.agent.md 1 END
   read_file .github/agents/store.agent.md 1 END
   ```

2. **Section-by-section comparison**:
   - Extract key sections (Description, Constraints, Approach, Template)
   - Compare OLD section vs. NEW section
   - Flag any OLD content missing in NEW

3. **Stack adaptation check**:
   - OLD: "Use Pinia `defineStore`" → NEW should also say "Use Pinia `defineStore`"
   - OLD: "Jest + Vue Test Utils" → NEW should also say "Jest + Vue Test Utils"
   - If NEW says generic template language (`[TODO]`, `Vitest`, `createGlobalState`) → **FAIL — not adapted**

4. **Update status**:
   - If content matches → ✅ EQUIVALENT
   - If OLD content missing → ❌ CONTENT LOSS (list missing sections)
   - If NEW is generic template → ❌ NOT ADAPTED (flag for correction)

### Step 3: Template Adaptation Verification

Check ALL files that were template-generated:

| File                      | Should contain RDCP-specific data       | Verification                                                  |
| ------------------------- | --------------------------------------- | ------------------------------------------------------------- |
| `copilot-instructions.md` | Project: RDCP, Framework: Nuxt 3.4.1, etc. | Search for [TODO] → should be 0 in Project Profile      |
| `agents/store.agent.md`   | Pinia + defineStore pattern             | Search for "createGlobalState" → should be 0                  |
| `agents/test.agent.md`    | Jest 26.6.3 + Vue Test Utils            | Search for "Vitest" → should be 0                             |
| `agents/api.agent.md`     | RDCP backend URLs                       | Search for [TODO] in API URLs → should be 0                   |
| `ROUTER.md`               | Actual model names                      | Search for [TODO] in model column → should be 0               |
| `TOOLS.md`                | File scopes, task commands              | Search for [TODO] → should be 0 in all tables                 |

**Fail criteria:** ANY [TODO] in a filled section = incomplete adaptation.

### Step 4: Discard Audit

List files in `.github-old/` that have NO corresponding entry in `.github/`:

```
❌ MISSING FILES:
- None (all files accounted for)

OR:

🗑️ DISCARDED FILES (must have user approval):
- .github-old/deprecated/old-workflow.md
  Reason: [PENDING USER APPROVAL]
  Approved by: [NONE YET — VIOLATION]
```

**If ANY file is listed as DISCARDED without user approval → FAIL.**

### Step 5: Generate Verification Report

```markdown
# Legacy Merge Verification Report
Generated: 2026-06-15 14:30

## Summary

- Total files in .github-old/: 22
- Files copied: 22
- Files merged: 10
- Files adapted: 5
- Files discarded: 0

## Status Breakdown

✅ PASS (17 files):
- hooks/auto-test.json — exact copy
- hooks/scripts/detect-source-change.sh — exact copy
- skills/arc42/SKILL.md — equivalent content
...

⚠️ VERIFY NEEDED (3 files):
- agents/api.agent.md — 150 lines differ, needs manual fusion
- agents/store.agent.md — template not fully adapted (found "createGlobalState")
- agents/test.agent.md — template not fully adapted (found "Vitest")

❌ VIOLATIONS (2):
1. store.agent.md contains generic template code — not adapted to Pinia
2. test.agent.md contains Vitest references — should be Jest

## Action Required

1. Manually merge .github-old/agents/api.agent.md into .github/agents/api.agent.md
2. Replace "createGlobalState" with "Pinia defineStore" in store.agent.md
3. Replace "Vitest" with "Jest" in test.agent.md
4. Re-run `/verify-legacy-merge` to confirm fixes

## Discard Log

[No files discarded]
```

## When to Use This Command

- **Mandatory**: BEFORE deleting `.github-old/` after `/init-github`
- **Recommended**: After any manual editing of `.github/` files that originated from `-old`
- **Emergency**: If user suspects content loss after legacy merge

## Output Format

Return the full verification report markdown above, with actual data filled in.

## Success Criteria

Merge is verified ONLY when:

- [ ] ALL files in `.github-old/` accounted for (copied, merged, or explicitly discarded with approval)
- [ ] ZERO ⚠️ VERIFY items remain (all resolved to ✅ or ❌)
- [ ] ZERO ❌ VIOLATIONS (all template files adapted to detected stack)
- [ ] ZERO 🗑️ DISCARDED without user approval
- [ ] Verification report shows **100% complete** status

---

**This prompt enforces GUARDRAILS.md §11 (Zero-Assumption Code Preservation) and `.github/skills/legacy-audit/SKILL.md` Phase 5 (Verification).**
