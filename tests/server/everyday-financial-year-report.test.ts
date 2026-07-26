import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  buildEverydayFinancialYearReport,
  EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT,
  EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION,
  EverydayFinancialYearReportError,
  type EverydayFinancialYearReportErrorCode,
  type EverydayFinancialYearTransactionInput,
} from "@/src/server/everyday-financial-year-report";

const fixturePath = new URL("../fixtures/phase-c4-everyday-fy-reconciliation.json", import.meta.url);

type Fixture = {
  ownerUserId: string;
  financialYear: { endingYear: number; label: string; startDate: string; endDate: string };
  transactions: EverydayFinancialYearTransactionInput[];
  loanAnalyticalRepayments: Array<{ isCashflowRecord: boolean }>;
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
      analyticalRepaymentCount: number;
      analyticalAmountAddedToCashflow: boolean;
    };
  };
};

async function loadFixture() {
  return JSON.parse(await readFile(fixturePath, "utf8")) as Fixture;
}

function eligibleFixtureTransactions(fixture: Fixture) {
  return fixture.transactions.filter((transaction) => (
    transaction.userId === fixture.ownerUserId
    && transaction.date >= fixture.financialYear.startDate
    && transaction.date <= fixture.financialYear.endDate
    && transaction.status === "ACTIVE"
    && transaction.deletedAt === null
    && transaction.splitRole !== "PARENT"
  ));
}

