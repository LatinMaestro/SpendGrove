# Phase 4 Milestone 1 Summary - Recurring, Budgets and Everyday Insights

Status: client accepted and closed; technically verified and deployed to Production

Delivery date: 12 July 2026

Client acceptance: 15 July 2026

## Delivered objective

Phase 4 Milestone 1 makes SpendGrove more useful between CSV imports with:

- deterministic recurring and subscription suggestions that remain user-controlled;
- user-entered monthly category budgets;
- a simple everyday Home overview with transparent month and category calculations;
- preserved CSV-first privacy, review-before-commit and no-double-count rules.

The client formally accepted and closed this milestone on 15 July 2026 after the consolidated Production review.

## Completed PRs

| Work item | PR | Merge commit | Result |
|---|---:|---|---|
| 4.0 recurring, budget and insight contract | [#106](https://github.com/LatinMaestro/SpendGrove/pull/106) | c860637d2f150c2345babf5921eb72fdd352601f | Contract frozen |
| 4.1 migration plan document | [#107](https://github.com/LatinMaestro/SpendGrove/pull/107) | 157c0b81b0653049403e6722cba41eaa2420a602 | Documentation gate complete |
| 4.1A exact schema and unexecuted migration | [#108](https://github.com/LatinMaestro/SpendGrove/pull/108) | f2d5e040294e05dd4c2d7641f171727aaad944cd | Additive schema foundation |
| Preview checker profile | [#109](https://github.com/LatinMaestro/SpendGrove/pull/109) | 06d88cf147ccce03f261c5a109a768c56d192017 | Phase 4 secret-safe checks |
| Order-insensitive verification correction | [#110](https://github.com/LatinMaestro/SpendGrove/pull/110) | be53523040ba9a13b48d42408968fabf4b91c922 | Exact verification passed |
| 4.2 recurring suggestions | [#111](https://github.com/LatinMaestro/SpendGrove/pull/111) | 9a280eae650a884882be312d32974d73a8c1634d | Merged and green |
| 4.3 category budgets | [#112](https://github.com/LatinMaestro/SpendGrove/pull/112) | 723ef41228e79f3405c43120853e5a3658637751 | Merged and green |
| 4.4 everyday dashboard and trends | [#113](https://github.com/LatinMaestro/SpendGrove/pull/113) | 67a185839b3c67fd136fb9abbdd528944107aea9 | Merged and green |
| 4.5 QA and client review package | This PR | Pending | Documentation-only stop gate |

## Schema and migration status

The approved additive Phase 4 foundation contains:

- RecurringItem;
- RecurringSuggestionDismissal;
- CategoryBudget;
- RecurringCadence;
- RecurringItemStatus;
- BudgetPeriod;
- BudgetStatus;
- the approved AuditEntityType additions.

Preview migration:

- name: 20260708090000_phase_4_recurring_budgets_foundation;
- original deploy run: [29060523217](https://github.com/LatinMaestro/SpendGrove/actions/runs/29060523217);
- prisma migrate deploy succeeded and applied the migration once;
- the first post-check reported the safe false-negative EXPECTED_INDEXES_MISMATCH because index order was compared rigidly;
- verification-only run: [29072916307](https://github.com/LatinMaestro/SpendGrove/actions/runs/29072916307);
- verification-only confirmed the exact approved enums, tables, columns, indexes and foreign keys;
- all three new tables were empty immediately after migration;
- existing Phase 3A-3C aggregate row counts were unchanged;
- Preview-only database secrets were used and masked;
- no Production secret was mapped.

No further Preview migration ran for PRs #111, #112 or #113. No Production migration has run.

## Recurring and subscription rules implemented

Suggestions use deterministic safe evidence only:

- active owned everyday transactions;
- the same active owned safe MerchantProfile;
- the same active owned category;
- the same transaction type;
- the exact same signed integer-cent amount;
- weekly gaps of 6-8 days;
- fortnightly gaps of 13-16 days;
- monthly gaps of 27-34 days.

Confidence:

- three or more matching occurrences: clear/high-confidence suggestion;
- two matching occurrences: review suggestion;
- ambiguous, conflicting, non-exact, inactive, deleted, cross-user, transfer or split-parent evidence: no suggestion.

Lifecycle:

- suggestions never become durable automatically;
- the user must confirm;
- the user may edit safe fields before confirmation;
- the user may dismiss;
- confirmed items may be edited or archived;
- dismissal uses a safe hashed structural key;
- recurring items are planning records only;
- no merchant contact, payment scheduling or guaranteed forecast exists.

## Budget rules implemented

- Monthly calendar budgets only.
- One active budget per authenticated user, expense category and monthly period.
- The user enters the budget amount.
- Amounts are stored as positive integer cents.
- Budgets can be created, edited and archived.
- No automatic budget creation.
- No weekly or fortnightly period.
- No rollover.

Current-month boundaries use the Australia/Brisbane calendar month.

Budget progress formula:

spent_cents = sum(abs(amount_cents)) for active owned EXPENSE transactions in the budget category and current month.

Included:

- eligible everyday expense transactions;
- eligible split children.

Excluded:

- split parents;
- income transactions;
- transfers;
- deleted/inactive transactions;
- cross-user transactions;
- raw import rows;
- loan repayment breakdowns;
- Property reporting review records.

Refunds represented as INCOME do not reduce expense budget progress in this milestone.

## Dashboard and trend rules implemented

The Home overview contains only:

- current calendar-month everyday spending;
- current eligible expense transaction count;
- top current-month spending categories;
- active monthly budget progress;
- confirmed active recurring items;
- a current-month versus previous-month comparison.

Month comparison formulas:

current_month_spend_cents = sum(abs(amount_cents)) for eligible active owned EXPENSE transactions in the current Brisbane calendar month.

previous_month_spend_cents = the same formula for the immediately previous calendar month.

difference_cents = current_month_spend_cents - previous_month_spend_cents.

Allowed states:

- spending is up compared with last month;
- spending is down compared with last month;
- spending is unchanged;
- no previous-month comparison yet.

The dashboard does not forecast, advise, judge or guarantee.

## Calculations explicitly excluded

The milestone does not calculate or display:

- net worth;
- Property profit or loss;
- Property yield;
- equity;
- valuation;
- investment performance;
- tax or EOFY statistics;
- deductible, claimable or taxable values;
- principal, interest or fee aggregates;
- loan balances or loan-balance forecasts;
- debt or credit advice;
- payment or bill forecasts;
- AI-generated advice.

## No-double-count evidence

- Everyday transactions remain the only cashflow/spending/income records.
- Recurring items are planning records and never create transactions.
- Category budgets are targets and never create transactions.
- Loan repayment breakdowns remain analytical records and are not queried by budget or insight calculations.
- A loan-reconciled everyday transaction may count once through the original everyday transaction only.
- Split parents are excluded; eligible split children count through their own category, amount and date.
- No duplicate cashflow record or dashboard total is created.

## Privacy and security evidence

Recurring, budget and insight services do not use or expose:

- raw CSV files;
- raw CSV rows;
- original filenames;
- raw narration or source text;
- account identifiers;
- BSBs;
- card fragments;
- customer IDs;
- loan or lender references;
- masked references;
- exact Property addresses;
- balances;
- secrets or connection strings.

Permitted data is limited to owned safe IDs, user-confirmed labels, category labels, transaction type, integer-cent values, dates, lifecycle codes and aggregate results.

Every durable read/write is user-scoped. Recurring and budget writes revalidate ownership and active state. Budget and recurring edits use stale-edit protection. Audit metadata uses safe reason, method, confidence, state and changed-field codes only; no old/new financial values or private source details are audited.

## Verification evidence

Latest functional verification on PR #113:

- 84 test files passed;
- 511 tests passed;
- TypeScript/lint validity checks passed;
- Next.js compiled successfully;
- clean production build completed;
- Vercel Preview deployment 3YnDyJBnaN12KxBQLS2yLq85kSCU was Ready.

Merged-main verification:

- merge commit: 67a185839b3c67fd136fb9abbdd528944107aea9;
- main deployment: Cqz59vm8BQ1TtHjTS94otLGnaFZf;
- canonical URL: [https://spendgrove.vercel.app](https://spendgrove.vercel.app);
- deployment state: Ready;
- public /, /transactions, /import and /loans routes returned HTTP 200;
- no internal Next.js error page was observed.

The first PR #113 attempt was blocked before build by Vercel's rolling account build-rate limit. The later unchanged-scope retry ran normally and passed; the throttle was not an application failure.

## Mobile and accessibility review notes

The new cards use the existing mobile-first shell and responsive one-column-to-grid layout.

- controls use minimum 44-48px touch targets;
- form fields stack on mobile;
- budget and recurring cards expand to wider grids only at responsive breakpoints;
- progress is accompanied by text and is not conveyed by colour alone;
- loading, status and error copy uses semantic live-region roles;
- icon-only edit/archive buttons include accessible labels;
- long lists are intentionally capped in the compact Home overview while full management remains below.

Client signed-in mobile retesting is still required.

## Known limitations

- Recurring suggestions currently require exact signed amounts; similar but non-exact amounts are deliberately not suggested.
- Only weekly, fortnightly and monthly interval windows are detected.
- Recurring items do not create reminders, forecasts, payments or merchant contact.
- Budgets are monthly only and do not roll over.
- Income-style refunds do not reduce expense budget progress.
- The dashboard compares only the current and immediately previous calendar month.
- The compact Home overview shows up to five categories, budgets and recurring items.
- Insights depend on reviewed current transaction/category data and can change when transactions are edited, split, recategorised, archived or deleted.
- No live bank connection exists.
- Production database migration and production launch remain separate future approvals.

## Non-technical client retesting checklist

Use synthetic or clearly non-private test data only.

### Recurring suggestions

1. Sign in and ensure at least two reviewed transactions have the same cleaned merchant, category, signed amount and weekly/fortnightly/monthly interval.
2. Open Home and confirm the item appears as a suggestion, not an already-confirmed recurring item.
3. Review the plain-English reason.
4. Edit the safe label, expected amount, cadence or next date before confirming.
5. Confirm and check that it moves to confirmed items.
6. Edit the confirmed item and save.
7. Archive the confirmed item.
8. Create another matching pattern, dismiss it and confirm it does not immediately reappear.
9. Confirm transfers and split parents do not create suggestions.

### Category budgets

1. Create a monthly budget for an active expense category.
2. Confirm the amount is shown in AUD.
3. Check Used this month against reviewed transactions in that category.
4. Confirm a split child counts and its split parent does not.
5. Confirm income and transfers do not add to progress.
6. Edit the category or amount and save.
7. Archive the budget and confirm it leaves the active list.
8. Confirm the app prevents a second active monthly budget for the same category.

### Everyday Home overview

1. Confirm the current-month spending value matches active everyday expenses.
2. Confirm top categories match current reviewed transactions.
3. Confirm the previous-month comparison says up, down, unchanged or no comparison as appropriate.
4. Confirm active budget progress is visible.
5. Confirm confirmed recurring items are visible.
6. Confirm loan repayment breakdowns do not appear as extra spending.
7. Edit or delete an everyday transaction and confirm the refreshed overview follows the current record.
8. Check Home at a narrow mobile width and a desktop width.
9. Sign out and confirm private account totals are not displayed.

### Privacy and boundaries

1. Confirm no raw CSV, filename, narration, account reference, exact address or bank identifier appears in recurring, budget or insight screens.
2. Confirm the UI does not present tax, debt, credit or investment advice.
3. Confirm no Property, tax, net-worth or loan-balance statistic appears.

## Historical client stop gate (completed)

Stop here for client retesting.

This pre-acceptance stop gate was completed by explicit client acceptance on 15 July 2026. Phase 5 remains separately gated and unapproved.

## Retesting outcome

The consolidated review found no unresolved acceptance blocker. Phase 4 Milestone 1 is formally closed; any Phase 5 planning remains proposal-only until separately approved.

## Formal closure evidence

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
