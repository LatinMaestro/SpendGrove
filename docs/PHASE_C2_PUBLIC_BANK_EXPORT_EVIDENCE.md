# Phase C2 Public Australian Bank Export Evidence

Prepared: 26 July 2026  
Status: public evidence register only; no new parser profile is approved by this document  
Master-plan alignment: Phase C2 — everyday-bank coverage and C3 — Loan/lender coverage  
Evidence boundary: official provider material only; no customer CSV, filename, account identifier or transaction value was used

## Purpose

Record current official public evidence about whether each generic-only SpendGrove target offers a CSV transaction or statement export, and identify the exact information still required before adding a named parser profile.

An official statement that CSV export exists is not sufficient to create a profile. A named profile still requires exact and current evidence for:

- header names;
- date representation;
- amount direction or debit/credit semantics;
- description/merchant fields;
- private columns;
- product/account variants;
- synthetic fixtures and false-positive tests.

Generic/manual mapping remains the safe fallback until that evidence is complete.

## Evidence status codes

- `AVAILABLE_EXACT_STRUCTURE_PARTIAL` — official provider material documents export and at least part of the column structure, but a synthetic current export is still required.
- `AVAILABLE_LAYOUT_UNKNOWN` — official provider material confirms CSV export but not exact import semantics.
- `PLANNED_NOT_YET_AVAILABLE` — provider says CSV export is planned but not yet available on the current platform.
- `LEGACY_AVAILABLE_TRANSITIONING` — a legacy platform supports CSV but is being retired or migrated.
- `PUBLIC_EVIDENCE_NOT_CONFIRMED` — this review did not locate sufficient official public evidence; this is not a claim that export is impossible.

## Current official evidence matrix

