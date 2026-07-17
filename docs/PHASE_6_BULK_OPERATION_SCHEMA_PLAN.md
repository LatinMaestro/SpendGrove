# Phase 6 Bulk Operation Schema and Preview Migration Plan

Prepared: 17 July 2026  
Status: exact proposal; no schema file or migration file changed by this document

## User requirement

Safe multi-record category and Property actions need durable per-record outcomes and concurrency-safe undo. AuditEvent is intentionally aggregate and cannot safely serve as a financial undo journal.

## Exact Prisma enum additions

```prisma
enum BulkOperationType {
  SET_CATEGORY
  APPLY_MERCHANT_CATEGORY
  LINK_PROPERTY
  UNLINK_PROPERTY
}

enum BulkOperationStatus {
  RUNNING
  COMPLETED
  PARTIAL
  FAILED
  REVERTED
  PARTIALLY_REVERTED
}

enum BulkOperationItemStatus {
  APPLIED
  SKIPPED
  FAILED
  REVERTED
  UNDO_BLOCKED
}

enum BulkOperationReason {
  ALREADY_APPLIED
  ALREADY_LINKED_TO_PROPERTY
  ALREADY_LINKED_TO_ANOTHER_PROPERTY
  CATEGORY_INCOMPATIBLE
  CATEGORY_UNAVAILABLE
  PROPERTY_UNAVAILABLE
  NOT_ACTIVE
  SPLIT_PARENT
  DIRECTION_NEEDS_CORRECTION
  MERCHANT_IDENTITY_MISMATCH
  STALE_RECORD
  NOT_FOUND_OR_NOT_OWNED
  UNEXPECTED_SAFE_FAILURE
}
```

Add to AuditEntityType:

```prisma
BULK_OPERATION
```

No AuditAction addition is required. CREATED records operation creation; UPDATED records finalization/undo.

## Exact Prisma models

```prisma
model BulkOperation {
  id               String              @id @default(cuid())
  userId           String
  type             BulkOperationType
  status           BulkOperationStatus @default(RUNNING)
  targetCategoryId String?
  targetPropertyId String?
  requestedCount   Int                 @default(0)
  appliedCount     Int                 @default(0)
  skippedCount     Int                 @default(0)
  failedCount      Int                 @default(0)
  undoBlockedCount Int                 @default(0)
  createdAt        DateTime            @default(now())
  completedAt      DateTime?
  undoExpiresAt    DateTime?
  revertedAt       DateTime?
  updatedAt        DateTime            @updatedAt

  user           User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  targetCategory Category?           @relation("BulkOperationTargetCategory", fields: [targetCategoryId], references: [id], onDelete: SetNull)
  targetProperty Property?           @relation("BulkOperationTargetProperty", fields: [targetPropertyId], references: [id], onDelete: SetNull)
  items          BulkOperationItem[]

  @@index([userId, status, createdAt])
  @@index([userId, type, createdAt])
  @@index([targetCategoryId])
  @@index([targetPropertyId])
}

model BulkOperationItem {
  id                         String                  @id @default(cuid())
  userId                     String
  operationId                String
  transactionId              String
  status                     BulkOperationItemStatus
  reason                     BulkOperationReason?
  beforeCategoryId           String?
  afterCategoryId            String?
  beforePropertyId           String?
  afterPropertyId            String?
  beforeTransactionUpdatedAt DateTime?
  appliedTransactionUpdatedAt DateTime?
  revertedAt                 DateTime?
  createdAt                  DateTime                @default(now())
  updatedAt                  DateTime                @updatedAt

  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  operation   BulkOperation @relation(fields: [operationId], references: [id], onDelete: Cascade)
  transaction Transaction   @relation(fields: [transactionId], references: [id], onDelete: Cascade)

  @@unique([operationId, transactionId])
  @@index([userId, status, createdAt])
  @@index([operationId, status])
  @@index([transactionId, createdAt])
}
```

Formatting note: final Prisma format may align field spacing only; names/types/relations above are authoritative.

