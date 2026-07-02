import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schemaPath = new URL("../../prisma/schema.prisma", import.meta.url);
const migrationPath = new URL(
  "../../prisma/migrations/20260703090000_phase_3c_property_reporting_review/migration.sql",
  import.meta.url,
);

function modelBlock(schema: string, modelName: string) {
  const match = schema.match(new RegExp(`model ${modelName} \\{([\\s\\S]*?)\\n\\}`, "m"));
  if (!match) throw new Error(`${modelName} model not found.`);
  return match[1];
}

function enumBlock(schema: string, enumName: string) {
  const match = schema.match(new RegExp(`enum ${enumName} \\{([\\s\\S]*?)\\n\\}`, "m"));
  if (!match) throw new Error(`${enumName} enum not found.`);
  return match[1];
}

describe("Phase 3C Milestone 2 reporting schema", () => {
  const schema = readFileSync(schemaPath, "utf8");
  const migration = readFileSync(migrationPath, "utf8");

  it("uses only the approved neutral classification codes", () => {
    const classification = enumBlock(schema, "PropertyRecordClassification");
    expect(classification.match(/^\s+[A-Z_]+$/gm)?.map((value) => value.trim())).toEqual([
      "PROPERTY_INCOME",
      "PROPERTY_OUTGOING",
      "REFUND_OR_REVERSAL",
      "LOAN_PAYMENT_CONTEXT",
      "TRANSFER_CONTEXT",
      "OTHER_PROPERTY_RECORD",
      "EXCLUDED",
    ]);
    expect(classification).not.toMatch(/DEDUCT|TAX|ATO|CLAIM|PERCENT/i);
  });

  it("persists only owner and source IDs, classification and lifecycle timestamps", () => {
    const review = modelBlock(schema, "PropertyReportReview");
    for (const requiredField of [
      "id",
      "userId",
      "propertyId",
      "transactionId",
      "classification",
      "createdAt",
      "updatedAt",
    ]) {
      expect(review).toMatch(new RegExp(`^\\s+${requiredField}\\s+`, "m"));
    }

    for (const forbiddenField of [
      "amountCents",
      "date",
      "financialYear",
      "category",
      "merchant",
      "description",
      "narration",
      "filename",
      "address",
      "balance",
      "deductible",
      "percentage",
      "reportTotal",
      "sourceSnapshot",
      "exportContent",
    ]) {
      expect(review).not.toMatch(new RegExp(`^\\s+${forbiddenField}\\s+`, "im"));
    }
  });

  it("enforces one reviewed Property per transaction with owner-scoped indexes", () => {
    const review = modelBlock(schema, "PropertyReportReview");
    expect(review).toMatch(/^\s+transactionId\s+String\s+@unique$/m);
    expect(review).toContain("@@index([userId, propertyId, classification])");
    expect(review).toContain("@@index([userId, classification])");
    expect(review).toContain("onDelete: Cascade");
    expect(review.match(/onDelete: Restrict/g)).toHaveLength(2);
  });

  it("adds only the approved enum, table, indexes and foreign keys", () => {
    expect(migration).toContain('CREATE TYPE "PropertyRecordClassification" AS ENUM');
    expect(migration).toContain('CREATE TABLE "PropertyReportReview"');
    expect(migration).toContain('CREATE UNIQUE INDEX "PropertyReportReview_transactionId_key"');
    expect(migration).toContain('"PropertyReportReview_userId_propertyId_classification_idx"');
    expect(migration).toContain('"PropertyReportReview_userId_classification_idx"');
    expect(migration.match(/ALTER TABLE "PropertyReportReview"/g)).toHaveLength(3);
    expect(migration).not.toMatch(/ALTER TABLE "(?!PropertyReportReview")/);
    expect(migration).not.toMatch(/^\s*(?:INSERT\b|UPDATE\b|DELETE\s+FROM\b|TRUNCATE\b|DROP\b)/im);
  });

  it("uses cascade only for user cleanup and restricts source deletion", () => {
    expect(migration).toContain(
      'FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE',
    );
    expect(migration).toContain(
      'FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
    );
    expect(migration).toContain(
      'FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
    );
  });
});
