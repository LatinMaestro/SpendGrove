import { describe, expect, it } from "vitest";
import {
  aggregateMonthlyCategorySpending,
  groupMonthlyCategoryChart,
  NEEDS_REVIEW_CATEGORY_KEY,
  type MonthlyCategorySpendingRecord,
} from "@/lib/monthly-category-spending";
import { getEverydayInsightMonths, summarizeEverydayInsights, type InsightExpenseRecord } from "@/src/server/everyday-insights";

const julyStart = new Date("2026-07-01T00:00:00.000Z");
const augustStart = new Date("2026-08-01T00:00:00.000Z");

function record(overrides: Partial<MonthlyCategorySpendingRecord> = {}): MonthlyCategorySpendingRecord {
  return {
    userId: "user_1",
    type: "EXPENSE",
    status: "ACTIVE",
    splitRole: "NONE",
    deletedAt: null,
    amountCents: -1000,
    date: new Date("2026-07-10T00:00:00.000Z"),
    categoryKey: "groceries",
    category: {
      id: "db_groceries",
      name: "Groceries",
      userId: "user_1",
      isArchived: false,
      deletedAt: null,
    },
    ...overrides,
  };
}

describe("monthly category spending", () => {
  it("uses only selected-month active owned negative everyday expenses", () => {
    const result = aggregateMonthlyCategorySpending("user_1", julyStart, augustStart, [
      record({ id: "expense_1", amountCents: -1200 }),
      record({ id: "expense_2", amountCents: -300, splitRole: "CHILD" }),
      record({ id: "positive_expense", amountCents: 250000 }),
      record({ id: "income", amountCents: 500, type: "INCOME" }),
      record({ id: "incoming_transfer", amountCents: 250000, type: "TRANSFER" }),
      record({ id: "outgoing_transfer", amountCents: -600, type: "TRANSFER" }),
      record({ id: "loan", amountCents: -700, type: "LOAN_REPAYMENT" }),
      record({ id: "parent", amountCents: -800, splitRole: "PARENT" }),
      record({ id: "deleted", amountCents: -900, status: "DELETED", deletedAt: new Date("2026-07-11T00:00:00.000Z") }),
      record({ id: "foreign", amountCents: -1000, userId: "user_2" }),
      record({ id: "later", amountCents: -1100, date: new Date("2026-08-02T00:00:00.000Z") }),
    ]);

    expect(result.totalCents).toBe(1500);
    expect(result.categories).toEqual([
      {
        key: "groceries",
        categoryId: "groceries",
        name: "Groceries",
        amountCents: 1500,
        transactionCount: 2,
        transactionIds: ["expense_1", "expense_2"],
      },
    ]);
  });

  it("keeps only uncategorised eligible expenses visible as Needs review", () => {
    const result = aggregateMonthlyCategorySpending("user_1", julyStart, augustStart, [
      record({ id: "missing", categoryKey: null, category: null }),
      record({ id: "foreign_category", categoryKey: "foreign", category: { id: "foreign", name: "Private", userId: "user_2" } }),
      record({ id: "archived", categoryKey: "archived", category: { id: "archived", name: "Old", userId: "user_1", isArchived: true } }),
      record({ id: "income", type: "INCOME", amountCents: 250000, categoryKey: null, category: null }),
      record({ id: "transfer", type: "TRANSFER", amountCents: 250000, categoryKey: null, category: null }),
      record({ id: "positive_expense", amountCents: 250000, categoryKey: null, category: null }),
    ]);

    expect(result.totalCents).toBe(3000);
    expect(result.categories).toEqual([
      {
        key: NEEDS_REVIEW_CATEGORY_KEY,
        categoryId: null,
        name: "Needs review",
        amountCents: 3000,
        transactionCount: 3,
        transactionIds: ["missing", "foreign_category", "archived"],
      },
    ]);
  });

  it("sorts categories and creates an exact presentation-only Other segment", () => {
    const categories = ["A", "B", "C", "D", "E", "F", "G"].map((name, index) => ({
      key: name,
      categoryId: name,
      name,
      amountCents: 700 - index * 100,
      transactionCount: 1,
      transactionIds: [`transaction_${name}`],
    }));
    const grouped = groupMonthlyCategoryChart(categories);

    expect(grouped.slice(0, 5).map((item) => item.name)).toEqual(["A", "B", "C", "D", "E"]);
    expect(grouped[5]).toEqual({
      key: "other",
      categoryId: null,
      name: "Other",
      amountCents: 300,
      transactionCount: 2,
      transactionIds: ["transaction_F", "transaction_G"],
      isOther: true,
    });
    expect(grouped.reduce((sum, item) => sum + item.amountCents, 0)).toBe(2800);
    expect(categories.map((item) => item.name)).not.toContain("Other");
  });

  it("shows all categories when there are five or fewer and handles one or zero", () => {
    const single = [{
      key: "one",
      categoryId: "one",
      name: "One",
      amountCents: 100,
      transactionCount: 1,
      transactionIds: ["transaction_one"],
    }];
    expect(groupMonthlyCategoryChart(single)).toEqual(single);
    expect(groupMonthlyCategoryChart([])).toEqual([]);
  });

  it("reconciles exactly with the approved everyday monthly spending total", () => {
    const months = getEverydayInsightMonths(new Date("2026-07-14T00:00:00.000Z"));
    const records = [
      record({ id: "first", amountCents: -1234 }),
      record({ id: "child", amountCents: -456, splitRole: "CHILD" }),
      record({ id: "malformed_positive_expense", amountCents: 250000 }),
      record({ id: "income", amountCents: 200, type: "INCOME" }),
      record({ id: "transfer", amountCents: -300, type: "TRANSFER" }),
      record({ id: "parent", amountCents: -999, splitRole: "PARENT" }),
    ];
    const insightRecords: InsightExpenseRecord[] = records.map((item) => ({
      userId: item.userId,
      categoryId: item.category?.id ?? null,
      type: item.type,
      status: item.status ?? "ACTIVE",
      splitRole: item.splitRole ?? "NONE",
      deletedAt: item.deletedAt ?? null,
      amountCents: item.amountCents,
      date: item.date,
      category: item.category ? {
        id: item.category.id,
        userId: item.category.userId ?? item.userId,
        name: item.category.name,
        deletedAt: item.category.deletedAt ?? null,
      } : null,
    }));

    const chart = aggregateMonthlyCategorySpending("user_1", months.current.start, months.current.end, records);
    const insight = summarizeEverydayInsights("user_1", insightRecords, [], [], months);

    expect(chart.totalCents).toBe(1690);
    expect(chart.totalCents).toBe(insight.currentMonth.spendCents);
    expect(chart.categories.reduce((sum, category) => sum + category.amountCents, 0)).toBe(chart.totalCents);
    expect(chart.categories.flatMap((category) => category.transactionIds)).toEqual(["first", "child"]);
  });
});
