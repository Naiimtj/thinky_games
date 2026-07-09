# Project Learnings

Knowledge base of verified, project-specific learnings. Managed via `/learnings`. Entry format: `- **Title** — one-line description. (YYYY-MM-DD)`. See `../MEMORY.md` for read/write policy.

## Gotchas

<!-- Non-obvious behaviors that cost debugging time -->

## Patterns

<!-- Reusable patterns confirmed to work in this codebase, not yet promoted to a skill -->

- **⛔ Routing Gate Trigger List (2026-06-26)** — Keyword-based instant routing: locale/translation/i18n/traducción → i18n agent; test/spec/vitest → test agent; store/state/createGlobalState → store agent; component/vue creation → component agent; API/endpoint/HTTP → api agent; review/audit → reviewer agent; refactor/rename across files → refactor agent. If ANY trigger matches → STOP, show gate, WAIT. No exceptions even for "trivial" tasks.

## Mistakes

<!-- Mistakes the AI made that the user corrected — prevent repeats -->

- **⛔ Incorrectly discarded PostToolUse hooks (2026-06-15)** — Assumed VS Code PostToolUse hooks don't work in GitHub Copilot Chat without verifying. Discarded `.github-old/hooks/` during legacy merge. User caught the error. Rule: NEVER discard code based on assumptions — copy first, let user decide. If uncertain whether something applies, ASK. Now codified as GUARDRAILS.md §11. (2026-06-15)

- **⛔ Template files not adapted during init-github (2026-06-15)** — `/init-github` created `store.agent.md` and `test.agent.md` from generic templates with [TODO] placeholders and wrong stack references (createGlobalState instead of Pinia, Vitest instead of Jest). The correct RDCP-specific versions were in `.github-old/` but were not used. Root cause: legacy-merger agent merged only SOME files, but left others as generic templates. This was not detected until user requested full audit. Rule: ALWAYS verify template files were actually adapted after init-github, not just created with placeholders. Added verification checklist to legacy-audit skill. (2026-06-15)

- **⛔ Assumed api.agent.md was correctly merged (2026-06-15)** — `api.agent.md` differs by 150 lines between OLD (RDCP-specific with real URLs) and NEW (generic template with [TODO]). The generic template was used instead of merging RDCP content. This pattern repeated across multiple files. Root cause: No systematic diff verification in Phase 5 of legacy-audit protocol. Rule: EVERY merged file must have explicit diff verification showing what OLD content was integrated vs. what was kept from template. Marked api.agent.md for manual fusion. (2026-06-15)

- **⛔ Routing Gate violation (2026-06-12)** — i18n task ("translation") was processed directly with Claude Opus instead of showing the Routing Gate block and asking user which model/agent. Rule: ALWAYS check ROUTER.md §2 BEFORE any work. If task matches an agent, show GUARDRAILS.md §0 gate block and WAIT. Never process silently. (2026-06-12)

- **⛔ Used PC /memories/ for project rules (2026-06-12)** — Stored project-specific routing gate detail in VS Code persistent memory instead of `.github/memory/`. Rule: ALL project knowledge goes in `.github/memory/` of the repo. PC `/memories/` is ONLY for cross-project user preferences. (2026-06-12)

- **⛔ Orchestrator MUST enforce assigned models (2026-06-12)** — When ROUTER.md assigns a specific model to an agent (e.g. i18n → GPT-4.1), the orchestrator MUST delegate to that agent with that model. Never execute the task directly in the current model. The orchestrator's ONLY job is routing + delegation, not execution. If it processes work itself instead of delegating, it has failed its purpose. (2026-06-12)

## API & Backend Notes

<!-- Endpoint quirks, response shape surprises, auth behaviors -->

## Testing Notes

<!-- Mock setups, flaky-test causes, environment quirks -->
