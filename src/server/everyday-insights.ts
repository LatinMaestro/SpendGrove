import type { PrismaClient } from "@prisma/client";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

export type InsightExpenseRecord = {
  userId: string;
  categoryId: string | null;
  type: string;
  status: string;
  splitRole: string;
  deletedAt: Date | string | null;
  amountCents: number;
  date: Date | string;
  category: {
    id: string;
    userId: string;
    name: string;
    deletedAt: Date | string | null;
  } | null;
};

export type InsightBudgetRecord = {
  id: string;
  userId: string;
  categoryId: string;
  amountCents: number;
  period: string;
  status: string;
  category: {
    id: string;
    userId: string;
    name: string;
    deletedAt: Date | string | null;
  };
};

export type InsightRecurringRecord = {
  id: string;
  userId: string;
  label: string;
  expectedAmountCents: number | null;
  cadence: string;
  status: string;
  category: {
    id: string;
    userId: string;
    name: string;
    deletedAt: Date | string | null;
  } | null;
};

export type EverydayInsightStore = {
  listExpenses(userId: string, start: Date, end: Date): Promise<InsightExpenseRecord[]>;
  listBudgets(userId: string): Promise<InsightBudgetRecord[]>;
  listRecurring(userId: string): Promise<InsightRecurringRecord[]>;
};

type MonthWindow = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

function australianYearMonth(now: Date) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
  };
}

function monthWindow(year: number, month: number): MonthWindow {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return {
    key: String(year) + "-" + String(month).padStart(2, "0"),
    label: new Intl.DateTimeFormat("en-AU", {
      timeZone: "UTC",
      year: "numeric",
      month: "long",
    }).format(start),
    start,
    end,
  };
}

export function getEverydayInsightMonths(now = new Date()) {
  const currentParts = australianYearMonth(now);
  const current = monthWindow(currentParts.year, currentParts.month);
  const previousDate = new Date(Date.UTC(currentParts.year, currentParts.month - 2, 1));
  const previous = monthWindow(previousDate.getUTCFullYear(), previousDate.getUTCMonth() + 1);
  return { current, previous };
}

function validExpense(userId: string, record: InsightExpenseRecord) {
  const date = record.date instanceof Date ? record.date : new Date(record.date);
  return record.userId === userId
    && record.type === "EXPENSE"
    && record.status === "ACTIVE"
    && !record.deletedAt
    && record.splitRole !== "PARENT"
    && Number.isInteger(record.amountCents)
    && !Number.isNaN(date.getTime());
}

function inWindow(record: InsightExpenseRecord, window: MonthWindow) {
  const date = record.date instanceof Date ? record.date : new Date(record.date);
  return date >= window.start && date < window.end;
}

function categoryLabel(userId: string, record: InsightExpenseRecord) {
  return record.category
    && record.category.userId === userId
    && !record.category.deletedAt
    ? record.category.name
    : "Uncategorised";
}

