import { isEligibleEverydayExpense } from "@/lib/everyday-spending-eligibility";

export const NEEDS_REVIEW_CATEGORY_KEY = "needs-review";
export const OTHER_CATEGORY_KEY = "other";

export type MonthlyCategorySpendingRecord = {
  id?: string;
  userId: string;
  type: string;
  status?: string | null;
  splitRole?: string | null;
  deletedAt?: Date | string | null;
  amountCents: number;
  date: Date | string;
  categoryKey?: string | null;
  category?: {
    id: string;
    name: string;
    userId?: string | null;
    isArchived?: boolean | null;
    deletedAt?: Date | string | null;
  } | null;
};

export type MonthlyCategorySpendingCategory = {
  key: string;
  categoryId: string | null;
  name: string;
  amountCents: number;
  transactionCount: number;
  transactionIds: string[];
};

export type MonthlyCategorySpending = {
  totalCents: number;
  categories: MonthlyCategorySpendingCategory[];
};

export type MonthlyCategoryChartSegment = MonthlyCategorySpendingCategory & {
  isOther?: boolean;
};

function usableCategory(
  record: MonthlyCategorySpendingRecord,
  userId: string,
): { key: string; categoryId: string; name: string } | null {
  const category = record.category;
  const name = category?.name.trim() ?? "";
  if (!category
    || !name
    || category.isArchived
    || category.deletedAt
    || (category.userId != null && category.userId !== userId)) {
    return null;
  }
  const key = record.categoryKey || category.id;
  if (!key) return null;
  return { key, categoryId: key, name };
}

export function aggregateMonthlyCategorySpending(
  userId: string,
  dateFrom: Date,
  dateTo: Date,
  records: MonthlyCategorySpendingRecord[],
): MonthlyCategorySpending {
  const groups = new Map<string, MonthlyCategorySpendingCategory>();

  for (const record of records) {
    if (!isEligibleEverydayExpense(userId, record, { dateFrom, dateTo })) continue;
    const category = usableCategory(record, userId);
    const key = category?.key ?? NEEDS_REVIEW_CATEGORY_KEY;
    const amountCents = Math.abs(record.amountCents);
    const current = groups.get(key) ?? {
      key,
      categoryId: category?.categoryId ?? null,
      name: category?.name ?? "Needs review",
      amountCents: 0,
      transactionCount: 0,
      transactionIds: [],
    };
    current.amountCents += amountCents;
    current.transactionCount += 1;
    if (record.id && !current.transactionIds.includes(record.id)) {
      current.transactionIds.push(record.id);
    }
    groups.set(key, current);
  }

  const categories = [...groups.values()].sort((left, right) =>
    right.amountCents - left.amountCents || left.name.localeCompare(right.name, "en-AU"),
  );

  return {
    totalCents: categories.reduce((total, category) => total + category.amountCents, 0),
    categories,
  };
}

export function groupMonthlyCategoryChart(
  categories: MonthlyCategorySpendingCategory[],
  visibleLimit = 5,
): MonthlyCategoryChartSegment[] {
  if (categories.length <= visibleLimit) return categories.map((category) => ({ ...category }));
  const visible: MonthlyCategoryChartSegment[] = categories.slice(0, visibleLimit).map((category) => ({ ...category }));
  const remainder = categories.slice(visibleLimit);
  visible.push({
    key: OTHER_CATEGORY_KEY,
    categoryId: null,
    name: "Other",
    amountCents: remainder.reduce((total, category) => total + category.amountCents, 0),
    transactionCount: remainder.reduce((total, category) => total + category.transactionCount, 0),
    transactionIds: remainder.flatMap((category) => category.transactionIds),
    isOther: true,
  });
  return visible;
}