| SpendGrove target | Current public evidence | Status | Profile implication |
|---|---|---|---|
| Macquarie | Macquarie Online Banking allows personal customers to download visible transaction history/search results as CSV or QIF. Macquarie Business Online also produces transaction CSV files and generated CSV statements. | `AVAILABLE_LAYOUT_UNKNOWN` | Personal and business exports may differ. Exact personal headers, timestamp/date representation, direction semantics and account variants remain required. |
| ING | ING states that a CSV statement is available through website Online Banking; the app provides PDF statements. | `AVAILABLE_LAYOUT_UNKNOWN` | Obtain a wholly synthetic current Online Banking CSV statement structure. Confirm whether transaction and credit-card products use different layouts. |
| Bankwest | Official public pages confirm access to transaction history through app/online banking and CDR data sharing, but this review did not confirm a customer CSV export layout or current export instructions. | `PUBLIC_EVIDENCE_NOT_CONFIRMED` | Keep generic-only. Do not infer CommBank layout despite group ownership. Obtain official export instructions or a private-local structural inspection converted to synthetic fixtures. |
| St.George | No separate official everyday-account CSV instructions were confirmed in this review. Merchant/PayWay CSV material is not evidence for consumer transaction exports. | `PUBLIC_EVIDENCE_NOT_CONFIRMED` | Keep generic-only and distinct from Westpac. Do not use merchant-settlement formats. |
| BankSA | No separate official everyday-account CSV instructions were confirmed in this review. | `PUBLIC_EVIDENCE_NOT_CONFIRMED` | Keep generic-only and distinct from Westpac/St.George until exact evidence exists. |
| Bank of Melbourne | No separate official everyday-account CSV instructions were confirmed in this review. | `PUBLIC_EVIDENCE_NOT_CONFIRMED` | Keep generic-only and distinct from Westpac/St.George until exact evidence exists. |
| Suncorp Bank | Suncorp Bank states that unprinted transactional data can be exported through Internet Banking in CSV, OFX, QIF or ASCII, with the user selecting a date format and date period. | `AVAILABLE_LAYOUT_UNKNOWN` | Exact selected-date outputs, headers, debit/credit treatment, balance/reference columns and personal/business variants remain required. |
| Bendigo Bank | Bendigo e-banking offers Standard CSV and Extended CSV downloads for up to 18 months. Its transaction view contains name, description/reference, amount and running balance. | `AVAILABLE_EXACT_STRUCTURE_PARTIAL` | Standard and Extended CSV must be separate evidenced versions. Exact headers and direction semantics remain required. Do not assume Adelaide Bank compatibility. |
| Adelaide Bank | This review did not confirm a current everyday-account transaction CSV export. Adelaide Bank DocSend transaction-history exports relate to document submission activity, not bank-account transactions. | `PUBLIC_EVIDENCE_NOT_CONFIRMED` | Keep generic-only. Do not use DocSend export fields as a banking profile and do not infer Bendigo layout. |
| BOQ | BOQ states that Internet Banking transaction history can be exported for manual accounting-package import in `.dat`, `.csv` or `.qif` formats. | `AVAILABLE_LAYOUT_UNKNOWN` | Exact headers, date formats, amount semantics and product variants remain required. Payment-file upload documentation is not transaction-export evidence. |
| ubank | ubank allows account statements to be downloaded as PDF or CSV in the app and Online Banking. | `AVAILABLE_LAYOUT_UNKNOWN` | Confirm statement period, exact headers, direction and whether Spend/Save/Bills/home-loan products differ. |
| Up | Up officially documents CSV export and the fields: Time, BSB/Account Number, Transaction Type, Payee, Description, Category, Tags, Subtotal, Currency, Subtotal (Transaction Currency), Fee (AUD), Round Up (AUD), Total (AUD), Payment Method and Settled Date. The provider describes Total (AUD) as the total effect on account balance. | `AVAILABLE_EXACT_STRUCTURE_PARTIAL` | Strongest next profile candidate. A current synthetic export must still confirm exact header spelling/casing, timestamp encoding, positive/negative CSV values, quoting of embedded tags and current product variants. BSB/account fields must be private/excluded. |
| Great Southern Bank | Great Southern Bank Online Banking supports PDF, CSV, bar-delimited and QIF transaction exports. Its official help describes detailed transaction listings including debits, credits and a running balance. | `AVAILABLE_EXACT_STRUCTURE_PARTIAL` | Confirm whether CSV uses separate debit/credit columns, exact headers and date format. Business and personal exports may require separate versions. |
| Heritage Bank | Heritage Bank and People's Choice have merged under People First Bank. Current support should be treated as a platform-transition problem, not a stable standalone Heritage layout. | `LEGACY_AVAILABLE_TRANSITIONING` | Preserve historical target/alias only until current People First and any legacy Heritage export structures are separately evidenced. |
| People's Choice | Legacy People's Choice Internet Banking supports XLS, CSV, QIF and QFX transaction downloads. People First Bank states the legacy platform will close on 17 September 2026. | `LEGACY_AVAILABLE_TRANSITIONING` | A legacy profile would have limited remaining value unless needed for historical files. Do not treat it as the new People First format. |
| People First Bank | Current People First Online Banking states CSV transaction-history download is planned by the end of August 2026. | `PLANNED_NOT_YET_AVAILABLE` | Add a new current target/evidence entry after the feature is released and a synthetic current export is available. Do not create a profile from planned UI wording. |

## Official source register

Accessed 26 July 2026.

### Macquarie

- Personal transaction-history download: https://www.macquarie.com.au/help/personal/statements-and-reports/find-a-statement-or-report/viewing-and-downloading-past-transactions.html
- Personal transaction search CSV/QIF: https://www.macquarie.com.au/help/personal/payments-transfers-and-deposits/transaction-information/searching-your-transactions.html
- Business transaction CSV/QIF: https://www.macquarie.com.au/help/business/manage-your-accounts/statements-and-transactions/export-transactions-as-csv-or-qif-files.html
- Generated business CSV statements: https://www.macquarie.com.au/help/business/manage-your-accounts/statements-and-transactions/bank-statements.html

### ING

- ING account and statement FAQ, including website-only CSV statement guidance: https://www.ing.com.au/4fkjhauhsiygsuiy4467shjtjsaah9898.html

### Bankwest

