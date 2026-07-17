# Phase 8 Financial and Reporting Contract

Date: 17 July 2026  
Status: controlling contract and stop-gate definition; tax-sensitive implementation blocked pending professional review

## Objective

Complete Loan, Property, Australian financial-year and accountant-ready reporting while preserving a simple linked-record workflow, exact reconciliation and the no-tax-advice boundary.

## User value

Users should be able to understand and export the records they have linked, reconcile each total to its source transactions, and give an accountant a clear preparation pack without SpendGrove deciding tax treatment.

## In scope

- current Loan and Property source-of-truth completion;
- additional lender formats only with safe exact evidence;
- transparent FY/period reports from existing records;
- loan principal/interest/fee summaries from persisted LoanRepayment components;
- category and cashflow reports using existing canonical eligibility;
- export reconciliation and manifest design;
- evidence-needed lists without storing files until Phase 11;
- synthetic reconciliation fixtures and QA.

## Explicitly excluded until separate gates pass

- automatic deductibility or deductible percentages;
- tax-return figures, lodgement or ATO integration;
- ownership-share allocation;
- mixed-use or mixed-purpose allocation;
- depreciation/capital works calculations;
- Property profit, yield, equity or valuation;
- mandatory report-only classification;
- accountant login or shared access;
- document storage/OCR;
- Production migration or data rewrite;
- named lender claims without fixtures.

## Source-of-truth hierarchy

1. Owned active everyday Transactions provide cashflow.
2. Eligible split children replace counted split parents.
3. PropertyTransactionLink provides explicit Property context.
4. LoanReconciliationLink plus the Loan Account's Property provides Loan repayment context.
5. LoanRepayment provides analytical principal/interest/fee/balance components only.
6. Category and user-controlled record facts describe records but never reverse signed direction.
7. Reports derive from current source records unless a later approved reproducible snapshot model exists.

## No-double-count rules

- A reconciled everyday transaction appears once in cashflow.
- Its LoanRepayment components may explain the same payment but are not added to cashflow totals.
- A transaction connected through both manual Property link and Loan context remains one report row.
- Split parents are excluded when eligible children are counted.
- Transfers may appear only as clearly labelled context and never as income/expense totals.
- Deleted/inactive/cross-user records are excluded.
- Every summary and export must reconcile to the same eligible record IDs.

## Financial-year and money rules

- Australian financial year ending YYYY is 1 July YYYY-1 through 30 June YYYY, end-exclusive at 1 July YYYY.
- Store and calculate integer cents.
- Format AUD only at UI/export boundaries.
- Currency amounts, not rounded percentages, are authoritative.
- Positive refunds retain the accepted Money in treatment and do not retroactively reduce expense categories.
- No new allocation, refund or forecast formula is introduced.

## Base Property report

The base report includes every eligible current linked record without requiring a separate classification. It may show:

- Property safe nickname;
- FY;
- date;
- Money in/Money out/Transfer context;
- signed amount;
- category;
- connection source;
- concise record-keeping notice.

Dormant classification state must not exclude an otherwise valid base record.

## Loan summaries

A no-schema Loan summary may derive, per owned Loan and selected period:

- total repayments from LoanRepayment totalPaymentCents;
- principal total where present;
- interest total where present;
- fee total where present;
- count with incomplete components;
- latest available balance-after and date.

It must not:

- add those totals to everyday cashflow;
- infer missing components;
- treat principal/interest as deductible;
- forecast balances;
- combine different Loans without preserving Loan identity.

## Accountant-ready pack proposal

A future selected-period pack should contain:

1. manifest with generation time, period, safe Property/Loan nicknames and file list;
2. Property linked-record CSV;
3. Loan component summary CSV;
4. category/cashflow report CSV;
5. reconciliation summary explaining source counts and excluded records;
6. evidence-needed checklist referencing records, not files, until Phase 11;
7. concise disclaimer.

A reproducible snapshot, allocation or persisted pack status requires a later schema contract.

## Wording

Allowed:

- Record keeping
- Preparation report
- Linked record
- Money in / Money out
- Loan repayment components
- Needs review
- Evidence may be needed
- Ask your registered tax agent or accountant

Forbidden without professional approval:

- Deductible
- Claimable
- ATO-ready
- Tax saving
- Tax due/refund
- Eligible deduction
- Investment return/profit
- Guaranteed reconciliation to a tax return

## Privacy

Reports/components receive only owned safe record fields. Do not include raw CSV rows, raw narration, filenames, account/BSB/card/customer references, exact Property addresses, provider secrets or private audit metadata. Export routes must remain authenticated and formula-injection safe.

## Proposed PR sequence

1. **8.0A — Current-state audit and contract** (this documentation).
2. **8.0B — Professional review/operator checklist**: exact terminology, fields, disclaimer and business facts; no code.
3. **8.1A — Loan/Property completeness schema proposal**, only if approved facts cannot use current models.
4. **8.1B — Unexecuted additive schema/migration files**, then stop for isolated Preview approval.
5. **8.2 — Optional user-controlled preparation flags**, only after professional/client approval and migration.
6. **8.3A — No-schema report aggregation helpers and synthetic reconciliation tests**.
7. **8.3B — Advanced report/export UI**.
8. **8.4 — Accountant-ready pack and manifest**, excluding document files and account access.
9. **8.5 — Reconciliation, privacy, accessibility and deferred-client QA**.

8.3A may proceed before schema only for formulas explicitly frozen in this contract and confirmed not to be tax-sensitive. All tax-sensitive implementation remains blocked.

## Professional review checklist

A qualified Australian tax/accounting reviewer must confirm:

- report and disclaimer terminology;
- whether proposed fields are useful and non-misleading;
- treatment/label of gross rent, refunds/rebates and Loan components;
- whether ownership/mixed-use/mixed-purpose facts are required for the intended pack;
- evidence-needed labels and retention wording;
- clear separation between records and tax conclusions.

Legal/privacy review must separately confirm retention and document/evidence disclosures when Phase 11 begins.

## Mandatory stops

Stop before:

- any schema or migration file;
- any Preview migration until isolated mapping is proven;
- any Production migration;
- new allocation/refund/deductibility formula;
- reactivating classification as mandatory;
- changing report/export source records or columns without an exact reviewed contract;
- storing addresses, ownership shares, tax facts or evidence documents;
- external accountant access;
- named lender claim without safe fixtures;
- package/provider/secret/environment change;
- Production data access/backfill;
- tax advice, ATO integration, Property valuation/equity/yield or Loan forecasting.

## Exit criteria

Phase 8 can close only when:

- professional terminology/report review is recorded;
- every selected report reconciles to exact source IDs and integer-cent totals;
- no duplicate Loan cashflow exists;
- exports are authenticated, owned, safe and formula-injection protected;
- evidence lists and pack manifests are complete;
- all required Preview migrations are safely verified;
- no Production migration occurs without a separate operator approval;
- privacy/accessibility/regression evidence is green;
- consolidated client acceptance is received.

No Phase 8 implementation is accepted or closed by this contract.
