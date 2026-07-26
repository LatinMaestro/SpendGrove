import {
  australianFinancialYear,
  propertyFinancialYearSchema,
} from "@/src/server/property-report-review";

export const EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT = "spendgrove.everyday-financial-year-report";
export const EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION = 1 as const;

export type EverydayFinancialYearDirection = "MONEY_IN" | "MONEY_OUT";
export type EverydayFinancialYearCandidateSource = "FULL_DIAGNOSTIC" | "ELIGIBLE_ONLY";

export type EverydayFinancialYearRecord = {
  id: string;
  userId: string;
  date: string;
  type: string;
  amountCents: number;
  status: string;
  deletedAt: string | null;
  splitRole: string;
  categoryId: string | null;
  categoryName: string | null;
};

export type EverydayFinancialYearCategoryRow = {
  direction: EverydayFinancialYearDirection;
  categoryId: string | null;
  categoryName: string;
  count: number;
  totalCents: number;
};

export type EverydayFinancialYearReport = {
  contract: typeof EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT;
  version: typeof EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION;
  generatedAt: string;
  financialYear: {
    endingYear: number;
    label: string;
    startDate: string;
    endDate: string;
  };
  currency: "AUD";
  moneyRepresentation: "integer cents";
  moneyIn: { count: number; totalCents: number };
  moneyOut: { count: number; totalCents: number };
  transfers: {
    count: number;
    incomingCount: number;
    outgoingCount: number;
  };
  countedTransactionCount: number;
  countedSplitChildCount: number;
  categoryRows: EverydayFinancialYearCategoryRow[];
  reconciliation: {
    candidateSource: EverydayFinancialYearCandidateSource;
    inputTransactionCount: number | null;
    outsidePeriodCount: number | null;
    deletedOrInactiveCount: number | null;
    splitParentCount: number | null;
    crossUserCount: number | null;
    notices: string[];
  };
  disclaimer: string;
};

export type EverydayFinancialYearReportReasonCode =
  | "AUTHENTICATED_USER_REQUIRED"
  | "GENERATED_AT_INVALID"
  | "RECORD_DATE_INVALID"
  | "RECORD_AMOUNT_INVALID"
  | "RECORD_TYPE_UNSUPPORTED"
  | "RECORD_TYPE_SIGN_MISMATCH"
  | "ELIGIBLE_SOURCE_VIOLATION"
  | "TOTAL_OVERFLOW"
  | "CATEGORY_RECONCILIATION_MISMATCH"
  | "COUNT_RECONCILIATION_MISMATCH";

export class EverydayFinancialYearReportError extends Error {
  constructor(
    message: string,
    readonly reasonCode: EverydayFinancialYearReportReasonCode,
  ) {
    super(message);
    this.name = "EverydayFinancialYearReportError";
  }
}

type BuildOptions = {
  candidateSource?: EverydayFinancialYearCandidateSource;
  generatedAt?: Date;
};

type DiagnosticCounts = {
  outsidePeriodCount: number;
  deletedOrInactiveCount: number;
  splitParentCount: number;
  crossUserCount: number;
};

const directionOrder: Record<EverydayFinancialYearDirection, number> = {
  MONEY_IN: 0,
  MONEY_OUT: 1,
};

function addChecked(current: number, value: number) {
  const next = current + value;
  if (!Number.isSafeInteger(next)) {
    throw new EverydayFinancialYearReportError(
      "The report total could not be calculated safely.",
      "TOTAL_OVERFLOW",
    );
  }
  return next;
}

function incrementChecked(current: number) {
  return addChecked(current, 1);
}

function dateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new EverydayFinancialYearReportError(
      "A source record has an invalid date.",
      "RECORD_DATE_INVALID",
    );
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new EverydayFinancialYearReportError(
      "A source record has an invalid date.",
      "RECORD_DATE_INVALID",
    );
  }
  return value;
}

function assertAmountAndType(record: EverydayFinancialYearRecord) {
  if (!Number.isSafeInteger(record.amountCents) || record.amountCents === 0) {
    throw new EverydayFinancialYearReportError(
      "A source record has an invalid amount.",
      "RECORD_AMOUNT_INVALID",
    );
  }
  if (!new Set(["INCOME", "EXPENSE", "TRANSFER"]).has(record.type)) {
    throw new EverydayFinancialYearReportError(
      "A source record has an unsupported direction.",
      "RECORD_TYPE_UNSUPPORTED",
    );
  }
  if (
    (record.type === "INCOME" && record.amountCents <= 0)
    || (record.type === "EXPENSE" && record.amountCents >= 0)
  ) {
    throw new EverydayFinancialYearReportError(
      "A source record amount and direction do not agree.",
      "RECORD_TYPE_SIGN_MISMATCH",
    );
  }
}

