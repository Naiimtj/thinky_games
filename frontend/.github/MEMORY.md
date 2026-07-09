# Memory — Persistent Project Knowledge Layer

Defines **what the AI remembers, where, and when** across conversations. Memory makes the framework scalable: new team members (human or agent) inherit accumulated project knowledge instead of rediscovering it.

---

## 1. Memory Tiers

| Tier               | Location                                             | Committed to git | Contents                                                            |
| ------------------ | ---------------------------------------------------- | ---------------- | ------------------------------------------------------------------- |
| **Repo memory**    | `.github/memory/`                                    | ✅ Yes           | Team-shared: learnings, decisions, conventions, glossary            |
| **Session memory** | `.history/` (conversations, thoughts)                | Optional         | Per-developer: chat archives (`/history`), quick notes (`/thought`) |
| **Tool memory**    | `/memories/repo/` (editor memory tool, if available) | ❌ No            | Mirror of repo memory for tools that auto-load it                   |

> **Repo memory is the source of truth.** If the editor's memory tool is available, sync key facts into it — but always write canonical entries to `.github/memory/`.

## 2. Memory Files

| File                    | Purpose                                                 | Managed by               |
| ----------------------- | ------------------------------------------------------- | ------------------------ |
| `memory/learnings.md`   | Gotchas, patterns, mistakes, API notes, testing notes   | `/learnings` prompt      |
| `memory/decisions.md`   | Lightweight ADRs — what was decided and why             | `/memory decision ...`   |
| `memory/conventions.md` | Verified project conventions not yet promoted to skills | `/memory convention ...` |
| `memory/glossary.md`    | Domain terms, abbreviations, entity names               | `/memory term ...`       |

## 3. Read Policy (when to consult memory)

Agents MUST read the relevant memory file:

- **Before starting any non-trivial task** → skim `learnings.md` section matching the domain.
- **Before architectural choices** → check `decisions.md` for prior decisions; never silently contradict one.
- **When encountering unfamiliar domain terms** → check `glossary.md`.
- **When unsure about a convention** → check `conventions.md` before asking the user.

## 4. Write Policy (when to record)

Record a new entry when:

| Trigger                                                      | Target file               |
| ------------------------------------------------------------ | ------------------------- |
| A bug took >2 attempts to fix and the cause was non-obvious  | `learnings.md` (gotchas)  |
| A reusable pattern emerged that isn't documented in a skill  | `learnings.md` (patterns) |
| The AI made a mistake the user had to correct                | `learnings.md` (mistakes) |
| The user made an explicit architectural/tooling choice       | `decisions.md`            |
| A convention was confirmed by the user or found consistently | `conventions.md`          |
| A domain term needed explanation                             | `glossary.md`             |

**Entry format** (uniform across files): one bullet, bold title + one-line description + date.

```markdown
- **Toast service needs app context** — `useToastService()` fails in route middleware; call it inside components/stores only. (2026-06-11)
```

**Do NOT record**: generic framework knowledge, one-off trivia, anything already in a skill, secrets or URLs with credentials.

## 5. Lifecycle & Hygiene

- **Promote**: when `conventions.md` or `learnings.md` entries stabilize, move them into the proper `SKILL.md` and delete from memory (skills are the curated layer; memory is the inbox).
- **Prune**: run `/learnings --cleanup` periodically — verify entries against the codebase, delete stale ones, consolidate duplicates.
- **Cap**: each memory file stays under ~100 entries. Past that, promote or prune.
- **Never delete the files themselves** — only edit contents. Keep section structure even when empty.

## 6. Memory in the Pipeline

```
Request → Guardrails → Router → [read memory] → Plan/Execute → [write memory] → Report
```

Orchestrators propagate relevant memory entries into dispatched agents' context ("Files in" + "Known gotchas").

---

## Adapting for Your Project

1. Seed files live in `.github/memory/` — keep their section structure, clear example entries.
2. If your team uses a wiki/ADR repo, link it from `decisions.md` instead of duplicating.
3. If the editor has no memory tool, ignore the tool-memory tier — repo memory is self-sufficient.
