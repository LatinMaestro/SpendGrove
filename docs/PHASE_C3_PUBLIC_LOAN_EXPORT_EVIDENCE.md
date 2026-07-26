# Phase C3 Public Australian Loan Export Evidence

Prepared: 26 July 2026  
Status: official-public-evidence register only; no named lender parser is approved  
Master-plan alignment: Phase C3 — Loan and lender format coverage  
Evidence boundary: official provider material only; no customer file, filename, account identifier, transaction value or private statement was used

## Purpose

Determine which Australian lenders publicly document downloadable Loan account transaction histories or statements, and distinguish that availability from the exact structure needed for a SpendGrove named Loan parser.

SpendGrove already supports two generic reviewed structures:

- `COMPONENT_COLUMNS` — date plus repayment/principal/interest/fee components;
- `ROW_EVENT_LEDGER` — date, signed event amount and event type.

Public evidence generally confirms downloadable transaction ledgers, not a lender-provided principal/interest/fee component CSV. Therefore most prospective lender profiles remain candidates for `ROW_EVENT_LEDGER`, subject to exact synthetic format evidence and event-semantics testing.

## Evidence status codes

- `LOAN_CSV_EXPLICIT` — official material explicitly supports CSV transaction export for Loan/business-loan accounts.
- `ACCOUNT_EXPORT_LIKELY_LOAN_ELIGIBLE` — account transaction export and online Loan access are separately documented, but Loan CSV eligibility is not explicit in one source.
- `LOAN_STATEMENT_CSV_UNCONFIRMED` — Loan statements/transactions are available, but CSV format is not confirmed for the Loan product.
- `PDF_ONLY_OR_UNCLEAR` — public material establishes statements or transaction visibility but not a usable CSV export.
- `PUBLIC_EVIDENCE_NOT_CONFIRMED` — sufficient official evidence was not located; this is not a claim that export is impossible.

## Current official evidence matrix

