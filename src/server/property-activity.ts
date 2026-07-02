import type { LoanPurpose, LoanType, PrismaClient, PropertyUsage, TransactionType } from "@prisma/client";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { OwnershipError, requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

export type SafePropertyActivityTransaction = {
  id: string;
  date: string;
  amountCents: number;
  type: TransactionType;
  merchantName: string | null;
  categoryName: string | null;
};

export type SafePropertyActivityLoan = {
  id: string;
  nickname: string;
  type: LoanType;
  purpose: LoanPurpose;
  isArchived: boolean;
};

export type SafePropertyActivityLoanTransaction = SafePropertyActivityTransaction & {
  loanAccounts: Array<{ id: string; nickname: string }>;
};

export type SafePropertyActivity = {
  property: {
    id: string;
    nickname: string;
    usage: PropertyUsage;
    isArchived: boolean;
  };
  transactions: SafePropertyActivityTransaction[];
  loanTransactions: SafePropertyActivityLoanTransaction[];
  loans: SafePropertyActivityLoan[];
};

export type PropertyActivityStore = {
  read(userId: string, propertyId: string): Promise<SafePropertyActivity>;
};

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function createPrismaPropertyActivityStore(
  prisma: PrismaClient = getPrismaClient(),
): PropertyActivityStore {
  return {
    async read(userId, propertyId) {
      const property = await prisma.property.findFirst({
        where: { id: propertyId, userId, deletedAt: null },
        select: { id: true, userId: true, nickname: true, usage: true, isArchived: true },
      });
      if (!property || property.userId !== userId) throw new OwnershipError("Property");

      const [links, loanLinks, loans] = await Promise.all([
        prisma.propertyTransactionLink.findMany({
          where: {
            userId,
            propertyId,
            unlinkedAt: null,
            transaction: {
              userId,
              status: "ACTIVE",
              deletedAt: null,
              splitRole: { not: "PARENT" },
            },
          },
          select: {
            transaction: {
              select: {
                id: true,
                userId: true,
                date: true,
                amountCents: true,
                type: true,
                merchantName: true,
                category: { select: { name: true } },
              },
            },
          },
          orderBy: { transaction: { date: "desc" } },
        }),
        prisma.loanReconciliationLink.findMany({
          where: {
            userId,
            unlinkedAt: null,
            loanRepayment: {
              userId,
              isArchived: false,
              deletedAt: null,
              loanAccount: { userId, propertyId, isArchived: false, deletedAt: null },
            },
            transaction: {
              userId,
              status: "ACTIVE",
              deletedAt: null,
              splitRole: { not: "PARENT" },
            },
          },
          select: {
            userId: true,
            transaction: {
              select: {
                id: true,
                userId: true,
                date: true,
                amountCents: true,
                type: true,
                merchantName: true,
                category: { select: { name: true } },
              },
            },
            loanRepayment: {
              select: {
                userId: true,
                loanAccount: { select: { id: true, userId: true, nickname: true } },
              },
            },
          },
          orderBy: { transaction: { date: "desc" } },
        }),
        prisma.loanAccount.findMany({
          where: { userId, propertyId, deletedAt: null },
          select: { id: true, userId: true, nickname: true, type: true, purpose: true, isArchived: true },
          orderBy: [{ isArchived: "asc" }, { nickname: "asc" }],
        }),
      ]);

      if (
        links.some((link) => link.transaction.userId !== userId)
        || loanLinks.some((link) =>
          link.userId !== userId
          || link.transaction.userId !== userId
          || link.loanRepayment.userId !== userId
          || link.loanRepayment.loanAccount.userId !== userId
        )
        || loans.some((loan) => loan.userId !== userId)
      ) {
        throw new OwnershipError("Property activity");
      }

      const loanTransactionsById = new Map<string, SafePropertyActivityLoanTransaction>();
      for (const link of loanLinks) {
        const existing = loanTransactionsById.get(link.transaction.id);
        const loanAccount = {
          id: link.loanRepayment.loanAccount.id,
          nickname: link.loanRepayment.loanAccount.nickname,
        };
        if (existing) {
          if (!existing.loanAccounts.some((loan) => loan.id === loanAccount.id)) existing.loanAccounts.push(loanAccount);
          continue;
        }
        loanTransactionsById.set(link.transaction.id, {
          id: link.transaction.id,
          date: dateOnly(link.transaction.date),
          amountCents: link.transaction.amountCents,
          type: link.transaction.type,
          merchantName: link.transaction.merchantName,
          categoryName: link.transaction.category?.name ?? null,
          loanAccounts: [loanAccount],
        });
      }

      return {
        property: {
          id: property.id,
          nickname: property.nickname,
          usage: property.usage,
          isArchived: property.isArchived,
        },
        transactions: links.map(({ transaction }) => ({
          id: transaction.id,
          date: dateOnly(transaction.date),
          amountCents: transaction.amountCents,
          type: transaction.type,
          merchantName: transaction.merchantName,
          categoryName: transaction.category?.name ?? null,
        })),
        loanTransactions: [...loanTransactionsById.values()],
        loans: loans.map((loan) => ({
          id: loan.id,
          nickname: loan.nickname,
          type: loan.type,
          purpose: loan.purpose,
          isArchived: loan.isArchived,
        })),
      };
    },
  };
}

export async function getPropertyActivity(
  context: AuthenticatedUserContext | null | undefined,
  propertyId: string,
  store: PropertyActivityStore = createPrismaPropertyActivityStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  return store.read(user.userId, propertyId);
}
