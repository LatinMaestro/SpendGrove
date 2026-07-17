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
