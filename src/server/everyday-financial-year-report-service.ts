import { Prisma, type PrismaClient } from "@prisma/client";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";
import {
  buildEverydayFinancialYearReport,
  EverydayFinancialYearReportError,
  type EverydayFinancialYearRecord,
  type EverydayFinancialYearReport,
} from "@/src/server/everyday-financial-year-report";
import {
  australianFinancialYear,
  propertyFinancialYearSchema,
} from "@/src/server/property-report-review";

export type EverydayFinancialYearStoredTransaction = {
  id: string;
  userId: string;
  date: Date;
  type: string;
  amountCents: number;
  status: string;
  deletedAt: Date | null;
  splitRole: string;
  categoryId: string | null;
  category: {
    id: string;
    userId: string;
    name: string;
    deletedAt: Date | null;
  } | null;
};

export type EverydayFinancialYearLinkedRepayment = {
  userId: string;
  reconciliationStatus: string;
  loanAccount: {
    userId: string;
  };
  reconciliationLink: {
    userId: string;
    unlinkedAt: Date | null;
    transaction: {
      userId: string;
      date: Date;
      status: string;
      deletedAt: Date | null;
      splitRole: string;
    };
  } | null;
};

export type EverydayFinancialYearReportStore = {
  listEligibleTransactions(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<EverydayFinancialYearStoredTransaction[]>;
  countLinkedAnalyticalLoanRepayments(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<number>;
};

const transactionSelect = {
  id: true,
  userId: true,
  date: true,
  type: true,
  amountCents: true,
  status: true,
  deletedAt: true,
  splitRole: true,
  categoryId: true,
  category: {
    select: {
      id: true,
      userId: true,
      name: true,
      deletedAt: true,
    },
  },
} satisfies Prisma.TransactionSelect;

const linkedRepaymentSelect = {
  userId: true,
  reconciliationStatus: true,
  loanAccount: {
    select: {
      userId: true,
    },
  },
  reconciliationLink: {
    select: {
      userId: true,
      unlinkedAt: true,
      transaction: {
        select: {
          userId: true,
          date: true,
          status: true,
          deletedAt: true,
          splitRole: true,
        },
      },
    },
  },
} satisfies Prisma.LoanRepaymentSelect;

function toDateOnly(value: Date) {
  if (Number.isNaN(value.getTime())) {
    throw new EverydayFinancialYearReportError(
      "A source record has an invalid date.",
      "RECORD_DATE_INVALID",
    );
  }
  return value.toISOString().slice(0, 10);
}

function toReportRecord(
  userId: string,
  record: EverydayFinancialYearStoredTransaction,
): EverydayFinancialYearRecord {
  const category = record.category
    && record.category.id === record.categoryId
    && record.category.userId === userId
    && record.category.deletedAt === null
    ? record.category
    : null;

  return {
    id: record.id,
    userId: record.userId,
    date: toDateOnly(record.date),
    type: record.type,
    amountCents: record.amountCents,
    status: record.status,
    deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
    splitRole: record.splitRole,
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? null,
  };
}

function isEligibleLinkedRepayment(
  userId: string,
  repayment: EverydayFinancialYearLinkedRepayment,
  start: Date,
  end: Date,
) {
  const link = repayment.reconciliationLink;
  if (
    repayment.userId !== userId
    || repayment.reconciliationStatus !== "LINKED"
    || repayment.loanAccount.userId !== userId
    || !link
    || link.userId !== userId
    || link.unlinkedAt !== null
  ) {
    return false;
  }
  const transaction = link.transaction;
  return transaction.userId === userId
    && transaction.status === "ACTIVE"
    && transaction.deletedAt === null
    && transaction.splitRole !== "PARENT"
    && transaction.date >= start
    && transaction.date < end;
}

export function createPrismaEverydayFinancialYearReportStore(
  prisma: PrismaClient = getPrismaClient(),
): EverydayFinancialYearReportStore {
  return {
    async listEligibleTransactions(userId, start, end) {
      return prisma.transaction.findMany({
        where: {
          userId,
          status: "ACTIVE",
          deletedAt: null,
          splitRole: { not: "PARENT" },
          date: { gte: start, lt: end },
        },
        orderBy: [{ date: "asc" }, { id: "asc" }],
        select: transactionSelect,
      }) as unknown as Promise<EverydayFinancialYearStoredTransaction[]>;
    },

    async countLinkedAnalyticalLoanRepayments(userId, start, end) {
      const repayments = await prisma.loanRepayment.findMany({
        where: {
          userId,
          reconciliationStatus: "LINKED",
          isArchived: false,
          deletedAt: null,
          repaymentDate: { gte: start, lt: end },
          loanAccount: { is: { userId } },
          reconciliationLink: {
            is: {
              userId,
              unlinkedAt: null,
              transaction: {
                is: {
                  userId,
                  status: "ACTIVE",
                  deletedAt: null,
                  splitRole: { not: "PARENT" },
                  date: { gte: start, lt: end },
                },
              },
            },
          },
        },
        select: linkedRepaymentSelect,
      }) as unknown as EverydayFinancialYearLinkedRepayment[];

      return repayments.filter((repayment) => (
        isEligibleLinkedRepayment(userId, repayment, start, end)
      )).length;
    },
  };
}

function parseFinancialYearBeforeStoreAccess(endingYear: unknown) {
  const parsed = propertyFinancialYearSchema.safeParse(endingYear);
  if (!parsed.success) {
    throw new EverydayFinancialYearReportError(
      "Choose a supported Australian financial year.",
      "FINANCIAL_YEAR_INVALID",
    );
  }
  return australianFinancialYear(parsed.data);
}

export async function getEverydayFinancialYearReport(
  context: AuthenticatedUserContext | null | undefined,
  endingYear: unknown,
  store?: EverydayFinancialYearReportStore,
  generatedAt = new Date(),
): Promise<EverydayFinancialYearReport> {
  const user = requireAuthenticatedUserContext(context);
  const financialYear = parseFinancialYearBeforeStoreAccess(endingYear);
  if (Number.isNaN(generatedAt.getTime())) {
    throw new EverydayFinancialYearReportError(
      "The report generation time is invalid.",
      "GENERATED_AT_INVALID",
    );
  }
  const reportStore = store ?? createPrismaEverydayFinancialYearReportStore();

  const [transactions, analyticalLoanRepaymentCount] = await Promise.all([
    reportStore.listEligibleTransactions(user.userId, financialYear.start, financialYear.end),
    reportStore.countLinkedAnalyticalLoanRepayments(user.userId, financialYear.start, financialYear.end),
  ]);

  return buildEverydayFinancialYearReport(
    user.userId,
    transactions.map((record) => toReportRecord(user.userId, record)),
    financialYear.endingYear,
    {
      sourceMode: "ELIGIBLE_ONLY",
      generatedAt,
      analyticalLoanRepaymentCount,
    },
  );
}
