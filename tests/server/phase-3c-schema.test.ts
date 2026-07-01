import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const schemaPath = new URL("../../prisma/schema.prisma", import.meta.url);
const migrationPath = new URL(
  "../../prisma/migrations/20260702090000_phase_3c_property_transaction_link/migration.sql",
  import.meta.url,
);

function modelBlock(schema: string, model: string) {
  const match = schema.match(new RegExp(`model ${model} \\{[\\s\\S]*?\\n\\}`));
  expect(match, `Expected model ${model}`).not.toBeNull();
  return match?.[0] ?? "";
}

describe("Phase 3C property transaction link schema", () => {
  it("contains only the approved generated IDs and lifecycle timestamps", async () => {
    const schema = await readFile(schemaPath, "utf8");
    const link = modelBlock(schema, "PropertyTransactionLink");

    expect(link).toContain("transactionId String");
    expect(link).toContain("propertyId");
    expect(link).toContain("unlinkedAt");
    expect(link).toContain("createdAt");
    expect(link).toContain("updatedAt");

    for (const forbiddenField of [
      "amountCents",
      "date",
      "merchant",
      "category",
      "description",
      "narration",
      "fileName",
      "sourceText",
      "address",
      "tax",
      "deductible",
      "percentage",
      "accountNumber",
      "maskedReference",
      "lenderReference",
      "customerId",
    ]) {
      expect(link).not.toMatch(new RegExp(`^\\s+${forbiddenField}\\s+`, "im"));
    }
  });

  it("enforces one durable link record per transaction without allocation fields", async () => {
    const schema = await readFile(schemaPath, "utf8");
    const link = modelBlock(schema, "PropertyTransactionLink");

    expect(link).toMatch(/transactionId\s+String\s+@unique/);
    expect(link).toContain("property    Property");
    expect(link).toContain("transaction Transaction");
    expect(link).not.toMatch(/allocation|share|splitAmount|percentage/i);
  });

  it("keeps the migration additive and free of existing-data rewrites", async () => {
    const migration = await readFile(migrationPath, "utf8");

    expect(migration).toContain('CREATE TABLE "PropertyTransactionLink"');
    expect(migration).toContain('CREATE UNIQUE INDEX "PropertyTransactionLink_transactionId_key"');
    expect(migration).not.toMatch(/\bDROP\b/i);
    expect(migration).not.toMatch(/\bUPDATE\s+"/i);
    expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(migration).not.toMatch(/\bINSERT\s+INTO\b/i);
    expect(migration).not.toMatch(/ALTER TABLE "(?!PropertyTransactionLink")/);
  });

  it("uses owner-scoped indexes and restrictive record foreign keys", async () => {
    const migration = await readFile(migrationPath, "utf8");

    expect(migration).toContain(
      '"PropertyTransactionLink_userId_propertyId_unlinkedAt_idx"',
    );
    expect(migration).toContain('"PropertyTransactionLink_userId_unlinkedAt_idx"');
    expect(migration).toContain(
      'REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
    );
    expect(migration).toContain(
      'REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
    );
    expect(migration).toContain(
      'REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE',
    );
  });
});
