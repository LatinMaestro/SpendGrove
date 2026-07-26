import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  buildEverydayFinancialYearReport,
  EverydayFinancialYearReportError,
  EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT,
  EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION,
  type EverydayFinancialYearRecord,
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
    inputTransactionCount: number;
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
      analyticalComponentsCents: number;
      analyticalAmountAddedToCashflow: boolean;
    };
  };
};

async function fixture() {
  return JSON.parse(await readFile(fixturePath, "utf8")) as Fixture;
}

const generatedAt = new Date("2026-07-26T00:00:00.000Z");

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

function expectReason(action: () => unknown, reasonCode: string) {
  try {
    action();
    throw new Error("Expected report error.");
  } catch (error) {
    expect(error).toBeInstanceOf(EverydayFinancialYearReportError);
    expect((error as EverydayFinancialYearReportError).reasonCode).toBe(reasonCode);
  }
}

describe("everyday financial-year report aggregation", () => {
  it("reproduces the controlling full-diagnostic fixture exactly", async () => {
    const input = await fixture();
    const report = buildEverydayFinancialYearReport(
      input.ownerUserId,
      input.transactions,
      input.financialYear.endingYear,
      { candidateSource: "FULL_DIAGNOSTIC", generatedAt },
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
    expect(report.moneyIn).toEqual(input.expected.moneyIn);
    expect(report.moneyOut).toEqual(input.expected.moneyOut);
    expect(report.transfers).toEqual(input.expected.transfers);
    expect(report.countedTransactionCount).toBe(input.expected.countedTransactionCount);
    expect(report.countedSplitChildCount).toBe(input.expected.countedSplitChildCount);
    expect(report.categoryRows).toEqual(input.expected.categoryRows);
    expect(report.reconciliation).toMatchObject({
      candidateSource: "FULL_DIAGNOSTIC",
      inputTransactionCount: input.expected.inputTransactionCount,
      ...input.expected.exclusions,
    });
  });

  it("keeps positive refunds as Money in and transfer records out of Category totals", async () => {
    const input = await fixture();
    const report = buildEverydayFinancialYearReport(input.ownerUserId, input.transactions, 2026, { generatedAt });

    expect(report.categoryRows.find((row) => row.categoryId === "synthetic-refunds")).toMatchObject({
      direction: "MONEY_IN",
      count: 1,
      totalCents: 3000,
    });
    expect(report.categoryRows.find((row) => row.categoryId === "synthetic-groceries")).toMatchObject({
      direction: "MONEY_OUT",
      count: 1,
      totalCents: 12000,
    });
    expect(report.categoryRows.some((row) => row.categoryName === "Transfers")).toBe(false);
    expect(report.moneyOut.totalCents).toBe(142000);
  });

  it("counts split children once and never adds Loan analytical components to cashflow", async () => {
    const input = await fixture();
    const report = buildEverydayFinancialYearReport(input.ownerUserId, input.transactions, 2026, { generatedAt });
    const analyticalComponents = input.loanAnalyticalRepayments.reduce(
      (total, repayment) => total + repayment.principalCents + repayment.interestCents + repayment.feeCents,
      0,
    );

    expect(report.countedSplitChildCount).toBe(2);
    expect(report.categoryRows).toEqual(expect.arrayContaining([
      expect.objectContaining({ categoryId: "synthetic-dining", totalCents: 4000 }),
      expect.objectContaining({ categoryId: "synthetic-transport", totalCents: 2000 }),
      expect.objectContaining({ categoryId: "synthetic-loan-repayments", totalCents: 120000 }),
    ]));
    expect(analyticalComponents).toBe(input.expected.loanCashflow.analyticalComponentsCents);
    expect(input.loanAnalyticalRepayments.every((repayment) => !repayment.isCashflowRecord)).toBe(true);
    expect(report.moneyOut.totalCents).toBe(142000);
    expect(report.moneyOut.totalCents).not.toBe(142000 + analyticalComponents);
    expect(input.expected.loanCashflow.analyticalAmountAddedToCashflow).toBe(false);
  });

  it("returns truthful unavailable diagnostics for an eligible-only source", async () => {
    const input = await fixture();
    const eligible = input.transactions.filter((record) => (
      record.userId === input.ownerUserId
      && record.date >= "2025-07-01"
      && record.date <= "2026-06-30"
      && record.status === "ACTIVE"
      && record.deletedAt === null
      && record.splitRole !== "PARENT"
    ));
    const report = buildEverydayFinancialYearReport(input.ownerUserId, eligible, 2026, {
      candidateSource: "ELIGIBLE_ONLY",
      generatedAt,
    });

    expect(report.moneyIn).toEqual(input.expected.moneyIn);
    expect(report.moneyOut).toEqual(input.expected.moneyOut);
    expect(report.transfers).toEqual(input.expected.transfers);
    expect(report.reconciliation).toMatchObject({
      candidateSource: "ELIGIBLE_ONLY",
      inputTransactionCount: null,
      outsidePeriodCount: null,
      deletedOrInactiveCount: null,
      splitParentCount: null,
      crossUserCount: null,
    });
    expect(report.reconciliation.notices.join(" ")).toMatch(/exclusion counts are unavailable/i);
  });

  it("fails closed when an eligible-only source returns a prohibited record", () => {
    const invalidRecords = [
      baseRecord({ userId: "synthetic-user-2" }),
      baseRecord({ date: "2026-07-01" }),
      baseRecord({ status: "DELETED", deletedAt: "2026-01-02T00:00:00.000Z" }),
      baseRecord({ splitRole: "PARENT" }),
    ];

    for (const record of invalidRecords) {
      expectReason(() => buildEverydayFinancialYearReport(
        "synthetic-user-1",
        [record],
        2026,
        { candidateSource: "ELIGIBLE_ONLY", generatedAt },
      ), "ELIGIBLE_SOURCE_VIOLATION");
    }
  });

  it("fails closed on invalid dates, amounts, types and signs", () => {
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

    expect(report.categoryRows).toEqual([
      { direction: "MONEY_IN", categoryId: "shared", categoryName: "Shared", count: 1, totalCents: 500 },
      { direction: "MONEY_OUT", categoryId: "shared", categoryName: "Shared", count: 1, totalCents: 300 },
      { direction: "MONEY_OUT", categoryId: null, categoryName: "Uncategorised", count: 1, totalCents: 200 },
    ]);
  });

  it("returns a bounded neutral response with no tax or private-source expansion", async () => {
    const input = await fixture();
    const report = buildEverydayFinancialYearReport(input.ownerUserId, input.transactions, 2026, { generatedAt });
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
