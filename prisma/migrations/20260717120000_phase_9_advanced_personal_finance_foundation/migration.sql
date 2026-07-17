-- AlterEnum
ALTER TYPE "RecurringItemStatus" ADD VALUE 'PAUSED';
ALTER TYPE "RecurringItemStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "RecurringItemStatus" ADD VALUE 'UNKNOWN';
ALTER TYPE "RecurringItemStatus" ADD VALUE 'NEEDS_REVIEW';

-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE 'RECURRING_INSTANCE';
ALTER TYPE "AuditEntityType" ADD VALUE 'SAVINGS_GOAL';
ALTER TYPE "AuditEntityType" ADD VALUE 'SAVINGS_GOAL_CONTRIBUTION';
ALTER TYPE "AuditEntityType" ADD VALUE 'NET_WORTH_ITEM';
ALTER TYPE "AuditEntityType" ADD VALUE 'NET_WORTH_VALUATION';
ALTER TYPE "AuditEntityType" ADD VALUE 'NET_WORTH_SNAPSHOT';
ALTER TYPE "AuditEntityType" ADD VALUE 'REMINDER_PREFERENCE';
ALTER TYPE "AuditEntityType" ADD VALUE 'REMINDER';

-- CreateEnum
CREATE TYPE "RecurringItemSource" AS ENUM ('MANUAL', 'CONFIRMED_SUGGESTION');

-- CreateEnum
CREATE TYPE "RecurringDetectionConfidence" AS ENUM ('USER_CONFIRMED', 'CLEAR_PATTERN', 'REVIEW_PATTERN');

-- CreateEnum
CREATE TYPE "SavingsGoalStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NetWorthItemKind" AS ENUM ('ASSET', 'LIABILITY');

-- CreateEnum
CREATE TYPE "NetWorthItemCategory" AS ENUM (
  'CASH',
  'PROPERTY',
  'INVESTMENT',
  'SUPERANNUATION',
  'VEHICLE',
  'OTHER_ASSET',
  'HOME_LOAN',
  'PERSONAL_LOAN',
  'CREDIT_CARD',
  'OTHER_LIABILITY'
);

-- CreateEnum
CREATE TYPE "NetWorthItemStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReminderFamily" AS ENUM (
  'RECURRING_EXPECTED_DATE',
  'BUDGET_EIGHTY_PERCENT',
  'BUDGET_FULL',
  'IMPORT',
  'SAVINGS_GOAL',
  'UNMATCHED_LOAN',
  'EOFY_PREPARATION'
);

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'DISMISSED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "RecurringItem"
ADD COLUMN "expectedAmountMinCents" INTEGER,
ADD COLUMN "expectedAmountMaxCents" INTEGER,
ADD COLUMN "source" "RecurringItemSource",
ADD COLUMN "detectionConfidence" "RecurringDetectionConfidence";

-- CreateTable
CREATE TABLE "RecurringInstance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "recurringItemId" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unlinkedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecurringInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsGoal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "targetAmountCents" INTEGER NOT NULL,
  "targetDate" TIMESTAMP(3),
  "openingProgressCents" INTEGER NOT NULL DEFAULT 0,
  "status" "SavingsGoalStatus" NOT NULL DEFAULT 'ACTIVE',
  "completedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SavingsGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsGoalContribution" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "savingsGoalId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "contributionDate" TIMESTAMP(3) NOT NULL,
  "note" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SavingsGoalContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetWorthItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "propertyId" TEXT,
  "loanAccountId" TEXT,
  "name" TEXT NOT NULL,
  "kind" "NetWorthItemKind" NOT NULL,
  "category" "NetWorthItemCategory" NOT NULL,
  "status" "NetWorthItemStatus" NOT NULL DEFAULT 'ACTIVE',
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NetWorthItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetWorthValuation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "netWorthItemId" TEXT NOT NULL,
  "valueCents" INTEGER NOT NULL,
  "valuationDate" TIMESTAMP(3) NOT NULL,
  "note" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NetWorthValuation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetWorthSnapshot" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "snapshotDate" TIMESTAMP(3) NOT NULL,
  "totalAssetCents" INTEGER NOT NULL,
  "totalLiabilityCents" INTEGER NOT NULL,
  "netWorthCents" INTEGER NOT NULL,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NetWorthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetWorthSnapshotEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "snapshotId" TEXT NOT NULL,
  "netWorthItemId" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "kind" "NetWorthItemKind" NOT NULL,
  "category" "NetWorthItemCategory" NOT NULL,
  "valueCents" INTEGER NOT NULL,
  "valuationDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NetWorthSnapshotEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "family" "ReminderFamily" NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT false,
  "leadDays" INTEGER NOT NULL DEFAULT 0,
  "thresholdPercent" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReminderPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "family" "ReminderFamily" NOT NULL,
  "sourceEntityId" TEXT,
  "dedupeKey" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "status" "ReminderStatus" NOT NULL DEFAULT 'ACTIVE',
  "acknowledgedAt" TIMESTAMP(3),
  "dismissedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecurringInstance_transactionId_key" ON "RecurringInstance"("transactionId");
