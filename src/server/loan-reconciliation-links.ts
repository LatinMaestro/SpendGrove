import { Prisma, type PrismaClient } from "@prisma/client";
import {
  reconciliationLinkRequestSchema,
  resolveReconciliationLinkDecision,
  type ReconciliationLinkRequest,
  type SafeReconciliationLink,
} from "@/lib/loan-reconciliation";
import { auditEventSchema } from "@/lib/validation/audit";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { OwnershipError, requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

export class LoanReconciliationConflictError extends Error {
  constructor(message = "That repayment or transaction changed. Refresh its matches and try again.") {
    super(message);
    this.name = "LoanReconciliationConflictError";
  }
}

export class LoanReconciliationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoanReconciliationValidationError";
  }
}

export type LoanReconciliationLinkStore = {
  link(userId: string, repaymentId: string, request: ReconciliationLinkRequest, now: Date): Promise<SafeReconciliationLink>;
  unlink(userId: string, repaymentId: string, now: Date): Promise<{ alreadyUnlinked: boolean }>;
};

export function createLoanReconciliationLinkAuditEvent(input: {
  userId: string;
  linkId: string;
  action: "CREATED" | "UPDATED";
  methodCode: SafeReconciliationLink["method"];
  confidenceCode: SafeReconciliationLink["confidence"];
  reasonCode: SafeReconciliationLink["reasonCode"];
}) {
  const audit = {
    userId: input.userId,
    entityType: "LOAN_RECONCILIATION_LINK" as const,
    entityId: input.linkId,
    action: input.action,
    metadata: {
      methodCode: input.methodCode,
      confidenceCode: input.confidenceCode,
      reasonCode: input.reasonCode,
    },
  };
  auditEventSchema.parse(audit);
  return audit;
}

