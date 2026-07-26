import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const loanPagePath = new URL("../app/reports/loans/page.tsx", import.meta.url);
const propertyPagePath = new URL("../app/reports/properties/page.tsx", import.meta.url);
const propertyReportingPath = new URL("../src/server/property-financial-reporting.ts", import.meta.url);
const loanReportingPath = new URL("../src/server/loan-reporting.ts", import.meta.url);

async function sources() {
  const [loanPage, propertyPage, propertyReporting, loanReporting] = await Promise.all([
    readFile(loanPagePath, "utf8"),
    readFile(propertyPagePath, "utf8"),
    readFile(propertyReportingPath, "utf8"),
    readFile(loanReportingPath, "utf8"),
  ]);
  return { loanPage, propertyPage, propertyReporting, loanReporting };
}

describe("Phase C4 report reconciliation transparency", () => {
  it("keeps Property repayment reconciliation states three-way and source-derived", async () => {
    const { propertyReporting } = await sources();

    expect(propertyReporting).toContain("matchedCount: number");
    expect(propertyReporting).toContain("needsReviewCount: number");
    expect(propertyReporting).toContain("unmatchedCount: number");
    expect(propertyReporting).toContain('repayment.reconciliationStatus === "LINKED"');
    expect(propertyReporting).toContain('repayment.reconciliationStatus === "NEEDS_REVIEW"');
    expect(propertyReporting).toContain("loanComponents.unmatchedCount += 1");
  });

  it("does not collapse Loan needs-review and unmatched counts", async () => {
    const { loanPage } = await sources();

    expect(loanPage).toContain('["Needs review", String(loan.needsReviewCount)]');
    expect(loanPage).toContain('["Unmatched", String(loan.unmatchedCount)]');
    expect(loanPage).not.toContain("loan.needsReviewCount + loan.unmatchedCount");
    expect(loanPage).toContain("Unmatched means no accepted everyday cashflow link is recorded.");
  });

  it("shows the same distinct reconciliation language in Property reporting", async () => {
    const { propertyPage } = await sources();

    expect(propertyPage).toContain("report.loanComponents.matchedCount");
    expect(propertyPage).toContain("report.loanComponents.needsReviewCount");
    expect(propertyPage).toContain("report.loanComponents.unmatchedCount");
    expect(propertyPage).toContain("does not change the component totals or create another cashflow record");
  });

  it("preserves component-only analysis and the sole-cashflow boundary", async () => {
    const { loanPage, propertyPage, propertyReporting, loanReporting } = await sources();

    expect(propertyReporting).toContain("cashflow: summarizePropertyRecords(review)");
    expect(propertyReporting).not.toContain("totalPaymentCents");
    expect(loanReporting).toContain("listSafeLoanRepayments(context)");
    expect(loanReporting).not.toContain("amountCents");
    expect(loanPage).toContain("not added to everyday cashflow or spending totals");
    expect(propertyPage).toContain("excluded from Property income and expense totals");
  });

  it("retains neutral preparation wording, accessibility and all hard stops", async () => {
    const { loanPage, propertyPage, propertyReporting } = await sources();
    const changedSources = loanPage + propertyPage + propertyReporting;

    expect(loanPage.match(/focus-visible:ring-2/g)?.length ?? 0).toBeGreaterThanOrEqual(6);
    expect(propertyPage.match(/focus-visible:ring-2/g)?.length ?? 0).toBeGreaterThanOrEqual(6);
    expect(changedSources).toContain("does not determine deductibility");
    expect(changedSources).not.toMatch(/ATO-ready|claimable|tax saving|tax refund|ownership share|mixed-purpose allocation/i);
    expect(changedSources).not.toMatch(/prisma|migration|provider|storage key|OCR|Basiq|Apple|TestFlight/i);
  });
});
