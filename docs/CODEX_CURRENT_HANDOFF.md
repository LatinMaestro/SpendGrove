# Current Codex Handoff

Last updated: 14 July 2026

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
- Controlling documents: docs/PHASE_4_MILESTONE_3_UI_CONTRACT.md, docs/PHASE_4_MILESTONE_3_INTERFACE_AUDIT.md, docs/PHASE_4_MILESTONE_3_SECOND_CLIENT_REVIEW_CONTRACT.md, docs/PHASE_4_MILESTONE_3_THIRD_CLIENT_REVIEW_LOANS_CONTRACT.md, docs/PHASE_4_MILESTONE_3_FINAL_LOANS_SIMPLICITY_CONTRACT.md and docs/PHASE_4_MILESTONE_3_SUMMARY.md.
- Phase 4 Milestone 4 - Beginner-First Full UI Overhaul is approved and in progress.
- Controlling Milestone 4 contract: docs/PHASE_4_MILESTONE_4_UI_OVERHAUL_CONTRACT.md.
- Milestone 4 is presentation-only: no schema, migration, data, financial, import, matching, report/export, ownership or privacy-rule change is authorised.
- Approved primary destinations remain exactly Home, Transactions, Loans, Import and Settings.

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

## Phase 4 Milestone 3 client-feedback acceptance hardening

Status: implemented, merged, deployed and technically verified; client retesting remains pending. Controlling contract: `docs/PHASE_4_MILESTONE_3_ACCEPTANCE_HARDENING_CONTRACT.md`.

Completed delivery:

- PR #121 / 4.12 contract and no-schema impact assessment: `54ae6196ed12ff96495b7aed88beec893ddab1df`;
- PR #122 / 4.13-4.16 implementation batch: `8bc4c6e4701554ec2cca0ce74e5aab2d38dcff15`;
- 4.17 QA and consolidated deferred client package: this documentation pass.

Delivered behaviour:

- Transactions default to the current Brisbane calendar month with accessible previous/next month controls and month-scoped search/filtering.
- CSV review uses a searchable locally filtered category catalogue and compact opt-in Property controls.
- Conservative deterministic food/takeaway and clear transfer-purpose suggestions remain reviewable; user-confirmed merchant rules take priority.
- Recurring detection groups only a conservative stable merchant identity while preserving exact signed amount and accepted cadence windows.
- Unique accepted high-confidence repayment matches can reconcile in either import order; ambiguous cases remain manual and reversible.
- Beginner-facing Delete/Deleted/Restore wording maps to the existing safe soft lifecycle.
- Home category comparisons use the same current-versus-previous Brisbane month rules as the existing overall comparison.

Verification:

- exact PR #122 head `6729d9e6f464f6102c8f57610d09611b5a2d9cd0`;
- Preview deployment `dpl_GrPrQu1QWys6JDfLquwbuW2eEeF5` is Ready;
- 86 test files / 536 tests passed;
- TypeScript and Next.js lint validity passed;
- clean optimized production build passed;
- merged-main deployment `dpl_AVVZqH2afjZNvPZJF5bp5R3No8sW` is Ready;
- canonical https://spendgrove.vercel.app routes `/`, `/transactions` and `/loans` returned HTTP 200 and browser checks found no console or internal-page error.

No Prisma schema, migration, hard deletion, data rewrite/backfill, package, provider, secret, environment, recurring-threshold, budget-calculation, duplicate-scoring, Property-link, report/export or navigation-tab change occurred. No Preview or Production migration ran.

## Phase 4 Milestone 3 second client-review hardening evidence

The client's second recording confirmed the earlier month navigation, category search, compact Property opt-in, conservative category suggestions, Delete/Restore language, category comparisons and loan reconciliation were working. The approved follow-up changed presentation only:

