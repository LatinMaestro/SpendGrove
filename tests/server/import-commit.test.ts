import { describe, expect, it } from "vitest";
import { createImportCommitRequest, importCommitRequestSchema, type ImportCommitRequest } from "@/lib/import-commit";
import type { ImportReviewRow } from "@/lib/import-review";
import { AuthenticationRequiredError, OwnershipError } from "@/src/server/auth/ownership";
import { commitReviewedImport, type ImportCommitStore } from "@/src/server/import-commit";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const request: ImportCommitRequest = {
  requestId: "11111111-1111-4111-8111-111111111111",
  rows: [
    { rowNumber: 1, action: "IMPORT", date: "2026-06-18", amountCents: -1234, description: "Synthetic grocer", merchantName: "Synthetic grocer", categoryId: "groceries", warningCodes: [] },
    { rowNumber: 2, action: "SKIP", warningCodes: ["ROWS_NEED_REVIEW"] },
    { rowNumber: 3, action: "MERGE", date: "2026-06-17", amountCents: -950, description: "Blue Lantern", merchantName: "Blue Lantern", categoryId: "dining-out", targetTransactionId: "txn_owned", warningCodes: [] },
  ],
  metadata: { parsedRowCount: 3, privateFieldCount: 2, detectedBankName: "Synthetic Bank", hasHeader: true, amountMode: "SIGNED_AMOUNT", detectedDateFormats: ["DD/MM/YYYY"], warningCodes: ["PRIVATE_COLUMNS_EXCLUDED"] },
};

function createMemoryStore(options: { fail?: boolean; targetOwner?: string; targetState?: "ACTIVE" | "DELETED" | "PARENT" } = {}) {
  const batches = new Map<string, { userId: string; summary: Awaited<ReturnType<ImportCommitStore["commit"]>> }>();
  const transactions: Array<{ id: string; userId: string; source: string }> = [];
  const rows: Array<Record<string, unknown>> = [];
  const audits: Array<Record<string, unknown>> = [];
  const store: ImportCommitStore & { batches: typeof batches; transactions: typeof transactions; rows: typeof rows; audits: typeof audits } = {
    batches, transactions, rows, audits,
    async commit(userId, input) {
      const existing = batches.get(input.requestId);
      if (existing) {
        if (existing.userId !== userId) throw new OwnershipError("import batch");
        return { ...existing.summary, alreadyCommitted: true };
      }
      const nextTransactions = [...transactions];
      const nextRows = [...rows];
      const nextAudits = [...audits];
      for (const row of input.rows) {
        if (row.action === "SKIP") {
          nextRows.push({ rowNumber: row.rowNumber, action: row.action, status: "SKIPPED", warningCodes: row.warningCodes });
          continue;
        }
        if (row.action === "MERGE") {
          if ((options.targetOwner ?? userId) !== userId || options.targetState === "DELETED" || options.targetState === "PARENT") {
            throw new OwnershipError("manual merge target");
          }
          nextRows.push({ ...row, status: "MERGED", matchedTransactionId: row.targetTransactionId });
          continue;
        }
        const transactionId = `imported_${row.rowNumber}`;
        nextTransactions.push({ id: transactionId, userId, source: "IMPORTED" });
        nextRows.push({ ...row, status: "COMMITTED", committedTransactionId: transactionId });
      }
      if (options.fail) throw new Error("synthetic transaction failure");
      const summary = {
        batchId: input.requestId,
        totalCount: input.rows.length,
        importedCount: input.rows.filter((row) => row.action === "IMPORT").length,
        skippedCount: input.rows.filter((row) => row.action === "SKIP").length,
        mergedCount: input.rows.filter((row) => row.action === "MERGE").length,
        warningCount: new Set([...input.metadata.warningCodes, ...input.rows.flatMap((row) => row.warningCodes)]).size,
        alreadyCommitted: false,
      };
      nextAudits.push({ entityType: "IMPORT_BATCH", action: "IMPORTED", metadata: { importedCount: summary.importedCount, skippedCount: summary.skippedCount, mergedCount: summary.mergedCount } });
      transactions.splice(0, transactions.length, ...nextTransactions);
      rows.splice(0, rows.length, ...nextRows);
      audits.splice(0, audits.length, ...nextAudits);
      batches.set(input.requestId, { userId, summary });
      return summary;
    },
  };
  return store;
}

