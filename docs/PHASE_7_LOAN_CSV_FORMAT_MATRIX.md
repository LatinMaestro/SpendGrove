# Phase 7 Loan CSV Format Matrix

Status date: 17 July 2026  
Status: Phase 7 Milestone 7.2 contract; no new lender profile is claimed

## Objective

Make loan CSV support truthful, predictable and extensible without asking users to understand a lender-specific parser. SpendGrove currently supports two reviewed structural modes. Named lender support requires separate safe format evidence.

## Current repository truth

Loan CSV review is browser-local and implemented through the generic `lib/loan-csv-review` domain.

| Mode | Current status | Required structure | Optional structure | Safe behaviour |
|---|---|---|---|---|
| Repayment breakdown / `COMPONENT_COLUMNS` | Implemented and tested | date plus at least one total payment, principal, interest or fees field | balance after | reviewed structured components; no raw event text retained |
| Loan ledger / `ROW_EVENT_LEDGER` | Implemented and tested | date, signed event amount and event type | balance after | deterministic event classification and safe same-date grouping |

These are structural modes, not named lender profiles.

## Accepted component rules

- Money remains integer cents.
- Component-column rows may contain total repayment, principal, interest, fees and balance after.
- A row with only a meaningful component may remain reviewable without inventing a total repayment.
- The accepted component reconciliation tolerance is two cents.
- Components that exceed or fail to reconcile beyond tolerance require review.
- Empty component fields are not invented.
- LoanRepayment remains an analytical breakdown; the reconciled everyday transaction remains the only cashflow record.

## Accepted row-event rules

The current deterministic classifications are:

- repayment;
- interest;
- fee;
- loan advance;
- adjustment;
- unknown.

Same-date repayment, interest and fee rows may be grouped only under the accepted existing rules. Multiple repayment rows, adjustments, advances and unknown events remain conservative review cases. Raw event text is not returned to the user-facing review model.

No classification threshold or no-double-count rule changes in this milestone.

## Mapping and privacy

- Private account, loan reference and identifier columns are locked out of both modes.
- Raw CSV content and original filename remain browser-local and are not committed.
- Server commits receive only reviewed structured repayment values.
- The user selects the owning active Loan Account before review.
- Optional Property context uses a safe nickname and never an exact address.
- No tax or deductibility conclusion is inferred from a lender format.

## Duplicate and reconciliation boundaries

Loan import duplicate checks remain separate from parser recognition. A likely duplicate is excluded by default and requires the existing visible Save anyway confirmation.

Repayment reconciliation remains governed by the accepted exact amount/date/ownership/ambiguity rules. Adding a lender profile must not alter reconciliation confidence or create another cashflow record.

## Named lender evidence

A lender may be named as supported only when:

1. the exact export layout is established safely;
2. a wholly synthetic fixture is created;
3. all component and direction semantics are documented;
4. private fields are identified and excluded;
5. positive and false-profile tests pass;
6. ambiguous events remain reviewable;
7. existing generic modes continue to work.

Bank everyday-account support does not imply loan-format support.

## Current lender register

| Lender/profile | Current state | Reason |
|---|---|---|
| Generic component-column layout | Confirmed structural mode | Synthetic `home_loan_synthetic.csv` and regression tests |
| Generic row-event ledger | Confirmed structural mode | Synthetic inline ledgers and regression tests |
| Named home-loan lenders | Evidence-blocked | No safe exact lender layout register exists |
| Named personal-loan lenders | Evidence-blocked | No safe exact lender layout register exists |

## Next PR sequence

1. **7.2A — this matrix and contract.**
2. **7.2B — typed structural-mode registry and Help guidance**, no schema and no named lender claim.
3. **7.2C+ — evidenced lender batches** only when exact safe format truth exists.
4. **7.2 QA — format matrix, privacy, duplicate and reconciliation non-regression.**

## Schema assessment

No schema change is required for the structural-mode registry, Help guidance or parser fixtures.

A future format that needs a genuinely new durable repayment field must stop for an exact additive schema, export/deletion, ownership, privacy and migration assessment. The unresolved isolated Preview database gate still applies.

## Tests required per lender profile

- exact detection and false detection;
- component or event mapping;
- signed amount semantics;
- Australian dates;
- privacy-field exclusion;
- safe grouping and ambiguity;
- two-cent reconciliation boundary;
- duplicate review;
- owner-scoped Loan Account commit;
- both repayment reconciliation import orders;
- no duplicate cashflow;
- no raw event text or filename exposure;
- mobile and desktop mapping/review.

## Stop conditions

Stop before:

- naming a lender without safe layout evidence;
- changing component tolerance;
- changing event classification, duplicate or reconciliation rules;
- new durable fields without an exact schema gate;
- Preview or Production migration;
- provider/package/secret/environment changes;
- tax treatment, AI, Basiq or external document parsing.

## Exit criteria

Every named lender support claim has safe synthetic evidence; unknown lender exports remain usable through the generic modes where structurally compatible; privacy, duplicate and no-double-count rules reconcile across every supported format.
