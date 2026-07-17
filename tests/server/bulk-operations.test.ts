import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  BulkOperationNotFoundError,
  BulkOperationsUnavailableError,
  BulkOperationUndoUnavailableError,
  MAX_BULK_OPERATION_ITEMS,
  bulkOperationRequestSchema,
  createBulkOperation,
  getBulkOperation,
  undoBulkOperation,
  type BulkOperationStore,
} from "@/src/server/bulk-operations";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/bulk-operations.ts", import.meta.url);
const createRoutePath = new URL(
  "../../app/api/account/transactions/bulk-operations/route.ts",
  import.meta.url,
);
const readRoutePath = new URL(
  "../../app/api/account/transactions/bulk-operations/[operationId]/route.ts",
  import.meta.url,
);
const undoRoutePath = new URL(
  "../../app/api/account/transactions/bulk-operations/[operationId]/undo/route.ts",
  import.meta.url,
);

function operation(overrides: Record<string, unknown> = {}) {
  return {
    id: "bulk_1",
    userId: "user_1",
    type: "SET_CATEGORY" as const,
    status: "COMPLETED" as const,
    requestedCount: 2,
    appliedCount: 2,
    skippedCount: 0,
    failedCount: 0,
    undoBlockedCount: 0,
    undoExpiresAt: new Date("2026-07-17T01:30:00.000Z"),
    revertedAt: null,
    ...overrides,
  };
}

function createMemoryStore(overrides: Partial<BulkOperationStore> = {}) {
  const applyCalls: Array<{ userId: string; transactionId: string }> = [];
  const undoCalls: Array<{ userId: string; itemId: string }> = [];
  const store: BulkOperationStore = {
    async resolveTarget() {
      return { targetCategoryId: "category_1", targetPropertyId: null };
    },
    async createOperation() {
      return operation({ status: "RUNNING" });
    },
    async applyItem(userId, _operationId, _input, _target, transactionId) {
      applyCalls.push({ userId, transactionId });
      return transactionId === "transaction_2"
        ? { status: "FAILED", reason: "NOT_FOUND_OR_NOT_OWNED" }
        : { status: "APPLIED" };
    },
    async finalizeOperation() {
      return operation({
        status: "PARTIAL",
        appliedCount: 1,
        failedCount: 1,
      });
    },
    async findOperation() {
      return operation();
    },
    async listReasonCounts() {
      return { NOT_FOUND_OR_NOT_OWNED: 1 };
    },
    async listAppliedItemIds() {
      return ["item_1", "item_2"];
    },
    async undoItem(userId, _operationId, itemId) {
      undoCalls.push({ userId, itemId });
      return "REVERTED";
    },
    async finalizeUndo() {
      return operation({
        status: "REVERTED",
        revertedAt: new Date("2026-07-17T01:10:00.000Z"),
      });
    },
    ...overrides,
  };
  return { store, applyCalls, undoCalls };
}

describe("Phase 6 prepared bulk operation boundary", () => {
  it("fails closed while the migration-dependent runtime gate is disabled", async () => {
    const resolveTarget = vi.fn();
    const { store } = createMemoryStore({ resolveTarget });

    await expect(createBulkOperation(
      createTestUserContext("user_1"),
      {
        type: "SET_CATEGORY",
        transactionIds: ["transaction_1"],
        targetCategoryId: "category_1",
      },
      store,
    )).rejects.toBeInstanceOf(BulkOperationsUnavailableError);
    expect(resolveTarget).not.toHaveBeenCalled();
  });

  it("rejects duplicate IDs and requests above the bounded limit", () => {
    expect(bulkOperationRequestSchema.safeParse({
      type: "UNLINK_PROPERTY",
      transactionIds: ["transaction_1", "transaction_1"],
    }).success).toBe(false);

    expect(bulkOperationRequestSchema.safeParse({
      type: "UNLINK_PROPERTY",
      transactionIds: Array.from(
        { length: MAX_BULK_OPERATION_ITEMS + 1 },
        (_, index) => `transaction_${index}`,
      ),
    }).success).toBe(false);
  });

  it("processes owner-scoped records independently and returns safe partial counts", async () => {
    const { store, applyCalls } = createMemoryStore();
    const result = await createBulkOperation(
      createTestUserContext("user_1"),
      {
        type: "SET_CATEGORY",
        transactionIds: ["transaction_1", "transaction_2"],
        targetCategoryId: "category_1",
      },
      store,
      new Date("2026-07-17T01:00:00.000Z"),
      { runtimeEnabled: true },
    );

    expect(applyCalls).toEqual([
      { userId: "user_1", transactionId: "transaction_1" },
      { userId: "user_1", transactionId: "transaction_2" },
    ]);
    expect(result).toMatchObject({
      status: "PARTIAL",
      requestedCount: 2,
      appliedCount: 1,
      failedCount: 1,
      reasonCounts: { NOT_FOUND_OR_NOT_OWNED: 1 },
    });
  });

  it("fails closed when an operation is not owned by the signed-in account", async () => {
    const { store } = createMemoryStore({
      async findOperation() {
        return null;
      },
    });
    await expect(getBulkOperation(
      createTestUserContext("user_2"),
      "bulk_1",
      store,
      { runtimeEnabled: true },
    )).rejects.toBeInstanceOf(BulkOperationNotFoundError);
  });

  it("enforces the 30-minute undo window before touching an item", async () => {
    const listAppliedItemIds = vi.fn();
    const { store } = createMemoryStore({
      async findOperation() {
        return operation({
          undoExpiresAt: new Date("2026-07-17T01:30:00.000Z"),
        });
      },
      listAppliedItemIds,
    });

    await expect(undoBulkOperation(
      createTestUserContext("user_1"),
      "bulk_1",
      store,
      new Date("2026-07-17T01:30:00.001Z"),
      { runtimeEnabled: true },
    )).rejects.toBeInstanceOf(BulkOperationUndoUnavailableError);
    expect(listAppliedItemIds).not.toHaveBeenCalled();
  });

  it("undoes only the owner operation items selected by the store", async () => {
    const { store, undoCalls } = createMemoryStore();
    const result = await undoBulkOperation(
      createTestUserContext("user_1"),
      "bulk_1",
      store,
      new Date("2026-07-17T01:10:00.000Z"),
      { runtimeEnabled: true },
    );
    expect(undoCalls).toEqual([
      { userId: "user_1", itemId: "item_1" },
      { userId: "user_1", itemId: "item_2" },
    ]);
    expect(result.status).toBe("REVERTED");
  });

  it("keeps routes authenticated, bounded and migration-gated", async () => {
    const [service, createRoute, readRoute, undoRoute] = await Promise.all([
      readFile(servicePath, "utf8"),
      readFile(createRoutePath, "utf8"),
      readFile(readRoutePath, "utf8"),
      readFile(undoRoutePath, "utf8"),
    ]);

    expect(service).toContain("BULK_OPERATIONS_RUNTIME_ENABLED = false");
    expect(service).toContain("NOT_FOUND_OR_NOT_OWNED");
    expect(service).toContain("Do not persist a missing or another user's opaque transaction ID");
    expect(createRoute).toContain("getCurrentUserContext()");
    expect(createRoute).toContain("readBoundedJsonBody");
    expect(createRoute).toContain("BulkOperationsUnavailableError");
    expect(readRoute).toContain("getCurrentUserContext()");
    expect(undoRoute).toContain("getCurrentUserContext()");
    expect(undoRoute).toContain("BulkOperationsUnavailableError");
  });
});
