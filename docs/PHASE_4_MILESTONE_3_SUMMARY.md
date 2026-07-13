# Phase 4 Milestone 3 Summary

Status: implemented, merged, deployed and technically verified; client retesting deferred. Not formally accepted or closed.

Last updated: 14 July 2026

## Objective

Make SpendGrove calmer and easier for beginner budgeting-app users by simplifying presentation, hierarchy, wording and disclosure across existing screens without changing product capability, financial calculations, privacy boundaries or no-double-count rules.

Internal work labels are 4.12-4.17 because Phase 4 Milestone 2 already used 4.6-4.8.

## Completed delivery

- PR #118 / 4.12 - beginner-first UI contract and repository-truth interface audit. Merge: `344be702dea5cf82ae771d4d688cf2622a4b1e44`.
- PR #119 / 4.13-4.16 - coherent UI simplification batch covering Home, navigation presentation, Import, Transactions, regular payments, budgets, Loans, Property records and Settings. Merge: `cc4d44d17d34ef9b86a064dfd25c536e5a2e6bd7`.
- 4.17 - accessibility/mobile QA and consolidated deferred client review package.
- PR #124 - second client-review compact-view contract. Merge: `2e5e6f340bf00d41db04d27c9de55fe01021ea9b`.
- PR #125 - second client-review implementation covering initial month fallback, compact recurring review, compact Loan Accounts and on-demand budget creation. Merge: `b6d20c32ac682e36ff5f5f229b8db0846a84bb97`.
- PR #126 - documentation-only QA and expanded consolidated client checklist.

## Screens simplified

### Home

- one dominant `Import transactions` action;
- quieter link to existing transactions;
- repeated feature cards removed;
- concise everyday-money introduction;
- empty signed-out recurring and budget sections no longer clutter Home.

### Import and Transactions

- file selection uses the clear `Upload CSV` action;
- confirmed column mapping collapses to a short ready state with `More column options`;
- import review keeps Import, Skip and Merge explicit while moving reset/undo tools into `Review options`;
- summary density is reduced and Needs review guidance is shorter;
- transaction rows prioritise date, safe description, category and amount;
- uncommon transaction actions remain reachable through details;
- duplicate-submit prevention remains intact.

### Regular payments and budgets

- beginner-facing `Regular payments` and `Every 2 weeks` wording replaces internal terminology;
- confidence labels are hidden while the safe reason remains available under `Why this was suggested`;
- dismissed and archived records appear only when present and behind labelled disclosure;
- confirmed-item and suggestion actions remain lifecycle-specific;
- budgets use `Used this month`, `Budget left` and `Over by`;
- archived budgets and calculation explanations use progressive disclosure;
- Edit, Archive and Restore remain visible text actions where relevant.

### Loans and Property records

- Loan Accounts remain primary;
- repayment history uses `Repayment breakdowns`;
- reconciliation is described as a repayment match in beginner-facing copy;
- detailed repayment components and matching information use disclosure;
- Property records remain an automatic linked-record view inside Loans;
- report/export wording remains neutral and retains `Record keeping only - not tax advice.`;
- no Reports or Properties navigation tab was added.

### Settings

- everyday preferences remain prominent;
- unavailable future-feature toggles were removed from the normal experience;
- import history and development-only reset tools sit under `Advanced account tools`;
- Simple Mode remains the default.

## Accessibility and mobile evidence

- the main app shell prevents known horizontal overflow;
- changed sections use semantic headings and labelled disclosures;
- the Home overview has an explicit accessible heading relationship;
- changed important controls retain visible labels or accessible labels;
- focus rings and practical minimum touch heights remain on interactive controls;
- existing five-route navigation is unchanged;
- tests cover progressive disclosure, essential-action reachability, labels and mobile overflow safeguards.

Client visual, keyboard, screen-reader and narrow-device review remains deferred and is listed in `docs/DEFERRED_CLIENT_RETESTING.md`.

## Preserved rules

No server financial or persistence code changed.

- recurring cadence windows and exact signed-amount evidence are unchanged;
- user confirmation is still required before creating a recurring item;
- budget progress remains the Brisbane calendar-month total of eligible active owned everyday expenses;
- split parents remain excluded and eligible split children included;
- income, transfers, deleted/inactive/cross-user rows and analytical loan repayment records remain excluded from budget progress;
- review-before-commit and Import/Skip/Merge semantics are unchanged;
- duplicate scoring and CSV parsing are unchanged;
- Property-link cardinality and report/export eligibility are unchanged;
- everyday transactions remain the only cashflow records;
- planning and repayment-breakdown records do not add duplicate spending.

## Verification evidence

Exact PR head verification:

- commit: `6ab45f6c18e1c0d1c1dcc1ec1bb7d108fa51a4b2`;
- Vercel Preview deployment: `ESYj1tFsrxZuoPL9No9ZcEiyphZw`;
- preview URL: https://spendgrove-fi5ckn9bi-latinmaestros-projects.vercel.app;
- state: Ready;
- 85 test files / 521 tests passed;
- Next.js lint and TypeScript validity passed;
- clean optimized production build passed.

