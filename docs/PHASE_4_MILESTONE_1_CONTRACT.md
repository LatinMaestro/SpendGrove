# Phase 4 Milestone 1 Contract - Recurring, Budgets and Everyday Insights

Status: approved implementation contract for PR 4.0

Date: 8 July 2026

## Purpose

Phase 4 Milestone 1 makes SpendGrove more useful for everyday personal finance between CSV imports by adding reviewable recurring/subscription patterns, category budgets and simple beginner-friendly insights.

The milestone must preserve:

- CSV-first privacy;
- review-before-commit;
- user control;
- no live bank linking;
- no AI advice;
- no tax advice;
- no duplicate cashflow;
- no Property/Home net-worth statistics.

This contract must be frozen before schema, migration or implementation work begins.

## Delivery sequence and gates

Approved sequence:

1. PR 4.0 - recurring, budget and insight contract.
2. PR 4.1 - schema foundation and Preview migration plan.
3. PR 4.2 - reviewable recurring/subscription suggestions.
4. PR 4.3 - category budgets.
5. PR 4.4 - everyday dashboard and trend insight foundation.
6. PR 4.5 - QA and client review package.

Vercel usage is constrained. Where safe, larger local development batches may be prepared before each Vercel push, but this must not bypass documentation gates, schema/migration approval gates, privacy/security review, stop conditions or client review points.

PR 4.1 must stop before any Preview migration. No Preview migration may run until the client explicitly approves the PR 4.1 migration plan. No Production migration is authorised.

## Core financial principles

- Everyday account transactions remain the only cashflow/spending/income records.
- Imported rows must remain review-before-commit.
- Store money as integer cents.
- Display AUD formatting only at UI/export boundaries.
- Active owned transactions are the source of budget and insight calculations.
- Deleted/inactive transactions are excluded.
- Split parents are excluded from totals and progress calculations.
- Eligible split children are included according to their own date, amount, category and transaction type.
- Loan repayment breakdown records are analytical records only and must not inflate spending, income, budget progress or dashboard totals.
- Loan-reconciled everyday transactions may count only once as the original everyday cashflow transaction.

## Recurring/subscription evidence rules

Recurring/subscription detection is deterministic and reviewable.

A suggestion may be generated only from safe current facts such as:

- same safe merchant/merchant key when available;
- same category or compatible category;
- similar signed amount;
- repeated interval pattern;
- transaction type;
- active non-deleted transaction state;
- user ownership.

Do not use:

- raw bank narration;
- raw source text;
- filenames;
- account references;
- BSBs;
- card/customer IDs;
- loan/lender references;
- masked identifiers;
- exact addresses;
- balances;
- live bank data;
- third-party enrichment;
- AI inference.

## Recurrence confidence thresholds

The implementation must define deterministic confidence bands before code ships.

Default approved contract bands:

- **High confidence suggestion**: at least three active owned transactions with matching safe merchant/category evidence, similar signed amount and a clear repeated interval.
- **Review suggestion**: at least two active owned transactions with matching safe merchant/category evidence and similar signed amount, but weaker interval evidence.
- **No suggestion**: insufficient evidence, conflicting transaction types, conflicting categories, unclear interval, deleted/inactive records only, cross-user data or any need for private source fields.

A high-confidence suggestion is still only a suggestion. It must not create a durable recurring item without user confirmation.

Interval tolerance must be explicit in implementation tests. Suggested starting tolerances:

- monthly: 27 to 34 days between occurrences;
- fortnightly: 13 to 16 days;
- weekly: 6 to 8 days.

If these tolerances prove ambiguous during implementation, stop for approval before changing them.

## User confirmation, dismissal and edit states

Recurring/subscription suggestions must be user-controlled.

The user must be able to:

- confirm a suggestion;
- dismiss a suggestion;
- edit safe recurring item fields before confirmation;
- archive a confirmed recurring item later.

A durable recurring item must never be created automatically from a suggestion.

Dismissed suggestions should not keep reappearing incorrectly for the same safe evidence pattern. The durable design may store a safe dismissal state if needed, but it must not store raw narration, filenames, private identifiers or source-detail snapshots.

## Recurring item lifecycle

