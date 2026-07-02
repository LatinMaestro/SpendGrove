-- Add minimum user-reviewed Property reporting metadata without copying source or financial values.
CREATE TYPE "PropertyRecordClassification" AS ENUM (
  'PROPERTY_INCOME',
  'PROPERTY_OUTGOING',
  'REFUND_OR_REVERSAL',
  'LOAN_PAYMENT_CONTEXT',
  'TRANSFER_CONTEXT',
  'OTHER_PROPERTY_RECORD',
  'EXCLUDED'
);

CREATE TABLE "PropertyReportReview" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "classification" "PropertyRecordClassification" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PropertyReportReview_pkey" PRIMARY KEY ("id")
);

-- One transaction can be reviewed for at most one Property report, preventing cross-Property double counting.
CREATE UNIQUE INDEX "PropertyReportReview_transactionId_key"
ON "PropertyReportReview"("transactionId");

CREATE INDEX "PropertyReportReview_userId_propertyId_classification_idx"
ON "PropertyReportReview"("userId", "propertyId", "classification");

CREATE INDEX "PropertyReportReview_userId_classification_idx"
ON "PropertyReportReview"("userId", "classification");

ALTER TABLE "PropertyReportReview"
ADD CONSTRAINT "PropertyReportReview_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyReportReview"
ADD CONSTRAINT "PropertyReportReview_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PropertyReportReview"
ADD CONSTRAINT "PropertyReportReview_transactionId_fkey"
FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
