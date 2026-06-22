-- Add first-class loan CSV and safe audit entity values.
ALTER TYPE "ImportType" ADD VALUE 'LOAN_CSV';
ALTER TYPE "AuditEntityType" ADD VALUE 'PROPERTY';
ALTER TYPE "AuditEntityType" ADD VALUE 'LOAN_ACCOUNT';
ALTER TYPE "AuditEntityType" ADD VALUE 'LOAN_REPAYMENT';
ALTER TYPE "AuditEntityType" ADD VALUE 'LOAN_RECONCILIATION_LINK';

-- Create Phase 3B enums.
CREATE TYPE "PropertyUsage" AS ENUM ('OWNER_OCCUPIED', 'INVESTMENT', 'OTHER');
CREATE TYPE "LoanPurpose" AS ENUM ('OWNER_OCCUPIER', 'INVESTMENT', 'PERSONAL', 'OTHER');
CREATE TYPE "LoanType" AS ENUM ('HOME_LOAN', 'CAR_LOAN', 'PERSONAL_LOAN', 'OTHER');
CREATE TYPE "LoanRepaymentSource" AS ENUM ('MANUAL', 'LOAN_CSV');
CREATE TYPE "LoanReconciliationStatus" AS ENUM ('UNMATCHED', 'NEEDS_REVIEW', 'LINKED');
CREATE TYPE "LoanReconciliationConfidence" AS ENUM ('HIGH', 'MEDIUM', 'MANUAL');
CREATE TYPE "LoanReconciliationLinkMethod" AS ENUM ('SUGGESTED', 'MANUAL');
CREATE TYPE "LoanReconciliationReason" AS ENUM ('EXACT_AMOUNT_NEAR_DATE', 'ROUNDING_VARIANCE', 'EXACT_AMOUNT_DELAYED_DATE', 'MANUAL_OVERRIDE');

-- Create privacy-minimal property records. Exact addresses are intentionally absent.
CREATE TABLE "Property" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "nickname" TEXT NOT NULL,
  "usage" "PropertyUsage" NOT NULL,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "archivedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Property_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Property_nickname_safe_length" CHECK (char_length(trim("nickname")) BETWEEN 1 AND 80)
);

-- Create loan metadata without account numbers, masked references or lender references.
CREATE TABLE "LoanAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "propertyId" TEXT,
  "nickname" TEXT NOT NULL,
  "lenderName" TEXT,
  "purpose" "LoanPurpose" NOT NULL,
  "type" "LoanType" NOT NULL,
  "currentBalanceCents" INTEGER,
  "balanceAsOf" TIMESTAMP(3),
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "archivedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LoanAccount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LoanAccount_nickname_safe_length" CHECK (char_length(trim("nickname")) BETWEEN 1 AND 80),
  CONSTRAINT "LoanAccount_lender_name_safe_length" CHECK ("lenderName" IS NULL OR char_length(trim("lenderName")) BETWEEN 1 AND 80),
  CONSTRAINT "LoanAccount_current_balance_nonnegative" CHECK ("currentBalanceCents" IS NULL OR "currentBalanceCents" >= 0),
  CONSTRAINT "LoanAccount_balance_snapshot_complete" CHECK (
    ("currentBalanceCents" IS NULL AND "balanceAsOf" IS NULL)
    OR ("currentBalanceCents" IS NOT NULL AND "balanceAsOf" IS NOT NULL)
  )
);

-- Create the future durable repayment foundation. Milestone 1 does not write these rows.
CREATE TABLE "LoanRepayment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "loanAccountId" TEXT NOT NULL,
  "importBatchId" TEXT,
  "repaymentDate" TIMESTAMP(3) NOT NULL,
  "totalPaymentCents" INTEGER NOT NULL,
  "principalCents" INTEGER,
  "interestCents" INTEGER,
  "feeCents" INTEGER,
  "balanceAfterCents" INTEGER,
  "source" "LoanRepaymentSource" NOT NULL,
  "reconciliationStatus" "LoanReconciliationStatus" NOT NULL DEFAULT 'UNMATCHED',
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "archivedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LoanRepayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LoanRepayment_total_nonnegative" CHECK ("totalPaymentCents" >= 0),
  CONSTRAINT "LoanRepayment_principal_nonnegative" CHECK ("principalCents" IS NULL OR "principalCents" >= 0),
  CONSTRAINT "LoanRepayment_interest_nonnegative" CHECK ("interestCents" IS NULL OR "interestCents" >= 0),
  CONSTRAINT "LoanRepayment_fee_nonnegative" CHECK ("feeCents" IS NULL OR "feeCents" >= 0),
  CONSTRAINT "LoanRepayment_balance_nonnegative" CHECK ("balanceAfterCents" IS NULL OR "balanceAfterCents" >= 0),
  CONSTRAINT "LoanRepayment_known_components_within_total" CHECK (
    COALESCE("principalCents", 0) + COALESCE("interestCents", 0) + COALESCE("feeCents", 0)
    <= "totalPaymentCents" + 2
  ),
  CONSTRAINT "LoanRepayment_complete_components_reconcile" CHECK (
    "principalCents" IS NULL
    OR "interestCents" IS NULL
    OR "feeCents" IS NULL
    OR abs("totalPaymentCents" - ("principalCents" + "interestCents" + "feeCents")) <= 2
  )
);

