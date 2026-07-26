# Phase C2 Public Bank Evidence Summary

Date: 26 July 2026  
Status: official-public-evidence review complete for this slice; parser implementation remains gated by exact synthetic structures  
Master-plan alignment: Phase C2 everyday-bank coverage and Phase C3 lender/account coverage

## Objective

Advance target-bank coverage without requesting or using real customer CSV files by reviewing current official provider material and separating:

- confirmed parser support;
- confirmed CSV availability;
- partially documented structure;
- planned/transitioning platforms;
- unsupported assumptions.

## Delivered

- Added `PHASE_C2_PUBLIC_BANK_EXPORT_EVIDENCE.md` with current official evidence and source URLs for generic-only targets.
- Refreshed `PHASE_7_BANK_FORMAT_REGISTER.md` to 26 July 2026.
- Added People First Bank as the future current target while preserving Heritage and People's Choice as separate legacy targets.
- Recorded current People's Choice retirement timing and the planned People First CSV-download capability.
- Identified Up, Bendigo, Great Southern and Suncorp as the strongest next synthetic-evidence candidates.
- Recorded official CSV availability for Macquarie, ING, Suncorp, Bendigo, BOQ, ubank, Up, Great Southern and legacy People's Choice.
- Explicitly rejected unsupported family/group assumptions for Bankwest/CommBank, Westpac/St.George/BankSA/Bank of Melbourne and Bendigo/Adelaide.
- Distinguished consumer bank transaction exports from merchant-settlement and document-submission CSV formats.

## Current support truth

Named profiles remain limited to:

- CommBank;
- ANZ;
- NAB;
- Westpac.

No new parser profile or public support claim was added. All other formats continue through generic/manual mapping.

## Highest-value next implementation candidates

### 1. Up

Official material documents the CSV fields, including:

- Time;
- BSB/Account Number;
- Transaction Type;
- Payee and Description;
- Category and Tags;
- Subtotal/currency fields;
- fees and round-up;
- Total (AUD);
- payment method;
- settled date.

A current wholly synthetic export is still required to confirm exact header spelling/casing, timestamp representation, signed CSV values, embedded-tag quoting and current product variants. BSB/account columns must be excluded as private.

### 2. Bendigo Bank

Official material confirms Standard CSV and Extended CSV as distinct exports. Each requires a separate profile/version and synthetic fixture.

### 3. Great Southern Bank

Official material confirms CSV export and describes debit, credit and running-balance concepts, but exact headers and amount-column structure remain unknown.

### 4. Suncorp Bank

Official material confirms CSV export and user-selected date format, but exact headers and direction semantics remain unknown.

## Brand/platform transition

Official People First material states:

- People First Bank resulted from the Heritage Bank and People's Choice merger;
- legacy People's Choice App and Internet Banking are scheduled to close on 17 September 2026;
- the current People First platform says CSV transaction-history download is planned by the end of August 2026.

Therefore:

- do not silently alias Heritage or People's Choice to People First;
- treat legacy formats as historical versions only;
- recheck the People First current export after 31 August 2026;
- do not create a parser from planned UI wording.

## Privacy and safety

- official public provider sources only;
- no real file or row was requested, read or stored;
- no customer filename, account number, BSB, description, amount or balance entered the repository;
- no provider login or credential was used;
- no inference from group ownership creates a profile;
- no parser, schema, package, environment, provider or Production change.

## Remaining blockers

- exact current synthetic structures for every generic-only target;
- public consumer export evidence for Bankwest, St.George, BankSA, Bank of Melbourne and Adelaide Bank;
- product-specific Loan, offset and credit-card variants;
- current People First export after its planned release;
- authenticated synthetic Preview QA and CI capacity for the activation stack.

## Next safe action

Create the first focused profile only when an exact wholly synthetic structure is available. Up is the preferred first candidate if its current timestamp and signed-value representation can be verified without exposing private data.

This research does not claim complete bank support or change the App Store readiness state.