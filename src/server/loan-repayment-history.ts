import { Prisma, type PrismaClient } from "@prisma/client";
import {
  loanRepaymentArchiveSchema,
  loanRepaymentCorrectionSchema,
  type LoanRepaymentArchiveInput,
  type LoanRepaymentCorrectionInput,
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
  importBatchId: string | null;
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
  updatedAt: Date;
  reconciliationLink: null | {
    unlinkedAt: Date | null;
    transaction: StoredLinkedTransaction;
  };
};

export type LoanRepaymentHistoryStore = {
  listRepayments(userId: string): Promise<StoredLoanRepayment[]>;
  findRepayment(userId: string, repaymentId: string): Promise<StoredLoanRepayment | null>;
  isActiveLoanAccount(userId: string, loanAccountId: string): Promise<boolean>;
  updateArchiveState(userId: string, repaymentId: string, isArchived: boolean, archivedAt: Date | null): Promise<StoredLoanRepayment>;
  correctRepayment(
    userId: string,
    repaymentId: string,
    input: LoanRepaymentCorrectionInput,
    changedFieldCodes: LoanRepaymentChangedFieldCode[],
    now: Date,
  ): Promise<StoredLoanRepayment>;
};

export type LoanRepaymentChangedFieldCode =
  | "REPAYMENT_DATE"
  | "TOTAL_PAYMENT"
  | "PRINCIPAL"
  | "INTEREST"
  | "FEES"
  | "BALANCE_AFTER";

export class LoanRepaymentArchiveConflictError extends Error {
  constructor() {
    super("Unlink this repayment from its everyday transaction before archiving it.");
    this.name = "LoanRepaymentArchiveConflictError";
  }
}

export class LoanRepaymentCorrectionConflictError extends Error {
  constructor() {
    super("That repayment changed. Refresh it before saving your correction.");
    this.name = "LoanRepaymentCorrectionConflictError";
  }
}

export class LoanRepaymentCorrectionStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoanRepaymentCorrectionStateError";
  }
}

export class LoanRepaymentCorrectionNoChangesError extends Error {
  constructor() {
    super("Change at least one repayment field before saving.");
    this.name = "LoanRepaymentCorrectionNoChangesError";
  }
}

export function createLoanRepaymentArchiveAuditEvent(userId: string, repaymentId: string, isArchived: boolean) {
  const audit = {
    userId,
    entityType: "LOAN_REPAYMENT" as const,
    entityId: repaymentId,
    action: isArchived ? "ARCHIVED" as const : "UPDATED" as const,
    metadata: { stateCode: isArchived ? "ARCHIVED" : "ACTIVE" },
  };
  auditEventSchema.parse(audit);
  return audit;
}

export function createLoanRepaymentCorrectionAuditEvent(
  userId: string,
  repaymentId: string,
  changedFieldCodes: LoanRepaymentChangedFieldCode[],
) {
  const audit = {
    userId,
    entityType: "LOAN_REPAYMENT" as const,
    entityId: repaymentId,
    action: "UPDATED" as const,
    metadata: { stateCode: "CORRECTED", changedFieldCodes },
  };
  auditEventSchema.parse(audit);
  return audit;
}

