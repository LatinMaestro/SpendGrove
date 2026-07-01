-- Create the privacy-minimal, user-owned Property relationship for an everyday transaction.
CREATE TABLE "PropertyTransactionLink" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "unlinkedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PropertyTransactionLink_pkey" PRIMARY KEY ("id")
);

-- One transaction has one durable link record and at most one active Property relationship.
CREATE UNIQUE INDEX "PropertyTransactionLink_transactionId_key"
ON "PropertyTransactionLink"("transactionId");

CREATE INDEX "PropertyTransactionLink_userId_propertyId_unlinkedAt_idx"
ON "PropertyTransactionLink"("userId", "propertyId", "unlinkedAt");

CREATE INDEX "PropertyTransactionLink_userId_unlinkedAt_idx"
ON "PropertyTransactionLink"("userId", "unlinkedAt");

ALTER TABLE "PropertyTransactionLink"
ADD CONSTRAINT "PropertyTransactionLink_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyTransactionLink"
ADD CONSTRAINT "PropertyTransactionLink_transactionId_fkey"
FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PropertyTransactionLink"
ADD CONSTRAINT "PropertyTransactionLink_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
