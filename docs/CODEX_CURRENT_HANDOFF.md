# Current Codex Handoff

Last updated: 17 July 2026

## Phase 5 controlling status

- Phase 5 repository implementation through Milestones 1–6 is complete and pending consolidated client acceptance.
- Phase 5 is not formally closed. Phase 6 is unapproved and not started.
- Current release classification: conditionally ready for a controlled Australian account-based web private beta after mandatory provider, recovery and legal operator actions.
- Planning baseline: PR #149, merge `bb715af100b65c8c5d9b74c701d1e135d50e332f`.
- Latest application delivery: PR #161, merge `1c048abf363b2c9d97818e6724d549725509eeda`.
- Latest platform-readiness documentation: PR #162, merge `f545828dcd84575a9a6b51de8f12adedf5564f10`.
- Latest inspected Ready Production deployment: `dpl_8bfqT5DskyyaiLHAsgPwzNTLngMn`, commit `1c048abf363b2c9d97818e6724d549725509eeda`.
- Latest completed online application gate before the final handoff: 110 test files / 677 tests, TypeScript, Next.js lint and optimized build passed.
- Next.js `15.5.20`, React `19.1.8` and React DOM `19.1.8` are locked and no Next.js 14 package remains.
- Account export, immediate account deletion, public Privacy and Help, authentication route protection, security headers, request limits, safe error surfaces, operational runbooks and the dependency gate are implemented.
- Production still uses a Clerk development/test instance. This is a mandatory private-beta blocker.
- Preview/Production Vercel–Clerk–Neon mapping, Production migration health and non-Production restore evidence remain operator gates.
- No Phase 5 Prisma schema change, migration, backfill, manual SQL or Production financial-row access occurred.
- Analytics and external monitoring remain off. No provider plan was purchased or upgraded.
- No native package, Apple enrolment, App Store Connect record, build upload, TestFlight distribution, App Store submission, public launch or Phase 6 work occurred.
- Controlling final documents: `docs/PHASE_5_SUMMARY.md` and `docs/PHASE_5_CLIENT_REVIEW_CHECKLIST.md`.

## Historical phase status

- Phase 3A is formally accepted and closed.
- Phase 3B Milestones 1, 2 and 3 are formally accepted and closed.
- Phase 3C Milestones 1, 2 and 3 are formally accepted and closed.
- Phase 4 Milestones 1, 2, 3 and 4 were formally accepted and closed by the client on 15 July 2026.
- All four Phase 4 milestones are implemented, merged, technically verified and deployed to Production.
- Accepted Production baseline: `a401d40275c4c63d5759a690dbc4830e45d46917`, deployment `dpl_EYxdfCR5SdgAEdyDR2AZsX841wzJ`.
- Final verification: 101 test files / 633 tests, TypeScript, Next.js lint and optimized production build passed; `/`, `/transactions` and `/import` returned HTTP 200; desktop route smoke and 390 px overflow checks passed.
- The consolidated checklist in `docs/DEFERRED_CLIENT_RETESTING.md` is retained as historical acceptance and QA evidence.
- PR #149 was accepted as the Phase 5 planning baseline and merged as `bb715af100b65c8c5d9b74c701d1e135d50e332f`.
- Phase 5 is active.
- Only Phase 5 Milestone 1 — Readiness Contract, Critical Security and Environment Gate — is approved for implementation.
- Phase 5 Milestones 2–6 remain unapproved.
- Immediate target: account-based controlled Australian web private beta.
- PR 5.1A: patched supported Next.js 15.x security upgrade, minimum 15.5.18, with no Next.js 16 or unrelated dependency modernisation.
- PR 5.1B: operational finance routes require authentication; public signed-out scope is limited to marketing, onboarding and authentication; browser-local data must be preserved and kept separate. This PR requires client UX approval before merge.
- PR 5.1C: read-only Vercel/Clerk/Neon environment, migration and recovery readiness contract.
- Analytics remains off. No monitoring, crash-reporting, support or analytics provider is approved.
- No schema change, migration, Production data access/change, provider-plan purchase, environment/secret mutation, native packaging or App Store work is authorised.

