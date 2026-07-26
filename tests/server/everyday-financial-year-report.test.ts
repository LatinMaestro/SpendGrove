import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  buildEverydayFinancialYearReport,
  EverydayFinancialYearReportError,
  EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT,
  EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION,
  type EverydayFinancialYearRecord,
  type EverydayFinancialYearReportReasonCode,
} from "@/src/server/everyday-financial-year-report";

const fixturePath = new URL("../fixtures/phase-c4-everyday-fy-reconciliation.json", import.meta.url);

type Fixture = {
  ownerUserId: string;
  financialYear: { endingYear: number };
  transactions: EverydayFinancialYearRecord[];
  loanAnalyticalRepayments: Array<{
    totalPaymentCents: number;
    principalCents: number;
    interestCents: number;
    feeCents: number;
    isCashflowRecord: boolean;
  }>;
  expected: {
    countedTransactionCount: number;
    moneyIn: { count: number; totalCents: number };
    moneyOut: { count: number; totalCents: number };
    transfers: { count: number; incomingCount: number; outgoingCount: number };
    countedSplitChildCount: number;
    exclusions: {
      outsidePeriodCount: number;
      deletedOrInactiveCount: number;
      splitParentCount: number;
      crossUserCount: number;
    };
    categoryRows: Array<{
      direction: "MONEY_IN" | "MONEY_OUT";
      categoryId: string | null;
      categoryName: string;
      count: number;
      totalCents: number;
    }>;
    loanCashflow: {
      everydayMoneyOutCents: number;
      analyticalRepaymentCount: number;
      analyticalComponentsCents: number;
      analyticalAmountAddedToCashflow: boolean;
    };
  };
};

async function loadFixture() {
  return JSON.parse(await readFile(fixturePath, "utf8")) as Fixture;
}

const generatedAt = new Date("2026-07-26T00:00:00.000Z");

function ownerRecords(fixture: Fixture) {
  return fixture.transactions.filter((record) => record.userId === fixture.ownerUserId);
}

function eligibleOwnerRecords(fixture: Fixture) {
  return ownerRecords(fixture).filter((record) => (
    record.date >= "2025-07-01"
    && record.date <= "2026-06-30"
    && record.status === "ACTIVE"
    && record.deletedAt === null
    && record.splitRole !== "PARENT"
  ));
}

