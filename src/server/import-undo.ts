import { Prisma, type ImportRowAction, type ImportUndoItemStatus, type ImportUndoReason, type PrismaClient } from "@prisma/client";
import type { SafeImportUndoStatus } from "@/lib/import-undo";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { OwnershipError, requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";
import { isVerifiedPreviewRuntime } from "@/src/server/preview-runtime";

const UNDO_CONFIRMATION = "UNDO IMPORT";
const RESTORE_CONFIRMATION = "RESTORE IMPORT";

export class ImportUndoUnavailableError extends Error {
  constructor(message = "Import undo is available only in the verified Preview environment.") {
    super(message);
    this.name = "ImportUndoUnavailableError";
  }
}

export class ImportUndoConflictError extends Error {
  constructor(message = "This import cannot be changed safely. Refresh import history and review its current state.") {
    super(message);
    this.name = "ImportUndoConflictError";
  }
}

type PreparedRow = {
  id: string;
  action: ImportRowAction;
  committedTransactionId: string | null;
  committedTransactionUpdatedAt: Date | null;
};

function requirePreviewRuntime() {
  if (!isVerifiedPreviewRuntime()) throw new ImportUndoUnavailableError();
}

function safeStatus(
  operation: {
    id: string;
    status: string;
    requestedCount: number;
    undoneCount: number;
    noChangeCount: number;
    blockedCount: number;
    failedCount: number;
    restoredCount: number;
    restoreBlockedCount: number;
  } | null,
  eligible: boolean,
  message: string,
): SafeImportUndoStatus {
  return {
    available: true,
    eligible,
    operationId: operation?.id ?? null,
    status: operation?.status ?? null,
    requestedCount: operation?.requestedCount ?? 0,
    undoneCount: operation?.undoneCount ?? 0,
    noChangeCount: operation?.noChangeCount ?? 0,
    blockedCount: operation?.blockedCount ?? 0,
    failedCount: operation?.failedCount ?? 0,
    restoredCount: operation?.restoredCount ?? 0,
    restoreBlockedCount: operation?.restoreBlockedCount ?? 0,
    canRestore: operation?.status === "UNDONE" || operation?.status === "PARTIAL",
    message,
  };
}

function statusMessage(status: string | null) {
  if (status === "UNDONE") return "Imported transactions were removed from active views. Skipped and merged rows were unchanged.";
  if (status === "PARTIAL") return "Eligible imported transactions were removed. Some changed or linked transactions were left unchanged.";
  if (status === "FAILED") return "No imported transaction could be removed safely.";
  if (status === "RESTORED") return "The imported transactions were restored.";
  if (status === "PARTIALLY_RESTORED") return "Eligible imported transactions were restored. Some changed records remain unchanged.";
  if (status === "RUNNING" || status === "RESTORING") return "This import operation is still being finalised.";
  return "This import can be undone after explicit confirmation.";
}

async function readOwnedBatch(prisma: PrismaClient, userId: string, batchId: string) {
  const batch = await prisma.importBatch.findFirst({
    where: { id: batchId, userId },
    select: {
      id: true,
      userId: true,
      type: true,
      status: true,
      deletedAt: true,
      importRows: {
        orderBy: { rowNumber: "asc" },
        select: {
          id: true,
          action: true,
          committedTransactionId: true,
          committedTransactionUpdatedAt: true,
        },
      },
      undoOperation: {
        select: {
          id: true,
          status: true,
          requestedCount: true,
          undoneCount: true,
          noChangeCount: true,
          blockedCount: true,
          failedCount: true,
          restoredCount: true,
          restoreBlockedCount: true,
        },
      },
    },
  });
  if (!batch || batch.userId !== userId) throw new OwnershipError("completed import");
  return batch;
}

function batchIsEligible(batch: Awaited<ReturnType<typeof readOwnedBatch>>) {
  return batch.type === "TRANSACTION_CSV"
    && batch.status === "COMPLETED"
    && batch.deletedAt === null
    && batch.undoOperation === null
    && batch.importRows
      .filter((row) => row.action === "IMPORT")
      .every((row) => row.committedTransactionId && row.committedTransactionUpdatedAt);
}

function propertyAuditIsOriginal(events: Array<{ metadata: unknown }>) {
  const propertyEvents = events.filter((event) => {
    if (!event.metadata || typeof event.metadata !== "object" || Array.isArray(event.metadata)) return false;
    return typeof (event.metadata as Record<string, unknown>).propertyLinkState === "string";
  });
  if (propertyEvents.length !== 1) return false;
  const metadata = propertyEvents[0].metadata as Record<string, unknown>;
  return metadata.propertyLinkState === "LINKED" && metadata.reasonCode === "IMPORT_REVIEW_PROPERTY_LINK";
}

async function recordNoChange(
  prisma: PrismaClient,
  operationId: string,
  userId: string,
  row: PreparedRow,
  reason: "SKIPPED_ROW" | "MERGED_ROW_NO_CHANGE",
) {
  await prisma.importUndoItem.update({
    where: { operationId_importRowId: { operationId, importRowId: row.id } },
    data: { status: "NO_CHANGE", reason },
  });
}

async function recordBlocked(
  tx: Prisma.TransactionClient,
  operationId: string,
  rowId: string,
  reason: ImportUndoReason,
) {
  await tx.importUndoItem.update({
    where: { operationId_importRowId: { operationId, importRowId: rowId } },
    data: { status: "BLOCKED", reason },
  });
}

async function undoImportedRow(
  prisma: PrismaClient,
  userId: string,
  batchId: string,
  operationId: string,
  row: PreparedRow,
  now: Date,
) {
  await prisma.$transaction(async (tx) => {
    if (!row.committedTransactionId || !row.committedTransactionUpdatedAt) {
      await recordBlocked(tx, operationId, row.id, "EXISTING_BATCH_UNSUPPORTED");
      return;
    }

    const transaction = await tx.transaction.findFirst({
      where: { id: row.committedTransactionId, userId },
      select: {
        id: true,
        userId: true,
        source: true,
        status: true,
        deletedAt: true,
        importBatchId: true,
        splitRole: true,
        updatedAt: true,
      },
    });
    if (!transaction || transaction.userId !== userId || transaction.importBatchId !== batchId) {
      await recordBlocked(tx, operationId, row.id, "OWNERSHIP_OR_LINK_MISMATCH");
      return;
    }
    if (transaction.source !== "IMPORTED" || transaction.status !== "ACTIVE" || transaction.deletedAt) {
      await recordBlocked(tx, operationId, row.id, "TRANSACTION_NOT_ACTIVE");
      return;
    }
    if (transaction.splitRole !== "NONE") {
      await recordBlocked(tx, operationId, row.id, "SPLIT_CHANGED");
      return;
    }
    if (transaction.updatedAt.getTime() !== row.committedTransactionUpdatedAt.getTime()) {
      await recordBlocked(tx, operationId, row.id, "TRANSACTION_CHANGED");
      return;
    }

    const [loanLink, transferLink, propertyReview, bulkDependency, propertyLink] = await Promise.all([
      tx.loanReconciliationLink.findFirst({ where: { userId, transactionId: transaction.id, unlinkedAt: null }, select: { id: true } }),
      tx.transferLink.findFirst({
        where: {
          userId,
          unlinkedAt: null,
          OR: [{ outgoingTransactionId: transaction.id }, { incomingTransactionId: transaction.id }],
        },
        select: { id: true },
      }),
      tx.propertyReportReview.findFirst({ where: { userId, transactionId: transaction.id }, select: { id: true } }),
      tx.bulkOperationItem.findFirst({ where: { userId, transactionId: transaction.id }, select: { id: true } }),
      tx.propertyTransactionLink.findUnique({
        where: { transactionId: transaction.id },
        select: { id: true, userId: true, unlinkedAt: true },
      }),
    ]);
    if (loanLink) { await recordBlocked(tx, operationId, row.id, "ACTIVE_LOAN_RECONCILIATION"); return; }
    if (transferLink) { await recordBlocked(tx, operationId, row.id, "ACTIVE_TRANSFER_LINK"); return; }
    if (propertyReview) { await recordBlocked(tx, operationId, row.id, "PROPERTY_REVIEW_EXISTS"); return; }
    if (bulkDependency) { await recordBlocked(tx, operationId, row.id, "BULK_OPERATION_DEPENDENCY"); return; }

    if (propertyLink) {
      if (propertyLink.userId !== userId || propertyLink.unlinkedAt) {
        await recordBlocked(tx, operationId, row.id, "PROPERTY_STATE_CHANGED");
        return;
      }
      const propertyAudits = await tx.auditEvent.findMany({
        where: { userId, entityType: "TRANSACTION", entityId: transaction.id, action: "UPDATED" },
        select: { metadata: true },
        orderBy: { createdAt: "asc" },
      });
      if (!propertyAuditIsOriginal(propertyAudits)) {
        await recordBlocked(tx, operationId, row.id, "PROPERTY_STATE_CHANGED");
        return;
      }
    }

    const changed = await tx.transaction.updateMany({
      where: {
        id: transaction.id,
        userId,
        source: "IMPORTED",
        status: "ACTIVE",
        deletedAt: null,
        importBatchId: batchId,
        splitRole: "NONE",
        updatedAt: row.committedTransactionUpdatedAt,
      },
      data: { status: "DELETED", deletedAt: now, updatedAt: now },
    });
    if (changed.count !== 1) {
      await recordBlocked(tx, operationId, row.id, "TRANSACTION_CHANGED");
      return;
    }
    await tx.importUndoItem.update({
      where: { operationId_importRowId: { operationId, importRowId: row.id } },
      data: {
        transactionId: transaction.id,
        status: "UNDONE",
        reason: null,
        beforeTransactionUpdatedAt: row.committedTransactionUpdatedAt,
        appliedTransactionUpdatedAt: now,
        undoneAt: now,
      },
    });
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 30_000,
  });
}

async function markUnexpectedFailure(prisma: PrismaClient, operationId: string, rowId: string) {
  await prisma.importUndoItem.update({
    where: { operationId_importRowId: { operationId, importRowId: rowId } },
    data: { status: "FAILED", reason: "UNEXPECTED_SAFE_FAILURE" },
  });
}

async function finalizeUndo(prisma: PrismaClient, userId: string, operationId: string, now: Date) {
  return prisma.$transaction(async (tx) => {
    const items = await tx.importUndoItem.findMany({
      where: { operationId, userId },
      select: { status: true },
    });
    const count = (status: ImportUndoItemStatus) => items.filter((item) => item.status === status).length;
    const undoneCount = count("UNDONE");
    const noChangeCount = count("NO_CHANGE");
    const blockedCount = count("BLOCKED");
    const failedCount = count("FAILED");
    const status = undoneCount > 0
      ? (blockedCount + failedCount > 0 ? "PARTIAL" : "UNDONE")
      : (blockedCount + failedCount > 0 ? "FAILED" : "UNDONE");
    const operation = await tx.importUndoOperation.update({
      where: { id: operationId },
      data: { status, undoneCount, noChangeCount, blockedCount, failedCount, completedAt: now },
      select: {
        id: true, status: true, requestedCount: true, undoneCount: true, noChangeCount: true,
        blockedCount: true, failedCount: true, restoredCount: true, restoreBlockedCount: true,
      },
    });
    await tx.auditEvent.create({
      data: {
        userId,
        entityType: "IMPORT_UNDO_OPERATION",
        entityId: operationId,
        action: "UPDATED",
        metadata: { undoneCount, noChangeCount, blockedCount, failedCount },
      },
    });
    return operation;
  });
}

async function restoreItem(
  prisma: PrismaClient,
  userId: string,
  batchId: string,
  operationId: string,
  itemId: string,
  now: Date,
) {
  await prisma.$transaction(async (tx) => {
    const item = await tx.importUndoItem.findFirst({
      where: { id: itemId, operationId, userId, status: "UNDONE" },
      select: {
        id: true,
        transactionId: true,
        appliedTransactionUpdatedAt: true,
        undoneAt: true,
        importRow: { select: { importBatchId: true, committedTransactionId: true } },
      },
    });
    if (!item || !item.transactionId || !item.appliedTransactionUpdatedAt || !item.undoneAt
      || item.importRow.importBatchId !== batchId || item.importRow.committedTransactionId !== item.transactionId) {
      if (item) await tx.importUndoItem.update({ where: { id: item.id }, data: { status: "RESTORE_BLOCKED", reason: "OWNERSHIP_OR_LINK_MISMATCH" } });
      return;
    }
    const changed = await tx.transaction.updateMany({
      where: {
        id: item.transactionId,
        userId,
        source: "IMPORTED",
        status: "DELETED",
        deletedAt: item.undoneAt,
        updatedAt: item.appliedTransactionUpdatedAt,
        importBatchId: batchId,
        splitRole: "NONE",
      },
      data: { status: "ACTIVE", deletedAt: null, updatedAt: now },
    });
    if (changed.count !== 1) {
      await tx.importUndoItem.update({ where: { id: item.id }, data: { status: "RESTORE_BLOCKED", reason: "RESTORE_STATE_CHANGED" } });
      return;
    }
    await tx.importUndoItem.update({
      where: { id: item.id },
      data: { status: "RESTORED", reason: null, restoredAt: now },
    });
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 30_000,
  });
}

export async function getImportUndoStatus(
  context: AuthenticatedUserContext | null | undefined,
  batchId: string,
  prisma: PrismaClient = getPrismaClient(),
): Promise<SafeImportUndoStatus> {
  requirePreviewRuntime();
  const user = requireAuthenticatedUserContext(context);
  const batch = await readOwnedBatch(prisma, user.userId, batchId);
  const eligible = batchIsEligible(batch);
  const message = batch.undoOperation
    ? statusMessage(batch.undoOperation.status)
    : eligible
      ? statusMessage(null)
      : "This existing or changed import cannot be undone safely.";
  return safeStatus(batch.undoOperation, eligible, message);
}

export async function undoImportBatch(
  context: AuthenticatedUserContext | null | undefined,
  batchId: string,
  input: unknown,
  prisma: PrismaClient = getPrismaClient(),
  now = new Date(),
): Promise<SafeImportUndoStatus> {
  requirePreviewRuntime();
  const user = requireAuthenticatedUserContext(context);
  if (!input || typeof input !== "object" || Array.isArray(input)
    || (input as Record<string, unknown>).confirmation !== UNDO_CONFIRMATION) {
    throw new ImportUndoConflictError("Type UNDO IMPORT to confirm this change.");
  }

  const prepared = await prisma.$transaction(async (tx) => {
    const batch = await readOwnedBatch(tx as unknown as PrismaClient, user.userId, batchId);
    if (!batchIsEligible(batch)) throw new ImportUndoConflictError();
    const operation = await tx.importUndoOperation.create({
      data: {
        userId: user.userId,
        importBatchId: batch.id,
        status: "RUNNING",
        requestedCount: batch.importRows.length,
        items: {
          create: batch.importRows.map((row) => ({
            userId: user.userId,
            importRowId: row.id,
            transactionId: row.committedTransactionId,
            status: "PENDING",
          })),
        },
      },
      select: { id: true },
    });
    await tx.auditEvent.create({
      data: {
        userId: user.userId,
        entityType: "IMPORT_UNDO_OPERATION",
        entityId: operation.id,
        action: "CREATED",
        metadata: { requestedCount: batch.importRows.length },
      },
    });
    return { operationId: operation.id, rows: batch.importRows as PreparedRow[] };
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 30_000,
  });

  for (const row of prepared.rows) {
    try {
      if (row.action === "SKIP") await recordNoChange(prisma, prepared.operationId, user.userId, row, "SKIPPED_ROW");
      else if (row.action === "MERGE") await recordNoChange(prisma, prepared.operationId, user.userId, row, "MERGED_ROW_NO_CHANGE");
      else await undoImportedRow(prisma, user.userId, batchId, prepared.operationId, row, now);
    } catch {
      await markUnexpectedFailure(prisma, prepared.operationId, row.id);
    }
  }

  const operation = await finalizeUndo(prisma, user.userId, prepared.operationId, now);
  return safeStatus(operation, false, statusMessage(operation.status));
}

export async function restoreImportBatch(
  context: AuthenticatedUserContext | null | undefined,
  batchId: string,
  input: unknown,
  prisma: PrismaClient = getPrismaClient(),
  now = new Date(),
): Promise<SafeImportUndoStatus> {
  requirePreviewRuntime();
  const user = requireAuthenticatedUserContext(context);
  if (!input || typeof input !== "object" || Array.isArray(input)
    || (input as Record<string, unknown>).confirmation !== RESTORE_CONFIRMATION) {
    throw new ImportUndoConflictError("Type RESTORE IMPORT to confirm this change.");
  }

  const prepared = await prisma.$transaction(async (tx) => {
    const operation = await tx.importUndoOperation.findFirst({
      where: { userId: user.userId, importBatchId: batchId, status: { in: ["UNDONE", "PARTIAL"] } },
      select: { id: true, importBatchId: true, items: { where: { status: "UNDONE" }, select: { id: true } } },
    });
    if (!operation) throw new ImportUndoConflictError("This import is not available to restore.");
    await tx.importUndoOperation.update({ where: { id: operation.id }, data: { status: "RESTORING" } });
    return operation;
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 30_000,
  });

  for (const item of prepared.items) {
    try {
      await restoreItem(prisma, user.userId, batchId, prepared.id, item.id, now);
    } catch {
      await prisma.importUndoItem.update({
        where: { id: item.id },
        data: { status: "RESTORE_BLOCKED", reason: "UNEXPECTED_SAFE_FAILURE" },
      });
    }
  }

  const operation = await prisma.$transaction(async (tx) => {
    const items = await tx.importUndoItem.findMany({
      where: { operationId: prepared.id, userId: user.userId },
      select: { status: true },
    });
    const restoredCount = items.filter((item) => item.status === "RESTORED").length;
    const restoreBlockedCount = items.filter((item) => item.status === "RESTORE_BLOCKED").length;
    const status = restoreBlockedCount > 0 ? "PARTIALLY_RESTORED" : "RESTORED";
    const updated = await tx.importUndoOperation.update({
      where: { id: prepared.id },
      data: { status, restoredCount, restoreBlockedCount, restoredAt: now },
      select: {
        id: true, status: true, requestedCount: true, undoneCount: true, noChangeCount: true,
        blockedCount: true, failedCount: true, restoredCount: true, restoreBlockedCount: true,
      },
    });
    await tx.auditEvent.create({
      data: {
        userId: user.userId,
        entityType: "IMPORT_UNDO_OPERATION",
        entityId: prepared.id,
        action: "UPDATED",
        metadata: { restoredCount, restoreBlockedCount },
      },
    });
    return updated;
  });

  return safeStatus(operation, false, statusMessage(operation.status));
}
