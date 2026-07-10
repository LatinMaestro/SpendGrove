# Current Codex Handoff

Last updated: 11 July 2026

## Current phase and status

- Phase 3A is formally accepted and closed.
- Phase 3B Milestones 1, 2 and 3 are formally accepted and closed.
- Phase 3C Milestones 1, 2 and 3 are formally accepted and closed.
- Phase 4 Milestone 1 - Recurring, Budgets and Everyday Insights is active and approved under Autonomous Phase Delivery Mode.
- Controlling contract: docs/PHASE_4_MILESTONE_1_CONTRACT.md.
- Approved remaining sequence: PR 4.3 category budgets; PR 4.4 everyday dashboard/trend insights; PR 4.5 QA/client review package.
- Stop for client retesting after PR 4.5. Do not formally close the milestone without client acceptance.

## Schema and migration gate

- PR #108 - Phase 4 schema foundation merged as f2d5e040294e05dd4c2d7641f171727aaad944cd.
- Migration: 20260708090000_phase_4_recurring_budgets_foundation.
- Original Preview workflow run [29060523217](https://github.com/LatinMaestro/SpendGrove/actions/runs/29060523217) passed preflight and prisma migrate deploy; the migration was applied once. Its post-check stopped on the order-sensitive false-negative EXPECTED_INDEXES_MISMATCH.
- PR #110 - order-insensitive exact index verification merged as be53523040ba9a13b48d42408968fabf4b91c922.
- Verify-only input attempt [29072876988](https://github.com/LatinMaestro/SpendGrove/actions/runs/29072876988) failed safely at confirmation because the migrate phrase was entered; all database steps were skipped.
- Corrected verification-only run [29072916307](https://github.com/LatinMaestro/SpendGrove/actions/runs/29072916307) completed green from main.
- The green verify-only run confirmed the migration is applied exactly once, no failed migration state exists, the approved enums/tables/indexes/foreign keys are exact, the three new tables were empty, existing aggregate counts were unchanged, Preview-only secrets were masked and no Production secret was mapped.
- No Production migration has run.
- Do not rerun migrate mode. No further Preview migration is authorised.

## Completed PR 4.2

- PR [#111](https://github.com/LatinMaestro/SpendGrove/pull/111) - reviewable recurring/subscription suggestions.
- Merge commit: 9a280eae650a884882be312d32974d73a8c1634d.
- Main Vercel deployment: [spendgrove.vercel.app](https://spendgrove.vercel.app), deployment EFWHFi4a5j2FVbwSmzj9k86mAeEs, Ready.
- Verification: 80 test files / 490 tests passed; TypeScript/lint validation and the clean Next.js production build passed.
- Suggestions use active owned everyday transactions, active safe merchant/category relationships, exact signed integer-cent amounts and the frozen weekly/fortnightly/monthly windows.
- Suggestions remain non-durable until user confirmation. Confirm, dismiss, safe edit and archive are supported.
- Safe audit reason/method/confidence codes only; no private source fields, cashflow duplication, payments, Basiq or AI.
- The initial server-write boundary failure was corrected before merge by narrowly allowlisting recurring-item, dismissal and safe audit writes. Category-budget writes remained blocked until PR 4.3.

## Active PR 4.3 work

Branch: codex/phase-4-category-budgets.

Approved implementation:

- user-entered monthly budgets for one active owned expense category;
- positive integer-cent budget amounts;
- create, edit and archive lifecycle;
- one active monthly budget per user/category, enforced server-side;
- stale-edit and ownership protection;
- Brisbane calendar-month boundaries;
- progress from active owned everyday expense transactions in the category;
- split parents excluded and eligible split children included;
- income and transfers excluded;
- loan repayment breakdowns and analytical records never queried or counted;
- safe aggregate progress and lifecycle audit codes only;
- mobile-first Home UI with no new navigation tab;
- no automatic budgets and no rollover.

No Prisma schema, migration, package, provider, secret or environment change is required.

## Exact next action

Publish PR 4.3 as one focused online GitHub change, run its tests/type/build through the normal checks, fix only in-scope failures, merge when green and privacy-safe, verify main, then continue to PR 4.4.

## Explicit exclusions and stop conditions

- No Production migration.
- No further Preview migration without separate explicit approval.
- No tax advice, automatic deductibility, ATO integration or tax reporting.
- No Property profit, yield, equity, valuation or net-worth feature.
- No Property/tax/loan Home statistics or loan-balance forecasting.
- No debt advice, credit advice or automatic financial advice.
- No Basiq/live bank connection, AI, payments, biller contact, household mode or document storage.
- No new navigation tab, package, provider, paid service, secret or environment change.
- Stop if contract formulas need to change, private source fields are needed, schema/migration changes appear, or Vercel/test/build status is unclear.

## Resume instruction

Resume from repository truth. Read AGENTS.md, docs/CODEX_CONTEXT_AND_HANDOFF_PROTOCOL.md, this handoff, docs/PHASE_4_MILESTONE_1_CONTRACT.md, docs/PHASE_4_MILESTONE_1_PREVIEW_MIGRATION_PLAN.md, docs/BUILD_PLAN.md and docs/DECISION_LOG.md. Verify GitHub branch/PR/check state. Continue only the authorised Phase 4 Milestone 1 PR sequence and preserve the exclusions above.
