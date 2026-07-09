---
name: legacy-audit
description: Exhaustive audit and merge of .github-old/ into current .github/ customization files
---

# Legacy Audit Skill

## Purpose

Guarantee **100% exhaustive reading** and intelligent merge of `.github-old/` content into the current `.github/` structure during `/init-github` execution. This skill defines the mandatory protocol to prevent any content from being skipped, partially read, or lost during legacy absorption.

## Core Principle

**NO SHORTCUTS. NO ASSUMPTIONS. EVERY BYTE MATTERS.**

When `.github-old/` exists, it represents months/years of accumulated project knowledge. Losing even one convention, one anti-pattern, one API example is unacceptable. This skill enforces exhaustive reading with verification checkpoints.

---

## Audit Protocol (Mandatory Steps)

### Phase 1: Complete File Discovery

**1.1 — Recursive directory enumeration**

```bash
# Use list_dir recursively to map EVERY file in .github-old/
list_dir .github-old/
list_dir .github-old/agents/
list_dir .github-old/skills/
list_dir .github-old/prompts/
list_dir .github-old/memory/
# ... and any other subdirs found
```

**1.2 — Build file inventory**

Create a checklist of ALL files discovered. Example format:

```
.github-old/ File Inventory:
[ ] copilot-instructions.md (Lines: ?)
[ ] GUARDRAILS.md (Lines: ?)
[ ] ROUTER.md (Lines: ?)
[ ] TOOLS.md (Lines: ?)
[ ] MEMORY.md (Lines: ?)
[ ] ORCHESTRATORS.md (Lines: ?)
[ ] skills/api/SKILL.md (Lines: ?)
[ ] skills/styling/SKILL.md (Lines: ?)
... (continue for ALL files found)
```

**Checkpoint 1:** No files must be skipped. If a file exists in `.github-old/`, it MUST be in the inventory.

---

### Phase 2: Exhaustive File Reading

For EACH file in the inventory:

**2.1 — Initial read to determine file size**

```
read_file path/to/file.md 1 50
```

Use output to determine total line count. If file has 500+ lines, plan multiple reads.

**2.2 — Full sequential reading**

Read the ENTIRE file in chunks if necessary:

```
read_file path/to/file.md 1 200
read_file path/to/file.md 201 400
read_file path/to/file.md 401 600
... until EOF
```

**NEVER assume "the rest is similar" or "probably not important".**

**2.3 — Mark file as READ in inventory**

Update checklist:

```
[✓] copilot-instructions.md (845 lines) — READ COMPLETE
```

**Checkpoint 2:** Before moving to Phase 3, ALL inventory items must show `[✓] ... READ COMPLETE`.

---

### Phase 3: Deep Content Comparison

For each OLD file, compare section-by-section against its counterpart in CURRENT `.github/`:

**3.1 — Section-level diff**

Extract each major section:

- For `SKILL.md`: Overview, Conventions, Workflow, Examples, Anti-patterns, Checklist, References
- For `*.agent.md`: Description, Role, Constraints, Forbidden patterns, Delegates to, Checklist, Allowed files
- For `copilot-instructions.md`: Project Profile, Workflow rules, Model selection, Agent loading
- For `GUARDRAILS.md`: Each § section
- For prompts: Command Usage, Purpose, Workflow, each Step

Compare OLD section vs. CURRENT section:

