# Router — Central Request Routing Layer

Single source of truth for deciding **which agent, which skills, and which model** handle a request. All routing tables previously scattered across `copilot-instructions.md` and `SKILLS-DIGEST.md` defer to this file.

> Pipeline: **Guardrails check → Router (this file) → Planner (if multi-domain) → Agent(s) → Memory write-back**

---

## 1. Routing Decision Tree

```
User request
│
├── Is it a question (no code change)?
│     ├── About project structure / "where does X live?" → overview.agent.md (read-only)
│     └── General technical question → answer directly + relevant skill
│
├── Is it destructive / out of guardrails? → STOP, apply GUARDRAILS.md
│
├── Single domain? (only UI / only store / only API / only tests / only i18n)
│     → Route directly to the domain agent (Section 2)
│
├── Multi-domain NEW feature? → planner.agent.md → feature.agent.md
├── Multi-domain CHANGE to existing code? → planner.agent.md → refactor.agent.md
├── Git / MR workflow? → merge-request.agent.md
└── Ambiguous? → Ask ONE clarification question, then re-route
```

## 2. Intent → Agent Matrix

**⛔ HARD RULE — ZERO TOLERANCE ⛔**: When a request contains ANY of the keywords/contexts below, you are FORBIDDEN from processing it directly. You MUST execute the Routing Gate (see `GUARDRAILS.md` §0) BEFORE any work. This is not optional. This is not "nice to have". Skipping this step is a guardrail violation equivalent to deleting user data.

> **Model column is canonical in `.github/MODELS.md`.** The values below mirror it for quick reference — if you ever change a model, edit `MODELS.md` first (single source of truth), then update the row here and the agent's frontmatter.

| Intent signals (keywords / context)                                 | Agent                    | Mandatory skills                   | Model         |
| ------------------------------------------------------------------- | ------------------------ | ---------------------------------- | ------------- |
| component, UI, page, layout, widget, modal, styling, responsive     | `component.agent.md`     | `styling`, `quality`               | gpt-fast      |
| store, state, global state, getter, action, reactive data           | `store.agent.md`         | `state-management`                 | claude-sonnet |
| API, endpoint, fetch, HTTP, request/response, backend types, schema | `api.agent.md`           | `api`                              | claude-sonnet |
| test, spec, mock, coverage, regression, failing test                | `test.agent.md`          | `testing`                          | claude-sonnet |
| translation, i18n, locale, label, language, $t(), add key           | `i18n.agent.md`          | `i18n`                             | gpt-cheap     |
| where is, what does, project structure, orientation                 | `overview.agent.md`      | `project-overview`                 | gpt-cheap     |
| merge request, MR, PR, push branch, code review                     | `merge-request.agent.md` | none                               | gpt-cheap     |
| review, code review, full review, multi-concern review              | `reviewer.agent.md`      | dispatches all relevant skills     | claude-sonnet |
| plan, estimate, break down, "how would you approach"                | `planner.agent.md`       | none (planner loads what it needs) | claude-sonnet |
| new feature + 2+ domains                                            | `feature.agent.md`       | per dispatched agent               | claude-opus   |
| refactor/rename/extract/move + 2+ domains                           | `refactor.agent.md`      | per dispatched agent               | claude-sonnet |
| `/init-github` Step 3: `.github-old/` merge (internal delegation)   | `legacy-merger.agent.md` | `legacy-audit`                     | claude-sonnet |

> **Note**: `legacy-merger` is NOT user-facing. It's invoked exclusively by `/init-github` Step 3 when `.github-old/` is detected. Never route user requests here.

### Model Optimization Rule (MANDATORY — applies to ALL agents, ALL models, ALL conversations)

**This is not a suggestion. This is a hard requirement. Failure to comply is a guardrail violation.**

> **Model comparison = family only, NOT version.** See `GUARDRAILS.md` §0 rule 1a — compare declared vs. current model by **family/tier name** (Sonnet, Opus, GPT-5, GPT-5 mini, etc.), ignoring version/point-release numbers. Same family = match, no gate needed, regardless of exact version.

