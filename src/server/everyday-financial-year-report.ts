import {
  australianFinancialYear,
  propertyFinancialYearSchema,
} from "@/src/server/property-report-review";

export const EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT =
  "spendgrove.everyday-financial-year-report" as const;
export const EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION = 1 as const;

export type EverydayFinancialYearDirection = "MONEY_IN" | "MONEY_OUT";
export type EverydayFinancialYearCandidateSource =
  | "FULL_DIAGNOSTIC"
  | "ELIGIBLE_ONLY";

export type EverydayFinancialYearTransactionInput = {
  id: string;
  userId: string;
  date: Date | string;
  type: "INCOME" | "EXPENSE" | "TRANSFER" | string;
  amountCents: number;
  status: string;
  deletedAt: Date | string | null;
  splitRole: "NONE" | "PARENT" | "CHILD" | string;
  categoryId: string | null;
  categoryName: string | null;
};

export type EverydayFinancialYearAnalyticalLoanInput = {
  isCashflowRecord: boolean;
};

export type EverydayFinancialYearCategoryRow = {
  direction: EverydayFinancialYearDirection;
  categoryId: string | null;
  categoryName: string;
  count: number;
  totalCents: number;
};

export type EverydayFinancialYearExclusionCounts = {
  outsidePeriodCount: number | null;
  deletedOrInactiveCount: number | null;
  splitParentCount: number | null;
  crossUserCount: number | null;
};

export type EverydayFinancialYearReport = {
  contract: typeof EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT;
  version: typeof EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION;
  currency: "AUD";
  moneyRepresentation: "integer cents";
  financialYear: {
    endingYear: number;
    label: string;
    startDate: string;
    endDate: string;
  };
  moneyIn: { count: number; totalCents: number };
  moneyOut: { count: number; totalCents: number };
  transfers: {
    count: number;
    incomingCount: number;
    outgoingCount: number;
  };
  categories: EverydayFinancialYearCategoryRow[];
  reconciliation: {
    candidateSource: EverydayFinancialYearCandidateSource;
    diagnosticsComplete: boolean;
    inputCandidateCount: number | null;
    countedTransactionCount: number;
    countedSplitChildCount: number;
    uncategorisedCount: number;
    exclusions: EverydayFinancialYearExclusionCounts;
    analyticalLoanRepaymentCount: number;
    analyticalLoanAmountAddedToCashflowCents: 0;
  };
  disclaimer: string;
};

export type EverydayFinancialYearReportErrorCode =
  | "AUTHENTICATED_USER_REQUIRED"
  | "INVALID_TRANSACTION_DATE"
  | "INVALID_TRANSACTION_AMOUNT"
  | "UNSUPPORTED_TRANSACTION_TYPE"
  | "TRANSACTION_TYPE_SIGN_MISMATCH"
  | "UNSUPPORTED_SPLIT_ROLE"
  | "ELIGIBLE_SOURCE_VIOLATION"
  | "REPORT_TOTAL_OVERFLOW"
  | "CATEGORY_RECONCILIATION_MISMATCH"
  | "COUNT_RECONCILIATION_MISMATCH"
  | "ANALYTICAL_LOAN_CASHFLOW_CONFLICT";

export class EverydayFinancialYearReportError extends Error {
  constructor(
    readonly code: EverydayFinancialYearReportErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "EverydayFinancialYearReportError";
  }
}

export type BuildEverydayFinancialYearReportInput = {
  userId: string;
  endingYear: unknown;
  transactions: readonly EverydayFinancialYearTransactionInput[];
  analyticalLoanRepayments?: readonly EverydayFinancialYearAnalyticalLoanInput[];
  candidateSource?: EverydayFinancialYearCandidateSource;
};

type CompleteExclusionCounts = Record<
  keyof EverydayFinancialYearExclusionCounts,
  number
>;

function addChecked(current: number, value: number) {
  const next = current + value;
  if (!Number.isSafeInteger(next)) {
    throw new EverydayFinancialYearReportError(
      "REPORT_TOTAL_OVERFLOW",
      "The report total could not be calculated safely.",
    );
  }
  return next;
}

function incrementChecked(current: number) {
  return addChecked(current, 1);
}

function dateOnly(value: Date | string) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new EverydayFinancialYearReportError(
        "INVALID_TRANSACTION_DATE",
        "A transaction date could not be read safely.",
      );
    }
    return value.toISOString().slice(0, 10);
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new EverydayFinancialYearReportError(
      "INVALID_TRANSACTION_DATE",
      "A transaction date could not be read safely.",
    );
  }

  const parsed = new Date(Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  ));
  if (parsed.toISOString().slice(0, 10) !== value) {
    throw new EverydayFinancialYearReportError(
      "INVALID_TRANSACTION_DATE",
      "A transaction date could not be read safely.",
    );
  }
  return value;
}