| Lender / product family | Public evidence | Status | SpendGrove implication |
|---|---|---|---|
| CommBank / NetBank personal Loans | NetBank provides Loan statements and transaction summaries; public personal support reviewed here does not explicitly confirm a Loan CSV download. CommBiz supports account CSV exports, but business functionality cannot establish the personal Loan format. | `LOAN_STATEMENT_CSV_UNCONFIRMED` | Keep named Loan support blocked. Do not reuse the confirmed CommBank everyday profile for Loans. Obtain current synthetic NetBank Loan export structure or confirm PDF-only limitation. |
| ANZ home Loans | ANZ's Loan account page explicitly supports viewing, searching and downloading Loan transactions. ANZ Internet Banking also supports CSV transaction downloads for eligible open accounts. | `ACCOUNT_EXPORT_LIKELY_LOAN_ELIGIBLE` | Strong Loan ledger candidate. Exact Loan-account CSV headers, date format, signed direction, interest/fee descriptions and balance fields remain required. |
| NAB home/personal Loans | NAB Internet Banking exports a chosen account's transaction history as a spreadsheet/QIF/PDF. Public guidance reviewed here does not explicitly list Loan-account CSV eligibility or component detail. | `ACCOUNT_EXPORT_LIKELY_LOAN_ELIGIBLE` | Treat as prospective row-event ledger only. Obtain exact synthetic Loan export and identify interest, fee, repayment, advance and adjustment descriptions. |
| Westpac home and business Loans | Westpac explicitly states business Loan transactions can be exported as detailed transaction history and imported to accounting software. Personal and business users can export selected account transaction lists in CSV/QBO/QIF/OFX; eligible closed home-loan statements are available. | `LOAN_CSV_EXPLICIT` for business Loans; personal eligibility still needs exact evidence | Separate business-Loan and personal-home-Loan versions. Do not reuse the everyday Westpac profile until exact Loan headers/events are verified. |
| Macquarie home Loans | Macquarie Online Banking includes home Loans and offset accounts. General account transaction history can be downloaded as CSV/QIF. Public material reviewed here does not show an exact home-Loan CSV or component breakdown. | `ACCOUNT_EXPORT_LIKELY_LOAN_ELIGIBLE` | Strong row-event-ledger candidate. Exact home-Loan event labels, signs, processing dates, offset treatment and split/facility variants remain required. |
| ING home Loans | ING home-Loan statements are available for up to seven years. ING states CSV statements require website Online Banking, but the reviewed pages do not explicitly confirm CSV for the home-Loan statement type. | `LOAN_STATEMENT_CSV_UNCONFIRMED` | Obtain a wholly synthetic current home-Loan statement structure and confirm whether CSV is offered for that product. Do not infer from everyday account statements. |
| Bankwest home Loans | Bankwest app/Online Banking supports tracking and managing home Loans and repayments. This review did not confirm a public customer CSV transaction export for the Loan account. | `PUBLIC_EVIDENCE_NOT_CONFIRMED` | Keep generic-only. Do not infer CommBank compatibility. |
| Suncorp Bank Loans | Suncorp states Internet Banking can download transaction information for any account, depending on account type, in CSV/OFX/QIF/ASCII. Public material does not publish a Loan-specific layout. | `ACCOUNT_EXPORT_LIKELY_LOAN_ELIGIBLE` | Prospective row-event ledger. Exact Loan eligibility, headers, selected date format, event names and balances remain required. |
| Bendigo Bank home Loans | Bendigo e-banking explicitly displays home Loan transaction activity and permits transaction downloads from a selected account in Standard CSV or Extended CSV. | `ACCOUNT_EXPORT_LIKELY_LOAN_ELIGIBLE` | High-value Loan evidence candidate. Standard and Extended formats must be evidenced separately; confirm Loan events and signs, not merely everyday transaction headers. |
| Adelaide Bank home Loans | Public material reviewed here did not establish a current everyday Loan transaction CSV. DocSend exports relate to submitted-document history rather than Loan-account events. | `PUBLIC_EVIDENCE_NOT_CONFIRMED` | Keep generic-only and separate from Bendigo. |
| BOQ Loans | BOQ says Internet Banking transaction history search covers registered non-credit-card accounts and explicitly discusses Loan events such as fee capitalisation. Search results can be exported to external formats. | `LOAN_CSV_EXPLICIT` at capability level | Strong row-event-ledger candidate because official material describes Loan-specific event semantics. Exact export format, headers, event labels and signed amounts remain required. |
| ubank current home Loans | Current ubank public statement guidance confirms CSV/PDF for Spend, Bills and Save accounts, not home Loans. Legacy UHomeLoan tooling provides recent transactions and downloadable statements but the public page does not specify CSV. | `LOAN_STATEMENT_CSV_UNCONFIRMED` | Treat current and legacy ubank Loan platforms as separate evidence targets. Do not reuse current everyday-account CSV layout. |
| Great Southern Bank home/personal/business Loans | Great Southern Online Banking supports account transaction export, including CSV, and Open Banking covers home, personal and business Loans. Its help shows Loan accounts in Online Banking, but a Loan-specific CSV layout is not published. | `ACCOUNT_EXPORT_LIKELY_LOAN_ELIGIBLE` | Prospective row-event-ledger candidate. Verify exact Loan account export eligibility, debit/credit layout, running balance and redraw/advance event treatment. |
| Heritage / People's Choice legacy Loans | Both brands are transitioning to People First Bank. Current legacy/current Loan export structures were not established in this review. | `PUBLIC_EVIDENCE_NOT_CONFIRMED` / transitioning | Evidence historical and current People First Loan platforms separately. Do not silently alias legacy files. |
| People First Bank Loans | Current platform transition is ongoing; a current Loan CSV structure was not established. | `PUBLIC_EVIDENCE_NOT_CONFIRMED` | Recheck after current transaction-history CSV capability is released and platform migration stabilises. |

## Official source register

Accessed 26 July 2026.

### CommBank

- NetBank account statements and transaction summaries: https://www.commbank.com.au/support.digital-banking.online-statements.html
- CommBiz CSV account transaction export, reviewed only as business capability evidence: https://www.commbank.com.au/support.business.commbiz.export-transactions.html

### ANZ

- Manage home Loan account, including view/search/download transactions: https://www.anz.com.au/support/loans/manage-your-home-loan/
- CSV-capable transaction download for eligible open accounts: https://www.anz.com.au/support/online-banking/spending-savings/statements/

### NAB

- Chosen-account transaction history export as spreadsheet/QIF/PDF: https://www.nab.com.au/personal/online-banking/nab-internet-banking/transaction-history
- Recent account transaction export guidance: https://www.nab.com.au/help-support/personal-banking/manage-online-banking/download-statements-letters

### Westpac

- Business Loan accounts can export detailed transaction history for accounting-software import: https://www.westpac.com.au/business-banking/online-banking/bank-feeds/
- Personal/business account transaction export in CSV/QBO/QIF/OFX: https://www.westpac.com.au/business-banking/online-banking/support-faqs/export-files/
- Eligible closed home-Loan statements: https://www.westpac.com.au/personal-banking/online-banking/making-the-most/closed-account-statements/

### Macquarie

