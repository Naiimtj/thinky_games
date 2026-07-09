---
# Orchestrator Registry

Index of all meta-agents (orchestrators) available in `.github/agents/`.

Orchestrators differ from regular agents in that they **control other agents**: they decompose multi-domain tasks, enforce dependency ordering, and ensure proper delegation across file boundaries.

> Routing into orchestrators is owned by `.github/ROUTER.md`. Safety rules in `.github/GUARDRAILS.md` apply to every dispatched step. Tool permissions per agent: `.github/TOOLS.md`.

**When to use an orchestrator vs. a regular agent:**

| Situation | Use |
|-----------|-----|
| Task needs scoping/decomposition first (or complexity unclear) | `planner.agent.md` (read-only Planner) |
| Single domain (only UI, only store, only API) | Direct agent (component, store, api, test, i18n) |
| Multiple domains, NEW feature | `feature.agent.md` (Feature Orchestrator) |
| Multiple domains, MODIFY existing code | `refactor.agent.md` (Refactor Orchestrator) |
| Multi-concern code review (quality, styling, a11y, state, testing) | `reviewer.agent.md` (Review Orchestrator) |
| Questions about project structure | `overview.agent.md` (read-only) |
| GitLab MR creation | `merge-request.agent.md` (terminal only) |

---

## Available Orchestrators

| Orchestrator              | File                | Alias           | Purpose                                                               | Typical triggers                                                                                                                        |
| ------------------------- | ------------------- | --------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Planner**               | `planner.agent.md`  | `claude-sonnet` | Read-only task decomposition: plan, risks, memory check, handoff      | "Plan this", "How would you approach", `/plan`, complexity unclear                                                                      |
| **Feature Orchestrator**  | `feature.agent.md`  | `claude-opus`   | Build new features end-to-end across UI, state, API, i18n, tests      | "Add a new page", "Create a dashboard widget", "Build a login flow"                                                                     |
| **Refactor Orchestrator** | `refactor.agent.md` | `claude-sonnet` | Refactor, cleanup, or quality improvements that span multiple domains | "Rename this store everywhere", "Extract this logic into a composable", "Consolidate duplicate components", "Add types to untyped code" |
| **Review Orchestrator**   | `reviewer.agent.md` | `claude-sonnet` | Multi-concern code review across styling, quality, a11y, state, tests | "Review this PR", "Code review this file", "Check this component", "Full review"                                                        |

---

## Orchestrator Conventions

### File naming

- Single-domain agents: `[domain].agent.md`
- Multi-domain orchestrators: `[workflow].agent.md` (not `orchestrator.` prefix to keep it short)

### Frontmatter

Orchestrators use the same YAML frontmatter as regular agents:

```yaml
---
agent: agent
description: 'What this orchestrator does and when to use it'
tools: [read, edit, search, agent]
user-invocable: true
model: claude-opus
---
```

The `model` field sets the **default AI model alias** for the agent (see `.github/MODELS.md`). In VS Code Copilot Chat this is a recommended default — the user selects the actual model in the model picker, or the routing gate (`GUARDRAILS.md` §0) passes the mapped display name to `runSubagent`. There is no runtime resolver.

### Internal delegation format

When an orchestrator hands off to a specialized agent, it MUST use this exact output format so the user can follow the chain:

```
---
▶︎ Step N: [Domain Agent] — [One-line goal]
  Scope: [exact files]
Loading agent: .github/agents/[domain].agent.md
Loading skills: .github/skills/[skill].md
Executing...
[Agent output]
Changed: [created/modified files]
---
```

### Dependency rules (shared by all orchestrators)

1. **Store** → **Component** (component reads from store)
2. **API** → **Store** (store makes HTTP calls)
3. **Component** → **i18n** (i18n needs to know new labels)
4. **Implementation** → **Test** (tests need code to exist)
5. **Overview** (scan) can run anytime; usually first

### Stopping conditions

An orchestrator MUST stop and report a blocker when (full list: `.github/GUARDRAILS.md` §8):

- A specialized agent's step fails (e.g., API 404, test framework missing, compilation error).
- A file outside the current agent's scope must be modified.
- The user explicitly cancels during a confirmation prompt.
- A guardrail (protected path, destructive operation) is triggered mid-flow.

---

## Future Orchestrator Candidates

These are potential orchestrators that could be added:

| Name                     | Use case                                                          |
| ------------------------ | ----------------------------------------------------------------- |
| **Bug-fix Orchestrator** | Reproduce → locate → fix → verify across test + source + i18n     |
| **Docs Orchestrator**    | Update README, arc42, inline JSDoc, and changelog after a feature |
| **Release Orchestrator** | Version bump → changelog → MR → tag → deploy pipeline             |

To add a new orchestrator:

1. Create `.github/agents/[name].agent.md` following the Feature/Refactor templates.
2. Add it to the table above in this file.
3. Add its route to `.github/ROUTER.md` and its tool row to `.github/TOOLS.md`.
4. Mention it in `copilot-instructions.md` under the Orchestrator section.
5. Mention it in `README.md` under the Agents / Orchestrators section.
