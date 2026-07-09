---
description: 'Review, clean up, and organize the project learnings file'
name: 'learnings'
---

# /learnings - Review & Manage Project Learnings

## Command Usage

Use `/learnings` to review, clean up, or query the project learnings knowledge base.

**Syntax:**

- `/learnings` — Display all current learnings organized by section
- `/learnings --help` or `/learnings -h` — Display help information
- `/learnings --cleanup` or `/learnings -c` — Review all entries, remove outdated ones, consolidate duplicates
- `/learnings --section <name>` or `/learnings -s <name>` — Show entries for a specific section (gotchas, patterns, mistakes, api, testing)

## Purpose

Keep the `.github/memory/learnings.md` file accurate, concise, and useful by periodically reviewing its contents. (Memory architecture: `.github/MEMORY.md`; for decisions/conventions/glossary use `/memory`.)

## When to Use

- **Periodically** — to prune stale entries and consolidate overlapping ones
- **At the start of a new focus area** — to review relevant learnings before diving in
- **When you suspect drift** — entries that contradict current codebase state

## Workflow

### Default (`/learnings`)

1. Read `.github/memory/learnings.md`
2. Display all entries grouped by section in a readable format
3. Highlight the count per section

### Cleanup (`/learnings --cleanup`)

1. Read `.github/memory/learnings.md`
2. For each entry, verify it's still relevant by checking the codebase if needed
3. **Remove** entries that are no longer true or relevant
4. **Consolidate** entries that say the same thing differently
5. **Move** entries that are in the wrong section
6. Report what was changed

### Section filter (`/learnings --section <name>`)

1. Read `.github/memory/learnings.md`
2. Display only the entries under the matching section
3. Section name matching is case-insensitive and partial (e.g., `api` matches "API & Backend Notes")

## Important Rules

- **Never delete the file** — only edit its contents
- **Preserve the section structure** — keep all 5 sections even if empty
- **Keep the format** — bold title + one-line description per entry
- **Don't add new entries during cleanup** — only remove, consolidate, or move