A confirmed recurring/subscription item may have lifecycle states such as:

- active;
- archived.

Optional suggestion/dismissal state may be separate if needed in PR 4.1.

Confirmed recurring items are planning/review records only. They do not move money, contact merchants, pay bills or guarantee future transactions.

Allowed safe fields should be limited to:

- generated ID;
- authenticated user ID;
- safe display label chosen or confirmed by the user;
- category ID where needed;
- transaction type;
- expected amount in integer cents where needed;
- cadence code;
- optional next expected date if contract-approved;
- status;
- safe audit/status timestamps.

Forbidden durable fields:

- raw narration;
- raw merchant descriptions;
- filenames;
- account references;
- BSB/card/customer IDs;
- loan/lender references;
- masked identifiers;
- exact addresses;
- balances;
- source rows;
- private source-detail snapshots.

## Budget period rules

Approved initial budget period: monthly.

Monthly budget periods use the calendar month in the user's Australian locale assumptions. Period boundaries are inclusive from the first day of the month through the last day of the month.

Weekly or fortnightly budgets are not approved for implementation unless PR 4.1 or a later contract amendment explicitly proposes and receives approval.

No budget rollover is approved for Milestone 1. If rollover behaviour is needed, stop for approval.

## Category-budget rules

Budgets are user-entered category budgets.

A budget must:

- belong to the authenticated user;
- target one owned active category or accepted seeded category;
- use integer cents;
- use the approved monthly period;
- be editable;
- be archivable;
- not be automatically created unless separately approved.

Existing category and custom-category behaviour must remain intact. Archived categories require explicit compatibility rules before they can be used for new budgets.

## Budget progress calculations

Budget progress is calculated from current active owned everyday transactions only.

Included records:

- active owned expense transactions in the selected category for the selected monthly period;
- eligible split children in the selected category and period.

Excluded records:

- split parents;
- deleted/inactive transactions;
- transactions owned by another user;
- income transactions unless a future income-budget contract is approved;
- transfers unless explicitly contract-approved;
- loan repayment breakdown records;
- archived analytical records;
- Property report review records;
- raw import rows or uncommitted review rows.

Refund/reversal treatment:

- Refunds represented as income transactions are not subtracted from expense budget progress in Milestone 1 unless a later explicit formula is approved.
- Negative expense corrections reduce expense progress only if they are represented as active owned expense transactions in the same category and period.
- If this model is insufficient during implementation, stop for approval before changing the formula.

Budget progress formula:

`spent_cents = sum(abs(amount_cents)) for included EXPENSE transactions in the category and monthly period`

`progress_percent = spent_cents / budget_amount_cents * 100`

Display copy must avoid advice language. Use neutral wording such as `Used this month`, `Remaining this month` and `Over budget` only as descriptive status, not judgement or advice.

## Refund, transfer and split handling

Transfers:

- Transfers are excluded from expense budget progress.
- Transfers may appear in simple dashboard context only if PR 4.4 explicitly implements a contract-approved count or neutral list.

Refunds/reversals:

- Refund treatment must follow the budget progress rules above.
- Do not infer tax, deductibility or merchant/biller obligations from refunds.

Splits:

- Split parents are excluded from all budget and insight totals.
- Eligible split children are included based on their own type, category, amount and date.

## Loan repayment no-double-count treatment

- Loan repayment breakdown records never count as spending or income.
- Reconciliation links never create extra cashflow.
- The everyday transaction linked to a loan repayment may count once according to its own transaction type/category if it otherwise meets the budget or dashboard formula.
- Principal, interest, fee and balance components are not aggregated in Phase 4 Milestone 1 dashboard or budget metrics.

## Dashboard scope

The dashboard may show only simple, transparent everyday metrics approved by this contract:

- this month spending by category from active owned everyday expense transactions;
- category budget progress for user-created monthly budgets;
- confirmed recurring/subscription list;
- simple month-to-month spending comparison using explicit current-month and previous-month formulas;
- neutral empty states and review prompts.

The dashboard must not show:

