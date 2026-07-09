---
# Models — Reference (which model each agent/prompt uses)
---

This is the single reference for which **model family/tier** each agent and prompt should use. In VS Code Copilot Chat there is **no runtime resolver** — the model is applied in one of two ways:

- **Interactively** — you select the model in the VS Code model picker. The `model:` value in each agent/prompt frontmatter is the **recommended default**, not an enforced constraint.
- **Via the routing gate** — `GUARDRAILS.md` §0 calls the `runSubagent` tool with the display name from the [runSubagent format mapping](#runsubagent-format-mapping) below.

> **Family matters, not version.** Per `GUARDRAILS.md` §0 rule 1a, routing/gate comparisons only compare the model **family/tier** (Opus, Sonnet, GPT-5, GPT-5 mini) — point-release numbers are ignored, because picker names rotate as new model versions ship.

## Aliases

The framework uses four short family aliases in agent/prompt frontmatter. They are documentation labels — map them to your actual picker names via the mapping table below.

| Alias           | Tier     | Family        |
| --------------- | -------- | ------------- |
| `claude-opus`   | Top-tier | Claude Opus   |
| `claude-sonnet` | Strong   | Claude Sonnet |
| `gpt-fast`      | Fast     | GPT-5         |
| `gpt-cheap`     | Cheap    | GPT-5 mini    |

## How to change a model

1. Edit the **Model** value in the Agents/Prompts table below.
2. Copy that same alias into the `model:` field of that agent/prompt's YAML frontmatter (path in the **File** column).
3. If the **family** changed, update the matching row in the [runSubagent format mapping](#runsubagent-format-mapping) so `GUARDRAILS.md` §0 keeps working.

## Agents

| Agent                    | File                            | Model           | Tier                                  |
| ------------------------ | ------------------------------- | --------------- | ------------------------------------- |
| API                      | `agents/api.agent.md`           | `claude-sonnet` | Strong (multi-file reasoning)         |
| Store                    | `agents/store.agent.md`         | `claude-sonnet` | Strong (multi-file reasoning)         |
| Test                     | `agents/test.agent.md`          | `claude-sonnet` | Strong (multi-file reasoning)         |
| Planner                  | `agents/planner.agent.md`       | `claude-sonnet` | Strong (multi-file reasoning)         |
| Refactor Orchestrator    | `agents/refactor.agent.md`      | `claude-sonnet` | Strong (multi-file reasoning)         |
| Review Orchestrator      | `agents/reviewer.agent.md`      | `claude-sonnet` | Strong (multi-file reasoning)         |
| Legacy Merger (internal) | `agents/legacy-merger.agent.md` | `claude-sonnet` | Strong (multi-file reasoning)         |
| Feature Orchestrator     | `agents/feature.agent.md`       | `claude-opus`   | Top-tier (multi-domain orchestration) |
| Component                | `agents/component.agent.md`     | `gpt-fast`      | Fast (templated code / iterative UI)  |
| i18n                     | `agents/i18n.agent.md`          | `gpt-cheap`     | Cheap (mechanical / read-only)        |
| Overview                 | `agents/overview.agent.md`      | `gpt-cheap`     | Cheap (mechanical / read-only)        |
| Merge Request            | `agents/merge-request.agent.md` | `gpt-cheap`     | Cheap (mechanical / read-only)        |

## Prompts

| Prompt         | File                            | Model           |
| -------------- | ------------------------------- | --------------- |
| `/history`     | `prompts/history.prompt.md`     | `claude-sonnet` |
| `/init-github` | `prompts/init-github.prompt.md` | `claude-sonnet` |
| `/modelUsage`  | `prompts/modelUsage.prompt.md`  | `claude-sonnet` |

> Other prompts (`check-impact`, `learnings`, `memory`, `plan`, `refresh-overview`, `skills`, `thought`, `update-chat-github`, `verify-legacy-merge`) don't declare a model — they run on whatever model is currently active in the conversation.

## runSubagent format mapping

Used exclusively by `GUARDRAILS.md` §0 when calling the `runSubagent` tool, which needs the **exact display name** from your VS Code model picker (format: `"Name (vendor)"`).

| Alias (frontmatter) | `runSubagent` `model` parameter |
| ------------------- | ------------------------------- |
| `claude-opus`       | `"Claude Opus 4.8 (copilot)"`   |
| `claude-sonnet`     | `"Claude Sonnet 5 (copilot)"` |
| `gpt-fast`          | `"GPT-5 (copilot)"`             |
| `gpt-cheap`         | `"GPT-5 mini (copilot)"`        |

> **Adjust these to match your picker.** Copilot model names rotate as new versions ship. If a name here doesn't match your VS Code model picker, update it — only the family needs to stay the same (see the family-only rule at the top).

## Model decision heuristic

| Alias           | Tier               | Use when                                                                                                     |
| --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `claude-opus`   | Top-tier (Opus)    | Maximum complexity: multi-domain orchestration, many interdependent steps, context propagation across agents |
| `claude-sonnet` | Strong (Sonnet)    | Multi-file reasoning, long context, architectural decisions, impact analysis                                 |
| `gpt-fast`      | Fast (GPT-5)       | Templated code generation, iterative UI, moderate complexity                                                 |
| `gpt-cheap`     | Cheap (GPT-5 mini) | Mechanical/repetitive tasks, latency-sensitive, read-only lookups                                            |
