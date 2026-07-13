# Current Codex Handoff

Last updated: 13 July 2026

## Current phase and status

- Phase 3A is formally accepted and closed.
- Phase 3B Milestones 1, 2 and 3 are formally accepted and closed.
- Phase 3C Milestones 1, 2 and 3 are formally accepted and closed.
- Phase 4 Milestone 1 - Recurring, Budgets and Everyday Insights is implemented, merged, deployed and technically verified.
- Phase 4 Milestone 1 is not formally accepted or closed. Client retesting is deferred because the client is temporarily away from the Vercel review environment.
- The client authorised continued Phase 4 development before completing Milestone 1 retesting. Later feedback may require focused Milestone 1 acceptance hardening.
- Phase 4 Milestone 2 - Recurring and Budget Lifecycle Recovery is implemented, merged, deployed and technically verified, but remains open pending deferred client retesting.
- Controlling Milestone 2 contract: docs/PHASE_4_MILESTONE_2_CONTRACT.md.
- Schema assessment: docs/PHASE_4_MILESTONE_2_SCHEMA_ASSESSMENT.md.
- Consolidated testing backlog: docs/DEFERRED_CLIENT_RETESTING.md.
- Phase 4 Milestone 3 - Beginner-first UI Simplification and Product Polish is implemented, merged, deployed and technically verified, but remains open pending deferred client retesting.
- Its UI-only delivery used internal work labels 4.12-4.17 to avoid collision with completed Milestone 2 labels 4.6-4.8.
- Controlling documents: docs/PHASE_4_MILESTONE_3_UI_CONTRACT.md, docs/PHASE_4_MILESTONE_3_INTERFACE_AUDIT.md and docs/PHASE_4_MILESTONE_3_SUMMARY.md.

## Phase 4 Milestone 1 evidence

Completed PR chain:

- #106 contract: c860637d2f150c2345babf5921eb72fdd352601f;
- #107 migration plan: 157c0b81b0653049403e6722cba41eaa2420a602;
- #108 schema foundation: f2d5e040294e05dd4c2d7641f171727aaad944cd;
- #109 Preview checker profile: 06d88cf147ccce03f261c5a109a768c56d192017;
- #110 verification correction: be53523040ba9a13b48d42408968fabf4b91c922;
- #111 recurring suggestions: 9a280eae650a884882be312d32974d73a8c1634d;
- #112 category budgets: 723ef41228e79f3405c43120853e5a3658637751;
- #113 everyday dashboard: 67a185839b3c67fd136fb9abbdd528944107aea9;
- #114 QA package: 402a30e4ea216acf2419fa8304377c346f8087c3.

Technical verification:

- 84 test files / 511 tests passed;
- TypeScript/lint validity passed;
- clean production build passed;
- final main deployment EQhMvit4s8b4SdhsSdZFyE3bMwtZ is Ready;
- canonical URL: https://spendgrove.vercel.app;
- public /, /transactions, /import and /loans returned HTTP 200.

Migration:

- Preview migration 20260708090000_phase_4_recurring_budgets_foundation applied once by run 29060523217;
- verify-only run 29072916307 confirmed exact schema, empty new tables and unchanged existing aggregate counts;
- no later Preview migration ran;
- no Production migration has run.

Keep all Milestone 1 features visible and testable. Do not record client acceptance until explicitly provided.

## Phase 4 Milestone 2 objective

Improve lifecycle recovery without changing financial calculations:

- show active and archived recurring items separately;
- explicitly restore owned archived recurring items;
- show still-relevant dismissed recurring suggestions separately;
- explicitly undo an owned dismissal preference;
- show active and archived monthly budgets separately;
- explicitly restore owned archived budgets;
- preserve all Milestone 1 formulas, privacy rules and no-double-count behaviour.

No reminders, notifications, due-status thresholds, transaction matching, navigation changes or new financial calculations are included.

## Approved Milestone 2 sequence

1. PR 4.6 - contract, no-schema assessment and deferred testing register.
2. PR 4.7 - recurring and budget lifecycle recovery in one coherent implementation batch.
3. PR 4.8 - regression hardening, QA and consolidated deferred client package.

Completed delivery:

- PR #115 / 4.6 contract, no-schema assessment and deferred register: `9dde5423db6934718e369e66cc9b3f1759bf26ce`;
- PR #116 / 4.7 lifecycle implementation: `71f0b5a50cf6ec65839b83935e779ea5c2ccb59f`;
- PR 4.8 records QA and the consolidated deferred client package.

Verification after PR #116:

- 84 test files / 513 tests passed;
- TypeScript and lint validity passed;
- clean production build passed;
- Preview deployment `CnC9hWFjjRmwx9p4rKhHdVxxmHrC` is Ready;
- merged-main deployment `91RcdUep4v6E21iFRvnt5TTHX8Bx` is Ready;
- canonical URL: https://spendgrove.vercel.app;
- public `/`, `/transactions`, `/import` and `/loans` returned HTTP 200.

