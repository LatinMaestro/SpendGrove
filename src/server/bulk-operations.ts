import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { auditEventSchema } from "@/lib/validation/audit";
import {
  isCategoryTypeCompatible,
  isTransactionTypeCompatible,
} from "@/lib/transaction-direction";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

export const BULK_OPERATIONS_RUNTIME_ENABLED = false;
export const BULK_OPERATION_UNDO_WINDOW_MS = 30 * 60 * 1000;
export const MAX_BULK_OPERATION_ITEMS = 250;

const transactionIdsSchema = z.array(z.string().trim().min(1))
  .min(1, "Choose at least one transaction.")
  .max(MAX_BULK_OPERATION_ITEMS, "Choose no more than 250 transactions.")
  .superRefine((ids, context) => {
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose each transaction only once.",
      });
    }
  });

const categoryOperationSchema = z.object({
  type: z.enum(["SET_CATEGORY", "APPLY_MERCHANT_CATEGORY"]),
  transactionIds: transactionIdsSchema,
  targetCategoryId: z.string().trim().min(1),
  merchantProfileId: z.string().trim().min(1).optional(),
}).strict().superRefine((input, context) => {
  if (input.type === "APPLY_MERCHANT_CATEGORY" && !input.merchantProfileId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Choose a confirmed merchant before applying its category.",
      path: ["merchantProfileId"],
    });
  }
});

const linkPropertyOperationSchema = z.object({
  type: z.literal("LINK_PROPERTY"),
  transactionIds: transactionIdsSchema,
  targetPropertyId: z.string().trim().min(1),
}).strict();

const unlinkPropertyOperationSchema = z.object({
  type: z.literal("UNLINK_PROPERTY"),
  transactionIds: transactionIdsSchema,
}).strict();

export const bulkOperationRequestSchema = z.union([
  categoryOperationSchema,
  linkPropertyOperationSchema,
  unlinkPropertyOperationSchema,
]);

export type BulkOperationRequest = z.infer<typeof bulkOperationRequestSchema>;
export type BulkOperationTypeValue = BulkOperationRequest["type"];
export type BulkOperationReasonValue =
  | "ALREADY_APPLIED"
  | "ALREADY_LINKED_TO_PROPERTY"
  | "ALREADY_LINKED_TO_ANOTHER_PROPERTY"
  | "CATEGORY_INCOMPATIBLE"
  | "CATEGORY_UNAVAILABLE"
  | "PROPERTY_UNAVAILABLE"
  | "NOT_ACTIVE"
  | "SPLIT_PARENT"
  | "DIRECTION_NEEDS_CORRECTION"
  | "MERCHANT_IDENTITY_MISMATCH"
  | "STALE_RECORD"
  | "NOT_FOUND_OR_NOT_OWNED"
  | "UNEXPECTED_SAFE_FAILURE";

export type BulkOperationItemOutcome = {
  status: "APPLIED" | "SKIPPED" | "FAILED";
  reason?: BulkOperationReasonValue;
};

export type SafeBulkOperationSummary = {
  id: string;
  type: BulkOperationTypeValue;
  status: "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "REVERTED" | "PARTIALLY_REVERTED";
  requestedCount: number;
  appliedCount: number;
  skippedCount: number;
  failedCount: number;
  undoBlockedCount: number;
  undoExpiresAt: string | null;
  revertedAt: string | null;
  reasonCounts: Partial<Record<BulkOperationReasonValue, number>>;
};

type StoredOperation = {
  id: string;
  userId: string;
  type: BulkOperationTypeValue;
  status: SafeBulkOperationSummary["status"];
  requestedCount: number;
  appliedCount: number;
  skippedCount: number;
  failedCount: number;
  undoBlockedCount: number;
  undoExpiresAt: Date | null;
  revertedAt: Date | null;
};

export type BulkOperationStore = {
  resolveTarget(
    userId: string,
    input: BulkOperationRequest,
  ): Promise<{ targetCategoryId: string | null; targetPropertyId: string | null }>;
  createOperation(
    userId: string,
    input: BulkOperationRequest,
    target: { targetCategoryId: string | null; targetPropertyId: string | null },
    now: Date,
  ): Promise<StoredOperation>;
  applyItem(
    userId: string,
    operationId: string,
    input: BulkOperationRequest,
    target: { targetCategoryId: string | null; targetPropertyId: string | null },
    transactionId: string,
    now: Date,
  ): Promise<BulkOperationItemOutcome>;
  finalizeOperation(userId: string, operationId: string, now: Date): Promise<StoredOperation>;
  findOperation(userId: string, operationId: string): Promise<StoredOperation | null>;
  listReasonCounts(userId: string, operationId: string): Promise<Partial<Record<BulkOperationReasonValue, number>>>;
  listAppliedItemIds(userId: string, operationId: string): Promise<string[]>;
  undoItem(userId: string, operationId: string, itemId: string, now: Date): Promise<"REVERTED" | "UNDO_BLOCKED">;
  finalizeUndo(userId: string, operationId: string, now: Date): Promise<StoredOperation>;
};

