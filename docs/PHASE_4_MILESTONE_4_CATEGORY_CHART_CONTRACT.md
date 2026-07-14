# Phase 4 Milestone 4 Monthly Category Spending Contract

Status: approved focused client-review enhancement; documentation and aggregation assessment only in PR 4.27.

Last updated: 14 July 2026

## Objective

Add a compact monthly category-spending donut and a focused full breakdown to Transactions. The visual must explain the selected month's everyday spending without changing the accepted spending formula, transaction workflow, primary navigation or beginner-first page hierarchy.

Phase 4 Milestones 1-4 remain implemented and technically verified but open pending consolidated client acceptance.

## Delivery sequence

1. PR 4.27 - this contract and aggregation assessment.
2. PR 4.28 - chart, breakdown and focused regression tests.
3. PR 4.29 - QA, permanent handoff and consolidated deferred-testing evidence.

One meaningful Vercel Preview is required for PR 4.28 where capacity permits. Documentation-only PR 4.27 does not require a deployment solely for evidence.

## Existing source-of-truth assessment

The existing implementation already has compatible month and spending rules:

- Transactions loads only one selected Australian calendar month through `listDurableManualTransactionsForMonth`.
- The initial month remains the current Brisbane month when populated, otherwise the latest populated owned active month, otherwise the current month with an empty state.
- `summarizeEverydayInsights` defines approved everyday expense eligibility: the signed-in owner, `EXPENSE`, active and not deleted, and not a split parent.
- Eligible split children remain included.
- Spending uses the absolute integer-cent amount of each eligible expense.
- Income, transfers, analytical `LoanRepayment` records, deleted/inactive records and other-user records are excluded.
- Existing category comparisons and total spending use the same Brisbane calendar boundaries.

PR 4.28 will extract or reuse one pure monthly category aggregation boundary and prove by reconciliation tests that its total equals the existing approved monthly everyday-spending total for the same records. The chart will not maintain an independent client-side financial formula.

If implementation finds that the existing Transactions and everyday-insight totals disagree for the same month and records, work must stop for approval. It must not silently choose a formula.

## Data contract

The server may return only this safe aggregate chart shape:

- selected month key and display label;
- total eligible spending in integer cents;
- category key used only for in-app filtering;
- safe category name;
- category total in integer cents;
- eligible transaction count.

The chart receives aggregate values, not transactions or source-import data.

A transaction with no usable active owned category is grouped under `Needs review`. No durable fallback or `Other` category is created.

Currency remains integer cents until the display boundary.

## Monthly eligibility rules

Include only records that satisfy all of the following:

- owned by the authenticated user;
- in the selected Australian calendar month;
- active and not deleted;
- everyday `EXPENSE` transaction;
- not a split parent;
- an eligible split child or unsplit transaction;
- valid integer-cent amount and valid date.

Exclude:

- income;
- transfers;
- split parents;
- analytical loan repayment records;
- deleted or inactive transactions;
- other-user records;
- any transaction type already excluded by the approved everyday-spending calculation.

The chart does not read or change Property, loan, tax, net-worth, budget or recurring values.

## Refund limitation

No new refund treatment is introduced. The chart follows the existing monthly everyday-spending rule. Income-style refunds are not netted against expense totals by this enhancement. That accepted limitation is shown in the QA record rather than changed here.

## Reconciliation invariant

For every selected month:

- each eligible transaction contributes to exactly one full-breakdown category;
- full-breakdown category currency totals sum exactly to the donut-centre total;
- summary `Other` is presentation-only and equals the exact sum of categories outside the five largest;
- displayed percentages are derived from authoritative integer-cent amounts;
- percentage rounding may not total exactly 100%, and amounts must never be changed to force it.

## Summary grouping

- Five or fewer eligible categories: show all.
- More than five: show the five highest totals and combine the exact remainder into `Other`.
- Sort by total descending, then category name for deterministic ties.
- `Other` exists only in the compact chart.
- The full breakdown always lists every real category and `Needs review`, never a synthetic `Other` row.
- A one-category month renders one complete segment.
- A no-expense month renders a compact empty state, not a zero-value chart.

## Transactions page behaviour

Page order remains:

1. header and Add transaction;
2. month/search/filter toolbar;
3. compact monthly category-spending summary;
4. transaction count;
5. compact transaction list.

The chart:

- always uses the same selected month as the list;
- updates with previous, next and existing month selection;
- does not react to search text or list-only filters;
- does not load the entire history;
- does not block the transaction list if chart presentation fails;
- has a chart-specific compact error/retry state if needed.

## Chart presentation

Use a small in-repository accessible SVG donut; no chart dependency is authorised.

Desktop:

- one compact horizontal surface;
- approximately 140-160 px donut;
- compact legend and visible `View breakdown`;
- approximately 200-240 px maximum surface height where content permits.

Mobile:

- compact stacked or wrapping layout;
- approximately 120-140 px donut;
- no horizontal scrolling;
- does not dominate the initial viewport.

