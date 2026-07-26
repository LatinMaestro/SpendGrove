# Phase 7 Loan CSV Format Matrix

Status date: 26 July 2026  
Status: structural support plus current public lender-evidence register; no named lender profile is claimed  
Detailed current evidence: `PHASE_C3_PUBLIC_LOAN_EXPORT_EVIDENCE.md`

## Objective

Make Loan CSV support truthful, predictable and extensible without asking users to understand a lender-specific parser. SpendGrove currently supports two reviewed structural modes. Named lender support requires separate safe exact-format evidence.

## Current repository truth

Loan CSV review is browser-local and implemented through the generic `lib/loan-csv-review` domain.

| Mode | Current status | Required structure | Optional structure | Safe behaviour |
|---|---|---|---|---|
| Repayment breakdown / `COMPONENT_COLUMNS` | Implemented and tested | date plus at least one total payment, principal, interest or fees field | balance after | reviewed structured components; no raw event text retained |
| Loan ledger / `ROW_EVENT_LEDGER` | Implemented and tested | date, signed event amount and event type | balance after | deterministic event classification and safe same-date grouping |

These are structural modes, not named lender profiles.

## Public-evidence conclusion

Current official lender material predominantly documents downloadable account transaction histories rather than principal/interest/fee component CSV reports.

Therefore:

- prospective named lender profiles should default to evidence assessment for `ROW_EVENT_LEDGER`;
- `COMPONENT_COLUMNS` must be used only where exact lender fields explicitly contain those components;
- the parser must never infer a component from a general event amount;
- everyday-account profile support does not imply Loan support;
- a lender's business and personal Loan exports may require separate versions;
- offset, split/facility, redraw and legacy-platform exports may require separate versions.

## Accepted component rules

- Money remains integer cents.
- Component-column rows may contain total repayment, principal, interest, fees and balance after.
- A row with only a meaningful component may remain reviewable without inventing a total repayment.
- The accepted component reconciliation tolerance is two cents.
- Components that exceed or fail to reconcile beyond tolerance require review.
- Empty component fields are not invented.
- LoanRepayment remains an analytical breakdown; the reconciled everyday transaction remains the only cashflow record.
- Principal never defaults as deductible.

## Accepted row-event rules

The current deterministic classifications are:

- repayment;
- interest;
- fee;
- loan advance;
- adjustment;
- unknown.

Same-date repayment, interest and fee rows may be grouped only under the accepted existing rules. Multiple repayment rows, adjustments, advances, redraws and unknown events remain conservative review cases. Raw event text is not returned to the user-facing review model.

No classification threshold or no-double-count rule changes through lender evidence work.

## Mapping and privacy

- Private account, Loan reference and identifier columns are locked out of both modes.
- Raw CSV content and original filename remain browser-local and are not committed.
- Server commits receive only reviewed structured repayment values.
- The user selects the owning active Loan Account before review.
- Optional Property context uses a safe nickname and never an exact address.
- No tax or deductibility conclusion is inferred from a lender format.
- A public official source is availability evidence only and cannot expose customer data.

## Duplicate and reconciliation boundaries

Loan import duplicate checks remain separate from parser recognition. A likely duplicate is excluded by default and requires the existing visible Save anyway confirmation.

Repayment reconciliation remains governed by the accepted exact amount/date/ownership/ambiguity rules. Adding a lender profile must not alter reconciliation confidence or create another cashflow record.

## Named lender evidence requirements

A lender may be named as supported only when:

1. the exact current export layout is established safely;
2. a wholly synthetic fixture is created;
3. all component and signed-direction semantics are documented;
4. event terminology and ambiguity are documented;
5. private fields are identified and excluded;
6. positive and false-profile tests pass;
7. generic modes continue to work;
8. everyday-account exports from the same institution are rejected when structurally different;
9. business/personal, legacy/current and product variants are versioned separately;
10. duplicate and no-double-count tests pass.

## Current lender evidence register