- net worth;
- Property profit/loss;
- yield;
- equity;
- valuation;
- investment performance;
- tax/EOFY stats;
- deductible/claimable values;
- loan-balance forecasting;
- debt advice;
- credit advice;
- AI advice;
- Property/Home net-worth statistics;
- totals inflated by loan repayment breakdown records.

## Trend insight rules

Allowed trend insight examples:

- `Spending is up compared with last month`;
- `Spending is down compared with last month`;
- `No previous-month comparison yet`;
- `Top spending categories this month`.

Formula for month-to-month spending comparison:

`current_month_spend_cents = sum(abs(amount_cents)) for included active owned EXPENSE transactions in the current calendar month, excluding split parents and excluded records`

`previous_month_spend_cents = same formula for the previous calendar month`

`difference_cents = current_month_spend_cents - previous_month_spend_cents`

No forecast, guarantee, advice, judgemental wording or scary language is approved.

## Allowed wording

Use simple neutral copy such as:

- `Suggested recurring payment`;
- `Why this was suggested`;
- `Confirm recurring item`;
- `Dismiss suggestion`;
- `Budget for this category`;
- `Used this month`;
- `Remaining this month`;
- `Compared with last month`;
- `Review before relying on insights`;
- `Record keeping only` where relevant.

## Forbidden wording

Do not use:

- `AI advice`;
- `financial advice`;
- `guaranteed forecast`;
- `tax deductible`;
- `deductible`;
- `claimable`;
- `taxable`;
- `ATO-ready`;
- `tax-ready`;
- `accountant approved`;
- `automatically classified for tax`;
- `debt advice`;
- `credit advice`;
- `investment performance`;
- `net worth`;
- `property profit`;
- `property yield`;
- `equity`;
- `valuation`.

## Privacy boundaries

Do not persist, log or display private source fields for recurring, budget or insight features:

- raw CSV files;
- raw CSV rows;
- original filenames;
- raw bank narration;
- raw source text;
- account identifiers;
- BSBs;
- card fragments;
- customer IDs;
- loan/lender references;
- masked references;
- exact property addresses;
- balances;
- secrets or connection strings.

Use safe aggregate counts, category labels, user-confirmed labels and integer-cent values only.

## Audit metadata boundaries

Audit metadata may contain safe lifecycle reason codes such as:

- `RECURRING_SUGGESTION_CONFIRMED`;
- `RECURRING_SUGGESTION_DISMISSED`;
- `RECURRING_ITEM_ARCHIVED`;
- `BUDGET_CREATED`;
- `BUDGET_UPDATED`;
- `BUDGET_ARCHIVED`.

Audit metadata must not contain raw narration, private identifiers, old/new transaction values, filenames, balances, exact addresses or source-detail snapshots.

## Stop conditions

Stop and ask before proceeding if:

- recurrence thresholds are ambiguous;
- budget period or rollover rules are ambiguous;
- dashboard formulas are ambiguous;
- split/refund/transfer/no-double-count rules are unclear;
- schema or migration plan is ready;
- private source fields would be needed;
- a new package/provider/secret is proposed;
- Production migration is proposed;
- tax, Property/Home net-worth, Basiq, AI, payments, household mode, document storage or later modules enter scope;
- Vercel/deployment status is unclear and the work is not safely documentation-only.

## PR 4.1 schema expectations

PR 4.1 may propose only the minimum additive schema required for:

- confirmed recurring/subscription records;
- recurring dismissal/archive state if needed;
- category budgets;
- budget periods if needed.

PR 4.1 must include:

- exact Prisma model/enum changes;
- exact migration SQL;
- ownership fields;
- unique/index rules;
- rollback notes;
- pre/post integrity checks;
- privacy review;
- confirmation that existing Phase 3A-3C data is untouched.

Stop before any Preview migration. No Production migration is authorised.

## PR 4.5 client review expectations

The final client review package must include:

- completed PRs and merge commits;
- Vercel links where available;
- schema/migration status;
- no Production migration confirmation;
- recurring/subscription rules implemented;
- budget rules implemented;
- dashboard/insight rules implemented;
- calculation formulas;
- excluded calculations;
- privacy/security evidence;
- no-double-count evidence;
- mobile review notes;
- known limitations;
- synthetic-data client retesting checklist.