export function createLoanReconciliationUnlinkAuditEvent(userId: string, linkId: string) {
  const audit = {
    userId,
    entityType: "LOAN_RECONCILIATION_LINK" as const,
    entityId: linkId,
    action: "UPDATED" as const,
    metadata: { stateCode: "UNLINKED" },
  };
  auditEventSchema.parse(audit);
  return audit;
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function createPrismaLoanReconciliationLinkStore(prisma: PrismaClient = getPrismaClient()): LoanReconciliationLinkStore {
  return {
    async link(userId, repaymentId, request, now) {
      try {
        return await prisma.$transaction(async (tx) => {
          const repayment = await tx.loanRepayment.findFirst({
            where: { id: repaymentId, userId, isArchived: false, deletedAt: null },
            select: {
              id: true, userId: true, repaymentDate: true, totalPaymentCents: true,
              reconciliationLink: { select: { id: true, unlinkedAt: true } },
            },
          });
          if (!repayment || repayment.userId !== userId) throw new OwnershipError("active loan repayment");
          if (repayment.reconciliationLink?.unlinkedAt === null) throw new LoanReconciliationConflictError("Unlink the current everyday transaction before choosing another one.");

          const transaction = await tx.transaction.findFirst({
            where: { id: request.transactionId, userId, status: "ACTIVE", deletedAt: null, splitRole: { not: "PARENT" }, amountCents: { not: 0 } },
            select: {
              id: true, userId: true, date: true, amountCents: true,
              loanReconciliationLinks: {
                where: { unlinkedAt: null, loanRepaymentId: { not: repayment.id } },
                select: {
                  unlinkedAt: true,
                  loanRepayment: { select: { userId: true, totalPaymentCents: true, isArchived: true, deletedAt: true } },
                },
              },
            },
          });
          if (!transaction || transaction.userId !== userId) throw new OwnershipError("eligible everyday transaction");

          const existingAllocationCents = transaction.loanReconciliationLinks.reduce((sum, link) => {
            const linked = link.loanRepayment;
            if (link.unlinkedAt || linked.userId !== userId || linked.isArchived || linked.deletedAt) return sum;
            return sum + linked.totalPaymentCents;
          }, 0);
          let decision: SafeReconciliationLink;
          try {
            decision = resolveReconciliationLinkDecision({
              repaymentTotalCents: repayment.totalPaymentCents,
              repaymentDate: dateOnly(repayment.repaymentDate),
              transactionId: transaction.id,
              transactionDate: dateOnly(transaction.date),
              transactionAmountCents: transaction.amountCents,
              existingAllocationCents,
              mode: request.selectionMode,
              selectionMode: request.selectionMode,
              mismatchConfirmed: request.mismatchConfirmed,
            });
          } catch (error) {
            throw new LoanReconciliationValidationError(error instanceof Error ? error.message : "Confirm this manual link before saving it.");
          }

          const link = await tx.loanReconciliationLink.upsert({
            where: { loanRepaymentId: repayment.id },
            create: {
              userId,
              loanRepaymentId: repayment.id,
              transactionId: transaction.id,
              confidence: decision.confidence,
              amountVarianceCents: decision.amountVarianceCents,
              dateDifferenceDays: decision.dateDifferenceDays,
              method: decision.method,
              reason: decision.reasonCode,
              unlinkedAt: null,
            },
            update: {
              transactionId: transaction.id,
              confidence: decision.confidence,
              amountVarianceCents: decision.amountVarianceCents,
              dateDifferenceDays: decision.dateDifferenceDays,
              method: decision.method,
              reason: decision.reasonCode,
              unlinkedAt: null,
            },
            select: { id: true },
          });
          await tx.loanRepayment.update({ where: { id: repayment.id }, data: { reconciliationStatus: "LINKED" } });

          const audit = createLoanReconciliationLinkAuditEvent({
            userId,
            linkId: link.id,
            action: repayment.reconciliationLink ? "UPDATED" : "CREATED",
            methodCode: decision.method,
            confidenceCode: decision.confidence,
            reasonCode: decision.reasonCode,
          });
          await tx.auditEvent.create({ data: audit });
          return decision;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 30_000 });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034")) {
          throw new LoanReconciliationConflictError();
        }
        throw error;
      }
    },
    async unlink(userId, repaymentId, now) {
      try {
        return await prisma.$transaction(async (tx) => {
          const repayment = await tx.loanRepayment.findFirst({
            where: { id: repaymentId, userId, deletedAt: null },
            select: { id: true, userId: true, reconciliationLink: { select: { id: true, userId: true, unlinkedAt: true } } },
          });
          if (!repayment || repayment.userId !== userId) throw new OwnershipError("loan repayment");
          const link = repayment.reconciliationLink;
          if (!link || link.unlinkedAt) {
            await tx.loanRepayment.update({ where: { id: repayment.id }, data: { reconciliationStatus: "UNMATCHED" } });
            return { alreadyUnlinked: true };
          }
          if (link.userId !== userId) throw new OwnershipError("reconciliation link");
          await tx.loanReconciliationLink.update({ where: { id: link.id }, data: { unlinkedAt: now } });
          await tx.loanRepayment.update({ where: { id: repayment.id }, data: { reconciliationStatus: "UNMATCHED" } });
          const audit = createLoanReconciliationUnlinkAuditEvent(userId, link.id);
          await tx.auditEvent.create({ data: audit });
          return { alreadyUnlinked: false };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 30_000 });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") throw new LoanReconciliationConflictError();
        throw error;
      }
    },
  };
}

export async function linkLoanRepayment(
  context: AuthenticatedUserContext | null | undefined,
  repaymentId: string,
  input: ReconciliationLinkRequest,
  store: LoanReconciliationLinkStore = createPrismaLoanReconciliationLinkStore(),
  now = new Date(),
) {
  const user = requireAuthenticatedUserContext(context);
  const request = reconciliationLinkRequestSchema.parse(input);
  return store.link(user.userId, repaymentId, request, now);
}

export async function unlinkLoanRepayment(
  context: AuthenticatedUserContext | null | undefined,
  repaymentId: string,
  store: LoanReconciliationLinkStore = createPrismaLoanReconciliationLinkStore(),
  now = new Date(),
) {
  const user = requireAuthenticatedUserContext(context);
  return store.unlink(user.userId, repaymentId, now);
}
