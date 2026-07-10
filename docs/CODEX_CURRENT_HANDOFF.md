# Current Codex Handoff

Last updated: 10 July 2026

## Current phase and status

- Phase 3A is formally accepted and closed.
- Phase 3B Milestones 1, 2 and 3 are formally accepted and closed.
- Phase 3C Milestones 1, 2 and 3 are formally accepted and closed.
- Phase 4 Milestone 1 - Recurring, Budgets and Everyday Insights is active and approved under Autonomous Phase Delivery Mode.
- Controlling contract: `docs/PHASE_4_MILESTONE_1_CONTRACT.md`.
- Approved remaining sequence: PR 4.2 recurring suggestions; PR 4.3 category budgets; PR 4.4 everyday dashboard/trend insights; PR 4.5 QA/client review package.
- Stop for client retesting after PR 4.5. Do not formally close the milestone without client acceptance.

## Schema and migration gate

- PR #108 - Phase 4 schema foundation merged as `f2d5e040294e05dd4c2d7641f171727aaad944cd`.
- Migration: `20260708090000_phase_4_recurring_budgets_foundation`.
- Original Preview workflow run [29060523217](https://github.com/LatinMaestro/SpendGrove/actions/runs/29060523217) passed preflight and `prisma migrate deploy`; the migration was applied once. Its post-check stopped on the order-sensitive false-negative `EXPECTED_INDEXES_MISMATCH`.
- PR #110 - order-insensitive exact index verification merged as `be53523040ba9a13b48d42408968fabf4b91c922`.
- Verify-only input attempt [29072876988](https://github.com/LatinMaestro/SpendGrove/actions/runs/29072876988) failed safely at confirmation because the migrate phrase was entered; all database steps were skipped.
- Corrected verification-only run [29072916307](https://github.com/LatinMaestro/SpendGrove/actions/runs/29072916307) completed green from `main` at `be53523040ba9a13b48d42408968fabf4b91c922`.
- The green verify-only run confirmed:
  - the expected migration is applied exactly once;
  - no failed or unresolved migration state;
  - exact approved enums, audit values, tables, columns, indexes and foreign keys;
  - `RecurringItem`, `RecurringSuggestionDismissal` and `CategoryBudget` contain zero rows;
  - existing safe aggregate counts are unchanged;
  - Preview-only secrets were present and masked;
  - no Production secret was mapped;
  - pre-migration and deploy steps were skipped in verify-only mode.
- No Production migration has run.
- Do not rerun migrate mode. No further Preview migration is authorised.

## Active PR 4.2 work

PR: [#111](https://github.com/LatinMaestro/SpendGrove/pull/111) from branch `codex/phase-4-recurring-suggestions`.

Approved implementation:

- deterministic suggestions from active owned everyday transactions only;
- same active safe merchant profile, same active category, same transaction type and exact signed integer-cent amount;
- weekly 6-8 day, fortnightly 13-16 day and monthly 27-34 day windows;
- three or more matches: high-confidence suggestion;
- two matches: review suggestion;
- ambiguous, conflicting, deleted, cross-user, transfer or split-parent evidence: no suggestion;
- user confirmation required before a durable `RecurringItem`;
- safe user edit, dismissal and archive;
- safe reason/method/confidence audit codes only;
- recurring items remain planning/review records and never create cashflow or payments.

Current online branch changes include the server detector/lifecycle service, authenticated account API, mobile-first Home review UI, focused tests and permanent migration documentation. No local repository writes are required for this work.

## Verification status

- PR #110 verification: 78 test files / 477 tests passed and production build passed on Vercel.
- The first PR #111 Vercel attempt was blocked before build by the documented account build-rate limit; this was not an application failure.
- A fresh Vercel build is required before merge.
- No Vercel status should be treated as green until tests, type-check and production build complete.

## Exact next action

Finish self-review of the PR 4.2 branch, publish the focused PR, fix only in-scope test/type/build issues, merge when green and privacy-safe, verify main, update this handoff with PR/merge/deployment evidence, then proceed to PR 4.3.

## Explicit exclusions and stop conditions

- No Production migration.
- No further Preview migration without separate explicit approval.
- No tax advice, automatic deductibility, ATO integration or tax reporting.
- No Property profit, yield, equity, valuation or net-worth feature.
- No Property/tax/loan Home statistics or loan-balance forecasting.
- No debt advice, credit advice or automatic financial advice.
- No Basiq/live bank connection, AI, payments, biller contact, household mode or document storage.
- No new navigation tab, package, provider, paid service, secret or environment change.
- Stop if recurring thresholds need to change, private source fields are needed, schema/migration changes appear, or Vercel/test/build status is unclear.

## Resume instruction

Resume from repository truth. Read `AGENTS.md`, `docs/CODEX_CONTEXT_AND_HANDOFF_PROTOCOL.md`, this handoff, `docs/PHASE_4_MILESTONE_1_CONTRACT.md`, `docs/PHASE_4_MILESTONE_1_PREVIEW_MIGRATION_PLAN.md`, `docs/BUILD_PLAN.md` and `docs/DECISION_LOG.md`. Verify GitHub branch/PR/check state. Continue only the authorised Phase 4 Milestone 1 PR sequence and preserve the exclusions above.
