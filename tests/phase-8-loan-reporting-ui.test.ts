import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/reports/loans/page.tsx", "utf8");
const route = readFileSync("app/api/account/reports/loans/export/route.ts", "utf8");
const centre = readFileSync("app/reports/page.tsx", "utf8");

describe("Phase 8 Loan report UI", () => {
  it("keeps the report owner-scoped and reachable from the Report Centre", () => {
    expect(centre).toContain('href: "/reports/loans"');
    expect(page).toContain("<AppShell>");
    expect(page).toContain("getCurrentUserContext");
    expect(route).toContain("getCurrentUserContext");
    expect(route).toContain("Cache-Control");
    expect(route).toContain("private, no-store");
  });

  it("provides financial-year controls, component totals, matching context and export", () => {
    expect(page).toContain('name="financialYear"');
    expect(page).toContain("Total repayments");
    expect(page).toContain("Principal recorded");
    expect(page).toContain("Interest recorded");
    expect(page).toContain("Fees recorded");
    expect(page).toContain("Matched");
    expect(page).toContain("Needs review");
    expect(page).toContain("Download CSV");
    expect(page).toContain("Open source records");
  });

  it("states the no-double-count and professional-review boundaries", () => {
    expect(page).toContain("not added to everyday cashflow or spending totals");
    expect(page).toContain("does not determine deductibility");
    expect(page).not.toMatch(/ATO-ready|claimable|tax saving|tax refund/i);
  });

  it("does not use guarded migration-dependent features", () => {
    expect(page).not.toContain("TransferLink");
    expect(page).not.toContain("BulkOperation");
    expect(page).not.toContain("ImportUndo");
    expect(page).not.toContain("PropertyReportReview");
  });
});
