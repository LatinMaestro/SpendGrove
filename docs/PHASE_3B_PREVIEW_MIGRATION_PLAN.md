# Phase 3B Preview Migration Plan

Status: completed successfully in Preview

Date prepared: 22 June 2026

## Gate

This plan accompanies PR 3B.1. The migration has not been run against Preview or Production.

The client approved the Preview-only plan and the exact minimal `CAR_LOAN` amendment documented in `docs/PHASE_3B_LOANS_FIRST_UI_CONTRACT.md`.

The amendment merged in PR #53. The existing workflow ran once from `main` as run 27958341458 and completed successfully. Production was not targeted.

## Migration

Migration directory:

`prisma/migrations/20260622124500_phase_3b_loan_property_foundation/`

Execution mechanism after approval:

- existing manual GitHub Actions workflow: `Preview Prisma Migration`;
- branch: `main`;
- confirmation text: `RUN PREVIEW MIGRATION`;
- command run by the workflow: `npx prisma migrate deploy --schema prisma/schema.prisma`;
- secrets: existing Preview-only Neon secrets;
- no local database connection and no Production connection.

## Exact additive changes

The migration:

1. Adds `LOAN_CSV` to the existing `ImportType` enum.
2. Adds safe property/loan entity values to `AuditEntityType`.
3. Creates enums for property usage, loan purpose/type, repayment source and reconciliation states.
4. Creates `Property`.
5. Creates `LoanAccount`.
6. Creates `LoanRepayment` as a foundation only; Milestone 1 does not write repayment rows.
7. Creates `LoanReconciliationLink` as a foundation only; Milestone 1 does not create links.
8. Creates ownership/query indexes and user-owned foreign keys.
9. Adds integer-cent, non-negative and component-reconciliation check constraints.

## Existing Phase 3A data impact

The migration does not:

- drop, rename or rewrite any Phase 3A table or column;
- update or delete any existing row;
- change an existing default;
- backfill an existing table;
- make an existing nullable field required;
- create a Production migration;
- persist any CSV, filename, narration, identifier or property address.

The only changes to existing database types are additive enum values. New foreign keys point from new tables to existing `User`, `ImportBatch` and `Transaction` records. No existing row is modified.

## New durable fields

### Property

- user ownership;
- nickname;
- usage;
- archive/soft-delete timestamps;
- created/updated timestamps.

There is no address field.

### Loan account

- user ownership;
- optional property link;
- nickname;
- optional validated lender display name;
- purpose and type;
- optional current balance and matching as-of date;
- archive/soft-delete timestamps;
- created/updated timestamps.

There is no account number, masked reference, lender reference, customer ID or free-text source field.

### Repayment and reconciliation foundations

The fields exactly follow `docs/PHASE_3B_FINANCIAL_DATA_CONTRACT.md`. They are dormant until a later approved implementation uses them.

## Database constraints

- monetary components and balances cannot be negative;
- known repayment components cannot exceed the total by more than 2 cents;
- complete component sets must reconcile to the total within 2 cents;
- current balance and balance-as-of date must be supplied together;
- one repayment can have at most one reconciliation-link record;
- loan deletion is restricted while repayments exist;
- repayment or transaction deletion is restricted while a reconciliation link exists;
- property deletion sets an optional loan property link to null;
- user deletion cascades only through that user’s new records.

Application code must still enforce authenticated ownership for every relationship. The database foreign keys do not replace server ownership checks.

## Pre-execution verification

Before the workflow is run:

1. Confirm PR 3B.1 is merged to `main`.
2. Confirm Vercel and local schema/tests/build are green.
3. Confirm the migration SQL contains no `DROP`, data `UPDATE`, data `DELETE` or destructive alteration.
4. Confirm the existing Preview migration workflow still targets only `NEON_PREVIEW_DATABASE_URL` and `NEON_PREVIEW_DIRECT_DATABASE_URL`.
5. Confirm no Production secret or workflow is involved.
6. Confirm the client explicitly approves this plan.

## Execution

After approval, run the existing manual workflow once from `main`.

Do not:

- run `prisma migrate dev`;
- run `prisma migrate reset`;
- run SQL manually;
- expose database connection values;
- use Production secrets;
- retry a failed migration without first reviewing the safe, redacted failure reason.

## Success evidence

The workflow must show green results for:

- Preview-only confirmation;
- required Preview secrets present;
- dependency installation;
- Prisma Client generation;
- Prisma schema validation;
- `prisma migrate deploy`;
- completion confirmation.

After success:

- verify the workflow run and commit from GitHub;
- verify no Production workflow ran;
- proceed to PR 3B.2;
- do not create repayment or reconciliation data in PR 3B.2.

## Failure and rollback

If the workflow fails before applying the migration, stop and inspect the safe redacted step error.

If it fails during or after partial application:

- stop immediately;
- do not rerun automatically;
- do not run reset or destructive rollback commands;
- inspect Prisma migration status using Preview credentials through an approved secret-safe workflow;
- prepare a forward-only corrective migration or a client-approved rollback plan.

Because all tables are new and no application code uses them before migration success, the safest rollback is normally to leave the failed state untouched until its exact migration status is known. Dropping new types/tables is not pre-authorised.

## Production status

No Production migration is proposed or authorised. Production remains unchanged.
