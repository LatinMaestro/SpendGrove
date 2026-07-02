import { Prisma, type PrismaClient } from "@prisma/client";
import {
  scoreReconciliationCandidate,
  type LoanReconciliationCandidate,
} from "@/lib/loan-reconciliation";
import { linkLoanRepaymentWithinTransaction } from "@/src/server/loan-reconciliation-links";

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function selectUniqueHighConfidenceCandidate(
  candidates: readonly LoanReconciliationCandidate[],
) {
  const highConfidence = candidates.filter((candidate) => candidate.confidence === "HIGH");
  return highConfidence.length === 1 ? highConfidence[0] : null;
}

async function listCurrentHighConfidenceCandidates(
  tx: Prisma.TransactionClient,
  userId: string,
  repaymentId: string,
) {
  const repayment = await tx.loanRepayment.findFirst({
    where: { id: repaymentId, userId, isArchived: false, deletedAt: null },
    select: {
      id: true,
      userId: true,
      repaymentDate: true,
      totalPaymentCents: true,
      reconciliationLink: { select: { unlinkedAt: true } },
    },
  });
  if (!repayment || repayment.userId !== userId || repayment.reconciliationLink?.unlinkedAt === null) return [];

  const dateFrom = new Date(repayment.repaymentDate);
  dateFrom.setUTCDate(dateFrom.getUTCDate() - 1);
  const dateTo = new Date(repayment.repaymentDate);
  dateTo.setUTCDate(dateTo.getUTCDate() + 1);
  const transactions = await tx.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      status: "ACTIVE",
      deletedAt: null,
      splitRole: { not: "PARENT" },
      amountCents: { not: 0 },
      date: { gte: dateFrom, lte: dateTo },
    },
    select: {
      id: true,
      userId: true,
      date: true,
      amountCents: true,
      status: true,
      splitRole: true,
      deletedAt: true,
      loanReconciliationLinks: {
        where: { unlinkedAt: null },
        select: {
          unlinkedAt: true,
          loanRepayment: {
            select: { userId: true, totalPaymentCents: true, isArchived: true, deletedAt: true },
          },
        },
      },
    },
  });

  return transactions.flatMap((transaction) => {
    if (
      transaction.userId !== userId
      || transaction.status !== "ACTIVE"
      || transaction.deletedAt
      || transaction.splitRole === "PARENT"
      || transaction.amountCents === 0
    ) return [];

    const existingAllocationCents = transaction.loanReconciliationLinks.reduce((sum, link) => {
      const linked = link.loanRepayment;
      if (link.unlinkedAt || linked.userId !== userId || linked.isArchived || linked.deletedAt) return sum;
      return sum + linked.totalPaymentCents;
    }, 0);
    const candidate = scoreReconciliationCandidate({
      repaymentTotalCents: repayment.totalPaymentCents,
      repaymentDate: dateOnly(repayment.repaymentDate),
      transactionId: transaction.id,
      transactionDate: dateOnly(transaction.date),
      transactionAmountCents: transaction.amountCents,
      existingAllocationCents,
      mode: "SUGGESTED",
    });
    return candidate?.confidence === "HIGH" ? [candidate] : [];
  });
}

export async function autoReconcileHighConfidenceRepayments(
  prisma: PrismaClient,
  userId: string,
  repaymentIds: readonly string[],
) {
  let linkedCount = 0;
  for (const repaymentId of repaymentIds) {
    try {
      const linked = await prisma.$transaction(async (tx) => {
        const candidates = await listCurrentHighConfidenceCandidates(tx, userId, repaymentId);
        const candidate = selectUniqueHighConfidenceCandidate(candidates);
        if (!candidate) return false;
        await linkLoanRepaymentWithinTransaction(tx, userId, repaymentId, {
          transactionId: candidate.transactionId,
          selectionMode: "SUGGESTED",
          mismatchConfirmed: false,
        }, "AUTO_HIGH_CONFIDENCE");
        return true;
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 30_000,
      });
      if (linked) linkedCount += 1;
    } catch {
      // A changed, ambiguous or unavailable candidate remains for the existing manual review flow.
      continue;
    }
  }
  return linkedCount;
}
