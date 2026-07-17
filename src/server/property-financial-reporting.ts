import type { SafeLoanRepayment } from "@/lib/loan-repayment-history";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import type { LoanReportLoanInput } from "@/src/server/loan-reporting";
import { listSafeLoanRepayments } from "@/src/server/loan-repayment-history";
import { listLoanMetadata } from "@/src/server/loan-metadata";
import {
  getPropertyRecordReview,
  type SafePropertyRecordReview,
} from "@/src/server/property-report-review";
import {
  summarizePropertyRecords,
  type SafePropertyRecordSummary,
} from "@/src/server/property-report-output";

export type PropertyReportLoanInput = LoanReportLoanInput & {
  propertyId?: string | null;
};

export type PropertyLoanComponentSummary = {
  repaymentCount: number;
  interestCents: number;
  feeCents: number;
  principalCents: number;
  incompleteComponentCount: number;
  matchedCount: number;
  needsReviewCount: number;
};

export type PropertyFinancialYearReport = {
  property: SafePropertyRecordReview["property"];
  financialYear: SafePropertyRecordReview["financialYear"];
  cashflow: SafePropertyRecordSummary;
  loanComponents: PropertyLoanComponentSummary;
  records: Array<SafePropertyRecordReview["records"][number] & { needsReview: boolean }>;
};

function addChecked(current: number, value: number) {
  const next = current + value;
  if (!Number.isSafeInteger(next)) throw new Error("PROPERTY_FINANCIAL_REPORT_OVERFLOW");
  return next;
}

function emptyLoanComponents(): PropertyLoanComponentSummary {
  return {
    repaymentCount: 0,
    interestCents: 0,
    feeCents: 0,
    principalCents: 0,
    incompleteComponentCount: 0,
    matchedCount: 0,
    needsReviewCount: 0,
  };
}

export function buildPropertyFinancialYearReport(
  review: SafePropertyRecordReview,
  loans: PropertyReportLoanInput[],
  repayments: SafeLoanRepayment[],
): PropertyFinancialYearReport {
  const activeLoanIds = new Set(
    loans
      .filter((loan) => !loan.isArchived && loan.propertyId === review.property.id)
      .map((loan) => loan.id),
  );
  const loanComponents = emptyLoanComponents();

  for (const repayment of repayments) {
    if (
      !activeLoanIds.has(repayment.loanAccountId)
      || repayment.isArchived
      || repayment.repaymentDate < review.financialYear.startDate
      || repayment.repaymentDate > review.financialYear.endDate
    ) {
      continue;
    }
    loanComponents.repaymentCount += 1;
    if (repayment.interestCents !== null) loanComponents.interestCents = addChecked(loanComponents.interestCents, repayment.interestCents);
    if (repayment.feeCents !== null) loanComponents.feeCents = addChecked(loanComponents.feeCents, repayment.feeCents);
    if (repayment.principalCents !== null) loanComponents.principalCents = addChecked(loanComponents.principalCents, repayment.principalCents);
    if (repayment.principalCents === null || repayment.interestCents === null || repayment.feeCents === null) {
      loanComponents.incompleteComponentCount += 1;
    }
    if (repayment.reconciliationStatus === "LINKED") loanComponents.matchedCount += 1;
    else loanComponents.needsReviewCount += 1;
  }

  return {
    property: review.property,
    financialYear: review.financialYear,
    cashflow: summarizePropertyRecords(review),
    loanComponents,
    records: review.records.map((record) => ({
      ...record,
      needsReview: !record.categoryName || record.relationshipConflict || record.archivedLoanContext,
    })),
  };
}

export async function getPropertyFinancialYearReport(
  context: AuthenticatedUserContext | null | undefined,
  propertyId: string,
  endingYear: unknown,
  knownLoans?: PropertyReportLoanInput[],
) {
  const [review, repayments, metadata] = await Promise.all([
    getPropertyRecordReview(context, propertyId, endingYear),
    listSafeLoanRepayments(context),
    knownLoans ? Promise.resolve(null) : listLoanMetadata(context),
  ]);
  return buildPropertyFinancialYearReport(review, knownLoans ?? metadata!.loans, repayments);
}
