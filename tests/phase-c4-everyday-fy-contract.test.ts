import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const fixturePath = new URL("./fixtures/phase-c4-everyday-fy-reconciliation.json", import.meta.url);
const contractPath = new URL("../docs/PHASE_C4_EVERYDAY_FINANCIAL_YEAR_FORMULA_CONTRACT.md", import.meta.url);

type SyntheticTransaction = {
  id: string;
  userId: string;
  date: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amountCents: number;
  status: string;
  deletedAt: string | null;
  splitRole: "NONE" | "PARENT" | "CHILD";
  categoryId: string | null;
  categoryName: string | null;
};

type ExpectedCategoryRow = {
  direction: "MONEY_IN" | "MONEY_OUT";
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

function isInFinancialYear(transaction: SyntheticTransaction, fixture: Fixture) {
  return transaction.date >= fixture.financialYear.startDate
    && transaction.date <= fixture.financialYear.endDate;
}

function countedTransactions(fixture: Fixture) {
  return fixture.transactions.filter((transaction) => (
    transaction.userId === fixture.ownerUserId
    && transaction.status === "ACTIVE"
    && transaction.deletedAt === null
    && transaction.splitRole !== "PARENT"
    && isInFinancialYear(transaction, fixture)
  ));
}

function sumChecked(values: number[]) {
  return values.reduce((total, value) => {
    expect(Number.isSafeInteger(value)).toBe(true);
    const next = total + value;
    expect(Number.isSafeInteger(next)).toBe(true);
    return next;
  }, 0);
}

function categoryRows(transactions: SyntheticTransaction[]) {
  const grouped = new Map<string, ExpectedCategoryRow>();

  for (const transaction of transactions) {
    if (transaction.type === "TRANSFER") continue;
    const direction = transaction.type === "INCOME" ? "MONEY_IN" as const : "MONEY_OUT" as const;
    const categoryId = transaction.categoryId;
    const categoryName = transaction.categoryName ?? "Uncategorised";
    const key = `${direction}|${categoryId ?? "uncategorised"}`;
    const current = grouped.get(key) ?? {
      direction,
      categoryId,
      categoryName,
      count: 0,
      totalCents: 0,
    };
    current.count += 1;
    current.totalCents = sumChecked([current.totalCents, Math.abs(transaction.amountCents)]);
    grouped.set(key, current);
  }

  return [...grouped.values()].sort((left, right) => {
    const leftKey = `${left.direction}|${left.categoryId ?? "uncategorised"}`;
    const rightKey = `${right.direction}|${right.categoryId ?? "uncategorised"}`;
    return leftKey.localeCompare(rightKey);
  });
}

describe("Phase C4 everyday financial-year formula contract", () => {
  it("uses a versioned wholly synthetic Australian financial-year fixture", async () => {
    const fixture = await loadFixture();

    expect(fixture.contract).toBe("spendgrove.synthetic-everyday-financial-year-reconciliation");
    expect(fixture.version).toBe(1);
    expect(fixture.financialYear).toEqual({
      endingYear: 2026,
      label: "2025-26",
      startDate: "2025-07-01",
      endDate: "2026-06-30",
    });
    expect(fixture.transactions).toHaveLength(fixture.expected.inputTransactionCount);
    expect(JSON.stringify(fixture)).not.toMatch(/filename|accountNumber|\bbsb\b|cardNumber|customerId|rawNarration|providerSecret/i);
  });

  it("counts only owned active in-period records and excludes split parents", async () => {
    const fixture = await loadFixture();
    const counted = countedTransactions(fixture);

    expect(counted).toHaveLength(fixture.expected.countedTransactionCount);
    expect(counted.every((transaction) => transaction.userId === fixture.ownerUserId)).toBe(true);
    expect(counted.every((transaction) => transaction.status === "ACTIVE" && transaction.deletedAt === null)).toBe(true);
    expect(counted.every((transaction) => transaction.splitRole !== "PARENT")).toBe(true);
    expect(counted.map((transaction) => transaction.id)).toContain("synthetic-fy-start-income");
    expect(counted.map((transaction) => transaction.id)).toContain("synthetic-fy-end-expense");
    expect(counted.map((transaction) => transaction.id)).not.toContain("synthetic-after-period");
  });

  it("reproduces Money in and Money out totals in integer cents", async () => {
    const fixture = await loadFixture();
    const counted = countedTransactions(fixture);
    const moneyIn = counted.filter((transaction) => transaction.type === "INCOME");
    const moneyOut = counted.filter((transaction) => transaction.type === "EXPENSE");

    expect(moneyIn).toHaveLength(fixture.expected.moneyIn.count);
    expect(sumChecked(moneyIn.map((transaction) => transaction.amountCents))).toBe(fixture.expected.moneyIn.totalCents);
    expect(moneyOut).toHaveLength(fixture.expected.moneyOut.count);
    expect(sumChecked(moneyOut.map((transaction) => Math.abs(transaction.amountCents)))).toBe(fixture.expected.moneyOut.totalCents);
    expect(moneyIn.find((transaction) => transaction.id === "synthetic-positive-refund")?.amountCents).toBe(3000);
    expect(moneyOut.some((transaction) => transaction.id === "synthetic-positive-refund")).toBe(false);
  });

  it("keeps transfers as separately counted context", async () => {
    const fixture = await loadFixture();
    const counted = countedTransactions(fixture);
    const transfers = counted.filter((transaction) => transaction.type === "TRANSFER");

    expect(transfers).toHaveLength(fixture.expected.transfers.count);
    expect(transfers.filter((transaction) => transaction.amountCents > 0)).toHaveLength(fixture.expected.transfers.incomingCount);
    expect(transfers.filter((transaction) => transaction.amountCents < 0)).toHaveLength(fixture.expected.transfers.outgoingCount);
    expect(fixture.expected.countedTransactionCount).toBe(
      fixture.expected.moneyIn.count + fixture.expected.moneyOut.count + fixture.expected.transfers.count,
    );
  });

  it("counts split children once and reconciles direction-separated Category rows", async () => {
    const fixture = await loadFixture();
    const counted = countedTransactions(fixture);
    const actualRows = categoryRows(counted);
    const expectedRows = [...fixture.expected.categoryRows].sort((left, right) => {
      const leftKey = `${left.direction}|${left.categoryId ?? "uncategorised"}`;
      const rightKey = `${right.direction}|${right.categoryId ?? "uncategorised"}`;
      return leftKey.localeCompare(rightKey);
    });

    expect(counted.filter((transaction) => transaction.splitRole === "CHILD")).toHaveLength(
      fixture.expected.countedSplitChildCount,
    );
    expect(actualRows).toEqual(expectedRows);
    expect(sumChecked(actualRows.map((row) => row.count))).toBe(
      fixture.expected.moneyIn.count + fixture.expected.moneyOut.count,
    );
    expect(actualRows.some((row) => row.categoryName === "Transfers")).toBe(false);
    expect(actualRows.find((row) => row.categoryId === null)).toMatchObject({
      direction: "MONEY_OUT",
      categoryName: "Uncategorised",
      totalCents: 2500,
    });
  });

  it("keeps Loan repayment components analytical and adds cashflow only once", async () => {
    const fixture = await loadFixture();
    const counted = countedTransactions(fixture);
    const loanCashflow = counted.filter((transaction) => transaction.id === "synthetic-loan-cashflow");
    const componentTotal = sumChecked(fixture.loanAnalyticalRepayments.map((repayment) => (
      repayment.principalCents + repayment.interestCents + repayment.feeCents
    )));

    expect(loanCashflow).toHaveLength(fixture.expected.loanCashflow.everydayTransactionCount);
    expect(Math.abs(loanCashflow[0].amountCents)).toBe(fixture.expected.loanCashflow.everydayMoneyOutCents);
    expect(fixture.loanAnalyticalRepayments).toHaveLength(fixture.expected.loanCashflow.analyticalRepaymentCount);
    expect(componentTotal).toBe(fixture.expected.loanCashflow.analyticalComponentsCents);
    expect(fixture.loanAnalyticalRepayments.every((repayment) => !repayment.isCashflowRecord)).toBe(true);
    expect(fixture.expected.loanCashflow.analyticalAmountAddedToCashflow).toBe(false);
  });

  it("reproduces the explicit exclusion ledger without overlapping the counted set", async () => {
    const fixture = await loadFixture();
    const outsidePeriod = fixture.transactions.filter((transaction) => (
      transaction.userId === fixture.ownerUserId && !isInFinancialYear(transaction, fixture)
    ));
    const deletedOrInactive = fixture.transactions.filter((transaction) => (
      transaction.userId === fixture.ownerUserId
      && isInFinancialYear(transaction, fixture)
      && (transaction.status !== "ACTIVE" || transaction.deletedAt !== null)
    ));
    const splitParents = fixture.transactions.filter((transaction) => (
      transaction.userId === fixture.ownerUserId
      && isInFinancialYear(transaction, fixture)
      && transaction.status === "ACTIVE"
      && transaction.deletedAt === null
      && transaction.splitRole === "PARENT"
    ));
    const crossUser = fixture.transactions.filter((transaction) => transaction.userId !== fixture.ownerUserId);

    expect(outsidePeriod).toHaveLength(fixture.expected.exclusions.outsidePeriodCount);
    expect(deletedOrInactive).toHaveLength(fixture.expected.exclusions.deletedOrInactiveCount);
    expect(splitParents).toHaveLength(fixture.expected.exclusions.splitParentCount);
    expect(crossUser).toHaveLength(fixture.expected.exclusions.crossUserCount);
  });

  it("freezes formula-safe exports, neutral wording and implementation hard stops", async () => {
    const contract = await readFile(contractPath, "utf8");

    expect(contract).toContain("Active owned everyday `Transaction` records are the sole cashflow source.");
    expect(contract).toContain("a positive reviewed refund/rebate represented as an INCOME Transaction is Money in");
    expect(contract).toContain("Eligible `TRANSFER` Transactions are excluded from");
    expect(contract).toContain("A split parent is a display container");
    expect(contract).toContain("Those components are not an additional cashflow source.");
    expect(contract).toContain("formula-protected");
    expect(contract).toContain("Qualified Australian tax/accounting review remains required");
    expect(contract).toContain("This contract does not by itself implement or close REP-01, REP-02 or Phase C4.");
    expect(contract).not.toMatch(/authorises Production migration|authorises Apple submission|automatic deductibility is authorised/i);
  });
});