function assertSupportedSplitRole(splitRole: string) {
  if (splitRole !== "NONE" && splitRole !== "PARENT" && splitRole !== "CHILD") {
    throw new EverydayFinancialYearReportError(
      "UNSUPPORTED_SPLIT_ROLE",
      "A transaction split state could not be reported safely.",
    );
  }
}

function assertSafeAmount(amountCents: number) {
  if (!Number.isSafeInteger(amountCents) || amountCents === 0) {
    throw new EverydayFinancialYearReportError(
      "INVALID_TRANSACTION_AMOUNT",
      "A transaction amount could not be reported safely.",
    );
  }
}

function directionFor(type: string, amountCents: number) {
  if (type === "INCOME") {
    if (amountCents <= 0) {
      throw new EverydayFinancialYearReportError(
        "TRANSACTION_TYPE_SIGN_MISMATCH",
        "A transaction direction could not be reported safely.",
      );
    }
    return "MONEY_IN" as const;
  }
  if (type === "EXPENSE") {
    if (amountCents >= 0) {
      throw new EverydayFinancialYearReportError(
        "TRANSACTION_TYPE_SIGN_MISMATCH",
        "A transaction direction could not be reported safely.",
      );
    }
    return "MONEY_OUT" as const;
  }
  if (type === "TRANSFER") return null;
  throw new EverydayFinancialYearReportError(
    "UNSUPPORTED_TRANSACTION_TYPE",
    "A transaction type could not be reported safely.",
  );
}

function safeCategory(transaction: EverydayFinancialYearTransactionInput) {
  const categoryId = transaction.categoryId?.trim();
  const categoryName = transaction.categoryName?.trim();
  if (!categoryId || !categoryName) {
    return { categoryId: null, categoryName: "Uncategorised" } as const;
  }
  return { categoryId, categoryName };
}

function emptyExclusions(): CompleteExclusionCounts {
  return {
    outsidePeriodCount: 0,
    deletedOrInactiveCount: 0,
    splitParentCount: 0,
    crossUserCount: 0,
  };
}

function eligibleSourceViolation(message: string): never {
  throw new EverydayFinancialYearReportError(
    "ELIGIBLE_SOURCE_VIOLATION",
    message,
  );
}

function assertCategoryReconciliation(
  categoryRows: readonly EverydayFinancialYearCategoryRow[],
  moneyIn: EverydayFinancialYearReport["moneyIn"],
  moneyOut: EverydayFinancialYearReport["moneyOut"],
) {
  let categoryCount = 0;
  let moneyInCents = 0;
  let moneyOutCents = 0;

  for (const row of categoryRows) {
    categoryCount = addChecked(categoryCount, row.count);
    if (row.direction === "MONEY_IN") {
      moneyInCents = addChecked(moneyInCents, row.totalCents);
    } else {
      moneyOutCents = addChecked(moneyOutCents, row.totalCents);
    }
  }

  if (
    categoryCount !== moneyIn.count + moneyOut.count
    || moneyInCents !== moneyIn.totalCents
    || moneyOutCents !== moneyOut.totalCents
  ) {
    throw new EverydayFinancialYearReportError(
      "CATEGORY_RECONCILIATION_MISMATCH",
      "The report Categories did not reconcile safely.",
    );
  }
}

