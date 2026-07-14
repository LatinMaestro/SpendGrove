export type EverydayExpenseEligibilityRecord = {
  userId: string;
  type: string;
  status?: string | null;
  splitRole?: string | null;
  deletedAt?: Date | string | null;
  amountCents: number;
  date: Date | string;
};

export type EverydaySpendingWindow = {
  dateFrom: Date;
  dateTo: Date;
};

function recordTime(value: Date | string) {
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export function isEligibleEverydayExpense(
  userId: string,
  record: EverydayExpenseEligibilityRecord,
  window?: EverydaySpendingWindow,
) {
  const time = recordTime(record.date);
  if (record.userId !== userId
    || record.type !== "EXPENSE"
    || (record.status != null && record.status !== "ACTIVE")
    || Boolean(record.deletedAt)
    || record.splitRole === "PARENT"
    || !Number.isInteger(record.amountCents)
    // Category-derived type alone is insufficient: everyday money-out spending must retain a negative sign.
    || record.amountCents >= 0
    || time == null) {
    return false;
  }

  if (!window) return true;
  return time >= window.dateFrom.getTime() && time < window.dateTo.getTime();
}