- Macquarie Online Banking includes home Loans and offset accounts: https://www.macquarie.com.au/help/personal/accessing-online-and-mobile-banking/setup-online-banking/what-you-can-access-in-Macquarie-Online-Banking.html
- Chosen-account transaction history download as CSV/QIF: https://www.macquarie.com.au/help/personal/statements-and-reports/find-a-statement-or-report/viewing-and-downloading-past-transactions.html
- Home Loan account breakdown and split/offset context: https://www.macquarie.com.au/help/personal/home-loans/learning-about-your-home-loan/viewing-your-home-loan-structure.html

### ING

- Home Loan statements and account management: https://www.ing.com.au/home-loans/manage-my-loan.html
- Website CSV statement guidance: https://www.ing.com.au/4fkjhauhsiygsuiy4467shjtjsaah9898.html

### Bankwest

- Home Loan repayment management: https://www.bankwest.com.au/support/home-loans/repayments

### Suncorp Bank

- Account transaction information downloadable as CSV/OFX/QIF/ASCII: https://www.suncorpbank.com.au/help-support/business-banking/online.html
- Transaction download procedure: https://www.suncorpbank.com.au/help-support/faqs/business-banking/internet-banking/transaction-information-for-accounting-software.html

### Bendigo Bank

- Home Loan activity and selected-account Standard/Extended CSV downloads: https://www.bendigobank.com.au/support/e-banking/accounts/

### BOQ

- Loan-specific fee-capitalisation transaction semantics and exportable account history: https://www.boq.com.au/personal/help-and-support/faqs/ob-faqs-and-support/faq-transaction-history
- Internet Banking balance/transaction search and export: https://www.boq.com.au/personal/online-banking/internet-banking

### ubank

- Current everyday account CSV statements: https://www.ubank.com.au/help/current/app-and-online-banking/statements-app/how-can-i-get-a-statement-for-my-account
- Legacy UHomeLoan transaction/statement access: https://www.ubank.com.au/original-products/uhomeloan/manage

### Great Southern Bank

- Account transaction export in CSV/PDF/bar-delimited/QIF: https://www.greatsouthernbank.com.au/help-and-contact/support/faqs/online-banking
- Home Loan account presence and redraw workflow: https://www.greatsouthernbank.com.au/help-and-contact/banking-from-home/redraw-funds-from-your-loan
- Open Banking product coverage includes home/personal/business Loans: https://www.greatsouthernbank.com.au/open-banking

## Structural conclusion

Public lender evidence currently points primarily to **row-event ledgers**, not repayment-component reports.

A named lender profile must not invent:

- principal component;
- interest component;
- fee component;
- repayment total;
- balance-after value;
- grouping relationship.

When a lender CSV contains event rows only, SpendGrove must classify conservatively under the existing `ROW_EVENT_LEDGER` rules. Principal remains derived only through accepted reconciliation or explicit component data; it is never assumed deductible.

## Highest-value next exact structures

1. **BOQ Loan transaction export** — official Loan-specific fee-capitalisation semantics are documented.
2. **Bendigo home Loan Standard CSV** — home Loan activity plus selected-account CSV availability is documented.
3. **ANZ home Loan transaction download** — Loan download is explicit; CSV account export is established.
4. **Westpac business Loan transaction CSV** — explicit accounting-import use; personal version needs separate evidence.
5. **Macquarie home Loan account CSV** — online product and account download paths are both documented.
6. **Great Southern Loan account CSV** — broad product/transaction export capability is documented.
7. **Suncorp Loan account CSV** — account export capability is documented but exact eligibility/layout remains unknown.
8. **NAB Loan account export** — chosen-account export exists; Loan applicability/layout remains to be verified.
9. **ING home Loan CSV statement** — verify whether home-Loan statements are CSV-capable.

## Required evidence for the first named Loan profile

- current exact header list;
- date/date-time format;
- debit/credit or signed amount semantics;
- event text examples rewritten as wholly synthetic values;
- interest, fee, repayment, advance, redraw and adjustment terminology;
- balance field meaning;
- private identifiers and account-name fields;
- same-day ordering/grouping behaviour;
- wholly synthetic positive and negative fixtures;
- false-profile rejection against everyday account exports;
- two-cent component reconciliation where component fields exist;
- duplicate and no-double-count regression;
- owner-scoped commit, export and deletion evidence.

## No-profile rule

No named lender support claim, parser, fixture or component rule is created by this document. Unknown or unevidenced exports continue through the generic reviewed structures where compatible.

Real Loan statements or CSVs must not be requested through public issues, support channels or documentation. A private-local structural inspection, when approved, must be converted into wholly synthetic fixtures with all filenames, values and identifiers discarded.