-- Create the future review-only reconciliation link foundation.
CREATE TABLE "LoanReconciliationLink" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "loanRepaymentId" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "confidence" "LoanReconciliationConfidence" NOT NULL,
  "amountVarianceCents" INTEGER NOT NULL,
  "dateDifferenceDays" INTEGER NOT NULL,
  "method" "LoanReconciliationLinkMethod" NOT NULL,
  "reason" "LoanReconciliationReason" NOT NULL,
  "unlinkedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LoanReconciliationLink_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LoanReconciliationLink_date_difference_nonnegative" CHECK ("dateDifferenceDays" >= 0)
);

CREATE UNIQUE INDEX "Property_userId_nickname_key" ON "Property"("userId", "nickname");
CREATE INDEX "Property_userId_usage_idx" ON "Property"("userId", "usage");
CREATE INDEX "Property_userId_isArchived_deletedAt_idx" ON "Property"("userId", "isArchived", "deletedAt");

CREATE UNIQUE INDEX "LoanAccount_userId_nickname_key" ON "LoanAccount"("userId", "nickname");
CREATE INDEX "LoanAccount_userId_propertyId_idx" ON "LoanAccount"("userId", "propertyId");
CREATE INDEX "LoanAccount_userId_purpose_type_idx" ON "LoanAccount"("userId", "purpose", "type");
CREATE INDEX "LoanAccount_userId_isArchived_deletedAt_idx" ON "LoanAccount"("userId", "isArchived", "deletedAt");

CREATE INDEX "LoanRepayment_userId_loanAccountId_repaymentDate_idx" ON "LoanRepayment"("userId", "loanAccountId", "repaymentDate");
CREATE INDEX "LoanRepayment_userId_importBatchId_idx" ON "LoanRepayment"("userId", "importBatchId");
CREATE INDEX "LoanRepayment_userId_reconciliationStatus_idx" ON "LoanRepayment"("userId", "reconciliationStatus");
CREATE INDEX "LoanRepayment_userId_isArchived_deletedAt_idx" ON "LoanRepayment"("userId", "isArchived", "deletedAt");

CREATE UNIQUE INDEX "LoanReconciliationLink_loanRepaymentId_key" ON "LoanReconciliationLink"("loanRepaymentId");
CREATE INDEX "LoanReconciliationLink_userId_transactionId_idx" ON "LoanReconciliationLink"("userId", "transactionId");
CREATE INDEX "LoanReconciliationLink_userId_unlinkedAt_idx" ON "LoanReconciliationLink"("userId", "unlinkedAt");

ALTER TABLE "Property"
ADD CONSTRAINT "Property_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LoanAccount"
ADD CONSTRAINT "LoanAccount_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LoanAccount"
ADD CONSTRAINT "LoanAccount_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LoanRepayment"
ADD CONSTRAINT "LoanRepayment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LoanRepayment"
ADD CONSTRAINT "LoanRepayment_loanAccountId_fkey"
FOREIGN KEY ("loanAccountId") REFERENCES "LoanAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LoanRepayment"
ADD CONSTRAINT "LoanRepayment_importBatchId_fkey"
FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LoanReconciliationLink"
ADD CONSTRAINT "LoanReconciliationLink_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LoanReconciliationLink"
ADD CONSTRAINT "LoanReconciliationLink_loanRepaymentId_fkey"
FOREIGN KEY ("loanRepaymentId") REFERENCES "LoanRepayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LoanReconciliationLink"
ADD CONSTRAINT "LoanReconciliationLink_transactionId_fkey"
FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