export function buildEverydayFinancialYearReport(
  input: BuildEverydayFinancialYearReportInput,
): EverydayFinancialYearReport {
  const userId = input.userId.trim();
  if (!userId) {
    throw new EverydayFinancialYearReportError(
      "AUTHENTICATED_USER_REQUIRED",
      "An authenticated user is required.",
    );
  }

  const endingYear = propertyFinancialYearSchema.parse(input.endingYear);
  const year = australianFinancialYear(endingYear);
  const candidateSource = input.candidateSource ?? "ELIGIBLE_ONLY";
  const diagnosticsComplete = candidateSource === "FULL_DIAGNOSTIC";
  const exclusions = emptyExclusions();
  const moneyIn = { count: 0, totalCents: 0 };
  const moneyOut = { count: 0, totalCents: 0 };
  const transfers = { count: 0, incomingCount: 0, outgoingCount: 0 };
  const categories = new Map<string, EverydayFinancialYearCategoryRow>();
  let countedTransactionCount = 0;
  let countedSplitChildCount = 0;
  let uncategorisedCount = 0;

  for (const transaction of input.transactions) {
    if (transaction.userId !== userId) {
      if (!diagnosticsComplete) {
        eligibleSourceViolation("An owner-scoped source returned an unavailable record.");
      }
      exclusions.crossUserCount = incrementChecked(exclusions.crossUserCount);
      continue;
    }

    const transactionDate = dateOnly(transaction.date);
    if (transactionDate < year.startDate || transactionDate > year.endDate) {
      if (!diagnosticsComplete) {
        eligibleSourceViolation("An eligible-only source returned an out-of-period record.");
      }
      exclusions.outsidePeriodCount = incrementChecked(exclusions.outsidePeriodCount);
      continue;
    }
    if (transaction.status !== "ACTIVE" || transaction.deletedAt !== null) {
      if (!diagnosticsComplete) {
        eligibleSourceViolation("An eligible-only source returned an inactive record.");
      }
      exclusions.deletedOrInactiveCount = incrementChecked(exclusions.deletedOrInactiveCount);
      continue;
    }

    assertSupportedSplitRole(transaction.splitRole);
    if (transaction.splitRole === "PARENT") {
      if (!diagnosticsComplete) {
        eligibleSourceViolation("An eligible-only source returned a split parent.");
      }
      exclusions.splitParentCount = incrementChecked(exclusions.splitParentCount);
      continue;
    }

    assertSafeAmount(transaction.amountCents);
    const direction = directionFor(transaction.type, transaction.amountCents);
    countedTransactionCount = incrementChecked(countedTransactionCount);
    if (transaction.splitRole === "CHILD") {
      countedSplitChildCount = incrementChecked(countedSplitChildCount);
    }

    if (direction === null) {
      transfers.count = incrementChecked(transfers.count);
      if (transaction.amountCents > 0) {
        transfers.incomingCount = incrementChecked(transfers.incomingCount);
      } else {
        transfers.outgoingCount = incrementChecked(transfers.outgoingCount);
      }
      continue;
    }

    const magnitude = Math.abs(transaction.amountCents);
    const directionSummary = direction === "MONEY_IN" ? moneyIn : moneyOut;
    directionSummary.count = incrementChecked(directionSummary.count);
    directionSummary.totalCents = addChecked(directionSummary.totalCents, magnitude);

    const category = safeCategory(transaction);
    if (category.categoryId === null) {
      uncategorisedCount = incrementChecked(uncategorisedCount);
    }
    const key = JSON.stringify([direction, category.categoryId]);
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

  const analyticalLoanRepayments = input.analyticalLoanRepayments ?? [];
  if (analyticalLoanRepayments.some((repayment) => repayment.isCashflowRecord)) {
    throw new EverydayFinancialYearReportError(
      "ANALYTICAL_LOAN_CASHFLOW_CONFLICT",
      "A Loan analytical record was marked as cashflow.",
    );
  }

  const expectedCount = addChecked(
    addChecked(moneyIn.count, moneyOut.count),
    transfers.count,
  );
  if (countedTransactionCount !== expectedCount) {
    throw new EverydayFinancialYearReportError(
      "COUNT_RECONCILIATION_MISMATCH",
      "The report source counts did not reconcile safely.",
    );
  }

  if (diagnosticsComplete) {
    const excludedCount = addChecked(
      addChecked(exclusions.outsidePeriodCount, exclusions.deletedOrInactiveCount),
      addChecked(exclusions.splitParentCount, exclusions.crossUserCount),
    );
    if (input.transactions.length !== countedTransactionCount + excludedCount) {
      throw new EverydayFinancialYearReportError(
        "COUNT_RECONCILIATION_MISMATCH",
        "The report candidate counts did not reconcile safely.",
      );
    }
  }

  const directionOrder: Record<EverydayFinancialYearDirection, number> = {
    MONEY_IN: 0,
    MONEY_OUT: 1,
  };
  const categoryRows = [...categories.values()].sort((left, right) => (
    directionOrder[left.direction] - directionOrder[right.direction]
    || right.totalCents - left.totalCents
    || left.categoryName.localeCompare(right.categoryName, "en-AU")
    || (left.categoryId ?? "").localeCompare(right.categoryId ?? "", "en-AU")
  ));
  assertCategoryReconciliation(categoryRows, moneyIn, moneyOut);

  const reportedExclusions: EverydayFinancialYearExclusionCounts = diagnosticsComplete
    ? exclusions
    : {
      outsidePeriodCount: null,
      deletedOrInactiveCount: null,
      splitParentCount: null,
      crossUserCount: null,
    };

  return {
    contract: EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT,
    version: EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION,
    currency: "AUD",
    moneyRepresentation: "integer cents",
    financialYear: {
      endingYear: year.endingYear,
      label: year.label,
      startDate: year.startDate,
      endDate: year.endDate,
    },
    moneyIn,
    moneyOut,
    transfers,
    categories: categoryRows,
    reconciliation: {
      candidateSource,
      diagnosticsComplete,
      inputCandidateCount: diagnosticsComplete ? input.transactions.length : null,
      countedTransactionCount,
      countedSplitChildCount,
      uncategorisedCount,
      exclusions: reportedExclusions,
      analyticalLoanRepaymentCount: analyticalLoanRepayments.length,
      analyticalLoanAmountAddedToCashflowCents: 0,
    },
    disclaimer: "Organisational preparation only. SpendGrove does not determine deductibility or provide tax, accounting or financial advice.",
  };
}
