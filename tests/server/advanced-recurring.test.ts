import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  AdvancedRecurringConflictError,
  AdvancedRecurringUnavailableError,
  listAdvancedRecurringItems,
  listRecurringInstanceCandidates,
  mutateAdvancedRecurringItem,
  recurringInstanceCompatibility,
  type AdvancedRecurringItemRecord,
  type AdvancedRecurringStore,
} from "@/src/server/advanced-recurring";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/advanced-recurring.ts", import.meta.url);
const detectorPath = new URL("../../src/server/recurring-suggestions.ts", import.meta.url);

function transaction(overrides: Record<string, unknown> = {}) {
  return {
    id: "transaction_1",
    userId: "user_1",
    date: new Date("2026-07-17T00:00:00.000Z"),
    amountCents: -2_500,
    type: "EXPENSE",
    status: "ACTIVE",
    splitRole: "NONE",
    deletedAt: null,
    ...overrides,
  };
}

function item(overrides: Partial<AdvancedRecurringItemRecord> = {}): AdvancedRecurringItemRecord {
  return {
    id: "recurring_1",
    userId: "user_1",
    label: "Streaming",
    transactionType: "EXPENSE",
    expectedAmountCents: -2_500,
    expectedAmountMinCents: null,
    expectedAmountMaxCents: null,
    cadence: "MONTHLY",
    nextExpectedDate: new Date("2026-08-17T00:00:00.000Z"),
    source: "CONFIRMED_SUGGESTION",
    detectionConfidence: "USER_CONFIRMED",
    status: "ACTIVE",
    archivedAt: null,
    updatedAt: new Date("2026-07-17T00:00:00.000Z"),
    instances: [],
    ...overrides,
  };
}

function memoryStore(overrides: Partial<AdvancedRecurringStore> = {}) {
  const calls: Array<{ action: string; userId: string }> = [];
  const store: AdvancedRecurringStore = {
    async listCandidates(userId) {
      calls.push({ action: "candidates", userId });
      return [transaction({ userId })] as never;
    },
    async list(userId) {
      calls.push({ action: "list", userId });
      return [item({ userId })];
    },
    async setStatus(userId, _itemId, _updatedAt, status) {
      calls.push({ action: "status", userId });
      return item({ userId, status });
    },
    async linkInstance(userId) {
      calls.push({ action: "link", userId });
      return {
        item: item({
          userId,
          instances: [{
            id: "instance_1",
            userId,
            recurringItemId: "recurring_1",
            transactionId: "transaction_1",
            linkedAt: new Date("2026-07-17T00:00:00.000Z"),
            unlinkedAt: null,
            transaction: transaction({ userId }),
          }],
        }),
      };
    },
    async unlinkInstance(userId) {
      calls.push({ action: "unlink", userId });
      return item({ userId });
    },
    ...overrides,
  };
  return { store, calls };
}

