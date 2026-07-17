-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE 'HOUSEHOLD';
ALTER TYPE "AuditEntityType" ADD VALUE 'HOUSEHOLD_MEMBERSHIP';
ALTER TYPE "AuditEntityType" ADD VALUE 'HOUSEHOLD_INVITATION';
ALTER TYPE "AuditEntityType" ADD VALUE 'HOUSEHOLD_RECORD_SHARE';
ALTER TYPE "AuditEntityType" ADD VALUE 'ACCOUNTANT_ACCESS_GRANT';
ALTER TYPE "AuditEntityType" ADD VALUE 'ACCOUNTANT_ACCESS_SCOPE';

-- CreateEnum
CREATE TYPE "HouseholdStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "HouseholdRole" AS ENUM ('ADMIN', 'MEMBER');
CREATE TYPE "HouseholdMembershipStatus" AS ENUM ('ACTIVE', 'LEFT', 'REMOVED');
CREATE TYPE "CollaborationInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');
CREATE TYPE "HouseholdShareEntityType" AS ENUM ('TRANSACTION', 'PROPERTY', 'LOAN_ACCOUNT', 'CATEGORY_BUDGET', 'RECURRING_ITEM', 'SAVINGS_GOAL', 'NET_WORTH_SNAPSHOT', 'REPORT');
CREATE TYPE "AccountantGrantStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED', 'EXPIRED');
CREATE TYPE "AccountantScopeType" AS ENUM ('REPORT', 'TRANSACTION', 'PROPERTY', 'LOAN_ACCOUNT', 'CATEGORY_BUDGET', 'RECURRING_ITEM', 'SAVINGS_GOAL', 'NET_WORTH_SNAPSHOT');

-- CreateTable
CREATE TABLE "Household" (
  "id" TEXT NOT NULL,
  "creatorUserId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "HouseholdStatus" NOT NULL DEFAULT 'ACTIVE',
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HouseholdMembership" (
  "id" TEXT NOT NULL,
  "householdId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "HouseholdRole" NOT NULL,
  "status" "HouseholdMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HouseholdMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HouseholdInvitation" (
  "id" TEXT NOT NULL,
  "householdId" TEXT NOT NULL,
  "inviterUserId" TEXT NOT NULL,
  "acceptedUserId" TEXT,
  "intendedIdentityHash" TEXT,
  "tokenHash" TEXT NOT NULL,
  "role" "HouseholdRole" NOT NULL,
  "status" "CollaborationInvitationStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HouseholdInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HouseholdRecordShare" (
  "id" TEXT NOT NULL,
  "householdId" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "entityType" "HouseholdShareEntityType" NOT NULL,
  "entityId" TEXT NOT NULL,
  "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HouseholdRecordShare_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountantAccessGrant" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "accountantUserId" TEXT,
  "intendedIdentityHash" TEXT,
  "tokenHash" TEXT NOT NULL,
  "status" "AccountantGrantStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccountantAccessGrant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccountantAccessScope" (
  "id" TEXT NOT NULL,
  "grantId" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "scopeType" "AccountantScopeType" NOT NULL,
  "scopeKey" TEXT NOT NULL,
  "entityId" TEXT,
  "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccountantAccessScope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Household_creatorUserId_status_idx" ON "Household"("creatorUserId", "status");
CREATE INDEX "Household_status_createdAt_idx" ON "Household"("status", "createdAt");
CREATE UNIQUE INDEX "HouseholdMembership_householdId_userId_key" ON "HouseholdMembership"("householdId", "userId");
CREATE INDEX "HouseholdMembership_userId_status_idx" ON "HouseholdMembership"("userId", "status");
CREATE INDEX "HouseholdMembership_householdId_role_status_idx" ON "HouseholdMembership"("householdId", "role", "status");
CREATE UNIQUE INDEX "HouseholdInvitation_tokenHash_key" ON "HouseholdInvitation"("tokenHash");
CREATE INDEX "HouseholdInvitation_householdId_status_expiresAt_idx" ON "HouseholdInvitation"("householdId", "status", "expiresAt");
CREATE INDEX "HouseholdInvitation_inviterUserId_status_createdAt_idx" ON "HouseholdInvitation"("inviterUserId", "status", "createdAt");
CREATE INDEX "HouseholdInvitation_acceptedUserId_status_idx" ON "HouseholdInvitation"("acceptedUserId", "status");
CREATE INDEX "HouseholdInvitation_intendedIdentityHash_status_idx" ON "HouseholdInvitation"("intendedIdentityHash", "status");
CREATE UNIQUE INDEX "HouseholdRecordShare_householdId_ownerUserId_entityType_entityId_key" ON "HouseholdRecordShare"("householdId", "ownerUserId", "entityType", "entityId");
CREATE INDEX "HouseholdRecordShare_householdId_revokedAt_entityType_idx" ON "HouseholdRecordShare"("householdId", "revokedAt", "entityType");
CREATE INDEX "HouseholdRecordShare_ownerUserId_revokedAt_entityType_idx" ON "HouseholdRecordShare"("ownerUserId", "revokedAt", "entityType");
CREATE UNIQUE INDEX "AccountantAccessGrant_tokenHash_key" ON "AccountantAccessGrant"("tokenHash");
CREATE INDEX "AccountantAccessGrant_ownerUserId_status_expiresAt_idx" ON "AccountantAccessGrant"("ownerUserId", "status", "expiresAt");
CREATE INDEX "AccountantAccessGrant_accountantUserId_status_expiresAt_idx" ON "AccountantAccessGrant"("accountantUserId", "status", "expiresAt");
CREATE INDEX "AccountantAccessGrant_intendedIdentityHash_status_idx" ON "AccountantAccessGrant"("intendedIdentityHash", "status");
CREATE UNIQUE INDEX "AccountantAccessScope_grantId_scopeType_scopeKey_key" ON "AccountantAccessScope"("grantId", "scopeType", "scopeKey");
CREATE INDEX "AccountantAccessScope_ownerUserId_revokedAt_scopeType_idx" ON "AccountantAccessScope"("ownerUserId", "revokedAt", "scopeType");
CREATE INDEX "AccountantAccessScope_grantId_revokedAt_scopeType_idx" ON "AccountantAccessScope"("grantId", "revokedAt", "scopeType");

-- AddForeignKey
ALTER TABLE "Household" ADD CONSTRAINT "Household_creatorUserId_fkey" FOREIGN KEY ("creatorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HouseholdMembership" ADD CONSTRAINT "HouseholdMembership_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdMembership" ADD CONSTRAINT "HouseholdMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdInvitation" ADD CONSTRAINT "HouseholdInvitation_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdInvitation" ADD CONSTRAINT "HouseholdInvitation_inviterUserId_fkey" FOREIGN KEY ("inviterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdInvitation" ADD CONSTRAINT "HouseholdInvitation_acceptedUserId_fkey" FOREIGN KEY ("acceptedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HouseholdRecordShare" ADD CONSTRAINT "HouseholdRecordShare_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HouseholdRecordShare" ADD CONSTRAINT "HouseholdRecordShare_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountantAccessGrant" ADD CONSTRAINT "AccountantAccessGrant_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountantAccessGrant" ADD CONSTRAINT "AccountantAccessGrant_accountantUserId_fkey" FOREIGN KEY ("accountantUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AccountantAccessScope" ADD CONSTRAINT "AccountantAccessScope_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "AccountantAccessGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountantAccessScope" ADD CONSTRAINT "AccountantAccessScope_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
