# Current Codex Handoff

Last updated: 11 July 2026

## Current phase and status

- Phase 3A is formally accepted and closed.
- Phase 3B Milestones 1, 2 and 3 are formally accepted and closed.
- Phase 3C Milestones 1, 2 and 3 are formally accepted and closed.
- Phase 4 Milestone 1 - Recurring, Budgets and Everyday Insights is active under Autonomous Phase Delivery Mode.
- Controlling contract: docs/PHASE_4_MILESTONE_1_CONTRACT.md.
- Approved remaining sequence: PR 4.4 everyday dashboard/trend insights; PR 4.5 QA/client review package.
- Stop for client retesting after PR 4.5. Do not formally close the milestone without client acceptance.

## Schema and migration gate

- PR #108 merged as f2d5e040294e05dd4c2d7641f171727aaad944cd.
- Preview migration 20260708090000_phase_4_recurring_budgets_foundation was applied once by run [29060523217](https://github.com/LatinMaestro/SpendGrove/actions/runs/29060523217).
- PR #110 merged as be53523040ba9a13b48d42408968fabf4b91c922.
- Verification-only run [29072916307](https://github.com/LatinMaestro/SpendGrove/actions/runs/29072916307) confirmed the exact approved schema, empty new tables, unchanged existing aggregate counts, masked Preview-only secrets and no Production secret.
- No Production migration has run.
- Do not rerun migrate mode. No further Preview migration is authorised.

## Completed Phase 4 implementation

### PR 4.2

- PR [#111](https://github.com/LatinMaestro/SpendGrove/pull/111) merged as 9a280eae650a884882be312d32974d73a8c1634d.
- Main deployment EFWHFi4a5j2FVbwSmzj9k86mAeEs was Ready.
- 80 test files / 490 tests passed; TypeScript/lint validation and production build passed.
- Deterministic recurring suggestions remain suggestions until user confirmation; confirm, dismiss, edit and archive are supported.
- Safe merchant/category, signed integer-cent amount and frozen interval evidence only. No private source fields, payments, Basiq or AI.

### PR 4.3

- PR [#112](https://github.com/LatinMaestro/SpendGrove/pull/112) merged as 723ef41228e79f3405c43120853e5a3658637751.
- Main deployment 9ptKVARAMsdRhvzYf7DNBCVnokkB was Ready.
- 82 test files / 500 tests passed; TypeScript/lint validation and production build passed.
- User-entered monthly category budgets support create, edit and archive.
- One active monthly budget per owned active expense category is enforced server-side.
- Progress uses the Brisbane calendar month and active owned everyday expense transactions; split parents, income, transfers and analytical loan repayment records are excluded.
- No schema or migration change occurred.

## Active PR 4.4 work

Branch: codex/phase-4-everyday-insights.

Approved implementation:

- read-only current-month spending total and transaction count;
- read-only previous-month comparison using the frozen formula;
- simple up, down, same and no-comparison states;
- top spending categories from active owned everyday expenses;
- compact progress for user-entered active monthly budgets;
- compact confirmed recurring-item list;
- clear empty states and mobile-first Home layout;
- split parents, deleted/inactive and cross-user transactions excluded;
- everyday transactions count once;
- loan repayment breakdowns and Property/reporting records are not queried or counted;
- no forecast, advice, Property/tax/net-worth/loan-balance statistic;
- no new navigation tab, schema, migration or write path.

## Exact next action

Publish PR 4.4 as one focused online GitHub change, run full tests/type/build, fix only in-scope failures, merge when green and privacy-safe, verify main, then complete PR 4.5 QA and the client review package.

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
