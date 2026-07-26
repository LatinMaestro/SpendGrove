import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const fixturePath = new URL("./fixtures/phase-c4-everyday-fy-reconciliation.json", import.meta.url);
const contractPath = new URL("../docs/PHASE_C4_EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT.md", import.meta.url);

type Direction = "MONEY_IN" | "MONEY_OUT";
type SyntheticTransaction = {
  id: string;
  userId: string;
  date: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amountCents: number;
  status: string;
  deletedAt: string | null;
  splitRole: string;
  categoryId: string | null;
  categoryName: string | null;
};
type ExpectedCategoryRow = {
  direction: Direction;
  categoryId: string | null;
  categoryName: string;
  count: number;
  totalCents: number;
};
type Fixture = {
  contract: string;
  version: number;
  ownerUserId: string;
  financialYear: {
    endingYear: number;
    label: string;
    startDate: string;
    endDate: string;
  };
  transactions: SyntheticTransaction[];
  loanAnalyticalRepayments: Array<{
    id: string;
    linkedTransactionId: string;
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
    categoryRows: ExpectedCategoryRow[];
    loanCashflow: {
      everydayTransactionCount: number;
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

function addChecked(current: number, value: number) {
  const next = current + value;
  if (!Number.isSafeInteger(next)) throw new Error("SYNTHETIC_REPORT_TOTAL_OVERFLOW");
  return next;
}

function referenceReport(fixture: Fixture) {
  const moneyIn = { count: 0, totalCents: 0 };
  const moneyOut = { count: 0, totalCents: 0 };
  const transfers = { count: 0, incomingCount: 0, outgoingCount: 0 };
  const exclusions = {
    outsidePeriodCount: 0,
    deletedOrInactiveCount: 0,
    splitParentCount: 0,
    crossUserCount: 0,
  };
  const categories = new Map<string, ExpectedCategoryRow>();
  let countedTransactionCount = 0;
  let countedSplitChildCount = 0;

  for (const transaction of fixture.transactions) {
    if (transaction.userId !== fixture.ownerUserId) {
      exclusions.crossUserCount += 1;
      continue;
    }
    if (transaction.date < fixture.financialYear.startDate || transaction.date > fixture.financialYear.endDate) {
      exclusions.outsidePeriodCount += 1;
      continue;
    }
    if (transaction.status !== "ACTIVE" || transaction.deletedAt !== null) {
      exclusions.deletedOrInactiveCount += 1;
      continue;
    }
    if (transaction.splitRole === "PARENT") {
      exclusions.splitParentCount += 1;
      continue;
    }
    if (!Number.isSafeInteger(transaction.amountCents) || transaction.amountCents === 0) {
      throw new Error("SYNTHETIC_INVALID_AMOUNT");
    }

    countedTransactionCount += 1;
    if (transaction.splitRole === "CHILD") countedSplitChildCount += 1;

    if (transaction.type === "TRANSFER") {
      transfers.count += 1;
      if (transaction.amountCents > 0) transfers.incomingCount += 1;
      else transfers.outgoingCount += 1;
      continue;
    }

    const direction: Direction = transaction.type === "INCOME" ? "MONEY_IN" : "MONEY_OUT";
    if (
      (transaction.type === "INCOME" && transaction.amountCents <= 0)
      || (transaction.type === "EXPENSE" && transaction.amountCents >= 0)
    ) {
      throw new Error("SYNTHETIC_TYPE_SIGN_MISMATCH");
    }

    const magnitude = Math.abs(transaction.amountCents);
    const summary = direction === "MONEY_IN" ? moneyIn : moneyOut;
    summary.count += 1;
    summary.totalCents = addChecked(summary.totalCents, magnitude);

    const categoryId = transaction.categoryId;
    const categoryName = categoryId && transaction.categoryName ? transaction.categoryName : "Uncategorised";
    const key = `${direction}:${categoryId ?? "uncategorised"}`;
    const row = categories.get(key) ?? {
      direction,
      categoryId,
      categoryName,
      count: 0,
      totalCents: 0,
    };
    row.count += 1;
    row.totalCents = addChecked(row.totalCents, magnitude);
    categories.set(key, row);
  }

  const directionOrder: Record<Direction, number> = { MONEY_IN: 0, MONEY_OUT: 1 };
  const categoryRows = [...categories.values()].sort((left, right) => (
    directionOrder[left.direction] - directionOrder[right.direction]
    || right.totalCents - left.totalCents
    || left.categoryName.localeCompare(right.categoryName, "en-AU")
    || (left.categoryId ?? "").localeCompare(right.categoryId ?? "", "en-AU")
  ));

  return {
    inputTransactionCount: fixture.transactions.length,
    countedTransactionCount,
    moneyIn,
    moneyOut,
    transfers,
    countedSplitChildCount,
    exclusions,
    categoryRows,
  };
}

describe("Phase C4 everyday financial-year formula contract", () => {
  it("uses a wholly synthetic and privacy-safe reconciliation fixture", async () => {
    const fixtureText = await readFile(fixturePath, "utf8");
    const fixture = JSON.parse(fixtureText) as Fixture;

    expect(fixture.contract).toBe("spendgrove.synthetic-everyday-financial-year-reconciliation");
    expect(fixture.version).toBe(1);
    expect(fixture.transactions).toHaveLength(16);
    expect(fixtureText).not.toMatch(/BSB|accountNumber|cardNumber|customerId|filename|rawNarration/i);
    expect(fixtureText).not.toMatch(/\b(?:CommBank|ANZ|NAB|Westpac|Macquarie|ING)\b/i);
    expect(fixtureText).not.toMatch(/@[a-z0-9.-]+\.[a-z]{2,}/i);
  });

  it("includes both Australian FY boundary dates and excludes adjacent dates", async () => {
    const fixture = await loadFixture();
    const report = referenceReport(fixture);

    expect(fixture.financialYear).toEqual({
      endingYear: 2026,
      label: "2025-26",
      startDate: "2025-07-01",
      endDate: "2026-06-30",
    });
    expect(report.exclusions.outsidePeriodCount).toBe(2);
    expect(report.categoryRows).toEqual(expect.arrayContaining([
      expect.objectContaining({ categoryId: "synthetic-other-income", totalCents: 10000 }),
      expect.objectContaining({ categoryId: "synthetic-utilities", totalCents: 1500 }),
    ]));
  });

  it("calculates Money in, Money out and transfer context without netting", async () => {
    const fixture = await loadFixture();
    const report = referenceReport(fixture);

    expect(report.moneyIn).toEqual(fixture.expected.moneyIn);
    expect(report.moneyOut).toEqual(fixture.expected.moneyOut);
    expect(report.transfers).toEqual(fixture.expected.transfers);
    expect(report.countedTransactionCount).toBe(fixture.expected.countedTransactionCount);
    expect(report.moneyIn.totalCents - report.moneyOut.totalCents).toBe(371000);
    expect(fixture.expected).not.toHaveProperty("profitCents");
  });

  it("keeps a positive refund in Money in rather than reducing expense Categories", async () => {
    const fixture = await loadFixture();
    const report = referenceReport(fixture);
    const refund = report.categoryRows.find((row) => row.categoryId === "synthetic-refunds");
    const groceries = report.categoryRows.find((row) => row.categoryId === "synthetic-groceries");

    expect(refund).toMatchObject({ direction: "MONEY_IN", count: 1, totalCents: 3000 });
    expect(groceries).toMatchObject({ direction: "MONEY_OUT", count: 1, totalCents: 12000 });
    expect(report.moneyOut.totalCents).toBe(142000);
  });

  it("excludes the split parent and counts both split children by Category", async () => {
    const fixture = await loadFixture();
    const report = referenceReport(fixture);

    expect(report.exclusions.splitParentCount).toBe(1);
    expect(report.countedSplitChildCount).toBe(fixture.expected.countedSplitChildCount);
    expect(report.categoryRows).toEqual(expect.arrayContaining([
      expect.objectContaining({ categoryId: "synthetic-dining", totalCents: 4000 }),
      expect.objectContaining({ categoryId: "synthetic-transport", totalCents: 2000 }),
    ]));
    expect(report.moneyOut.totalCents).not.toBe(148000);
  });

  it("reconciles Category rows exactly within each direction", async () => {
    const fixture = await loadFixture();
    const report = referenceReport(fixture);
    const categoryMoneyIn = report.categoryRows
      .filter((row) => row.direction === "MONEY_IN")
      .reduce((total, row) => addChecked(total, row.totalCents), 0);
    const categoryMoneyOut = report.categoryRows
      .filter((row) => row.direction === "MONEY_OUT")
      .reduce((total, row) => addChecked(total, row.totalCents), 0);
    const categoryCount = report.categoryRows.reduce((total, row) => total + row.count, 0);

    expect(report.categoryRows).toEqual(fixture.expected.categoryRows);
    expect(categoryMoneyIn).toBe(report.moneyIn.totalCents);
    expect(categoryMoneyOut).toBe(report.moneyOut.totalCents);
    expect(categoryCount).toBe(report.moneyIn.count + report.moneyOut.count);
  });

  it("reconciles counted and excluded candidate records", async () => {
    const fixture = await loadFixture();
    const report = referenceReport(fixture);
    const excludedCount = Object.values(report.exclusions).reduce((total, count) => total + count, 0);

    expect(report.inputTransactionCount).toBe(fixture.expected.inputTransactionCount);
    expect(report.exclusions).toEqual(fixture.expected.exclusions);
    expect(report.inputTransactionCount).toBe(report.countedTransactionCount + excludedCount);
    expect(report.countedTransactionCount).toBe(report.moneyIn.count + report.moneyOut.count + report.transfers.count);
  });

  it("counts a linked Loan payment once in everyday cashflow", async () => {
    const fixture = await loadFixture();
    const report = referenceReport(fixture);
    const loanTransaction = fixture.transactions.find((transaction) => transaction.id === "synthetic-loan-cashflow")!;
    const analyticalTotal = fixture.loanAnalyticalRepayments.reduce(
      (total, repayment) => addChecked(total, repayment.totalPaymentCents),
      0,
    );

    expect(loanTransaction.amountCents).toBe(-fixture.expected.loanCashflow.everydayMoneyOutCents);
    expect(fixture.loanAnalyticalRepayments).toHaveLength(fixture.expected.loanCashflow.analyticalRepaymentCount);
    expect(analyticalTotal).toBe(fixture.expected.loanCashflow.analyticalComponentsCents);
    expect(fixture.loanAnalyticalRepayments.every((repayment) => !repayment.isCashflowRecord)).toBe(true);
    expect(report.moneyOut.totalCents).toBe(142000);
    expect(report.moneyOut.totalCents).not.toBe(142000 + analyticalTotal);
    expect(fixture.expected.loanCashflow.analyticalAmountAddedToCashflow).toBe(false);
  });

  it("freezes neutral wording, formula safety and prohibited metrics before implementation", async () => {
    const contract = await readFile(contractPath, "utf8");

    expect(contract).toContain("query only records owned by that user");
    expect(contract).toContain("A Category row is keyed by");
    expect(contract).toContain("positive refund or rebate");
    expect(contract).toContain("LoanRepayment values");
    expect(contract).toContain("For every user-controlled text cell");
    expect(contract).toContain('currency: "AUD"');
    expect(contract).toContain('moneyRepresentation: "integer cents"');
    expect(contract).toContain("Do not add a `profit`");
    expect(contract).not.toMatch(/automatic deduction|tax payable calculation|ATO lodgement|property yield formula/i);
  });
});