const repaymentSelect = {
  id: true,
  userId: true,
  loanAccountId: true,
  importBatchId: true,
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
  updatedAt: true,
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
    async isActiveLoanAccount(userId, loanAccountId) {
      return Boolean(await prisma.loanAccount.findFirst({
        where: { id: loanAccountId, userId, isArchived: false, deletedAt: null },
        select: { id: true },
      }));
    },
    async updateArchiveState(userId, repaymentId, isArchived, archivedAt) {
      return prisma.$transaction(async (tx) => {
        const updated = await tx.loanRepayment.update({
          where: { id: repaymentId, userId },
          data: { isArchived, archivedAt },
          select: repaymentSelect,
        });
        const audit = createLoanRepaymentArchiveAuditEvent(userId, repaymentId, isArchived);
        await tx.auditEvent.create({ data: audit });
        return updated;
      });
    },
    async correctRepayment(userId, repaymentId, input, changedFieldCodes, now) {
      try {
        return await prisma.$transaction(async (tx) => {
          const repayment = await tx.loanRepayment.findFirst({
            where: { id: repaymentId, userId, deletedAt: null },
            select: repaymentSelect,
          });
          if (!repayment || repayment.userId !== userId) throw new OwnershipError("loan repayment");
          if (repayment.isArchived) throw new LoanRepaymentCorrectionStateError("Restore this repayment before editing it.");
          if (repayment.reconciliationStatus !== "UNMATCHED") throw new LoanRepaymentCorrectionStateError("This repayment must be unmatched before editing it.");
          if (repayment.reconciliationLink?.unlinkedAt === null) {
            throw new LoanRepaymentCorrectionStateError("Unlink this repayment before editing its date or amounts.");
          }
          if (repayment.updatedAt.toISOString() !== input.expectedUpdatedAt) throw new LoanRepaymentCorrectionConflictError();
          const loan = await tx.loanAccount.findFirst({
            where: { id: repayment.loanAccountId, userId, isArchived: false, deletedAt: null },
            select: { id: true },
          });
          if (!loan) throw new LoanRepaymentCorrectionStateError("Restore the owning Loan Account before editing this repayment.");

          const corrected = await tx.loanRepayment.update({
            where: { id: repayment.id, userId, updatedAt: repayment.updatedAt, isArchived: false, deletedAt: null },
            data: {
              repaymentDate: dateOnlyToUtcDate(input.repayment.repaymentDate),
              totalPaymentCents: input.repayment.totalPaymentCents,
              principalCents: input.repayment.principalCents,
              interestCents: input.repayment.interestCents,
              feeCents: input.repayment.feeCents,
              balanceAfterCents: input.repayment.balanceAfterCents,
              reconciliationStatus: "UNMATCHED",
              updatedAt: now,
            },
            select: repaymentSelect,
          });
          const audit = createLoanRepaymentCorrectionAuditEvent(userId, repayment.id, changedFieldCodes);
          await tx.auditEvent.create({ data: audit });
          return corrected;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 30_000 });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2025" || error.code === "P2034")) {
          throw new LoanRepaymentCorrectionConflictError();
        }
        throw error;
      }
    },
  };
}

function dateOnlyToUtcDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Choose a valid repayment date.");
  }
  return date;
}

export function changedRepaymentFieldCodes(
  repayment: StoredLoanRepayment,
  correction: LoanRepaymentCorrectionInput["repayment"],
): LoanRepaymentChangedFieldCode[] {
  const changed: LoanRepaymentChangedFieldCode[] = [];
  if (repayment.repaymentDate.toISOString().slice(0, 10) !== correction.repaymentDate) changed.push("REPAYMENT_DATE");
  if (repayment.totalPaymentCents !== correction.totalPaymentCents) changed.push("TOTAL_PAYMENT");
  if (repayment.principalCents !== correction.principalCents) changed.push("PRINCIPAL");
  if (repayment.interestCents !== correction.interestCents) changed.push("INTEREST");
  if (repayment.feeCents !== correction.feeCents) changed.push("FEES");
  if (repayment.balanceAfterCents !== correction.balanceAfterCents) changed.push("BALANCE_AFTER");
  return changed;
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
    updatedAt: repayment.updatedAt.toISOString(),
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

export async function correctLoanRepayment(
  context: AuthenticatedUserContext | null | undefined,
  repaymentId: string,
  input: LoanRepaymentCorrectionInput,
  store: LoanRepaymentHistoryStore = createPrismaLoanRepaymentHistoryStore(),
  now = new Date(),
) {
  const user = requireAuthenticatedUserContext(context);
  const parsed = loanRepaymentCorrectionSchema.parse(input);
  const repayment = await store.findRepayment(user.userId, repaymentId);
  if (!repayment || repayment.userId !== user.userId) throw new OwnershipError("loan repayment");
  if (repayment.isArchived) throw new LoanRepaymentCorrectionStateError("Restore this repayment before editing it.");
  if (repayment.reconciliationStatus !== "UNMATCHED") throw new LoanRepaymentCorrectionStateError("This repayment must be unmatched before editing it.");
  if (repayment.reconciliationLink?.unlinkedAt === null) {
    throw new LoanRepaymentCorrectionStateError("Unlink this repayment before editing its date or amounts.");
  }
  if (!await store.isActiveLoanAccount(user.userId, repayment.loanAccountId)) {
    throw new LoanRepaymentCorrectionStateError("Restore the owning Loan Account before editing this repayment.");
  }
  if (repayment.updatedAt.toISOString() !== parsed.expectedUpdatedAt) throw new LoanRepaymentCorrectionConflictError();
  const changedFieldCodes = changedRepaymentFieldCodes(repayment, parsed.repayment);
  if (changedFieldCodes.length === 0) throw new LoanRepaymentCorrectionNoChangesError();
  const corrected = await store.correctRepayment(user.userId, repayment.id, parsed, changedFieldCodes, now);
  return safeRepayment(user.userId, corrected);
}
