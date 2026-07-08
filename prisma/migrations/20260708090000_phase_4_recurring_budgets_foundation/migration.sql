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
