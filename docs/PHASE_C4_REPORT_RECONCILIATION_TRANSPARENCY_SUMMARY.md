# Phase C4 Report Reconciliation Transparency Summary

Date: 26 July 2026  
Status: focused existing-schema implementation prepared; exact-head verification pending  
Master-plan alignment: Phase C4 — Loan, Property and report completion  
Stacked dependency: PR #257 and all earlier Phase C, master-plan and activation dependencies

## Objective

Make existing Loan and Property reports describe repayment reconciliation states accurately without changing any amount, eligibility, cashflow, tax or source-record rule.

The existing report foundation already provides:

- Australian financial-year selection;
- Loan repayment component summaries;
- Property linked-record cashflow;
- owner-scoped report services;
- formula-safe CSV exports;
- accountant preparation manifests and readmes;
- neutral record-keeping wording;
- the accepted Loan no-double-count rule.

This slice corrects one presentation and aggregate-quality gap: `NEEDS_REVIEW` and `UNMATCHED` were shown together in the Loan report and were counted together in the Property report.

## Current-state finding

`SafeLoanRepayment.reconciliationStatus` already distinguishes:

- `LINKED` — an accepted everyday Transaction link exists;
- `NEEDS_REVIEW` — the current reconciliation state requires user review;
- `UNMATCHED` — no accepted everyday Transaction link is recorded.

Before this change:

- the Loan report displayed `needsReviewCount + unmatchedCount` as one `Needs review` value;
- the Property report incremented `needsReviewCount` for every state other than `LINKED`.

No record or amount was lost, but the presentation obscured whether a repayment was explicitly in a review state or simply had no accepted match.

## Delivered changes

### Property report service

`src/server/property-financial-reporting.ts` now:

- adds `unmatchedCount` to `PropertyLoanComponentSummary`;
- initializes all three reconciliation counts explicitly;
- increments `matchedCount` only for `LINKED`;
- increments `needsReviewCount` only for `NEEDS_REVIEW`;
- increments `unmatchedCount` for `UNMATCHED`;
- leaves component totals, period eligibility, Property/Loan ownership and cashflow derivation unchanged.

### Property report screen

`app/reports/properties/page.tsx` now:

- presents matched, needs-review and unmatched counts separately;
- explains that unmatched means no accepted everyday cashflow link is recorded;
- states that unmatched status does not change component totals or create another cashflow record;
- retains the separate Property linked-record cashflow and Loan component presentation;
- adds consistent visible keyboard-focus treatment to report controls and links.

### Loan report screen

`app/reports/loans/page.tsx` now:

- presents `Matched`, `Needs review` and `Unmatched` as separate values;
- no longer sums needs-review and unmatched records into one label;
- explains the unmatched state without implying an error, missing component or tax conclusion;
- retains all recorded principal, interest, fee, repayment and balance totals;
- adds consistent visible keyboard-focus treatment.

## Automated evidence

Updated suites:

- `tests/server/property-financial-reporting.test.ts`;
- `tests/phase-8-property-reporting-ui.test.ts`;
- `tests/phase-8-loan-reporting-ui.test.ts`.

New consolidated guard:

- `tests/phase-c4-report-reconciliation-transparency.test.ts`.

The tests prove:

1. matched, needs-review and unmatched repayment counts remain distinct;
2. other-Property and out-of-period repayments remain excluded;
3. component totals remain integer-cent exact;
4. Property cashflow remains unchanged when Loan component rows are counted;
5. the Loan UI no longer combines needs-review and unmatched counts;
6. both reports explain unmatched status consistently;
7. no guarded schema, provider, Production, document, AI or Apple capability is introduced;
8. neutral preparation and no-tax-advice wording remains present;
9. report controls retain visible focus treatment.

## Financial integrity

No financial formula changed.

The slice preserves:

- integer cents as the calculation source;
- Australian financial years from 1 July to 30 June;
- owned active everyday Transactions as the sole cashflow records;
- eligible split children replacing counted split parents;
- signed direction and transfer precedence;
- LoanRepayment as an analytical component record only;
- no second cashflow amount from a reconciled LoanRepayment;
- no inferred principal, interest, fee or balance component;
- no changed refund, allocation, budget or report-total treatment;
- no Property valuation, equity, yield or Loan forecast.

Reconciliation-status counts describe existing records. They do not affect report inclusion or monetary totals.

## Privacy and ownership

No new data is stored or returned.

The existing report services continue to authenticate and reuse owner-scoped Loan, repayment, Property and transaction services.

This slice does not expose or expand use of:

- raw CSV files or rows;
- filenames;
- raw bank narration;
- BSB, account, card, customer or Loan references;
- exact Property addresses;
- provider payloads;
- private audit metadata;
- secrets or environment values.

## Tax and professional-review boundary

The wording remains organisational and reconciliation-focused.

The screens continue to state that they:

- are preparation reports;
- organise recorded data;
- do not determine deductibility;
- do not prepare a tax return;
- do not provide tax or financial advice.

This slice does not implement or approve:

- deductible or claimable classifications;
- ownership shares;
- mixed-use or mixed-purpose allocation;
- depreciation or capital works calculations;
- evidence-needed persisted states;
- tax-return or ATO integration;
- professionally finalised report terminology.

Qualified Australian tax/accounting review remains required before tax-sensitive finalisation.

## Schema, provider and environment impact

No change to:

- Prisma schema;
- migration files or database state;
- API routes;
- packages or lockfile;
- workflow configuration;
- Vercel, Neon or Clerk environment settings;
- Production data or runtime gates;
- external providers;
- documents, storage or OCR;
- Expo, Apple, TestFlight, pricing or real users.

## Known limitations

- Report terminology still requires professional review before release finalisation.
- Complete Property metadata remains behind minimisation and material-schema decisions.
- Named lender coverage remains behind exact synthetic-format evidence.
- Document evidence files remain behind secure storage and provider gates.
- Accountant collaboration remains behind the activation and invitation-provider gates.
- The separate Import Review `reviewRows ?? []` memoisation warning remains outside this report-only slice.

## Remaining repository gates

- exact-head tests, TypeScript, lint and optimized build;
- exact-head Vercel Preview deployment;
- no unresolved review threads;
- authenticated synthetic browser review for the broader stacked application;
- executable GitHub Actions after eventual retargeting to `main`;
- ordered merge of PRs #231 onward;
- professional review before tax-sensitive wording is finalised;
- explicit approval before any material schema, Production, provider or Apple action.

## Next action

After exact-head verification, continue C4 with another no-schema report-quality item whose formulas are already frozen, or prepare the minimum-Property-metadata and professional-review decision package without implementing schema or tax-sensitive behaviour.
