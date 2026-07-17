import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const schemaPath = new URL("../../prisma/schema.prisma", import.meta.url);
const migrationPath = new URL(
  "../../prisma/migrations/20260717090000_phase_6_bulk_operation_foundation/migration.sql",
  import.meta.url,
);

function block(source: string, kind: "enum" | "model", name: string) {
  const match = source.match(new RegExp(`${kind} ${name} \\\{[\\s\\S]*?\\n\\\}`));
  expect(match, `Expected ${kind} ${name}`).not.toBeNull();
  return match?.[0] ?? "";
}

describe("Phase 6 bulk operation schema foundation", () => {
  it("contains the exact approved enum values", async () => {
    const schema = await readFile(schemaPath, "utf8");

    expect(block(schema, "enum", "BulkOperationType")).toBe(`enum BulkOperationType {
  SET_CATEGORY
  APPLY_MERCHANT_CATEGORY
  LINK_PROPERTY
  UNLINK_PROPERTY
}`);
    expect(block(schema, "enum", "BulkOperationStatus")).toBe(`enum BulkOperationStatus {
  RUNNING
  COMPLETED
  PARTIAL
  FAILED
  REVERTED
  PARTIALLY_REVERTED
}`);
    expect(block(schema, "enum", "BulkOperationItemStatus")).toBe(`enum BulkOperationItemStatus {
  APPLIED
  SKIPPED
  FAILED
  REVERTED
  UNDO_BLOCKED
}`);
    expect(block(schema, "enum", "BulkOperationReason")).toBe(`enum BulkOperationReason {
  ALREADY_APPLIED
  ALREADY_LINKED_TO_PROPERTY
  ALREADY_LINKED_TO_ANOTHER_PROPERTY
  CATEGORY_INCOMPATIBLE
  CATEGORY_UNAVAILABLE
  PROPERTY_UNAVAILABLE
  NOT_ACTIVE
  SPLIT_PARENT
  DIRECTION_NEEDS_CORRECTION
  MERCHANT_IDENTITY_MISMATCH
  STALE_RECORD
  NOT_FOUND_OR_NOT_OWNED
  UNEXPECTED_SAFE_FAILURE
}`);
    expect(block(schema, "enum", "AuditEntityType")).toContain("BULK_OPERATION");
  });

  it("stores only the minimum owner-scoped undo journal", async () => {
    const schema = await readFile(schemaPath, "utf8");
    const operation = block(schema, "model", "BulkOperation");
    const item = block(schema, "model", "BulkOperationItem");
    const scopedSchema = operation + item;

    expect(operation).toContain("userId");
    expect(operation).toContain("targetCategoryId String?");
    expect(operation).toContain("targetPropertyId String?");
    expect(operation).toContain("undoExpiresAt");
    expect(item).toContain("userId");
    expect(item).toContain("operationId");
    expect(item).toContain("transactionId");
    expect(item).toContain("beforeCategoryId");
    expect(item).toContain("afterCategoryId");
    expect(item).toContain("beforePropertyId");
    expect(item).toContain("afterPropertyId");
    expect(item).toContain("beforeTransactionUpdatedAt");
    expect(item).toContain("appliedTransactionUpdatedAt");

    for (const forbiddenField of [
      "amountCents",
      "description",
      "narration",
      "fileName",
      "accountNumber",
      "bsb",
      "card",
      "customerId",
      "balance",
      "sourceSnapshot",
    ]) {
      expect(scopedSchema).not.toContain(forbiddenField);
    }
  });

  it("encodes the approved ownership relations and constraints", async () => {
    const schema = await readFile(schemaPath, "utf8");
    const operation = block(schema, "model", "BulkOperation");
    const item = block(schema, "model", "BulkOperationItem");

    expect(operation).toContain(
      "user           User                @relation(fields: [userId], references: [id], onDelete: Cascade)",
    );
    expect(operation).toContain('targetCategory Category?           @relation("BulkOperationTargetCategory"');
    expect(operation).toContain('targetProperty Property?           @relation("BulkOperationTargetProperty"');
    expect(operation).toContain("@@index([userId, status, createdAt])");
    expect(operation).toContain("@@index([userId, type, createdAt])");
    expect(item).toContain(
      "user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)",
    );
    expect(item).toContain(
      "operation   BulkOperation @relation(fields: [operationId], references: [id], onDelete: Cascade)",
    );
    expect(item).toContain(
      "transaction Transaction   @relation(fields: [transactionId], references: [id], onDelete: Cascade)",
    );
    expect(item).toContain("@@unique([operationId, transactionId])");
  });

  it("keeps the migration additive and free of existing row rewrites", async () => {
    const migration = await readFile(migrationPath, "utf8");

    expect(migration).toContain("ALTER TYPE \"AuditEntityType\" ADD VALUE 'BULK_OPERATION'");
    expect(migration).toContain('CREATE TYPE "BulkOperationType"');
    expect(migration).toContain('CREATE TABLE "BulkOperation"');
    expect(migration).toContain('CREATE TABLE "BulkOperationItem"');
    expect(migration).not.toMatch(/\bDROP\b/i);
    expect(migration).not.toMatch(/\bUPDATE\s+"/i);
    expect(migration).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(migration).not.toMatch(/\bINSERT\s+INTO\b/i);
    for (const existingTable of [
      "User",
      "Category",
      "Transaction",
      "ImportBatch",
      "Property",
      "LoanAccount",
      "LoanRepayment",
      "RecurringItem",
      "CategoryBudget",
    ]) {
      expect(migration).not.toContain(`ALTER TABLE "${existingTable}" ADD COLUMN`);
    }
  });

  it("creates the exact approved indexes and foreign keys", async () => {
    const migration = await readFile(migrationPath, "utf8");

    for (const name of [
      "BulkOperation_userId_status_createdAt_idx",
      "BulkOperation_userId_type_createdAt_idx",
      "BulkOperation_targetCategoryId_idx",
      "BulkOperation_targetPropertyId_idx",
      "BulkOperationItem_operationId_transactionId_key",
      "BulkOperationItem_userId_status_createdAt_idx",
      "BulkOperationItem_operationId_status_idx",
      "BulkOperationItem_transactionId_createdAt_idx",
      "BulkOperation_userId_fkey",
      "BulkOperation_targetCategoryId_fkey",
      "BulkOperation_targetPropertyId_fkey",
      "BulkOperationItem_userId_fkey",
      "BulkOperationItem_operationId_fkey",
      "BulkOperationItem_transactionId_fkey",
    ]) {
      expect(migration).toContain(`"${name}"`);
    }
  });
});
