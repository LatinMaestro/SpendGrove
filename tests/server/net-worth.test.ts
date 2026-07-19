import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  NetWorthConflictError,
  NetWorthUnavailableError,
  buildNetWorthSnapshotValues,
  getNetWorthOverview,
  mutateNetWorth,
  netWorthMutationSchema,
  type NetWorthItemRecord,
  type NetWorthSnapshotRecord,
  type NetWorthStore,
} from "@/src/server/net-worth";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/net-worth.ts", import.meta.url);

function item(overrides: Partial<NetWorthItemRecord> = {}): NetWorthItemRecord {
  return {
    id: "item_1",
    userId: "user_1",
    propertyId: null,
    loanAccountId: null,
    name: "Savings",
    kind: "ASSET",
    category: "CASH",
    status: "ACTIVE",
    archivedAt: null,
    updatedAt: new Date("2026-07-17T00:00:00.000Z"),
    valuations: [{
      id: "valuation_1",
      valueCents: 500_000,
      valuationDate: new Date("2026-07-17T00:00:00.000Z"),
      note: null,
      deletedAt: null,
    }],
    ...overrides,
  };
}

function snapshot(overrides: Partial<NetWorthSnapshotRecord> = {}): NetWorthSnapshotRecord {
  return {
    id: "snapshot_1",
    userId: "user_1",
    snapshotDate: new Date("2026-07-17T00:00:00.000Z"),
    totalAssetCents: 500_000,
    totalLiabilityCents: 200_000,
    netWorthCents: 300_000,
    archivedAt: null,
    entries: [],
    ...overrides,
  };
}

function memoryStore(overrides: Partial<NetWorthStore> = {}) {
  const calls: Array<{ action: string; userId: string }> = [];
  const store: NetWorthStore = {
    async listLinkOptions(userId) {
      calls.push({ action: "links", userId });
      return { properties: [], loanAccounts: [] };
    },
    async listItems(userId) {
      calls.push({ action: "items", userId });
      return [item({ userId })];
    },
    async listSnapshots(userId) {
      calls.push({ action: "snapshots", userId });
      return [snapshot({ userId })];
    },
    async createItem(userId, input) {
      calls.push({ action: "create-item", userId });
      return item({ userId, ...input, valuations: [] });
    },
    async addValuation(userId, _itemId, input) {
      calls.push({ action: "valuation", userId });
      return item({
        userId,
        valuations: [{
          id: "valuation_2",
          ...input,
          deletedAt: null,
        }],
      });
    },
    async setItemStatus(userId, _itemId, _updatedAt, status) {
      calls.push({ action: "status", userId });
      return item({ userId, status });
    },
    async createSnapshot(userId, snapshotDate) {
      calls.push({ action: "snapshot", userId });
      return snapshot({ userId, snapshotDate });
    },
    ...overrides,
  };
  return { store, calls };
}