## Exact relation additions

User:

```prisma
bulkOperations      BulkOperation[]
bulkOperationItems  BulkOperationItem[]
```

Category:

```prisma
bulkTargetOperations BulkOperation[] @relation("BulkOperationTargetCategory")
```

Transaction:

```prisma
bulkOperationItems BulkOperationItem[]
```

Property:

```prisma
bulkTargetOperations BulkOperation[] @relation("BulkOperationTargetProperty")
```

## Proposed migration folder

```text
prisma/migrations/20260717090000_phase_6_bulk_operation_foundation/
```

The timestamp/name must remain exact once the migration file is committed.

## Exact proposed migration SQL

```sql
-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE 'BULK_OPERATION';

-- CreateEnum
CREATE TYPE "BulkOperationType" AS ENUM (
  'SET_CATEGORY',
  'APPLY_MERCHANT_CATEGORY',
  'LINK_PROPERTY',
  'UNLINK_PROPERTY'
);

-- CreateEnum
CREATE TYPE "BulkOperationStatus" AS ENUM (
  'RUNNING',
  'COMPLETED',
  'PARTIAL',
  'FAILED',
  'REVERTED',
  'PARTIALLY_REVERTED'
);

-- CreateEnum
CREATE TYPE "BulkOperationItemStatus" AS ENUM (
  'APPLIED',
  'SKIPPED',
  'FAILED',
  'REVERTED',
  'UNDO_BLOCKED'
);

-- CreateEnum
CREATE TYPE "BulkOperationReason" AS ENUM (
  'ALREADY_APPLIED',
  'ALREADY_LINKED_TO_PROPERTY',
  'ALREADY_LINKED_TO_ANOTHER_PROPERTY',
  'CATEGORY_INCOMPATIBLE',
  'CATEGORY_UNAVAILABLE',
  'PROPERTY_UNAVAILABLE',
  'NOT_ACTIVE',
  'SPLIT_PARENT',
  'DIRECTION_NEEDS_CORRECTION',
  'MERCHANT_IDENTITY_MISMATCH',
  'STALE_RECORD',
  'NOT_FOUND_OR_NOT_OWNED',
  'UNEXPECTED_SAFE_FAILURE'
);

-- CreateTable
CREATE TABLE "BulkOperation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "BulkOperationType" NOT NULL,
  "status" "BulkOperationStatus" NOT NULL DEFAULT 'RUNNING',
  "targetCategoryId" TEXT,
  "targetPropertyId" TEXT,
  "requestedCount" INTEGER NOT NULL DEFAULT 0,
  "appliedCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "undoBlockedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "undoExpiresAt" TIMESTAMP(3),
  "revertedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BulkOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkOperationItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "operationId" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "status" "BulkOperationItemStatus" NOT NULL,
  "reason" "BulkOperationReason",
  "beforeCategoryId" TEXT,
  "afterCategoryId" TEXT,
  "beforePropertyId" TEXT,
  "afterPropertyId" TEXT,
  "beforeTransactionUpdatedAt" TIMESTAMP(3),
  "appliedTransactionUpdatedAt" TIMESTAMP(3),
  "revertedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BulkOperationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BulkOperation_userId_status_createdAt_idx"
ON "BulkOperation"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BulkOperation_userId_type_createdAt_idx"
ON "BulkOperation"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "BulkOperation_targetCategoryId_idx"
ON "BulkOperation"("targetCategoryId");

-- CreateIndex
CREATE INDEX "BulkOperation_targetPropertyId_idx"
ON "BulkOperation"("targetPropertyId");

-- CreateIndex
CREATE UNIQUE INDEX "BulkOperationItem_operationId_transactionId_key"
ON "BulkOperationItem"("operationId", "transactionId");

-- CreateIndex
CREATE INDEX "BulkOperationItem_userId_status_createdAt_idx"
ON "BulkOperationItem"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BulkOperationItem_operationId_status_idx"
ON "BulkOperationItem"("operationId", "status");

-- CreateIndex
CREATE INDEX "BulkOperationItem_transactionId_createdAt_idx"
ON "BulkOperationItem"("transactionId", "createdAt");

-- AddForeignKey
ALTER TABLE "BulkOperation"
ADD CONSTRAINT "BulkOperation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOperation"
ADD CONSTRAINT "BulkOperation_targetCategoryId_fkey"
FOREIGN KEY ("targetCategoryId") REFERENCES "Category"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOperation"
ADD CONSTRAINT "BulkOperation_targetPropertyId_fkey"
FOREIGN KEY ("targetPropertyId") REFERENCES "Property"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOperationItem"
ADD CONSTRAINT "BulkOperationItem_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOperationItem"
ADD CONSTRAINT "BulkOperationItem_operationId_fkey"
FOREIGN KEY ("operationId") REFERENCES "BulkOperation"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkOperationItem"
ADD CONSTRAINT "BulkOperationItem_transactionId_fkey"
FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
```