describe("durable import commit", () => {
  it("atomically commits Import, Skip and Merge outcomes with integer cents", async () => {
    const store = createMemoryStore();
    const result = await commitReviewedImport(createTestUserContext("user_1"), request, store, new Date("2026-06-18T00:00:00.000Z"));
    expect(result).toMatchObject({ totalCount: 3, importedCount: 1, skippedCount: 1, mergedCount: 1, alreadyCommitted: false });
    expect(store.transactions).toEqual([{ id: "imported_1", userId: "user_1", source: "IMPORTED" }]);
    expect(store.rows.find((row) => row.rowNumber === 1)).toMatchObject({ amountCents: -1234, status: "COMMITTED", committedTransactionId: "imported_1" });
    expect(store.rows.find((row) => row.rowNumber === 2)).toEqual({ rowNumber: 2, action: "SKIP", status: "SKIPPED", warningCodes: ["ROWS_NEED_REVIEW"] });
    expect(store.rows.find((row) => row.rowNumber === 3)).toMatchObject({ status: "MERGED", matchedTransactionId: "txn_owned" });
  });

  it("returns the original result for an idempotent retry without double writes", async () => {
    const store = createMemoryStore();
    await commitReviewedImport(createTestUserContext("user_1"), request, store);
    const retried = await commitReviewedImport(createTestUserContext("user_1"), request, store);
    expect(retried.alreadyCommitted).toBe(true);
    expect(store.transactions).toHaveLength(1);
    expect(store.rows).toHaveLength(3);
  });

  it("rejects missing auth, cross-user batches and unavailable merge targets", async () => {
    const store = createMemoryStore();
    await expect(commitReviewedImport(null, request, store)).rejects.toThrow(AuthenticationRequiredError);
    await commitReviewedImport(createTestUserContext("user_1"), request, store);
    await expect(commitReviewedImport(createTestUserContext("user_2"), request, store)).rejects.toThrow(OwnershipError);
    await expect(commitReviewedImport(createTestUserContext("user_1"), { ...request, requestId: "22222222-2222-4222-8222-222222222222" }, createMemoryStore({ targetOwner: "user_2" }))).rejects.toThrow(OwnershipError);
  });

  it.each(["DELETED", "PARENT"] as const)("excludes %s manual transactions from merge targets", async (targetState) => {
    await expect(commitReviewedImport(createTestUserContext("user_1"), request, createMemoryStore({ targetState }))).rejects.toThrow(OwnershipError);
  });

  it("rolls back every record when the atomic commit fails", async () => {
    const store = createMemoryStore({ fail: true });
    await expect(commitReviewedImport(createTestUserContext("user_1"), request, store)).rejects.toThrow(/synthetic transaction failure/);
    expect(store.batches.size).toBe(0);
    expect(store.transactions).toEqual([]);
    expect(store.rows).toEqual([]);
    expect(store.audits).toEqual([]);
  });

  it("rejects raw/private fields and builds skip rows without reviewed financial content", () => {
    expect(() => importCommitRequestSchema.parse({ ...request, rawCsv: "not allowed" })).toThrow();
    expect(() => importCommitRequestSchema.parse({ ...request, rows: [{ ...request.rows[0], rawRow: ["not allowed"] }, ...request.rows.slice(1)] })).toThrow();
    expect(() => importCommitRequestSchema.parse({ ...request, rows: [{ ...request.rows[0], description: "Account 12345678" }, ...request.rows.slice(1)] })).toThrow(/private banking identifiers/i);

    const reviewRows: ImportReviewRow[] = [{
      id: "csv-row-1", rowNumber: 1, date: "2026-06-18", amountCents: -1234, description: "Should not persist", merchantName: "Should not persist", categoryId: "groceries", action: "SKIP", warningCodes: [], suggestionSource: "FALLBACK", suggestionConfidence: "LOW", suggestionReason: "Review", categoryConfirmed: false, merchantEdited: false, reviewState: "UNREVIEWED",
    }];
    const built = createImportCommitRequest({ requestId: request.requestId, rows: reviewRows, mergeSelections: {}, metadata: { ...request.metadata, parsedRowCount: 1 } });
    expect(built.rows).toEqual([{ rowNumber: 1, action: "SKIP", warningCodes: [] }]);
    expect(JSON.stringify(built)).not.toMatch(/rawCsv|rawRow|filename|accountNumber|bsb|balance|Should not persist/i);
  });

  it("keeps same-import duplicates as warning codes rather than merge targets", () => {
    const warningOnly = importCommitRequestSchema.parse({
      ...request,
      rows: [
        { ...request.rows[0], warningCodes: ["POSSIBLE_SAME_IMPORT_DUPLICATE"] },
        request.rows[1],
        request.rows[2],
      ],
    });
    expect(warningOnly.rows[0]).not.toHaveProperty("targetTransactionId");
    expect(warningOnly.rows[0].warningCodes).toContain("POSSIBLE_SAME_IMPORT_DUPLICATE");
  });

  it("records likely existing duplicates as safe skipped outcomes without creating transactions", async () => {
    const store = createMemoryStore();
    const duplicateSkip = importCommitRequestSchema.parse({
      ...request,
      requestId: "33333333-3333-4333-8333-333333333333",
      rows: [
        { rowNumber: 1, action: "SKIP", warningCodes: ["LIKELY_EXISTING_DUPLICATE"] },
      ],
      metadata: {
        ...request.metadata,
        parsedRowCount: 1,
        privateFieldCount: 0,
        warningCodes: [],
      },
    });

    const result = await commitReviewedImport(createTestUserContext("user_1"), duplicateSkip, store);

    expect(result).toMatchObject({ importedCount: 0, skippedCount: 1 });
    expect(store.transactions).toEqual([]);
    expect(store.rows).toEqual([
      {
        rowNumber: 1,
        action: "SKIP",
        status: "SKIPPED",
        warningCodes: ["LIKELY_EXISTING_DUPLICATE"],
      },
    ]);
    expect(JSON.stringify(store.rows)).not.toMatch(/description|merchant|raw|filename|account|bsb|balance/i);
  });

  it("stores only safe aggregate audit metadata", async () => {
    const store = createMemoryStore();
    await commitReviewedImport(createTestUserContext("user_1"), request, store);
    const serialized = JSON.stringify(store.audits);
    expect(serialized).toContain("importedCount");
    expect(serialized).not.toMatch(/description|merchant|raw|filename|account|bsb|balance/i);
  });
});