export class BulkOperationsUnavailableError extends Error {
  constructor() {
    super("Bulk changes are not available until the Preview migration is verified.");
    this.name = "BulkOperationsUnavailableError";
  }
}

export class BulkOperationNotFoundError extends Error {
  constructor() {
    super("That bulk change could not be found for your account.");
    this.name = "BulkOperationNotFoundError";
  }
}

export class BulkOperationUndoUnavailableError extends Error {
  constructor(message = "This bulk change can no longer be undone safely.") {
    super(message);
    this.name = "BulkOperationUndoUnavailableError";
  }
}

function operationStatus(counts: { applied: number; skipped: number; failed: number }) {
  if (counts.applied === 0 && counts.failed > 0) return "FAILED" as const;
  if (counts.failed > 0) return "PARTIAL" as const;
  return "COMPLETED" as const;
}

function safeAuditData(
  userId: string,
  operationId: string,
  action: "CREATED" | "UPDATED",
  metadata: Record<string, string | number>,
) {
  return auditEventSchema.parse({
    userId,
    entityType: "BULK_OPERATION",
    entityId: operationId,
    action,
    metadata,
  });
}

function iso(value: Date | null) {
  return value ? value.toISOString() : null;
}

async function safeItemFailure(
  tx: Prisma.TransactionClient,
  userId: string,
  operationId: string,
  transactionId: string,
  reason: BulkOperationReasonValue,
) {
  await tx.bulkOperationItem.create({
    data: {
      userId,
      operationId,
      transactionId,
      status: "FAILED",
      reason,
    },
  });
  return { status: "FAILED" as const, reason };
}

async function safeItemSkip(
  tx: Prisma.TransactionClient,
  userId: string,
  operationId: string,
  transactionId: string,
  reason: BulkOperationReasonValue,
  input: {
    beforeCategoryId?: string | null;
    afterCategoryId?: string | null;
    beforePropertyId?: string | null;
    afterPropertyId?: string | null;
    beforeTransactionUpdatedAt?: Date | null;
  } = {},
) {
  await tx.bulkOperationItem.create({
    data: {
      userId,
      operationId,
      transactionId,
      status: "SKIPPED",
      reason,
      ...input,
    },
  });
  return { status: "SKIPPED" as const, reason };
}

