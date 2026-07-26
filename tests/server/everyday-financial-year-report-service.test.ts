import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { AuthenticationRequiredError } from "@/src/server/auth/ownership";
import {
  EverydayFinancialYearReportError,
} from "@/src/server/everyday-financial-year-report";
import {
  createPrismaEverydayFinancialYearReportStore,
  getEverydayFinancialYearReport,
  type EverydayFinancialYearReportStore,
  type EverydayFinancialYearStoredTransaction,
} from "@/src/server/everyday-financial-year-report-service";

const context: AuthenticatedUserContext = {
  userId: "synthetic-user-1",
  provider: "clerk",
  providerUserId: "synthetic-provider-user",
  isStub: false,
};

const generatedAt = new Date("2026-07-26T00:00:00.000Z");

function transaction(
  overrides: Partial<EverydayFinancialYearStoredTransaction> = {},
): EverydayFinancialYearStoredTransaction {
  return {
    id: "synthetic-transaction",
    userId: context.userId,
    date: new Date("2026-01-01T00:00:00.000Z"),
    type: "EXPENSE",
    amountCents: -1000,
    status: "ACTIVE",
    deletedAt: null,
    splitRole: "NONE",
    categoryId: "synthetic-category",
    category: {
      id: "synthetic-category",
      userId: context.userId,
      name: "Synthetic Category",
      deletedAt: null,
    },
    ...overrides,
  };
}

function store(overrides: Partial<EverydayFinancialYearReportStore> = {}): EverydayFinancialYearReportStore {
  return {
    async listEligibleTransactions() {
      return [transaction()];
    },
    async countLinkedAnalyticalLoanRepayments() {
      return 1;
    },
    ...overrides,
  };
}

function expectReportReason(error: unknown, reasonCode: string) {
  expect(error).toBeInstanceOf(EverydayFinancialYearReportError);
  expect((error as EverydayFinancialYearReportError).reasonCode).toBe(reasonCode);
}