Controlling Phase 4 summaries:

- `docs/PHASE_4_MILESTONE_1_SUMMARY.md`
- `docs/PHASE_4_MILESTONE_2_SUMMARY.md`
- `docs/PHASE_4_MILESTONE_3_SUMMARY.md`
- `docs/PHASE_4_MILESTONE_4_SUMMARY.md`

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

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Both Phase 4 Milestones 1 and 2 remain open pending deferred client retesting. Do not formally close either milestone.

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

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged, deployed and technically verified; Phase 4 Milestones 1-3 remain open pending consolidated client retesting.

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

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Permanent status rule: Phase 4 Milestones 1-4 remain open pending consolidated client testing. Do not accept or close any milestone on the client's behalf.

## Phase 4 Milestone 4 completed evidence

Completed PR chain:

- #133 / 4.18 contract and interface inventory: `2e6b194da5a20a1c7c66056f91801d4bbb905e03`;
- #134 / 4.19-4.20 shell, visual system, Home and onboarding: `7896f28e6a7b954d5108b00127888ced4c58cdc0`;
- #135 / 4.21-4.22 Transactions, Import, Budgets and Regular payments: `6c8822f7cfbdc1ed222d12ab7b96ba7022a94771`;
- #136 / 4.23-4.24 Loans, Property and Settings: `41523ac25089e74778cf25eb17e195a0dc6caffa`;
- #137 / 4.25 responsive and accessibility QA: `df6e6ef20046fe8dccb409178a3076cf28b87eea`;
- #138 / 4.26 evidence and consolidated client package.

Final technical verification:

- 95 test files / 587 tests passed;
- TypeScript and Next.js lint validity passed;
- optimized production build passed;
- final Preview `dpl_54EaJW6HPZDW5MbjBTACTUekJDxb` Ready;
- final application main deployment `dpl_2QKHYxtx8dNBW7VacD4eTGbirpTn` Ready;
- canonical https://spendgrove.vercel.app;
- public Home, Transactions, Loans, Import and Settings routes loaded without internal errors;
- desktop 1440 and mobile 390 route sweeps found no horizontal overflow.

Safety:

- no Prisma schema or migration change;
- no Preview or Production migration;
- no data rewrite/backfill or hard deletion;
- no package/provider/secret/environment change;
- no financial, recurring-threshold, budget, import, duplicate, matching, Property-link, report/export, privacy or no-double-count rule changed.

Historical pre-acceptance record (superseded by the 15 July 2026 closure): All Phase 4 Milestones 1-4 remain open pending consolidated client testing. Do not accept or close them on the client's behalf.

## Exact next action

Stop after PR 4.26 and wait for consolidated client testing of Phase 4 Milestones 1-4. Do not begin another milestone or formally close any Phase 4 milestone.

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

## Phase 4 Milestone 4 monthly category-spending enhancement

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: approved and in progress. Phase 4 Milestones 1-4 remain open pending consolidated client acceptance.

- PR 4.27 freezes the aggregation, chart, breakdown, privacy, performance and accessibility contract in `docs/PHASE_4_MILESTONE_4_CATEGORY_CHART_CONTRACT.md`.
- Existing Transactions month selection and everyday-insight expense rules are compatible: selected Brisbane month, owned active expenses, split children included, split parents/income/transfers/deleted/cross-user records excluded, and integer-cent absolute expense totals.
- PR 4.28 must reuse or extract that approved server-side rule and prove exact reconciliation; search remains list-only.
- No schema, migration, data rewrite, package, provider, secret, environment or financial-rule change is required or authorised.
- Approved sequence: PR 4.27 contract; PR 4.28 implementation/tests; PR 4.29 QA and deferred-testing evidence; then stop.

