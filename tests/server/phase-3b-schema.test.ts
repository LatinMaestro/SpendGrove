import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const schemaPath = new URL("../../prisma/schema.prisma", import.meta.url);
const migrationPath = new URL(
  "../../prisma/migrations/20260622124500_phase_3b_loan_property_foundation/migration.sql",
  import.meta.url,
);

function modelBlock(schema: string, model: string) {
  const match = schema.match(new RegExp(`model ${model} \\{[\\s\\S]*?\\n\\}`));
  expect(match, `Expected model ${model}`).not.toBeNull();
  return match?.[0] ?? "";
}

describe("Phase 3B schema foundation", () => {
  it("contains only the approved privacy-minimal property and loan models", async () => {
    const schema = await readFile(schemaPath, "utf8");
    const scopedSchema = [
      modelBlock(schema, "Property"),
      modelBlock(schema, "LoanAccount"),
      modelBlock(schema, "LoanRepayment"),
      modelBlock(schema, "LoanReconciliationLink"),
    ].join("\n");

    expect(scopedSchema).toContain("currentBalanceCents Int?");
    expect(scopedSchema).toContain("balanceAfterCents");
    expect(scopedSchema).toContain("amountVarianceCents");

    for (const forbiddenField of [
      "address",
      "accountNumber",
      "maskedReference",
      "lenderReference",
      "customerId",
      "rawNarration",
      "originalFileName",
      "fileName",
    ]) {
      expect(scopedSchema).not.toContain(forbiddenField);
    }
  });

  it("keeps the migration additive and free of Phase 3A data rewrites", async () => {
    const migration = await readFile(migrationPath, "utf8");

    expect(migration).toContain('CREATE TABLE "Property"');
    expect(migration).toContain('CREATE TABLE "LoanAccount"');
    expect(migration).toContain('CREATE TABLE "LoanRepayment"');
    expect(migration).toContain('CREATE TABLE "LoanReconciliationLink"');
    expect(migration).not.toMatch(/\bDROP\b/i);
    expect(migration).not.toMatch(/\bUPDATE\s+"/i);
    expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(migration).not.toContain('ALTER TABLE "Transaction"');
    expect(migration).not.toContain('ALTER TABLE "ImportBatch"');
  });

  it("encodes the integer-cent safety and no-private-identifier constraints", async () => {
    const migration = await readFile(migrationPath, "utf8");

    expect(migration).toContain('"LoanRepayment_complete_components_reconcile"');
    expect(migration).toContain('"LoanAccount_balance_snapshot_complete"');
    expect(migration).toContain('"LoanReconciliationLink_date_difference_nonnegative"');
    expect(migration).not.toMatch(
      /"?(address|accountNumber|maskedReference|lenderReference|customerId|rawNarration|originalFileName)"?\s+/i,
    );
  });

  it("represents car loans explicitly without adding a broader schema field", async () => {
    const schema = await readFile(schemaPath, "utf8");
    const migration = await readFile(migrationPath, "utf8");
    const loanType = schema.match(/enum LoanType \{[\s\S]*?\n\}/)?.[0] ?? "";

    expect(loanType).toContain("HOME_LOAN");
    expect(loanType).toContain("CAR_LOAN");
    expect(loanType).toContain("PERSONAL_LOAN");
    expect(loanType).toContain("OTHER");
    expect(migration).toContain(
      `CREATE TYPE "LoanType" AS ENUM ('HOME_LOAN', 'CAR_LOAN', 'PERSONAL_LOAN', 'OTHER');`,
    );
  });
});
