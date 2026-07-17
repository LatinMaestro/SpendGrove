-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE 'DOCUMENT';
ALTER TYPE "AuditEntityType" ADD VALUE 'DOCUMENT_LINK';

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING_UPLOAD', 'QUARANTINED', 'AVAILABLE', 'FAILED', 'DELETED');
CREATE TYPE "DocumentCategory" AS ENUM ('RECEIPT', 'INVOICE', 'LOAN_STATEMENT', 'PROPERTY_RECORD', 'REPORT_EVIDENCE', 'OTHER');
CREATE TYPE "DocumentLinkTargetType" AS ENUM ('TRANSACTION', 'PROPERTY', 'LOAN_ACCOUNT', 'LOAN_REPAYMENT', 'IMPORT_BATCH', 'REPORT', 'FINANCIAL_YEAR');

-- CreateTable
CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "category" "DocumentCategory" NOT NULL,
  "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
  "contentType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "checksumSha256" TEXT,
  "storageProvider" TEXT,
  "objectKey" TEXT,
  "documentDate" TIMESTAMP(3),
  "financialYear" TEXT,
  "availableAt" TIMESTAMP(3),
  "quarantinedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "providerDeletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentLink" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "targetType" "DocumentLinkTargetType" NOT NULL,
  "targetKey" TEXT NOT NULL,
  "targetEntityId" TEXT,
  "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DocumentLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Document_storageProvider_objectKey_key" ON "Document"("storageProvider", "objectKey");
CREATE INDEX "Document_userId_status_createdAt_idx" ON "Document"("userId", "status", "createdAt");
CREATE INDEX "Document_userId_category_deletedAt_idx" ON "Document"("userId", "category", "deletedAt");
CREATE INDEX "Document_userId_financialYear_idx" ON "Document"("userId", "financialYear");
CREATE UNIQUE INDEX "DocumentLink_documentId_targetType_targetKey_key" ON "DocumentLink"("documentId", "targetType", "targetKey");
CREATE INDEX "DocumentLink_userId_revokedAt_targetType_idx" ON "DocumentLink"("userId", "revokedAt", "targetType");
CREATE INDEX "DocumentLink_documentId_revokedAt_idx" ON "DocumentLink"("documentId", "revokedAt");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