## Phase 4 Milestone 4 monthly category-spending enhancement evidence

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged, deployed and technically verified; Phase 4 Milestones 1-4 remain open pending consolidated client acceptance.

Delivery:

- PR #139 / 4.27 froze the aggregation and presentation contract, merge `f858566fa38fb4755ae11985b09785d216cd72e5`;
- PR #140 / 4.28 delivered the chart, breakdown, same-month category filter and regressions, merge `1e347102f9583b33c1b873a340c64c38c151e382`;
- PR 4.29 records QA and deferred client testing.

Implemented rules:

- the server reuses the selected Brisbane month and approved active-owned everyday-expense eligibility;
- split children are included; split parents, income, transfers, deleted/inactive/cross-user rows and analytical loan records are excluded;
- integer-cent category totals reconcile exactly to the donut total and the existing everyday monthly-spending total;
- five or fewer categories show directly; larger sets show the five largest plus exact presentation-only Other;
- the full breakdown lists every real category and Needs review;
- search remains list-only; category selection applies a removable filter to the same month.

Evidence:

- 97 test files / 597 tests passed;
- TypeScript and Next.js lint validity passed;
- optimized production build passed;
- Preview `dpl_FEx2aJUeSRNp7nZAPsgCNXMrSffH` is Ready;
- merged-main deployment `dpl_BV7bZ6LX8tth2iMs96q7QgGmKe3W` is Ready;
- canonical `https://spendgrove.vercel.app/transactions` returned HTTP 200;
- deployed shell checks at approximately 390, 768, 1024 and 1440 px found no horizontal overflow and no browser console errors.

Safety:

- no Prisma schema or migration file changed;
- no Preview or Production migration ran;
- no package or lockfile changed;
- no financial, refund, split, transfer, category, budget, recurring, import, loan, Property or navigation rule changed;
- no raw CSV/source narration, filename, banking identifier, exact address or private import metadata reaches the chart.

Known limitations:

- income-style refunds keep the existing monthly-spending treatment and are not newly netted;
- the whole-month chart intentionally ignores list search text;
- colours are assigned by monthly rank and may differ between months;
- signed-in populated-data visual and assistive-technology review remains in the consolidated client checklist.


## Phase 4 Milestone 4 chart correctness hardening (14 July 2026)

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged, deployed and technically verified; Phase 4 Milestones 1-4 remain open pending consolidated client acceptance.

Delivery:

- PR #142 / 4.30 documented the eligibility/source-of-truth audit, merge `6c2f9019d1476fe86a127d1ffd698e5bd3a68d7f`;
- PR #143 / 4.31 implemented the focused correction and regressions, merge `d6ae6bfaee81d475fd18387ad5a57b17dff97ee6`;
- PR 4.32 records final QA, handoff and deferred testing.

Confirmed root cause:

- the recorded `+$2,500.00` row could appear in the deployed Needs review drilldown only because its API type was `EXPENSE`;
- import review can pair a positive signed amount with the expense-typed Needs review category because commit derives type from the reviewed category while preserving the source sign;
- chart and everyday-insight eligibility checked `EXPENSE` but did not also require a negative money-out sign, then used the absolute amount.

Correction:

- one canonical helper now requires an owned, active, non-parent `EXPENSE` with a strictly negative integer-cent amount and valid date;
- monthly chart aggregation and Home/category/budget insights reuse the helper;
- each chart category carries only its owned eligible transaction IDs, and category drilldown uses that exact set;
- Needs review now means only an otherwise eligible expense without a usable active category;
- income, incoming/outgoing transfers, analytical loan records, positive/zero expense anomalies, split parents, inactive/deleted and cross-user rows are excluded;
- percentages show `0%` for exact zero and `<0.1%` for positive values below 0.1%;
- real category colours are deterministic from safe category keys; Needs review and Other have stable fixed colours.

Affected existing views:

