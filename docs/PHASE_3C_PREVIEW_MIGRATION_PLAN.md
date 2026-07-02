# Phase 3C Preview Migration Plan

Status: approved and completed successfully in Preview

Date prepared: 2 July 2026

## Gate

This plan accompanies PR 3C.1 and implements only `docs/PHASE_3C_MILESTONE_1_DATA_CONTRACT.md`. The migration must not run in Preview until PR 3C.1 is green, merged to `main` and explicitly approved by the client. PR 3C.2 must not begin before the approved Preview migration succeeds.

No Production migration is proposed or authorised.

The client approved this exact plan on 2 July 2026. The existing workflow ran once from `main` as run `28552337732` against commit `f3778c03b45981ac831066cfb9ae93f709075e84` and completed successfully. Every Preview confirmation, secret-presence, dependency, Prisma generation, validation, migrate-deploy and completion step was green. No Production workflow or connection was used.

## Migration

Migration directory:

`prisma/migrations/20260702090000_phase_3c_property_transaction_link/`

Approved execution mechanism after separate approval:

- existing manual GitHub Actions workflow: `Preview Prisma Migration`;
- branch: `main`;
- confirmation text: `RUN PREVIEW MIGRATION`;
- command: `npx prisma migrate deploy --schema prisma/schema.prisma`;
- connections: existing `NEON_PREVIEW_DATABASE_URL` and `NEON_PREVIEW_DIRECT_DATABASE_URL` secrets only;
- no local database connection and no Production connection.

## Exact additive change

The migration creates one new `PropertyTransactionLink` table containing only:

- generated link ID;
- authenticated user ID;
- transaction ID;
- Property ID;
- nullable unlink timestamp;
- created and updated timestamps.

It adds:

- a primary key on link ID;
- a unique transaction-ID index enforcing one durable link record per transaction;
- owner/Property/active-state and owner/active-state indexes;
- a user foreign key with delete cascade;
- Transaction and Property foreign keys with delete restriction.

The Prisma schema adds only matching relation fields on `User`, `Transaction` and `Property`. It adds no enum, provider, package, service or environment setting.

## Existing data impact

The SQL does not:

- drop, rename or alter an existing table, column, enum, index or constraint;
- update, delete, backfill or copy an existing row;
- change an existing default or nullability rule;
- create any Property link row;
- copy transaction amount, date, merchant, category, description, source or import data;
- add address, tax, report, filename, narration or private-identifier fields.

Existing Phase 3A and Phase 3B data remains unchanged. The new table is empty immediately after migration.

## Pre-execution verification

Before dispatching the workflow:

1. Confirm PR 3C.1 is merged to `main` and the approved migration SHA matches `main`.
2. Confirm Vercel, full tests, TypeScript and production build are green.
3. Confirm Prisma format, generation and schema validation pass.
4. Confirm the migration contains one `CREATE TABLE`, three indexes and three foreign keys only.
5. Confirm it contains no `DROP`, data `UPDATE`, data `DELETE`, backfill or alteration of an existing table/type.
6. Confirm the workflow still maps only the two Preview Neon secrets and requires `RUN PREVIEW MIGRATION`.
7. Confirm no Production workflow, secret or database URL is involved.
8. Obtain explicit client approval for this exact plan.

## Data-integrity checks

Static checks before execution:

- schema tests verify the exact safe fields, unique transaction cardinality, indexes and delete behavior;
- migration tests reject destructive SQL and any alteration of an existing table;
- privacy tests reject copied financial/source fields, addresses, tax fields and private identifiers;
- Prisma validates all relations against the existing schema.

Checks after an approved Preview run:

- the workflow must report `prisma migrate deploy` success for the expected `main` commit;
- the deploy output must identify `20260702090000_phase_3c_property_transaction_link` as applied with no failed migration step;
- the reviewed SQL contains no `INSERT`, and no application code writes the new table before PR 3C.2, so the table remains empty after migration;
- existing User, Transaction, Property, LoanAccount, LoanRepayment and LoanReconciliationLink records must not be rewritten by this migration;
- public application smoke checks must remain healthy and no Phase 3C link is created automatically.

Only aggregate schema/migration status may be reported. Do not add a private-data query or print connection values or record content.

## Execution procedure after approval

1. Open GitHub Actions on merged `main`.
2. Select `Preview Prisma Migration`.
3. Run it once with confirmation `RUN PREVIEW MIGRATION`.
4. Verify the workflow identifies Preview-only secrets without printing values.
5. Verify dependency installation, Prisma generation, validation and migrate-deploy steps succeed.
6. Record the run ID, commit and green result in the handoff.
7. Confirm no Production migration workflow ran.
8. Only then begin PR 3C.2.

Do not use `prisma migrate dev`, `prisma migrate reset`, manual SQL, Production secrets or an automatic retry.

## Failure and rollback notes

If the workflow fails before applying the migration, stop and review only the redacted step error. Do not retry until the cause and migration state are known.

If it fails during or after partial application:

- stop immediately;
- do not rerun, reset, resolve or execute manual rollback SQL;
- inspect Preview migration status through an approved secret-safe workflow;
- prepare a forward-only corrective migration or exact rollback proposal for client approval.

After a successful apply, dropping the new table is destructive and is not pre-authorised. Because no application code writes the table before PR 3C.2, the safest rollback is to leave the empty additive table in place while an exact corrective plan is reviewed. Any `DROP TABLE`, migration resolution or data change requires separate approval.

## Production status

No Production migration has run. No Production migration is proposed or authorised for this milestone.
