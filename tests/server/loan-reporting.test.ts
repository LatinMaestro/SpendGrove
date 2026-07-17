import { describe, expect, it } from "vitest";
import type { SafeLoanRepayment } from "@/lib/loan-repayment-history";
import {
  buildLoanFinancialYearReport,
  createLoanFinancialYearCsv,
  currentAustralianFinancialYearEndingYear,
  type LoanReportLoanInput,
} from "@/src/server/loan-reporting";

const loans: LoanReportLoanInput[] = [
  {
    id: "loan-home",
    nickname: "Family Home",
    type: "HOME_LOAN",
    purpose: "OWNER_OCCUPIER",
    isArchived: false,
    property: { nickname: "Home", isArchived: false },
  },
  {
    id: "loan-car",
    nickname: "Car",
    type: "CAR_LOAN",
    purpose: "PERSONAL",
    isArchived: false,
    property: null,
  },
  {
    id: "loan-old",
    nickname: "Old",
    type: "OTHER",
    purpose: "OTHER",
    isArchived: true,
    property: null,
  },
];

function repayment(input: Partial<SafeLoanRepayment> & Pick<SafeLoanRepayment, "id" | "loanAccountId" | "repaymentDate" | "totalPaymentCents">): SafeLoanRepayment {
  return {
    principalCents: null,
    interestCents: null,
    feeCents: null,
    balanceAfterCents: null,
    source: "LOAN_CSV",
    reconciliationStatus: "UNMATCHED",
    isArchived: false,
    updatedAt: "2026-07-01T00:00:00.000Z",
    linkedTransaction: null,
    ...input,
  };
}

describe("Phase 8 Loan financial-year reporting", () => {
  it("uses the Australian financial year and excludes archived or out-of-period records", () => {
    const report = buildLoanFinancialYearReport(loans, [
      repayment({ id: "r1", loanAccountId: "loan-home", repaymentDate: "2025-07-01", totalPaymentCents: 100000 }),
      repayment({ id: "r2", loanAccountId: "loan-home", repaymentDate: "2026-06-30", totalPaymentCents: 110000 }),
      repayment({ id: "outside", loanAccountId: "loan-home", repaymentDate: "2026-07-01", totalPaymentCents: 999999 }),
      repayment({ id: "archived", loanAccountId: "loan-home", repaymentDate: "2026-01-01", totalPaymentCents: 999999, isArchived: true }),
      repayment({ id: "old-loan", loanAccountId: "loan-old", repaymentDate: "2026-01-01", totalPaymentCents: 999999 }),
    ], 2026);

    expect(report.financialYear).toEqual({
      endingYear: 2026,
      label: "2025-26",
      startDate: "2025-07-01",
      endDate: "2026-06-30",
    });
    expect(report.loans.map((loan) => loan.loanId)).toEqual(["loan-car", "loan-home"]);
    expect(report.loans.find((loan) => loan.loanId === "loan-home")?.totalRepaymentCents).toBe(210000);
    expect(report.totals.totalRepaymentCents).toBe(210000);
  });

  it("summarises components and matching without adding linked cashflow again", () => {
    const report = buildLoanFinancialYearReport(loans, [
      repayment({
        id: "linked",
        loanAccountId: "loan-home",
        repaymentDate: "2026-05-01",
        totalPaymentCents: 120000,
        principalCents: 70000,
        interestCents: 45000,
        feeCents: 5000,
        balanceAfterCents: 45000000,
        reconciliationStatus: "LINKED",
        linkedTransaction: { transactionId: "cashflow", date: "2026-05-01", amountCents: -120000 },
      }),
      repayment({
        id: "review",
        loanAccountId: "loan-home",
        repaymentDate: "2026-04-01",
        totalPaymentCents: 120000,
        principalCents: 71000,
        interestCents: 49000,
        reconciliationStatus: "NEEDS_REVIEW",
      }),
    ], 2026);
    const home = report.loans.find((loan) => loan.loanId === "loan-home")!;

    expect(home.totalRepaymentCents).toBe(240000);
    expect(home.principalCents).toBe(141000);
    expect(home.interestCents).toBe(94000);
    expect(home.feeCents).toBe(5000);
    expect(home.matchedCount).toBe(1);
    expect(home.needsReviewCount).toBe(1);
    expect(home.incompleteComponentCount).toBe(1);
    expect(home.latestBalanceCents).toBe(45000000);
  });

  it("creates formula-safe CSV without raw transaction or account fields", () => {
    const report = buildLoanFinancialYearReport([
      { ...loans[0], nickname: "=unsafe", property: { nickname: "+property", isArchived: false } },
    ], [repayment({
      id: "r1",
      loanAccountId: "loan-home",
      repaymentDate: "2026-01-01",
      totalPaymentCents: 10000,
      principalCents: 6000,
      interestCents: 4000,
      feeCents: 0,
    })], 2026);
    const csv = createLoanFinancialYearCsv(report);

    expect(csv).toContain("\"'=unsafe\"");
    expect(csv).toContain("\"'+property\"");
    expect(csv).toContain("\"100.00\"");
    expect(csv).not.toContain("transactionId");
    expect(csv).not.toContain("account number");
  });

  it("uses Brisbane time to choose the current Australian financial year", () => {
    expect(currentAustralianFinancialYearEndingYear(new Date("2026-06-30T14:30:00.000Z"))).toBe(2027);
    expect(currentAustralianFinancialYearEndingYear(new Date("2026-06-30T13:30:00.000Z"))).toBe(2026);
  });
});
