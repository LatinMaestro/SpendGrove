import { describe, expect, it } from "vitest";
import { AuthenticationRequiredError } from "@/src/server/auth/ownership";
import { listSafeImportHistory, type ImportHistoryStore } from "@/src/server/import-history";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

type StoredBatch = Awaited<ReturnType<ImportHistoryStore["listBatches"]>>[number];
type StoredAudit = Awaited<ReturnType<ImportHistoryStore["listAudits"]>>[number];

function createStore(input: { batches?: StoredBatch[]; audits?: StoredAudit[]; fail?: boolean } = {}) {
  const requests: Array<{ operation: string; userId: string }> = [];
  const store: ImportHistoryStore & { requests: typeof requests } = {
    requests,
    async listBatches(userId) {
      requests.push({ operation: "batches", userId });
      if (input.fail) throw new Error("synthetic history unavailable");
      return input.batches ?? [];
    },
    async listAudits(userId) {
      requests.push({ operation: "audits", userId });
      return input.audits ?? [];
    },
  };
  return store;
}

const completedAt = new Date("2026-06-19T01:00:00.000Z");

function syntheticBatch(overrides: Partial<StoredBatch> = {}): StoredBatch {
  return {
    id: "batch_owned",
    userId: "user_1",
    status: "COMPLETED",
    rowCount: 3,
    importedCount: 1,
    skippedCount: 1,
    mergedCount: 1,
    privateFieldCount: 2,
    warningCodes: ["PRIVATE_COLUMNS_EXCLUDED"],
    createdAt: completedAt,
    completedAt,
    importRows: [
      {
        userId: "user_1",
        rowNumber: 1,
        action: "IMPORT",
        status: "COMMITTED",
        warningCodes: [],
        committedTransaction: { userId: "user_1", source: "IMPORTED", status: "ACTIVE" },
        matchedTransaction: null,
      },
      {
        userId: "user_1",
        rowNumber: 2,
        action: "SKIP",
        status: "SKIPPED",
        warningCodes: ["ROWS_NEED_REVIEW"],
        committedTransaction: null,
        matchedTransaction: null,
      },
      {
        userId: "user_1",
        rowNumber: 3,
        action: "MERGE",
        status: "MERGED",
        warningCodes: [],
        committedTransaction: null,
        matchedTransaction: { userId: "user_2", source: "MANUAL", status: "ACTIVE" },
      },
    ],
    ...overrides,
  };
}

describe("safe durable import history", () => {
  it("requires authenticated ownership before reading history", async () => {
    await expect(listSafeImportHistory(null, createStore())).rejects.toThrow(AuthenticationRequiredError);
  });

  it("returns only owned batches, owned row outcomes and safe linked transaction state", async () => {
    const owned = syntheticBatch() as StoredBatch & {
      originalFileName: string;
      rawCsv: string;
      rawBankDescription: string;
    };
    owned.originalFileName = "secret-statement.csv";
    owned.rawCsv = "raw synthetic csv content";
    owned.rawBankDescription = "Account 12345678 RAW BANK NARRATION";
    owned.importRows.push({
      userId: "user_2",
      rowNumber: 99,
      action: "IMPORT",
      status: "COMMITTED",
      warningCodes: [],
      committedTransaction: { userId: "user_2", source: "IMPORTED", status: "ACTIVE" },
      matchedTransaction: null,
    });

    const store = createStore({
      batches: [owned, syntheticBatch({ id: "batch_other", userId: "user_2" })],
      audits: [
        {
          userId: "user_1",
          entityId: "batch_owned",
          action: "IMPORTED",
          createdAt: completedAt,
          metadata: {
            totalCount: 3,
            importedCount: 1,
            skippedCount: 1,
            mergedCount: 1,
            warningCount: 1,
            privateFieldCount: 2,
            originalFileName: "secret-statement.csv",
            rawBankDescription: "Account 12345678",
          },
        },
        {
          userId: "user_2",
          entityId: "batch_owned",
          action: "IMPORTED",
          createdAt: completedAt,
          metadata: { totalCount: 999 },
        },
      ],
    });

    const result = await listSafeImportHistory(createTestUserContext("user_1"), store);
    expect(store.requests).toEqual([
      { operation: "batches", userId: "user_1" },
      { operation: "audits", userId: "user_1" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      batchId: "batch_owned",
      totalCount: 3,
      importedCount: 1,
      skippedCount: 1,
      mergedCount: 1,
      privateFieldCount: 2,
      hiddenOutcomeCount: 0,
    });
    expect(result[0].outcomes).toEqual([
      { rowNumber: 1, outcome: "IMPORTED", linkedTransaction: "IMPORTED", linkState: "ACTIVE", warningCount: 0 },
      { rowNumber: 2, outcome: "SKIPPED", linkedTransaction: "NONE", linkState: "NOT_APPLICABLE", warningCount: 1 },
      { rowNumber: 3, outcome: "MERGED", linkedTransaction: "MANUAL", linkState: "UNAVAILABLE", warningCount: 0 },
    ]);
    expect(result[0].audit?.metadata).toEqual({
      totalCount: 3,
      importedCount: 1,
      skippedCount: 1,
      mergedCount: 1,
      warningCount: 1,
      privateFieldCount: 2,
    });
    expect(JSON.stringify(result)).not.toMatch(/secret-statement|raw synthetic|RAW BANK NARRATION|12345678|originalFileName|rawBankDescription/i);
  });

  it("returns a safe empty state when the account has no committed imports", async () => {
    await expect(listSafeImportHistory(createTestUserContext("user_1"), createStore())).resolves.toEqual([]);
  });

  it("propagates a read failure so the API and UI can show a safe retry state", async () => {
    await expect(listSafeImportHistory(createTestUserContext("user_1"), createStore({ fail: true })))
      .rejects.toThrow("synthetic history unavailable");
  });

  it("limits row outcomes without changing aggregate counts", async () => {
    const result = await listSafeImportHistory(
      createTestUserContext("user_1"),
      createStore({ batches: [syntheticBatch()] }),
      { rowLimit: 2 },
    );
    expect(result[0].outcomes).toHaveLength(2);
    expect(result[0].hiddenOutcomeCount).toBe(1);
    expect(result[0].totalCount).toBe(3);
  });
});