| Lender/profile | Current state | Public evidence result | Next safe action |
|---|---|---|---|
| Generic component-column layout | Confirmed structural mode | Synthetic `home_loan_synthetic.csv` and regression tests | Maintain tolerance and privacy regression |
| Generic row-event ledger | Confirmed structural mode | Synthetic inline ledgers and regression tests | Maintain classification and ambiguity regression |
| CommBank personal Loans | Evidence-blocked | Loan statements/transaction summaries available; personal Loan CSV not confirmed | Obtain exact synthetic NetBank Loan export or confirm PDF-only boundary |
| ANZ home Loans | Strong candidate | Loan transaction download explicit; account CSV export documented | Obtain exact synthetic Loan CSV and event/sign semantics |
| NAB Loans | Candidate | Chosen-account spreadsheet/QIF/PDF export documented; Loan eligibility/layout not explicit | Obtain exact Loan export structure |
| Westpac business Loans | Strong candidate | Business Loan detailed transaction export explicitly supported | Evidence business Loan CSV; assess personal home Loan separately |
| Macquarie home Loans | Strong candidate | Home Loans/offsets in Online Banking; chosen-account CSV/QIF download documented | Obtain exact Loan CSV and split/offset event semantics |
| ING home Loans | Evidence-blocked | Home Loan statements and general website CSV statements documented; product-specific CSV unconfirmed | Confirm whether home Loan statement CSV exists and obtain exact structure |
| Bankwest home Loans | Evidence-blocked | Online repayment management; public CSV evidence not confirmed | Obtain exact official/private-local structure; do not infer CommBank layout |
| Suncorp Bank Loans | Candidate | Transactions for accounts downloadable as CSV/OFX/QIF/ASCII; exact Loan eligibility/layout unknown | Confirm Loan account eligibility and exact structure |
| Bendigo home Loans | Strong candidate | Home Loan activity and selected-account Standard/Extended CSV documented | Evidence both Loan CSV versions separately |
| Adelaide Bank home Loans | Evidence-blocked | Current Loan transaction CSV not established | Evidence separately from Bendigo |
| BOQ Loans | Strong candidate | Loan event semantics and exportable transaction history documented | Preferred first row-event candidate if exact synthetic export is available |
| ubank current/legacy home Loans | Evidence-blocked | Legacy statements/transactions available; current everyday CSV does not establish Loan CSV | Evidence current and legacy Loan platforms separately |
| Great Southern Loans | Candidate | Account CSV export and Loan account coverage documented; exact Loan CSV unknown | Confirm Loan export eligibility and exact event/balance structure |
| Heritage / People's Choice / People First Loans | Transitioning/evidence-blocked | Platform migration underway; exact Loan formats not established | Preserve legacy/current versions separately and recheck current platform |

## Prioritised exact-format backlog

1. BOQ Loan transaction export.
2. Bendigo home Loan Standard CSV, then Extended CSV.
3. ANZ home Loan transaction export.
4. Westpac business Loan CSV, then personal home Loan evidence.
5. Macquarie home Loan CSV.
6. Great Southern Loan account CSV.
7. Suncorp Loan account CSV.
8. NAB Loan account export.
9. ING home Loan statement CSV eligibility.
10. CommBank personal Loan export.
11. ubank current and legacy Loan formats.
12. Bankwest, Adelaide and People First/legacy formats.

## Next PR sequence

1. **7.2A — matrix and contract** — complete.
2. **7.2B — typed structural-mode registry and truthful Help guidance** — complete.
3. **7.2C — public lender evidence register** — prepared in the current stacked documentation slice.
4. **7.2D+ — evidenced lender batches** — only when exact safe format truth exists.
5. **7.2 QA — format matrix, privacy, duplicate and reconciliation non-regression.**

## Schema assessment

No schema change is required for the structural-mode registry, Help guidance, evidence register or parser fixtures.

A future format that needs a genuinely new durable repayment field must stop for an exact additive schema, export/deletion, ownership, privacy and migration assessment.

## Tests required per lender profile

- exact detection and false detection;
- component or event mapping;
- signed amount semantics;
- Australian dates/date-times;
- privacy-field exclusion;
- safe grouping and ambiguity;
- two-cent reconciliation boundary where applicable;
- duplicate review;
- owner-scoped Loan Account commit;
- both repayment reconciliation import orders;
- no duplicate cashflow;
- no raw event text or filename exposure;
- mobile and desktop mapping/review;
- rejection of incompatible everyday/business/legacy variants.

## Stop conditions

Stop before:

- naming a lender without exact safe layout evidence;
- treating account-export availability as exact profile evidence;
- changing component tolerance;
- changing event classification, duplicate or reconciliation rules;
- inventing principal, interest, fee or repayment components;
- new durable fields without an exact schema gate;
- Preview or Production migration;
- provider/package/secret/environment changes;
- tax treatment, AI, Basiq or external document parsing.

## Exit criteria

Every named lender support claim has safe synthetic evidence; unknown lender exports remain usable through the generic modes where structurally compatible; privacy, duplicate and no-double-count rules reconcile across every supported format.