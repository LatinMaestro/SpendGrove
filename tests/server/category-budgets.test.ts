import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  applyCategoryBudgetMutation,
  CategoryBudgetDuplicateError,
  computeMonthlySpentCents,
  getAustralianCalendarMonth,
  getCategoryBudgetSnapshot,
  type BudgetTransactionRecord,
  type CategoryBudgetPersistenceStore,
  type DbCategoryBudget,
} from "@/src/server/category-budgets";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/category-budgets.ts", import.meta.url);

function category(userId = "user_1") {
  return {
    id: "category_groceries",
    userId,
    name: "Groceries",
    type: "EXPENSE",
    isArchived: false,
    deletedAt: null,
  };
}

function budgetRecord(input: Partial<DbCategoryBudget> = {}): DbCategoryBudget {
  return {
    id: "budget_1",
    userId: "user_1",
    categoryId: "category_groceries",
    amountCents: 50000,
    period: "MONTHLY",
    status: "ACTIVE",
    archivedAt: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    category: category(),
    ...input,
  };
}

function transaction(input: Partial<BudgetTransactionRecord> = {}): BudgetTransactionRecord {
  return {
    userId: "user_1",
    categoryId: "category_groceries",
    type: "EXPENSE",
    status: "ACTIVE",
    splitRole: "NONE",
    deletedAt: null,
    amountCents: -10000,
    date: "2026-07-10T00:00:00.000Z",
    ...input,
  };
}

function createMemoryStore() {
  const categories = [
    { id: "category_groceries", name: "Groceries", userId: "user_1", active: true },
    { id: "category_other", name: "Other spending", userId: "user_1", active: true },
    { id: "category_foreign", name: "Foreign", userId: "user_2", active: true },
  ];
  const budgets: DbCategoryBudget[] = [];
  const transactions: BudgetTransactionRecord[] = [
    transaction(),
    transaction({ amountCents: -2500, splitRole: "CHILD" }),
    transaction({ amountCents: -9000, splitRole: "PARENT" }),
    transaction({ amountCents: 5000, type: "INCOME" }),
    transaction({ amountCents: -8000, type: "TRANSFER" }),
    transaction({ amountCents: -7000, status: "DELETED", deletedAt: "2026-07-11T00:00:00.000Z" }),
    transaction({ amountCents: -6000, userId: "user_2" }),
  ];
  const audits: Array<Record<string, unknown>> = [];
  let sequence = 0;

  const store: CategoryBudgetPersistenceStore & {
    budgets: DbCategoryBudget[];
    audits: Array<Record<string, unknown>>;
  } = {
    budgets,
    audits,
    async listCategories(userId) {
      return categories
        .filter((item) => item.userId === userId && item.active)
        .map(({ id, name }) => ({ id, name }));
    },
    async listBudgets(userId) {
      return budgets.filter((item) => item.userId === userId);
    },
    async listExpenseTransactions(userId, start, end) {
      return transactions.filter((item) => {
        const date = new Date(item.date);
        return item.userId === userId && date >= start && date < end;
      });
    },
    async create(userId, input, audit, now) {
      if (budgets.some((item) => item.userId === userId && item.categoryId === input.categoryId && item.status === "ACTIVE")) {
        throw new CategoryBudgetDuplicateError();
      }
      sequence += 1;
      const categoryRecord = categories.find((item) => item.id === input.categoryId && item.userId === userId);
      const created = budgetRecord({
        id: "budget_" + sequence,
        userId,
        categoryId: input.categoryId,
        amountCents: input.amountCents,
        createdAt: now,
        updatedAt: now,
        category: {
          id: categoryRecord!.id,
          userId,
          name: categoryRecord!.name,
          type: "EXPENSE",
          isArchived: false,
          deletedAt: null,
        },
      });
      budgets.push(created);
      audits.push({ ...audit, entityId: created.id });
      return created;
    },
    async update(userId, budgetId, expectedUpdatedAt, input, audit) {
      const item = budgets.find((candidate) => candidate.id === budgetId && candidate.userId === userId && candidate.status === "ACTIVE");
      if (!item || new Date(item.updatedAt).getTime() !== expectedUpdatedAt.getTime()) return null;
      if (budgets.some((candidate) => candidate.id !== budgetId && candidate.userId === userId && candidate.categoryId === input.categoryId && candidate.status === "ACTIVE")) {
        throw new CategoryBudgetDuplicateError();
      }
      const categoryRecord = categories.find((candidate) => candidate.id === input.categoryId && candidate.userId === userId);
      Object.assign(item, {
        categoryId: input.categoryId,
        amountCents: input.amountCents,
        category: {
          id: categoryRecord!.id,
          userId,
          name: categoryRecord!.name,
          type: "EXPENSE",
          isArchived: false,
          deletedAt: null,
        },
        updatedAt: "2026-07-11T01:00:00.000Z",
      });
      audits.push(audit);
      return item;
    },
    async archive(userId, budgetId, expectedUpdatedAt, now, audit) {
      const item = budgets.find((candidate) => candidate.id === budgetId && candidate.userId === userId && candidate.status === "ACTIVE");
      if (!item || new Date(item.updatedAt).getTime() !== expectedUpdatedAt.getTime()) return null;
      Object.assign(item, { status: "ARCHIVED", archivedAt: now, updatedAt: now });
      audits.push(audit);
      return item;
    },
  };
  return store;
}

