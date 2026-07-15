# SpendGrove Build Plan

The active build plan is maintained in:

- `docs/BUILD_PLAN.md`

This file exists as a root-level pointer for Codex, Claude Code, Cursor, Replit Agent and other coding agents that look for simple planning files such as `PLAN.md`, `TASKS.md` or `TODO.md`.

Agents must also follow:

- `AGENTS.md`
- `docs/SpendGrove_v2_0_Master_Specification_Completeness_Checked.docx`
- `docs/AUTONOMOUS_DELIVERY_MODE.md`
- `docs/MVP_SCOPE.md`
- `docs/BUILD_PLAN.md`
- `docs/REVIEW_GATES.md`
- `docs/DEFINITION_OF_DONE.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/UI_REVIEW_GUIDE.md`
- `docs/UI_FEEDBACK_PROCESS.md`
- `docs/CSV_TESTING_PROTOCOL.md`
- `docs/DECISION_LOG.md`

Do not treat this file as a replacement for the master specification or the build plan.

Current active approved scope until changed by the client:

> Phase 5 Milestone 1 — Readiness Contract, Critical Security and Environment Gate

Only Milestone 1 is authorised. Phase 5 Milestones 2–6, Production migration, schema/data changes, provider changes, native packaging, App Store work and public launch remain unapproved. The immediate target is an account-based controlled Australian web private beta.

SpendGrove now uses Autonomous Phase Delivery Mode. Within an approved phase, the agent may create focused PRs, run tests/build/Vercel checks, self-review, merge green in-scope routine PRs and continue to the next approved PR without waiting for PR-by-PR client approval.

The agent must still pause for stop conditions, including scope expansion, unclear Vercel/test status, real secret/environment setup, paid services, material unapproved schema/privacy/security decisions, private data risk, major UI-pattern feedback needs and any work outside the approved phase.

At the end of each approved phase, the agent must create a complete Phase Summary Report and a non-technical user-testing checklist before recommending formal closure.
