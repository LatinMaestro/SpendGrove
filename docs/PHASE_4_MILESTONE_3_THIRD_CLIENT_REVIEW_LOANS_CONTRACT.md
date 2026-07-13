# Phase 4 Milestone 3 Third Client-Review Loans Simplification Contract

Status: client-approved; implementation gated by this contract

Last updated: 14 July 2026

## Objective

Present each Loan Account as two understandable record areas only:

1. `Loan repayments`;
2. `Property transactions`, only when an active Property is linked.

Preserve the existing LoanRepayment, LoanReconciliationLink, Transaction and PropertyTransactionLink models, all reconciliation rules, Property reports/exports and the rule that everyday transactions are the only cashflow records.

Phase 4 Milestones 1, 2 and 3 remain open pending explicit client acceptance.

## Impact assessment

Repository truth confirms this is a presentation-only change.

- No Prisma schema or migration change is required.
- No Preview or Production migration is authorised.
- No data rewrite, backfill or hard deletion is required.
- No package, provider, secret or environment change is required.
- Loan calculations, correction rules, reconciliation confidence, split allocation and no-double-count rules remain unchanged.
- Property-link cardinality and report/export records, formulas and columns remain unchanged.
- Existing owned, active/deleted and split-parent eligibility checks remain server enforced.
- No navigation tab or new module is added.

Stop before implementation if any statement above proves false.

## Exact record-display mapping

### Canonical Loan repayment row

One user-facing Loan repayment row is keyed by one owned, non-deleted `LoanRepayment` and may combine:

- its structured repayment date and total;
- its optional active `LoanReconciliationLink`;
- the safe date and amount context of its optional linked everyday `Transaction`.

The linked everyday Transaction is never rendered as a second row on the same Loan detail screen.

A single everyday transaction may safely support separately allocated repayment components under existing reconciliation rules. Each owned LoanRepayment remains one row in its own Loan Account. This visual rule does not merge, alter or recalculate those repayments.

Manual override and automatic high-confidence links use the same display rule. Link method is not exposed because the current safe history payload does not persist or return a beginner-relevant method label.

### Property transaction row

The main Loan detail `Property transactions` list is derived from current eligible manual `PropertyTransactionLink` records returned as `activity.transactions`.

Before display, exclude every transaction ID present in `activity.loanTransactions` for that Property. This means:

- a reconciled repayment cashflow is not repeated under Property transactions;
- loan-derived cashflows from any Loan Account linked to the same Property are omitted from this everyday Property list;
- a transaction that has both a manual Property link and a loan-reconciliation path is omitted here;
- non-repayment manually linked income and expense transactions remain visible;
- split parents remain excluded and eligible split children remain eligible through existing server checks;
- inactive/deleted/cross-user records remain excluded.

This rule resolves multiple-loan, shared-property, split-allocation and manual-override presentation safely without changing any durable relationship.

### Property report

The accepted Property report/export remains a separate secondary workflow and continues to use its existing revalidated source-of-truth, eligibility, financial-year, notice and export-column rules.

The main Property transactions list does not redefine or filter the report. The report remains accessible through `View property records` and is not rendered as a second inline history.

## Loans overview

Each active Loan Account card shows only:

- safe nickname;
- broad loan type/purpose;
- linked Property nickname when present;
- latest active repayment date and total when available;
- `Up to date`, `N repayment(s) need matching`, or `No repayments imported yet`;
- one `View loan` action.

Routine repayment and linked-transaction counts are removed. `Not linked` and internal reconciliation wording are not shown.

Only one Loan Account may be expanded at a time.

## Loan detail

The expanded header repeats the Loan/Property relationship once and provides:

- `Edit loan` as a secondary action;
- a collapsed `More` area for uncommon Loan lifecycle actions.

Non-Property loans show no Property transaction or Property record control.

## Loan repayments

- Show active repayments only in the main list.
- Show the latest three initially.
- `View all repayments (N)` and `Show latest three` control list length.
- Each row shows date and total.
- Only action-needed status is prominent.
- Structured principal, interest, fees and balance-after fields appear only after opening the row and only when present.
- Existing match, manual search, correction and unlink actions remain inside the affected row.
- Normal lifecycle copy uses `Delete repayment`, `Deleted repayments` and `Restore repayment`.
- Safe soft archive/restore remains the internal implementation.
- Deleted repayment recovery and bounded multi-select management remain secondary.

Opening balance is not displayed because it is not an approved persisted field in the current schema.

## Property transactions

- Show only when an active Property is linked.
- Show latest three eligible non-loan-derived manual Property transactions initially.
- `View all property transactions (N)` and `Show latest three` control list length.
- Show safe date, amount, category and `Money in`/`Money out`.
- Do not show another loan repayment cashflow here.
- Do not change transaction amount, type, category, date, Property link or cashflow treatment.

## Property records and privacy

- `View property records` opens the existing report/export workflow without another inline transaction history.
- The existing financial-year selector, report rows, export columns and disclaimer remain unchanged.
- Loan privacy information moves to a collapsed `How SpendGrove keeps loan information private` disclosure.
- Do not repeat no-double-count or record-keeping explanations under multiple sections.

## Required action access

The following remain reachable:

- edit Loan Account;
- edit linked Property metadata;
- review, manually match and unlink a repayment;
- correct an eligible unmatched repayment;
- delete/restore repayments through the safe soft lifecycle;
- delete/restore a Loan Account through the existing safe lifecycle;
- open Property records and export.

## Privacy and no-double-count

- Use only approved safe structured loan, repayment, transaction, category and Property metadata.
- Do not persist or log raw CSV files/rows, narration, filenames, account references, private identifiers, exact addresses, balances outside approved repayment balance-after, or secrets.
- Everyday transactions remain the only cashflow records.
- LoanRepayment rows remain analytical details and never add spending.
- Visual deduplication creates, deletes, merges or rewrites no durable record.

## Verification requirements

Focused regression tests must prove:

- concise overview and single expanded Loan;
- canonical repayment row and no separate linked-transaction history;
- latest-three/View-all behaviour;
- action-needed warning and essential match/unlink/correction access;
- non-loan Property transactions remain visible;
- every loan-derived Property transaction is excluded from the main Property transaction list;
- Property report/export remains unchanged and secondary;
- non-Property loans render no Property sections;
- Delete/Deleted/Restore copy maps to existing soft lifecycle;
- privacy, ownership, split eligibility and no-double-count rules remain unchanged;
- no schema, migration, package, provider, secret, environment or navigation change.

## Mandatory stop conditions

Stop for client approval if implementation requires a schema or migration, data rewrite/backfill, hard deletion, financial or loan-calculation change, reconciliation threshold or allocation change, cashflow ownership change, Property-link cardinality change, report/export change, loss of an essential correction/unlink/recovery action, private source fields, new package/provider/secret/environment variable, new navigation tab, Basiq, AI, payments, tax advice, Property statistics, household mode or document storage.