- the defect could inflate Home monthly spending, category comparisons and category-budget progress as well as the chart;
- those views now share the sign-safe guard;
- recurring thresholds, import semantics, transaction storage, Property/Loan/reporting rules and cashflow ownership did not change.

Durable-data limitation:

- no record was rewritten or backfilled;
- the existing positive `EXPENSE` remains durably misclassified until corrected through the existing transaction edit flow, but it is no longer eligible for spending totals;
- broad import type/category redesign remains outside this hardening.

Evidence:

- 99 test files / 612 tests passed;
- TypeScript validity, Next.js lint and optimized production build passed;
- implementation Preview `dpl_AgLcw4d35Z2WNU9yiGGLmZ7UEpCP` is Ready at commit `eb1aca3dc3f4b23e11e2a9e6618c6a94fb0c759b`;
- merged-main deployment `dpl_Asvt3s72xB9grd9VSuyPWAk5fmst` is Ready at `d6ae6bfaee81d475fd18387ad5a57b17dff97ee6`;
- public `https://spendgrove.vercel.app/transactions` returned HTTP 200;
- Preview browser check found no console errors and no horizontal overflow at 390 px.

The connected browser had no signed-in data session. The populated July visual check, including confirmation of the corrected total in the client's dataset, remains in deferred client testing. Code-path and regression evidence confirms that a `+250000` positive expense anomaly cannot enter the aggregate or Needs review drilldown.

Safety:

- no Prisma schema, migration, data rewrite/backfill, package/lockfile, provider, secret or environment change;
- no Preview or Production migration ran;
- no Production database or secret was accessed;
- no signed-money, refund, split, transfer, budget-formula, import, Property, Loan, report/export or navigation rule changed;
- no raw narration, filename, merchant/source text, account reference, banking identifier, exact address or private import metadata is exposed.

## Phase 4 Milestone 4 transaction sign/type integrity gate (14 July 2026)

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: documentation-only audit complete; implementation stopped at a mandatory financial-rule decision gate. Phase 4 Milestones 1-4 remain open pending consolidated client acceptance.

- The write-path audit is recorded in `docs/PHASE_4_MILESTONE_4_TRANSACTION_SIGN_TYPE_AUDIT.md`.
- Confirmed defect: CSV Import preserves the signed row amount but currently derives durable transaction type from the reviewed category, so category can create a sign/type mismatch.
- Manual create/edit already normalises income/expense signs and enforces category/type compatibility; imported anomalies can be corrected through the existing Edit transaction flow.
- Skip creates no Transaction; Merge does not rewrite the existing target; Property linking and loan reconciliation do not alter amount/type/category.
- Zero-value transactions are already rejected.
- Repository truth does not fully define positive refunds, negative income adjustments, signed internal transfers or mixed-direction split children.
- PR 4.34 implementation is blocked until the client explicitly approves those four proposed rules.
- No implementation, schema, migration, data rewrite/backfill, manual SQL, package/provider/secret/environment, deployment or Production database work occurred.

Exact next action: obtain the client's financial-rule decision. Do not implement, deploy, close a Phase 4 milestone or begin another milestone before approval.

## Phase 4 Milestone 4 transaction sign/type integrity implementation (14 July 2026)

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Status: implemented, merged, deployed to a green Preview and technically verified; Phase 4 Milestones 1-4 remain open pending consolidated client acceptance.

Delivery:

- PR #145 / 4.33 audit contract: `53fadcbab4a009bbaec85e46f06f3a56602fc8f5`.
- PR #146 / 4.34 implementation: merge `78574362f07781a1181766a5ae68f663ee02d03f`.
- PR 4.35 records this QA and deferred-client package.

Canonical invariant:

1. confirmed transfer treatment takes precedence;
2. otherwise signed integer cents determine Money in or Money out;
3. category compatibility and categorisation follow direction and cannot reverse it.

