import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const loanReportingPath = new URL("../src/server/loan-reporting.ts", import.meta.url);
const propertyReportingPath = new URL("../src/server/property-financial-reporting.ts", import.meta.url);
const accountantPackPath = new URL("../src/server/accountant-pack.ts", import.meta.url);
const reportCentrePath = new URL("../app/reports/page.tsx", import.meta.url);
const loanPagePath = new URL("../app/reports/loans/page.tsx", import.meta.url);
const propertyPagePath = new URL("../app/reports/properties/page.tsx", import.meta.url);
const accountantPagePath = new URL("../app/reports/accountant-pack/page.tsx", import.meta.url);
const loanTestsPath = new URL("../tests/server/loan-reporting.test.ts", import.meta.url);
const propertyTestsPath = new URL("../tests/server/property-financial-reporting.test.ts", import.meta.url);
const packTestsPath = new URL("../tests/server/accountant-pack.test.ts", import.meta.url);

async function sources() {
  const [
    loanReporting,
    propertyReporting,
    accountantPack,
    reportCentre,
    loanPage,
    propertyPage,
    accountantPage,
    loanTests,
    propertyTests,
    packTests,
  ] = await Promise.all([
    readFile(loanReportingPath, "utf8"),
    readFile(propertyReportingPath, "utf8"),
    readFile(accountantPackPath, "utf8"),
    readFile(reportCentrePath, "utf8"),
    readFile(loanPagePath, "utf8"),
    readFile(propertyPagePath, "utf8"),
    readFile(accountantPagePath, "utf8"),
    readFile(loanTestsPath, "utf8"),
    readFile(propertyTestsPath, "utf8"),
    readFile(packTestsPath, "utf8"),
  ]);
  return {
    loanReporting,
    propertyReporting,
    accountantPack,
    reportCentre,
    loanPage,
    propertyPage,
    accountantPage,
    loanTests,
    propertyTests,
    packTests,
  };
}

describe("Phase C4 Loan, Property and reporting foundation", () => {
  it("keeps Loan FY reporting owner-fed, period-bounded and component-transparent", async () => {
    const { loanReporting, loanTests } = await sources();

    expect(loanReporting).toContain("listLoanMetadata(context)");
    expect(loanReporting).toContain("listSafeLoanRepayments(context)");
    expect(loanReporting).toContain("loanIds.has(repayment.loanAccountId)");
    expect(loanReporting).toContain("repayment.repaymentDate >= year.startDate");
    expect(loanReporting).toContain("repayment.repaymentDate <= year.endDate");
    expect(loanReporting).toContain("LOAN_REPORT_TOTAL_OVERFLOW");
    expect(loanReporting).toContain("incompleteComponentCount");
    expect(loanReporting).toContain('reconciliationStatus === "LINKED"');
    expect(loanTests).toContain("summarises components and matching without adding linked cashflow again");
  });

  it("keeps Property cashflow and Loan analytical components separate", async () => {
    const { propertyReporting, propertyTests } = await sources();

    expect(propertyReporting).toContain("summarizePropertyRecords(review)");
    expect(propertyReporting).toContain("loan.propertyId === review.property.id");
    expect(propertyReporting).toContain("loanComponents.interestCents");
    expect(propertyReporting).toContain("loanComponents.feeCents");
    expect(propertyReporting).toContain("loanComponents.principalCents");
    expect(propertyReporting).not.toContain("loanComponents.totalPaymentCents");
    expect(propertyTests).toContain("never adds them to cashflow");
    expect(propertyTests).toContain("independent of dormant classification");
  });

  it("preserves formula-safe Loan export and neutral report wording", async () => {
    const { loanReporting, loanPage, loanTests } = await sources();

    expect(loanReporting).toContain("protectFormula");
    expect(loanReporting).toContain("Preparation report only - not tax or financial advice.");
    expect(loanTests).toContain("creates formula-safe CSV without raw transaction or account fields");
    expect(loanPage).toContain("They are not added to everyday cashflow or spending totals.");
    expect(loanPage).toContain("does not determine deductibility or provide tax or financial advice");
    expect(loanPage).not.toMatch(/ATO-ready|claimable|tax refund|tax saving/i);
  });

  it("keeps the accountant pack versioned, multi-file and no-double-count safe", async () => {
    const { accountantPack, packTests } = await sources();

    expect(accountantPack).toContain('ACCOUNTANT_PACK_CONTRACT = "spendgrove.accountant-preparation-pack"');
    expect(accountantPack).toContain("ACCOUNTANT_PACK_VERSION = 1");
    expect(accountantPack).toContain('currency: "AUD"');
    expect(accountantPack).toContain('moneyRepresentation: "integer cents"');
    expect(accountantPack).toContain('kind: "MANIFEST_JSON"');
    expect(accountantPack).toContain('kind: "README_TEXT"');
    expect(accountantPack).toContain('kind: "LOAN_CSV"');
    expect(accountantPack).toContain('kind: "PROPERTY_CSV"');
    expect(accountantPack).toContain('kind: "ACCOUNT_EXPORT_JSON"');
    expect(packTests).toContain("keeps evidence placeholders and no-double-count guidance explicit");
  });

  it("keeps document evidence placeholder-only until secure storage is approved", async () => {
    const { accountantPack, accountantPage } = await sources();

    expect(accountantPack).toContain('group: "DOCUMENTS"');
    expect(accountantPack).toContain("Document upload is not active");
    expect(accountantPage).toContain("Document upload is not active. These are review prompts only.");
    expect(accountantPage).not.toMatch(/upload document|attach file|object storage|OCR/i);
  });

  it("keeps current planning information distinct from selected-FY source reports", async () => {
    const { accountantPack, accountantPage } = await sources();

    expect(accountantPack).toContain("currentPlanningSnapshot");
    expect(accountantPack).toContain("insights.currentMonth.key");
    expect(accountantPack).toContain("insights.currentMonth.label");
    expect(accountantPage).toContain("Active budgets");
    expect(accountantPage).toContain("Regular payments");
    expect(accountantPack).not.toContain("historicalBudgetSnapshot");
  });

  it("retains discoverable reports and the professional-review boundary", async () => {
    const { reportCentre, propertyPage, accountantPage } = await sources();

    expect(reportCentre).toContain('href: "/reports/loans"');
    expect(reportCentre).toContain('href: "/reports/properties"');
    expect(reportCentre).toContain('href="/reports/accountant-pack"');
    expect(reportCentre).toContain("not tax advice");
    expect(propertyPage).toContain("Ask your registered tax agent or accountant");
    expect(propertyPage).toContain("does not determine deductibility, prepare a tax return or provide tax advice");
    expect(accountantPage).toContain("manifest.disclaimer");
    expect([reportCentre, propertyPage, accountantPage].join("\n")).not.toMatch(/automatic deduct|tax payable|tax refund|investment return|property yield/i);
  });
});