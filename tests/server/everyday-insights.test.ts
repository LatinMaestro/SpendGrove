import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  getEverydayInsightMonths,
  getEverydayInsights,
  summarizeEverydayInsights,
  type EverydayInsightStore,
  type InsightBudgetRecord,
  type InsightExpenseRecord,
  type InsightRecurringRecord,
} from "@/src/server/everyday-insights";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/everyday-insights.ts", import.meta.url);

function expense(input: Partial<InsightExpenseRecord> = {}): InsightExpenseRecord {
  return {
    userId: "user_1",
    categoryId: "category_food",
    type: "EXPENSE",
    status: "ACTIVE",
    splitRole: "NONE",
    deletedAt: null,
    amountCents: -10000,
    date: "2026-07-10T00:00:00.000Z",
    category: {
      id: "category_food",
      userId: "user_1",
      name: "Food",
      deletedAt: null,
    },
    ...input,
  };
}

function budget(input: Partial<InsightBudgetRecord> = {}): InsightBudgetRecord {
  return {
    id: "budget_1",
    userId: "user_1",
    categoryId: "category_food",
    amountCents: 50000,
    period: "MONTHLY",
    status: "ACTIVE",
    category: {
      id: "category_food",
      userId: "user_1",
      name: "Food",
      deletedAt: null,
    },
    ...input,
  };
}

function recurring(input: Partial<InsightRecurringRecord> = {}): InsightRecurringRecord {
  return {
    id: "recurring_1",
    userId: "user_1",
    label: "Streaming plan",
    expectedAmountCents: -1599,
    cadence: "MONTHLY",
    status: "ACTIVE",
    category: {
      id: "category_food",
      userId: "user_1",
      name: "Food",
      deletedAt: null,
    },
    ...input,
  };
}

describe("everyday insight calculations", () => {
  it("uses explicit Brisbane current and previous calendar months", () => {
    const months = getEverydayInsightMonths(new Date("2026-06-30T14:30:00.000Z"));
    expect(months.current).toMatchObject({ key: "2026-07", label: "July 2026" });
    expect(months.previous).toMatchObject({ key: "2026-06", label: "June 2026" });
  });

  it("calculates current, previous and category totals from eligible everyday expenses", () => {
    const months = getEverydayInsightMonths(new Date("2026-07-15T00:00:00.000Z"));
    const snapshot = summarizeEverydayInsights("user_1", [
      expense(),
      expense({ amountCents: -2500, splitRole: "CHILD" }),
      expense({ amountCents: -9000, splitRole: "PARENT" }),
      expense({ amountCents: -5000, date: "2026-06-10T00:00:00.000Z" }),
      expense({ amountCents: 3000, type: "INCOME" }),
      expense({ amountCents: -4000, type: "TRANSFER" }),
      expense({ amountCents: -7000, status: "DELETED", deletedAt: "2026-07-11T00:00:00.000Z" }),
      expense({ amountCents: -8000, userId: "user_2" }),
    ], [], [], months);

    expect(snapshot.currentMonth).toMatchObject({ spendCents: 12500, transactionCount: 2 });
    expect(snapshot.previousMonth).toMatchObject({ spendCents: 5000, transactionCount: 1 });
    expect(snapshot.trend).toEqual({ direction: "UP", differenceCents: 7500 });
    expect(snapshot.categories).toEqual([{ id: "category_food", label: "Food", spendCents: 12500 }]);
  });

  it("shows no comparison when the previous month has no eligible spending", () => {
    const months = getEverydayInsightMonths(new Date("2026-07-15T00:00:00.000Z"));
    const snapshot = summarizeEverydayInsights("user_1", [expense()], [], [], months);
    expect(snapshot.trend).toEqual({ direction: "NO_PREVIOUS", differenceCents: 10000 });
  });

  it("uses everyday transactions once for budget progress and keeps recurring items analytical", () => {
    const months = getEverydayInsightMonths(new Date("2026-07-15T00:00:00.000Z"));
    const snapshot = summarizeEverydayInsights("user_1", [
      expense(),
      expense({ amountCents: -2500, splitRole: "CHILD" }),
    ], [budget()], [
      recurring(),
      recurring({ id: "archived", status: "ARCHIVED" }),
      recurring({ id: "foreign", userId: "user_2" }),
    ], months);

    expect(snapshot.currentMonth.spendCents).toBe(12500);
    expect(snapshot.budgets).toEqual([{
      id: "budget_1",
      categoryLabel: "Food",
      amountCents: 50000,
      spentCents: 12500,
      remainingCents: 37500,
      progressPercent: 25,
    }]);
    expect(snapshot.recurring).toEqual([{
      id: "recurring_1",
      label: "Streaming plan",
      categoryLabel: "Food",
      expectedAmountCents: -1599,
      cadence: "MONTHLY",
    }]);
  });

  it("loads only the authenticated user's safe current records", async () => {
    const store: EverydayInsightStore = {
      async listExpenses(userId) {
        return [expense({ userId }), expense({ userId: "user_2", amountCents: -99000 })];
      },
      async listBudgets(userId) {
        return [budget({ userId })];
      },
      async listRecurring(userId) {
        return [recurring({ userId })];
      },
    };

    const snapshot = await getEverydayInsights(
      createTestUserContext("user_1"),
      store,
      new Date("2026-07-15T00:00:00.000Z"),
    );
    expect(snapshot.currentMonth.spendCents).toBe(10000);
    expect(snapshot.budgets).toHaveLength(1);
    expect(snapshot.recurring).toHaveLength(1);
  });

  it("queries only approved structured facts and no analytical loan or Property records", async () => {
    const service = await readFile(servicePath, "utf8");
    const expenseSelect = service.match(/select: \{\n          userId: true,[\s\S]*?category: \{[\s\S]*?\n          \},\n        \},/)?.[0] ?? "";

    expect(expenseSelect).toContain("amountCents: true");
    expect(expenseSelect).toContain("categoryId: true");
    expect(expenseSelect).not.toMatch(/description|merchant|narration|fileName|account|balance|address/i);
    expect(service).not.toMatch(/loanRepayment\.(?:find|count|aggregate)/);
    expect(service).not.toMatch(/propertyReport|propertyTransaction|loanAccount\.(?:find|count|aggregate)/);
    expect(service).not.toMatch(/\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/);
  });
});
