import type { SafeLoanRepayment } from "@/lib/loan-repayment-history";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { listSafeLoanRepayments } from "@/src/server/loan-repayment-history";
import { listLoanMetadata } from "@/src/server/loan-metadata";
import { australianFinancialYear, propertyFinancialYearSchema } from "@/src/server/property-report-review";

export type LoanReportLoanInput = {
  id: string;
  nickname: string;
  type: "HOME_LOAN" | "CAR_LOAN" | "PERSONAL_LOAN" | "OTHER";
  purpose: "OWNER_OCCUPIER" | "INVESTMENT" | "PERSONAL" | "OTHER";
  isArchived: boolean;
  property?: { nickname: string; isArchived: boolean } | null;
};

export type LoanFinancialYearRow = {
  loanId: string;
  nickname: string;
  typeLabel: string;
  purposeLabel: string;
  propertyNickname: string | null;
  repaymentCount: number;
  totalRepaymentCents: number;
  principalCents: number;
  interestCents: number;
  feeCents: number;
  incompleteComponentCount: number;
  matchedCount: number;
  needsReviewCount: number;
  unmatchedCount: number;
  latestBalanceCents: number | null;
  latestBalanceDate: string | null;
};

export type LoanFinancialYearReport = {
  financialYear: {
    endingYear: number;
    label: string;
    startDate: string;
    endDate: string;
  };
  loans: LoanFinancialYearRow[];
  totals: Omit<LoanFinancialYearRow, "loanId" | "nickname" | "typeLabel" | "purposeLabel" | "propertyNickname" | "latestBalanceCents" | "latestBalanceDate">;
};

const typeLabels: Record<LoanReportLoanInput["type"], string> = {
  HOME_LOAN: "Home loan",
  CAR_LOAN: "Car loan",
  PERSONAL_LOAN: "Personal loan",
  OTHER: "Other loan",
};

const purposeLabels: Record<LoanReportLoanInput["purpose"], string> = {
  OWNER_OCCUPIER: "Owner-occupier",
  INVESTMENT: "Investment (user confirmed)",
  PERSONAL: "Personal",
  OTHER: "Other",
};

function addChecked(current: number, value: number) {
  const next = current + value;
  if (!Number.isSafeInteger(next)) throw new Error("LOAN_REPORT_TOTAL_OVERFLOW");
  return next;
}

function emptyTotals() {
  return {
    repaymentCount: 0,
    totalRepaymentCents: 0,
    principalCents: 0,
    interestCents: 0,
    feeCents: 0,
    incompleteComponentCount: 0,
    matchedCount: 0,
    needsReviewCount: 0,
    unmatchedCount: 0,
  };
}

export function currentAustralianFinancialYearEndingYear(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  if (!Number.isInteger(year) || !Number.isInteger(month)) throw new Error("LOAN_REPORT_DATE_UNAVAILABLE");
  return month >= 7 ? year + 1 : year;
}

