import { describe, expect, it, vi } from "vitest";
import {
  listRecentActivityHistory,
  listTransactionActivityHistory,
  mapActivityHistoryItem,
  type ActivityAuditRecord,
  type ActivityHistoryStore,
} from "@/src/server/activity-history";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

function audit(overrides: Partial<ActivityAuditRecord> = {}): ActivityAuditRecord {
  return {
    id: "audit_1",
    userId: "user_1",
    entityType: "TRANSACTION",
    entityId: "transaction_1",
    action: "UPDATED",
    metadata: null,
    createdAt: new Date("2026-07-26T01:02:03.000Z"),
    ...overrides,
  };
}

function createStore(overrides: Partial<ActivityHistoryStore> = {}) {
  const listRecent = vi.fn(async () => [audit()]);
  const findOwnedTransaction = vi.fn(async (userId: string, transactionId: string) => ({ id: transactionId, userId }));
  const listForTransaction = vi.fn(async () => [audit()]);
  const store: ActivityHistoryStore = {
    listRecent,
    findOwnedTransaction,
    listForTransaction,
    ...overrides,
  };
  return { store, listRecent, findOwnedTransaction, listForTransaction };
}

describe("privacy-safe activity history", () => {
  it("fails before persistence access without an authenticated user", async () => {
    const { store, listRecent } = createStore();
    await expect(listRecentActivityHistory(null, store)).rejects.toMatchObject({ name: "AuthenticationRequiredError" });
    expect(listRecent).not.toHaveBeenCalled();
  });

  it("bounds account history and omits entity IDs and raw metadata", async () => {
    const privateMetadata = {
      description: "private merchant narration",
      amountCents: 999_999,
      fileName: "private.csv",
      accountNumber: "123456789",
      providerResponse: "internal",
    };
    const listRecent = vi.fn(async () => [audit({ metadata: privateMetadata })]);
    const { store } = createStore({ listRecent });

    const result = await listRecentActivityHistory(createTestUserContext("user_1"), store);
    expect(listRecent).toHaveBeenCalledWith("user_1", 100);
    expect(result).toEqual([{
      id: "audit_1",
      occurredAt: "2026-07-26T01:02:03.000Z",
      family: "Transactions",
      actionLabel: "Updated",
      entityType: "TRANSACTION",
      summary: "Transaction updated.",
    }]);
    expect(JSON.stringify(result)).not.toMatch(/merchant|999999|private\.csv|123456789|providerResponse|metadata/i);
  });

  it("uses only allowlisted state and bounded aggregate counts", () => {
    expect(mapActivityHistoryItem(audit({ metadata: {
      propertyLinkState: "UNLINKED",
      exactAddress: "private",
      amountCents: 50_000,
    } }))).toMatchObject({ summary: "Property link removed." });

    expect(mapActivityHistoryItem(audit({
      entityType: "IMPORT_UNDO_OPERATION",
      entityId: "undo_1",
      action: "UPDATED",
      metadata: { undoneCount: 8, blockedCount: 2, arbitraryNumber: 700_000 },
    }))).toMatchObject({
      family: "Imports",
      summary: "Import undo completed for 8 eligible rows; 2 rows were left unchanged.",
    });

    expect(mapActivityHistoryItem(audit({
      entityType: "BULK_OPERATION",
      entityId: "bulk_1",
      action: "UPDATED",
      metadata: { appliedCount: 4, skippedCount: 1, nested: { narration: "private" } },
    }))).toMatchObject({
      family: "Transactions",
      summary: "Bulk operation completed for 4 transactions; 1 transaction was left unchanged.",
    });
  });

  it("falls back to a generic summary for unknown metadata shapes", () => {
    expect(mapActivityHistoryItem(audit({
      entityType: "CATEGORY",
      entityId: "category_1",
      action: "UPDATED",
      metadata: { unknown: { freeText: "do not expose" } },
    }))).toEqual({
      id: "audit_1",
      occurredAt: "2026-07-26T01:02:03.000Z",
      family: "Categories",
      actionLabel: "Updated",
      entityType: "CATEGORY",
      summary: "Category updated.",
    });
  });

  it("proves transaction ownership before returning a bounded history", async () => {
    const { store, findOwnedTransaction, listForTransaction } = createStore();
    const result = await listTransactionActivityHistory(
      createTestUserContext("user_1"),
      "transaction_1",
      store,
    );

    expect(findOwnedTransaction).toHaveBeenCalledWith("user_1", "transaction_1");
    expect(listForTransaction).toHaveBeenCalledWith("user_1", "transaction_1", 50);
    expect(result[0]).toMatchObject({ entityId: "transaction_1", summary: "Transaction updated." });
  });

  it("denies missing or cross-user transactions before querying their audit rows", async () => {
    const listForTransaction = vi.fn();
    const { store } = createStore({
      async findOwnedTransaction() {
        return null;
      },
      listForTransaction,
    });

    await expect(listTransactionActivityHistory(
      createTestUserContext("user_1"),
      "transaction_other",
      store,
    )).rejects.toMatchObject({ name: "OwnershipError" });
    expect(listForTransaction).not.toHaveBeenCalled();
  });
});
