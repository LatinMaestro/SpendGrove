import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  merchantAliasSchema,
  merchantProfileSchema,
} from "@/lib/validation/merchants";

const migrationPath = "prisma/migrations/20260618033000_merchant_lifecycle/migration.sql";

describe("merchant lifecycle schema migration", () => {
  it("contains only the approved schema and safe backfill operations", async () => {
    const sql = await readFile(migrationPath, "utf8");

    expect(sql).toContain('RENAME COLUMN "rawAlias" TO "aliasName"');
    expect(sql).toContain('ADD COLUMN "normalizedName" TEXT');
    expect(sql).toContain('ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true');
    expect(sql).toContain('ADD COLUMN "deactivatedAt" TIMESTAMP(3)');
    expect(sql).toContain('ADD COLUMN "deletedAt" TIMESTAMP(3)');
    expect(sql).toContain('CREATE UNIQUE INDEX "MerchantProfile_userId_normalizedName_key"');
    expect(sql).not.toMatch(/\b(?:INSERT|TRUNCATE|DROP TABLE|DELETE FROM)\b/i);
    expect(sql).not.toMatch(/\b(?:filename|raw row|bank description|account number|bsb|card number|customer id|loan reference|balance)\b/i);
  });

  it("validates cleaned profile and alias lifecycle fields", () => {
    expect(merchantProfileSchema.parse({
      userId: "user_1",
      name: "Woolworths",
      normalizedName: "woolworths",
      isActive: true,
    })).toMatchObject({
      normalizedName: "woolworths",
      isActive: true,
    });

    expect(merchantAliasSchema.parse({
      userId: "user_1",
      merchantProfileId: "merchant_1",
      aliasName: "Woolies",
      normalizedAlias: "woolies",
      isActive: true,
    })).toMatchObject({
      aliasName: "Woolies",
      normalizedAlias: "woolies",
    });
  });

  it("rejects private banking identifiers in merchant lifecycle values", () => {
    expect(() => merchantProfileSchema.parse({
      userId: "user_1",
      name: "Account 12345678",
      normalizedName: "account 12345678",
    })).toThrow();

    expect(() => merchantAliasSchema.parse({
      userId: "user_1",
      merchantProfileId: "merchant_1",
      aliasName: "BSB 000-000",
      normalizedAlias: "bsb 000-000",
    })).toThrow();
  });
});
