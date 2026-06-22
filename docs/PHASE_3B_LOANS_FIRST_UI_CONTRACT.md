# Phase 3B Loans-First UI Contract

Status: approved client clarification and approved minimal schema amendment

Date: 22 June 2026

## Product structure

The primary user-facing section is **Loans**.

SpendGrove must support loans whether or not they relate to property. The Loans section begins with the user’s loan accounts. A property is optional supporting metadata for a relevant home or investment loan; it is not the main entry point.

Milestone 1 supports:

- owner-occupier home loans;
- investment property loans;
- car loans;
- personal loans;
- other loans.

## PR 3B.2 experience

The user can:

- open the main Loans section;
- create a Loan Account using a safe nickname;
- choose Owner-occupier home loan, Investment property loan, Car loan, Personal loan or Other loan;
- optionally create or link a property for a relevant home or investment loan;
- choose Owner-occupied, Investment or Other property usage;
- edit and archive loan records;
- edit and archive an optional linked property record.

Loan accounts appear first. Loan cards may show a small neutral tag:

- Owner-occupier;
- Investment;
- Car loan;
- Personal loan;
- Other.

A property must never be required for car, personal or other loans.

## PR 3B.3 experience

Before reviewing a loan CSV, the user chooses the Loan Account that owns the file’s repayment rows.

- The selector supports every approved loan type.
- If the selected loan has an optional linked property, the review may show that property nickname and usage as context.
- If the selected loan is not property-linked, the flow does not request property details.
- Selecting an account does not upload or persist the CSV, rows, filename or narration.

## Safe metadata

Permitted user-entered metadata remains limited to:

- loan nickname;
- optional lender display name after private-identifier validation;
- loan type and purpose;
- optional current balance snapshot and as-of date;
- optional linked property nickname and usage.

The UI and API must reject or omit:

- exact property addresses;
- loan or bank account numbers;
- lender references;
- customer IDs;
- masked account references;
- BSBs or card fragments;
- raw source text or narration;
- filenames, raw CSV rows or private headers.

## Neutral tax boundary

- Loan purpose and property usage are descriptive metadata.
- Interest is not automatically declared deductible.
- Milestone 1 provides no tax or EOFY report, deductibility decision or tax advice.
- Where property context is relevant, use neutral wording such as “property-related record keeping” or “potential tax record-keeping”.

## Deferred future direction

A later separately approved property/tax/reporting phase may consider:

- linking a normal everyday-account transaction to a property for tax record keeping;
- property profiles with property-level financial statistics;
- property/tax reports with appropriate disclaimers and review.

Milestone 1 must not implement those items, property profiles, Home dashboard statistics or transaction-to-property tax links.

## Car-loan schema review

The merged schema currently provides:

- `LoanPurpose`: `OWNER_OCCUPIER`, `INVESTMENT`, `PERSONAL`, `OTHER`;
- `LoanType`: `HOME_LOAN`, `PERSONAL_LOAN`, `OTHER`.

Using `OTHER` for car loans would lose the durable distinction required for the approved Car loan label, edit flow and Loan Account selection. Using `PERSONAL_LOAN` would incorrectly label a car loan as a personal loan.

A dedicated `CAR_LOAN` value is therefore required.

### Exact minimal amendment

Prisma schema:

```prisma
enum LoanType {
  HOME_LOAN
  CAR_LOAN
  PERSONAL_LOAN
  OTHER
}
```

Because the Phase 3B migration has not run in any environment, amend its enum creation line to:

```sql
CREATE TYPE "LoanType" AS ENUM ('HOME_LOAN', 'CAR_LOAN', 'PERSONAL_LOAN', 'OTHER');
```

No new table, column, relationship, private field or data rewrite is required.

Recommended combinations:

- Owner-occupier home loan: `HOME_LOAN` + `OWNER_OCCUPIER`;
- Investment property loan: `HOME_LOAN` + `INVESTMENT`;
- Car loan: `CAR_LOAN` + `PERSONAL`;
- Personal loan: `PERSONAL_LOAN` + `PERSONAL`;
- Other loan: `OTHER` + `OTHER`.

The purpose remains descriptive and creates no tax conclusion.

## Gate

The client approved the exact `CAR_LOAN` addition above.

Required sequence:

1. amend the Prisma enum and the still-unexecuted migration SQL;
2. update schema privacy/migration tests;
3. validate Prisma, tests, type-check, build and Vercel;
4. merge the amendment;
5. run the existing Preview-only migration workflow once from `main`;
6. verify success;
7. continue autonomously through PR 3B.2 and PR 3B.3.

No Production migration is authorised.
