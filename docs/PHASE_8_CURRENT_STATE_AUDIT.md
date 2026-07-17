# Phase 8 Loans, Properties and Reporting — Current-State Audit

Audit date: 17 July 2026  
Status: repository and specification audit; no implementation or migration

## Classification key

- **Complete:** implemented and technically verified.
- **Partial:** useful foundation exists but the complete-product requirement is not met.
- **Dormant:** schema or code exists but is intentionally absent from the accepted normal workflow.
- **Missing:** no complete implementation.
- **Blocked:** an operator, evidence, schema, professional-review or client decision is required.

## Current source of truth

### Loans

| Capability | Status | Repository truth |
|---|---|---|
| Home and personal Loan Accounts | Complete | Owner-scoped LoanAccount with purpose/type, optional Property, balance/date, archive lifecycle and focused UI. |
| Repayment CSV | Partial | Two generic structural modes are supported; no named lender profile is claimed. |
| Principal, interest, fees and closing balance | Complete for available imported fields | Integer-cent LoanRepayment fields; empty values remain absent. |
| Reconciliation | Complete foundation | Unique accepted automatic/manual matching, reversible unlink and sole-cashflow rule are tested. |
| Advanced loan reports | Missing | No dedicated period interest/fee/principal report suite or accountant export exists. |

### Properties and current reports

| Capability | Status | Repository truth |
|---|---|---|
| Property nickname/usage and Loan link | Complete foundation | Exact addresses are not required or shown. |
| Everyday Property links | Complete | One active owned Property link per transaction; Loan context can also derive records. |
| Financial Year record view | Complete foundation | Australian year is 1 July through 30 June using an ending year. |
| Property CSV | Complete foundation | Current columns are record ID, FY, nickname, date, type, signed AUD, category, connection source and record-keeping notice. |
| Summary | Complete foundation | Money in, money out, Loan-payment cashflow context, transfer context and count; integer-cent overflow checked. |
| Tax-preparation classification | Dormant | PropertyReportReview and classification helpers remain in code/schema, but accepted reporting removed the second report-only classification task from the normal workflow. |
| Accountant-ready pack | Missing | No manifest, reconciliation statement, evidence checklist or multi-file bundle. |
| Documents/evidence | Missing/Phase 11 dependency | No secure document storage or evidence link model. |

## Accepted source-of-truth rules

- include active owned everyday transactions linked manually to the Property;
- also derive eligible Loan repayment cashflow context through an owned active reconciliation path and Loan Account Property;
- include split children and exclude counted split parents;
- the everyday Transaction remains the sole cashflow record;
- do not add LoanRepayment amounts as a second cashflow;
- use integer cents and Australian financial-year boundaries;
- retain signed direction and transfer precedence;
- no automatic deductibility, percentage claim, tax conclusion or advice;
- reporting/export must not require a second classification task merely to include an otherwise eligible linked record.

## Dormant classification finding

The repository still contains `PropertyReportReview`, `PropertyRecordClassification` and classification/suggestion helpers. Historical accepted decisions deliberately removed those controls from the normal report because users already review, categorise and link records.

Phase 8 must not silently reactivate that workflow. Any future record-keeping flag must:

1. solve a specific accountant/report requirement;
2. be user-controlled and optional;
3. never control whether a valid linked record is present in the base report;
4. avoid automatic deductibility;
5. pass external Australian tax/accounting terminology review;
6. have an exact additive schema and Preview migration contract if current fields are insufficient.

## Schema assessment

Current schema can support:

- current Loan/Property correction workflows;
- current FY linked-record view/export;
- no-schema loan component summaries derived from existing repayments;
- no-schema period/category/cashflow reports derived from current eligible transactions, after an exact formula contract.

Likely additive schema is needed for:

- richer Property ownership/acquisition/use-period facts;
- explicit evidence-needed or accountant-note state;
- report-pack manifests/snapshots if packs must be reproducible;
- ownership shares or allocations;
- document evidence references;
- advanced report review lifecycle.

No exact Phase 8 migration is approved. The isolated Preview environment is still unproven, so all schema implementation is blocked even after a model is proposed.

## Financial and privacy risks

- treating a bank cashflow as a deductible expense;
- counting a reconciled LoanRepayment and its everyday transaction twice;
- mixing principal, interest and fees without source evidence;
- confusing cashflow totals with tax-return amounts;
- allocating shared ownership or mixed-purpose loans without an approved rule;
- reactivating dormant classification as a mandatory workflow;
- exposing exact addresses, lender/account references, raw narration or document content;
- creating non-reproducible exports whose totals differ from the on-screen report.

## External guidance reviewed

Accessed 17 July 2026:

- [Residential rental properties](https://www.ato.gov.au/rental), Australian Taxation Office — confirms that rental-property workflows involve record keeping, income and expenses.
- [Rental properties guide 2025](https://www.ato.gov.au/law/view/document?LocID=%22SAV%2FRENTAL%2FATTABLE3%22&PiT=99991231235958), Australian Taxation Office — identifies common rental income/expense record facts and a general five-year retention rule tied to lodgement/disputes.
- [Rental income you must declare](https://www.ato.gov.au/individuals-and-families/investments-and-assets/residential-rental-properties/rental-income-you-must-declare/), Australian Taxation Office — demonstrates that legal ownership and gross-income treatment can matter.

These sources inform the professional-review checklist only. SpendGrove does not interpret them as user-specific tax advice.

## Blockers and decisions

1. Australian tax/accounting professional review of terminology, pack fields and disclaimers.
2. Client decision on whether first release includes ownership shares, acquisition/use periods or mixed-purpose allocations.
3. Safe synthetic lender fixtures for named lender support.
4. Isolated Preview Neon mapping before any new migration.
5. Phase 11 document model before evidence files can be included.
6. Phase 10 permissions before accountant login/access can exist.

## Safe next work

A no-schema reporting formula contract and synthetic reconciliation fixtures may be prepared. Tax-sensitive labels, allocations, new persisted review state and accountant-ready pack implementation must wait for the gates above.