describe("Phase 9 guarded manual net worth service", () => {
  it("fails closed before store construction or access", async () => {
    const listItems = vi.fn();
    const { store } = memoryStore({ listItems });
    await expect(getNetWorthOverview(createTestUserContext("user_1"), store))
      .rejects.toBeInstanceOf(NetWorthUnavailableError);
    expect(listItems).not.toHaveBeenCalled();
  });

  it("uses positive manual magnitudes and subtracts liabilities exactly once", () => {
    const result = buildNetWorthSnapshotValues([
      item(),
      item({
        id: "item_2",
        name: "Home loan",
        kind: "LIABILITY",
        category: "HOME_LOAN",
        valuations: [{
          id: "valuation_2",
          valueCents: 200_000,
          valuationDate: new Date("2026-07-16T00:00:00.000Z"),
          note: null,
          deletedAt: null,
        }],
      }),
    ]);
    expect(result).toMatchObject({
      totalAssetCents: 500_000,
      totalLiabilityCents: 200_000,
      netWorthCents: 300_000,
    });
    expect(result.entries).toHaveLength(2);
  });

  it("ignores deleted and absent valuations when preparing a snapshot", () => {
    const result = buildNetWorthSnapshotValues([
      item({
        valuations: [{
          id: "deleted",
          valueCents: 900_000,
          valuationDate: new Date("2026-07-17T00:00:00.000Z"),
          note: null,
          deletedAt: new Date("2026-07-17T01:00:00.000Z"),
        }],
      }),
      item({ id: "item_2", valuations: [] }),
    ]);
    expect(result).toEqual({
      entries: [],
      totalAssetCents: 0,
      totalLiabilityCents: 0,
      netWorthCents: 0,
    });
  });

  it("rejects asset/liability category mismatches and unsafe source combinations", () => {
    expect(netWorthMutationSchema.safeParse({
      action: "CREATE_ITEM",
      name: "Wrong",
      kind: "ASSET",
      category: "HOME_LOAN",
      propertyId: null,
      loanAccountId: null,
    }).success).toBe(false);
    expect(netWorthMutationSchema.safeParse({
      action: "CREATE_ITEM",
      name: "Two sources",
      kind: "ASSET",
      category: "PROPERTY",
      propertyId: "property_1",
      loanAccountId: "loan_1",
    }).success).toBe(false);
  });

  it("passes only the signed-in owner to reads and writes", async () => {
    const { store, calls } = memoryStore();
    await getNetWorthOverview(
      createTestUserContext("user_8"),
      store,
      { runtimeEnabled: true },
    );
    await mutateNetWorth(
      createTestUserContext("user_8"),
      {
        action: "ADD_VALUATION",
        itemId: "item_1",
        valueCents: 750_000,
        valuationDate: "2026-07-17",
        note: null,
      },
      store,
      new Date(),
      { runtimeEnabled: true },
    );
    expect(calls).toEqual([
      { action: "items", userId: "user_8" },
      { action: "snapshots", userId: "user_8" },
      { action: "links", userId: "user_8" },
      { action: "valuation", userId: "user_8" },
    ]);
  });

  it("supports item creation, valuation, archive, restore and immutable snapshot creation", async () => {
    const { store, calls } = memoryStore();
    const context = createTestUserContext("user_1");
    await mutateNetWorth(context, {
      action: "CREATE_ITEM", name: "Manual asset", kind: "ASSET", category: "OTHER_ASSET",
      propertyId: null, loanAccountId: null,
    }, store, new Date(), { runtimeEnabled: true });
    await mutateNetWorth(context, {
      action: "ADD_VALUATION", itemId: "item_1", valueCents: 250000,
      valuationDate: "2026-07-19", note: "Manual value",
    }, store, new Date(), { runtimeEnabled: true });
    for (const status of ["ARCHIVED", "ACTIVE"] as const) {
      await mutateNetWorth(context, {
        action: "SET_ITEM_STATUS", itemId: "item_1",
        updatedAt: "2026-07-17T00:00:00.000Z", status,
      }, store, new Date(), { runtimeEnabled: true });
    }
    await mutateNetWorth(context, {
      action: "CREATE_SNAPSHOT", snapshotDate: "2026-07-19",
    }, store, new Date(), { runtimeEnabled: true });
    expect(calls.map((call) => call.action)).toEqual([
      "create-item", "valuation", "status", "status", "snapshot",
    ]);
  });

  it("fails safely for missing or another-user linked records", async () => {
    const { store } = memoryStore({
      async createItem() {
        return null;
      },
    });
    await expect(mutateNetWorth(
      createTestUserContext("user_2"),
      {
        action: "CREATE_ITEM",
        name: "Home",
        kind: "ASSET",
        category: "PROPERTY",
        propertyId: "property_other_user",
        loanAccountId: null,
      },
      store,
      new Date(),
      { runtimeEnabled: true },
    )).rejects.toBeInstanceOf(NetWorthConflictError);
  });

  it("does not infer balances from transactions, loans, Properties or providers", async () => {
    const service = await readFile(servicePath, "utf8");
    expect(service).toContain("isVerifiedPreviewRuntime()");
    expect(service).not.toMatch(/transaction\.(find|create|update|delete)/);
    expect(service).not.toContain("rawCsv");
    expect(service).not.toContain("accountNumber");
    expect(service).not.toContain("provider");
    expect(service).not.toContain("forecast");
  });
});