**When routing to ANY specialized agent**:

1. **STOP before processing** — Do NOT write code, edit files, or run commands.
2. **Show the Routing Gate block** (exact format in `GUARDRAILS.md` §0):

   ```
   ⚠️ ROUTING GATE
   This task matches: @[agent-name]
   Declared model: [model-name]
   Current model: [your model]

   Options:
   1. Invoke @[agent-name] directly (guarantees declared model)
   2. I process it with my current model ([current-model])

   Which do you prefer?
   ```

3. **WAIT for user response** — Do NOT assume, do NOT proceed silently.
4. **If user says "use the agent"** or "direct" or "1": respond with `@[agent-name] [task description]` and stop.
5. **If user says "process it"** or "continue" or "2": proceed with current model + load agent's mandatory skills.

> **WHY**: `runSubagent()` doesn't respect child agent's `model:` frontmatter — always uses parent's model. Direct user invocation (`@agent-name`) is the only way to guarantee the declared model is used. gpt-cheap tasks cost 10-20× less than opus/sonnet.

**SELF-CHECK for ALL AI models reading this**: If you are about to write/edit code and you have NOT yet shown the routing gate block for a matching task — STOP. You are about to violate this rule. Go back and show the gate.

**Cost/Quality Trade-offs**:

- **gpt-cheap** → fastest, cheapest (10-20× less than sonnet), ideal for mechanical tasks
- **gpt-fast** → fast iterative UI work, template generation
- **claude-sonnet** → multi-file reasoning, schema work, impact analysis
- **claude-opus** → complex orchestration, long dependency chains

> Skill trigger details: see `skills/SKILLS-DIGEST.md`. Cross-cutting skills (`accessibility`, `quality`, `caveman`) combine with any route.

## 3. Model Routing

> Canonical per-agent model assignments live in `.github/MODELS.md` — this section only summarises the tiers. Edit `MODELS.md` to change a model, not this table.

| Complexity tier                                    | Tier (see MODELS.md) | Routes                               |
| -------------------------------------------------- | -------------------- | ------------------------------------ |
| Multi-domain orchestration, long dependency chains | Top-tier (Opus)      | feature, planner (complex plans)     |
| Multi-file reasoning, impact analysis, schemas     | Strong (Sonnet)      | api, store, refactor, test, reviewer |
| Templated code generation, iterative UI            | Fast (gpt-fast)      | component                            |
| Mechanical / repetitive / read-only                | Cheap (GPT-5 mini)   | i18n, overview, merge-request        |

**Escalation rule**: if a cheap-tier agent fails twice on the same task, retry once with the next tier up before reporting a blocker.

## 4. Tie-Breaking Rules

1. **Specific beats general**: "test the store" → test agent (not store agent).
2. **Verb wins over noun**: "refactor the API layer" → refactor orchestrator (not api agent) if 2+ domains affected.
3. **2+ domains → orchestrator, always.** Never let a domain agent freelance across boundaries.
4. **Read-only beats write**: pure questions never route to writing agents.
5. **When two domain agents tie**, route to planner for decomposition.

## 5. Fallback & Escalation

- No matching route + non-trivial task → ask ONE clarification question.
- Agent discovers mid-task it needs another domain → return to router, dispatch the correct agent (orchestrators handle this natively).
- Repeated failures (2x) → stop, report blocker per `GUARDRAILS.md` stop conditions.

## 6. Routing Visibility

Every routed response starts with a one-line trace:

```
Route: [agent] | Skills: [skill list] | Model: [model]
```

For orchestrated flows, the orchestrator's step format (see `ORCHESTRATORS.md`) replaces this per step.

---

## Adapting for Your Project

1. Rename/add domain agents to match your stack (e.g., split `component` into `design-system` + `views`).
2. Fill in `[TODO]` model names with the models available to your team.
3. Keep the matrix in sync when adding agents — a route that points to a missing file breaks the chain.
