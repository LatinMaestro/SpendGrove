import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import {
  loanRepaymentCommitRequestSchema,
  type LoanRepaymentCommitRequest,
  type LoanRepaymentCommitSummary,
  type SafeLoanImportHistoryEntry,
} from "@/lib/loan-repayment-commit";
import { auditEventSchema } from "@/lib/validation/audit";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { OwnershipError, requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

export class LoanRepaymentCommitConflictError extends Error {
  constructor() {
    super("This reviewed loan import is already being saved. Refresh before trying again.");
    this.name = "LoanRepaymentCommitConflictError";
  }
}

type StoredLoanImportBatch = {
  id: string;
  userId: string;
  type: string;
  status: string;
  rowCount: number;
  importedCount: number;
  skippedCount: number;
  createdAt: Date;
  completedAt: Date | null;
  loanAccountIds?: string[];
};

export type LoanRepaymentStore = {
  commit(userId: string, request: LoanRepaymentCommitRequest, now: Date): Promise<LoanRepaymentCommitSummary>;
  listImports(userId: string, limit: number): Promise<StoredLoanImportBatch[]>;
};

function summaryFromBatch(batch: StoredLoanImportBatch, alreadyCommitted: boolean): LoanRepaymentCommitSummary {
  return {
    batchId: batch.id,
    totalCount: batch.rowCount,
    savedCount: batch.importedCount,
    excludedCount: batch.skippedCount,
    alreadyCommitted,
  };
}

function dateOnlyToUtcDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("A reviewed repayment contains an invalid date.");
  }
  return date;
}

export function createPrismaLoanRepaymentStore(prisma: PrismaClient = getPrismaClient()): LoanRepaymentStore {
  return {
    async commit(userId, request, now) {
      const existing = await prisma.importBatch.findUnique({
        where: { id: request.requestId },
        select: {
          id: true, userId: true, type: true, status: true, rowCount: true, importedCount: true,
          skippedCount: true, createdAt: true, completedAt: true,
          loanRepayments: { select: { loanAccountId: true }, take: 1 },
        },
      });
      if (existing) {
        if (existing.userId !== userId) throw new OwnershipError("loan import batch");
        if (existing.type !== "LOAN_CSV" || existing.status !== "COMPLETED") throw new LoanRepaymentCommitConflictError();
        if (existing.loanRepayments[0]?.loanAccountId !== request.loanAccountId) throw new LoanRepaymentCommitConflictError();
        return summaryFromBatch(existing, true);
      }

      try {
        return await prisma.$transaction(async (tx) => {
          const loan = await tx.loanAccount.findFirst({
            where: { id: request.loanAccountId, userId, isArchived: false, deletedAt: null },
            select: { id: true },
          });
          if (!loan) throw new OwnershipError("active loan account");

          const batch = await tx.importBatch.create({
            data: {
              id: request.requestId,
              userId,
              type: "LOAN_CSV",
              status: "COMPLETED",
              rowCount: request.reviewedRowCount,
              parsedRowCount: request.reviewedRowCount,
              privateFieldCount: request.privateFieldCount,
              importedCount: request.rows.length,
              skippedCount: request.excludedRowCount,
              completedAt: now,
            },
          });

          await tx.loanRepayment.createMany({
            data: request.rows.map((row) => ({
              id: randomUUID(),
              userId,
              loanAccountId: loan.id,
              importBatchId: batch.id,
              repaymentDate: dateOnlyToUtcDate(row.repaymentDate),
              totalPaymentCents: row.totalPaymentCents,
              principalCents: row.principalCents,
              interestCents: row.interestCents,
              feeCents: row.feeCents,
              balanceAfterCents: row.balanceAfterCents,
              source: "LOAN_CSV",
              reconciliationStatus: "UNMATCHED",
            })),
          });

          const auditMetadata = {
            totalCount: request.reviewedRowCount,
            savedCount: request.rows.length,
            excludedCount: request.excludedRowCount,
            privateFieldCount: request.privateFieldCount,
          } satisfies Prisma.InputJsonObject;
          auditEventSchema.parse({
            userId,
            entityType: "IMPORT_BATCH",
            entityId: batch.id,
            action: "IMPORTED",
            metadata: auditMetadata,
          });
          await tx.auditEvent.create({ data: { userId, entityType: "IMPORT_BATCH", entityId: batch.id, action: "IMPORTED", metadata: auditMetadata } });

          return summaryFromBatch(batch, false);
        }, { maxWait: 10_000, timeout: 30_000 });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const committed = await prisma.importBatch.findFirst({
            where: { id: request.requestId, userId, type: "LOAN_CSV", status: "COMPLETED" },
            select: {
              id: true, userId: true, type: true, status: true, rowCount: true, importedCount: true,
              skippedCount: true, createdAt: true, completedAt: true,
              loanRepayments: { select: { loanAccountId: true }, take: 1 },
            },
          });
          if (committed?.loanRepayments[0]?.loanAccountId === request.loanAccountId) return summaryFromBatch(committed, true);
          throw new LoanRepaymentCommitConflictError();
        }
        throw error;
      }
    },
    async listImports(userId, limit) {
      return prisma.importBatch.findMany({
        where: { userId, type: "LOAN_CSV", status: "COMPLETED", deletedAt: null },
        orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
        select: { id: true, userId: true, type: true, status: true, rowCount: true, importedCount: true, skippedCount: true, createdAt: true, completedAt: true },
      });
    },
  };
}

export async function commitReviewedLoanRepayments(
  context: AuthenticatedUserContext | null | undefined,
  input: LoanRepaymentCommitRequest,
  store: LoanRepaymentStore = createPrismaLoanRepaymentStore(),
  now = new Date(),
) {
  const user = requireAuthenticatedUserContext(context);
  const request = loanRepaymentCommitRequestSchema.parse(input);
  return store.commit(user.userId, request, now);
}

export async function listSafeLoanImportHistory(
  context: AuthenticatedUserContext | null | undefined,
  store: LoanRepaymentStore = createPrismaLoanRepaymentStore(),
  limit = 10,
): Promise<SafeLoanImportHistoryEntry[]> {
  const user = requireAuthenticatedUserContext(context);
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const batches = await store.listImports(user.userId, safeLimit);
  return batches
    .filter((batch) => batch.userId === user.userId && batch.type === "LOAN_CSV" && batch.status === "COMPLETED")
    .map((batch) => ({
      completedAt: (batch.completedAt ?? batch.createdAt).toISOString(),
      reviewedCount: Math.max(0, batch.rowCount),
      savedCount: Math.max(0, batch.importedCount),
      excludedCount: Math.max(0, batch.skippedCount),
    }));
}
