# Phase 4 Milestone 1 Preview Migration Plan

Status: exact schema and unexecuted migration files prepared in PR 4.1A; awaiting explicit client approval before any Preview migration

Date: 9 July 2026

Related contract: `docs/PHASE_4_MILESTONE_1_CONTRACT.md`

Schema PR: PR 4.1A / GitHub PR #108

## Purpose

Phase 4 Milestone 1 needs minimal durable state for:

- user-confirmed recurring/subscription records;
- user-dismissed recurring/subscription suggestion keys;
- user-entered monthly category budgets.

This plan now references the exact Prisma schema changes and unexecuted migration file prepared for the Phase 4 Milestone 1 schema gate.

No Preview migration may run until the client explicitly approves these exact files. No Production migration is authorised.

## Exact migration folder

`prisma/migrations/20260708090000_phase_4_recurring_budgets_foundation/`

The exact SQL file is:

`prisma/migrations/20260708090000_phase_4_recurring_budgets_foundation/migration.sql`

## Exact Prisma schema scope

PR #108 adds only:

1. Enum `RecurringCadence` with values:
   - `WEEKLY`
   - `FORTNIGHTLY`
   - `MONTHLY`
   - `OTHER`
2. Enum `RecurringItemStatus` with values:
   - `ACTIVE`
   - `ARCHIVED`
3. Enum `BudgetPeriod` with value:
   - `MONTHLY`
4. Enum `BudgetStatus` with values:
   - `ACTIVE`
   - `ARCHIVED`
5. Three safe values to existing `AuditEntityType`:
   - `RECURRING_ITEM`
   - `RECURRING_SUGGESTION_DISMISSAL`
   - `CATEGORY_BUDGET`
6. Model `RecurringItem`.
7. Model `RecurringSuggestionDismissal`.
8. Model `CategoryBudget`.
9. User and Category relation fields for the new models.

## Exact model purpose

### `RecurringItem`

Stores only user-confirmed recurring/subscription records.

Approved durable fields:

- generated `id`;
- authenticated `userId`;
- nullable `categoryId`;
- safe user-confirmed `label`;
- `transactionType`;
- nullable `expectedAmountCents`;
- `cadence`;
- nullable `nextExpectedDate`;
- `status`;
- nullable `archivedAt`;
- `createdAt` and `updatedAt`.

### `RecurringSuggestionDismissal`

Stores only safe dismissal state for deterministic suggestion patterns.

Approved durable fields:

- generated `id`;
- authenticated `userId`;
- safe deterministic `suggestionKey`;
- `dismissedAt`;
- `createdAt` and `updatedAt`.

`suggestionKey` must be derived only from approved safe facts. It must not contain raw narration, filenames, account references, exact source text, private identifiers or source snapshots.

### `CategoryBudget`

Stores only user-entered monthly category budgets.

Approved durable fields:

- generated `id`;
- authenticated `userId`;
- `categoryId`;
- `amountCents`;
- `period` fixed to `MONTHLY` for this milestone;
- `status`;
- nullable `archivedAt`;
- `createdAt` and `updatedAt`.

## Exact SQL operations

The unexecuted migration file performs only these additive operations:

1. Create enum `RecurringCadence`.
2. Create enum `RecurringItemStatus`.
3. Create enum `BudgetPeriod`.
4. Create enum `BudgetStatus`.
5. Add the three approved safe values to `AuditEntityType`.
6. Create table `RecurringItem`.
7. Create table `RecurringSuggestionDismissal`.
8. Create table `CategoryBudget`.
9. Create indexes:
   - `RecurringItem_userId_status_idx`;
   - `RecurringItem_userId_categoryId_idx`;
   - `RecurringItem_userId_cadence_idx`;
   - `RecurringSuggestionDismissal_userId_suggestionKey_key`;
   - `RecurringSuggestionDismissal_userId_dismissedAt_idx`;
   - `CategoryBudget_userId_categoryId_idx`;
   - `CategoryBudget_userId_period_status_idx`;
   - `CategoryBudget_userId_categoryId_period_status_idx`.
10. Add foreign keys:
   - `RecurringItem.userId -> User.id` with delete cascade;
   - `RecurringItem.categoryId -> Category.id` with set null;
   - `RecurringSuggestionDismissal.userId -> User.id` with delete cascade;
   - `CategoryBudget.userId -> User.id` with delete cascade;
   - `CategoryBudget.categoryId -> Category.id` with delete restrict.

The migration file does not insert, update, delete, backfill, convert or rewrite existing rows.