export function buildLoanFinancialYearReport(
  loans: LoanReportLoanInput[],
  repayments: SafeLoanRepayment[],
  endingYear: unknown,
): LoanFinancialYearReport {
  const year = australianFinancialYear(propertyFinancialYearSchema.parse(endingYear));
  const activeLoans = loans.filter((loan) => !loan.isArchived);
  const loanIds = new Set(activeLoans.map((loan) => loan.id));
  const eligibleRepayments = repayments.filter((repayment) =>
    loanIds.has(repayment.loanAccountId)
    && !repayment.isArchived
    && repayment.repaymentDate >= year.startDate
    && repayment.repaymentDate <= year.endDate,
  );

  const rows = activeLoans.map((loan) => {
    const loanRepayments = eligibleRepayments
      .filter((repayment) => repayment.loanAccountId === loan.id)
      .sort((left, right) => right.repaymentDate.localeCompare(left.repaymentDate));
    const totals = emptyTotals();
    let latestBalanceCents: number | null = null;
    let latestBalanceDate: string | null = null;

    for (const repayment of loanRepayments) {
      totals.repaymentCount += 1;
      totals.totalRepaymentCents = addChecked(totals.totalRepaymentCents, repayment.totalPaymentCents);
      if (repayment.principalCents === null || repayment.interestCents === null || repayment.feeCents === null) {
        totals.incompleteComponentCount += 1;
      }
      if (repayment.principalCents !== null) totals.principalCents = addChecked(totals.principalCents, repayment.principalCents);
      if (repayment.interestCents !== null) totals.interestCents = addChecked(totals.interestCents, repayment.interestCents);
      if (repayment.feeCents !== null) totals.feeCents = addChecked(totals.feeCents, repayment.feeCents);
      if (repayment.reconciliationStatus === "LINKED") totals.matchedCount += 1;
      else if (repayment.reconciliationStatus === "NEEDS_REVIEW") totals.needsReviewCount += 1;
      else totals.unmatchedCount += 1;
      if (latestBalanceCents === null && repayment.balanceAfterCents !== null) {
        latestBalanceCents = repayment.balanceAfterCents;
        latestBalanceDate = repayment.repaymentDate;
      }
    }

    return {
      loanId: loan.id,
      nickname: loan.nickname,
      typeLabel: typeLabels[loan.type],
      purposeLabel: purposeLabels[loan.purpose],
      propertyNickname: loan.property && !loan.property.isArchived ? loan.property.nickname : null,
      ...totals,
      latestBalanceCents,
      latestBalanceDate,
    };
  }).sort((left, right) => left.nickname.localeCompare(right.nickname, "en-AU"));

  const totals = rows.reduce((summary, row) => {
    summary.repaymentCount += row.repaymentCount;
    summary.totalRepaymentCents = addChecked(summary.totalRepaymentCents, row.totalRepaymentCents);
    summary.principalCents = addChecked(summary.principalCents, row.principalCents);
    summary.interestCents = addChecked(summary.interestCents, row.interestCents);
    summary.feeCents = addChecked(summary.feeCents, row.feeCents);
    summary.incompleteComponentCount += row.incompleteComponentCount;
    summary.matchedCount += row.matchedCount;
    summary.needsReviewCount += row.needsReviewCount;
    summary.unmatchedCount += row.unmatchedCount;
    return summary;
  }, emptyTotals());

  return {
    financialYear: {
      endingYear: year.endingYear,
      label: year.label,
      startDate: year.startDate,
      endDate: year.endDate,
    },
    loans: rows,
    totals,
  };
}

export async function getLoanFinancialYearReport(
  context: AuthenticatedUserContext | null | undefined,
  endingYear: unknown,
) {
  const [metadata, repayments] = await Promise.all([
    listLoanMetadata(context),
    listSafeLoanRepayments(context),
  ]);
  return buildLoanFinancialYearReport(metadata.loans, repayments, endingYear);
}

function audCell(cents: number | null) {
  if (cents === null) return "";
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

function csvCell(value: string, protectFormula = false) {
  const safeValue = protectFormula && /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

const csvColumns = [
  "financial_year",
  "loan_nickname",
  "loan_type",
  "user_confirmed_purpose",
  "property_nickname",
  "repayment_count",
  "total_repayments_aud",
  "principal_aud",
  "interest_aud",
  "fees_aud",
  "incomplete_component_count",
  "matched_repayments",
  "needs_review_repayments",
  "unmatched_repayments",
  "latest_balance_aud",
  "latest_balance_date",
  "spendgrove_notice",
] as const;

export function createLoanFinancialYearCsv(report: LoanFinancialYearReport) {
  const header = csvColumns.map((column) => csvCell(column)).join(",");
  const rows = report.loans.map((loan) => [
    report.financialYear.label,
    loan.nickname,
    loan.typeLabel,
    loan.purposeLabel,
    loan.propertyNickname ?? "",
    String(loan.repaymentCount),
    audCell(loan.totalRepaymentCents),
    audCell(loan.principalCents),
    audCell(loan.interestCents),
    audCell(loan.feeCents),
    String(loan.incompleteComponentCount),
    String(loan.matchedCount),
    String(loan.needsReviewCount),
    String(loan.unmatchedCount),
    audCell(loan.latestBalanceCents),
    loan.latestBalanceDate ?? "",
    "Preparation report only - not tax or financial advice.",
  ].map((value, index) => csvCell(value, [1, 2, 3, 4].includes(index))).join(","));
  return [header, ...rows].join("\r\n");
}