function normalizedCategory(record: EverydayFinancialYearRecord) {
  const categoryId = record.categoryId?.trim() ?? "";
  const categoryName = record.categoryName?.trim() ?? "";
  if (!categoryId || !categoryName) {
    return { categoryId: null, categoryName: "Uncategorised" };
  }
  return { categoryId, categoryName };
}

function sortedCategoryRows(rows: Iterable<EverydayFinancialYearCategoryRow>) {
  return [...rows].sort((left, right) => (
    directionOrder[left.direction] - directionOrder[right.direction]
    || right.totalCents - left.totalCents
    || left.categoryName.localeCompare(right.categoryName, "en-AU")
    || (left.categoryId ?? "").localeCompare(right.categoryId ?? "", "en-AU")
  ));
}

function assertCategoryReconciliation(
  categoryRows: EverydayFinancialYearCategoryRow[],
  moneyIn: EverydayFinancialYearReport["moneyIn"],
  moneyOut: EverydayFinancialYearReport["moneyOut"],
) {
  let moneyInCents = 0;
  let moneyOutCents = 0;
  let categoryCount = 0;

  for (const row of categoryRows) {
    categoryCount = addChecked(categoryCount, row.count);
    if (row.direction === "MONEY_IN") moneyInCents = addChecked(moneyInCents, row.totalCents);
    else moneyOutCents = addChecked(moneyOutCents, row.totalCents);
  }

  if (
    moneyInCents !== moneyIn.totalCents
    || moneyOutCents !== moneyOut.totalCents
    || categoryCount !== moneyIn.count + moneyOut.count
  ) {
    throw new EverydayFinancialYearReportError(
      "The report Categories did not reconcile safely.",
      "CATEGORY_RECONCILIATION_MISMATCH",
    );
  }
}

function diagnosticValue(
  candidateSource: EverydayFinancialYearCandidateSource,
  value: number,
) {
  return candidateSource === "FULL_DIAGNOSTIC" ? value : null;
}

