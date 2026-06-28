import { Prisma, type PrismaClient } from "@prisma/client";
import {
  loanRepaymentArchiveSchema,
  type LoanRepaymentArchiveInput,
  type SafeLoanRepayment,
} from "@/lib/loan-repayment-history";
import { auditEventSchema } from "@/lib/validation/audit";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { OwnershipError, requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

type StoredLinkedTransaction = {
  id: string;
  userId: string;
  date: Date;
  amountCents: number;
  status: string;
  splitRole: string;
  deletedAt: Date | null;
};

export type StoredLoanRepayment = {
  id: string;
  userId: string;
  loanAccountId: string;
  repaymentDate: Date;
  totalPaymentCents: number;
  principalCents: number | null;
  interestCents: number | null;
  feeCents: number | null;
  balanceAfterCents: number | null;
  source: string;
  reconciliationStatus: string;
  isArchived: boolean;
  deletedAt: Date | null;
  reconciliationLink: null | {
    unlinkedAt: Date | null;
    transaction: StoredLinkedTransaction;
  };
};

export type LoanRepaymentHistoryStore = {
  listRepayments(userId: string): Promise<StoredLoanRepayment[]>;
  findRepayment(userId: string, repaymentId: string): Promise<StoredLoanRepayment | null>;
  updateArchiveState(userId: string, repaymentId: string, isArchived: boolean, archivedAt: Date | null): Promise<StoredLoanRepayment>;
};

export class LoanRepaymentArchiveConflictError extends Error {
  constructor() {
    super("Unlink this repayment from its everyday transaction before archiving it.");
    this.name = "LoanRepaymentArchiveConflictError";
  }
}

const repaymentSelect = {
  id: true,
  userId: true,
  loanAccountId: true,
  repaymentDate: true,
  totalPaymentCents: true,
  principalCents: true,
  interestCents: true,
  feeCents: true,
  balanceAfterCents: true,
  source: true,
  reconciliationStatus: true,
  isArchived: true,
  deletedAt: true,
  reconciliationLink: {
    select: {
      unlinkedAt: true,
      transaction: {
        select: { id: true, userId: true, date: true, amountCents: true, status: true, splitRole: true, deletedAt: true },
      },
    },
  },
} satisfies Prisma.LoanRepaymentSelect;

export function createPrismaLoanRepaymentHistoryStore(prisma: PrismaClient = getPrismaClient()): LoanRepaymentHistoryStore {
  return {
    async listRepayments(userId) {
      return prisma.loanRepayment.findMany({
        where: { userId, deletedAt: null },
        orderBy: [{ repaymentDate: "desc" }, { createdAt: "desc" }],
        select: repaymentSelect,
      });
    },
    async findRepayment(userId, repaymentId) {
      return prisma.loanRepayment.findFirst({ where: { id: repaymentId, userId, deletedAt: null }, select: repaymentSelect });
    },
    async updateArchiveState(userId, repaymentId, isArchived, archivedAt) {
      return prisma.$transaction(async (tx) => {
        const updated = await tx.loanRepayment.update({
          where: { id: repaymentId, userId },
          data: { isArchived, archivedAt },
          select: repaymentSelect,
        });
        const audit = {
          userId,
          entityType: "LOAN_REPAYMENT" as const,
          entityId: repaymentId,
          action: isArchived ? "ARCHIVED" as const : "UPDATED" as const,
          metadata: { stateCode: isArchived ? "ARCHIVED" : "ACTIVE" },
        };
        auditEventSchema.parse(audit);
        await tx.auditEvent.create({ data: audit });
        return updated;
      });
    },
  };
}

function safeRepayment(userId: string, repayment: StoredLoanRepayment): SafeLoanRepayment {
  const link = repayment.reconciliationLink;
  const transaction = link?.unlinkedAt === null ? link.transaction : null;
  const eligibleLinkedTransaction = transaction
    && transaction.userId === userId
    && transaction.status === "ACTIVE"
    && transaction.deletedAt === null
    && transaction.splitRole !== "PARENT"
    ? transaction
    : null;

  return {
    id: repayment.id,
    loanAccountId: repayment.loanAccountId,
    repaymentDate: repayment.repaymentDate.toISOString().slice(0, 10),
    totalPaymentCents: repayment.totalPaymentCents,
    principalCents: repayment.principalCents,
    interestCents: repayment.interestCents,
    feeCents: repayment.feeCents,
    balanceAfterCents: repayment.balanceAfterCents,
    source: repayment.source === "MANUAL" ? "MANUAL" : "LOAN_CSV",
    reconciliationStatus: eligibleLinkedTransaction
      ? "LINKED"
      : repayment.reconciliationStatus === "NEEDS_REVIEW" ? "NEEDS_REVIEW" : "UNMATCHED",
    isArchived: repayment.isArchived,
    linkedTransaction: eligibleLinkedTransaction ? {
      transactionId: eligibleLinkedTransaction.id,
      date: eligibleLinkedTransaction.date.toISOString().slice(0, 10),
      amountCents: eligibleLinkedTransaction.amountCents,
    } : null,
  };
}

export async function listSafeLoanRepayments(
  context: AuthenticatedUserContext | null | undefined,
  store: LoanRepaymentHistoryStore = createPrismaLoanRepaymentHistoryStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  const repayments = await store.listRepayments(user.userId);
  return repayments.filter((repayment) => repayment.userId === user.userId && repayment.deletedAt === null).map((repayment) => safeRepayment(user.userId, repayment));
}

export async function updateLoanRepaymentArchiveState(
  context: AuthenticatedUserContext | null | undefined,
  repaymentId: string,
  input: LoanRepaymentArchiveInput,
  store: LoanRepaymentHistoryStore = createPrismaLoanRepaymentHistoryStore(),
  now = new Date(),
) {
  const user = requireAuthenticatedUserContext(context);
  const parsed = loanRepaymentArchiveSchema.parse(input);
  const repayment = await store.findRepayment(user.userId, repaymentId);
  if (!repayment || repayment.userId !== user.userId) throw new OwnershipError("loan repayment");
  if (parsed.isArchived && repayment.reconciliationLink?.unlinkedAt === null) throw new LoanRepaymentArchiveConflictError();
  const updated = await store.updateArchiveState(user.userId, repayment.id, parsed.isArchived, parsed.isArchived ? now : null);
  return safeRepayment(user.userId, updated);
}
