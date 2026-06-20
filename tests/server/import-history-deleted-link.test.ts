import { describe, expect, it } from "vitest";
import { listSafeImportHistory, type ImportHistoryStore } from "@/src/server/import-history";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

describe("import history after imported transaction deletion", () => {
  it("keeps the committed row outcome and reports only a safe deleted link state", async () => {
    const timestamp = new Date("2026-06-20T00:00:00.000Z");
    const store: ImportHistoryStore = {
      async listBatches() {
        return [{
          id: "batch-1", userId: "user_1", status: "COMPLETED", rowCount: 1, importedCount: 1, skippedCount: 0, mergedCount: 0, privateFieldCount: 0, warningCodes: [], createdAt: timestamp, completedAt: timestamp,
          importRows: [{ userId: "user_1", rowNumber: 1, action: "IMPORT", status: "COMMITTED", warningCodes: [], committedTransaction: { userId: "user_1", source: "IMPORTED", status: "DELETED" }, matchedTransaction: null }],
        }];
      },
      async listAudits() { return []; },
    };
    const history = await listSafeImportHistory(createTestUserContext("user_1"), store);
    expect(history[0].outcomes).toEqual([{ rowNumber: 1, outcome: "IMPORTED", linkedTransaction: "IMPORTED", linkState: "DELETED", warningCount: 0 }]);
    expect(JSON.stringify(history)).not.toMatch(/description|merchant|amount|raw|filename|account|bsb|balance/i);
  });
});