## Unique and index rules

`RecurringItem`:

- No database unique rule is added because legitimate users may have more than one recurring item in the same category/cadence.
- Later server code must prevent accidental duplicate confirmation using safe deterministic rules.

`RecurringSuggestionDismissal`:

- Unique `[userId, suggestionKey]` prevents duplicate dismissal records for the same safe suggestion pattern.

`CategoryBudget`:

- No database unique rule is added for active budgets because a portable partial unique active-only index is not represented in Prisma schema for this project.
- Later server code must enforce one active monthly budget per user/category.

## Privacy review

The schema stores only structured, user-owned, reviewable fields needed for recurring items and budgets.

Forbidden and not added:

- raw CSV files;
- raw CSV rows;
- raw bank narration;
- merchant/source descriptions beyond safe user-confirmed labels;
- filenames;
- headers;
- account references;
- BSBs;
- card fragments;
- customer IDs;
- loan or lender references;
- masked identifiers;
- exact addresses;
- balances;
- secrets;
- source snapshots;
- Basiq or live-bank data;
- AI inference;
- payment/biller/provider fields;
- tax, deductible, claimable, ATO or advice fields.

## Pre-migration checks

Run inside the approved Preview-only migration workflow after client approval and before `prisma migrate deploy`:

1. Confirmation text equals `RUN PREVIEW MIGRATION`.
2. Workflow runs from `main`.
3. Preview-only database secrets are present without printing values.
4. No Production database URL or Production secret is used.
5. Prisma migration state has no failed/unresolved migration.
6. Target migration is not already applied.
7. Preview database does not already contain:
   - `RecurringCadence`;
   - `RecurringItemStatus`;
   - `BudgetPeriod`;
   - `BudgetStatus`;
   - `RecurringItem`;
   - `RecurringSuggestionDismissal`;
   - `CategoryBudget`.
8. Capture aggregate row counts only for existing tables:
   - `User`;
   - `Category`;
   - `Transaction`;
   - `ImportBatch`;
   - `ImportRow`;
   - `Property`;
   - `LoanAccount`;
   - `LoanRepayment`;
   - `LoanReconciliationLink`;
   - `PropertyTransactionLink`;
   - `PropertyReportReview`.

## Post-migration checks

After `prisma migrate deploy` succeeds in Preview, verify only safe schema/aggregate status:

1. Expected migration applied exactly once.
2. No failed/unresolved Prisma migration state exists.
3. Four new enums exist with exact approved values.
4. `AuditEntityType` contains the three approved added values.
5. `RecurringItem` exists with only approved columns and zero rows immediately after migration.
6. `RecurringSuggestionDismissal` exists with only approved columns and zero rows immediately after migration.
7. `CategoryBudget` exists with only approved columns and zero rows immediately after migration.
8. Approved primary keys, unique index, owner-scoped indexes and foreign keys exist.
9. Aggregate row counts for existing tables are unchanged from pre-migration counts.
10. Public smoke checks remain healthy if supported by the workflow.

## Existing data integrity confirmation

The proposed migration is additive only:

- no existing table is dropped;
- no existing table rows are inserted, updated, deleted, backfilled, converted or rewritten;
- no existing column nullability/default is changed;
- no existing transaction, category, import, loan, property or report record is changed;
- no raw CSV/file/source/private data is introduced.

## Rollback notes

Before any Preview migration is run, rollback is simply to remove the proposed Prisma schema changes and migration folder from the branch.

If the Preview migration is approved and later needs rollback before implementation writes data:

1. Confirm the migration is Preview-only.
2. Confirm `RecurringItem`, `RecurringSuggestionDismissal` and `CategoryBudget` contain zero rows.
3. Stop for explicit rollback approval before any SQL.
4. A rollback plan would drop only the three new tables and four new enum types if unused.
5. Existing enum additions to `AuditEntityType` cannot be safely removed in PostgreSQL without type recreation, so rollback should prefer leaving the added enum values dormant unless the client approves a more invasive rollback plan.

No automatic rollback SQL is authorised by this plan.

## Production boundary

No Production migration is authorised.

Do not use Production secrets, Production database URLs, `prisma migrate dev`, `prisma migrate reset`, manual SQL, automatic retry, rollback SQL or migration history resolution without explicit approval.

## Stop point

Stop after PR #108 is merged.

Do not dispatch any Preview migration workflow until the client explicitly approves the exact committed migration files.

Do not begin PR 4.2 until the Preview migration succeeds and is verified.