Merged main:

- merge commit: `cc4d44d17d34ef9b86a064dfd25c536e5a2e6bd7`;
- Vercel deployment: `GsZrG1sSrzrsSe5nn9Gj4U5qpibr`;
- state: Ready;
- canonical URL: https://spendgrove.vercel.app;
- live `/`, `/transactions`, `/import` and `/loans` returned HTTP 200 without internal errors.

The package audit reported existing dependency advisories during install. No dependency change was made in this UI-only milestone because packages were explicitly outside scope.

## Schema and migration status

- no Prisma schema change;
- no migration file;
- no Preview migration;
- no Production migration;
- no data rewrite, backfill, table drop or durable staging state;
- no package, provider, paid service, secret or environment change.

The previously approved Phase 4 foundation Preview migration remains unchanged. Production has not been migrated.

## Privacy and security

The UI continues to use only approved safe structured data. It does not add persistence, logging or display of raw CSV files, raw rows, original filenames, narration, account references, BSBs, card/customer/loan/lender identifiers, exact addresses, balances, secrets or connection strings. Authentication, ownership, stale-write, audit and privacy enforcement remain in existing server paths and were not weakened.

## Known limitations

- client visual and signed-in workflow testing is deferred;
- browser/device-specific layout and assistive-technology behaviour still requires client review;
- progressive disclosure adds a deliberate extra opening action for uncommon tools;
- no new navigation model was introduced;
- no reminder, notification or scheduling behaviour was added;
- existing recurring, budget refund and reporting limitations remain unchanged.

## Client-feedback acceptance hardening

A focused post-delivery hardening batch was completed without changing the milestone's financial, privacy or persistence contracts.

Delivery:

- PR #121 / rules and impact contract: `54ae6196ed12ff96495b7aed88beec893ddab1df`;
- PR #122 / implementation: `8bc4c6e4701554ec2cca0ce74e5aab2d38dcff15`;
- 4.17 / this QA and consolidated deferred-testing documentation pass.

Changes:

- Transactions now open on the current Brisbane calendar month with month navigation and month-scoped search/filtering.
- CSV review has a searchable local category picker and compact opt-in Property controls.
- Conservative food/takeaway and clear transfer-purpose category suggestions are reviewable; user merchant learning remains higher priority.
- Recurring merchant grouping tolerates only conservative trailing reference variation while exact amount, interval and confirmation rules remain unchanged.
- Accepted high-confidence loan repayment matching now runs safely in either import order.
- Beginner-facing Delete/Deleted/Restore wording uses the existing soft archive/restore lifecycle; no hard deletion was introduced.
- Home shows useful category month comparisons using the existing overall period and eligibility formula.

Verification:

- exact PR #122 head: `6729d9e6f464f6102c8f57610d09611b5a2d9cd0`;
- Preview deployment: `dpl_GrPrQu1QWys6JDfLquwbuW2eEeF5` (Ready);
- merged-main commit: `8bc4c6e4701554ec2cca0ce74e5aab2d38dcff15`;
- main deployment: `dpl_AVVZqH2afjZNvPZJF5bp5R3No8sW` (Ready);
- canonical URL: https://spendgrove.vercel.app;
- 86 test files / 536 tests passed;
- TypeScript and Next.js lint validity passed;
- clean optimized production build passed;
- live `/`, `/transactions` and `/loans` returned HTTP 200 and browser checks found no console or internal-page errors.

Privacy and no-double-count evidence:

- current descriptions are inspected transiently for deterministic suggestions and are not added to logs, rules or audit metadata;
- raw CSV files/rows, filenames, narration, bank identifiers, exact addresses and private references remain excluded;
- user ownership and active-state checks remain server enforced;
- bidirectional automatic repayment linking uses safe reason codes and creates no transaction or automatic Property link;
- everyday transactions remain the sole cashflow records.

Known limitations:

- keyword and transfer-purpose rules are deliberately small and conservative; ambiguous or unsupported descriptions remain manual;
- recurring grouping still requires exact signed amount and accepted interval windows;
- reverse-order repayment automation requires exactly one accepted high-confidence candidate;
- Property selection remains user opt-in and is never auto-matched;
- Delete is presentation wording over recoverable internal archive state;
- the existing dependency audit advisories remain outside this no-package-change batch.

No schema, migration, data rewrite, hard deletion, package, provider, secret, environment, navigation-tab, Basiq, AI, payment, tax, Property/net-worth or later-module change occurred. No Preview or Production migration ran.

## Second client-review hardening

The second client recording confirmed the prior month navigation, searchable category selection, compact Property opt-in, conservative category suggestions, Delete/Restore wording, category comparisons and loan reconciliation behaviour. Those accepted working behaviours were preserved.

Additional presentation changes:

- Transactions keeps the current Brisbane month when populated; only the initial empty-month request falls back to the latest populated owned active month through an efficient server query.
- Home displays no more than three recurring suggestions before Review all.
- Recurring suggestion forms and reasons are collapsed by default, and only one suggestion editor opens at a time.
- Exact duplicate deterministic suggestion identities are shown once; distinct payments remain separate.
- Loan Account cards show summary counts and action-needed warnings without inline full histories.
- Only one Loan Account detail opens at a time; repayment and linked-transaction previews each show three records before View all.
- Budget creation fields remain hidden until Add budget and Cancel discards the transient form state.

