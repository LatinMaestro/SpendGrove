-- Rename the stored alias label to make its safe, cleaned purpose explicit.
ALTER TABLE "MerchantAlias" RENAME COLUMN "rawAlias" TO "aliasName";

-- Add lifecycle and safe normalized identity fields.
ALTER TABLE "MerchantProfile"
ADD COLUMN "normalizedName" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Backfill normalized identity from the existing cleaned merchant name.
UPDATE "MerchantProfile"
SET "normalizedName" = lower(trim(regexp_replace("name", '\s+', ' ', 'g')));

ALTER TABLE "MerchantProfile"
ALTER COLUMN "normalizedName" SET NOT NULL;

ALTER TABLE "MerchantAlias"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "deactivatedAt" TIMESTAMP(3),
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Replace the case-sensitive merchant-name uniqueness rule with normalized identity.
DROP INDEX "MerchantProfile_userId_name_key";
CREATE UNIQUE INDEX "MerchantProfile_userId_normalizedName_key"
ON "MerchantProfile"("userId", "normalizedName");

-- Support active lifecycle queries without exposing or storing additional merchant data.
CREATE INDEX "MerchantProfile_userId_isActive_deletedAt_idx"
ON "MerchantProfile"("userId", "isActive", "deletedAt");

CREATE INDEX "MerchantAlias_userId_isActive_deletedAt_idx"
ON "MerchantAlias"("userId", "isActive", "deletedAt");