Both Phase 4 Milestones 1 and 2 remain open pending deferred client retesting. Do not formally close either milestone.

## Schema and migration gate

Milestone 2 uses existing fields:

- RecurringItem ACTIVE/ARCHIVED, archivedAt and updatedAt;
- RecurringSuggestionDismissal owned safe suggestion key;
- CategoryBudget ACTIVE/ARCHIVED, archivedAt and updatedAt.

No schema change, migration, package, provider, secret or environment change is expected.

Stop immediately if implementation requires any such change. No Preview migration and no Production migration are authorised.

## Preserved rules

- Recurring thresholds remain exact signed amount plus approved safe merchant/category/type and interval windows.
- Budgets remain monthly with the unchanged active-owned expense formula.
- No rollover.
- Split parents remain excluded and eligible split children included.
- Income, transfers, deleted/inactive/cross-user rows and analytical loan repayment records remain excluded from budget progress.
- Everyday transactions remain the only cashflow records.
- Recurring and budget records remain planning records.
- Restore and dismissal undo create no transaction, payment or merchant contact.
- No raw CSV, row, filename, narration, account reference, balance, exact address or private identifier may enter UI, logs or audit metadata.

## Phase 4 Milestone 3 evidence

Completed delivery:

- PR #118 / 4.12 contract and interface audit: `344be702dea5cf82ae771d4d688cf2622a4b1e44`;
- PR #119 / 4.13-4.16 UI simplification batch: `cc4d44d17d34ef9b86a064dfd25c536e5a2e6bd7`;
- 4.17 QA summary: docs/PHASE_4_MILESTONE_3_SUMMARY.md.

Verification:

- exact PR head `6ab45f6c18e1c0d1c1dcc1ec1bb7d108fa51a4b2`;
- Preview deployment `ESYj1tFsrxZuoPL9No9ZcEiyphZw` is Ready;
- 85 test files / 521 tests passed;
- TypeScript and Next.js lint validity passed;
- clean optimized production build passed;
- merged-main deployment `GsZrG1sSrzrsSe5nn9Gj4U5qpibr` is Ready;
- canonical https://spendgrove.vercel.app `/`, `/transactions`, `/import` and `/loans` returned HTTP 200.

No Prisma schema, migration, data rewrite, package, provider, secret, environment, financial-rule, import-rule, Property-rule, report/export-rule or navigation-tab change occurred. No Preview or Production migration ran.

## Phase 4 Milestone 3 client-feedback hardening

The client approved a focused acceptance-hardening sequence on 13 July 2026. Controlling contract: `docs/PHASE_4_MILESTONE_3_ACCEPTANCE_HARDENING_CONTRACT.md`.

Approved work:

1. 4.12 contract and no-schema impact assessment;
2. 4.13 month-focused transactions, searchable category picker and Property disclosure;
3. 4.14 local category suggestions and recurring merchant normalisation;
4. 4.15 repayment reconciliation in both import orders;
5. 4.16 Delete wording and category-level month comparison;
6. 4.17 QA and consolidated deferred client package.

No schema, migration, hard deletion, calculation-threshold, duplicate, Property-link or report/export rule change is authorised.

## Exact next action

Complete and merge the documentation-only 4.12 contract, then implement the approved in-scope hardening. Keep Phase 4 Milestones 1, 2 and 3 open pending final client retesting.

## Explicit exclusions and stop conditions

- No Preview migration.
- No Production migration.
- No new navigation tab.
- No reminder, notification, background scheduling or external provider.
- No changed recurring thresholds, fuzzy matching, budget formula, rollover or transaction linking.
- No tax advice, automatic deductibility, Property/net-worth statistics, loan forecasting, debt/credit advice.
- No Basiq, AI, payments, household mode or document storage.
- No package, provider, paid service, secret or environment change.
- Milestone 3 must not remove essential correction, review, archive/restore, unlink or privacy-disclosure access.
- No financial, recurring, budget, import, duplicate, Property-link, report or export rule may change.
- Stop if ownership, stale-write, duplicate-active or dismissal-undo safety cannot be enforced using existing fields.

## Resume instruction

Resume from repository truth. Read AGENTS.md, docs/CODEX_CONTEXT_AND_HANDOFF_PROTOCOL.md, this handoff, docs/PHASE_4_MILESTONE_1_CONTRACT.md, docs/PHASE_4_MILESTONE_1_SUMMARY.md, docs/PHASE_4_MILESTONE_2_CONTRACT.md, docs/PHASE_4_MILESTONE_2_SCHEMA_ASSESSMENT.md, docs/DEFERRED_CLIENT_RETESTING.md, docs/BUILD_PLAN.md and docs/DECISION_LOG.md.
