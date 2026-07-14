# Phase 4 Milestone 4 Chart Correctness Audit

Status: approved audit and implementation boundary for the focused client-review hardening pass

Date: 14 July 2026

Phase 4 Milestones 1-4 remain open pending consolidated client acceptance.

## Scope

This audit investigates the July 2026 client-recording evidence that a positive $2,500 incoming transfer appeared inside the `Needs review` monthly spending segment and drilldown. It freezes the smallest contract-aligned correction before implementation.

This pass does not authorise schema, migration, data rewrite, backfill, broad import reclassification, refund-rule, signed-money, category, budget, split, transfer, navigation, package, provider, secret or environment changes.

## Evidence and confirmed record state

No Production database or secret was accessed. The connected database project exposed only a branch named `production`, so no database query was run.

The deployed code path and client recording establish the following safe facts without using narration, merchant text, account data or identifiers:

- the displayed signed amount is positive: `+250000` cents;
- the Transactions category drilldown admits only records whose API transaction type is `EXPENSE`;
- the row appeared in that drilldown, so its persisted/API type is `EXPENSE`;
- it is not represented by the transaction type `TRANSFER` or `INCOME`;
- the chart and drilldown both use `Math.abs(amountCents)`, so the positive amount was converted into $2,500 of spending;
- the `Needs review` fallback is an expense category, and import commit derives transaction type from the selected category while preserving the CSV amount sign.

The defect is therefore an inconsistent durable pairing: a positive signed amount with transaction type `EXPENSE`. The chart did not include a correctly typed income or transfer; it included a malformed positive expense.

## Root cause

Two existing implementation choices combine:

1. Import review falls back to the seeded `Needs review` category when no safe category suggestion is available. That category has type `EXPENSE`.
2. Import commit derives the durable transaction type from the reviewed category and preserves the signed source amount.

The monthly chart and the existing everyday-insight helper then treat every active `EXPENSE` record as spending without also enforcing the existing signed-money convention that everyday money-out amounts are negative.

The chart-specific helper and drilldown also duplicate eligibility logic, allowing record-set parity to drift.

## Affected features

The same missing sign guard exists in the shared everyday-insight calculations. A positive `EXPENSE` can therefore inflate:

- Transactions monthly donut and legend;
- full category breakdown;
- `Needs review` category drilldown;
- Home current- and previous-month spending;
- Home category comparisons;
- category budget progress when the malformed record's category has an active budget.

Recurring thresholds, Property reporting, Loan repayment analytics and cashflow ownership are not affected by this correction.

## Approved smallest safe correction

Implementation may enforce one canonical everyday-spending eligibility predicate:

- authenticated owner;
- active and not deleted;
- transaction type `EXPENSE`;
- strictly negative integer-cent signed amount;
- eligible split child or unsplit record;
- not a counted split parent;
- valid date inside the selected Australian calendar month where a month applies.

Income, transfers, analytical LoanRepayment records, inactive/deleted records, cross-user records and positive or zero `EXPENSE` anomalies are excluded.

This is an implementation correction to enforce the established signed-money and everyday-expense boundary. It does not change the approved expense formula, transfer treatment, refund treatment or stored signed-money convention.

The canonical helper will be reused by monthly category spending and everyday insights. Chart categories will retain the eligible transaction IDs required for exact same-month drilldown parity. Search remains list-only and does not alter whole-month aggregates.

## Needs review definition

For monthly spending, `Needs review` means an otherwise eligible everyday expense that has no usable active category.

It does not include income, transfers, positive or zero `EXPENSE` anomalies, analytical loan records, split parents, inactive/deleted records or cross-user records merely because they lack a usable category.

## Durable data and import boundary

No data rewrite, backfill or automatic historical reclassification is authorised.

The existing July record remains stored as a positive `EXPENSE` until the user corrects its type/category through the existing transaction correction flow. After the eligibility correction it will no longer inflate spending, category comparisons or budget progress.

The broad import category/type model is not changed in this pass. Correcting that model across bank formats would affect import classification and requires a separate contract and approval.

## Presentation hardening

The implementation may also:

- display exact zero as `0%`;
- display a positive percentage below 0.1% as `<0.1%`;
- retain one-decimal percentages otherwise;
- derive real-category colours deterministically from a stable safe category key;
- use fixed presentation colours for `Needs review` and `Other`;
- persist no colour assignment and add no dependency.

Currency values remain authoritative. Percentage rounding never changes category amounts.

## Record-set reconciliation

The following must derive from the same selected-month eligible record set and reconcile exactly:

1. donut total;
2. legend category totals;
3. full category breakdown;
4. selected-category drilldown.

The full breakdown contains real categories. `Other` remains a summary-only grouping.

## Privacy and security

Only owned transaction IDs and category aggregates needed for server-validated parity may be used. Chart presentation receives safe aggregate data.

Do not expose or log raw CSV rows, narration, filenames, merchant/source text, account references, BSB/card/customer identifiers, exact Property addresses, secrets or private import metadata.

## Required focused evidence

Tests must prove:

- positive income, incoming/outgoing transfers and positive `EXPENSE` anomalies are excluded;
- eligible negative everyday expenses and split children are included;
- split parents, analytical loan records, inactive/deleted and cross-user records are excluded;
- only uncategorised eligible expenses enter `Needs review`;
- aggregate and drilldown record sets reconcile;
- Home/category comparison/budget progress use the same sign-safe eligibility;
- percentage and deterministic-colour presentation is stable;
- no import, schema, migration, package, privacy or financial-contract change occurred.

## Stop conditions

Stop before implementation if delivery requires a schema change, migration, data rewrite/backfill, historical reclassification, signed-money or refund-rule change, broad bank-parser change, manual SQL, package/provider/secret/environment change, persistent colours, navigation change or any excluded later module.
