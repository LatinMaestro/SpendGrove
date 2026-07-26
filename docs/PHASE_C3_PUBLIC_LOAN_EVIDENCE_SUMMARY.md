# Phase C3 Public Loan Evidence Summary

Date: 26 July 2026  
Status: official-public-evidence review complete for this slice; named lender parsers remain blocked by exact synthetic structures  
Master-plan alignment: Phase C3 Loan and lender coverage

## Objective

Advance Loan import coverage without requesting or using real Loan statements or CSV files, while preserving SpendGrove's accepted repayment-analysis and no-double-count rules.

## Delivered

- Added `PHASE_C3_PUBLIC_LOAN_EXPORT_EVIDENCE.md` with official lender capability evidence and source URLs.
- Refreshed `PHASE_7_LOAN_CSV_FORMAT_MATRIX.md` to 26 July 2026.
- Separated downloadable Loan account transaction capability from exact parser readiness.
- Confirmed that current public evidence primarily supports row-event ledger candidates rather than principal/interest/fee component reports.
- Prioritised BOQ, Bendigo, ANZ, Westpac business Loans and Macquarie for exact synthetic format evidence.
- Recorded separate personal/business, current/legacy, offset/split and brand-transition versioning requirements.

## Current structural support truth

SpendGrove continues to support only two generic reviewed Loan structures:

- `COMPONENT_COLUMNS`;
- `ROW_EVENT_LEDGER`.

No named lender profile was added.

## Strongest public-evidence candidates

### BOQ

Official BOQ material describes Loan-specific transaction events, including fee capitalisation, and confirms transaction-history export. This makes BOQ a high-value row-event-ledger candidate, but exact headers, file type, signs and event values remain required.

### Bendigo Bank

Official Bendigo material shows home Loan activity in e-banking and selected-account Standard/Extended CSV downloads. Standard and Extended Loan exports must be evidenced independently.

### ANZ

Official ANZ material explicitly supports viewing, searching and downloading Loan transactions, while account CSV download is separately established. Exact Loan CSV eligibility/layout remains to be confirmed with a synthetic current export.

### Westpac

Westpac explicitly supports detailed transaction-history export for business Loan accounts for accounting-software import. Personal home Loan exports require separate evidence.

### Macquarie

Macquarie home Loans and offsets are available in Online Banking, and chosen-account transaction histories can be exported as CSV/QIF. Exact Loan event and facility/split semantics remain unknown.

## Financial integrity retained

No rule changes.

- integer cents remain mandatory;
- components are never invented;
- two-cent component tolerance remains unchanged;
- row events remain conservative and reviewable;
- principal does not default as deductible;
- LoanRepayment remains analytical;
- the reconciled everyday Transaction remains the sole cashflow record;
- duplicate and repayment-reconciliation thresholds remain separate from parser recognition.

## Privacy and safety

- official public provider sources only;
- no real statement, CSV, filename, account/Loan number, event text, amount or balance entered the repository;
- no provider login or credential;
- no parser, fixture, schema, migration, package, workflow, secret or environment change;
- no Production, Apple, TestFlight or real-user action.

## Remaining blockers

- current exact synthetic Loan export structures;
- Loan-specific event text rewritten into wholly synthetic fixtures;
- signs, dates, balances and same-day ordering;
- product variants including personal/business, offset, split, redraw and legacy/current platforms;
- authenticated Preview activation QA and executable GitHub Actions capacity.

## Next safe action

Implement the first named Loan parser only after a current exact wholly synthetic structure is available. BOQ is the preferred row-event candidate; Bendigo is the preferred multi-version candidate.

This research does not claim named lender support or change Production, TestFlight or App Store readiness.