- Transaction-history access and data sharing: https://www.bankwest.com.au/support/open-banking/data-sharing
- Privacy statement describing access to transaction history through app/online banking: https://www.bankwest.com.au/legal-stuff/bankwest-privacy-statement

These sources do not establish an exact current CSV export structure.

### Suncorp Bank

- Internet Banking transactional export formats and procedure: https://www.suncorpbank.com.au/help-support/faqs/business-banking/accounts.html

### Bendigo Bank

- Account activity and Standard/Extended CSV downloads: https://www.bendigobank.com.au/support/e-banking/accounts/

### Adelaide Bank

- DocSend export documentation, reviewed only to exclude it as everyday bank-account evidence: https://docsend.adelaidebank.com.au/static/html/help.html

### BOQ

- Internet Banking and accounting-package transaction-history export capability: https://www.boq.com.au/personal/help-and-support/faqs/ob-faqs-and-support/faq-pfuf

### ubank

- CSV/PDF account statements through app and Online Banking: https://www.ubank.com.au/help/current/app-and-online-banking/statements-app/how-can-i-get-a-statement-for-my-account

### Up

- CSV export instructions and official column definitions: https://up.com.au/blog/csv-custom-savings-viewer/
- Current transaction amount sign examples and date-time contract in the official developer API: https://developer.up.com.au/

The API supports confidence about Up's general signed-money domain but does not replace verification of the CSV representation.

### Great Southern Bank

- Online Banking CSV/QIF/PDF/bar-delimited export and transaction detail: https://www.greatsouthernbank.com.au/help-and-contact/support/faqs/online-banking
- Business account CSV/QIF/PDF availability: https://www.greatsouthernbank.com.au/business-banking/business-bank-accounts/everyday-business-account

### People First / People's Choice / Heritage

- Legacy People's Choice CSV and transition date: https://www.peoplefirstbank.com.au/help-and-support/support-topics/legacy-internet-banking-and-app-support
- Current People First planned CSV download: https://www.peoplefirstbank.com.au/help-and-support/faqs/online-banking
- Merger and migration context: https://www.peoplefirstbank.com.au/getstarted

## Evidence conclusions

### Highest-value next synthetic structures

1. **Up current CSV** — official column list exists; verify timestamps, signs, quoting and variants.
2. **Bendigo Standard CSV** — official export variants and visible transaction concepts are documented.
3. **Great Southern CSV** — official export and debit/credit/running-balance concepts are documented.
4. **Suncorp CSV** — official export and user-selected date format are documented.
5. **ING and ubank CSV statements** — official availability is clear, but statement layouts require synthetic confirmation.
6. **BOQ transaction-history CSV** — official availability is clear; exact format remains unknown.
7. **Macquarie personal CSV** — official personal export path is clear; exact layout remains unknown.

### Transition handling

- Add `people-first` to the future target vocabulary rather than silently relabelling historical Heritage or People's Choice files.
- Preserve legacy aliases for historical-file recognition only after exact layouts are evidenced.
- Do not create a current People First profile until the provider's planned CSV download is actually available and verified.
- Recheck People First after 31 August 2026 and legacy People's Choice before/after 17 September 2026.

### No-profile rule

No parser profile, fixture or support claim is created by this evidence register. The next profile PR must contain:

- exact structural evidence;
- wholly synthetic rows;
- date and signed-direction tests;
- privacy-field exclusion;
- header false-positive rejection;
- generic/manual fallback;
- safe public support wording;
- last-verified date and versioning.

## Remaining research gaps

- exact consumer export evidence for Bankwest, St.George, BankSA, Bank of Melbourne and Adelaide Bank;
- exact current layouts for all `AVAILABLE_LAYOUT_UNKNOWN` entries;
- current People First export after planned release;
- Loan/offset/credit-card variants for each provider;
- historical-versus-current file version policy for rebranded or migrated banks.

Real customer CSV files must not be requested through public issues, support channels or documentation. Any private-local structural inspection must be converted into wholly new synthetic fixtures with filenames and values excluded from evidence.