function expectReportError(
  callback: () => unknown,
  code: EverydayFinancialYearReportErrorCode,
) {
  try {
    callback();
    throw new Error("Expected report helper to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(EverydayFinancialYearReportError);
    expect(error).toMatchObject({ code });
  }
}

function baseTransaction(
  input: Partial<EverydayFinancialYearTransactionInput> = {},
): EverydayFinancialYearTransactionInput {
  return {
    id: "synthetic-report-row",
    userId: "synthetic-owner",
    date: "2025-07-01",
    type: "INCOME",
    amountCents: 100,
    status: "ACTIVE",
    deletedAt: null,
    splitRole: "NONE",
    categoryId: "synthetic-income",
    categoryName: "Other income",
    ...input,
  };
}

describe("everyday financial-year report helper", () => {
  it("reproduces the controlling synthetic reconciliation fixture exactly", async () => {
    const fixture = await loadFixture();
    const report = buildEverydayFinancialYearReport({
      userId: fixture.ownerUserId,
      endingYear: fixture.financialYear.endingYear,
      transactions: fixture.transactions,
      analyticalLoanRepayments: fixture.loanAnalyticalRepayments,
      candidateSource: "FULL_DIAGNOSTIC",
    });

    expect(report.contract).toBe(EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT);
    expect(report.version).toBe(EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION);
    expect(report.currency).toBe("AUD");
    expect(report.moneyRepresentation).toBe("integer cents");
    expect(report.financialYear).toEqual(fixture.financialYear);
    expect(report.moneyIn).toEqual(fixture.expected.moneyIn);
    expect(report.moneyOut).toEqual(fixture.expected.moneyOut);
    expect(report.transfers).toEqual(fixture.expected.transfers);
    expect(report.categories).toEqual(fixture.expected.categoryRows);
    expect(report.reconciliation).toMatchObject({
      candidateSource: "FULL_DIAGNOSTIC",
      diagnosticsComplete: true,
      inputCandidateCount: fixture.expected.inputTransactionCount,
      countedTransactionCount: fixture.expected.countedTransactionCount,
      countedSplitChildCount: fixture.expected.countedSplitChildCount,
      uncategorisedCount: 1,
      exclusions: fixture.expected.exclusions,
      analyticalLoanRepaymentCount: fixture.expected.loanCashflow.analyticalRepaymentCount,
      analyticalLoanAmountAddedToCashflowCents: 0,
    });
  });

  it("keeps eligible-only diagnostics explicitly unavailable", async () => {
    const fixture = await loadFixture();
    const report = buildEverydayFinancialYearReport({
      userId: fixture.ownerUserId,
      endingYear: 2026,
      transactions: eligibleFixtureTransactions(fixture),
      analyticalLoanRepayments: fixture.loanAnalyticalRepayments,
    });

    expect(report.moneyIn).toEqual(fixture.expected.moneyIn);
    expect(report.moneyOut).toEqual(fixture.expected.moneyOut);
    expect(report.reconciliation).toMatchObject({
      candidateSource: "ELIGIBLE_ONLY",
      diagnosticsComplete: false,
      inputCandidateCount: null,
      exclusions: {
        outsidePeriodCount: null,
        deletedOrInactiveCount: null,
        splitParentCount: null,
        crossUserCount: null,
      },
    });
  });

  it("fails if an eligible-only source leaks a filtered record", () => {
    const invalidSources = [
      baseTransaction({ userId: "other-user" }),
      baseTransaction({ date: "2026-07-01" }),
      baseTransaction({ status: "DELETED", deletedAt: "2026-01-01T00:00:00.000Z" }),
      baseTransaction({ splitRole: "PARENT" }),
    ];

    for (const transaction of invalidSources) {
      expectReportError(() => buildEverydayFinancialYearReport({
        userId: "synthetic-owner",
        endingYear: 2026,
        transactions: [transaction],
      }), "ELIGIBLE_SOURCE_VIOLATION");
    }
  });

  it("does not mutate rows and keeps refund, split and transfer treatment separate", async () => {
    const fixture = await loadFixture();
    const before = JSON.stringify(fixture.transactions);
    const report = buildEverydayFinancialYearReport({
      userId: fixture.ownerUserId,
      endingYear: 2026,
      transactions: fixture.transactions,
      analyticalLoanRepayments: fixture.loanAnalyticalRepayments,
      candidateSource: "FULL_DIAGNOSTIC",
    });

    expect(JSON.stringify(fixture.transactions)).toBe(before);
    expect(report.categories.find((row) => row.categoryId === "synthetic-refunds"))
      .toMatchObject({ direction: "MONEY_IN", totalCents: 3000 });
    expect(report.categories.find((row) => row.categoryId === "synthetic-groceries"))
      .toMatchObject({ direction: "MONEY_OUT", totalCents: 12000 });
    expect(report.categories.some((row) => row.categoryName === "Transfers")).toBe(false);
    expect(report.moneyOut.totalCents).toBe(142000);
  });

  it("accepts Date inputs without shifting financial-year boundaries", () => {
    const report = buildEverydayFinancialYearReport({
      userId: "synthetic-owner",
      endingYear: 2026,
      candidateSource: "FULL_DIAGNOSTIC",
      transactions: [
        baseTransaction({ id: "start", date: new Date("2025-07-01T00:00:00.000Z") }),
        baseTransaction({ id: "end", date: new Date("2026-06-30T00:00:00.000Z"), amountCents: 200 }),
        baseTransaction({ id: "after", date: new Date("2026-07-01T00:00:00.000Z"), amountCents: 300 }),
      ],
    });

    expect(report.moneyIn).toEqual({ count: 2, totalCents: 300 });
    expect(report.reconciliation.exclusions.outsidePeriodCount).toBe(1);
  });

  it("fails closed for invalid dates, amounts and type/sign mismatches", () => {
    expectReportError(() => buildEverydayFinancialYearReport({
      userId: "synthetic-owner",
      endingYear: 2026,
      transactions: [baseTransaction({ date: "2026-02-30" })],
    }), "INVALID_TRANSACTION_DATE");

    expectReportError(() => buildEverydayFinancialYearReport({
      userId: "synthetic-owner",
      endingYear: 2026,
      transactions: [baseTransaction({ amountCents: 0 })],
    }), "INVALID_TRANSACTION_AMOUNT");

    expectReportError(() => buildEverydayFinancialYearReport({
      userId: "synthetic-owner",
      endingYear: 2026,
      transactions: [baseTransaction({ type: "EXPENSE", amountCents: 100 })],
    }), "TRANSACTION_TYPE_SIGN_MISMATCH");
  });

  it("fails closed for unsupported transaction and split states", () => {
    expectReportError(() => buildEverydayFinancialYearReport({
      userId: "synthetic-owner",
      endingYear: 2026,
      transactions: [baseTransaction({ type: "UNKNOWN" })],
    }), "UNSUPPORTED_TRANSACTION_TYPE");

    expectReportError(() => buildEverydayFinancialYearReport({
      userId: "synthetic-owner",
      endingYear: 2026,
      transactions: [baseTransaction({ splitRole: "UNKNOWN" })],
    }), "UNSUPPORTED_SPLIT_ROLE");
  });

  it("fails rather than returning an unsafe aggregate", () => {
    expectReportError(() => buildEverydayFinancialYearReport({
      userId: "synthetic-owner",
      endingYear: 2026,
      transactions: [
        baseTransaction({ id: "large-1", amountCents: Number.MAX_SAFE_INTEGER }),
        baseTransaction({ id: "large-2", amountCents: 1 }),
      ],
    }), "REPORT_TOTAL_OVERFLOW");
  });

  it("keeps Loan analysis non-cashflow and returns no private source fields", () => {
    expectReportError(() => buildEverydayFinancialYearReport({
      userId: "synthetic-owner",
      endingYear: 2026,
      transactions: [baseTransaction()],
      analyticalLoanRepayments: [{ isCashflowRecord: true }],
    }), "ANALYTICAL_LOAN_CASHFLOW_CONFLICT");

    expectReportError(() => buildEverydayFinancialYearReport({
      userId: "   ",
      endingYear: 2026,
      transactions: [],
    }), "AUTHENTICATED_USER_REQUIRED");

    const privateInput = {
      ...baseTransaction(),
      description: "private narration",
      filename: "private.csv",
      accountNumber: "00000000",
    } as EverydayFinancialYearTransactionInput;
    const output = JSON.stringify(buildEverydayFinancialYearReport({
      userId: "synthetic-owner",
      endingYear: 2026,
      transactions: [privateInput],
    }));

    expect(output).not.toMatch(/private narration|private\.csv|00000000|synthetic-report-row/i);
    expect(output).not.toMatch(/profit|taxable income|deductible total|loan reference/i);
  });
});
