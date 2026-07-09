---
description: 'Distill the current chat (work done + user corrections/feedback) into durable .github/ updates — prioritizing skills, agents, and config over memory'
name: 'update-chat-github'
argument-hint: "Optional: focus area to scope the review (e.g. 'styling', 'api', 'the store refactor'). If omitted, the whole conversation is reviewed."
tools: [read, search, edit]
---

# /update-chat-github — Persist Chat Knowledge into .github/

## Purpose

Review **the current conversation** — everything that was done, plus everything the user
**commented, requested, corrected, or rejected** — and turn the durable parts into updates
inside `.github/`, placed where they will most effectively shape future AI behavior.

The goal is that the next session "inherits" what was learned here without the user having to
repeat themselves.

**Placement priority (professional default):**

1. **Skills** (`.github/skills/**/SKILL.md`) — reusable, curated know-how (the preferred home).
2. **Agents** (`.github/agents/*.agent.md`) — when the lesson is about _how a specific role should behave_.
3. **Config / routing** (`copilot-instructions.md`, `ROUTER.md`, `TOOLS.md`, `GUARDRAILS.md`) — when it's a rule, mapping, or profile fact.
4. **Memory** (`.github/memory/*.md`) — only when the item is too project-specific, too fresh, or not yet stable enough to promote (it's the inbox layer, per `MEMORY.md`).

> Bias toward skills/agents/config. Use memory as the fallback when a durable home doesn't yet
> exist or the insight is still unproven. This decision is yours to make per item — explain the why.

**This prompt writes files.** It always shows a proposal first and respects all guardrails
(see `GUARDRAILS.md` §2 — memory/learnings writes require explicit confirmation before writing).

---

## Step 0 — Scope

Check if the user passed an argument (a focus area).

- **If yes** — restrict the review to messages and changes related to that area.
- **If no** — review the entire current conversation.

Do **not** ask a question if the conversation has enough signal; only ask if the chat is empty
or you cannot determine what was worked on.

---

## Step 1 — Mine the conversation

Re-read the current chat from start to current point and extract **durable signal** only.
Capture, with a short quote or paraphrase + where it came from:

| Signal type               | What to look for                                                                |
| ------------------------- | ------------------------------------------------------------------------------- |
| **Corrections**           | "no, do it this way", "that's wrong", "don't use X", reverts of AI output       |
| **Preferences**           | stated style/approach choices ("always…", "never…", "prefer…", "use Y instead") |
| **Decisions**             | explicit architectural/tooling choices made during the chat                     |
| **Patterns**              | a reusable approach that emerged and worked (and isn't documented yet)          |
| **Gotchas**               | a bug/footgun that took multiple attempts, or a non-obvious cause               |
| **Conventions**           | naming, structure, or process rules confirmed in the chat                       |
| **Glossary**              | domain terms/abbreviations the user had to explain                              |
| **Tooling/profile facts** | new dependency, command, path, or stack detail discovered                       |

**Exclude** (do NOT persist): generic framework knowledge, one-off trivia, secrets/credentials,
anything already documented in a skill, and transient task state.

If nothing durable is found → report "No durable knowledge to persist from this chat." and stop.

---

## Step 2 — Classify each item to its best target

For every extracted item, decide the single most appropriate destination using this decision order:

```
Is it a reusable, generalizable technique or rule of craft?
   └── YES → a SKILL.md (pick the closest existing skill; propose a new one only if none fits)

Is it about how a specific role/agent should behave or decide?
   └── YES → that agents/*.agent.md

Is it a routing rule, model mapping, tool/path mapping, or project-profile fact?
   └── YES → ROUTER.md / TOOLS.md / copilot-instructions.md  (GUARDRAILS.md only for hard safety rules)

Otherwise — project-specific, unproven, or still "fresh":
   └── memory/  →  learnings.md (gotchas/patterns/mistakes) | decisions.md | conventions.md | glossary.md
```

Tie-breakers:

- **Stable + reusable → skill** beats memory. Promote when in doubt about a proven pattern.
- **Behavioral nuance for one role → agent file**, not a global rule.
- **One-liner project fact not worth a skill → memory** (`conventions`/`glossary`).
- If an item fits two places, pick the **most specific** one and note the alternative in the proposal.

Match against existing files before inventing new ones — read `.github/skills/SKILLS-DIGEST.md`
and the relevant `SKILL.md`/agent file to find the right host and match its format.

---

## Step 3 — Build the proposal (no writes yet)

Present a table the user can approve at a glance:

```
# /update-chat-github — Proposed updates ([date])
Scope: [whole chat | focus area]
Durable items found: [count]

| # | Item (what was learned) | Source in chat | Target file | Action | Why here |
|---|-------------------------|----------------|-------------|--------|----------|
| 1 | ...                     | "...quote..."  | skills/styling/SKILL.md | add bullet under "Rules" | reusable craft rule |
| 2 | ...                     | ...            | memory/learnings.md     | add gotcha              | project-specific, unproven |
```

Then, for each row, show the **exact text to be inserted/edited** and the precise location
(section heading) in the target file.

---

## Step 4 — Apply (with guardrail gates)

After the user reviews:

1. **Skills / agents / config edits** — apply directly via `edit`, inserting into the correct
   section and matching the file's existing format (table row, bullet, heading). Never rewrite
   whole files; make minimal, surgical edits.
2. **Memory writes** (`memory/learnings.md`, `decisions.md`, `conventions.md`, `glossary.md`) —
   per `GUARDRAILS.md` §2: **show the exact entries, wait for explicit confirmation, THEN write.**
   Use the uniform entry format from `MEMORY.md` §4: `- **Title** — one-line description. (YYYY-MM-DD)`.
3. Preserve every file's section structure; do not delete existing content.

---

## Step 5 — Report

```
# Persisted
- [file]: [what was added] (skill | agent | config | memory)
...

# Skipped (not durable)
- [item] — [reason]

# Suggested follow-ups
- /refresh-overview  (if structure changed during the chat)
- /learnings --cleanup  (if memory is getting crowded)
```

---

## Rules

1. **Only this conversation** — do not invent learnings that weren't actually discussed or done.
2. **Skills/agents/config first, memory as fallback** — promote proven, reusable knowledge; park the rest in memory.
3. **One home per item** — no duplicating the same lesson across multiple files.
4. **Minimal edits** — insert into the right section, match existing format, never full-rewrite.
5. **Memory writes need confirmation** — show entries first, wait, then write (GUARDRAILS §2).
6. **No secrets** — never persist credentials, tokens, or private URLs.
7. **Explain placement** — every proposed change states _why_ that file is the right host.
8. **Never delete files** — only add or surgically edit; keep section structure intact.