export function createPrismaBulkOperationStore(
  prisma: PrismaClient = getPrismaClient(),
): BulkOperationStore {
  return {
    async resolveTarget(userId, input) {
      if (input.type === "SET_CATEGORY" || input.type === "APPLY_MERCHANT_CATEGORY") {
        const category = await prisma.category.findFirst({
          where: {
            id: input.targetCategoryId,
            userId,
            isArchived: false,
            deletedAt: null,
          },
          select: { id: true },
        });
        if (!category) throw new Error("CATEGORY_UNAVAILABLE");
        return { targetCategoryId: category.id, targetPropertyId: null };
      }
      if (input.type === "LINK_PROPERTY") {
        const property = await prisma.property.findFirst({
          where: {
            id: input.targetPropertyId,
            userId,
            isArchived: false,
            deletedAt: null,
          },
          select: { id: true },
        });
        if (!property) throw new Error("PROPERTY_UNAVAILABLE");
        return { targetCategoryId: null, targetPropertyId: property.id };
      }
      return { targetCategoryId: null, targetPropertyId: null };
    },

    async createOperation(userId, input, target, now) {
      const created = await prisma.bulkOperation.create({
        data: {
          userId,
          type: input.type,
          status: "RUNNING",
          targetCategoryId: target.targetCategoryId,
          targetPropertyId: target.targetPropertyId,
          requestedCount: input.transactionIds.length,
          undoExpiresAt: new Date(now.getTime() + BULK_OPERATION_UNDO_WINDOW_MS),
        },
      });
      await prisma.auditEvent.create({
        data: safeAuditData(userId, created.id, "CREATED", {
          operationType: input.type,
          requestedCount: input.transactionIds.length,
        }),
      });
      return created as StoredOperation;
    },

    async applyItem(userId, operationId, input, target, transactionId, now) {
      try {
        return await prisma.$transaction(async (tx) => {
          const transaction = await tx.transaction.findFirst({
            where: { id: transactionId, userId },
            select: {
              id: true,
              userId: true,
              type: true,
              status: true,
              splitRole: true,
              amountCents: true,
              categoryId: true,
              merchantProfileId: true,
              updatedAt: true,
              deletedAt: true,
            },
          });
          if (!transaction) {
            return safeItemFailure(tx, userId, operationId, transactionId, "NOT_FOUND_OR_NOT_OWNED");
          }
          if (transaction.status !== "ACTIVE" || transaction.deletedAt) {
            return safeItemFailure(tx, userId, operationId, transactionId, "NOT_ACTIVE");
          }
          if (transaction.splitRole === "PARENT") {
            return safeItemFailure(tx, userId, operationId, transactionId, "SPLIT_PARENT");
          }
          if (!isTransactionTypeCompatible(transaction.type, transaction.amountCents)) {
            return safeItemFailure(tx, userId, operationId, transactionId, "DIRECTION_NEEDS_CORRECTION");
          }

          if (input.type === "SET_CATEGORY" || input.type === "APPLY_MERCHANT_CATEGORY") {
            if (input.type === "APPLY_MERCHANT_CATEGORY" && transaction.merchantProfileId !== input.merchantProfileId) {
              return safeItemFailure(tx, userId, operationId, transactionId, "MERCHANT_IDENTITY_MISMATCH");
            }
            const category = target.targetCategoryId
              ? await tx.category.findFirst({
                where: {
                  id: target.targetCategoryId,
                  userId,
                  isArchived: false,
                  deletedAt: null,
                },
                select: { id: true, type: true },
              })
              : null;
            if (!category) {
              return safeItemFailure(tx, userId, operationId, transactionId, "CATEGORY_UNAVAILABLE");
            }
            if (!isCategoryTypeCompatible(category.type, transaction.type)) {
              return safeItemFailure(tx, userId, operationId, transactionId, "CATEGORY_INCOMPATIBLE");
            }
            if (transaction.categoryId === category.id) {
              return safeItemSkip(tx, userId, operationId, transactionId, "ALREADY_APPLIED", {
                beforeCategoryId: transaction.categoryId,
                afterCategoryId: category.id,
                beforeTransactionUpdatedAt: transaction.updatedAt,
              });
            }
            const updated = await tx.transaction.updateMany({
              where: {
                id: transaction.id,
                userId,
                status: "ACTIVE",
                deletedAt: null,
                updatedAt: transaction.updatedAt,
              },
              data: { categoryId: category.id },
            });
            if (updated.count !== 1) {
              return safeItemFailure(tx, userId, operationId, transactionId, "STALE_RECORD");
            }
            const applied = await tx.transaction.findUniqueOrThrow({
              where: { id: transaction.id },
              select: { updatedAt: true },
            });
            await tx.bulkOperationItem.create({
              data: {
                userId,
                operationId,
                transactionId,
                status: "APPLIED",
                beforeCategoryId: transaction.categoryId,
                afterCategoryId: category.id,
                beforeTransactionUpdatedAt: transaction.updatedAt,
                appliedTransactionUpdatedAt: applied.updatedAt,
              },
            });
            return { status: "APPLIED" as const };
          }

          const existingLink = await tx.propertyTransactionLink.findUnique({
            where: { transactionId },
            select: {
              id: true,
              userId: true,
              propertyId: true,
              unlinkedAt: true,
            },
          });
          if (existingLink && existingLink.userId !== userId) {
            return safeItemFailure(tx, userId, operationId, transactionId, "NOT_FOUND_OR_NOT_OWNED");
          }

          if (input.type === "LINK_PROPERTY") {
            if (!target.targetPropertyId) {
              return safeItemFailure(tx, userId, operationId, transactionId, "PROPERTY_UNAVAILABLE");
            }
            if (existingLink && !existingLink.unlinkedAt) {
              if (existingLink.propertyId === target.targetPropertyId) {
                return safeItemSkip(tx, userId, operationId, transactionId, "ALREADY_LINKED_TO_PROPERTY", {
                  beforePropertyId: existingLink.propertyId,
                  afterPropertyId: existingLink.propertyId,
                  beforeTransactionUpdatedAt: transaction.updatedAt,
                });
              }
              return safeItemFailure(tx, userId, operationId, transactionId, "ALREADY_LINKED_TO_ANOTHER_PROPERTY");
            }
            await tx.propertyTransactionLink.upsert({
              where: { transactionId },
              create: {
                userId,
                transactionId,
                propertyId: target.targetPropertyId,
                unlinkedAt: null,
              },
              update: {
                propertyId: target.targetPropertyId,
                unlinkedAt: null,
                updatedAt: now,
              },
            });
            await tx.bulkOperationItem.create({
              data: {
                userId,
                operationId,
                transactionId,
                status: "APPLIED",
                beforePropertyId: existingLink?.propertyId ?? null,
                afterPropertyId: target.targetPropertyId,
                beforeTransactionUpdatedAt: transaction.updatedAt,
                appliedTransactionUpdatedAt: transaction.updatedAt,
              },
            });
            return { status: "APPLIED" as const };
          }

          if (!existingLink || existingLink.unlinkedAt) {
            return safeItemSkip(tx, userId, operationId, transactionId, "ALREADY_APPLIED", {
              beforeTransactionUpdatedAt: transaction.updatedAt,
            });
          }
          await tx.propertyTransactionLink.update({
            where: { id: existingLink.id },
            data: { unlinkedAt: now },
          });
          await tx.bulkOperationItem.create({
            data: {
              userId,
              operationId,
              transactionId,
              status: "APPLIED",
              beforePropertyId: existingLink.propertyId,
              afterPropertyId: null,
              beforeTransactionUpdatedAt: transaction.updatedAt,
              appliedTransactionUpdatedAt: transaction.updatedAt,
            },
          });
          return { status: "APPLIED" as const };
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10_000,
          timeout: 30_000,
        });
      } catch (error) {
        const reason: BulkOperationReasonValue =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
            ? "STALE_RECORD"
            : "UNEXPECTED_SAFE_FAILURE";
        try {
          await prisma.bulkOperationItem.create({
            data: {
              userId,
              operationId,
              transactionId,
              status: "FAILED",
              reason,
            },
          });
        } catch {
          // The operation finalizer still records a safe failed count.
        }
        return { status: "FAILED", reason };
      }
    },

    async finalizeOperation(userId, operationId, now) {
      const [applied, skipped, failed] = await Promise.all([
        prisma.bulkOperationItem.count({ where: { operationId, userId, status: "APPLIED" } }),
        prisma.bulkOperationItem.count({ where: { operationId, userId, status: "SKIPPED" } }),
        prisma.bulkOperationItem.count({ where: { operationId, userId, status: "FAILED" } }),
      ]);
      const status = operationStatus({ applied, skipped, failed });
      const operation = await prisma.bulkOperation.update({
        where: { id: operationId },
        data: {
          status,
          appliedCount: applied,
          skippedCount: skipped,
          failedCount: failed,
          completedAt: now,
        },
      });
      await prisma.auditEvent.create({
        data: safeAuditData(userId, operationId, "UPDATED", {
          operationType: operation.type,
          operationStatus: status,
          appliedCount: applied,
          skippedCount: skipped,
          failedCount: failed,
        }),
      });
      return operation as StoredOperation;
    },

    async findOperation(userId, operationId) {
      return prisma.bulkOperation.findFirst({
        where: { id: operationId, userId },
      }) as unknown as Promise<StoredOperation | null>;
    },

    async listReasonCounts(userId, operationId) {
      const groups = await prisma.bulkOperationItem.groupBy({
        by: ["reason"],
        where: {
          operationId,
          userId,
          reason: { not: null },
        },
        _count: { _all: true },
      });
      return Object.fromEntries(groups.map((group) => [group.reason, group._count._all])) as Partial<Record<BulkOperationReasonValue, number>>;
    },

    async listAppliedItemIds(userId, operationId) {
      const items = await prisma.bulkOperationItem.findMany({
        where: { operationId, userId, status: "APPLIED" },
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });
      return items.map((item) => item.id);
    },

    async undoItem(userId, operationId, itemId, now) {
      try {
        return await prisma.$transaction(async (tx) => {
          const item = await tx.bulkOperationItem.findFirst({
            where: { id: itemId, operationId, userId, status: "APPLIED" },
            include: { operation: true },
          });
          if (!item) return "UNDO_BLOCKED" as const;
          const transaction = await tx.transaction.findFirst({
            where: {
              id: item.transactionId,
              userId,
              status: "ACTIVE",
              deletedAt: null,
              splitRole: { not: "PARENT" },
            },
            select: {
              id: true,
              type: true,
              categoryId: true,
              updatedAt: true,
            },
          });
          if (!transaction) {
            await tx.bulkOperationItem.update({ where: { id: item.id }, data: { status: "UNDO_BLOCKED", reason: "NOT_ACTIVE" } });
            return "UNDO_BLOCKED" as const;
          }

          if (item.operation.type === "SET_CATEGORY" || item.operation.type === "APPLY_MERCHANT_CATEGORY") {
            if (
              transaction.categoryId !== item.afterCategoryId ||
              !item.appliedTransactionUpdatedAt ||
              transaction.updatedAt.getTime() !== item.appliedTransactionUpdatedAt.getTime()
            ) {
              await tx.bulkOperationItem.update({ where: { id: item.id }, data: { status: "UNDO_BLOCKED", reason: "STALE_RECORD" } });
              return "UNDO_BLOCKED" as const;
            }
            if (item.beforeCategoryId) {
              const category = await tx.category.findFirst({
                where: {
                  id: item.beforeCategoryId,
                  userId,
                  isArchived: false,
                  deletedAt: null,
                },
                select: { id: true, type: true },
              });
              if (!category || !isCategoryTypeCompatible(category.type, transaction.type)) {
                await tx.bulkOperationItem.update({ where: { id: item.id }, data: { status: "UNDO_BLOCKED", reason: "CATEGORY_UNAVAILABLE" } });
                return "UNDO_BLOCKED" as const;
              }
            }
            const updated = await tx.transaction.updateMany({
              where: { id: transaction.id, userId, updatedAt: transaction.updatedAt },
              data: { categoryId: item.beforeCategoryId },
            });
            if (updated.count !== 1) {
              await tx.bulkOperationItem.update({ where: { id: item.id }, data: { status: "UNDO_BLOCKED", reason: "STALE_RECORD" } });
              return "UNDO_BLOCKED" as const;
            }
          } else {
            const link = await tx.propertyTransactionLink.findUnique({
              where: { transactionId: transaction.id },
              select: { id: true, userId: true, propertyId: true, unlinkedAt: true },
            });
            if (link && link.userId !== userId) {
              await tx.bulkOperationItem.update({ where: { id: item.id }, data: { status: "UNDO_BLOCKED", reason: "NOT_FOUND_OR_NOT_OWNED" } });
              return "UNDO_BLOCKED" as const;
            }
            if (item.operation.type === "LINK_PROPERTY") {
              if (!link || link.unlinkedAt || link.propertyId !== item.afterPropertyId) {
                await tx.bulkOperationItem.update({ where: { id: item.id }, data: { status: "UNDO_BLOCKED", reason: "STALE_RECORD" } });
                return "UNDO_BLOCKED" as const;
              }
              await tx.propertyTransactionLink.update({ where: { id: link.id }, data: { unlinkedAt: now } });
            } else {
              if (link && !link.unlinkedAt) {
                await tx.bulkOperationItem.update({ where: { id: item.id }, data: { status: "UNDO_BLOCKED", reason: "STALE_RECORD" } });
                return "UNDO_BLOCKED" as const;
              }
              if (!item.beforePropertyId) {
                await tx.bulkOperationItem.update({ where: { id: item.id }, data: { status: "UNDO_BLOCKED", reason: "PROPERTY_UNAVAILABLE" } });
                return "UNDO_BLOCKED" as const;
              }
              const property = await tx.property.findFirst({
                where: {
                  id: item.beforePropertyId,
                  userId,
                  isArchived: false,
                  deletedAt: null,
                },
                select: { id: true },
              });
              if (!property) {
                await tx.bulkOperationItem.update({ where: { id: item.id }, data: { status: "UNDO_BLOCKED", reason: "PROPERTY_UNAVAILABLE" } });
                return "UNDO_BLOCKED" as const;
              }
              await tx.propertyTransactionLink.upsert({
                where: { transactionId: transaction.id },
                create: { userId, transactionId: transaction.id, propertyId: property.id, unlinkedAt: null },
                update: { propertyId: property.id, unlinkedAt: null, updatedAt: now },
              });
            }
          }

          await tx.bulkOperationItem.update({
            where: { id: item.id },
            data: { status: "REVERTED", reason: null, revertedAt: now },
          });
          return "REVERTED" as const;
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10_000,
          timeout: 30_000,
        });
      } catch {
        await prisma.bulkOperationItem.updateMany({
          where: { id: itemId, operationId, userId, status: "APPLIED" },
          data: { status: "UNDO_BLOCKED", reason: "UNEXPECTED_SAFE_FAILURE" },
        });
        return "UNDO_BLOCKED" as const;
      }
    },

    async finalizeUndo(userId, operationId, now) {
      const [reverted, blocked] = await Promise.all([
        prisma.bulkOperationItem.count({ where: { operationId, userId, status: "REVERTED" } }),
        prisma.bulkOperationItem.count({ where: { operationId, userId, status: "UNDO_BLOCKED" } }),
      ]);
      const status = blocked > 0 ? "PARTIALLY_REVERTED" : "REVERTED";
      const operation = await prisma.bulkOperation.update({
        where: { id: operationId },
        data: {
          status,
          undoBlockedCount: blocked,
          revertedAt: reverted > 0 ? now : null,
        },
      });
      await prisma.auditEvent.create({
        data: safeAuditData(userId, operationId, "UPDATED", {
          operationType: operation.type,
          operationStatus: status,
          revertedCount: reverted,
          undoBlockedCount: blocked,
        }),
      });
      return operation as StoredOperation;
    },
  };
}