| Section           | OLD Content Summary                                   | CURRENT Content Summary                   | Delta (what's unique in OLD?)                     |
| ----------------- | ----------------------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| Project Profile   | Project name "LabConnect", stack Nuxt 4 + Vue 3 + ... | Generic template with [TODO] placeholders | Specific project name, stack details, conventions |
| Conventions § API | 15 bullet points + 3 code examples                    | 8 bullet points + 1 code example          | 7 extra bullets, 2 extra examples                 |
| Anti-patterns     | 12 forbidden patterns with explanations               | 6 forbidden patterns                      | 6 unique anti-patterns not in current             |

**3.2 — Knowledge extraction rules**

Extract from OLD if:

- ✅ Content is project-specific and still valid for detected stack (Step 1 of init-github)
- ✅ Content is more detailed/complete than CURRENT (e.g., OLD has 15 conventions, CURRENT has 8)
- ✅ Content is stack-agnostic best practice that applies universally
- ✅ Code examples illustrate project patterns not covered in CURRENT
- ✅ Architectural decisions / design rationales not present in CURRENT

DO NOT extract if:

- ❌ Content is semantically identical to CURRENT (even if phrased differently)
- ❌ Content references technology removed in Step 1 detection (e.g., OLD references Pinia, but new project uses Redux)
- ❌ Content is outdated template boilerplate (e.g., generic skill descriptions unchanged from bootstrap)
- ❌ Content is the old project name / old API URLs with no transferable knowledge

**Checkpoint 3:** Every section of every OLD file must have a comparison entry. No section can be ignored.

---

### Phase 4: Intelligent Merge

**4.1 — Merge strategy per file type**

**Skills (`SKILL.md`):**

```markdown
## Conventions

<!-- CURRENT conventions (adapted to new stack in Step 4) -->

1. Use detected framework patterns
2. Follow detected state management
   ...

<!-- absorbed from .github-old — verify still applies -->

8. Never mutate API response objects directly (from old)
9. Always validate date formats before display (from old)
   ...
```

**Agents (`*.agent.md`):**

Merge into existing tables:

```markdown
## Forbidden Patterns

| Pattern                 | Reason                             |
| ----------------------- | ---------------------------------- |
| Inline styles           | Use TailwindCSS (current)          |
| Direct DOM manipulation | Use framework reactivity (current) |
| Hardcoded API URLs      | Use env config (absorbed from old) |
| Skipping loading states | Poor UX (absorbed from old)        |
```

**Core files (`copilot-instructions.md`, `GUARDRAILS.md`, etc.):**

- OLD Project Profile → fill [TODO] placeholders in CURRENT
- OLD custom guardrails § → append to CURRENT as new §
- OLD routing rules → integrate into CURRENT ROUTER.md matrix

**Memory files (`memory/learnings.md`, `conventions.md`, etc.):**

APPEND mode only. NEVER overwrite existing CURRENT memory.

```markdown
## Existing learnings (from current)

- ...

## Absorbed from previous project (.github-old) — review and verify

- OLD learning 1
- OLD learning 2
```

**4.2 — Annotate every merge**

Every block absorbed from OLD must be marked:

```markdown
<!-- absorbed from .github-old — verify still applies -->
```

This allows post-init manual review.

**Checkpoint 4:** ALL extracted content from Phase 3 must be integrated into target files. No "pending merge" items.

---

### Phase 5: Verification

**5.1 — Cross-reference check**

For each file that received merged content:

- Read the UPDATED file (after merge)
- Verify the absorbed content is present and correctly formatted
- Verify no CURRENT content was accidentally removed

**5.2 — Inventory completion check**

Review the Phase 1 inventory:

```
[✓] copilot-instructions.md — READ + MERGED (added 12 project profile fields)
[✓] GUARDRAILS.md — READ + MERGED (added 2 custom guardrails)
[✓] skills/api/SKILL.md — READ + MERGED (added 7 conventions, 2 examples)
[✓] skills/styling/SKILL.md — READ + NO MERGE (all content already in current)
[✓] agents/api.agent.md — READ + MERGED (added 4 forbidden patterns)
...
```

**Every file must show final status: READ + [MERGED | NO MERGE | DISCARDED (reason)]**

**Checkpoint 5:** No file can have status "SKIPPED" or "PARTIALLY READ" or "PENDING REVIEW".

---

## Anti-Patterns (What NOT to Do)

❌ **"I'll read the first 100 lines to get a sense of the file"** → NO. Read ALL lines.

❌ **"The old file is similar to the current one, no need to diff"** → NO. Always diff section-by-section.

❌ **"This section probably isn't important"** → NO. No section is unimportant until proven redundant.

❌ **"I'll merge the important parts later"** → NO. Merge immediately in Phase 4, no deferring.

❌ **"Let's skip memory files, they're probably outdated"** → NO. Memory files hold critical project knowledge.

❌ **"Reading 50+ files exhaustively will use too many tokens"** → IRRELEVANT. Correctness > token cost. This is a ONE-TIME initialization operation.

❌ **"This code (hooks, scripts, configs) probably won't work in the new environment"** → **NEVER ASSUME.** Copy first, document why it exists, let the USER decide if it applies. See §§ Critical Rule: Zero-Assumption Descarte below.

---

## §§ Critical Rule: Zero-Assumption Descarte

**THIS IS THE MOST IMPORTANT RULE IN THIS SKILL.**

> **⛔ ABSOLUTE PRINCIPLE**: You MUST NEVER discard, skip, or ignore ANY file, folder, or code block from `.github-old/` based on assumptions about whether it will work, apply, or be useful in the new environment.

### What this means:

1. **If you find code you're uncertain about** (hooks, scripts, configs, tool integrations):
   - ✅ COPY it to the new structure
   - ✅ ADD a comment/note explaining what it is and your uncertainty
   - ✅ ASK the user explicitly: "I found [X]. I'm uncertain if [reason]. Should I include it?"
   - ❌ NEVER discard silently because "it probably won't work"

2. **If you find documentation referencing tools/features you're unsure about**:
   - ✅ COPY the documentation
   - ✅ ADD a note: `<!-- TODO: Verify if [X] applies to this project -->`
   - ❌ NEVER remove paragraphs because "this might not apply"

3. **If you find large sections that seem irrelevant**:
   - ✅ FLAG them explicitly in the final report: "Found 200 lines about [X] in [file]. Marked for review — may be outdated."
   - ✅ PRESERVE them with a `<!-- REVIEW: May be outdated -->` marker
   - ❌ NEVER delete large blocks silently

### Examples of VIOLATIONS (what caused the hooks incident):

**WRONG (What happened):**

```
AI: "I see hooks/ folder with PostToolUse scripts. These don't apply to GitHub Copilot Chat.
     I'll skip copying them and document the practice instead."
```

**RIGHT (What should have happened):**

```
AI: "I see hooks/ folder with PostToolUse scripts. I'm uncertain if these work in GitHub
     Copilot Chat — let me copy them AND ask."

ACTION: Copy hooks/ to .github/hooks/
OUTPUT: "⚠️ Found hooks/ with auto-test PostToolUse scripts. I'm not sure if VS Code
         PostToolUse hooks work in GitHub Copilot Chat. I've copied them to .github/hooks/.
         Should these be kept or removed?"
```

### Verification Checklist (Phase 5 addition):

Before declaring legacy audit complete, verify:

- [ ] **Zero files discarded without user approval** — every file in `.github-old/` has a corresponding entry in `.github/` OR explicit user confirmation to discard
- [ ] **All assumptions documented** — any code copied with uncertainty has a clear comment explaining the uncertainty
- [ ] **Explicit discard log created** — if ANY file was not copied, `learnings.md` must document: what was not copied, why, and who approved it

---

## Output Requirements

At the end of legacy audit, produce:

```
LEGACY AUDIT REPORT (.github-old/)
===================================

Files scanned: 47
Total lines read: 15,234
Files with merged content: 28
Files discarded (reason): 5
  - skills-templates/ (bootstrap material)
  - old-project-specific-agent.md (stack mismatch)
  ...

DETAILED MERGE LOG:
-------------------

copilot-instructions.md
  → Project Profile: added 12 fields (project name, stack, conventions)
  → Model selection: kept current (already correct)

GUARDRAILS.md
  → Added § Custom Constraints from old (3 rules)

skills/api/SKILL.md
  → Conventions: absorbed 7 bullets from old (HTTP retry logic, error handling, cache invalidation)
  → Examples: absorbed 2 code samples (POST with optimistic update, GraphQL pagination)
  → Anti-patterns: absorbed 4 entries (mutation timing, stale data, race conditions)

skills/styling/SKILL.md
  → No merge (current already comprehensive)

agents/api.agent.md
  → Forbidden patterns: absorbed 4 entries
  → Checklist: absorbed 2 items (API versioning check, response schema validation)

memory/learnings.md
  → Appended 8 learnings from old project

memory/conventions.md
  → Appended 5 conventions (naming, file structure)

... (continue for ALL files)

DISCARDED CONTENT:
------------------
- skills-templates/ → Bootstrap material, not runtime context
- agents/old-pinia-store.agent.md → New project uses Redux
- references to "LabConnect" API URLs → Replaced with generic placeholders

VERIFICATION:
-------------
[✓] All 47 files read completely
[✓] All extracted content merged
[✓] All merged blocks annotated with <!-- absorbed from .github-old -->
[✓] No files pending review
[✓] No partial reads
```

---

## Integration with /init-github

**When Step 3 of `/init-github` detects `.github-old/`:**

1. Load this skill (legacy-audit)
2. Delegate to `legacy-merger` agent with this skill's protocol as mandatory constraints
3. Agent executes Phases 1-5 with checkpoint verification
4. Agent produces Legacy Audit Report
5. Continue to Step 4 of `/init-github`

**Failure modes:**

- If ANY checkpoint fails → STOP, report which files/sections are incomplete, request explicit user guidance
- If token budget is approaching limit during Phase 2 → STOP after current file, report progress, resume in next turn

---

## Success Criteria

Legacy audit is ONLY complete when:

✅ Every file in `.github-old/` has been read in full (ALL lines)
✅ Every section of every file has been compared to current
✅ ALL unique knowledge has been extracted and merged
✅ ALL merged content is annotated
✅ Legacy Audit Report lists EVERY file with final status
✅ No "skipped", "partial", or "pending" statuses remain

**Zero tolerance for incomplete audits.**
