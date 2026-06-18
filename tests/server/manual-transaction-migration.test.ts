import { describe, expect, it } from "vitest";
import { manualCategories, type ManualCategory } from "@/lib/manual-categories";
import { manualTransactionMigrationRequestSchema, type ManualTransactionMigrationItem } from "@/lib/manual-transaction-migration";
import { AuthenticationRequiredError } from "@/src/server/auth/ownership";
import {
  migrateDurableManualTransactions,
  type DbManualTransactionRecord,
  type ManualTransactionPersistenceStore,
} from "@/src/server/manual-transactions";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const groceries = manualCategories.find((category) => category.name === "Groceries")!;
const timestamp = "2026-06-19T00:00:00.000Z";

function migrationItem(overrides: Partial<ManualTransactionMigrationItem> = {}): ManualTransactionMigrationItem {
  return {
    id: "local-transaction-1",
    type: "EXPENSE",
    source: "MANUAL",
    amountCents: -1234,
    date: "2026-06-18",
    description: "Synthetic grocer",
    categoryId: groceries.id,
    notes: "",
    csvMatchHint: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    ...overrides,
  };
}

function createMigrationStore() {
  const records: DbManualTransactionRecord[] = [];
  const categories = new Map<string, { id: string; name: string; type: string; parent: { name: string } }>();
  const store: ManualTransactionPersistenceStore & { records: typeof records } = {
    records,
    async listActive(userId) {
      return records.filter((record) => record.userId === userId && !record.deletedAt);
    },
    async findActiveById(userId, transactionId) {
      return records.find((record) => record.userId === userId && record.id === transactionId && !record.deletedAt) ?? null;
    },
    async findById(userId, transactionId) {
      return records.find((record) => record.userId === userId && record.id === transactionId) ?? null;
    },
    async create(userId, data) {
      const category = categories.get(`${userId}:${data.categoryId}`);
      if (!category) throw new Error("category not materialised");
      const record: DbManualTransactionRecord = {
        id: data.id ?? `created-${records.length + 1}`,
        userId,
        type: data.type,
        amountCents: data.amountCents,
        date: data.date,
        description: data.description,
        categoryId: data.categoryId,
        category,
        notes: data.notes,
        csvMatchHint: data.csvMatchHint,
        createdAt: new Date(timestamp),
        updatedAt: new Date(timestamp),
        deletedAt: null,
      };
      records.push(record);
      return record;
    },
    async update() {
      throw new Error("not used");
    },
    async softDelete() {
      throw new Error("not used");
    },
    async resolveSeededCategoryId(userId, category: ManualCategory) {
      const id = `db-${category.id}`;
      categories.set(`${userId}:${id}`, { id, name: category.name, type: category.type, parent: { name: category.group } });
      return id;
    },
  };
  return store;
}

describe("manual transaction migration assistant", () => {
  it("moves active device entries once and safely skips retries and deleted entries", async () => {
    const store = createMigrationStore();
    const input = [migrationItem(), migrationItem({ id: "deleted-local", deletedAt: timestamp })];
    const first = await migrateDurableManualTransactions(createTestUserContext("user_1"), input, store);
    expect(first).toMatchObject({ importedCount: 1, skippedCount: 1 });
    expect(first.transactions).toEqual([expect.objectContaining({ description: "Synthetic grocer", amountCents: -1234, source: "MANUAL" })]);

    const retry = await migrateDurableManualTransactions(createTestUserContext("user_1"), input, store);
    expect(retry).toMatchObject({ importedCount: 0, skippedCount: 2 });
    expect(store.records).toHaveLength(1);
  });

  it("keeps deterministic migration identities user-scoped", async () => {
    const store = createMigrationStore();
    await migrateDurableManualTransactions(createTestUserContext("user_1"), [migrationItem()], store);
    await migrateDurableManualTransactions(createTestUserContext("user_2"), [migrationItem()], store);
    expect(store.records).toHaveLength(2);
    expect(new Set(store.records.map((record) => record.id)).size).toBe(2);
    expect(new Set(store.records.map((record) => record.userId))).toEqual(new Set(["user_1", "user_2"]));
  });

  it("requires authentication before reading or writing migration data", async () => {
    const store = createMigrationStore();
    await expect(migrateDurableManualTransactions(null, [migrationItem()], store)).rejects.toThrow(AuthenticationRequiredError);
    expect(store.records).toEqual([]);
  });

  it("rejects raw fields, private identifiers and invalid money direction", () => {
    expect(() => manualTransactionMigrationRequestSchema.parse({ transactions: [migrationItem()], rawCsv: "not allowed" })).toThrow();
    expect(() => manualTransactionMigrationRequestSchema.parse({ transactions: [{ ...migrationItem(), rawRow: ["not allowed"] }] })).toThrow();
    expect(() => manualTransactionMigrationRequestSchema.parse({ transactions: [migrationItem({ description: "Account 12345678" })] })).toThrow(/private banking identifiers/i);
    expect(() => manualTransactionMigrationRequestSchema.parse({ transactions: [migrationItem({ amountCents: 1234 })] })).toThrow(/negative integer cents/i);
  });
});
