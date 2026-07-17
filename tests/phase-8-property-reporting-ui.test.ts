import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/reports/properties/page.tsx", "utf8");
const centre = readFileSync("app/reports/page.tsx", "utf8");
const helper = readFileSync("src/server/property-financial-reporting.ts", "utf8");

describe("Phase 8 Property report UI", () => {
  it("is authenticated, owner-scoped and reachable from Reports", () => {
    expect(centre).toContain('href: "/reports/properties"');
    expect(page).toContain("<AppShell>");
    expect(page).toContain("getCurrentUserContext");
    expect(page).toContain("listLoanMetadata");
    expect(helper).toContain("getPropertyRecordReview");
    expect(helper).toContain("listSafeLoanRepayments");
  });

  it("provides Property and financial-year controls with existing export access", () => {
    expect(page).toContain('name="propertyId"');
    expect(page).toContain('name="financialYear"');
    expect(page).toContain("Download linked records CSV");
    expect(page).toContain("/report-export?financialYear=");
    expect(page).toContain("Open Transactions");
  });

  it("separates linked cashflow from Loan components and keeps professional wording neutral", () => {
    expect(page).toContain("Money in");
    expect(page).toContain("Money out");
    expect(page).toContain("Loan interest recorded");
    expect(page).toContain("Loan fees recorded");
    expect(page).toContain("Principal is shown for reconciliation and is excluded");
    expect(page).toContain("Ask your registered tax agent or accountant");
    expect(page).toContain("does not determine deductibility");
    expect(page).not.toMatch(/ATO-ready|claimable|tax saving|tax refund/i);
  });

  it("does not reactivate dormant classification or guarded features", () => {
    expect(page).not.toContain("PropertyReportReview");
    expect(page).not.toContain("classification");
    expect(page).not.toContain("TransferLink");
    expect(page).not.toContain("ImportUndo");
    expect(page).not.toContain("BulkOperation");
  });
});
