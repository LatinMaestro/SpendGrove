# Codex Context and Handoff Protocol

## Purpose

This protocol keeps SpendGrove work resumable across Codex threads, context limits and pauses without weakening privacy, scope or review gates.

## Sources of truth

Before changing code, read in this order:

1. `AGENTS.md` and the master specification named there.
2. `docs/CODEX_CURRENT_HANDOFF.md`.
3. The active phase plan, summary, review gates and decision log.
4. Repository and GitHub truth: current `main`, open PRs, checks and deployment status.

Repository truth overrides stale conversational notes. Never assume a PR is open, merged or green without checking.

## Work loop

Use focused, PR-sized loops:

1. Confirm the active phase, task, exclusions and stop conditions.
2. Inspect the current implementation and existing tests before editing.
3. Implement only the approved slice.
4. Run proportionate tests, build and privacy/security checks.
5. Open a clear PR with evidence and known limitations.
6. Merge only when the PR is green, in scope and privacy-safe.
7. Verify the resulting `main` deployment.
8. Update `docs/CODEX_CURRENT_HANDOFF.md` whenever the next action or repository state materially changes.

Do not begin a later phase merely because the current implementation is complete. Phase transitions and phase closure require explicit client approval.

## Required handoff contents

`docs/CODEX_CURRENT_HANDOFF.md` must remain concise and contain:

- current phase and formal phase status;
- current objective and exact next action;
- latest relevant merged PR and commit;
- open PRs/branches, if any;
- test, build and Vercel status;
- database migration status by environment;
- completed work and remaining acceptance work;
- blockers or decisions requiring the client;
- explicit exclusions and stop conditions;
- a short resume instruction.

Use absolute dates and commit/PR identifiers. Do not include secrets, raw CSV content, filenames, balances, descriptions, account identifiers or other private financial data.

## Context management

At natural checkpoints, compress investigation detail into durable repository notes rather than relying on chat history. Update the handoff before:

- stopping for client review;
- handing work to another thread or agent;
- ending after a merge;
- waiting on an external check or approval;
- approaching a context limit during unfinished work.

Keep implementation detail in code, tests and PRs; keep the handoff focused on state, evidence, decisions and the next action.

## Resume procedure

A resuming Codex should:

1. Read this protocol and `docs/CODEX_CURRENT_HANDOFF.md`.
2. Check GitHub and `main` for changes since the handoff.
3. Reconcile discrepancies in favour of repository truth.
4. Continue the exact next action if it remains authorised.
5. Pause if a stop condition, scope change, failed gate or client decision is encountered.

Suggested resume prompt:

> Resume SpendGrove from repository truth. Read `AGENTS.md`, `docs/CODEX_CONTEXT_AND_HANDOFF_PROTOCOL.md` and `docs/CODEX_CURRENT_HANDOFF.md`; verify current GitHub/Vercel state; perform only the authorised next action; preserve privacy and stop conditions.

## Privacy and operational boundaries

Handoffs and review packages must use synthetic examples only. Never place sensitive customer data, credentials, connection strings or production data in repository documents, issues, PRs, logs or screenshots. Preview and Production environments remain separate, and database migrations require the controls defined by the active plan and review gates.