Final evidence:

- PR #125 head `3b07c1a3181317354909aa1a66d576fdcce2885f`;
- Preview `dpl_gHKePj4zDjjWEC8HFZYueNtXhWWC` Ready;
- merge `b6d20c32ac682e36ff5f5f229b8db0846a84bb97`;
- main deployment `dpl_8vvdNFvXP2TqHbF5jZCTH2AAMMbu` Ready;
- 88 test files / 547 tests passed;
- TypeScript, Next.js lint validity and clean optimized production build passed;
- live `/`, `/transactions` and `/loans` returned HTTP 200.

Known limitations:

- Review all and View all expand the eligible list in the current workflow rather than introducing a new route or navigation tab.
- Recurring suggestions remain conservative and still require the approved exact signed amount and interval evidence.
- The latest-month fallback applies only to initial entry; deliberate month navigation is never overridden.
- Loan warnings stay visible, but detailed correction and unlink actions require opening the selected Loan Account.
- Existing dependency audit advisories remain outside this no-package-change pass.

No schema, migration, data rewrite/backfill, hard deletion, package, provider, secret, environment, calculation, threshold, reconciliation, import, Property-link, report/export or navigation change occurred. No Preview or Production migration ran.



## Third client-review Loans hardening

The third client review found that the same underlying repayment still appeared as a repayment breakdown, linked everyday transaction and Property record. The accepted presentation now uses one canonical repayment row while preserving every durable model and no-double-count rule.

Delivery:

- PR #127 / canonical Loan display contract: `04e8099f8f2c6a41cbb3021c3b7efee2afdbff72`;
- PR #128 / canonical Loans implementation: `87012a22bc029d2094ed19f5a8853ad4009f98f3`;
- documentation-only QA and consolidated deferred-testing update: this pass.

Sections removed or combined:

- removed routine repayment-breakdown and linked-transaction counts from the overview;
- replaced the separate beginner-facing `Repayment breakdowns` and `Linked everyday transactions` histories with `Loan repayments`;
- removed the repeated reconciled repayment cashflow from the main Property transaction list;
- moved full Property records/report/export behind `View property records`;
- moved Loan deletion, Property editing, deleted repayment cleanup and privacy detail into secondary disclosures;
- non-Property loans no longer render empty Property sections.

Exact display/deduplication rules:

- one repayment row is keyed by one LoanRepayment and may combine its optional active LoanReconciliationLink and safe linked Transaction context;
- no linked everyday transaction row is rendered separately for that same repayment;
- main Property transactions start from eligible manual Property links and exclude every transaction ID returned through any loan-reconciliation path for the selected Property;
- non-repayment manually linked income and expense records remain;
- split-parent/child, ownership and active/deleted eligibility remain server-controlled and unchanged;
- Property report/export uses its accepted source-of-truth unchanged.

Verification:

- corrected PR #128 head `59292d79ef4c8cdb51dd3fe04e4dea00ccbaf48c`;
- Preview deployment `dpl_71c3ULsevJBSLE427NjEwxtRRYFb` Ready;
- 89 test files / 553 tests passed;
- TypeScript and Next.js lint validity passed;
- clean optimized production build passed;
- main deployment `dpl_6U5SJiVuHhZSyZjr5LvLZxx1EPZ4` Ready;
- canonical `/` and `/loans` returned HTTP 200 without internal errors.

Accessibility/mobile and safety evidence:

- latest-three/View-all controls retain visible text and focus styles;
- expanded repayment rows retain match, unlink and correction controls;
- important actions retain practical touch heights;
- no known horizontal-overflow class was added and the app shell retains `overflow-x-hidden`;
- deduplication is a pure display filter over existing safe IDs and performs no write;
- no raw source data or private identifier was added.

Known limitations:

- signed-in client visual, mobile and assistive-technology review remains deferred;
- opening balance is absent because no approved persisted opening-balance field exists;
- Property report/export intentionally remains the accepted fuller record-keeping workflow behind a secondary action;
- separately allocated LoanRepayments remain separate canonical rows in their respective Loan Accounts.

No schema, migration, data rewrite/backfill, hard deletion, package, provider, secret, environment, calculation, reconciliation-threshold, split-allocation, Property-link, report/export or navigation change occurred. No Preview or Production migration ran.

## Deferred client testing

The consolidated non-technical checklist for Phase 4 Milestones 1, 2 and 3 is maintained in `docs/DEFERRED_CLIENT_RETESTING.md`. All three milestones remain open until the client explicitly completes testing and records acceptance.

## Excluded work

No new milestone, Production migration, tax advice, automatic deductibility, Property profit/yield/equity/valuation/net-worth feature, Property/tax/loan Home statistics, loan forecasting, Basiq, AI, payments, household mode, document storage, new navigation tab, public launch or later module was started.
