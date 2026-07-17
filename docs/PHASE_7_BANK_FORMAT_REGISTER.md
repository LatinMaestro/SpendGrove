# Phase 7 Australian Bank Format Register

Status date: 17 July 2026  
Source: SpendGrove v2.0.1 Master Specification section 17.1 and current repository parser definitions

## Current support statement

SpendGrove currently contains named everyday-transaction profile definitions for CommBank, ANZ, NAB and Westpac. Generic/manual mapping remains the safe path for all other targets until exact format evidence and synthetic regression fixtures are complete.

“Target” does not mean “confirmed support”.

## Everyday bank targets

| Target | Register ID | Current state | Repository truth | Next safe action |
|---|---|---|---|---|
| CommBank | `commbank` | Confirmed profile | `commbank-everyday-v1`; signed amount; privacy-column regression | Reconfirm in unified quality manifest |
| ANZ | `anz` | Confirmed profile | `anz-everyday-v1`; signed amount profile present | Reconfirm fixtures and false positives in unified matrix |
| NAB | `nab` | Confirmed profile | `nab-everyday-v1`; signed amount profile present | Reconfirm fixtures and false positives in unified matrix |
| Westpac | `westpac` | Confirmed profile | `westpac-everyday-v1`; debit/credit regression | Reconfirm in unified quality manifest |
| Macquarie | `macquarie` | Generic-only | No named profile | Obtain safe exact-layout evidence, then synthetic fixture |
| ING | `ing` | Generic-only | No named profile | Obtain safe exact-layout evidence, then synthetic fixture |
| Bankwest | `bankwest` | Generic-only | No named profile | Obtain safe exact-layout evidence, then synthetic fixture |
| St George | `st-george` | Generic-only | No named profile | Evidence separately; do not assume Westpac layout |
| BankSA | `banksa` | Generic-only | No named profile | Evidence separately; do not assume Westpac layout |
| Bank of Melbourne | `bank-of-melbourne` | Generic-only | No named profile | Evidence separately; do not assume Westpac layout |
| Suncorp | `suncorp` | Generic-only | No named profile | Obtain safe exact-layout evidence, then synthetic fixture |
| Bendigo Bank | `bendigo` | Generic-only | No named profile | Evidence separately from Adelaide Bank |
| Adelaide Bank | `adelaide` | Generic-only | No named profile | Evidence separately from Bendigo Bank |
| BOQ | `boq` | Generic-only | No named profile | Obtain safe exact-layout evidence, then synthetic fixture |
| ubank | `ubank` | Generic-only | No named profile | Obtain safe exact-layout evidence, including current brand/export |
| Up | `up` | Generic-only | No named profile | Verify whether CSV export exists and exact layout |
| Great Southern Bank | `great-southern` | Generic-only | No named profile | Obtain safe exact-layout evidence, then synthetic fixture |
| Heritage Bank | `heritage` | Generic-only | No named profile | Verify current brand/export compatibility before profile |
| People’s Choice | `peoples-choice` | Generic-only | No named profile | Verify current/historical export relevance before profile |

## Required profile fields

Each confirmed version must record:

- stable profile ID and version;
- display bank name and aliases;
- account/import type;
- required and optional normalized headers;
- expected signed-amount or debit/credit mode;
- date formats;
- description and optional merchant fields;
- ignored balance/reference fields;
- private-field headers and value patterns;
- confidence and manual-confirmation boundary;
- edge cases;
- fixture names;
- test references;
- last verified date;
- support status.

## Quality manifest design

Milestone 7.1A should introduce an internal typed registry that separates:

- parser matching metadata;
- public support status;
- fixture/test evidence;
- safe Help labels.

The registry must not contain source rows, private identifiers, customer-specific headers or filenames. Runtime parsing must use only the matching fields it needs.

## Format-version policy

A changed bank export creates a new profile version when header, direction or date semantics materially differ. Older evidenced versions may remain supported. A new version must not weaken false-positive rejection for existing versions.

## Safe evidence backlog

The 15 generic-only targets are blocked by exact format evidence, not by parser architecture. Acceptable next inputs are:

- official provider documentation that describes export fields;
- a client-verified structural field list with no values;
- a private sample inspected through the established private-local protocol, followed by a wholly new synthetic fixture.

Do not request or accept real CSV files through public issues, support channels or documentation PRs.

## Loan/account formats

Loan CSV coverage is tracked separately because lender exports may be component-column reports or row-event ledgers and do not necessarily match everyday account formats. No everyday target entry implies loan-format support.


## Official export-availability evidence

Official documentation can establish that a provider offers CSV export, but it does not by itself establish exact headers or amount semantics.

| Target | Official source | Provider | Accessed | Supported fact | Remaining blocker |
|---|---|---|---|---|---|
| Macquarie | [Exporting transactions as CSV or QIF files](https://www.macquarie.com.au/help/business/manage-your-accounts/statements-and-transactions/export-transactions-as-csv-or-qif-files.html) | Macquarie Bank | 17 July 2026 | Macquarie Business Online offers transaction CSV export and permits transaction ordering choices | Exact personal/everyday export headers, column order and signed/debit-credit semantics are not documented; remains generic-only |

No format profile is created from this availability evidence alone.
