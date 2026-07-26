# Phase 7 Australian Bank Format Register

Status date: 26 July 2026  
Source: SpendGrove v2.0.1 Master Specification section 17.1, current repository parser definitions and `PHASE_C2_PUBLIC_BANK_EXPORT_EVIDENCE.md`

## Current support statement

SpendGrove currently contains named everyday-transaction profile definitions for CommBank, ANZ, NAB and Westpac. Generic/manual mapping remains the safe path for every other target until exact current format evidence and synthetic regression fixtures are complete.

“Target”, “CSV available” and “confirmed profile” are different states:

- target: planned coverage;
- CSV available: provider says an export exists;
- confirmed profile: exact headers, date and direction semantics, private-field treatment, synthetic fixtures and false-positive tests are complete.

## Everyday bank targets

| Target | Register ID | Current state | Public evidence status | Next safe action |
|---|---|---|---|---|
| CommBank | `commbank` | Confirmed profile | `commbank-everyday-v1`; signed amount; privacy-column regression | Reconfirm in unified quality manifest |
| ANZ | `anz` | Confirmed profile | `anz-everyday-v1`; signed amount profile present | Reconfirm fixtures and false positives in unified matrix |
| NAB | `nab` | Confirmed profile | `nab-everyday-v1`; signed amount profile present | Reconfirm fixtures and false positives in unified matrix |
| Westpac | `westpac` | Confirmed profile | `westpac-everyday-v1`; separate debit/credit columns; current official CSV export remains available | Reconfirm in unified quality manifest |
| Macquarie | `macquarie` | Generic-only | Personal and business CSV export officially available; exact layout unknown | Obtain current synthetic personal export structure; evidence business separately |
| ING | `ing` | Generic-only | CSV statements officially available through website Online Banking; exact layout unknown | Obtain current synthetic Online Banking CSV statement structure |
| Bankwest | `bankwest` | Generic-only | Public transaction-history access confirmed; exact CSV export evidence not confirmed in this review | Obtain official export instructions or private-local structural evidence converted to synthetic fixtures; do not infer CommBank layout |
| St.George | `st-george` | Generic-only | Separate consumer CSV evidence not confirmed; merchant CSV formats are irrelevant | Evidence separately; do not assume Westpac layout |
| BankSA | `banksa` | Generic-only | Separate consumer CSV evidence not confirmed | Evidence separately; do not assume Westpac/St.George layout |
| Bank of Melbourne | `bank-of-melbourne` | Generic-only | Separate consumer CSV evidence not confirmed | Evidence separately; do not assume Westpac/St.George layout |
| Suncorp Bank | `suncorp` | Generic-only | CSV/OFX/QIF/ASCII transactional export officially available with selectable date format | Obtain exact headers, date outputs and debit/credit semantics |
| Bendigo Bank | `bendigo` | Generic-only | Standard CSV and Extended CSV officially available for up to 18 months | Evidence both versions separately; confirm headers and direction |
| Adelaide Bank | `adelaide` | Generic-only | Everyday-account CSV evidence not confirmed; DocSend CSV is not banking transaction evidence | Evidence separately from Bendigo Bank |
| BOQ | `boq` | Generic-only | Transaction-history export in `.csv`, `.dat` or `.qif` officially referenced | Obtain exact headers, dates and amount semantics |
| ubank | `ubank` | Generic-only | PDF or CSV statements officially available in app and Online Banking | Confirm Spend/Save/Bills/Loan layouts and direction semantics |
| Up | `up` | Generic-only; high-priority evidence candidate | Official CSV column list documented, including Time, private account fields, description/category data and Total (AUD) | Obtain current synthetic export to confirm exact timestamp/sign/quoting; exclude BSB/account fields |
| Great Southern Bank | `great-southern` | Generic-only | CSV export officially available; official transaction view describes debit, credit and running balance | Confirm exact CSV headers and whether amount columns are split |
| Heritage Bank | `heritage` | Generic-only legacy target | Heritage and People's Choice have merged under People First Bank | Preserve historical target only; evidence legacy and current People First formats separately |
| People's Choice | `peoples-choice` | Generic-only legacy target | Legacy CSV available; legacy app/Internet Banking scheduled to close 17 September 2026 | Consider historical-file support only after exact evidence; do not treat as People First format |
| People First Bank | `people-first` | Future current target | Current platform says CSV transaction-history download is planned by end of August 2026 | Recheck after release and obtain a current synthetic export before adding profile/code entry |

## Required profile fields

Each confirmed version must record:

- stable profile ID and version;
- display bank name and aliases;
- account/import type;
- required and optional normalized headers;
- expected signed-amount or debit/credit mode;
- date formats, including time-zone handling where applicable;
- description and optional merchant fields;
- ignored balance/reference fields;
- private-field headers and value patterns;
- confidence and manual-confirmation boundary;
- edge cases;
- wholly synthetic fixture names;
- test references;
- last verified date;
- support status.

## Quality manifest design

The internal typed registry separates:

- parser matching metadata;
- public support status;
- fixture/test evidence;
- safe Help labels.

It must not contain source rows, private identifiers, customer-specific headers or real filenames. Runtime parsing uses only the matching fields it needs.

## Format-version policy

A changed bank export creates a new profile version when header, direction, date/time or product semantics materially differ. Older evidenced versions may remain supported for historical files. A new version must not weaken false-positive rejection for existing versions.

Rebrands and platform migrations require separate versions rather than silent aliasing. In particular:

- People's Choice legacy files must not be treated as People First files;
- Heritage legacy files must not be silently treated as People First files;
- St.George, BankSA and Bank of Melbourne must not be assumed to use the Westpac profile;
- Adelaide Bank must not be assumed to use Bendigo Standard CSV;
- Bankwest must not be assumed to use CommBank CSV.

## Safe evidence backlog

Generic-only targets are blocked by exact format evidence, not parser architecture. Acceptable next inputs are:

- official provider documentation that describes export fields;
- a client-verified structural field list with no values;
- a private sample inspected through the established private-local protocol, followed by a wholly new synthetic fixture.

Do not request or accept real CSV files through public issues, support channels or documentation PRs.

## Prioritised evidence sequence

1. Up current CSV — official columns exist; confirm timestamp, sign and quoting.
2. Bendigo Standard and Extended CSV — separate versions.
3. Great Southern CSV — confirm debit/credit structure.
4. Suncorp CSV — confirm headers and selected date formats.
5. ING and ubank CSV statements.
6. BOQ transaction-history CSV.
7. Macquarie personal transaction CSV.
8. People First current CSV after the planned release.
9. Bankwest and the Westpac Group brands requiring separate evidence.
10. Adelaide Bank.

## Loan/account formats

Loan CSV coverage is tracked separately because lender exports may be component-column reports or row-event ledgers and do not necessarily match everyday account formats. No everyday target entry implies Loan-format support.

For every bank with home loans, offset accounts or credit cards, record product-specific layout evidence before claiming support.

## Official export-availability evidence

The detailed current source register, access dates, supported facts, transition risks and remaining blockers are in `PHASE_C2_PUBLIC_BANK_EXPORT_EVIDENCE.md`.

Official documentation can establish that a provider offers CSV export, but it does not by itself establish exact headers or amount semantics. No format profile is created from availability evidence alone.