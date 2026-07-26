import { isTransactionTypeCompatible } from "@/lib/transaction-direction";
import {
  australianFinancialYear,
  propertyFinancialYearSchema,
} from "@/src/server/property-report-review";

export const EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT = "spendgrove.everyday-financial-year-report";
export const EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION = 1 as const;

export type EverydayFinancialYearDirection = "MONEY_IN" | "MONEY_OUT";
export type EverydayFinancialYearSourceMode = "OWNER_SCOPED_DIAGNOSTIC" | "ELIGIBLE_ONLY";
export type EverydayFinancialYearTransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type EverydayFinancialYearSplitRole = "NONE" | "PARENT" | "CHILD";

export type EverydayFinancialYearRecord = {
  id: string;
  userId: string;
  date: string;
  type: EverydayFinancialYearTransactionType | string;
  amountCents: number;
  status: string;
  deletedAt: string | null;
  splitRole: EverydayFinancialYearSplitRole | string;
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
  categories: EverydayFinancialYearCategoryRow[];
  reconciliation: {
    sourceMode: EverydayFinancialYearSourceMode;
    ownerScopeVerified: true;
    inputTransactionCount: number | null;
    outsidePeriodCount: number | null;
    deletedOrInactiveCount: number | null;
    splitParentCount: number | null;
    uncategorisedCount: number;
    analyticalLoanRepaymentCount: number;
    analyticalLoanAmountAddedToCashflowCents: 0;
    notices: string[];
  };
  disclaimer: string;
};

export type EverydayFinancialYearReportReasonCode =
  | "AUTHENTICATED_USER_REQUIRED"
  | "FINANCIAL_YEAR_INVALID"
  | "GENERATED_AT_INVALID"
  | "SOURCE_MODE_INVALID"
  | "OWNER_SCOPE_VIOLATION"
  | "RECORD_DATE_INVALID"
  | "RECORD_AMOUNT_INVALID"
  | "RECORD_TYPE_UNSUPPORTED"
  | "RECORD_TYPE_SIGN_MISMATCH"
  | "RECORD_SPLIT_ROLE_UNSUPPORTED"
  | "ELIGIBLE_SOURCE_VIOLATION"
  | "ANALYTICAL_COUNT_INVALID"
  | "TOTAL_OVERFLOW"
  | "CATEGORY_IDENTITY_MISMATCH"
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

export type BuildEverydayFinancialYearReportOptions = {
  sourceMode?: EverydayFinancialYearSourceMode;
  generatedAt?: Date;
  analyticalLoanRepaymentCount?: number;
};

type DiagnosticCounts = {
  outsidePeriodCount: number;
  deletedOrInactiveCount: number;
  splitParentCount: number;
};

const supportedTypes = new Set<EverydayFinancialYearTransactionType>([
  "INCOME",
  "EXPENSE",
  "TRANSFER",
]);
const supportedSplitRoles = new Set<EverydayFinancialYearSplitRole>([
  "NONE",
  "PARENT",
  "CHILD",
]);
const supportedSourceModes = new Set<EverydayFinancialYearSourceMode>([
  "OWNER_SCOPED_DIAGNOSTIC",
  "ELIGIBLE_ONLY",
]);
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

function parseFinancialYear(endingYear: unknown) {
  const parsed = propertyFinancialYearSchema.safeParse(endingYear);
  if (!parsed.success) {
    throw new EverydayFinancialYearReportError(
      "Choose a supported Australian financial year.",
      "FINANCIAL_YEAR_INVALID",
    );
  }
  return australianFinancialYear(parsed.data);
}

function parseSourceMode(value: unknown): EverydayFinancialYearSourceMode {
  if (!supportedSourceModes.has(value as EverydayFinancialYearSourceMode)) {
    throw new EverydayFinancialYearReportError(
      "Choose a supported report source mode.",
      "SOURCE_MODE_INVALID",
    );
  }
  return value as EverydayFinancialYearSourceMode;
}

