import { describe, expect, it } from "vitest";
import { manualCategories, type ManualCategory, type ManualCategoryType } from "@/lib/manual-categories";
import { duplicateManualTransactionToDraft, type ManualTransactionDraft } from "@/lib/manual-transactions";
import { AuthenticationRequiredError, OwnershipError } from "@/src/server/auth/ownership";
import {
  createDurableManualTransaction,
  listDurableManualTransactions,
  listDurableManualTransactionsForMonth,
  softDeleteDurableManualTransaction,
  updateDurableManualTransaction,
  type ManualTransactionPersistenceStore,
} from "@/src/server/manual-transactions";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const groceriesCategory = manualCategories.find((category) => category.name === "Groceries")!;
const salaryCategory = manualCategories.find((category) => category.name === "Salary / wages")!;

const expenseDraft: ManualTransactionDraft = {
  type: "EXPENSE",
  amountInput: "12.34",
  date: "2026-06-09",
  description: "Local grocer",
  categoryId: groceriesCategory.id,
  notes: "",
  csvMatchHint: false,
};

type MemoryCategoryRecord = {
  id: string;
  name: string;
  type: ManualCategoryType;
  parent: { name: string } | null;
};

type MemoryTransactionRecord = {
  id: string;
  userId: string;
  type: ManualCategoryType;
  amountCents: number;
  date: Date;
  description: string;
  categoryId: string;
  category: MemoryCategoryRecord;
  notes: string | null;
  csvMatchHint: boolean;
  status: "ACTIVE" | "DELETED";
  splitRole: "NONE" | "PARENT" | "CHILD";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

function createMemoryStore() {
  const records: MemoryTransactionRecord[] = [];
  const categories = new Map<string, MemoryCategoryRecord>();
  let nextId = 1;

  function categoryKey(userId: string, categoryId: string) {
    return `${userId}:${categoryId}`;
  }

  function findRecord(userId: string, transactionId: string) {
    return records.find((record) =>
      record.id === transactionId &&
      record.userId === userId &&
      record.status === "ACTIVE" &&
      record.deletedAt === null &&
      record.splitRole !== "PARENT",
    ) ?? null;
  }

  const store: ManualTransactionPersistenceStore & {
    records: MemoryTransactionRecord[];
    categories: Map<string, MemoryCategoryRecord>;
    addRecord(record: Partial<MemoryTransactionRecord> & Pick<MemoryTransactionRecord, "userId" | "category" | "amountCents" | "date" | "description">): MemoryTransactionRecord;
  } = {
    records,
    categories,
    addRecord(record) {
      const timestamp = new Date("2026-06-09T00:00:00.000Z");
      const nextRecord: MemoryTransactionRecord = {
        id: record.id ?? `txn_${nextId++}`,
        type: record.type ?? "EXPENSE",
        userId: record.userId,
        amountCents: record.amountCents,
        date: record.date,
        description: record.description,
        categoryId: record.categoryId ?? record.category.id,
        category: record.category,
        notes: record.notes ?? null,
        csvMatchHint: record.csvMatchHint ?? false,
        status: record.status ?? "ACTIVE",
        splitRole: record.splitRole ?? "NONE",
        createdAt: record.createdAt ?? timestamp,
        updatedAt: record.updatedAt ?? timestamp,
        deletedAt: record.deletedAt ?? null,
      };
      records.push(nextRecord);
      return nextRecord;
    },
    async listActive(userId, dateFrom, dateTo) {
      return records
        .filter((record) => (
          record.userId === userId
          && record.status === "ACTIVE"
          && record.deletedAt === null
          && record.splitRole !== "PARENT"
          && (!dateFrom || record.date >= dateFrom)
          && (!dateTo || record.date < dateTo)
        ))
        .sort((left, right) => right.date.toISOString().localeCompare(left.date.toISOString()) || right.updatedAt.toISOString().localeCompare(left.updatedAt.toISOString())) as never;
    },
    async hasActiveAfter(userId, date) {
      return records.some((record) => (
        record.userId === userId
        && record.status === "ACTIVE"
        && record.deletedAt === null
        && record.splitRole !== "PARENT"
        && record.date >= date
      ));
    },
    async findActiveById(userId, transactionId) {
      return findRecord(userId, transactionId) as never;
    },
    async create(userId, data) {
      const category = categories.get(categoryKey(userId, data.categoryId));
      if (!category) throw new Error("category not materialised");
      return store.addRecord({
        userId,
        type: data.type,
        amountCents: data.amountCents,
        date: data.date,
        description: data.description,
        categoryId: data.categoryId,
        category,
        notes: data.notes || null,
        csvMatchHint: data.csvMatchHint,
      }) as never;
    },
    async update(userId, transactionId, data) {
      const record = findRecord(userId, transactionId);
      if (!record) throw new Error("record not found");
      const category = categories.get(categoryKey(userId, data.categoryId));
      if (!category) throw new Error("category not materialised");
      Object.assign(record, {
        type: data.type,
        amountCents: data.amountCents,
        date: data.date,
        description: data.description,
        categoryId: data.categoryId,
        category,
        notes: data.notes || null,
        csvMatchHint: data.csvMatchHint,
        updatedAt: new Date("2026-06-10T00:00:00.000Z"),
      });
      return record as never;
    },
    async softDelete(userId, transactionId, deletedAt) {
      const record = findRecord(userId, transactionId);
      if (!record) throw new Error("record not found");
      record.status = "DELETED";
      record.deletedAt = deletedAt;
      record.updatedAt = deletedAt;
      return record as never;
    },
    async resolveSeededCategoryId(userId, category: ManualCategory) {
      const id = `db_${category.id}`;
      categories.set(categoryKey(userId, id), {
        id,
        name: category.name,
        type: category.type,
        parent: { name: category.group },
      });
      return id;
    },
  };

  return store;
}

describe("durable manual transaction persistence", () => {
  it("creates, lists, updates, duplicates and soft-deletes user-owned manual transactions", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();

    const created = await createDurableManualTransaction(user, expenseDraft, store);
    expect(created).toMatchObject({
      type: "EXPENSE",
      amountCents: -1234,
      date: "2026-06-09",
      description: "Local grocer",
      categoryId: groceriesCategory.id,
    });

    expect(await listDurableManualTransactions(user, store)).toHaveLength(1);

    const updated = await updateDurableManualTransaction(user, created.id, {
      ...expenseDraft,
      amountInput: "$18.50",
      description: "Neighbourhood grocer",
      csvMatchHint: true,
    }, store);

    expect(updated).toMatchObject({
      amountCents: -1850,
      description: "Neighbourhood grocer",
      csvMatchHint: true,
    });

    const duplicateDraft = duplicateManualTransactionToDraft(updated);
    const duplicate = await createDurableManualTransaction(user, duplicateDraft, store);
    expect(duplicate.id).not.toBe(updated.id);
    expect(await listDurableManualTransactions(user, store)).toHaveLength(2);

    await softDeleteDurableManualTransaction(user, updated.id, store, new Date("2026-06-11T00:00:00.000Z"));
    const active = await listDurableManualTransactions(user, store);
    expect(active.map((transaction) => transaction.id)).toEqual([duplicate.id]);
  });

  it("lists only the selected Australian calendar month and reports later history", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();
    const categoryId = await store.resolveSeededCategoryId(user.userId, groceriesCategory);
    const category = store.categories.get(`${user.userId}:${categoryId}`)!;
    store.addRecord({ userId: user.userId, amountCents: -1000, date: new Date("2026-06-30T00:00:00.000Z"), description: "June", categoryId, category });
    store.addRecord({ userId: user.userId, amountCents: -2000, date: new Date("2026-07-01T00:00:00.000Z"), description: "July", categoryId, category });
    store.addRecord({ userId: user.userId, amountCents: -3000, date: new Date("2026-08-01T00:00:00.000Z"), description: "August", categoryId, category });

    const result = await listDurableManualTransactionsForMonth(user, "2026-07", store);
    expect(result.month).toEqual({ key: "2026-07", label: "July 2026" });
    expect(result.transactions.map((transaction) => transaction.description)).toEqual(["July"]);
    expect(result.hasLaterTransactions).toBe(true);
  });

  it("stores income as positive cents and requires a matching category type", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();

    const income = await createDurableManualTransaction(user, {
      ...expenseDraft,
      type: "INCOME",
      categoryId: salaryCategory.id,
      amountInput: "250.00",
      description: "Synthetic salary",
    }, store);

    expect(income.amountCents).toBe(25000);

    await expect(createDurableManualTransaction(user, {
      ...expenseDraft,
      type: "INCOME",
      categoryId: groceriesCategory.id,
    }, store)).rejects.toThrow(/category/i);
  });

  it("does not expose another user's manual transactions", async () => {
    const userOne = createTestUserContext("user_1");
    const userTwo = createTestUserContext("user_2");
    const store = createMemoryStore();
    const created = await createDurableManualTransaction(userOne, expenseDraft, store);

    expect(await listDurableManualTransactions(userTwo, store)).toEqual([]);
    await expect(updateDurableManualTransaction(userTwo, created.id, expenseDraft, store)).rejects.toThrow(OwnershipError);
    await expect(softDeleteDurableManualTransaction(userTwo, created.id, store)).rejects.toThrow(OwnershipError);
  });

  it("rejects missing authenticated user context before store access", async () => {
    const store = createMemoryStore();

    await expect(listDurableManualTransactions(null, store)).rejects.toThrow(AuthenticationRequiredError);
    await expect(createDurableManualTransaction(undefined, expenseDraft, store)).rejects.toThrow(AuthenticationRequiredError);
    expect(store.records).toHaveLength(0);
  });

  it("excludes soft-deleted transactions and split parents from active totals and lists", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();
    const categoryId = await store.resolveSeededCategoryId(user.userId, groceriesCategory);
    const category = store.categories.get(`${user.userId}:${categoryId}`)!;

    store.addRecord({
      userId: user.userId,
      amountCents: -1000,
      date: new Date("2026-06-09T00:00:00.000Z"),
      description: "Visible child",
      categoryId,
      category,
      splitRole: "CHILD",
    });
    store.addRecord({
      userId: user.userId,
      amountCents: -1000,
      date: new Date("2026-06-09T00:00:00.000Z"),
      description: "Split parent",
      categoryId,
      category,
      splitRole: "PARENT",
    });
    store.addRecord({
      userId: user.userId,
      amountCents: -1000,
      date: new Date("2026-06-09T00:00:00.000Z"),
      description: "Deleted row",
      categoryId,
      category,
      status: "DELETED",
      deletedAt: new Date("2026-06-10T00:00:00.000Z"),
    });

    expect((await listDurableManualTransactions(user, store)).map((transaction) => transaction.description)).toEqual(["Visible child"]);
  });

  it("materialises only seeded category metadata needed for the transaction foreign key", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();

    await createDurableManualTransaction(user, expenseDraft, store);

    expect([...store.categories.values()]).toEqual([
      {
        id: `db_${groceriesCategory.id}`,
        name: "Groceries",
        type: "EXPENSE",
        parent: { name: "Everyday spending" },
      },
    ]);
  });
});
