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
  it("uses only selected-month active owned everyday expenses", () => {
    const result = aggregateMonthlyCategorySpending("user_1", julyStart, augustStart, [
      record({ amountCents: -1200 }),
      record({ amountCents: -300, splitRole: "CHILD" }),
      record({ amountCents: 500, type: "INCOME" }),
      record({ amountCents: -600, type: "TRANSFER" }),
      record({ amountCents: -700, type: "LOAN_REPAYMENT" }),
      record({ amountCents: -800, splitRole: "PARENT" }),
      record({ amountCents: -900, status: "DELETED", deletedAt: new Date("2026-07-11T00:00:00.000Z") }),
      record({ amountCents: -1000, userId: "user_2" }),
      record({ amountCents: -1100, date: new Date("2026-08-02T00:00:00.000Z") }),
    ]);

    expect(result.totalCents).toBe(1500);
    expect(result.categories).toEqual([
      { key: "groceries", categoryId: "groceries", name: "Groceries", amountCents: 1500, transactionCount: 2 },
    ]);
  });

  it("keeps unusable categories visible as Needs review", () => {
    const result = aggregateMonthlyCategorySpending("user_1", julyStart, augustStart, [
      record({ categoryKey: null, category: null }),
      record({ categoryKey: "foreign", category: { id: "foreign", name: "Private", userId: "user_2" } }),
      record({ categoryKey: "archived", category: { id: "archived", name: "Old", userId: "user_1", isArchived: true } }),
    ]);

    expect(result.totalCents).toBe(3000);
    expect(result.categories).toEqual([
      { key: NEEDS_REVIEW_CATEGORY_KEY, categoryId: null, name: "Needs review", amountCents: 3000, transactionCount: 3 },
    ]);
  });

  it("sorts categories and creates an exact presentation-only Other segment", () => {
    const categories = ["A", "B", "C", "D", "E", "F", "G"].map((name, index) => ({
      key: name,
      categoryId: name,
      name,
      amountCents: 700 - index * 100,
      transactionCount: 1,
    }));
    const grouped = groupMonthlyCategoryChart(categories);

    expect(grouped.slice(0, 5).map((item) => item.name)).toEqual(["A", "B", "C", "D", "E"]);
    expect(grouped[5]).toEqual({
      key: "other",
      categoryId: null,
      name: "Other",
      amountCents: 300,
      transactionCount: 2,
      isOther: true,
    });
    expect(grouped.reduce((sum, item) => sum + item.amountCents, 0)).toBe(2800);
    expect(categories.map((item) => item.name)).not.toContain("Other");
  });

  it("shows all categories when there are five or fewer and handles one or zero", () => {
    const single = [{ key: "one", categoryId: "one", name: "One", amountCents: 100, transactionCount: 1 }];
    expect(groupMonthlyCategoryChart(single)).toEqual(single);
    expect(groupMonthlyCategoryChart([])).toEqual([]);
  });

  it("reconciles exactly with the approved everyday monthly spending total", () => {
    const months = getEverydayInsightMonths(new Date("2026-07-14T00:00:00.000Z"));
    const records = [
      record({ amountCents: -1234 }),
      record({ amountCents: -456, splitRole: "CHILD" }),
      record({ amountCents: 200, type: "INCOME" }),
      record({ amountCents: -300, type: "TRANSFER" }),
      record({ amountCents: -999, splitRole: "PARENT" }),
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
  });
});
