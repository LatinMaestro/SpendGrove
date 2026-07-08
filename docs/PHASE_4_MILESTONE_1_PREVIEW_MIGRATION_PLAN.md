# Phase 4 Milestone 1 Preview Migration Plan

Status: proposed - awaiting client approval before any Preview migration

Date: 8 July 2026

Related contract: `docs/PHASE_4_MILESTONE_1_CONTRACT.md`

## Purpose

Phase 4 Milestone 1 needs minimal durable state for:

- user-confirmed recurring/subscription records;
- user-dismissed recurring/subscription suggestion keys;
- user-entered monthly category budgets.

This plan proposes the exact additive Prisma schema and SQL migration required before PR 4.2, PR 4.3 and PR 4.4 implementation.

No Preview migration may run until the client explicitly approves this plan. No Production migration is authorised.

## Scope summary

Approved migration intent:

1. Add enum `RecurringCadence`.
2. Add enum `RecurringItemStatus`.
3. Add enum `BudgetPeriod`.
4. Add enum `BudgetStatus`.
5. Add three safe audit entity values to existing `AuditEntityType`.
6. Add one `RecurringItem` table.
7. Add one `RecurringSuggestionDismissal` table.
8. Add one `CategoryBudget` table.
9. Add owner-scoped indexes and foreign keys.
10. Do not insert, update, delete, backfill, convert or rewrite existing rows.

## Proposed Prisma enum additions

```prisma
enum AuditEntityType {
  USER
  SETTINGS
  CATEGORY
  TRANSACTION
  IMPORT_BATCH
  IMPORT_ROW
  BANK_IMPORT_PROFILE
  MERCHANT_PROFILE
  MERCHANT_ALIAS
  MERCHANT_RULE
  PROPERTY
  LOAN_ACCOUNT
  LOAN_REPAYMENT
  LOAN_RECONCILIATION_LINK
  RECURRING_ITEM
  RECURRING_SUGGESTION_DISMISSAL
  CATEGORY_BUDGET
}

enum RecurringCadence {
  WEEKLY
  FORTNIGHTLY
  MONTHLY
  OTHER
}

enum RecurringItemStatus {
  ACTIVE
  ARCHIVED
}

enum BudgetPeriod {
  MONTHLY
}

enum BudgetStatus {
  ACTIVE
  ARCHIVED
}
```

## Proposed Prisma relation additions

Add to `User`:

```prisma
  recurringItems                RecurringItem[]
  recurringSuggestionDismissals RecurringSuggestionDismissal[]
  categoryBudgets               CategoryBudget[]
```

Add to `Category`:

```prisma
  recurringItems  RecurringItem[]
  categoryBudgets CategoryBudget[]
```

## Proposed Prisma models

```prisma
model RecurringItem {
  id                  String              @id @default(cuid())
  userId              String
  categoryId          String?
  label               String
  transactionType     TransactionType
  expectedAmountCents Int?
  cadence             RecurringCadence
  nextExpectedDate    DateTime?
  status              RecurringItemStatus @default(ACTIVE)
  archivedAt          DateTime?
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  @@index([userId, status])
  @@index([userId, categoryId])
  @@index([userId, cadence])
}

model RecurringSuggestionDismissal {
  id           String   @id @default(cuid())
  userId       String
  suggestionKey String
  dismissedAt  DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, suggestionKey])
  @@index([userId, dismissedAt])
}

model CategoryBudget {
  id          String       @id @default(cuid())
  userId      String
  categoryId  String
  amountCents Int
  period      BudgetPeriod @default(MONTHLY)
  status      BudgetStatus @default(ACTIVE)
  archivedAt  DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  @@index([userId, categoryId])
  @@index([userId, period, status])
  @@index([userId, categoryId, period, status])
}
```

## Field privacy review

### `RecurringItem`

Allowed durable fields:

- generated ID;
- authenticated `userId`;
- optional safe `categoryId`;
- user-confirmed safe `label`;
- `transactionType`;
- optional expected amount in integer cents;
- cadence enum;
- optional next expected date;
- lifecycle status and timestamps.

Forbidden and not included:

- raw bank narration;
- raw merchant description;
- raw CSV rows;
- filenames;
- account references;
- BSBs;
- card/customer IDs;
- loan/lender references;
- masked identifiers;
- exact addresses;
- balances;
- source snapshots.

### `RecurringSuggestionDismissal`

`suggestionKey` must be a safe deterministic key derived only from approved safe facts, such as category ID, transaction type, cadence and rounded/normalised non-private evidence. It must not contain raw narration, filenames, account references, exact descriptions or private source details.

If implementation cannot build a safe non-private dismissal key, stop before PR 4.2.

### `CategoryBudget`

Allowed durable fields:

- generated ID;
- authenticated `userId`;
- category ID;
- integer-cent amount;
- monthly period enum;
- lifecycle status and timestamps.

No source transaction data, raw CSV data or private identifiers are copied into budget records.

## Exact proposed migration SQL

Migration folder name proposed:

`prisma/migrations/20260708090000_phase_4_recurring_budgets_foundation/`

Proposed `migration.sql`:

```sql
-- CreateEnum
CREATE TYPE "RecurringCadence" AS ENUM ('WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'OTHER');

-- CreateEnum
CREATE TYPE "RecurringItemStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BudgetPeriod" AS ENUM ('MONTHLY');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE IF NOT EXISTS 'RECURRING_ITEM';
ALTER TYPE "AuditEntityType" ADD VALUE IF NOT EXISTS 'RECURRING_SUGGESTION_DISMISSAL';
ALTER TYPE "AuditEntityType" ADD VALUE IF NOT EXISTS 'CATEGORY_BUDGET';

-- CreateTable
CREATE TABLE "RecurringItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "label" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "expectedAmountCents" INTEGER,
    "cadence" "RecurringCadence" NOT NULL,
    "nextExpectedDate" TIMESTAMP(3),
    "status" "RecurringItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringSuggestionDismissal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "suggestionKey" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringSuggestionDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryBudget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "period" "BudgetPeriod" NOT NULL DEFAULT 'MONTHLY',
    "status" "BudgetStatus" NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringItem_userId_status_idx" ON "RecurringItem"("userId", "status");

-- CreateIndex
CREATE INDEX "RecurringItem_userId_categoryId_idx" ON "RecurringItem"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "RecurringItem_userId_cadence_idx" ON "RecurringItem"("userId", "cadence");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringSuggestionDismissal_userId_suggestionKey_key" ON "RecurringSuggestionDismissal"("userId", "suggestionKey");

-- CreateIndex
CREATE INDEX "RecurringSuggestionDismissal_userId_dismissedAt_idx" ON "RecurringSuggestionDismissal"("userId", "dismissedAt");

-- CreateIndex
CREATE INDEX "CategoryBudget_userId_categoryId_idx" ON "CategoryBudget"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "CategoryBudget_userId_period_status_idx" ON "CategoryBudget"("userId", "period", "status");

-- CreateIndex
CREATE INDEX "CategoryBudget_userId_categoryId_period_status_idx" ON "CategoryBudget"("userId", "categoryId", "period", "status");

-- AddForeignKey
ALTER TABLE "RecurringItem" ADD CONSTRAINT "RecurringItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringItem" ADD CONSTRAINT "RecurringItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringSuggestionDismissal" ADD CONSTRAINT "RecurringSuggestionDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryBudget" ADD CONSTRAINT "CategoryBudget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryBudget" ADD CONSTRAINT "CategoryBudget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

## Unique and index rules

`RecurringItem`:

- No database unique rule is proposed in Milestone 1 because users may legitimately have more than one recurring item in the same category/cadence.
- Server code must prevent accidental duplicate confirmation using the approved safe evidence rules.
- Owner-scoped indexes support status lists, category filtering and cadence review.

`RecurringSuggestionDismissal`:

- Unique `[userId, suggestionKey]` prevents duplicate dismissal records for the same safe suggestion pattern.
- Dismissal keys must be private-safe and must not encode raw source text.

`CategoryBudget`:

- No database unique rule is proposed for active budgets because Prisma cannot express a portable partial unique active-only index cleanly in the schema.
- Server code must enforce one active monthly budget per user/category.
- Owner-scoped indexes support category, period and active/archive filtering.

## Rollback notes

Before any Preview migration is run, rollback is simply to remove the proposed Prisma schema changes and migration folder from the branch.

If the Preview migration is approved and later needs rollback before implementation writes data:

1. Confirm the migration is Preview-only.
2. Confirm `RecurringItem`, `RecurringSuggestionDismissal` and `CategoryBudget` contain zero rows.
3. Stop for explicit rollback approval before any SQL.
4. A rollback plan would drop only the three new tables and four new enum types if they are unused.
5. Existing enum additions to `AuditEntityType` cannot be safely removed in PostgreSQL without type recreation, so rollback should prefer leaving the added enum values dormant unless the client approves a more invasive rollback plan.

No automatic rollback SQL is authorised by this plan.

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
5. `RecurringItem` exists with only approved columns.
6. `RecurringSuggestionDismissal` exists with only approved columns.
7. `CategoryBudget` exists with only approved columns.
8. New tables contain zero rows immediately after migration.
9. Approved primary keys, indexes and foreign keys exist.
10. Aggregate row counts for existing tables are unchanged from pre-migration counts.
11. Public smoke checks remain healthy if supported by the workflow.

## Existing data integrity confirmation

The proposed migration is additive only:

- no existing table is dropped;
- no existing table rows are inserted, updated, deleted, backfilled, converted or rewritten;
- no existing column nullability/default is changed;
- no existing transaction, category, import, loan, property or report record is changed;
- no raw CSV/file/source/private data is introduced.

## Production boundary

No Production migration is authorised.

Do not use Production secrets, Production database URLs, `prisma migrate dev`, `prisma migrate reset`, manual SQL, automatic retry, rollback SQL or migration history resolution without explicit approval.

## Stop point

This plan is the PR 4.1 migration gate.

Stop here and wait for explicit client approval before:

- creating or merging executable schema/migration files if the client wants a separate amendment;
- dispatching any Preview migration workflow;
- starting PR 4.2 implementation.