- PR #124 froze the compact-view contract, merge `2e5e6f340bf00d41db04d27c9de55fe01021ea9b`;
- PR #125 delivered the compact UI batch, merge `b6d20c32ac682e36ff5f5f229b8db0846a84bb97`;
- PR #126 is the documentation-only QA and consolidated retesting package.
- Transactions initially use the current Brisbane month when populated, otherwise one efficient owned active-record query resolves the latest populated month; no full-history load is used.
- Home shows at most three recurring suggestions; suggestion edit fields and reasons remain closed until requested.
- Exact duplicate suggestion identities are displayed once, while distinct amounts/cadences/identities remain separate.
- Loan Account overviews are compact; one account opens at a time, and repayment and linked-transaction previews are capped at three before a user chooses View all.
- Budget creation is hidden until Add budget and can be cancelled without saving.
- Reconciliation warnings, correction/unlink actions, budget calculations, recurring thresholds and all financial rules remain unchanged.

Final verification:

- exact PR #125 head `3b07c1a3181317354909aa1a66d576fdcce2885f`;
- Preview deployment `dpl_gHKePj4zDjjWEC8HFZYueNtXhWWC` is Ready;
- 88 test files / 547 tests passed;
- TypeScript and Next.js lint validity passed;
- clean optimized production build passed;
- merged-main deployment `dpl_8vvdNFvXP2TqHbF5jZCTH2AAMMbu` is Ready;
- canonical `https://spendgrove.vercel.app` routes `/`, `/transactions` and `/loans` returned HTTP 200.

No Prisma schema, migration, data rewrite/backfill, hard deletion, package, provider, secret, environment, recurring-threshold, budget-calculation, reconciliation-rule, import, Property-link, report/export or navigation change occurred. No Preview or Production migration ran.

## Phase 4 Milestone 3 third client-review Loans hardening evidence

Status: implemented, merged, deployed and technically verified; consolidated client retesting remains pending.

Completed delivery:

- PR #127 froze the canonical Loan display and deduplication contract, merge `04e8099f8f2c6a41cbb3021c3b7efee2afdbff72`;
- PR #128 delivered the canonical Loans implementation and focused regressions, merge `87012a22bc029d2094ed19f5a8853ad4009f98f3`;
- this documentation-only QA pass records the final evidence and replaces the superseded duplicate-history client checks.

Accepted technical display rules:

- one user-facing repayment row is keyed by one LoanRepayment and may combine its optional reconciliation link and safe everyday-transaction context;
- the linked everyday cashflow is not rendered as a second row on the same Loan detail;
- the main Property transactions list uses eligible manual Property links and excludes every transaction ID returned through a loan-reconciliation path for that Property;
- non-repayment manually linked Property income and expense records remain visible;
- the accepted Property report/export remains unchanged behind `View property records`;
- active repayments and Property transactions show the latest three before View all;
- non-Property loans render no Property section;
- match, unlink, correction, soft delete, restore, Property edit and report/export actions remain reachable.

Verification:

- exact corrected PR #128 head `59292d79ef4c8cdb51dd3fe04e4dea00ccbaf48c`;
- Preview deployment `dpl_71c3ULsevJBSLE427NjEwxtRRYFb` is Ready;
- 89 test files / 553 tests passed;
- TypeScript and Next.js lint validity passed;
- clean optimized production build passed;
- merged-main deployment `dpl_6U5SJiVuHhZSyZjr5LvLZxx1EPZ4` is Ready;
- canonical `https://spendgrove.vercel.app` routes `/` and `/loans` returned HTTP 200 without internal errors.

No Prisma schema or migration file changed. No Preview or Production migration ran. No data rewrite/backfill, hard deletion, calculation, reconciliation-threshold, split-allocation, Property-link, report/export, package, provider, secret, environment or navigation change occurred.

Known limitations:

- signed-in visual, narrow-device and assistive-technology testing remains deferred to the client;
- opening balance is not displayed because it is not an approved persisted repayment field;
- one everyday transaction may still support separately allocated LoanRepayments under the existing model; each LoanRepayment remains one canonical row in its own Loan Account;
- report/export intentionally retains its accepted full record-keeping workflow and is only visually secondary on the Loan detail.

## Phase 4 Milestone 3 final Loans simplicity hardening

Status: implemented, merged, deployed and technically verified; Phase 4 Milestones 1-3 remain open pending consolidated client retesting.

Completed delivery:

- PR #130 froze the final focused-Loan navigation, plain-language matching and separate report workflow, merge `5f907c52ac586e34cc83ffd869b8985a99fc0862`;
- PR #131 delivered the focused Loan view and regressions, merge `18d416e3ef5ea63f8b86081e11332f7a72634ffa`;
- the final documentation/QA PR records the evidence and consolidated client checks.

Final display rules:

- `View loan` replaces the multi-loan overview with one focused selected-loan subview on the existing `/loans` route;
- `Back to loans` restores the compact cards; other Loan Account cards do not render beneath the focused Loan;
- Loan repayments appear first, Property transactions second, and non-Property loans have no Property section;
- healthy repayment rows show only date and amount; `Needs review` appears only for unresolved records;
- only one repayment detail is open at a time; details retain non-empty principal, interest, fees and balance-after values;
- Edit, match, unlink, recoverable Delete/Restore and bounded deleted-item management remain secondary but reachable;
- matching uses plain language while all existing automatic/manual thresholds, confirmation and validation paths remain unchanged;
- Property transaction rows lead with safe category or cleaned merchant identity, with date and Money in/out secondary;
- `View property report` opens the unchanged report/export workflow in an accessible focused dialog rather than inline.

Verification:

- exact green PR #131 head `26f12e68a095f07b7e2d2a7b50e31175859dfc72`;
- Preview deployment `dpl_C6onQZPd4U56sJNtgA2j5SGWsAaC` is Ready;
- 90 test files / 558 tests passed;
- Next.js lint and TypeScript validity passed;
- optimized production build passed;
- merged-main deployment `dpl_9mAuvoqGkSt9Cw1TqPUAW9zX7DKH` is Ready for merge `18d416e3ef5ea63f8b86081e11332f7a72634ffa`;
- canonical `https://spendgrove.vercel.app/` and `/loans` returned HTTP 200 without internal errors.

Safety:

- no Prisma schema or migration file changed;
- no Preview or Production migration ran;
- no data rewrite/backfill or hard deletion occurred;
- no calculation, matching-threshold, split-allocation, cashflow, Property-link, report/export or navigation rule changed;
- no package, provider, secret or environment change occurred;
- no raw CSV/source narration, bank reference, exact address or private identifier was added.

Known limitations:

- the selected Loan is UI state on the existing `/loans` route and is not a bookmarkable deep link;
- signed-in narrow-width, keyboard, screen-reader and touch review remains in the consolidated client checklist;
- opening balance remains absent because it is not an approved persisted repayment field.


## Phase 4 Milestone 4 authorised delivery

Objective: rebuild SpendGrove's presentation into a compact, logo-led, responsive consumer budgeting experience while keeping all accepted behaviour unchanged.

Research and brand gate:

- approved repository wordmark: `assets/brand/spendgrove-logo.png`;
- approved compact icon source: `assets/brand/app-icon-source.png`;
- comparison set: Buddy, Copilot Money, PocketGuard, Monarch Money and statement-first budgeting peers;
- accepted synthesis: month-first focus, strong typography, compact aligned lists, restrained surfaces, progressive disclosure and one primary action;
- rejected comparison scope: bank aggregation, AI, investments, net worth, debt advice, household features and dense all-in-one dashboards.

Approved sequence:

1. PR 4.18 - documentation-only contract, inventory and design specification;
2. PR 4.19 - brand assets, tokens, responsive shell and shared components;
3. PR 4.20 - Home and onboarding;
4. PR 4.21 - Transactions and CSV Import;
5. PR 4.22 - Budgets and regular payments;
6. PR 4.23 - Loans and Property workflows;
7. PR 4.24 - Settings and secondary management;
8. PR 4.25 - responsive/accessibility/visual-consistency QA;
9. PR 4.26 - evidence and consolidated client package.

Meaningful Vercel gates are shell plus Home, core everyday workflows and the completed app-wide overhaul. Documentation-only work must not trigger a build solely for evidence.

Permanent status rule: Phase 4 Milestones 1-4 remain open pending consolidated client testing. Do not accept or close any milestone on the client's behalf.

## Exact next action

Complete and merge PR 4.18 as documentation-only, then proceed through the approved Milestone 4 implementation sequence unless a mandatory stop condition is reached.

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
