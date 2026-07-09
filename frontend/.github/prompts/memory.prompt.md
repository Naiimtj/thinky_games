---
description: 'View and manage the project memory layer (learnings, decisions, conventions, glossary)'
name: 'memory'
---

# /memory - Manage Project Memory

## Command Usage

- `/memory` — Show a summary of all memory files with entry counts
- `/memory --help` or `/memory -h` — Display help
- `/memory decision <text>` — Record a new decision in `memory/decisions.md`
- `/memory convention <text>` — Record a convention in `memory/conventions.md`
- `/memory term <name>: <definition>` — Add a glossary term in `memory/glossary.md`
- `/memory search <keyword>` — Search all memory files for a keyword
- `/memory promote` — Review memory entries and suggest which should be promoted to skills

> For learnings specifically, use the dedicated `/learnings` command (view, cleanup, section filter).

## Purpose

Single entry point for the memory layer defined in `.github/MEMORY.md`. Keeps team-shared project knowledge (decisions, conventions, glossary) accurate and discoverable.

## Workflow

### Summary (`/memory`)

1. Read all files in `.github/memory/`.
2. Display entry counts per file and the 3 most recent entries of each.

### Record (`/memory decision|convention|term ...`)

1. Read the target file.
2. Format the entry per `MEMORY.md` §4: `- **Title** — description. (YYYY-MM-DD)`.
3. Check for duplicates/conflicts — if the new entry contradicts an existing one, show both and ask which wins.
4. Append under the correct section.

### Search (`/memory search <keyword>`)

1. Grep all `.github/memory/*.md` files for the keyword.
2. Display matches grouped by file.

### Promote (`/memory promote`)

1. Read `memory/conventions.md` and `memory/learnings.md`.
2. Identify entries that are stable (old, repeatedly confirmed) and map each to the matching `SKILL.md`.
3. Propose the promotion list — on confirmation, move content into the skill and delete from memory.

## Important Rules

- **Never delete memory files** — only edit contents; preserve section structure.
- Entries are one-liners — reject walls of text, summarize instead.
- No secrets, credentials, or personal data in memory files (they are committed to git).
