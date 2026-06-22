# Phase 3B Financial Rules and Data Contract

Status: approved Milestone 1 decision record

Date: 22 June 2026

## Purpose

This contract defines the financial, reconciliation, privacy and persistence rules for Phase 3B before schema or application implementation.

It authorises only Phase 3B Milestone 1:

- PR 3B.0 — this decision record;
- PR 3B.1 — schema foundation and Preview migration plan;
- PR 3B.2 — authenticated property and loan metadata management after the migration gate;
- PR 3B.3 — browser-local loan CSV mapping and review.

Durable loan repayment commit and reconciliation implementation remain Milestone 2 work and are not authorised yet.

## Financial semantics

### Money representation

- Every durable monetary value uses integer cents.
- Phase 3B supports AUD only.
- Loan breakdown values are stored as non-negative liability/payment magnitudes.
- Everyday-account transaction direction continues to come from the existing transaction type and amount model.
- Reconciliation compares the absolute cashflow amount with the loan repayment total or grouped repayment total.
- Display formatting must use Australian currency and dates.

### Total repayment

`totalPaymentCents` is the reviewed amount applied as the loan payment event for the row.

- It is not a second spending transaction.
- It may represent a normal repayment, an interest-only repayment or a standalone reviewed fee payment.
- It must be zero or greater.
- A zero-total row cannot be committed as a repayment unless it contains a separately supported reviewed component event in a later approved scope.

### Principal

`principalCents` is the reviewed portion that reduces the loan liability.

- It is zero or greater when known.
- It may be unknown when the source does not provide a principal breakdown.
- Missing and zero are different: missing means not supplied or not safely derivable; zero means the reviewed source explicitly indicates no principal.
- Principal must never default to deductible or enter a tax total.
- Phase 3B must not infer principal from a balance change.

### Interest

`interestCents` is the reviewed interest component associated with the repayment event.

- It is zero or greater when known.
- It may be unknown when the source does not provide it.
- Owner-occupier and personal-loan interest carry no deductible default.
- Investment purpose is descriptive metadata only in Milestone 1; it does not make the interest deductible or create a tax conclusion.

### Fees

`feeCents` is the reviewed loan fee component associated with the event.

- It is zero or greater when known.
- It may be unknown when the source does not provide it.
- A separately listed fee may be reviewed as its own event with principal and interest equal to zero.
- Fees carry no deductible default.
- Eligibility or tax treatment is outside Milestone 1.

### Component validation

- If principal, interest and fees are all supplied, their sum must equal the total within 2 cents.
- A difference of 1–2 cents is retained as a visible rounding variance; values are never silently rewritten.
- A difference greater than 2 cents is a blocking review issue.
- If one or more components are missing, SpendGrove must not invent the missing values.
- Known components may not exceed the total by more than 2 cents.
- The original reviewed integer-cent values remain authoritative.

### Balance

`balanceAfterCents` is an optional reviewed liability balance after the event.

- It is stored as a non-negative integer-cent magnitude.
- It is not income, spending, principal or a reconciliation amount.
- It must not be used to infer an unsupplied repayment component.
- It must not affect Home dashboard, transaction or cashflow totals.
- A loan account may have an optional current balance snapshot and balance-as-of date, but no balance history is introduced in Milestone 1.
- Balance values must never appear in logs, audit metadata, documentation, PR text, screenshots or analytics.

## Loan and property purpose metadata

### Loan purpose

The allowed descriptive purposes are:

- `OWNER_OCCUPIER`;
- `INVESTMENT`;
- `PERSONAL`;
- `OTHER`.

Purpose is user-selected metadata. It is not a tax determination.

### Loan type

The allowed loan types are:

- `HOME_LOAN`;
- `CAR_LOAN`;
- `PERSONAL_LOAN`;
- `OTHER`.

Loan type does not determine deductibility or reporting treatment.

### Property usage

The allowed property usage values are:

- `OWNER_OCCUPIED`;
- `INVESTMENT`;
- `OTHER`.

Property usage is descriptive metadata only.

### Property links

- A loan may link to at most one user-owned property.
- A property may link to multiple user-owned loans.
- Car, personal and other loans do not require a property.
- Properties are optional supporting metadata; Loans is the main user-facing section.
- A property link does not create a deductible outcome.
- Exact property addresses are forbidden in Milestone 1.

## Reconciliation contract

Reconciliation implementation is deferred to Milestone 2, but its data model must obey these rules.

### Eligible everyday transactions

A transaction is eligible only when it:

- belongs to the same authenticated user;
- is active and not deleted;
- is not a split parent;
- represents an outgoing expense or transfer;
- has a valid date and integer-cent amount;
- is not already fully allocated to incompatible loan repayments.

Imported and manual transactions are both eligible. Reconciliation never changes the original transaction amount, category, notes, split data or import lineage.

### Eligible loan repayments

A repayment is eligible only when it:

- belongs to the same authenticated user and loan account;
- is active and not deleted;
- has a reviewed date and total;
- is not already linked to another everyday transaction.

Each loan repayment may link to at most one everyday transaction. One everyday transaction may link to multiple loan repayments for split-loan payments.

### Comparison basis

- For one repayment, compare its total with the absolute everyday transaction amount.
- For split loans, compare the sum of linked repayment totals with the absolute everyday transaction amount.
- Store actual values and the signed variance in cents.
- Never rewrite either side to force a match.

### Candidate tolerance and confidence bands

These bands create suggestions only. No confidence band may automatically create a durable link.

**High confidence**

- amount variance is exactly 0 cents; and
- date difference is 0–1 calendar days.

**Medium confidence**

