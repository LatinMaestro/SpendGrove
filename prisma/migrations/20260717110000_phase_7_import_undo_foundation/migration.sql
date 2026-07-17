-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE 'IMPORT_UNDO_OPERATION';

-- CreateEnum
CREATE TYPE "ImportUndoOperationStatus" AS ENUM (
  'RUNNING',
  'UNDONE',
  'PARTIAL',
  'FAILED',
  'RESTORING',
  'RESTORED',
  'PARTIALLY_RESTORED'
);

-- CreateEnum
CREATE TYPE "ImportUndoItemStatus" AS ENUM (
  'PENDING',
  'UNDONE',
  'NO_CHANGE',
  'BLOCKED',
  'FAILED',
  'RESTORED',
  'RESTORE_BLOCKED'
);

-- CreateEnum
CREATE TYPE "ImportUndoReason" AS ENUM (
  'SKIPPED_ROW',
  'MERGED_ROW_NO_CHANGE',
  'EXISTING_BATCH_UNSUPPORTED',
  'TRANSACTION_NOT_ACTIVE',
  'TRANSACTION_CHANGED',
  'SPLIT_CHANGED',
  'ACTIVE_LOAN_RECONCILIATION',
  'ACTIVE_TRANSFER_LINK',
  'PROPERTY_STATE_CHANGED',
  'PROPERTY_REVIEW_EXISTS',
  'BULK_OPERATION_DEPENDENCY',
  'OWNERSHIP_OR_LINK_MISMATCH',
  'RESTORE_STATE_CHANGED',
  'UNEXPECTED_SAFE_FAILURE'
);

-- AlterTable
ALTER TABLE "ImportRow"
ADD COLUMN "committedTransactionUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ImportUndoOperation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "importBatchId" TEXT NOT NULL,
  "status" "ImportUndoOperationStatus" NOT NULL DEFAULT 'RUNNING',
  "requestedCount" INTEGER NOT NULL DEFAULT 0,
  "undoneCount" INTEGER NOT NULL DEFAULT 0,
  "noChangeCount" INTEGER NOT NULL DEFAULT 0,
  "blockedCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "restoredCount" INTEGER NOT NULL DEFAULT 0,
  "restoreBlockedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "restoredAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ImportUndoOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportUndoItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "operationId" TEXT NOT NULL,
  "importRowId" TEXT NOT NULL,
  "transactionId" TEXT,
  "status" "ImportUndoItemStatus" NOT NULL DEFAULT 'PENDING',
  "reason" "ImportUndoReason",
  "beforeTransactionUpdatedAt" TIMESTAMP(3),
  "appliedTransactionUpdatedAt" TIMESTAMP(3),
  "undoneAt" TIMESTAMP(3),
  "restoredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ImportUndoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportUndoOperation_importBatchId_key"
ON "ImportUndoOperation"("importBatchId");

-- CreateIndex
CREATE INDEX "ImportUndoOperation_userId_status_createdAt_idx"
ON "ImportUndoOperation"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ImportUndoOperation_userId_createdAt_idx"
ON "ImportUndoOperation"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ImportUndoItem_operationId_importRowId_key"
ON "ImportUndoItem"("operationId", "importRowId");

-- CreateIndex
CREATE INDEX "ImportUndoItem_userId_status_createdAt_idx"
ON "ImportUndoItem"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ImportUndoItem_operationId_status_idx"
ON "ImportUndoItem"("operationId", "status");

-- CreateIndex
CREATE INDEX "ImportUndoItem_transactionId_idx"
ON "ImportUndoItem"("transactionId");

-- AddForeignKey
ALTER TABLE "ImportUndoOperation"
ADD CONSTRAINT "ImportUndoOperation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportUndoOperation"
ADD CONSTRAINT "ImportUndoOperation_importBatchId_fkey"
FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportUndoItem"
ADD CONSTRAINT "ImportUndoItem_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportUndoItem"
ADD CONSTRAINT "ImportUndoItem_operationId_fkey"
FOREIGN KEY ("operationId") REFERENCES "ImportUndoOperation"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportUndoItem"
ADD CONSTRAINT "ImportUndoItem_importRowId_fkey"
FOREIGN KEY ("importRowId") REFERENCES "ImportRow"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportUndoItem"
ADD CONSTRAINT "ImportUndoItem_transactionId_fkey"
FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
