import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const schemaPath = new URL("../../prisma/schema.prisma", import.meta.url);
const migrationPath = new URL(
  "../../prisma/migrations/20260717110000_phase_7_import_undo_foundation/migration.sql",
  import.meta.url,
);
const contractPath = new URL("../../docs/PHASE_7_IMPORT_UNDO_CONTRACT.md", import.meta.url);

describe("Phase 7 import undo schema foundation", () => {
  it("adds only the contracted operation, item and nullable commit-version field", async () => {
    const schema = await readFile(schemaPath, "utf8");
    const operation = schema.match(/model ImportUndoOperation \{[\s\S]*?\n\}/)?.[0] ?? "";
    const item = schema.match(/model ImportUndoItem \{[\s\S]*?\n\}/)?.[0] ?? "";

    expect(schema).toContain("IMPORT_UNDO_OPERATION");
    expect(schema).toContain("committedTransactionUpdatedAt DateTime?");
    expect(schema).toContain("importUndoOperations         ImportUndoOperation[]");
    expect(schema).toContain("importUndoItems              ImportUndoItem[]");
    expect(operation).toContain("importBatchId");
    expect(operation).toContain("requestedCount");
    expect(operation).toContain("restoreBlockedCount");
    expect(item).toContain("beforeTransactionUpdatedAt");
    expect(item).toContain("appliedTransactionUpdatedAt");
    expect(item).not.toMatch(/amount|description|merchant|filename|account|bsb|balance/i);
  });

  it("defines the exact approved lifecycle enums", async () => {
    const schema = await readFile(schemaPath, "utf8");

    for (const value of [
      "PARTIALLY_RESTORED",
      "RESTORE_BLOCKED",
      "EXISTING_BATCH_UNSUPPORTED",
      "ACTIVE_LOAN_RECONCILIATION",
      "ACTIVE_TRANSFER_LINK",
      "BULK_OPERATION_DEPENDENCY",
      "OWNERSHIP_OR_LINK_MISMATCH",
    ]) {
      expect(schema).toContain(value);
    }
  });

  it("uses additive SQL without rewriting existing import rows", async () => {
    const migration = await readFile(migrationPath, "utf8");

    expect(migration).toContain('ADD COLUMN "committedTransactionUpdatedAt" TIMESTAMP(3)');
    expect(migration).toContain('CREATE TABLE "ImportUndoOperation"');
    expect(migration).toContain('CREATE TABLE "ImportUndoItem"');
    expect(migration).toContain("ALTER TYPE \"AuditEntityType\" ADD VALUE 'IMPORT_UNDO_OPERATION'");
    expect(migration).not.toMatch(/^\s*(?:INSERT INTO|UPDATE\s+"|DELETE FROM|DROP |TRUNCATE)/im);
    expect(migration).not.toMatch(/DEFAULT[^\n]*committedTransactionUpdatedAt/i);
  });

  it("uses one operation per batch and one item per operation/import row", async () => {
    const migration = await readFile(migrationPath, "utf8");

    expect(migration).toContain('"ImportUndoOperation_importBatchId_key"');
    expect(migration).toContain('"ImportUndoItem_operationId_importRowId_key"');
    expect(migration).toContain('REFERENCES "ImportBatch"("id")\nON DELETE RESTRICT');
    expect(migration).toContain('REFERENCES "ImportRow"("id")\nON DELETE RESTRICT');
    expect(migration).toContain('REFERENCES "Transaction"("id")\nON DELETE RESTRICT');
  });

  it("preserves Import, Skip, Merge and privacy boundaries in the contract", async () => {
    const contract = await readFile(contractPath, "utf8");

    expect(contract).toContain("Skip and Merge rows are recorded as no change.");
    expect(contract).toContain("A merged manual transaction is never altered");
    expect(contract).toContain("No backfill is proposed.");
    expect(contract).toContain("must not store amounts, dates, categories, descriptions");
    expect(contract).toContain("No failed financial mutation is retried automatically.");
  });
});