export function summarizeEverydayInsights(
  userId: string,
  expenses: InsightExpenseRecord[],
  budgets: InsightBudgetRecord[],
  recurring: InsightRecurringRecord[],
  months: ReturnType<typeof getEverydayInsightMonths>,
) {
  const eligible = expenses.filter((record) => validExpense(userId, record));
  const currentRows = eligible.filter((record) => inWindow(record, months.current));
  const previousRows = eligible.filter((record) => inWindow(record, months.previous));
  const currentSpendCents = currentRows.reduce((sum, record) => sum + Math.abs(record.amountCents), 0);
  const previousSpendCents = previousRows.reduce((sum, record) => sum + Math.abs(record.amountCents), 0);
  const differenceCents = currentSpendCents - previousSpendCents;

  const categoryTotals = new Map<string, { id: string | null; label: string; spendCents: number }>();
  const previousCategoryTotals = new Map<string, number>();
  for (const record of currentRows) {
    const key = record.categoryId ?? "uncategorised";
    const current = categoryTotals.get(key) ?? {
      id: record.categoryId,
      label: categoryLabel(userId, record),
      spendCents: 0,
    };
    current.spendCents += Math.abs(record.amountCents);
    categoryTotals.set(key, current);
  }
  for (const record of previousRows) {
    const key = record.categoryId ?? "uncategorised";
    previousCategoryTotals.set(key, (previousCategoryTotals.get(key) ?? 0) + Math.abs(record.amountCents));
  }

  const categories = [...categoryTotals.entries()].map(([key, category]) => {
    const previousSpendCents = previousCategoryTotals.get(key) ?? 0;
    const categoryDifferenceCents = category.spendCents - previousSpendCents;
    return {
      ...category,
      previousSpendCents,
      differenceCents: categoryDifferenceCents,
      direction: previousSpendCents === 0
        ? "NEW" as const
        : categoryDifferenceCents > 0
          ? "UP" as const
          : categoryDifferenceCents < 0
            ? "DOWN" as const
            : "SAME" as const,
    };
  }).sort((left, right) => (
    right.spendCents - left.spendCents || left.label.localeCompare(right.label)
  ));

  const activeBudgets = budgets
    .filter((budget) => (
      budget.userId === userId
      && budget.status === "ACTIVE"
      && budget.period === "MONTHLY"
      && budget.amountCents > 0
      && budget.category.userId === userId
      && !budget.category.deletedAt
    ))
    .map((budget) => {
      const spentCents = currentRows
        .filter((record) => record.categoryId === budget.categoryId)
        .reduce((sum, record) => sum + Math.abs(record.amountCents), 0);
      return {
        id: budget.id,
        categoryLabel: budget.category.name,
        amountCents: budget.amountCents,
        spentCents,
        remainingCents: Math.max(budget.amountCents - spentCents, 0),
        progressPercent: Math.round((spentCents / budget.amountCents) * 1000) / 10,
      };
    })
    .sort((left, right) => left.categoryLabel.localeCompare(right.categoryLabel));

  const confirmedRecurring = recurring
    .filter((item) => (
      item.userId === userId
      && item.status === "ACTIVE"
      && (!item.category || (item.category.userId === userId && !item.category.deletedAt))
    ))
    .map((item) => ({
      id: item.id,
      label: item.label,
      categoryLabel: item.category?.name ?? null,
      expectedAmountCents: item.expectedAmountCents,
      cadence: item.cadence,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));

  return {
    currentMonth: {
      key: months.current.key,
      label: months.current.label,
      spendCents: currentSpendCents,
      transactionCount: currentRows.length,
    },
    previousMonth: {
      key: months.previous.key,
      label: months.previous.label,
      spendCents: previousSpendCents,
      transactionCount: previousRows.length,
    },
    trend: {
      direction: previousSpendCents === 0
        ? "NO_PREVIOUS"
        : differenceCents > 0
          ? "UP"
          : differenceCents < 0
            ? "DOWN"
            : "SAME",
      differenceCents,
    },
    categories,
    budgets: activeBudgets,
    recurring: confirmedRecurring,
  };
}

export function createPrismaEverydayInsightStore(
  prisma: PrismaClient = getPrismaClient(),
): EverydayInsightStore {
  return {
    async listExpenses(userId, start, end) {
      return prisma.transaction.findMany({
        where: {
          userId,
          type: "EXPENSE",
          status: "ACTIVE",
          deletedAt: null,
          splitRole: { not: "PARENT" },
          date: { gte: start, lt: end },
        },
        select: {
          userId: true,
          categoryId: true,
          type: true,
          status: true,
          splitRole: true,
          deletedAt: true,
          amountCents: true,
          date: true,
          category: {
            select: {
              id: true,
              userId: true,
              name: true,
              deletedAt: true,
            },
          },
        },
      }) as unknown as Promise<InsightExpenseRecord[]>;
    },
    async listBudgets(userId) {
      return prisma.categoryBudget.findMany({
        where: {
          userId,
          period: "MONTHLY",
          status: "ACTIVE",
        },
        select: {
          id: true,
          userId: true,
          categoryId: true,
          amountCents: true,
          period: true,
          status: true,
          category: {
            select: {
              id: true,
              userId: true,
              name: true,
              deletedAt: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }) as unknown as Promise<InsightBudgetRecord[]>;
    },
    async listRecurring(userId) {
      return prisma.recurringItem.findMany({
        where: {
          userId,
          status: "ACTIVE",
        },
        select: {
          id: true,
          userId: true,
          label: true,
          expectedAmountCents: true,
          cadence: true,
          status: true,
          category: {
            select: {
              id: true,
              userId: true,
              name: true,
              deletedAt: true,
            },
          },
        },
        orderBy: { label: "asc" },
      }) as unknown as Promise<InsightRecurringRecord[]>;
    },
  };
}

export async function getEverydayInsights(
  context: AuthenticatedUserContext | null | undefined,
  store: EverydayInsightStore = createPrismaEverydayInsightStore(),
  now = new Date(),
) {
  const user = requireAuthenticatedUserContext(context);
  const months = getEverydayInsightMonths(now);
  const [expenses, budgets, recurring] = await Promise.all([
    store.listExpenses(user.userId, months.previous.start, months.current.end),
    store.listBudgets(user.userId),
    store.listRecurring(user.userId),
  ]);
  return summarizeEverydayInsights(user.userId, expenses, budgets, recurring, months);
}
