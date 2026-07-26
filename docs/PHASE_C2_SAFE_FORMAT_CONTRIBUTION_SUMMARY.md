# Phase C2 Safe CSV Format Contribution Summary

Date: 26 July 2026  
Status: provider-free user guidance and downloadable synthetic templates implemented; no submission channel or named parser support added  
Master-plan alignment: Phase C2 — complete bank and Loan-format coverage  
Stacked dependency: PR #247 → PR #246 → PR #244 → PR #243 → PR #242 → unresolved activation stack #231–#241

## Objective

Provide a safe, practical way for a user to recreate the structure of an unsupported Australian bank or Loan CSV without sending, uploading, storing or committing a real financial file.

The workflow supports later parser research while preserving SpendGrove's core privacy rule: real CSVs, statements, filenames, rows and account identifiers must not enter GitHub, support, documentation, Preview evidence or public examples.

## User-facing workflow

The Help page now explains how to:

1. keep the real export on the user's own device;
2. inspect only its structural characteristics, including exact header labels, date format and signed-amount versus debit/credit treatment;
3. download the closest SpendGrove synthetic template;
4. remove placeholder columns that do not apply;
5. rename the remaining placeholder headers to match the structure;
6. retain only three to five wholly invented rows;
7. cover relevant structural cases such as incoming/outgoing values, empty cells, commas and quoted descriptions;
8. remove private identity, account, card, Loan and reference fields;
9. re-open and inspect the synthetic file before any later sharing; and
10. keep the example local until a separately approved, privacy-reviewed contribution channel exists.

## Synthetic templates

Three public static templates were added:

- `public/synthetic-everyday-bank-format-template.csv`;
- `public/synthetic-loan-component-format-template.csv`;
- `public/synthetic-loan-event-format-template.csv`.

### Everyday transaction template

The template provides invented examples for:

- date;
- description;
- amount/debit and credit structures;
- optional balance;
- quoted descriptions containing a comma.

It is a structural starting point only. Users are instructed to delete inapplicable placeholder columns rather than treating the template as one universal bank layout.

### Loan component template

The template provides invented examples for a component-column structure containing:

- total repayment;
- principal;
- interest;
- fee; and
- optional balance.

The invented component values reconcile to the invented total. This does not imply that a named lender exports these fields or that SpendGrove may infer missing components.

### Loan event template

The template provides invented examples for a row-event ledger containing:

- repayment event;
- interest event;
- fee event; and
- optional balance.

It does not define lender-specific signs or classification. Exact support still requires verified current structure and synthetic parser fixtures.

## Privacy and support boundary

The workflow explicitly prohibits:

- real CSVs or statements;
- original filenames;
- copied financial rows or descriptions;
- real dates, amounts or balances;
- names, emails or account names;
- BSBs, account numbers or card details;
- customer/member identifiers;
- Loan identifiers;
- transaction references;
- login details, MFA codes or credentials;
- screenshots containing private financial data.

No upload field, form, API route, email address, attachment mechanism, support-ticket provider or external service was added.

The static templates are downloaded directly from the existing SpendGrove web deployment. They do not leave the user with an automatic submission action.

## Support-truth boundary

This work does not add or claim:

- a named everyday-bank parser;
- a named Loan/lender parser;
- automatic recognition for any new provider;
- proof that a current provider export matches a template;
- inferred principal, interest, fee or balance components;
- public support for an unsupported format;
- a provider relationship or endorsement.

Confirmed automatic everyday-bank profiles remain unchanged. Generic/manual mapping remains the safe fallback for compatible unknown files.

Loan imports continue to support the two reviewed generic structural modes only:

- component columns; and
- row-event ledger.

Every import remains review-before-commit.

## Financial integrity

No financial logic changed.

The work preserves:

- integer cents in durable records;
- Australian dates and financial-year boundaries;
- signed transaction direction and transfer precedence;
- split-parent exclusion and child inclusion;
- duplicate and Merge behaviour;
- Loan component reconciliation tolerance;
- no invented Loan components;
- principal not defaulting as deductible;
- LoanRepayment as an analytical record;
- the reconciled everyday Transaction as the sole cashflow record.

Template values are invented documentation examples and are not committed as SpendGrove financial records.

## Repository impact

Changed scope:

- one existing Help page;
- one existing Help/privacy test file;
- three new static synthetic CSV templates;
- this summary.

No change to:

- Prisma schema or migration files;
- database state or migration history;
- server authorization or durable write paths;
- packages or lockfile;
- provider, secret or environment configuration;
- Vercel, Clerk or Neon settings;
- Production data or runtime activation;
- Apple, signing, TestFlight, subscriptions or public release.

## Automated evidence

The focused test verifies:

- all three templates are referenced as downloads;
- the Help page includes the explicit real-file prohibition;
- placeholder-header and invented-row instructions are present;
- the no-upload/no-submission-channel statement is present;
- the templates contain only synthetic labels and examples;
- the component Loan example reconciles visibly;
- no named supported bank, BSB, account number, card number, customer ID or email appears in the templates;
- Help remains provider-free and contains no form, file input, fetch call or published support address.

Exact-head test, type, lint, optimized build and Vercel evidence must be recorded on the implementation PR before it can advance.

## Known limitations

- The templates do not prove any named provider's exact current export layout.
- Users must still understand enough of their own export to rename structural headers correctly.
- No safe submission channel is active, so synthetic files remain local for now.
- Future accepted parser profiles still require exact structure, false-profile fixtures, privacy-field tests and parser QA.
- Public evidence may establish file availability without exposing enough structure for a reliable named parser.

## Next safe action

Continue Phase C2 with an exact synthetic parser-profile slice only where sufficient current structural evidence exists. The public evidence register currently identifies Up as a strong everyday-bank candidate, but timestamp, sign and quoting behaviour must be resolved before a named profile is implemented.

Alternatively, continue independently safe C1 ledger accessibility polish without beginning the unapproved saved-view schema.

Do not request a real customer CSV or activate a support attachment workflow to close these evidence gaps.
