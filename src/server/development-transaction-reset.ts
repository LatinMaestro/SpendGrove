import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { DEVELOPMENT_TRANSACTION_RESET_CONFIRMATION } from "@/lib/development-testing";
import { auditEventSchema } from "@/lib/validation/audit";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

export const developmentTransactionResetRequestSchema = z.object({
  confirmation: z.literal(DEVELOPMENT_TRANSACTION_RESET_CONFIRMATION),
}).strict();

export type DevelopmentTransactionResetSummary = {
  transactionsDeleted: number;
  loanLinksDetached: number;
  propertyLinksDetached: number;
};

export type DevelopmentTransactionResetStore = {
  reset(userId: string, now: Date): Promise<DevelopmentTransactionResetSummary>;
};

export function createDevelopmentTransactionResetAuditEvent(
  userId: string,
  summary: DevelopmentTransactionResetSummary,
) {
  const audit = {
    userId,
    entityType: "TRANSACTION" as const,
    action: "DELETED" as const,
    metadata: {
      reasonCode: "DEVELOPMENT_TEST_RESET",
      transactionCount: summary.transactionsDeleted,
      loanLinkCount: summary.loanLinksDetached,
      propertyLinkCount: summary.propertyLinksDetached,
    },
  };
  auditEventSchema.parse(audit);
  return audit;
}

export function createPrismaDevelopmentTransactionResetStore(
  prisma: PrismaClient = getPrismaClient(),
): DevelopmentTransactionResetStore {
  return {
    async reset(userId, now) {
      return prisma.$transaction(async (tx) => {
        const transactions = await tx.transaction.findMany({
          where: { userId, deletedAt: null, status: { not: "DELETED" } },
          select: { id: true },
        });
        const transactionIds = transactions.map((transaction) => transaction.id);

        if (transactionIds.length === 0) {
          return { transactionsDeleted: 0, loanLinksDetached: 0, propertyLinksDetached: 0 };
        }

        const activeLoanLinks = await tx.loanReconciliationLink.findMany({
          where: { userId, transactionId: { in: transactionIds }, unlinkedAt: null },
          select: { id: true, loanRepaymentId: true },
        });
        const loanLinkIds = activeLoanLinks.map((link) => link.id);
        const repaymentIds = [...new Set(activeLoanLinks.map((link) => link.loanRepaymentId))];

        const loanLinks = await tx.loanReconciliationLink.updateMany({
          where: { id: { in: loanLinkIds }, userId, unlinkedAt: null },
          data: { unlinkedAt: now },
        });

        if (repaymentIds.length > 0) {
          await tx.loanRepayment.updateMany({
            where: { id: { in: repaymentIds }, userId, deletedAt: null },
            data: { reconciliationStatus: "UNMATCHED" },
          });
        }

        const propertyLinks = await tx.propertyTransactionLink.updateMany({
          where: { userId, transactionId: { in: transactionIds }, unlinkedAt: null },
          data: { unlinkedAt: now },
        });

        const deletedTransactions = await tx.transaction.updateMany({
          where: { id: { in: transactionIds }, userId, deletedAt: null, status: { not: "DELETED" } },
          data: { status: "DELETED", deletedAt: now },
        });

        const summary = {
          transactionsDeleted: deletedTransactions.count,
          loanLinksDetached: loanLinks.count,
          propertyLinksDetached: propertyLinks.count,
        };

        await tx.auditEvent.create({ data: createDevelopmentTransactionResetAuditEvent(userId, summary) });
        return summary;
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 30_000,
      });
    },
  };
}

export async function resetTransactionsForDevelopment(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  store: DevelopmentTransactionResetStore = createPrismaDevelopmentTransactionResetStore(),
  now = new Date(),
) {
  const user = requireAuthenticatedUserContext(context);
  developmentTransactionResetRequestSchema.parse(input);
  return store.reset(user.userId, now);
}
