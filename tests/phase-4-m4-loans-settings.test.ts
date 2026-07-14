import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const loans = readFileSync("components/loans-manager.tsx", "utf8");
const propertyActivity = readFileSync("components/property-record-keeping-activity.tsx", "utf8");
const settingsPage = readFileSync("app/settings/page.tsx", "utf8");
const settings = readFileSync("components/settings-panel.tsx", "utf8");

describe("Phase 4 Milestone 4 Loans and Settings presentation", () => {
  it("uses a calm Loans overview with one clear primary account action", () => {
    expect(loans).toContain("<PageHeader");
    expect(loans).toContain('title="Loans"');
    expect(loans).toContain("Add loan");
    expect(loans).toContain("Import repayments");
    expect(loans).toContain("Your loans");
    expect(loans).toContain("View loan");
    expect(loans).not.toContain("Your active loans");
    expect(loans).not.toContain("Up to date");
  });

  it("keeps the focused Loan detail hierarchy and required actions", () => {
    expect(loans).toContain("Back to loans");
    expect(loans.indexOf("<RepaymentHistory")).toBeLessThan(loans.indexOf("<PropertyRecordKeepingActivity"));
    expect(loans).toContain("Edit loan");
    expect(loans).toContain("Match transaction");
    expect(loans).toContain("Search by date");
    expect(loans).toContain("Unlink");
    expect(loans).toContain("Delete repayment");
    expect(loans).toContain("Restore");
  });

  it("keeps Property activity and reporting secondary without changing their source", () => {
    expect(propertyActivity).toContain('variant === "loan-detail"');
    expect(propertyActivity).toContain("propertyTransactionsForLoanView");
    expect(propertyActivity).toContain("Property transactions");
    expect(propertyActivity).toContain("View property report");
    expect(propertyActivity).toContain("<PropertyRecordReview");
    expect(propertyActivity).toContain("Record keeping only - not tax advice.");
  });

  it("puts recovery and privacy guidance behind progressive disclosure", () => {
    expect(loans).toContain("<details");
    expect(loans).toContain("Deleted loans");
    expect(loans).toContain("How SpendGrove keeps loan information private");
    expect(loans).toContain("Delete property");
    expect(loans).not.toContain("Archived Loan Accounts");
  });

  it("organises Settings into quiet grouped rows", () => {
    expect(settingsPage).toContain('title="Settings"');
    expect(settingsPage).toContain("Advanced account tools");
    expect(settings).toContain('title="Preferences"');
    expect(settings).toContain('title="Australian defaults"');
    expect(settings).toContain('title="Data and privacy"');
    expect(settings).toContain("Simple Mode");
    expect(settings).toContain("Limit non-essential analytics");
    expect(settings).toContain("No bank login is required and raw CSV files are not stored.");
    expect(settings).not.toContain("rounded-[2rem]");
  });

  it("keeps prohibited product language out of the changed beginner surfaces", () => {
    const beginnerSurface = [loans, propertyActivity, settingsPage, settings].join("\n");
    expect(beginnerSurface).not.toMatch(/net worth|property profit|property yield|equity valuation|ATO-ready|accountant approved|AI advice/i);
  });
});