Zero values are rejected. Positive non-transfer records are `INCOME`; negative non-transfer records are `EXPENSE`; confirmed positive and negative transfers remain `TRANSFER`. Needs review is a review state, not a financial direction. Category choices, learned merchant rules and keyword suggestions are applied only when direction-compatible.

Write paths hardened:

- CSV review and commit re-derive direction server-side from transfer treatment and signed cents;
- Import preserves the source sign and stores a compatible type;
- Skip remains non-writing;
- Merge revalidates the existing target without rewriting its direction;
- manual create/edit use the shared invariant;
- transaction request validation rejects incompatible payloads;
- split children must be non-zero, same-sign, type-compatible and sum exactly to the parent;
- Property linking and loan reconciliation remain direction-neutral.

Edge rules:

- positive refunds remain Money in and do not reduce expense totals or budget progress;
- negative income adjustments are Money out under the current model and may affect spending until the user chooses an appropriate money-out category;
- incoming and outgoing transfers remain excluded from spending and existing transfer-excluded income totals;
- mixed-direction splits are unsupported.

Existing anomalies:

- no historical record was changed;
- the known positive `EXPENSE` remains visible, excluded from calculations by the existing sign-safe guard and correctable through Edit transaction;
- only an affected row/detail shows `Needs correction`; healthy rows have no warning.

Evidence:

- 101 test files / 633 tests passed;
- TypeScript validity, Next.js lint and optimized production build passed;
- final Preview `dpl_NgKKnxdaY1zKgwUaNyDSD66ALfBY` is Ready at `ec7f5fd88b8af4ff1e4b6a18a1cbab35a8940d04`;
- public Preview `/transactions` loaded with no console errors and no horizontal overflow at 390 px;
- the connected verification session was signed out, so populated-data correction remains in deferred client testing.

Safety:

- no Prisma schema or migration file changed;
- no Preview or Production migration ran;
- no backfill, data rewrite, manual SQL or Production database access occurred;
- no package, lockfile, provider, secret or environment change occurred;
- no duplicate scoring, Import/Skip/Merge semantics, transfer thresholds, refund formula, budget formula, spending formula, Property/Loan/reporting or navigation rules changed;
- no raw CSV row, narration, filename, amount, account reference or banking identifier is added to audit metadata or logs.

Historical pre-acceptance record (superseded by the 15 July 2026 closure): Next action: stop for consolidated client acceptance. Do not formally close Phase 4 Milestones 1-4 or begin another milestone.

## Formal Phase 4 closure — 15 July 2026

Client acceptance date: 15 July 2026.

Final accepted baseline:

- PR #146 implementation merge: `78574362f07781a1181766a5ae68f663ee02d03f`;
- PR #147 QA/handoff merge and accepted `main`: `a401d40275c4c63d5759a690dbc4830e45d46917`;
- Production deployment: `dpl_EYxdfCR5SdgAEdyDR2AZsX841wzJ`, Ready from the accepted `main` commit;
- 101 test files / 633 tests passed;
- TypeScript validity, Next.js lint and optimized production build passed;
- public `/`, `/transactions` and `/import` returned HTTP 200;
- desktop route smoke and 390 px horizontal-overflow verification passed.

The transaction sign/type invariant is accepted: confirmed transfer treatment takes precedence, otherwise signed integer cents determine direction, and categorisation must remain compatible with that direction. Existing inconsistent records were not rewritten, backfilled or silently reclassified; they remain user-correctable and excluded from incompatible calculations.

No unresolved blocker remains for Phase 4 Milestones 1-4. The complete deferred-client checklist and all historical QA evidence remain preserved as the acceptance record.

Phase 5 remains unapproved and not started. Progression requires a separate client approval and documentation-first planning gate covering objective, user value, PR sequence, data and financial rules, privacy/security boundaries, schema and migration assessment, deployment/client review points, exclusions and mandatory stop conditions.

Current next action: stop. Do not begin Phase 5 until the client separately approves its planning contract and delivery sequence.
