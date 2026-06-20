import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { manualCategories, type ManualCategory } from "@/lib/manual-categories";
import type { ManualTransactionDraft } from "@/lib/manual-transactions";
import { OwnershipError } from "@/src/server/auth/ownership";
import { listDurableManualTransactions, softDeleteDurableManualTransaction, updateDurableManualTransaction, type ManualTransactionPersistenceStore } from "@/src/server/manual-transactions";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const groceries = manualCategories.find((category) => category.name === "Groceries")!;
const transport = manualCategories.find((category) => category.name === "Transport")!;

function createImportedStore() {
  const categories = new Map<string, { id: string; name: string; type: string; parent: { name: string } }>();
  const imported = {
    id: "imported-1",
    userId: "user_1",
    type: "EXPENSE",
    source: "IMPORTED",
    amountCents: -1234,
    date: new Date("2026-06-19T00:00:00.000Z"),
    description: "Synthetic imported merchant",
    categoryId: "db-groceries",
    category: { id: "db-groceries", name: groceries.name, type: groceries.type, parent: { name: groceries.group } },
    notes: null,
    csvMatchHint: false,
    status: "ACTIVE",
    splitRole: "NONE",
    createdAt: new Date("2026-06-19T01:00:00.000Z"),
    updatedAt: new Date("2026-06-19T01:00:00.000Z"),
    deletedAt: null as Date | null,
    importBatchId: "batch-1",
    committedImportRowId: "import-row-1",
  };
  categories.set("user_1:db-groceries", imported.category);

  const store: ManualTransactionPersistenceStore & { imported: typeof imported } = {
    imported,
    async listActive(userId) { return userId === imported.userId && imported.status === "ACTIVE" && !imported.deletedAt ? [imported] as never : []; },
    async findActiveById(userId, transactionId) { return userId === imported.userId && transactionId === imported.id && imported.status === "ACTIVE" && !imported.deletedAt ? imported as never : null; },
    async create() { throw new Error("not used"); },
    async update(userId, transactionId, data) {
      if (userId !== imported.userId || transactionId !== imported.id) throw new Error("record not found");
      const category = categories.get(`${userId}:${data.categoryId}`);
      if (!category) throw new Error("category not materialised");
      Object.assign(imported, { type: data.type, amountCents: data.amountCents, date: data.date, description: data.description, categoryId: data.categoryId, category, notes: data.notes || null, csvMatchHint: data.csvMatchHint, updatedAt: new Date("2026-06-20T00:00:00.000Z") });
      return imported as never;
    },
    async softDelete(userId, transactionId, deletedAt) {
      if (userId !== imported.userId || transactionId !== imported.id) throw new Error("record not found");
      imported.status = "DELETED"; imported.deletedAt = deletedAt; imported.updatedAt = deletedAt;
      return imported as never;
    },
    async resolveSeededCategoryId(userId, category: ManualCategory) {
      const id = `db-${category.name.toLocaleLowerCase("en-AU").replace(/[^a-z0-9]+/g, "-")}`;
      categories.set(`${userId}:${id}`, { id, name: category.name, type: category.type, parent: { name: category.group } });
      return id;
    },
  };
  return store;
}

const editDraft: ManualTransactionDraft = { type: "EXPENSE", amountInput: "25.00", date: "2026-06-20", description: "Edited imported merchant", categoryId: transport.id, notes: "Safe note", csvMatchHint: false };

async function source(path: string) { return readFile(new URL(`../../${path}`, import.meta.url), "utf8"); }

describe("imported account transaction management", () => {
  it("lists imported and manual account records through the same active projection", async () => {
    const store = createImportedStore();
    const transactions = await listDurableManualTransactions(createTestUserContext("user_1"), store);
    expect(transactions).toEqual([expect.objectContaining({ id: "imported-1", source: "IMPORTED", description: "Synthetic imported merchant", categoryId: groceries.id })]);
  });

  it("edits and soft-deletes a user-owned imported transaction without changing its import links", async () => {
    const store = createImportedStore();
    const edited = await updateDurableManualTransaction(createTestUserContext("user_1"), "imported-1", editDraft, store);
    expect(edited).toMatchObject({ source: "IMPORTED", description: "Edited imported merchant", amountCents: -2500, categoryId: transport.id, notes: "Safe note" });
    expect(store.imported).toMatchObject({ importBatchId: "batch-1", committedImportRowId: "import-row-1" });

    await softDeleteDurableManualTransaction(createTestUserContext("user_1"), "imported-1", store, new Date("2026-06-20T01:00:00.000Z"));
    expect(await listDurableManualTransactions(createTestUserContext("user_1"), store)).toEqual([]);
    expect(store.imported).toMatchObject({ status: "DELETED", importBatchId: "batch-1", committedImportRowId: "import-row-1" });
  });

  it("rejects cross-user edit and delete access", async () => {
    const store = createImportedStore();
    await expect(updateDurableManualTransaction(createTestUserContext("user_2"), "imported-1", editDraft, store)).rejects.toThrow(OwnershipError);
    await expect(softDeleteDurableManualTransaction(createTestUserContext("user_2"), "imported-1", store)).rejects.toThrow(OwnershipError);
  });

  it("does not delete import batch, import row or audit history when a transaction is soft-deleted", async () => {
    const server = await source("src/server/manual-transactions.ts");
    expect(server).toContain('status: "DELETED"');
    expect(server).not.toMatch(/importBatch\.(?:delete|deleteMany)/);
    expect(server).not.toMatch(/importRow\.(?:delete|deleteMany)/);
    expect(server).not.toMatch(/auditEvent\.(?:delete|deleteMany)/);
  });
});