async function summary(
  userId: string,
  operation: StoredOperation,
  store: BulkOperationStore,
): Promise<SafeBulkOperationSummary> {
  return {
    id: operation.id,
    type: operation.type,
    status: operation.status,
    requestedCount: operation.requestedCount,
    appliedCount: operation.appliedCount,
    skippedCount: operation.skippedCount,
    failedCount: operation.failedCount,
    undoBlockedCount: operation.undoBlockedCount,
    undoExpiresAt: iso(operation.undoExpiresAt),
    revertedAt: iso(operation.revertedAt),
    reasonCounts: await store.listReasonCounts(userId, operation.id),
  };
}

export async function createBulkOperation(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  store: BulkOperationStore = createPrismaBulkOperationStore(),
  now = new Date(),
) {
  if (!BULK_OPERATIONS_RUNTIME_ENABLED) throw new BulkOperationsUnavailableError();
  const user = requireAuthenticatedUserContext(context);
  const request = bulkOperationRequestSchema.parse(input);
  const target = await store.resolveTarget(user.userId, request);
  const operation = await store.createOperation(user.userId, request, target, now);

  for (const transactionId of request.transactionIds) {
    await store.applyItem(user.userId, operation.id, request, target, transactionId, now);
  }

  return summary(
    user.userId,
    await store.finalizeOperation(user.userId, operation.id, now),
    store,
  );
}

