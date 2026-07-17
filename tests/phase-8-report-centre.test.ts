import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const reports = readFileSync("app/reports/page.tsx", "utf8");
const nav = readFileSync("components/bottom-nav.tsx", "utf8");
const routePolicy = readFileSync("src/server/auth/route-policy.ts", "utf8");
const home = readFileSync("app/page.tsx", "utf8");

describe("Phase 8 Report Centre", () => {
  it("provides one authenticated responsive hub for existing report and export workflows", () => {
    expect(reports).toContain("<AppShell>");
    expect(reports).toContain('title="Reports"');
    expect(reports).toContain("Monthly income and spending");
    expect(reports).toContain("Category totals");
    expect(reports).toContain("Regular payments");
    expect(reports).toContain("Budget performance");
    expect(reports).toContain("Loan repayment records");
    expect(reports).toContain("Property records");
    expect(reports).toContain("Import audit history");
    expect(reports).toContain("Full account export");
    expect(reports).toContain("md:grid-cols-2");
  });

  it("keeps Reports discoverable without crowding the five-item mobile navigation", () => {
    expect(nav).toContain('{ href: "/reports", label: "Reports"');
    expect(nav).toContain("mobile: false");
    expect(nav).toContain("grid-cols-5");
    expect(home).toContain('href="/reports"');
    expect(home).toContain("View reports");
  });

  it("protects the route and keeps future or guarded functionality unavailable", () => {
    expect(routePolicy).toContain('"/reports"');
    expect(reports).toContain("A structured preparation pack is being completed in Phase 8");
    expect(reports).not.toContain("BULK_OPERATIONS_RUNTIME_ENABLED");
    expect(reports).not.toContain("TRANSFER_LINK_RUNTIME_ENABLED");
    expect(reports).not.toContain("PropertyReportReview");
    expect(reports).not.toContain("fetch(");
    expect(reports).not.toContain("/api/");
  });

  it("uses neutral record-keeping language", () => {
    expect(reports).toContain("not tax advice");
    expect(reports).not.toMatch(/deductible|claimable|ATO-ready|tax saving|tax due|tax refund/i);
  });
});
