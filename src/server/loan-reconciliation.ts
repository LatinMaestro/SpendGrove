import type { PrismaClient } from "@prisma/client";
import {
  scoreReconciliationCandidate,
  type LoanReconciliationCandidate,
  type ReconciliationCandidateMode,
} from "@/lib/loan-reconciliation";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { OwnershipError, requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

type CandidateRepayment = {
  id: string;
  userId: string;
  repaymentDate: Date;
  totalPaymentCents: number;
  isArchived: boolean;
  deletedAt: Date | null;
  reconciliationLink: { unlinkedAt: Date | null } | null;
};

type CandidateTransaction = {
  id: string;
  userId: string;
  date: Date;
  amountCents: number;
  status: string;
  splitRole: string;
  deletedAt: Date | null;
  loanReconciliationLinks: Array<{
    unlinkedAt: Date | null;
    loanRepayment: { userId: string; totalPaymentCents: number; isArchived: boolean; deletedAt: Date | null };
  }>;
};

export type LoanReconciliationCandidateStore = {
  findRepayment(userId: string, repaymentId: string): Promise<CandidateRepayment | null>;
  listTransactions(userId: string, dateFrom: Date, dateTo: Date): Promise<CandidateTransaction[]>;
};

export function createPrismaLoanReconciliationCandidateStore(prisma: PrismaClient = getPrismaClient()): LoanReconciliationCandidateStore {
  return {
    async findRepayment(userId, repaymentId) {
      return prisma.loanRepayment.findFirst({
        where: { id: repaymentId, userId, deletedAt: null },
        select: { id: true, userId: true, repaymentDate: true, totalPaymentCents: true, isArchived: true, deletedAt: true, reconciliationLink: { select: { unlinkedAt: true } } },
      });
    },
    async listTransactions(userId, dateFrom, dateTo) {
      return prisma.transaction.findMany({
        where: {
          userId,
          status: "ACTIVE",
          deletedAt: null,
          splitRole: { not: "PARENT" },
          amountCents: { not: 0 },
          date: { gte: dateFrom, lte: dateTo },
        },
        orderBy: [{ date: "desc" }, { id: "asc" }],
        select: {
          id: true, userId: true, date: true, amountCents: true, status: true, splitRole: true, deletedAt: true,
          loanReconciliationLinks: {
            where: { unlinkedAt: null },
            select: { unlinkedAt: true, loanRepayment: { select: { userId: true, totalPaymentCents: true, isArchived: true, deletedAt: true } } },
          },
        },
      });
    },
  };
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function listLoanReconciliationCandidates(
  context: AuthenticatedUserContext | null | undefined,
  repaymentId: string,
  mode: ReconciliationCandidateMode,
  store: LoanReconciliationCandidateStore = createPrismaLoanReconciliationCandidateStore(),
): Promise<LoanReconciliationCandidate[]> {
  const user = requireAuthenticatedUserContext(context);
  const repayment = await store.findRepayment(user.userId, repaymentId);
  if (!repayment || repayment.userId !== user.userId) throw new OwnershipError("loan repayment");
  if (repayment.isArchived || repayment.deletedAt || repayment.reconciliationLink?.unlinkedAt === null) return [];

  const dateFrom = new Date(repayment.repaymentDate);
  dateFrom.setUTCDate(dateFrom.getUTCDate() - 7);
  const dateTo = new Date(repayment.repaymentDate);
  dateTo.setUTCDate(dateTo.getUTCDate() + 7);
  const transactions = await store.listTransactions(user.userId, dateFrom, dateTo);

  const candidates = transactions.flatMap((transaction) => {
    if (transaction.userId !== user.userId || transaction.status !== "ACTIVE" || transaction.deletedAt || transaction.splitRole === "PARENT" || transaction.amountCents === 0) return [];
    const existingAllocationCents = transaction.loanReconciliationLinks.reduce((sum, link) => {
      const linked = link.loanRepayment;
      if (link.unlinkedAt || linked.userId !== user.userId || linked.isArchived || linked.deletedAt) return sum;
      return sum + linked.totalPaymentCents;
    }, 0);
    const candidate = scoreReconciliationCandidate({
      repaymentTotalCents: repayment.totalPaymentCents,
      repaymentDate: dateOnly(repayment.repaymentDate),
      transactionId: transaction.id,
      transactionDate: dateOnly(transaction.date),
      transactionAmountCents: transaction.amountCents,
      existingAllocationCents,
      mode,
    });
    return candidate ? [candidate] : [];
  });

  const confidenceOrder = { HIGH: 0, MEDIUM: 1, MANUAL: 2 } as const;
  return candidates.sort((left, right) =>
    confidenceOrder[left.confidence] - confidenceOrder[right.confidence]
    || Math.abs(left.amountVarianceCents) - Math.abs(right.amountVarianceCents)
    || left.dateDifferenceDays - right.dateDifferenceDays
    || left.transactionId.localeCompare(right.transactionId),
  );
}