describe("monthly category budget calculations", () => {
  it("uses the Brisbane calendar month and explicit active expense formula", () => {
    const month = getAustralianCalendarMonth(new Date("2026-06-30T14:30:00.000Z"));
    expect(month).toMatchObject({ key: "2026-07", label: "July 2026" });

    const records = [
      transaction(),
      transaction({ amountCents: -2500, splitRole: "CHILD" }),
      transaction({ amountCents: -9000, splitRole: "PARENT" }),
      transaction({ amountCents: 5000, type: "INCOME" }),
      transaction({ amountCents: -8000, type: "TRANSFER" }),
      transaction({ amountCents: -7000, status: "DELETED", deletedAt: "2026-07-11T00:00:00.000Z" }),
      transaction({ amountCents: -6000, userId: "user_2" }),
      transaction({ amountCents: -4000, date: "2026-08-01T00:00:00.000Z" }),
    ];

    expect(computeMonthlySpentCents("user_1", "category_groceries", records, month.start, month.end)).toBe(12500);
  });

  it("shows active owned budget progress without counting analytical loan records", async () => {
    const store = createMemoryStore();
    await store.create(
      "user_1",
      { categoryId: "category_groceries", amountCents: 50000 },
      { userId: "user_1", entityType: "CATEGORY_BUDGET", action: "CREATED", metadata: { reasonCode: "BUDGET_CREATED" } },
      new Date("2026-07-01T00:00:00.000Z"),
    );

    const snapshot = await getCategoryBudgetSnapshot(
      createTestUserContext("user_1"),
      store,
      new Date("2026-07-15T00:00:00.000Z"),
    );

    expect(snapshot.budgets[0]).toMatchObject({
      categoryLabel: "Groceries",
      amountCents: 50000,
      spentCents: 12500,
      remainingCents: 37500,
      progressPercent: 25,
    });
  });
});

describe("category budget lifecycle", () => {
  it("creates, edits and archives a user-entered monthly budget with safe audits", async () => {
    const store = createMemoryStore();
    const context = createTestUserContext("user_1");
    let snapshot = await applyCategoryBudgetMutation(context, {
      action: "CREATE",
      categoryId: "category_groceries",
      amountCents: 50000,
    }, store, new Date("2026-07-01T00:00:00.000Z"));

    expect(snapshot.budgets).toHaveLength(1);
    expect(store.audits[0]).toMatchObject({
      entityType: "CATEGORY_BUDGET",
      action: "CREATED",
      metadata: {
        reasonCode: "BUDGET_CREATED",
        periodCode: "MONTHLY",
        methodCode: "USER_CREATED",
      },
    });

    const created = snapshot.budgets[0];
    snapshot = await applyCategoryBudgetMutation(context, {
      action: "UPDATE",
      budgetId: created.id,
      updatedAt: created.updatedAt,
      categoryId: "category_other",
      amountCents: 65000,
    }, store);
    expect(snapshot.budgets[0]).toMatchObject({ categoryLabel: "Other spending", amountCents: 65000 });

    const updated = snapshot.budgets[0];
    snapshot = await applyCategoryBudgetMutation(context, {
      action: "ARCHIVE",
      budgetId: updated.id,
      updatedAt: updated.updatedAt,
    }, store, new Date("2026-07-11T02:00:00.000Z"));
    expect(snapshot.budgets[0].status).toBe("ARCHIVED");
    expect(snapshot.archivedCount).toBe(1);

    expect(JSON.stringify(store.audits)).not.toMatch(/50000|65000|Groceries|Other spending|transaction/i);
  });

  it("rejects duplicate, cross-user, inactive and stale budget writes", async () => {
    const store = createMemoryStore();
    const context = createTestUserContext("user_1");
    let snapshot = await applyCategoryBudgetMutation(context, {
      action: "CREATE",
      categoryId: "category_groceries",
      amountCents: 50000,
    }, store, new Date("2026-07-01T00:00:00.000Z"));

    await expect(applyCategoryBudgetMutation(context, {
      action: "CREATE",
      categoryId: "category_groceries",
      amountCents: 60000,
    }, store)).rejects.toThrow(/already exists/i);

    await expect(applyCategoryBudgetMutation(context, {
      action: "CREATE",
      categoryId: "category_foreign",
      amountCents: 60000,
    }, store)).rejects.toThrow(/active expense category/i);

    const budget = snapshot.budgets[0];
    await expect(applyCategoryBudgetMutation(context, {
      action: "UPDATE",
      budgetId: budget.id,
      updatedAt: "2026-07-02T00:00:00.000Z",
      categoryId: budget.categoryId,
      amountCents: 60000,
    }, store)).rejects.toThrow(/changed since/i);
  });

  it("accepts positive integer cents only", async () => {
    const store = createMemoryStore();
    await expect(applyCategoryBudgetMutation(createTestUserContext("user_1"), {
      action: "CREATE",
      categoryId: "category_groceries",
      amountCents: -1,
    }, store)).rejects.toThrow(/greater than zero/i);
  });

  it("selects safe structured fields and excludes loan breakdowns and private source data", async () => {
    const service = await readFile(servicePath, "utf8");
    const transactionSelect = service.match(/select: \{\n          userId: true,[\s\S]*?date: true,\n        \}/)?.[0] ?? "";

    expect(transactionSelect).toContain("categoryId: true");
    expect(transactionSelect).toContain("amountCents: true");
    expect(transactionSelect).not.toMatch(/description|merchant|narration|fileName|account|balance/i);
    expect(service).not.toMatch(/loanRepayment\.(?:find|count|aggregate)/);
    expect(service).toContain('splitRole: { not: "PARENT" }');
    expect(service).toContain('type: "EXPENSE"');
  });
});
