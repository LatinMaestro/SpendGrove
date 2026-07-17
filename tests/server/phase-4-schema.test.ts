import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const schemaPath = new URL("../../prisma/schema.prisma", import.meta.url);
const migrationPath = new URL(
  "../../prisma/migrations/20260708090000_phase_4_recurring_budgets_foundation/migration.sql",
  import.meta.url,
);

function modelBlock(schema: string, model: string) {
  const match = schema.match(new RegExp(`model ${model} \\{[\\s\\S]*?\\n\\}`));
  expect(match, `Expected model ${model}`).not.toBeNull();
  return match?.[0] ?? "";
}

function enumBlock(schema: string, enumName: string) {
  const match = schema.match(new RegExp(`enum ${enumName} \\{[\\s\\S]*?\\n\\}`));
  expect(match, `Expected enum ${enumName}`).not.toBeNull();
  return match?.[0] ?? "";
}

describe("Phase 4 Milestone 1 schema foundation", () => {
  it("adds only the approved recurring and budget models", async () => {
    const schema = await readFile(schemaPath, "utf8");
    const scopedSchema = [
      modelBlock(schema, "RecurringItem"),
      modelBlock(schema, "RecurringSuggestionDismissal"),
      modelBlock(schema, "CategoryBudget"),
    ].join("\n");

    expect(scopedSchema).toContain("model RecurringItem");
    expect(scopedSchema).toContain("model RecurringSuggestionDismissal");
    expect(scopedSchema).toContain("model CategoryBudget");
    expect(scopedSchema).toMatch(/expectedAmountCents\s+Int\?/);
    expect(scopedSchema).toContain("amountCents Int");
    expect(scopedSchema).toContain("suggestionKey String");

    for (const forbiddenField of [
      "rawNarration",
      "rawCsv",
      "rawRow",
      "originalFileName",
      "fileName",
      "accountNumber",
      "maskedReference",
      "bsb",
      "cardFragment",
      "customerId",
      "loanReference",
      "lenderReference",
      "exactAddress",
      "balanceCents",
      "sourceSnapshot",
    ]) {
      expect(scopedSchema).not.toContain(forbiddenField);
    }
  });

  it("contains the approved enum values only", async () => {
    const schema = await readFile(schemaPath, "utf8");

    expect(enumBlock(schema, "RecurringCadence")).toBe(`enum RecurringCadence {
  WEEKLY
  FORTNIGHTLY
  MONTHLY
  OTHER
}`);
    const recurringStatus = enumBlock(schema, "RecurringItemStatus");
    expect(recurringStatus).toContain("ACTIVE");
    expect(recurringStatus).toContain("ARCHIVED");
    expect(enumBlock(schema, "BudgetPeriod")).toBe(`enum BudgetPeriod {
  MONTHLY
}`);
    expect(enumBlock(schema, "BudgetStatus")).toBe(`enum BudgetStatus {
  ACTIVE
  ARCHIVED
}`);

    const auditEntityType = enumBlock(schema, "AuditEntityType");
    expect(auditEntityType).toContain("RECURRING_ITEM");
    expect(auditEntityType).toContain("RECURRING_SUGGESTION_DISMISSAL");
    expect(auditEntityType).toContain("CATEGORY_BUDGET");
  });

  it("keeps the migration additive and free of existing data rewrites", async () => {
    const migration = await readFile(migrationPath, "utf8");

    expect(migration).toContain('CREATE TYPE "RecurringCadence"');
    expect(migration).toContain('CREATE TABLE "RecurringItem"');
    expect(migration).toContain('CREATE TABLE "RecurringSuggestionDismissal"');
    expect(migration).toContain('CREATE TABLE "CategoryBudget"');
    expect(migration).not.toMatch(/\bDROP\b/i);
    expect(migration).not.toMatch(/\bUPDATE\s+"/i);
    expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(migration).not.toMatch(/\bINSERT\s+INTO\b/i);
    expect(migration).not.toContain('ALTER TABLE "Transaction"');
    expect(migration).not.toContain('ALTER TABLE "ImportBatch"');
    expect(migration).not.toContain('ALTER TABLE "Property"');
    expect(migration).not.toContain('ALTER TABLE "LoanAccount"');
    expect(migration).not.toContain('ALTER TABLE "LoanRepayment"');
  });

  it("encodes the approved owner-scoped indexes and foreign keys", async () => {
    const migration = await readFile(migrationPath, "utf8");

    expect(migration).toContain('CREATE INDEX "RecurringItem_userId_status_idx"');
    expect(migration).toContain('CREATE INDEX "RecurringItem_userId_categoryId_idx"');
    expect(migration).toContain('CREATE INDEX "RecurringItem_userId_cadence_idx"');
    expect(migration).toContain('CREATE UNIQUE INDEX "RecurringSuggestionDismissal_userId_suggestionKey_key"');
    expect(migration).toContain('CREATE INDEX "CategoryBudget_userId_categoryId_period_status_idx"');
    expect(migration).toContain('CONSTRAINT "RecurringItem_userId_fkey"');
    expect(migration).toContain('CONSTRAINT "RecurringSuggestionDismissal_userId_fkey"');
    expect(migration).toContain('CONSTRAINT "CategoryBudget_userId_fkey"');
    expect(migration).toContain('CONSTRAINT "CategoryBudget_categoryId_fkey"');
  });
});
