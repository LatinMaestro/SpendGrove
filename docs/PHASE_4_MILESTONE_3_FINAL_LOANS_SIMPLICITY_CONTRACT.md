# Phase 4 Milestone 3 Final Loans Simplicity Contract

Status: approved client-feedback contract for implementation  
Date: 14 July 2026  
Milestone status: Phase 4 Milestones 1, 2 and 3 remain open pending client acceptance.

## Objective

Make the existing Loans experience read as two simple record areas:

1. Loan repayments.
2. Property transactions, when the Loan Account belongs to a Property.

The change is presentation and interaction hardening only. It does not change financial records, calculations, matching, Property links, reporting, exports or persistence.

## Focused Loan navigation

The existing `/loans` route will use a selected-loan subview.

- The default state shows compact Loan Account cards only.
- `View loan` replaces the overview content with one focused Loan detail view.
- `Back to loans` returns to the compact overview.
- Other Loan Account cards are not rendered beneath the focused Loan.
- The Loans navigation item remains selected.
- No route, bottom-navigation tab or material navigation structure is added.
- The existing full-width `Close details` action is removed.

## Compact Loans overview

Each active Loan Account card shows only:

- safe Loan nickname;
- plain Loan type;
- linked Property nickname when present;
- latest active repayment date and total when present;
- `Needs review` only when at least one active repayment needs matching;
- one `View loan` action.

Healthy loans show no routine `Up to date`, linked-state, repayment-count or matching-count badge.

## Focused Loan detail

The detail header shows the Loan nickname, type and linked Property nickname once. `Edit loan` and `More` remain secondary.

The record sections appear in this order:

1. `Loan repayments`
2. `Property transactions`, only for a linked Property

No other record section receives equal visual weight.

## Loan repayment display mapping

One user-facing repayment row combines one owned `LoanRepayment`, its optional owned reconciliation link and its optional linked owned everyday `Transaction`. This remains one row to the user. The linked everyday cashflow is not rendered as a second repayment.

A collapsed repayment row shows the repayment date, total repayment amount, `Needs review` only when unresolved, and a disclosure control. Only one repayment detail may be open at a time. Open details may show non-empty principal, interest, fees and balance-after values.

The latest three active repayments appear first. `View all repayments (N)` and `Show latest three` preserve full access.

## Repayment actions and recovery

Common repayment information is primary. Edit, match/change transaction, unlink and delete remain available in opened details or a secondary `More` disclosure.

Recoverable deletion remains the existing soft-delete/archive lifecycle. `Deleted repayments` is secondary and contains restore and bounded bulk management. The beginner-facing word `cleanup` is removed. No hard deletion is introduced.

## Plain-language matching

All accepted automatic/manual validation, thresholds, amount/date checks, ambiguity handling, mismatch confirmation and reversibility remain unchanged.

Beginner-facing copy uses:

- `Needs review`
- `SpendGrove could not find a clear matching transaction.`
- `Match transaction`
- `No matching transaction was found.`
- `Search for another transaction`
- `Search by date`
- `This transaction does not closely match the repayment. Are you sure you want to link it?`

The exact-date input remains hidden until requested. Internal confidence, eligibility, override, analytical and reconciliation terms are not shown in the normal user flow.

## Property transaction display mapping

A Property transaction row is an eligible active owned everyday transaction linked to the selected Property, excluding any transaction already represented by a reconciliation link in this Loan's repayment list.

The existing server-derived record set remains authoritative. Existing ownership, active/deleted, split-parent, split-child, multi-loan and manual-link rules are unchanged.

Each row leads with the safe category label, then a useful safe cleaned merchant label when available, otherwise `Everyday transaction`. Date and `Money in` or `Money out` are secondary. Amount remains visually separate.

The latest three appear first and the existing full-history toggle remains available. Non-Property loans do not show Property transactions or Property reporting.

## Property report workflow

`View property report` opens the existing Property report in a focused accessible dialog instead of expanding it inline in Loan details.

The report retains the accepted Financial Year selection, current linked-record source of truth, calculations, export fields, disclaimer, ownership and privacy validation. Closing the dialog returns to the same Loan detail. No report content, formula, export column or Property-link rule changes.

## Privacy and no-double-count boundaries

- Everyday transactions remain the only cashflow records.
- Loan repayments remain analytical breakdown records.
- Display composition creates no new record and changes no existing record.
- No raw narration, CSV row, filename, bank reference, account identifier, exact address or private source value is displayed, persisted or logged.
- Safe Loan and Property nicknames, safe cleaned merchant labels and category labels remain permitted.
- The existing no-double-count and repayment-cashflow exclusion rules remain unchanged.

## Essential actions preserved

Edit loan, Edit property, Edit repayment, Match transaction, Unlink, Delete, Restore, repayment import, add Loan Account, Property report and export remain reachable.

## Explicit non-changes

This pass requires and authorises no Prisma schema change, Preview or Production migration, data rewrite, backfill, hard deletion, repayment calculation change, matching-threshold change, cashflow/split-allocation change, Property-link change, report/export change, package/provider/secret/environment change, navigation tab, or later module.

## QA gate

Implementation must pass focused Loans display and wording regressions, the full test suite, TypeScript, lint and optimized production build, followed by one meaningful Vercel Preview, merged-main verification and a public `/loans` smoke check.

A signed-in narrow-width review is required when the connected environment permits it. Otherwise the limitation must be recorded without claiming visual acceptance.

## Stop conditions

Stop before implementation if the selected-loan subview, controlled repayment disclosure, secondary recovery management or report dialog would require hiding an essential correction/recovery action; a schema/migration/data change; a financial, matching, split, Property-link, report or export rule change; private source data; a package/provider/secret/environment change; a new bottom-navigation tab; or a later module.
