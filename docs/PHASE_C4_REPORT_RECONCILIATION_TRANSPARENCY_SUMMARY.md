# Phase C4 Report Reconciliation Transparency Summary

Date: 26 July 2026  
Status: focused existing-schema implementation prepared; exact-head verification pending  
Master-plan alignment: Phase C4 — Loan, Property and report completion  
Governing dependency: PR #259 Phase C4 audit and completion contract

## Objective

Make the existing Loan and Property reports describe repayment reconciliation states accurately without changing any amount, eligibility, cashflow, tax or source-record rule.

The repository already provides Australian financial-year Loan and Property reports, formula-safe exports, owner-scoped report services, accountant preparation manifests, neutral wording and the accepted Loan no-double-count rule. This slice corrects one transparency gap inside that existing foundation.

## Current-state finding

`SafeLoanRepayment.reconciliationStatus` already distinguishes:

- `LINKED` — an accepted everyday Transaction link exists;
- `NEEDS_REVIEW` — the current reconciliation state requires user review;
- `UNMATCHED` — no accepted everyday Transaction link is recorded.

Before this change:

- the Loan report displayed `needsReviewCount + unmatchedCount` as one `Needs review` value;
- the Property report incremented `needsReviewCount` for every state other than `LINKED`.

No amount or record was lost, but the presentation obscured whether a repayment was explicitly awaiting review or simply had no accepted match.

## Delivered changes

### Property report service

`src/server/property-financial-reporting.ts` now:

- adds `unmatchedCount` to `PropertyLoanComponentSummary`;
- initializes all three reconciliation counts explicitly;
- increments `matchedCount` only for `LINKED`;
- increments `needsReviewCount` only for `NEEDS_REVIEW`;
- increments `unmatchedCount` for `UNMATCHED`;
- leaves component totals, period eligibility, ownership and cashflow derivation unchanged.

### Property report screen

`app/reports/properties/page.tsx` now:

- presents matched, needs-review and unmatched counts separately;
- explains that unmatched means no accepted everyday cashflow link is recorded;
- states that unmatched status does not change component totals or create another cashflow record;
- retains separate linked-record cashflow and Loan component presentation;
- adds consistent visible keyboard-focus treatment.

### Loan report screen

`app/reports/loans/page.tsx` now:

- presents `Matched`, `Needs review` and `Unmatched` independently;
- no longer sums needs-review and unmatched records into one label;
- explains unmatched status without implying a missing component or tax conclusion;
- retains all principal, interest, fee, repayment and balance totals;
- adds consistent visible keyboard-focus treatment.

## Automated evidence

Updated suites:

- `tests/server/property-financial-reporting.test.ts`;
- `tests/phase-8-property-reporting-ui.test.ts`;
- `tests/phase-8-loan-reporting-ui.test.ts`.

Added:

- `tests/phase-c4-report-reconciliation-transparency.test.ts`.

Combined with PR #259's seven-test C4 regression contract, the stacked exact head is expected to contain 153 test files and 955 tests.

The tests prove:

1. matched, needs-review and unmatched counts remain distinct;
2. other-Property and out-of-period repayments remain excluded;
3. component totals remain integer-cent exact;
4. Property cashflow remains unchanged when Loan component rows are counted;
5. the Loan UI no longer combines needs-review and unmatched counts;
6. both reports explain unmatched status consistently;
7. no guarded schema, provider, Production, document, AI or Apple capability is introduced;
8. neutral preparation and no-tax-advice wording remains present;
9. report controls retain visible focus treatment.

## Financial integrity

No monetary formula or report-eligibility rule changed.

The slice preserves:

- integer cents;
- Australian financial years from 1 July to 30 June;
- owned active everyday Transactions as the sole cashflow records;
- split-child inclusion and counted-parent exclusion;
- signed direction and transfer precedence;
- LoanRepayment as analytical component data only;
- no second cashflow amount from a LoanRepayment;
- no inferred principal, interest, fee or balance component;
- no changed refund, allocation, budget or report-total treatment;
- no Property valuation, equity, yield or Loan forecast.

Reconciliation-status counts describe existing records. They do not affect report inclusion or monetary totals.

## Privacy and ownership

No new data is stored or returned. Existing report services continue to authenticate and reuse owner-scoped Loan, repayment, Property and Transaction services.

This slice does not expose or expand use of raw CSV content, filenames, raw narration, banking identifiers, Loan references, exact Property addresses, provider payloads, private audit metadata, secrets or environment values.

## Tax and professional-review boundary

The screens remain preparation and record-keeping surfaces. They continue to state that they do not determine deductibility, prepare a tax return or provide tax or financial advice.

This slice does not implement deductible classifications, ownership shares, mixed-use allocation, depreciation, evidence-needed persistence, tax-return integration or professionally finalised terminology.

Qualified Australian tax/accounting review remains required before tax-sensitive finalisation.

## Schema, provider and environment impact

No change to:

- Prisma schema or migration files;
- database state or API routes;
- packages, lockfile or workflows;
- Vercel, Neon or Clerk settings;
- Production data or runtime gates;
- external providers;
- documents, storage or OCR;
- Expo, Apple, TestFlight, pricing or real users.

## Known limitations and remaining gates

- final report terminology requires professional review;
- complete Property metadata remains behind minimisation and material-schema decisions;
- named lender coverage remains behind exact synthetic-format evidence;
- document evidence files remain behind secure storage/provider gates;
- accountant collaboration remains behind activation and invitation-provider gates;
- authenticated synthetic browser review remains unavailable through connected tooling;
- GitHub Actions must execute after eventual retargeting to `main`;
- PRs #231 onward must merge in dependency order;
- the separate Import Review memoisation warning remains outside this report-only slice.

## Next action

After exact-head verification, follow PR #259's sequence by preparing the wholly synthetic financial-year everyday cashflow and Category formula/reconciliation contract. Do not add new aggregation or accountant-pack fields before that contract is committed.