export async function getBulkOperation(
  context: AuthenticatedUserContext | null | undefined,
  operationId: string,
  store: BulkOperationStore = createPrismaBulkOperationStore(),
) {
  if (!BULK_OPERATIONS_RUNTIME_ENABLED) throw new BulkOperationsUnavailableError();
  const user = requireAuthenticatedUserContext(context);
  const operation = await store.findOperation(user.userId, operationId);
  if (!operation) throw new BulkOperationNotFoundError();
  return summary(user.userId, operation, store);
}

export async function undoBulkOperation(
  context: AuthenticatedUserContext | null | undefined,
  operationId: string,
  store: BulkOperationStore = createPrismaBulkOperationStore(),
  now = new Date(),
) {
  if (!BULK_OPERATIONS_RUNTIME_ENABLED) throw new BulkOperationsUnavailableError();
  const user = requireAuthenticatedUserContext(context);
  const operation = await store.findOperation(user.userId, operationId);
  if (!operation) throw new BulkOperationNotFoundError();
  if (
    !operation.undoExpiresAt ||
    operation.undoExpiresAt.getTime() < now.getTime() ||
    !["COMPLETED", "PARTIAL"].includes(operation.status) ||
    operation.appliedCount < 1
  ) {
    throw new BulkOperationUndoUnavailableError();
  }

  const itemIds = await store.listAppliedItemIds(user.userId, operation.id);
  for (const itemId of itemIds) {
    await store.undoItem(user.userId, operation.id, itemId, now);
  }
  return summary(
    user.userId,
    await store.finalizeUndo(user.userId, operation.id, now),
    store,
  );
}