function baseRecord(overrides: Partial<EverydayFinancialYearRecord> = {}): EverydayFinancialYearRecord {
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

function expectReason(action: () => unknown, reasonCode: EverydayFinancialYearReportReasonCode) {
  try {
    action();
    throw new Error("Expected report error.");
  } catch (error) {
    expect(error).toBeInstanceOf(EverydayFinancialYearReportError);
    expect((error as EverydayFinancialYearReportError).reasonCode).toBe(reasonCode);
  }
}

describe("pure everyday financial-year aggregation", () => {
  it("reproduces the owner-scoped synthetic totals and Category rows exactly", async () => {
    const fixture = await loadFixture();
    const records = ownerRecords(fixture);
    const report = buildEverydayFinancialYearReport(
      fixture.ownerUserId,
      records,
      fixture.financialYear.endingYear,
      {
        sourceMode: "OWNER_SCOPED_DIAGNOSTIC",
        generatedAt,
        analyticalLoanRepaymentCount: fixture.loanAnalyticalRepayments.length,
      },
    );

    expect(report.contract).toBe(EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT);
    expect(report.version).toBe(EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION);
    expect(report.generatedAt).toBe("2026-07-26T00:00:00.000Z");
    expect(report.financialYear).toEqual({
      endingYear: 2026,
      label: "2025-26",
      startDate: "2025-07-01",
      endDate: "2026-06-30",
    });
    expect(report.moneyIn).toEqual(fixture.expected.moneyIn);
    expect(report.moneyOut).toEqual(fixture.expected.moneyOut);
    expect(report.transfers).toEqual(fixture.expected.transfers);
    expect(report.countedTransactionCount).toBe(fixture.expected.countedTransactionCount);
    expect(report.countedSplitChildCount).toBe(fixture.expected.countedSplitChildCount);
    expect(report.categories).toEqual(fixture.expected.categoryRows);
    expect(report.reconciliation).toMatchObject({
      sourceMode: "OWNER_SCOPED_DIAGNOSTIC",
      ownerScopeVerified: true,
      inputTransactionCount: records.length,
      outsidePeriodCount: fixture.expected.exclusions.outsidePeriodCount,
      deletedOrInactiveCount: fixture.expected.exclusions.deletedOrInactiveCount,
      splitParentCount: fixture.expected.exclusions.splitParentCount,
      uncategorisedCount: 1,
      analyticalLoanRepaymentCount: fixture.expected.loanCashflow.analyticalRepaymentCount,
      analyticalLoanAmountAddedToCashflowCents: 0,
    });
  });

  it("rejects cross-user candidates instead of exposing a cross-user count", async () => {
    const fixture = await loadFixture();

    expectReason(() => buildEverydayFinancialYearReport(
      fixture.ownerUserId,
      fixture.transactions,
      2026,
      { generatedAt },
    ), "OWNER_SCOPE_VIOLATION");

    const safeReport = buildEverydayFinancialYearReport(
      fixture.ownerUserId,
      ownerRecords(fixture),
      2026,
      { generatedAt },
    );
    expect(safeReport.reconciliation).not.toHaveProperty("crossUserCount");
  });

  it("returns truthful unavailable exclusion diagnostics for an eligible-only source", async () => {
    const fixture = await loadFixture();
    const report = buildEverydayFinancialYearReport(
      fixture.ownerUserId,
      eligibleOwnerRecords(fixture),
      2026,
      {
        sourceMode: "ELIGIBLE_ONLY",
        generatedAt,
        analyticalLoanRepaymentCount: fixture.loanAnalyticalRepayments.length,
      },
    );

    expect(report.moneyIn).toEqual(fixture.expected.moneyIn);
    expect(report.moneyOut).toEqual(fixture.expected.moneyOut);
    expect(report.transfers).toEqual(fixture.expected.transfers);
    expect(report.reconciliation).toMatchObject({
      sourceMode: "ELIGIBLE_ONLY",
      ownerScopeVerified: true,
      inputTransactionCount: null,
      outsidePeriodCount: null,
      deletedOrInactiveCount: null,
      splitParentCount: null,
    });
    expect(report.reconciliation.notices.join(" ")).toMatch(/exclusion counts are unavailable/i);
  });

  it("fails closed if an eligible-only source returns an excluded record", () => {
    const invalidRecords = [
      baseRecord({ date: "2026-07-01" }),
      baseRecord({ status: "DELETED", deletedAt: "2026-01-02T00:00:00.000Z" }),
      baseRecord({ splitRole: "PARENT" }),
    ];

    for (const record of invalidRecords) {
      expectReason(() => buildEverydayFinancialYearReport(
        "synthetic-user-1",
        [record],
        2026,
        { sourceMode: "ELIGIBLE_ONLY", generatedAt },
      ), "ELIGIBLE_SOURCE_VIOLATION");
    }
  });

  it("keeps positive refunds as Money in and transfers outside Category totals", async () => {
    const fixture = await loadFixture();
    const report = buildEverydayFinancialYearReport(
      fixture.ownerUserId,
      ownerRecords(fixture),
      2026,
      { generatedAt },
    );

    expect(report.categories.find((row) => row.categoryId === "synthetic-refunds")).toMatchObject({
      direction: "MONEY_IN",
      count: 1,
      totalCents: 3000,
    });
    expect(report.categories.find((row) => row.categoryId === "synthetic-groceries")).toMatchObject({
      direction: "MONEY_OUT",
      count: 1,
      totalCents: 12000,
    });
    expect(report.categories.some((row) => row.categoryName === "Transfers")).toBe(false);
    expect(report.moneyOut.totalCents).toBe(142000);
  });

  it("counts split children once and records Loan analytics without adding cashflow", async () => {
    const fixture = await loadFixture();
    const report = buildEverydayFinancialYearReport(
      fixture.ownerUserId,
      ownerRecords(fixture),
      2026,
      {
        generatedAt,
        analyticalLoanRepaymentCount: fixture.loanAnalyticalRepayments.length,
      },
    );
    const analyticalComponents = fixture.loanAnalyticalRepayments.reduce(
      (total, repayment) => total + repayment.principalCents + repayment.interestCents + repayment.feeCents,
      0,
    );

    expect(report.countedSplitChildCount).toBe(2);
    expect(report.categories).toEqual(expect.arrayContaining([
      expect.objectContaining({ categoryId: "synthetic-dining", totalCents: 4000 }),
      expect.objectContaining({ categoryId: "synthetic-transport", totalCents: 2000 }),
      expect.objectContaining({ categoryId: "synthetic-loan-repayments", totalCents: 120000 }),
    ]));
    expect(analyticalComponents).toBe(fixture.expected.loanCashflow.analyticalComponentsCents);
    expect(report.moneyOut.totalCents).toBe(fixture.expected.moneyOut.totalCents);
    expect(report.moneyOut.totalCents).not.toBe(fixture.expected.moneyOut.totalCents + analyticalComponents);
    expect(report.reconciliation.analyticalLoanAmountAddedToCashflowCents).toBe(0);
  });

  it("keeps Category identity direction-specific and normalises unavailable labels", () => {
    const report = buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [
        baseRecord({ id: "income", type: "INCOME", amountCents: 500, categoryId: "shared", categoryName: "Shared" }),
        baseRecord({ id: "expense", type: "EXPENSE", amountCents: -300, categoryId: "shared", categoryName: "Shared" }),
        baseRecord({ id: "uncategorised", amountCents: -200, categoryId: "orphan", categoryName: null }),
      ],
      2026,
      { generatedAt },
    );

    expect(report.categories).toEqual([
      { direction: "MONEY_IN", categoryId: "shared", categoryName: "Shared", count: 1, totalCents: 500 },
      { direction: "MONEY_OUT", categoryId: "shared", categoryName: "Shared", count: 1, totalCents: 300 },
      { direction: "MONEY_OUT", categoryId: null, categoryName: "Uncategorised", count: 1, totalCents: 200 },
    ]);
    expect(report.reconciliation.uncategorisedCount).toBe(1);
  });

  it("fails closed on invalid year, dates, amounts, directions, split roles and analytical counts", () => {
    expectReason(() => buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [],
      1800,
      { generatedAt },
    ), "FINANCIAL_YEAR_INVALID");
    expectReason(() => buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [baseRecord({ date: "2026-02-30" })],
      2026,
      { generatedAt },
    ), "RECORD_DATE_INVALID");
    expectReason(() => buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [baseRecord({ amountCents: 0 })],
      2026,
      { generatedAt },
    ), "RECORD_AMOUNT_INVALID");
    expectReason(() => buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [baseRecord({ type: "OTHER" })],
      2026,
      { generatedAt },
    ), "RECORD_TYPE_UNSUPPORTED");
    expectReason(() => buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [baseRecord({ type: "INCOME", amountCents: -100 })],
      2026,
      { generatedAt },
    ), "RECORD_TYPE_SIGN_MISMATCH");
    expectReason(() => buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [baseRecord({ splitRole: "OTHER" })],
      2026,
      { generatedAt },
    ), "RECORD_SPLIT_ROLE_UNSUPPORTED");
    expectReason(() => buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [],
      2026,
      { generatedAt, analyticalLoanRepaymentCount: -1 },
    ), "ANALYTICAL_COUNT_INVALID");
  });

  it("uses checked integer-cent arithmetic and stops on overflow", () => {
    expectReason(() => buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [
        baseRecord({ id: "one", type: "INCOME", amountCents: Number.MAX_SAFE_INTEGER }),
        baseRecord({ id: "two", type: "INCOME", amountCents: 1 }),
      ],
      2026,
      { generatedAt },
    ), "TOTAL_OVERFLOW");
  });

  it("returns a bounded neutral response without private-source or tax-metric expansion", async () => {
    const fixture = await loadFixture();
    const report = buildEverydayFinancialYearReport(
      fixture.ownerUserId,
      ownerRecords(fixture),
      2026,
      { generatedAt },
    );
    const serialized = JSON.stringify(report);

    expect(report.currency).toBe("AUD");
    expect(report.moneyRepresentation).toBe("integer cents");
    expect(report.disclaimer).toMatch(/does not determine tax treatment/i);
    expect(serialized).not.toMatch(/rawNarration|filename|accountNumber|\bbsb\b|cardNumber|customerId|loanAccountId/i);
    expect(report).not.toHaveProperty("profit");
    expect(report).not.toHaveProperty("surplus");
    expect(report).not.toHaveProperty("taxableIncome");
    expect(report).not.toHaveProperty("deductibleTotal");
    expect(report).not.toHaveProperty("netReturn");
  });
});