function parseDateOnly(value: string) {
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

function assertSupportedSplitRole(record: EverydayFinancialYearRecord) {
  if (!supportedSplitRoles.has(record.splitRole as EverydayFinancialYearSplitRole)) {
    throw new EverydayFinancialYearReportError(
      "A source record has an unsupported split state.",
      "RECORD_SPLIT_ROLE_UNSUPPORTED",
    );
  }
}

function assertAmountAndType(record: EverydayFinancialYearRecord) {
  if (!Number.isSafeInteger(record.amountCents) || record.amountCents === 0) {
    throw new EverydayFinancialYearReportError(
      "A source record has an invalid amount.",
      "RECORD_AMOUNT_INVALID",
    );
  }
  if (!supportedTypes.has(record.type as EverydayFinancialYearTransactionType)) {
    throw new EverydayFinancialYearReportError(
      "A source record has an unsupported direction.",
      "RECORD_TYPE_UNSUPPORTED",
    );
  }
  if (!isTransactionTypeCompatible(record.type, record.amountCents)) {
    throw new EverydayFinancialYearReportError(
      "A source record amount and direction do not agree.",
      "RECORD_TYPE_SIGN_MISMATCH",
    );
  }
}

function normalizeCategory(record: EverydayFinancialYearRecord) {
  const categoryId = record.categoryId?.trim() ?? "";
  const categoryName = record.categoryName?.trim() ?? "";
  if (!categoryId || !categoryName) {
    return { categoryId: null, categoryName: "Uncategorised" };
  }
  return { categoryId, categoryName };
}

function sortCategoryRows(rows: Iterable<EverydayFinancialYearCategoryRow>) {
  return [...rows].sort((left, right) => (
    directionOrder[left.direction] - directionOrder[right.direction]
    || right.totalCents - left.totalCents
    || left.categoryName.localeCompare(right.categoryName, "en-AU")
    || (left.categoryId ?? "").localeCompare(right.categoryId ?? "", "en-AU")
  ));
}

function assertCategoryReconciliation(
  categories: EverydayFinancialYearCategoryRow[],
  moneyIn: EverydayFinancialYearReport["moneyIn"],
  moneyOut: EverydayFinancialYearReport["moneyOut"],
) {
  let moneyInCents = 0;
  let moneyOutCents = 0;
  let categoryCount = 0;

  for (const row of categories) {
    categoryCount = addChecked(categoryCount, row.count);
    if (row.direction === "MONEY_IN") {
      moneyInCents = addChecked(moneyInCents, row.totalCents);
    } else {
      moneyOutCents = addChecked(moneyOutCents, row.totalCents);
    }
  }

  const expectedCategoryCount = addChecked(moneyIn.count, moneyOut.count);
  if (
    moneyInCents !== moneyIn.totalCents
    || moneyOutCents !== moneyOut.totalCents
    || categoryCount !== expectedCategoryCount
  ) {
    throw new EverydayFinancialYearReportError(
      "The report Categories did not reconcile safely.",
      "CATEGORY_RECONCILIATION_MISMATCH",
    );
  }
}

function diagnosticValue(
  sourceMode: EverydayFinancialYearSourceMode,
  value: number,
) {
  return sourceMode === "OWNER_SCOPED_DIAGNOSTIC" ? value : null;
}

export function buildEverydayFinancialYearReport(
  authenticatedUserId: string,
  records: ReadonlyArray<EverydayFinancialYearRecord>,
  endingYear: unknown,
  options: BuildEverydayFinancialYearReportOptions = {},
): EverydayFinancialYearReport {
  const userId = authenticatedUserId.trim();
  if (!userId) {
    throw new EverydayFinancialYearReportError(
      "Authentication is required before preparing this report.",
      "AUTHENTICATED_USER_REQUIRED",
    );
  }

  const sourceMode = parseSourceMode(options.sourceMode ?? "OWNER_SCOPED_DIAGNOSTIC");
  const generatedAt = options.generatedAt ?? new Date();
  if (Number.isNaN(generatedAt.getTime())) {
    throw new EverydayFinancialYearReportError(
      "The report generation time is invalid.",
      "GENERATED_AT_INVALID",
    );
  }
  const analyticalLoanRepaymentCount = options.analyticalLoanRepaymentCount ?? 0;
  if (!Number.isSafeInteger(analyticalLoanRepaymentCount) || analyticalLoanRepaymentCount < 0) {
    throw new EverydayFinancialYearReportError(
      "The analytical Loan record count is invalid.",
      "ANALYTICAL_COUNT_INVALID",
    );
  }

  const financialYear = parseFinancialYear(endingYear);
  const moneyIn = { count: 0, totalCents: 0 };
  const moneyOut = { count: 0, totalCents: 0 };
  const transfers = { count: 0, incomingCount: 0, outgoingCount: 0 };
  const diagnostics: DiagnosticCounts = {
    outsidePeriodCount: 0,
    deletedOrInactiveCount: 0,
    splitParentCount: 0,
  };
  const categoryMap = new Map<string, EverydayFinancialYearCategoryRow>();
  let countedTransactionCount = 0;
  let countedSplitChildCount = 0;
  let uncategorisedCount = 0;

  for (const record of records) {
    if (record.userId !== userId) {
      throw new EverydayFinancialYearReportError(
        "An owner-scoped source returned an unavailable record.",
        "OWNER_SCOPE_VIOLATION",
      );
    }

    const recordDate = parseDateOnly(record.date);
    if (recordDate < financialYear.startDate || recordDate > financialYear.endDate) {
      if (sourceMode === "ELIGIBLE_ONLY") {
        throw new EverydayFinancialYearReportError(
          "An eligible-only source returned an out-of-period record.",
          "ELIGIBLE_SOURCE_VIOLATION",
        );
      }
      diagnostics.outsidePeriodCount = incrementChecked(diagnostics.outsidePeriodCount);
      continue;
    }
    if (record.status !== "ACTIVE" || record.deletedAt !== null) {
      if (sourceMode === "ELIGIBLE_ONLY") {
        throw new EverydayFinancialYearReportError(
          "An eligible-only source returned an inactive record.",
          "ELIGIBLE_SOURCE_VIOLATION",
        );
      }
      diagnostics.deletedOrInactiveCount = incrementChecked(diagnostics.deletedOrInactiveCount);
      continue;
    }

    assertSupportedSplitRole(record);
    if (record.splitRole === "PARENT") {
      if (sourceMode === "ELIGIBLE_ONLY") {
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
    if (record.splitRole === "CHILD") {
      countedSplitChildCount = incrementChecked(countedSplitChildCount);
    }

    if (record.type === "TRANSFER") {
      transfers.count = incrementChecked(transfers.count);
      if (record.amountCents > 0) {
        transfers.incomingCount = incrementChecked(transfers.incomingCount);
      } else {
        transfers.outgoingCount = incrementChecked(transfers.outgoingCount);
      }
      continue;
    }

    const direction: EverydayFinancialYearDirection = record.type === "INCOME"
      ? "MONEY_IN"
      : "MONEY_OUT";
    const magnitude = Math.abs(record.amountCents);
    const summary = direction === "MONEY_IN" ? moneyIn : moneyOut;
    summary.count = incrementChecked(summary.count);
    summary.totalCents = addChecked(summary.totalCents, magnitude);

    const category = normalizeCategory(record);
    if (category.categoryId === null) {
      uncategorisedCount = incrementChecked(uncategorisedCount);
    }
    const key = `${direction}:${category.categoryId ?? "uncategorised"}`;
    const existing = categoryMap.get(key);
    if (existing && existing.categoryName !== category.categoryName) {
      throw new EverydayFinancialYearReportError(
        "A Category identity has inconsistent report labels.",
        "CATEGORY_IDENTITY_MISMATCH",
      );
    }
    const row = existing ?? {
      direction,
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      count: 0,
      totalCents: 0,
    };
    row.count = incrementChecked(row.count);
    row.totalCents = addChecked(row.totalCents, magnitude);
    categoryMap.set(key, row);
  }

  const expectedCount = addChecked(
    addChecked(moneyIn.count, moneyOut.count),
    transfers.count,
  );
  if (countedTransactionCount !== expectedCount) {
    throw new EverydayFinancialYearReportError(
      "The report source counts did not reconcile safely.",
      "COUNT_RECONCILIATION_MISMATCH",
    );
  }

  if (sourceMode === "OWNER_SCOPED_DIAGNOSTIC") {
    const excludedCount = addChecked(
      addChecked(diagnostics.outsidePeriodCount, diagnostics.deletedOrInactiveCount),
      diagnostics.splitParentCount,
    );
    if (records.length !== addChecked(countedTransactionCount, excludedCount)) {
      throw new EverydayFinancialYearReportError(
        "The report candidate counts did not reconcile safely.",
        "COUNT_RECONCILIATION_MISMATCH",
      );
    }
  }

  const categories = sortCategoryRows(categoryMap.values());
  assertCategoryReconciliation(categories, moneyIn, moneyOut);

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
    categories,
    reconciliation: {
      sourceMode,
      ownerScopeVerified: true,
      inputTransactionCount: sourceMode === "OWNER_SCOPED_DIAGNOSTIC" ? records.length : null,
      outsidePeriodCount: diagnosticValue(sourceMode, diagnostics.outsidePeriodCount),
      deletedOrInactiveCount: diagnosticValue(sourceMode, diagnostics.deletedOrInactiveCount),
      splitParentCount: diagnosticValue(sourceMode, diagnostics.splitParentCount),
      uncategorisedCount,
      analyticalLoanRepaymentCount,
      analyticalLoanAmountAddedToCashflowCents: 0,
      notices: sourceMode === "OWNER_SCOPED_DIAGNOSTIC"
        ? [
            "Counts reconcile only the bounded owner-scoped candidate set supplied to this report.",
            "Loan repayment components are analytical records and are not added to everyday cashflow.",
          ]
        : [
            "Only eligible active owner-scoped records were supplied; exclusion counts are unavailable.",
            "Loan repayment components are analytical records and are not added to everyday cashflow.",
          ],
    },
    disclaimer: "Organisational cashflow preparation only. SpendGrove does not determine tax treatment or provide tax, accounting or financial advice.",
  };
}
