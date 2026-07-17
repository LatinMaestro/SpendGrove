-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE 'TRANSFER_LINK';

-- CreateTable
CREATE TABLE "TransferLink" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "outgoingTransactionId" TEXT NOT NULL,
  "incomingTransactionId" TEXT NOT NULL,
  "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unlinkedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TransferLink_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TransferLink_distinct_transactions_check"
  CHECK ("outgoingTransactionId" <> "incomingTransactionId")
);

-- CreateIndex
CREATE INDEX "TransferLink_userId_unlinkedAt_createdAt_idx"
ON "TransferLink"("userId", "unlinkedAt", "createdAt");

-- CreateIndex
CREATE INDEX "TransferLink_userId_outgoingTransactionId_unlinkedAt_idx"
ON "TransferLink"("userId", "outgoingTransactionId", "unlinkedAt");

-- CreateIndex
CREATE INDEX "TransferLink_userId_incomingTransactionId_unlinkedAt_idx"
ON "TransferLink"("userId", "incomingTransactionId", "unlinkedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TransferLink_outgoingTransactionId_active_key"
ON "TransferLink"("outgoingTransactionId")
WHERE "unlinkedAt" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TransferLink_incomingTransactionId_active_key"
ON "TransferLink"("incomingTransactionId")
WHERE "unlinkedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "TransferLink"
ADD CONSTRAINT "TransferLink_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferLink"
ADD CONSTRAINT "TransferLink_outgoingTransactionId_fkey"
FOREIGN KEY ("outgoingTransactionId") REFERENCES "Transaction"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferLink"
ADD CONSTRAINT "TransferLink_incomingTransactionId_fkey"
FOREIGN KEY ("incomingTransactionId") REFERENCES "Transaction"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