export function buildEverydayFinancialYearReport(
  authenticatedUserId: string,
  records: ReadonlyArray<EverydayFinancialYearRecord>,
  endingYear: unknown,
  options: BuildOptions = {},
): EverydayFinancialYearReport {
  const userId = authenticatedUserId.trim();
  if (!userId) {
    throw new EverydayFinancialYearReportError(
      "Authentication is required before preparing this report.",
      "AUTHENTICATED_USER_REQUIRED",
    );
  }

  const candidateSource = options.candidateSource ?? "FULL_DIAGNOSTIC";
  const generatedAt = options.generatedAt ?? new Date();
  if (Number.isNaN(generatedAt.getTime())) {
    throw new EverydayFinancialYearReportError(
      "The report generation time is invalid.",
      "GENERATED_AT_INVALID",
    );
  }

  const financialYear = australianFinancialYear(propertyFinancialYearSchema.parse(endingYear));
  const moneyIn = { count: 0, totalCents: 0 };
  const moneyOut = { count: 0, totalCents: 0 };
  const transfers = { count: 0, incomingCount: 0, outgoingCount: 0 };
  const diagnostics: DiagnosticCounts = {
    outsidePeriodCount: 0,
    deletedOrInactiveCount: 0,
    splitParentCount: 0,
    crossUserCount: 0,
  };
  const categories = new Map<string, EverydayFinancialYearCategoryRow>();
  let countedTransactionCount = 0;
  let countedSplitChildCount = 0;

  for (const record of records) {
    if (record.userId !== userId) {
      if (candidateSource === "ELIGIBLE_ONLY") {
        throw new EverydayFinancialYearReportError(
          "An owner-scoped source returned an unavailable record.",
          "ELIGIBLE_SOURCE_VIOLATION",
        );
      }
      diagnostics.crossUserCount = incrementChecked(diagnostics.crossUserCount);
      continue;
    }

    const recordDate = dateOnly(record.date);
    if (recordDate < financialYear.startDate || recordDate > financialYear.endDate) {
      if (candidateSource === "ELIGIBLE_ONLY") {
        throw new EverydayFinancialYearReportError(
          "An eligible-only source returned an out-of-period record.",
          "ELIGIBLE_SOURCE_VIOLATION",
        );
      }
      diagnostics.outsidePeriodCount = incrementChecked(diagnostics.outsidePeriodCount);
      continue;
    }
    if (record.status !== "ACTIVE" || record.deletedAt !== null) {
      if (candidateSource === "ELIGIBLE_ONLY") {
        throw new EverydayFinancialYearReportError(
          "An eligible-only source returned an inactive record.",
          "ELIGIBLE_SOURCE_VIOLATION",
        );
      }
      diagnostics.deletedOrInactiveCount = incrementChecked(diagnostics.deletedOrInactiveCount);
      continue;
    }
    if (record.splitRole === "PARENT") {
      if (candidateSource === "ELIGIBLE_ONLY") {
        throw new EverydayFinancialYearReportError(
          "An eligible-only source returned a split parent.",
          "ELIGIBLE_SOURCE_VIOLATION",
        );
      }
      diagnostics.splitParentCount = incrementChecked(diagnostics.splitParentCount);
      continue;
    }

    assertAmountAndType(record);
    countedTransactionCount = incrementChecked(countedTransactionCount);
    if (record.splitRole === "CHILD") countedSplitChildCount = incrementChecked(countedSplitChildCount);

    if (record.type === "TRANSFER") {
      transfers.count = incrementChecked(transfers.count);
      if (record.amountCents > 0) transfers.incomingCount = incrementChecked(transfers.incomingCount);
      else transfers.outgoingCount = incrementChecked(transfers.outgoingCount);
      continue;
    }

    const direction: EverydayFinancialYearDirection = record.type === "INCOME" ? "MONEY_IN" : "MONEY_OUT";
    const magnitude = Math.abs(record.amountCents);
    const summary = direction === "MONEY_IN" ? moneyIn : moneyOut;
    summary.count = incrementChecked(summary.count);
    summary.totalCents = addChecked(summary.totalCents, magnitude);

    const category = normalizedCategory(record);
    const key = `${direction}:${category.categoryId ?? "uncategorised"}`;
    const row = categories.get(key) ?? {
      direction,
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      count: 0,
      totalCents: 0,
    };
    row.count = incrementChecked(row.count);
    row.totalCents = addChecked(row.totalCents, magnitude);
    categories.set(key, row);
  }

  const expectedCount = moneyIn.count + moneyOut.count + transfers.count;
  if (countedTransactionCount !== expectedCount) {
    throw new EverydayFinancialYearReportError(
      "The report source counts did not reconcile safely.",
      "COUNT_RECONCILIATION_MISMATCH",
    );
  }

  if (candidateSource === "FULL_DIAGNOSTIC") {
    const excludedCount = diagnostics.outsidePeriodCount
      + diagnostics.deletedOrInactiveCount
      + diagnostics.splitParentCount
      + diagnostics.crossUserCount;
    if (records.length !== countedTransactionCount + excludedCount) {
      throw new EverydayFinancialYearReportError(
        "The report candidate counts did not reconcile safely.",
        "COUNT_RECONCILIATION_MISMATCH",
      );
    }
  }

  const categoryRows = sortedCategoryRows(categories.values());
  assertCategoryReconciliation(categoryRows, moneyIn, moneyOut);

  return {
    contract: EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT,
    version: EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION,
    generatedAt: generatedAt.toISOString(),
    financialYear: {
      endingYear: financialYear.endingYear,
      label: financialYear.label,
      startDate: financialYear.startDate,
      endDate: financialYear.endDate,
    },
    currency: "AUD",
    moneyRepresentation: "integer cents",
    moneyIn,
    moneyOut,
    transfers,
    countedTransactionCount,
    countedSplitChildCount,
    categoryRows,
    reconciliation: {
      candidateSource,
      inputTransactionCount: candidateSource === "FULL_DIAGNOSTIC" ? records.length : null,
      outsidePeriodCount: diagnosticValue(candidateSource, diagnostics.outsidePeriodCount),
      deletedOrInactiveCount: diagnosticValue(candidateSource, diagnostics.deletedOrInactiveCount),
      splitParentCount: diagnosticValue(candidateSource, diagnostics.splitParentCount),
      crossUserCount: diagnosticValue(candidateSource, diagnostics.crossUserCount),
      notices: candidateSource === "FULL_DIAGNOSTIC"
        ? [
            "Counts reconcile only the bounded synthetic or server candidate set supplied to this report.",
            "Loan repayment components are analytical records and are not added to everyday cashflow.",
          ]
        : [
            "Only eligible active source records were supplied; exclusion counts are unavailable.",
            "Loan repayment components are analytical records and are not added to everyday cashflow.",
          ],
    },
    disclaimer: "Organisational cashflow preparation only. SpendGrove does not determine tax treatment or provide tax, accounting or financial advice.",
  };
}
