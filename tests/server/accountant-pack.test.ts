import { describe, expect, it } from "vitest";
import {
  ACCOUNTANT_PACK_CONTRACT,
  ACCOUNTANT_PACK_VERSION,
  accountantPackReadme,
  assembleAccountantPackManifest,
} from "@/src/server/accountant-pack";
import type { LoanFinancialYearReport } from "@/src/server/loan-reporting";
import type { PropertyFinancialYearReport } from "@/src/server/property-financial-reporting";

const loanReport: LoanFinancialYearReport = {
  financialYear: { endingYear: 2026, label: "2025-26", startDate: "2025-07-01", endDate: "2026-06-30" },
  loans: [{
    loanId: "loan-1",
    nickname: "Unit loan",
    typeLabel: "Home loan",
    purposeLabel: "Investment (user confirmed)",
    propertyNickname: "Unit",
    repaymentCount: 2,
    totalRepaymentCents: 200000,
    principalCents: 120000,
    interestCents: 70000,
    feeCents: 10000,
    incompleteComponentCount: 1,
    matchedCount: 1,
    needsReviewCount: 1,
    unmatchedCount: 0,
    latestBalanceCents: 40000000,
    latestBalanceDate: "2026-05-01",
  }],
  totals: {
    repaymentCount: 2,
    totalRepaymentCents: 200000,
    principalCents: 120000,
    interestCents: 70000,
    feeCents: 10000,
    incompleteComponentCount: 1,
    matchedCount: 1,
    needsReviewCount: 1,
    unmatchedCount: 0,
  },
};

const propertyReport = {
  property: { id: "property-1", nickname: "Unit", isArchived: false },
  financialYear: loanReport.financialYear,
  cashflow: {
    moneyIn: { count: 1, totalCents: 300000 },
    moneyOut: { count: 1, totalCents: 50000 },
    loanPaymentCashflow: { count: 1, totalCents: 100000 },
    transferContextCount: 0,
    totalLinkedRecordCount: 2,
  },
  loanComponents: {
    repaymentCount: 2,
    interestCents: 70000,
    feeCents: 10000,
    principalCents: 120000,
    incompleteComponentCount: 1,
    matchedCount: 1,
    needsReviewCount: 1,
  },
  records: [
    {
      transactionId: "tx-1",
      date: "2026-01-01",
      amountCents: -50000,
      type: "EXPENSE",
      categoryName: null,
      transactionUpdatedAt: "2026-01-01T00:00:00.000Z",
      provenance: "MANUAL_PROPERTY_LINK",
      relationshipConflict: false,
      archivedLoanContext: false,
      classification: null,
      classificationNeedsReview: true,
      suggestedClassification: null,
      suggestionReasonCode: null,
      reviewUpdatedAt: null,
      needsReview: true,
    },
  ],
} satisfies PropertyFinancialYearReport;

const insights = {
  currentMonth: { key: "2026-07", label: "July 2026", spendCents: 10000, transactionCount: 1 },
  previousMonth: { key: "2026-06", label: "June 2026", spendCents: 9000, transactionCount: 1 },
  trend: { direction: "UP" as const, differenceCents: 1000 },
  categories: [],
  budgets: [{ id: "budget-1", categoryLabel: "Food", amountCents: 50000, spentCents: 10000, remainingCents: 40000, progressPercent: 20 }],
  recurring: [{ id: "recurring-1", label: "Internet", categoryLabel: "Utilities", expectedAmountCents: -8000, cadence: "MONTHLY" }],
};

describe("Phase 8 accountant preparation pack", () => {
  it("assembles versioned safe summaries and a structured multi-download file plan", () => {
    const manifest = assembleAccountantPackManifest(loanReport, [propertyReport], insights, [{
      batchId: "batch-1",
      completedAt: "2026-01-01T00:00:00.000Z",
      totalCount: 10,
      importedCount: 7,
      skippedCount: 2,
      mergedCount: 1,
      warningCount: 1,
      privateFieldCount: 2,
      outcomes: [],
      hiddenOutcomeCount: 10,
      audit: null,
    }], new Date("2026-07-17T00:00:00.000Z"));

    expect(manifest.contract).toBe(ACCOUNTANT_PACK_CONTRACT);
    expect(manifest.version).toBe(ACCOUNTANT_PACK_VERSION);
    expect(manifest.files.map((file) => file.kind)).toEqual([
      "MANIFEST_JSON", "README_TEXT", "LOAN_CSV", "PROPERTY_CSV", "ACCOUNT_EXPORT_JSON",
    ]);
    expect(manifest.propertySummaries[0]).toMatchObject({
      moneyInCents: 300000,
      moneyOutCents: 50000,
      loanInterestCents: 70000,
      principalRecordedCents: 120000,
      sourceTransactionIds: ["tx-1"],
      needsReviewRecordIds: ["tx-1"],
    });
    expect(manifest.importAuditSummary).toMatchObject({ importedCount: 7, skippedCount: 2, mergedCount: 1 });
  });

  it("keeps evidence placeholders and no-double-count guidance explicit", () => {
    const manifest = assembleAccountantPackManifest(loanReport, [propertyReport], insights, []);
    const readme = accountantPackReadme(manifest);
    expect(manifest.evidenceIndex.find((item) => item.group === "DOCUMENTS")?.recordIds).toEqual([]);
    expect(readme).toContain("sole cashflow records");
    expect(readme).toContain("not added as a second cashflow total");
    expect(readme).toContain("Principal is recorded separately");
    expect(readme).toContain("Raw CSV files, filenames and bank account identifiers are not included");
  });

  it("does not include raw narration, filenames, account references or tax conclusions", () => {
    const manifest = assembleAccountantPackManifest(loanReport, [propertyReport], insights, []);
    const json = JSON.stringify(manifest);
    expect(json).not.toContain("rawNarration");
    expect(json).not.toContain("filename");
    expect(json).not.toContain("accountNumber");
    expect(json).not.toMatch(/ATO-ready|claimable|tax saving|tax refund/i);
  });
});
