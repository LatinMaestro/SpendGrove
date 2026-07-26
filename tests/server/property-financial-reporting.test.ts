import { describe, expect, it } from "vitest";
import type { SafeLoanRepayment } from "@/lib/loan-repayment-history";
import {
  buildPropertyFinancialYearReport,
  type PropertyReportLoanInput,
} from "@/src/server/property-financial-reporting";
import type { SafePropertyRecordReview } from "@/src/server/property-report-review";

const review: SafePropertyRecordReview = {
  property: { id: "property-1", nickname: "Unit", isArchived: false },
  financialYear: {
    endingYear: 2026,
    label: "2025-26",
    startDate: "2025-07-01",
    endDate: "2026-06-30",
  },
  records: [
    {
      transactionId: "income",
      date: "2025-08-01",
      amountCents: 200000,
      type: "INCOME",
      categoryName: "Rent",
      transactionUpdatedAt: "2026-01-01T00:00:00.000Z",
      provenance: "MANUAL_PROPERTY_LINK",
      relationshipConflict: false,
      archivedLoanContext: false,
      classification: null,
      classificationNeedsReview: false,
      suggestedClassification: null,
      suggestionReasonCode: null,
      reviewUpdatedAt: null,
    },
    {
      transactionId: "expense",
      date: "2025-08-02",
      amountCents: -30000,
      type: "EXPENSE",
      categoryName: "Council rates",
      transactionUpdatedAt: "2026-01-01T00:00:00.000Z",
      provenance: "MANUAL_PROPERTY_LINK",
      relationshipConflict: false,
      archivedLoanContext: false,
      classification: "EXCLUDED",
      classificationNeedsReview: false,
      suggestedClassification: null,
      suggestionReasonCode: null,
      reviewUpdatedAt: null,
    },
    {
      transactionId: "loan-cashflow",
      date: "2025-08-03",
      amountCents: -100000,
      type: "EXPENSE",
      categoryName: null,
      transactionUpdatedAt: "2026-01-01T00:00:00.000Z",
      provenance: "LOAN_RECONCILIATION",
      relationshipConflict: false,
      archivedLoanContext: false,
      classification: null,
      classificationNeedsReview: true,
      suggestedClassification: null,
      suggestionReasonCode: null,
      reviewUpdatedAt: null,
    },
  ],
};

const loans: PropertyReportLoanInput[] = [
  { id: "loan-1", nickname: "Unit loan", type: "HOME_LOAN", purpose: "INVESTMENT", isArchived: false, propertyId: "property-1", property: { nickname: "Unit", isArchived: false } },
  { id: "loan-other", nickname: "Other", type: "HOME_LOAN", purpose: "INVESTMENT", isArchived: false, propertyId: "property-2", property: { nickname: "Other", isArchived: false } },
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
    updatedAt: "2026-01-01T00:00:00.000Z",
    linkedTransaction: null,
    ...input,
  };
}

describe("Phase 8 Property financial-year reporting", () => {
  it("keeps the accepted linked-record set independent of dormant classification", () => {
    const report = buildPropertyFinancialYearReport(review, loans, []);
    expect(report.cashflow.moneyIn.totalCents).toBe(200000);
    expect(report.cashflow.moneyOut.totalCents).toBe(130000);
    expect(report.cashflow.loanPaymentCashflow.totalCents).toBe(100000);
    expect(report.records.map((record) => record.transactionId)).toEqual(["income", "expense", "loan-cashflow"]);
    expect(report.records.find((record) => record.transactionId === "expense")?.classification).toBe("EXCLUDED");
  });

  it("separates matched, needs-review and unmatched Loan components and never adds them to cashflow", () => {
    const report = buildPropertyFinancialYearReport(review, loans, [
      repayment({ id: "linked", loanAccountId: "loan-1", repaymentDate: "2026-01-01", totalPaymentCents: 100000, principalCents: 60000, interestCents: 35000, feeCents: 5000, reconciliationStatus: "LINKED" }),
      repayment({ id: "review", loanAccountId: "loan-1", repaymentDate: "2026-02-01", totalPaymentCents: 110000, principalCents: 65000, interestCents: 40000, feeCents: 5000, reconciliationStatus: "NEEDS_REVIEW" }),
      repayment({ id: "unmatched", loanAccountId: "loan-1", repaymentDate: "2026-03-01", totalPaymentCents: 120000, principalCents: 70000, interestCents: 45000, feeCents: 5000, reconciliationStatus: "UNMATCHED" }),
      repayment({ id: "other-property", loanAccountId: "loan-other", repaymentDate: "2026-01-01", totalPaymentCents: 90000, principalCents: 50000, interestCents: 40000, feeCents: 0 }),
      repayment({ id: "outside", loanAccountId: "loan-1", repaymentDate: "2026-07-01", totalPaymentCents: 999999, principalCents: 1, interestCents: 1, feeCents: 1 }),
    ]);

    expect(report.loanComponents).toMatchObject({
      repaymentCount: 3,
      principalCents: 195000,
      interestCents: 120000,
      feeCents: 15000,
      incompleteComponentCount: 0,
      matchedCount: 1,
      needsReviewCount: 1,
      unmatchedCount: 1,
    });
    expect(report.cashflow.moneyOut.totalCents).toBe(130000);
    expect(report.cashflow.loanPaymentCashflow.totalCents).toBe(100000);
  });

  it("marks unresolved source records for review without deciding tax treatment", () => {
    const report = buildPropertyFinancialYearReport(review, loans, []);
    expect(report.records.find((record) => record.transactionId === "loan-cashflow")?.needsReview).toBe(true);
    expect(report.records.find((record) => record.transactionId === "income")?.needsReview).toBe(false);
  });
});
