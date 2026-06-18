import type { PrismaClient } from "@prisma/client";
import type {
  AccountImportHistoryEntry,
  ImportHistoryLinkState,
  ImportHistoryLinkedTransaction,
  ImportHistoryOutcome,
  SafeImportAuditTrail,
  SafeImportRowOutcome,
} from "@/lib/import-history";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

type StoredLinkedTransaction = {
  userId: string;
  source: string;
  status: string;
} | null;

type StoredImportRow = {
  userId: string;
  rowNumber: number;
  action: string;
  status: string;
  warningCodes: string[];
  committedTransaction: StoredLinkedTransaction;
  matchedTransaction: StoredLinkedTransaction;
};

type StoredImportBatch = {
  id: string;
  userId: string;
  status: string;
  rowCount: number;
  importedCount: number;
  skippedCount: number;
  mergedCount: number;
  privateFieldCount: number;
  warningCodes: string[];
  createdAt: Date;
  completedAt: Date | null;
  importRows: StoredImportRow[];
};

type StoredAuditEvent = {
  userId: string;
  entityId: string | null;
  action: string;
  metadata: unknown;
  createdAt: Date;
};

export type ImportHistoryStore = {
  listBatches(userId: string, limit: number, rowLimit: number): Promise<StoredImportBatch[]>;
  listAudits(userId: string, batchIds: string[]): Promise<StoredAuditEvent[]>;
};

function safeCount(value: unknown, maximum = 5000) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? Math.min(value, maximum)
    : 0;
}

function safeMetadataCount(metadata: unknown, key: string, fallback: number) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return fallback;
  const value = (metadata as Record<string, unknown>)[key];
  return value === undefined ? fallback : safeCount(value);
}

function mapOutcome(userId: string, row: StoredImportRow): SafeImportRowOutcome {
  let outcome: ImportHistoryOutcome = "UNAVAILABLE";
  let linkedTransaction: ImportHistoryLinkedTransaction = "NONE";
  let linkState: ImportHistoryLinkState = "UNAVAILABLE";

  if (row.action === "SKIP" && row.status === "SKIPPED") {
    outcome = "SKIPPED";
    linkState = "NOT_APPLICABLE";
  } else if (row.action === "IMPORT" && row.status === "COMMITTED") {
    outcome = "IMPORTED";
    linkedTransaction = "IMPORTED";
    linkState = row.committedTransaction?.userId === userId
      && row.committedTransaction.source === "IMPORTED"
      && row.committedTransaction.status === "ACTIVE"
      ? "ACTIVE"
      : "UNAVAILABLE";
  } else if (row.action === "MERGE" && row.status === "MERGED") {
    outcome = "MERGED";
    linkedTransaction = "MANUAL";
    linkState = row.matchedTransaction?.userId === userId
      && row.matchedTransaction.source === "MANUAL"
      && row.matchedTransaction.status === "ACTIVE"
      ? "ACTIVE"
      : "UNAVAILABLE";
  }

  return {
    rowNumber: safeCount(row.rowNumber),
    outcome,
    linkedTransaction,
    linkState,
    warningCount: safeCount(row.warningCodes.length, 20),
  };
}

function mapAudit(batch: StoredImportBatch, audit: StoredAuditEvent | undefined): SafeImportAuditTrail | null {
  if (!audit || audit.action !== "IMPORTED") return null;
  return {
    action: "IMPORTED",
    occurredAt: audit.createdAt.toISOString(),
    metadata: {
      totalCount: safeMetadataCount(audit.metadata, "totalCount", safeCount(batch.rowCount)),
      importedCount: safeMetadataCount(audit.metadata, "importedCount", safeCount(batch.importedCount)),
      skippedCount: safeMetadataCount(audit.metadata, "skippedCount", safeCount(batch.skippedCount)),
      mergedCount: safeMetadataCount(audit.metadata, "mergedCount", safeCount(batch.mergedCount)),
      warningCount: safeMetadataCount(audit.metadata, "warningCount", safeCount(batch.warningCodes.length, 20)),
      privateFieldCount: safeMetadataCount(audit.metadata, "privateFieldCount", safeCount(batch.privateFieldCount, 100)),
    },
  };
}

export function createPrismaImportHistoryStore(prisma: PrismaClient = getPrismaClient()): ImportHistoryStore {
  return {
    async listBatches(userId, limit, rowLimit) {
      return prisma.importBatch.findMany({
        where: { userId, status: "COMPLETED", deletedAt: null },
        orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
        select: {
          id: true,
          userId: true,
          status: true,
          rowCount: true,
          importedCount: true,
          skippedCount: true,
          mergedCount: true,
          privateFieldCount: true,
          warningCodes: true,
          createdAt: true,
          completedAt: true,
          importRows: {
            orderBy: { rowNumber: "asc" },
            take: rowLimit,
            select: {
              userId: true,
              rowNumber: true,
              action: true,
              status: true,
              warningCodes: true,
              committedTransaction: { select: { userId: true, source: true, status: true } },
              matchedTransaction: { select: { userId: true, source: true, status: true } },
            },
          },
        },
      });
    },
    async listAudits(userId, batchIds) {
      if (batchIds.length === 0) return [];
      return prisma.auditEvent.findMany({
        where: { userId, entityType: "IMPORT_BATCH", entityId: { in: batchIds } },
        orderBy: { createdAt: "desc" },
        select: { userId: true, entityId: true, action: true, metadata: true, createdAt: true },
      });
    },
  };
}

export async function listSafeImportHistory(
  context: AuthenticatedUserContext | null | undefined,
  store: ImportHistoryStore = createPrismaImportHistoryStore(),
  options: { limit?: number; rowLimit?: number } = {},
): Promise<AccountImportHistoryEntry[]> {
  const user = requireAuthenticatedUserContext(context);
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
  const rowLimit = Math.min(Math.max(options.rowLimit ?? 50, 1), 100);
  const storedBatches = await store.listBatches(user.userId, limit, rowLimit);
  const batches = storedBatches.filter((batch) => batch.userId === user.userId && batch.status === "COMPLETED");
  const audits = await store.listAudits(user.userId, batches.map((batch) => batch.id));
  const auditByBatchId = new Map<string, StoredAuditEvent>();

  audits.forEach((audit) => {
    if (audit.userId !== user.userId || !audit.entityId || auditByBatchId.has(audit.entityId)) return;
    auditByBatchId.set(audit.entityId, audit);
  });

  return batches
    .map((batch) => {
      const outcomes = batch.importRows
        .filter((row) => row.userId === user.userId && Number.isInteger(row.rowNumber) && row.rowNumber > 0)
        .slice(0, rowLimit)
        .map((row) => mapOutcome(user.userId, row));
      const totalCount = safeCount(batch.rowCount);
      return {
        batchId: batch.id,
        completedAt: (batch.completedAt ?? batch.createdAt).toISOString(),
        totalCount,
        importedCount: safeCount(batch.importedCount),
        skippedCount: safeCount(batch.skippedCount),
        mergedCount: safeCount(batch.mergedCount),
        warningCount: safeCount(batch.warningCodes.length, 20),
        privateFieldCount: safeCount(batch.privateFieldCount, 100),
        outcomes,
        hiddenOutcomeCount: Math.max(0, totalCount - outcomes.length),
        audit: mapAudit(batch, auditByBatchId.get(batch.id)),
      } satisfies AccountImportHistoryEntry;
    })
    .sort((left, right) => right.completedAt.localeCompare(left.completedAt));
}