CREATE INDEX "RecurringInstance_userId_recurringItemId_unlinkedAt_idx" ON "RecurringInstance"("userId", "recurringItemId", "unlinkedAt");
CREATE INDEX "RecurringInstance_userId_transactionId_unlinkedAt_idx" ON "RecurringInstance"("userId", "transactionId", "unlinkedAt");

CREATE UNIQUE INDEX "SavingsGoal_userId_name_key" ON "SavingsGoal"("userId", "name");
CREATE INDEX "SavingsGoal_userId_status_targetDate_idx" ON "SavingsGoal"("userId", "status", "targetDate");

CREATE INDEX "SavingsGoalContribution_userId_savingsGoalId_contributionDate_idx" ON "SavingsGoalContribution"("userId", "savingsGoalId", "contributionDate");
CREATE INDEX "SavingsGoalContribution_userId_deletedAt_idx" ON "SavingsGoalContribution"("userId", "deletedAt");

CREATE UNIQUE INDEX "NetWorthItem_userId_name_key" ON "NetWorthItem"("userId", "name");
CREATE UNIQUE INDEX "NetWorthItem_userId_propertyId_key" ON "NetWorthItem"("userId", "propertyId");
CREATE UNIQUE INDEX "NetWorthItem_userId_loanAccountId_key" ON "NetWorthItem"("userId", "loanAccountId");
CREATE INDEX "NetWorthItem_userId_kind_status_idx" ON "NetWorthItem"("userId", "kind", "status");
CREATE INDEX "NetWorthItem_userId_category_status_idx" ON "NetWorthItem"("userId", "category", "status");

CREATE UNIQUE INDEX "NetWorthValuation_netWorthItemId_valuationDate_key" ON "NetWorthValuation"("netWorthItemId", "valuationDate");
CREATE INDEX "NetWorthValuation_userId_valuationDate_idx" ON "NetWorthValuation"("userId", "valuationDate");
CREATE INDEX "NetWorthValuation_userId_deletedAt_idx" ON "NetWorthValuation"("userId", "deletedAt");

CREATE UNIQUE INDEX "NetWorthSnapshot_userId_snapshotDate_key" ON "NetWorthSnapshot"("userId", "snapshotDate");
CREATE INDEX "NetWorthSnapshot_userId_archivedAt_snapshotDate_idx" ON "NetWorthSnapshot"("userId", "archivedAt", "snapshotDate");

CREATE UNIQUE INDEX "NetWorthSnapshotEntry_snapshotId_netWorthItemId_key" ON "NetWorthSnapshotEntry"("snapshotId", "netWorthItemId");
CREATE INDEX "NetWorthSnapshotEntry_userId_snapshotId_idx" ON "NetWorthSnapshotEntry"("userId", "snapshotId");

CREATE UNIQUE INDEX "ReminderPreference_userId_family_key" ON "ReminderPreference"("userId", "family");
CREATE INDEX "ReminderPreference_userId_isEnabled_idx" ON "ReminderPreference"("userId", "isEnabled");

CREATE UNIQUE INDEX "Reminder_userId_dedupeKey_key" ON "Reminder"("userId", "dedupeKey");
CREATE INDEX "Reminder_userId_status_dueDate_idx" ON "Reminder"("userId", "status", "dueDate");
CREATE INDEX "Reminder_userId_family_status_idx" ON "Reminder"("userId", "family", "status");

CREATE INDEX "RecurringItem_userId_source_idx" ON "RecurringItem"("userId", "source");

-- AddForeignKey
ALTER TABLE "RecurringInstance" ADD CONSTRAINT "RecurringInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringInstance" ADD CONSTRAINT "RecurringInstance_recurringItemId_fkey" FOREIGN KEY ("recurringItemId") REFERENCES "RecurringItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringInstance" ADD CONSTRAINT "RecurringInstance_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavingsGoalContribution" ADD CONSTRAINT "SavingsGoalContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavingsGoalContribution" ADD CONSTRAINT "SavingsGoalContribution_savingsGoalId_fkey" FOREIGN KEY ("savingsGoalId") REFERENCES "SavingsGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NetWorthItem" ADD CONSTRAINT "NetWorthItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NetWorthItem" ADD CONSTRAINT "NetWorthItem_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NetWorthItem" ADD CONSTRAINT "NetWorthItem_loanAccountId_fkey" FOREIGN KEY ("loanAccountId") REFERENCES "LoanAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NetWorthValuation" ADD CONSTRAINT "NetWorthValuation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NetWorthValuation" ADD CONSTRAINT "NetWorthValuation_netWorthItemId_fkey" FOREIGN KEY ("netWorthItemId") REFERENCES "NetWorthItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NetWorthSnapshot" ADD CONSTRAINT "NetWorthSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NetWorthSnapshotEntry" ADD CONSTRAINT "NetWorthSnapshotEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NetWorthSnapshotEntry" ADD CONSTRAINT "NetWorthSnapshotEntry_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "NetWorthSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NetWorthSnapshotEntry" ADD CONSTRAINT "NetWorthSnapshotEntry_netWorthItemId_fkey" FOREIGN KEY ("netWorthItemId") REFERENCES "NetWorthItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ReminderPreference" ADD CONSTRAINT "ReminderPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