The centre shows only the selected-month total and `Spent`.

The accessible, restrained palette must use distinguishable approved visual-system colours, visible labels and text amounts. Colour is never the sole carrier of meaning. No decorative animation is added, and reduced-motion preferences are respected.

## Full breakdown workflow

`View breakdown` opens a focused Transactions subordinate state without adding primary navigation.

It shows:

- `Back to transactions`;
- `Spending by category`;
- selected month and total;
- every real category sorted by amount descending;
- category name, amount, percentage and quiet transaction count.

Selecting a category returns to or remains within Transactions for the same month, applies a clear removable category filter, and reuses the existing compact transaction list. It does not create a second transaction-detail system.

## Accessibility

The chart requires:

- an accessible title;
- a concise description containing selected month, total and largest category when available;
- readable legend text for every visible summary category;
- keyboard-accessible `View breakdown`;
- meaningful category-row labels;
- visible focus;
- logical focus restoration if a dialog/drawer is chosen;
- no colour-only information;
- long-name truncation with full accessible text;
- reduced-motion compatibility.

## Performance

- Query only the selected month.
- Aggregate server-side or at the existing trusted server boundary.
- Return aggregate values with the selected-month transaction response where practical.
- Do not refetch category data per slice.
- Do not recalculate on search keystrokes.
- Do not rerender the full list merely to open or close the breakdown.
- Mutations refresh the selected-month aggregate safely without loading all history.

## Privacy

Never provide the chart with or log:

- raw CSV rows or narration;
- filenames;
- bank account, BSB, card, customer or source identifiers;
- exact Property addresses;
- private import metadata;
- user email or audit data.

No aggregate currency values are added to audit metadata.

## Preserved behaviour

This enhancement does not change:

- transaction storage or values;
- Australian month boundaries;
- initial latest-populated-month fallback;
- search semantics;
- split handling;
- transfer handling;
- category assignment;
- import behaviour;
- budget calculations;
- recurring rules;
- loan reconciliation;
- Property links or reports;
- existing refund treatment;
- primary navigation.

## Schema and dependency assessment

Approved result: no Prisma schema change, migration, data rewrite, backfill, package, lockfile, provider, secret or environment variable is required.

Implementation must use existing React, SVG, styling and server capabilities. A material chart dependency is a stop condition.

## Focused tests required

PR 4.28 must cover:

- selected month and month-change aggregation;
- owned active expenses included;
- split children included and split parents excluded;
- income, transfers, loan analytical records, deleted/inactive and cross-user records excluded;
- existing refund limitation preserved;
- category totals reconcile exactly to the centre total;
- top-five plus exact `Other`;
- actual full categories rather than synthetic `Other`;
- `Needs review`, one-category and no-expense states;
- chart/list month agreement and latest-populated fallback;
- breakdown, back and removable category filter;
- search not changing whole-month aggregates;
- accessible chart text and category actions;
- no primary-navigation, schema, migration, package, financial-rule or private-data change.

## Mandatory stop conditions

Stop and request approval if delivery requires:

- schema or migration work;
- data rewrite or backfill;
- a new package or material dependency;
- a provider, secret or environment variable;
- a new spending or refund formula;
- changes to split, transfer, category, budget, month or import behaviour;
- a durable synthetic category;
- a primary navigation destination;
- raw narration or banking identifiers;
- Property, tax, loan-balance, equity, valuation or net-worth statistics;
- Basiq, AI, payments, household mode or document storage;
- unresolved disagreement between existing monthly aggregates.

## Completion gate

After PR 4.29, Phase 4 Milestones 1-4 remain open pending consolidated client acceptance. No milestone is accepted or closed, and no later milestone begins.


## Client-review correctness hardening addendum (14 July 2026)

The focused audit is recorded in `docs/PHASE_4_MILESTONE_4_CHART_CORRECTNESS_AUDIT.md`.

The client recording proved that an inconsistent positive `EXPENSE` record could enter the chart because the original implementation checked transaction type but did not enforce the signed money-out boundary. The approved correction is to share one canonical eligibility predicate across monthly category spending and everyday insights:

- owned, active and not deleted;
- type `EXPENSE`;
- strictly negative integer-cent amount;
- not a counted split parent;
- valid date and selected month where applicable.

`Needs review` is restricted to otherwise eligible everyday expenses without a usable active category. Positive incoming records, transfers and other ineligible records cannot enter that fallback.

Donut, legend, full breakdown and category drilldown must use the same eligible record set. Search remains list-only.

This addendum does not change signed-money conventions, transfer/refund treatment, transaction storage, import behaviour, categories, split rules, budget formulas, schema, migrations or dependencies. Existing inconsistent durable records are not rewritten or backfilled and remain user-correctable through the existing transaction flow.

Presentation may format positive values below 0.1% as `<0.1%` and assign deterministic non-persisted colours from safe category keys, with fixed colours for `Needs review` and `Other`.
