---
description: 'Generate an execution plan for a task without writing any code'
name: 'plan'
---

# /plan - Generate an Execution Plan

## Command Usage

- `/plan <task description>` — Produce a full execution plan for the task
- `/plan` (no args) — Ask what to plan
- `/plan --quick <task>` — Mini-plan only: steps + agents, skip risks/memory sections

## Purpose

Invoke the Planner agent (`.github/agents/planner.agent.md`) to decompose a task into an ordered, agent-mapped execution plan **before any code is written**. Useful for scoping, estimation, and catching dependency/risk issues early.

## Workflow

1. Load `.github/agents/planner.agent.md` and adopt its persona and output format.
2. Follow its workflow: classify complexity → gather context (memory + codebase) → build plan → handoff.
3. Do NOT execute the plan — end at the handoff question (`proceed? (yes/no/adjust)`).
4. If the user answers `yes`, route to the handoff agent per `.github/ROUTER.md`.
5. If `adjust`, revise the plan with the user's changes and re-ask.

## Important Rules

- Planning is **read-only** — no file edits, no terminal commands.
- Always check `.github/memory/learnings.md` and `.github/memory/decisions.md` before finalizing a plan.
- Keep plans honest: flag unknowns as risks instead of guessing.
