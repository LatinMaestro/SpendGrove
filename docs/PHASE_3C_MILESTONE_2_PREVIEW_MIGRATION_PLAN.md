# Phase 3C Milestone 2 Preview Migration Plan

Status: applied once to Preview by run `28639135158` and verified by verification-only run `28657045177`; no Production migration

Date prepared: 3 July 2026

Migration: `prisma/migrations/20260703090000_phase_3c_property_reporting_review/`

## Purpose

Add the minimum durable user-review metadata required by the approved Phase 3C Milestone 2 reporting contract. The migration creates one neutral classification enum and one empty owner-linked review table. It does not create a report, classification row, export, summary or application write.

## Exact additive scope

The migration performs only these operations:

1. Create enum `PropertyRecordClassification` with exactly:
   - `PROPERTY_INCOME`;
   - `PROPERTY_OUTGOING`;
   - `REFUND_OR_REVERSAL`;
   - `LOAN_PAYMENT_CONTEXT`;
   - `TRANSFER_CONTEXT`;
   - `OTHER_PROPERTY_RECORD`;
   - `EXCLUDED`.
2. Create table `PropertyReportReview` with:
   - generated text `id` primary key;
   - required `userId`;
   - required `propertyId`;
   - required unique `transactionId`;
   - required neutral `classification` enum;
   - created and updated timestamps.
3. Create one unique transaction index to prevent one transaction entering more than one Property report review.
4. Create two owner-scoped indexes:
   - `(userId, propertyId, classification)`;
   - `(userId, classification)`.
5. Add foreign keys:
   - `userId -> User.id`, delete cascade;
   - `propertyId -> Property.id`, delete restrict;
   - `transactionId -> Transaction.id`, delete restrict;
   - all three use update cascade.

## Explicitly absent

- no change to an existing table, column, enum, index, constraint, default or nullability rule;
- no insert, update, delete, backfill, conversion or rewrite;
- no reporting review row;
- no amount, date, financial-year, category, merchant, description, narration, filename, address, balance, report total, source snapshot or export content field;
- no deductible, tax, ATO, claim or percentage field/value;
- no trigger, view, stored procedure, extension or provider change;
- no package, secret or environment change.

## Required workflow

After explicit client approval only:

- workflow: `Preview Prisma Migration`;
- branch: `main` containing the merged PR 3C.6 commit;
- confirmation text: `RUN PREVIEW MIGRATION`;
- database: Preview-only Neon secrets already configured for that workflow;
- command path: the existing workflow's `prisma migrate deploy` behavior;
- run once; do not auto-retry a failure.

Do not use `prisma migrate dev`, `prisma migrate reset`, manual SQL, Production secrets or a Production database URL.

## Pre-migration checks

Before dispatch, verify without printing connection values or private rows:

1. PR 3C.6 is merged and its Vercel/check suite is green.
2. `main` contains migration `20260703090000_phase_3c_property_reporting_review` unchanged.
3. The Preview migration history does not already contain this migration.
4. The Preview database does not already contain `PropertyReportReview` or `PropertyRecordClassification`.
5. Existing Prisma migrations report no failed or unresolved state.
6. Capture aggregate row counts only for `User`, `Transaction`, `Property`, `LoanAccount`, `LoanRepayment`, `LoanReconciliationLink` and `PropertyTransactionLink` for post-run comparison.

## Post-migration integrity checks

After a successful workflow, verify without exposing private contents:

1. GitHub Actions reports one green run for the expected `main` commit.
2. Prisma migration history records the expected migration once with no failed state.
3. The enum contains exactly the seven approved values.
4. `PropertyReportReview` contains exactly the seven approved columns plus its three foreign-key relations, primary key, unique index and two owner-scoped indexes.
5. `PropertyReportReview` has zero rows immediately after migration.
6. Aggregate row counts captured for all existing tables are unchanged.
7. Existing Phase 3A, Phase 3B and Phase 3C Milestone 1 constraints remain present and unchanged.
8. Public smoke checks remain healthy.

## Failure handling

If the workflow fails:

- stop immediately;
- do not rerun automatically;
- do not reset, resolve or edit migration history;
- do not run manual SQL or rollback commands;
- inspect only secret-safe workflow status and logs;
- report the failed step, redacted likely cause and proposed safe next action for client approval;
- do not start PR 3C.7.

## Rollback notes

No automatic rollback is authorised.

Because the migration is additive and creates no rows, a corrective rollback before application writes would conceptually remove the new review table first and then the new enum. That action must be delivered as a separately reviewed corrective migration after explicit client approval; never run ad-hoc drop SQL.

After any reporting review row exists, do not remove the table or enum. Stop and design a forward corrective migration that preserves user review metadata.

The application remains compatible if the new empty table exists but PR 3C.7 has not started, because no current code reads or writes it.

## Production boundary

This plan authorises Preview only after explicit approval. It does not authorise a Production migration, Production secret access, data copy, environment promotion or production application write.

## Approval gate

The client approved this plan on 3 July 2026. Run `28639135158` applied the migration once from `main`; verification-only run `28657045177` confirmed the expected migration, seven-value enum, seven-column empty table, approved primary key/indexes/foreign keys and unchanged aggregate counts. PRs 3C.7-3C.9 may continue in order. No Production migration is authorised.
