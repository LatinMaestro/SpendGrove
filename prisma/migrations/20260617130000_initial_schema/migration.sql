-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('CLERK');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED', 'DELETED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('MANUAL', 'IMPORTED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('ACTIVE', 'NEEDS_REVIEW', 'DELETED');

-- CreateEnum
CREATE TYPE "SplitRole" AS ENUM ('NONE', 'PARENT', 'CHILD');

-- CreateEnum
CREATE TYPE "ImportType" AS ENUM ('TRANSACTION_CSV');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('CREATED', 'SCANNING', 'MAPPING_REQUIRED', 'REVIEW_READY', 'REVIEWING', 'CONFIRMING', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportRowAction" AS ENUM ('UNDECIDED', 'IMPORT', 'SKIP', 'MERGE');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('NEEDS_REVIEW', 'READY', 'WARNING', 'COMMITTED', 'SKIPPED', 'MERGED', 'FAILED');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "MerchantRuleType" AS ENUM ('EXACT', 'CONTAINS', 'STARTS_WITH', 'REGEX');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('USER', 'SETTINGS', 'CATEGORY', 'TRANSACTION', 'IMPORT_BATCH', 'IMPORT_ROW', 'BANK_IMPORT_PROFILE', 'MERCHANT_PROFILE', 'MERCHANT_ALIAS', 'MERCHANT_RULE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'ARCHIVED', 'DEACTIVATED', 'IMPORTED', 'SKIPPED', 'MERGED', 'REVIEWED', 'PRIVACY_FIELDS_EXCLUDED');

-- CreateTable
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "authProvider" "AuthProvider",
  "authProviderUserId" TEXT,
  "email" TEXT,
  "name" TEXT,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "country" TEXT NOT NULL DEFAULT 'AU',
  "timezone" TEXT NOT NULL DEFAULT 'Australia/Brisbane',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "simpleMode" BOOLEAN NOT NULL DEFAULT true,
  "currency" TEXT NOT NULL DEFAULT 'AUD',
  "locale" TEXT NOT NULL DEFAULT 'en-AU',
  "financialYearStartMonth" INTEGER NOT NULL DEFAULT 7,
  "featureFlags" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "CategoryType" NOT NULL,
  "parentId" TEXT,
  "colour" TEXT,
  "icon" TEXT,
  "isSeeded" BOOLEAN NOT NULL DEFAULT false,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP(3),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "categoryId" TEXT,
  "importBatchId" TEXT,
  "merchantProfileId" TEXT,
  "type" "TransactionType" NOT NULL,
  "source" "TransactionSource" NOT NULL,
  "status" "TransactionStatus" NOT NULL DEFAULT 'ACTIVE',
  "splitRole" "SplitRole" NOT NULL DEFAULT 'NONE',
  "parentTransactionId" TEXT,
  "amountCents" INTEGER NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "description" TEXT NOT NULL,
  "importedDescriptionSanitized" TEXT,
  "merchantName" TEXT,
  "notes" TEXT,
  "csvMatchHint" BOOLEAN NOT NULL DEFAULT false,
  "importFingerprint" TEXT,
  "duplicateKey" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "ImportType" NOT NULL DEFAULT 'TRANSACTION_CSV',
  "status" "ImportBatchStatus" NOT NULL DEFAULT 'CREATED',
  "bankImportProfileId" TEXT,
  "safeFileName" TEXT,
  "originalFileNameRedacted" TEXT,
  "fileNameHash" TEXT,
  "fileSizeBytes" INTEGER,
  "rowCount" INTEGER NOT NULL DEFAULT 0,
  "parsedRowCount" INTEGER NOT NULL DEFAULT 0,
  "privateFieldCount" INTEGER NOT NULL DEFAULT 0,
  "importedCount" INTEGER NOT NULL DEFAULT 0,
  "skippedCount" INTEGER NOT NULL DEFAULT 0,
  "mergedCount" INTEGER NOT NULL DEFAULT 0,
  "detectedBankName" TEXT,
  "detectedAccountType" TEXT,
  "mappingSummary" JSONB,
  "excludedPrivateHeaders" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "warningCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRow" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "importBatchId" TEXT NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "action" "ImportRowAction" NOT NULL DEFAULT 'UNDECIDED',
  "status" "ImportRowStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
  "mappedDate" TIMESTAMP(3),
  "amountCents" INTEGER,
  "description" TEXT,
  "merchantName" TEXT,
  "categoryId" TEXT,
  "matchedTransactionId" TEXT,
  "committedTransactionId" TEXT,
  "warningCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankImportProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "bankName" TEXT,
  "accountType" TEXT,
  "hasHeader" BOOLEAN NOT NULL DEFAULT true,
  "dateFormats" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "columnMapping" JSONB NOT NULL,
  "ignoredHeaders" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "privateHeaderPatterns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "confidence" INTEGER NOT NULL DEFAULT 0,
  "isUserConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BankImportProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "defaultCategoryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MerchantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantAlias" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "merchantProfileId" TEXT NOT NULL,
  "rawAlias" TEXT NOT NULL,
  "normalizedAlias" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MerchantAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantRule" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "merchantProfileId" TEXT,
  "categoryId" TEXT,
  "type" "MerchantRuleType" NOT NULL,
  "pattern" TEXT NOT NULL,
  "normalizedPattern" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "deactivatedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MerchantRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "entityType" "AuditEntityType" NOT NULL,
  "entityId" TEXT,
  "action" "AuditAction" NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_authProvider_authProviderUserId_key" ON "User"("authProvider", "authProviderUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "Category_userId_type_idx" ON "Category"("userId", "type");

-- CreateIndex
CREATE INDEX "Category_userId_parentId_idx" ON "Category"("userId", "parentId");

-- CreateIndex
CREATE INDEX "Category_userId_isArchived_deletedAt_idx" ON "Category"("userId", "isArchived", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_userId_name_type_key" ON "Category"("userId", "name", "type");

-- CreateIndex
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");

-- CreateIndex
CREATE INDEX "Transaction_userId_categoryId_idx" ON "Transaction"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "Transaction_userId_importBatchId_idx" ON "Transaction"("userId", "importBatchId");

-- CreateIndex
CREATE INDEX "Transaction_userId_merchantProfileId_idx" ON "Transaction"("userId", "merchantProfileId");

-- CreateIndex
CREATE INDEX "Transaction_userId_parentTransactionId_idx" ON "Transaction"("userId", "parentTransactionId");

-- CreateIndex
CREATE INDEX "Transaction_userId_importFingerprint_idx" ON "Transaction"("userId", "importFingerprint");

-- CreateIndex
CREATE INDEX "Transaction_userId_duplicateKey_idx" ON "Transaction"("userId", "duplicateKey");

-- CreateIndex
CREATE INDEX "Transaction_userId_deletedAt_idx" ON "Transaction"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "ImportBatch_userId_status_idx" ON "ImportBatch"("userId", "status");

-- CreateIndex
CREATE INDEX "ImportBatch_userId_createdAt_idx" ON "ImportBatch"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ImportBatch_userId_fileNameHash_idx" ON "ImportBatch"("userId", "fileNameHash");

-- CreateIndex
CREATE INDEX "ImportBatch_userId_deletedAt_idx" ON "ImportBatch"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "ImportRow_userId_importBatchId_idx" ON "ImportRow"("userId", "importBatchId");

-- CreateIndex
CREATE INDEX "ImportRow_userId_status_idx" ON "ImportRow"("userId", "status");

-- CreateIndex
CREATE INDEX "ImportRow_userId_action_idx" ON "ImportRow"("userId", "action");

-- CreateIndex
CREATE INDEX "ImportRow_userId_matchedTransactionId_idx" ON "ImportRow"("userId", "matchedTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportRow_importBatchId_rowNumber_key" ON "ImportRow"("importBatchId", "rowNumber");

-- CreateIndex
CREATE INDEX "BankImportProfile_userId_bankName_idx" ON "BankImportProfile"("userId", "bankName");

-- CreateIndex
CREATE UNIQUE INDEX "BankImportProfile_userId_displayName_key" ON "BankImportProfile"("userId", "displayName");

-- CreateIndex
CREATE INDEX "MerchantProfile_userId_defaultCategoryId_idx" ON "MerchantProfile"("userId", "defaultCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantProfile_userId_name_key" ON "MerchantProfile"("userId", "name");

-- CreateIndex
CREATE INDEX "MerchantAlias_userId_merchantProfileId_idx" ON "MerchantAlias"("userId", "merchantProfileId");

-- CreateIndex
CREATE INDEX "MerchantAlias_userId_normalizedAlias_idx" ON "MerchantAlias"("userId", "normalizedAlias");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantAlias_userId_normalizedAlias_key" ON "MerchantAlias"("userId", "normalizedAlias");

-- CreateIndex
CREATE INDEX "MerchantRule_userId_type_isActive_idx" ON "MerchantRule"("userId", "type", "isActive");

-- CreateIndex
CREATE INDEX "MerchantRule_userId_merchantProfileId_idx" ON "MerchantRule"("userId", "merchantProfileId");

-- CreateIndex
CREATE INDEX "MerchantRule_userId_categoryId_idx" ON "MerchantRule"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "MerchantRule_userId_normalizedPattern_idx" ON "MerchantRule"("userId", "normalizedPattern");

-- CreateIndex
CREATE INDEX "MerchantRule_userId_deletedAt_idx" ON "MerchantRule"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_createdAt_idx" ON "AuditEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_entityType_entityId_idx" ON "AuditEvent"("userId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_merchantProfileId_fkey" FOREIGN KEY ("merchantProfileId") REFERENCES "MerchantProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_parentTransactionId_fkey" FOREIGN KEY ("parentTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_bankImportProfileId_fkey" FOREIGN KEY ("bankImportProfileId") REFERENCES "BankImportProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_matchedTransactionId_fkey" FOREIGN KEY ("matchedTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_committedTransactionId_fkey" FOREIGN KEY ("committedTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankImportProfile" ADD CONSTRAINT "BankImportProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantProfile" ADD CONSTRAINT "MerchantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantProfile" ADD CONSTRAINT "MerchantProfile_defaultCategoryId_fkey" FOREIGN KEY ("defaultCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantAlias" ADD CONSTRAINT "MerchantAlias_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantAlias" ADD CONSTRAINT "MerchantAlias_merchantProfileId_fkey" FOREIGN KEY ("merchantProfileId") REFERENCES "MerchantProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantRule" ADD CONSTRAINT "MerchantRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantRule" ADD CONSTRAINT "MerchantRule_merchantProfileId_fkey" FOREIGN KEY ("merchantProfileId") REFERENCES "MerchantProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantRule" ADD CONSTRAINT "MerchantRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