describe("Phase 9 guarded recurring lifecycle service", () => {
  it("fails closed before store access", async () => {
    const list = vi.fn();
    const { store } = memoryStore({ list });
    await expect(listAdvancedRecurringItems(createTestUserContext("user_1"), store))
      .rejects.toBeInstanceOf(AdvancedRecurringUnavailableError);
    expect(list).not.toHaveBeenCalled();
  });

  it("keeps lifecycle changes user initiated and owner scoped", async () => {
    const { store, calls } = memoryStore();
    const result = await mutateAdvancedRecurringItem(
      createTestUserContext("user_9"),
      {
        action: "SET_STATUS",
        itemId: "recurring_1",
        updatedAt: "2026-07-17T00:00:00.000Z",
        status: "PAUSED",
      },
      store,
      new Date(),
      { runtimeEnabled: true },
    );
    expect(calls).toEqual([{ action: "status", userId: "user_9" }]);
    expect(result.status).toBe("PAUSED");
  });

  it("links one existing eligible cashflow transaction without creating another", async () => {
    const { store } = memoryStore();
    const result = await mutateAdvancedRecurringItem(
      createTestUserContext("user_1"),
      {
        action: "LINK_INSTANCE",
        itemId: "recurring_1",
        transactionId: "transaction_1",
      },
      store,
      new Date(),
      { runtimeEnabled: true },
    );
    expect(result.instances).toEqual([{
      id: "instance_1",
      transactionId: "transaction_1",
      date: "2026-07-17",
      amountCents: -2_500,
    }]);
  });

  it("lists only the signed-in owner's safe transaction candidates", async () => {
    const { store, calls } = memoryStore();
    const result = await listRecurringInstanceCandidates(
      createTestUserContext("user_4"), store, { runtimeEnabled: true },
    );
    expect(calls).toEqual([{ action: "candidates", userId: "user_4" }]);
    expect(result).toEqual([{
      id: "transaction_1", date: "2026-07-17", amountCents: -2_500, type: "EXPENSE",
    }]);
  });

  it("supports every approved user-confirmed lifecycle state and unlink", async () => {
    const { store, calls } = memoryStore();
    const context = createTestUserContext("user_1");
    for (const status of ["ACTIVE", "PAUSED", "CANCELLED", "UNKNOWN", "NEEDS_REVIEW", "ARCHIVED"] as const) {
      await mutateAdvancedRecurringItem(context, {
        action: "SET_STATUS", itemId: "recurring_1",
        updatedAt: "2026-07-17T00:00:00.000Z", status,
      }, store, new Date(), { runtimeEnabled: true });
    }
    await mutateAdvancedRecurringItem(context, {
      action: "UNLINK_INSTANCE", itemId: "recurring_1", instanceId: "instance_1",
    }, store, new Date(), { runtimeEnabled: true });
    expect(calls.map((call) => call.action)).toEqual([
      "status", "status", "status", "status", "status", "status", "unlink",
    ]);
  });

  it("enforces status, direction, split and signed amount compatibility", () => {
    expect(recurringInstanceCompatibility(item(), transaction())).toBeNull();
    expect(recurringInstanceCompatibility(
      item({ status: "PAUSED" }),
      transaction(),
    )).toBe("ITEM_NOT_LINKABLE");
    expect(recurringInstanceCompatibility(
      item(),
      transaction({ amountCents: 2_500, type: "INCOME" }),
    )).toBe("DIRECTION_MISMATCH");
    expect(recurringInstanceCompatibility(
      item(),
      transaction({ splitRole: "PARENT" }),
    )).toBe("TRANSACTION_NOT_ELIGIBLE");
    expect(recurringInstanceCompatibility(
      item(),
      transaction({ amountCents: -2_600 }),
    )).toBe("AMOUNT_MISMATCH");
  });

  it("fails safely for duplicate, stale or another-user records", async () => {
    const { store } = memoryStore({
      async linkInstance() {
        return { item: null, reason: "TRANSACTION_ALREADY_LINKED" };
      },
    });
    await expect(mutateAdvancedRecurringItem(
      createTestUserContext("user_2"),
      {
        action: "LINK_INSTANCE",
        itemId: "recurring_1",
        transactionId: "transaction_1",
      },
      store,
      new Date(),
      { runtimeEnabled: true },
    )).rejects.toBeInstanceOf(AdvancedRecurringConflictError);
  });

  it("preserves approved detector thresholds and avoids predicted cashflow writes", async () => {
    const [service, detector] = await Promise.all([
      readFile(servicePath, "utf8"),
      readFile(detectorPath, "utf8"),
    ]);
    expect(detector).toContain("minimumDays: 6, maximumDays: 8");
    expect(detector).toContain("minimumDays: 13, maximumDays: 16");
    expect(detector).toContain("minimumDays: 27, maximumDays: 34");
    expect(service).not.toMatch(/(?:prisma|tx)\.transaction\.(?:create|update|delete)\s*\(/);
    expect(service).not.toContain("rawNarration");
    expect(service).not.toContain("filename");
  });
});
