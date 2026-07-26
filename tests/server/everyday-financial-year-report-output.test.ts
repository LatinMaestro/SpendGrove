import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  buildEverydayFinancialYearReport,
  type EverydayFinancialYearRecord,
  type EverydayFinancialYearReport,
} from "@/src/server/everyday-financial-year-report";
import {
  createEverydayFinancialYearCategoryCsv,
  createEverydayFinancialYearSummaryCsv,
  EverydayFinancialYearCsvError,
} from "@/src/server/everyday-financial-year-report-output";

const fixturePath = new URL("../fixtures/phase-c4-everyday-fy-reconciliation.json", import.meta.url);
const generatedAt = new Date("2026-07-26T00:00:00.000Z");

type Fixture = {
  ownerUserId: string;
  financialYear: { endingYear: number };
  transactions: EverydayFinancialYearRecord[];
  loanAnalyticalRepayments: unknown[];
};

async function fixtureReport() {
  const fixture = JSON.parse(await readFile(fixturePath, "utf8")) as Fixture;
  return buildEverydayFinancialYearReport(
    fixture.ownerUserId,
    fixture.transactions.filter((record) => record.userId === fixture.ownerUserId),
    fixture.financialYear.endingYear,
    {
      generatedAt,
      analyticalLoanRepaymentCount: fixture.loanAnalyticalRepayments.length,
    },
  );
}

function record(overrides: Partial<EverydayFinancialYearRecord>): EverydayFinancialYearRecord {
  return {
    id: "synthetic-record",
    userId: "synthetic-user-1",
    date: "2026-01-01",
    type: "EXPENSE",
    amountCents: -100,
    status: "ACTIVE",
    deletedAt: null,
    splitRole: "NONE",
    categoryId: "synthetic-category",
    categoryName: "Synthetic Category",
    ...overrides,
  };
}

function expectReason(action: () => unknown, reasonCode: string) {
  try {
    action();
    throw new Error("Expected CSV error.");
  } catch (error) {
    expect(error).toBeInstanceOf(EverydayFinancialYearCsvError);
    expect((error as EverydayFinancialYearCsvError).reasonCode).toBe(reasonCode);
  }
}

describe("everyday financial-year CSV serializers", () => {
  it("serializes the exact four-row everyday summary with truthful blank transfer amounts", async () => {
    const csv = createEverydayFinancialYearSummaryCsv(await fixtureReport());

    expect(csv.split("\r\n")).toEqual([
      '"financial_year","direction","record_count","total_aud","spendgrove_notice"',
      '"2025-26","Money in","3","5130.00","Organisational cashflow preparation only - not tax, accounting or financial advice."',
      '"2025-26","Money out","6","1420.00","Organisational cashflow preparation only - not tax, accounting or financial advice."',
      '"2025-26","Incoming transfer context","1","","Organisational cashflow preparation only - not tax, accounting or financial advice."',
      '"2025-26","Outgoing transfer context","1","","Organisational cashflow preparation only - not tax, accounting or financial advice."',
    ]);
  });

  it("serializes deterministic direction-separated Category rows without internal IDs", async () => {
    const csv = createEverydayFinancialYearCategoryCsv(await fixtureReport());
    const lines = csv.split("\r\n");

    expect(lines).toHaveLength(10);
    expect(lines[0]).toBe('"financial_year","direction","category","record_count","total_aud","spendgrove_notice"');
    expect(lines.slice(1, 4).map((line) => line.split(",").slice(0, 5).join(","))).toEqual([
      '"2025-26","Money in","Salary","1","5000.00"',
      '"2025-26","Money in","Other income","1","100.00"',
      '"2025-26","Money in","Refunds and rebates","1","30.00"',
    ]);
    expect(csv).toContain('"Money out","Loan repayments","1","1200.00"');
    expect(csv).toContain('"Money out","Uncategorised","1","25.00"');
    expect(csv).not.toMatch(/synthetic-(salary|groceries|loan|transport|utilities|refunds)/i);
  });

  it("formula-protects and quotes user-controlled Category labels", () => {
    const report = buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [
        record({ id: "formula", amountCents: -100, categoryId: "formula", categoryName: "=SUM(1,1)" }),
        record({ id: "quotes", amountCents: -200, categoryId: "quotes", categoryName: 'A "quoted", label' }),
      ],
      2026,
      { generatedAt },
    );
    const csv = createEverydayFinancialYearCategoryCsv(report);

    expect(csv).toContain('"\'=SUM(1,1)"');
    expect(csv).toContain('"A ""quoted"", label"');
    expect(csv).not.toMatch(/(?<!\r)\n/);
  });

  it("is deterministic and uses CRLF row boundaries only", async () => {
    const report = await fixtureReport();
    const first = createEverydayFinancialYearCategoryCsv(report);
    const second = createEverydayFinancialYearCategoryCsv(report);

    expect(first).toBe(second);
    expect(first).toContain("\r\n");
    expect(first).not.toMatch(/(?<!\r)\n/);
    expect(first.endsWith("\r\n")).toBe(false);
  });

  it("rejects an unsupported report contract", async () => {
    const report = await fixtureReport();
    const invalid = { ...report, contract: "unsupported-report" } as unknown as EverydayFinancialYearReport;

    expectReason(() => createEverydayFinancialYearSummaryCsv(invalid), "REPORT_CONTRACT_INVALID");
  });

  it("rejects invalid or unreconciled numeric and Category values", async () => {
    const report = await fixtureReport();
    expectReason(() => createEverydayFinancialYearSummaryCsv({
      ...report,
      countedTransactionCount: report.countedTransactionCount + 1,
    }), "REPORT_RECONCILIATION_INVALID");
    expectReason(() => createEverydayFinancialYearCategoryCsv({
      ...report,
      categories: report.categories.map((row, index) => index === 0 ? { ...row, totalCents: -1 } : row),
    }), "REPORT_VALUE_INVALID");
  });

  it("rejects impossible summary pairs and empty Category rows", async () => {
    const report = await fixtureReport();
    expectReason(() => createEverydayFinancialYearSummaryCsv({
      ...report,
      moneyIn: { count: 0, totalCents: report.moneyIn.totalCents },
      countedTransactionCount: report.countedTransactionCount - report.moneyIn.count,
      categories: report.categories.filter((row) => row.direction !== "MONEY_IN"),
    }), "REPORT_RECONCILIATION_INVALID");
    expectReason(() => createEverydayFinancialYearCategoryCsv({
      ...report,
      categories: [
        ...report.categories,
        {
          direction: "MONEY_OUT",
          categoryId: "empty-category",
          categoryName: "Empty Category",
          count: 0,
          totalCents: 0,
        },
      ],
    }), "REPORT_RECONCILIATION_INVALID");
  });
});