describe("authenticated everyday financial-year report service", () => {
  it("requires authentication before any store access", async () => {
    let calls = 0;
    const guardedStore = store({
      async listEligibleTransactions() {
        calls += 1;
        return [];
      },
      async countLinkedAnalyticalLoanRepayments() {
        calls += 1;
        return 0;
      },
    });

    await expect(getEverydayFinancialYearReport(null, 2026, guardedStore, generatedAt))
      .rejects.toBeInstanceOf(AuthenticationRequiredError);
    expect(calls).toBe(0);
  });

  it("validates the bounded Australian financial year before store access", async () => {
    let calls = 0;
    const guardedStore = store({
      async listEligibleTransactions() {
        calls += 1;
        return [];
      },
      async countLinkedAnalyticalLoanRepayments() {
        calls += 1;
        return 0;
      },
    });

    try {
      await getEverydayFinancialYearReport(context, 1800, guardedStore, generatedAt);
      throw new Error("Expected financial-year validation to fail.");
    } catch (error) {
      expectReportReason(error, "FINANCIAL_YEAR_INVALID");
    }
    expect(calls).toBe(0);
  });

  it("uses the exact owner and half-open financial-year range", async () => {
    const calls: Array<{ kind: string; userId: string; start: string; end: string }> = [];
    const report = await getEverydayFinancialYearReport(context, 2026, store({
      async listEligibleTransactions(userId, start, end) {
        calls.push({ kind: "transactions", userId, start: start.toISOString(), end: end.toISOString() });
        return [transaction()];
      },
      async countLinkedAnalyticalLoanRepayments(userId, start, end) {
        calls.push({ kind: "repayments", userId, start: start.toISOString(), end: end.toISOString() });
        return 1;
      },
    }), generatedAt);

    expect(calls).toEqual([
      {
        kind: "transactions",
        userId: context.userId,
        start: "2025-07-01T00:00:00.000Z",
        end: "2026-07-01T00:00:00.000Z",
      },
      {
        kind: "repayments",
        userId: context.userId,
        start: "2025-07-01T00:00:00.000Z",
        end: "2026-07-01T00:00:00.000Z",
      },
    ]);
    expect(report.financialYear.label).toBe("2025-26");
    expect(report.moneyOut).toEqual({ count: 1, totalCents: 1000 });
    expect(report.reconciliation).toMatchObject({
      sourceMode: "ELIGIBLE_ONLY",
      ownerScopeVerified: true,
      analyticalLoanRepaymentCount: 1,
      analyticalLoanAmountAddedToCashflowCents: 0,
    });
  });

  it("fails closed if a supplied store record is not owner scoped", async () => {
    try {
      await getEverydayFinancialYearReport(context, 2026, store({
        async listEligibleTransactions() {
          return [transaction({ userId: "synthetic-user-2" })];
        },
      }), generatedAt);
      throw new Error("Expected owner isolation to fail.");
    } catch (error) {
      expectReportReason(error, "OWNER_SCOPE_VIOLATION");
    }
  });

  it("treats unavailable or cross-owner Category relations as uncategorised", async () => {
    const report = await getEverydayFinancialYearReport(context, 2026, store({
      async listEligibleTransactions() {
        return [transaction({
          categoryId: "synthetic-category",
          category: {
            id: "synthetic-category",
            userId: "synthetic-user-2",
            name: "Unavailable Category",
            deletedAt: null,
          },
        })];
      },
    }), generatedAt);

    expect(report.categories).toEqual([
      {
        direction: "MONEY_OUT",
        categoryId: null,
        categoryName: "Uncategorised",
        count: 1,
        totalCents: 1000,
      },
    ]);
    expect(report.reconciliation.uncategorisedCount).toBe(1);
  });

  it("builds Prisma queries with owner, lifecycle, split and half-open date guards", async () => {
    let transactionArgs: Record<string, unknown> | undefined;
    let repaymentArgs: Record<string, unknown> | undefined;
    const linkedTransaction = {
      userId: context.userId,
      date: new Date("2026-01-01T00:00:00.000Z"),
      status: "ACTIVE",
      deletedAt: null,
      splitRole: "NONE",
    };
    const prisma = {
      transaction: {
        async findMany(args: Record<string, unknown>) {
          transactionArgs = args;
          return [];
        },
      },
      loanRepayment: {
        async findMany(args: Record<string, unknown>) {
          repaymentArgs = args;
          return [
            { userId: context.userId, reconciliationLink: { unlinkedAt: null, transaction: linkedTransaction } },
            { userId: context.userId, reconciliationLink: { unlinkedAt: new Date(), transaction: linkedTransaction } },
            { userId: context.userId, reconciliationLink: null },
            {
              userId: context.userId,
              reconciliationLink: {
                unlinkedAt: null,
                transaction: { ...linkedTransaction, status: "DELETED", deletedAt: new Date() },
              },
            },
          ];
        },
      },
    } as unknown as PrismaClient;

    const prismaStore = createPrismaEverydayFinancialYearReportStore(prisma);
    const start = new Date("2025-07-01T00:00:00.000Z");
    const end = new Date("2026-07-01T00:00:00.000Z");
    await prismaStore.listEligibleTransactions(context.userId, start, end);
    const analyticalCount = await prismaStore.countLinkedAnalyticalLoanRepayments(context.userId, start, end);

    expect(transactionArgs).toMatchObject({
      where: {
        userId: context.userId,
        status: "ACTIVE",
        deletedAt: null,
        splitRole: { not: "PARENT" },
        date: { gte: start, lt: end },
      },
      orderBy: [{ date: "asc" }, { id: "asc" }],
    });
    expect(repaymentArgs).toMatchObject({
      where: {
        userId: context.userId,
        isArchived: false,
        deletedAt: null,
        repaymentDate: { gte: start, lt: end },
      },
    });
    expect(analyticalCount).toBe(1);
  });
});