- amount variance is 0–2 cents and date difference is 0–3 calendar days; or
- amount variance is exactly 0 cents and date difference is 2–7 calendar days.

**Manual candidate**

- amount variance is no more than 100 cents and date difference is no more than 7 calendar days.
- It may appear only in an explicitly opened manual matching/search flow.
- It must show the amount and date mismatch before confirmation.

Candidates outside these limits require an explicit manual search and override. They must never be presented as likely matches.

### Manual override

- The user may link or unlink eligible records manually.
- A non-high-confidence link requires an explicit confirmation that shows the variance and date difference.
- A manual link records a safe reason code, not free-text bank narration.
- Unlinking restores both records to unmatched status without deleting either record.
- Re-linking must re-run ownership, active-state and allocation validation.

### No-double-count rule

- The existing everyday transaction is the sole cashflow/spending record.
- A loan repayment record is an analytical breakdown and must never enter transaction, spending, income or Home dashboard totals.
- An unmatched loan repayment still contributes zero to cashflow totals.
- Linking does not create, duplicate or alter a transaction.
- For split loans, the everyday transaction counts once while each loan repayment remains visible only in loan breakdown views.
- Principal, interest and fees may be summarised in future loan views, but those summaries must be labelled breakdowns rather than additional spending.

## Minimum safe persisted fields

### Property

- generated ID;
- authenticated user ID;
- user-chosen nickname;
- property usage enum;
- archive/deletion state;
- created and updated timestamps.

No exact address field is permitted in Milestone 1.

### Loan account

- generated ID;
- authenticated user ID;
- optional linked property ID;
- user-chosen nickname;
- optional lender display name after private-identifier validation;
- loan purpose enum;
- loan type enum;
- optional current balance in integer cents;
- optional balance-as-of date;
- archive/deletion state;
- created and updated timestamps.

No account number, masked reference or lender reference field is permitted.

### Loan repayment

- generated ID;
- authenticated user ID;
- loan account ID;
- reviewed repayment date;
- reviewed total, principal, interest, fees and balance-after values in integer cents;
- safe source type;
- safe import lineage ID when durable import is later approved;
- reconciliation status;
- archive/deletion state;
- created and updated timestamps.

Milestone 1 defines this foundation but does not commit repayment rows.

### Reconciliation link

- generated ID;
- authenticated user ID;
- loan repayment ID;
- everyday transaction ID;
- confidence enum;
- amount variance in cents;
- date difference in days;
- safe link method/reason code;
- created, updated and unlinked timestamps.

Milestone 1 defines this foundation but does not implement linking.

### Safe status and source values

- Repayment source: `MANUAL` or `LOAN_CSV`.
- Reconciliation status: `UNMATCHED`, `NEEDS_REVIEW` or `LINKED`.
- Reconciliation confidence: `HIGH`, `MEDIUM` or `MANUAL`.
- Link method: `SUGGESTED` or `MANUAL`.
- Property and loan lifecycle uses explicit archive and soft-delete timestamps; deletion must not cascade into an everyday transaction.

## Forbidden durable fields and values

The following must not be persisted in property, loan, repayment, reconciliation, import, audit, history, logging or analytics records:

- raw CSV files or file bytes;
- raw CSV rows;
- original or safe-derived filenames;
- raw bank narration or source descriptions;
- raw or private headers;
- loan account numbers;
- masked loan references;
- lender references;
- customer IDs;
- BSBs;
- card numbers or fragments;
- account names or account identifiers;
- exact property addresses;
- secrets or connection strings;
- free-text reconciliation evidence copied from a bank file.

User-chosen nicknames and lender display names must be rejected when they resemble these private identifiers.

## CSV and source-detail boundaries

- Loan CSV selection, decoding, parsing, header detection, privacy scanning, mapping and row review happen in browser memory.
- Milestone 1 must not upload the selected file or its rows.
- Refreshing or leaving the review clears the selected file and reviewed rows.
- No filename, row, raw narration, private header, balance column sample or identifier may enter local storage, server requests, telemetry or logs.
- Source descriptions may be used transiently to classify a row in browser memory, but must not be displayed or persisted in Milestone 1.
- PRs, fixtures and screenshots use synthetic data only.
- Saved loan mapping profiles are excluded from Milestone 1.

## Privacy, ownership and audit rules

- Every durable record is scoped by the authenticated user ID.
- Server reads and writes must verify ownership rather than trusting client-supplied user IDs.
- Cross-user property, loan and transaction relationships are forbidden.
- Soft-deleted or archived records are excluded from active selection and reconciliation.
- Audit events may record entity type, entity ID, action, timestamp and safe changed-field/reason codes.
- Audit metadata must not record financial values, balances, nicknames, lender names, source text or before/after private content.
- Errors and logs use safe codes and aggregate counts only.
- No analytics event may contain amounts, balances, loan/property labels or identifiers.

## Schema and migration constraints

- PR 3B.1 must implement this contract without adding broader fields.
- The migration must be additive only.
- Existing Phase 3A tables and records must not be altered, rewritten or deleted.
- Foreign keys may reference existing `User` and `Transaction` records without changing their stored data.
- A Preview migration plan and generated SQL must be reviewed before execution.
- No Preview migration may run until the client approves the gate.
- No Production migration is authorised.

## Explicit exclusions

This contract does not authorise:

- durable loan repayment commit;
- active reconciliation or matching;
- tax/EOFY/property/accountant reports;
- deductibility decisions or tax advice;
- Home dashboard statistics;
- recurring, subscriptions, budgets, insights or reminders;
- Basiq or live bank connections;
- AI, payments, household mode, accountant workspace or document storage;
- Phase 4 or later modules.