## Ownership assessment

- direct userId exists on operation and item;
- every service query must include userId even when traversing relations;
- target category/Property ownership is enforced server-side;
- database foreign keys guarantee existence, not same-user ownership;
- two-user tests remain mandatory.

## Privacy assessment

Stored IDs reveal relationships only inside the owned database boundary. No amount, description, narration, filename, account identifier or broad snapshot is duplicated.

Audit metadata remains aggregate.

## Financial assessment

The models store operation intent/outcome only. They do not change calculation queries. Transaction amount/date/type/split remain authoritative and untouched by initial actions.

## Account export

Add a safe top-level bulkOperations summary containing:

- operation ID;
- type/status;
- requested/applied/skipped/failed/undo-blocked counts;
- created/completed/reverted timestamps.

Exclude BulkOperationItem before/after IDs from the normal export unless later portability review requires them.

## Account deletion

User cascade deletes BulkOperation and BulkOperationItem. Transaction cascade also protects item cleanup. Deletion integration tests must prove no restriction blocks User deletion.

## Existing data safety

The migration:

- adds one AuditEntityType value;
- creates four enum types;
- creates two empty tables;
- adds indexes/foreign keys;
- does not alter, update, rewrite, backfill or delete any Phase 1–5 row;
- does not lock an existing high-volume table for column rewrite.

The AuditEntityType enum addition requires a short catalog lock only.

## Pre-migration safe checks

- exact main commit and migration checksum;
- no failed/unresolved Preview migration;
- migration not already applied;
- enum value absent;
- new tables absent;
- safe aggregate counts for User, Category, Transaction, ImportBatch, ImportRow, Property, LoanAccount, LoanRepayment, PropertyTransactionLink, RecurringItem and CategoryBudget;
- Preview-only secrets;
- no Production URL/secret mapping.

## Post-migration safe checks

- migration recorded exactly once;
- no failed migration;
- enum values exact;
- two tables, columns, indexes, unique constraint and FKs exact;
- new tables contain zero rows;
- existing aggregate counts unchanged;
- application smoke remains healthy.

No row contents or connection values may be printed.

## Rollback / forward-fix

Before Production use, rollback in an isolated Preview branch/database may drop:

1. BulkOperationItem;
2. BulkOperation;
3. the four new enum types.

Removing BULK_OPERATION from PostgreSQL AuditEntityType is not a simple safe reverse migration. Therefore:

- do not attempt enum-value removal in a live shared database;
- prefer a forward-fix;
- Production migration requires a separate exact approval and backup/recovery proof.

No rollback SQL is authorised by this document.

## Packages/providers/environment

None.

## Gate decision

After this document merges:

1. a focused schema-foundation PR may add the exact Prisma and migration files;
2. it must stop before any migration;
3. the Preview workflow checker must be updated for the exact profile;
4. Preview migration may run only under the merged complete-product migration authority with exact-head green checks and Preview-only secret mapping;
5. no Production migration is authorised.
