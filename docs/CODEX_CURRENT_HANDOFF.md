# Current Codex Handoff

Last updated: 12 July 2026

## Current phase and status

- Phase 3A is formally accepted and closed.
- Phase 3B Milestones 1, 2 and 3 are formally accepted and closed.
- Phase 3C Milestones 1, 2 and 3 are formally accepted and closed.
- Phase 4 Milestone 1 - Recurring, Budgets and Everyday Insights has completed implementation and QA.
- The milestone is parked for client retesting. It is not formally closed.
- Client review package: docs/PHASE_4_MILESTONE_1_SUMMARY.md.
- Do not begin another milestone until client acceptance and a separately approved plan.

## Completed Phase 4 PR chain

- PR #106 contract merged as c860637d2f150c2345babf5921eb72fdd352601f.
- PR #107 migration plan document merged as 157c0b81b0653049403e6722cba41eaa2420a602.
- PR #108 schema foundation merged as f2d5e040294e05dd4c2d7641f171727aaad944cd.
- PR #109 Phase 4 Preview checker profile merged as 06d88cf147ccce03f261c5a109a768c56d192017.
- PR #110 order-insensitive verification correction merged as be53523040ba9a13b48d42408968fabf4b91c922.
- PR #111 recurring suggestions merged as 9a280eae650a884882be312d32974d73a8c1634d.
- PR #112 category budgets merged as 723ef41228e79f3405c43120853e5a3658637751.
- PR #113 everyday dashboard insights merged as 67a185839b3c67fd136fb9abbdd528944107aea9.
- PR 4.5 is documentation-only QA and the client review stop gate.

## Schema and migration status

- Preview migration: 20260708090000_phase_4_recurring_budgets_foundation.
- Deploy run [29060523217](https://github.com/LatinMaestro/SpendGrove/actions/runs/29060523217) applied it once.
- Verify-only run [29072916307](https://github.com/LatinMaestro/SpendGrove/actions/runs/29072916307) confirmed the exact approved schema, empty new tables and unchanged existing aggregate counts.
- Preview-only secrets were used and masked; no Production secret was mapped.
- No further Preview migration ran for PRs #111-#113.
- No Production migration has run.
- Do not rerun the Phase 4 migration.

## Delivered behaviour

Recurring:

- deterministic suggestions from active owned safe merchant/category, type, exact signed amount and frozen interval windows;
- two occurrences produce a review suggestion and three or more produce a clear suggestion;
- user confirmation is required before durable state;
- safe confirm, dismiss, edit and archive lifecycle;
- no payment, merchant contact or forecast.

Budgets:

- user-entered monthly expense-category budgets;
- positive integer-cent amounts;
- create, edit and archive;
- one active monthly budget per user/category;
- Brisbane calendar-month progress;
- active owned everyday expenses only;
- split parents, income, transfers and analytical loan repayment records excluded;
- no rollover or automatic budget creation.

Everyday Home overview:

- current-month spending and eligible transaction count;
- top spending categories;
- active budget progress;
- confirmed recurring items;
- explicit previous-month comparison;
- no forecast, advice, Property/tax/net-worth/loan-balance statistic.

Everyday transactions remain the only cashflow records.

## Verification evidence

- Latest functional verification: 84 test files / 511 tests passed.
- TypeScript/lint validity checks passed.
- Clean Next.js production build passed.
- PR #113 Preview deployment 3YnDyJBnaN12KxBQLS2yLq85kSCU: Ready.
- PR #113 main merge: 67a185839b3c67fd136fb9abbdd528944107aea9.
- Main deployment Cqz59vm8BQ1TtHjTS94otLGnaFZf: Ready.
- Canonical URL: [https://spendgrove.vercel.app](https://spendgrove.vercel.app).
- Public /, /transactions, /import and /loans routes returned HTTP 200.
- The initial PR #113 Vercel throttle was an account build-rate block before build, not an application failure; the later unchanged-scope build passed.

## Privacy and security state

No recurring, budget or insight flow persists, logs or displays raw CSV files, raw rows, filenames, raw narration, account identifiers, BSBs, card fragments, customer IDs, loan/lender references, masked identifiers, exact addresses, balances, secrets or connection strings.

Reads and writes are user-scoped. Stale recurring/budget edits are rejected. Audit metadata contains safe lifecycle, confidence, method, state and changed-field codes only.

## Exact next action

Stop for client retesting using docs/PHASE_4_MILESTONE_1_SUMMARY.md.

Do not formally close Phase 4 Milestone 1 until the client confirms acceptance. Do not start a next milestone.

## Explicit exclusions

- No Production migration.
- No further Preview migration without separate explicit approval.
- No tax advice, automatic deductibility, ATO integration or tax reporting.
- No Property profit, yield, equity, valuation or net-worth feature.
- No Property/tax/loan Home statistics or loan-balance forecasting.
- No debt advice, credit advice or automatic financial advice.
- No Basiq/live bank connection, AI, payments, biller contact, household mode or document storage.
- No new navigation tab, package, provider, paid service, secret or environment change.
- No later module.

## Resume instruction

Resume from repository truth. Read AGENTS.md, docs/CODEX_CONTEXT_AND_HANDOFF_PROTOCOL.md, this handoff, docs/PHASE_4_MILESTONE_1_CONTRACT.md, docs/PHASE_4_MILESTONE_1_PREVIEW_MIGRATION_PLAN.md, docs/PHASE_4_MILESTONE_1_SUMMARY.md, docs/BUILD_PLAN.md and docs/DECISION_LOG.md. Preserve the client-retesting stop gate.
