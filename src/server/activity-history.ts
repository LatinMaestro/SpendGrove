import type { AuditAction, AuditEntityType, PrismaClient } from "@prisma/client";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { assertUserOwnsRecord, requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

export type ActivityFamily =
  | "Account"
  | "Transactions"
  | "Imports"
  | "Categories"
  | "Loans"
  | "Properties"
  | "Budgets"
  | "Regular payments"
  | "Planning"
  | "Collaboration"
  | "Documents";

export type ActivityHistoryItem = {
  id: string;
  occurredAt: string;
  family: ActivityFamily;
  actionLabel: string;
  entityType: AuditEntityType;
  entityId?: string;
  summary: string;
};

export type ActivityAuditRecord = {
  id: string;
  userId: string;
  entityType: AuditEntityType;
  entityId: string | null;
  action: AuditAction;
  metadata: unknown;
  createdAt: Date | string;
};

export type ActivityHistoryStore = {
  listRecent(userId: string, take: number): Promise<ActivityAuditRecord[]>;
  findOwnedTransaction(userId: string, transactionId: string): Promise<{ id: string; userId: string } | null>;
  listForTransaction(userId: string, transactionId: string, take: number): Promise<ActivityAuditRecord[]>;
};

const entityLabels: Record<AuditEntityType, string> = {
  USER: "Account",
  SETTINGS: "Settings",
  CATEGORY: "Category",
  TRANSACTION: "Transaction",
  IMPORT_BATCH: "Import",
  IMPORT_ROW: "Import row",
  BANK_IMPORT_PROFILE: "Import profile",
  MERCHANT_PROFILE: "Merchant",
  MERCHANT_ALIAS: "Merchant alias",
  MERCHANT_RULE: "Merchant rule",
  PROPERTY: "Property",
  LOAN_ACCOUNT: "Loan",
  LOAN_REPAYMENT: "Loan repayment",
  LOAN_RECONCILIATION_LINK: "Loan reconciliation",
  RECURRING_ITEM: "Regular payment",
  RECURRING_SUGGESTION_DISMISSAL: "Regular-payment preference",
  CATEGORY_BUDGET: "Budget",
  BULK_OPERATION: "Bulk operation",
  TRANSFER_LINK: "Transfer link",
  IMPORT_UNDO_OPERATION: "Import undo",
  RECURRING_INSTANCE: "Regular-payment instance",
  SAVINGS_GOAL: "Savings goal",
  SAVINGS_GOAL_CONTRIBUTION: "Savings contribution",
  NET_WORTH_ITEM: "Net-worth item",
  NET_WORTH_VALUATION: "Net-worth valuation",
  NET_WORTH_SNAPSHOT: "Net-worth snapshot",
  REMINDER_PREFERENCE: "Reminder preference",
  REMINDER: "Reminder",
  HOUSEHOLD: "Household",
  HOUSEHOLD_MEMBERSHIP: "Household membership",
  HOUSEHOLD_INVITATION: "Household invitation",
  HOUSEHOLD_RECORD_SHARE: "Shared record",
  ACCOUNTANT_ACCESS_GRANT: "Accountant access",
  ACCOUNTANT_ACCESS_SCOPE: "Accountant scope",
  DOCUMENT: "Document record",
  DOCUMENT_LINK: "Document link",
};

const actionLabels: Record<AuditAction, string> = {
  CREATED: "Created",
  UPDATED: "Updated",
  DELETED: "Deleted",
  ARCHIVED: "Archived",
  DEACTIVATED: "Deactivated",
  IMPORTED: "Imported",
  SKIPPED: "Skipped",
  MERGED: "Merged",
  REVIEWED: "Reviewed",
  PRIVACY_FIELDS_EXCLUDED: "Privacy checked",
};

function familyFor(entityType: AuditEntityType): ActivityFamily {
  if (["TRANSACTION", "BULK_OPERATION", "TRANSFER_LINK"].includes(entityType)) return "Transactions";
  if (["IMPORT_BATCH", "IMPORT_ROW", "BANK_IMPORT_PROFILE", "IMPORT_UNDO_OPERATION"].includes(entityType)) return "Imports";
  if (["CATEGORY", "MERCHANT_PROFILE", "MERCHANT_ALIAS", "MERCHANT_RULE"].includes(entityType)) return "Categories";
  if (["LOAN_ACCOUNT", "LOAN_REPAYMENT", "LOAN_RECONCILIATION_LINK"].includes(entityType)) return "Loans";
  if (entityType === "PROPERTY") return "Properties";
  if (entityType === "CATEGORY_BUDGET") return "Budgets";
  if (["RECURRING_ITEM", "RECURRING_SUGGESTION_DISMISSAL", "RECURRING_INSTANCE", "REMINDER", "REMINDER_PREFERENCE"].includes(entityType)) return "Regular payments";
  if (["SAVINGS_GOAL", "SAVINGS_GOAL_CONTRIBUTION", "NET_WORTH_ITEM", "NET_WORTH_VALUATION", "NET_WORTH_SNAPSHOT"].includes(entityType)) return "Planning";
  if (["HOUSEHOLD", "HOUSEHOLD_MEMBERSHIP", "HOUSEHOLD_INVITATION", "HOUSEHOLD_RECORD_SHARE", "ACCOUNTANT_ACCESS_GRANT", "ACCOUNTANT_ACCESS_SCOPE"].includes(entityType)) return "Collaboration";
  if (["DOCUMENT", "DOCUMENT_LINK"].includes(entityType)) return "Documents";
  return "Account";
}

function metadataObject(metadata: unknown): Record<string, unknown> | null {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? metadata as Record<string, unknown>
    : null;
}

function safeCount(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key];
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 100_000
    ? value
    : null;
}

function propertyLinkSummary(metadata: Record<string, unknown> | null) {
  const state = metadata?.propertyLinkState;
  if (state === "LINKED") return "Property linked to transaction.";
  if (state === "RELINKED") return "Property link updated.";
  if (state === "UNLINKED") return "Property link removed.";
  return null;
}

function importUndoSummary(action: AuditAction, metadata: Record<string, unknown> | null) {
  if (action === "CREATED") return "Import undo started.";
  if (action !== "UPDATED") return null;
  const undone = safeCount(metadata, "undoneCount");
  const blocked = safeCount(metadata, "blockedCount");
  const failed = safeCount(metadata, "failedCount");
  const restored = safeCount(metadata, "restoredCount");
  const restoreBlocked = safeCount(metadata, "restoreBlockedCount");
  if (restored !== null || restoreBlocked !== null) {
    return `Import restore completed${restored !== null ? ` for ${restored} row${restored === 1 ? "" : "s"}` : ""}${restoreBlocked ? `; ${restoreBlocked} row${restoreBlocked === 1 ? " was" : "s were"} left unchanged` : ""}.`;
  }
  if (undone !== null || blocked !== null || failed !== null) {
    const unchanged = (blocked ?? 0) + (failed ?? 0);
    return `Import undo completed${undone !== null ? ` for ${undone} eligible row${undone === 1 ? "" : "s"}` : ""}${unchanged ? `; ${unchanged} row${unchanged === 1 ? " was" : "s were"} left unchanged` : ""}.`;
  }
  return "Import undo updated.";
}

function bulkOperationSummary(action: AuditAction, metadata: Record<string, unknown> | null) {
  if (action === "CREATED") return "Bulk operation started.";
  const applied = safeCount(metadata, "appliedCount");
  const skipped = safeCount(metadata, "skippedCount");
  const failed = safeCount(metadata, "failedCount");
  if (applied !== null || skipped !== null || failed !== null) {
    const unchanged = (skipped ?? 0) + (failed ?? 0);
    return `Bulk operation completed${applied !== null ? ` for ${applied} transaction${applied === 1 ? "" : "s"}` : ""}${unchanged ? `; ${unchanged} transaction${unchanged === 1 ? " was" : "s were"} left unchanged` : ""}.`;
  }
  if (action === "DELETED" || action === "DEACTIVATED") return "Bulk operation undone where still eligible.";
  return "Bulk operation updated.";
}

function safeSummary(record: ActivityAuditRecord) {
  const metadata = metadataObject(record.metadata);
  if (record.entityType === "TRANSACTION") {
    const propertySummary = propertyLinkSummary(metadata);
    if (propertySummary) return propertySummary;
  }
  if (record.entityType === "TRANSFER_LINK") {
    if (record.action === "CREATED") return "Transfer link confirmed.";
    if (["DELETED", "DEACTIVATED"].includes(record.action)) return "Transfer link removed.";
  }
  if (record.entityType === "IMPORT_ROW") {
    if (record.action === "MERGED") return "Import row merged after review.";
    if (record.action === "SKIPPED") return "Import row skipped after review.";
    if (record.action === "IMPORTED" || record.action === "CREATED") return "Import row committed after review.";
  }
  if (record.entityType === "IMPORT_UNDO_OPERATION") {
    return importUndoSummary(record.action, metadata) ?? "Import undo updated.";
  }
  if (record.entityType === "BULK_OPERATION") {
    return bulkOperationSummary(record.action, metadata);
  }
  if (record.entityType === "LOAN_RECONCILIATION_LINK") {
    if (record.action === "CREATED") return "Loan repayment linked to a transaction.";
    if (["DEACTIVATED", "DELETED"].includes(record.action)) return "Loan repayment link removed.";
  }
  const label = entityLabels[record.entityType];
  const action = actionLabels[record.action].toLocaleLowerCase("en-AU");
  return `${label} ${action}.`;
}

export function mapActivityHistoryItem(record: ActivityAuditRecord, includeEntityId = false): ActivityHistoryItem {
  return {
    id: record.id,
    occurredAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : new Date(record.createdAt).toISOString(),
    family: familyFor(record.entityType),
    actionLabel: actionLabels[record.action],
    entityType: record.entityType,
    ...(includeEntityId && record.entityId ? { entityId: record.entityId } : {}),
    summary: safeSummary(record),
  };
}

export function createPrismaActivityHistoryStore(prisma: PrismaClient = getPrismaClient()): ActivityHistoryStore {
  const select = {
    id: true,
    userId: true,
    entityType: true,
    entityId: true,
    action: true,
    metadata: true,
    createdAt: true,
  } as const;
  return {
    async listRecent(userId, take) {
      return prisma.auditEvent.findMany({
        where: { userId },
        select,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take,
      }) as unknown as Promise<ActivityAuditRecord[]>;
    },
    async findOwnedTransaction(userId, transactionId) {
      return prisma.transaction.findFirst({
        where: { id: transactionId, userId },
        select: { id: true, userId: true },
      });
    },
    async listForTransaction(userId, transactionId, take) {
      return prisma.auditEvent.findMany({
        where: { userId, entityType: "TRANSACTION", entityId: transactionId },
        select,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take,
      }) as unknown as Promise<ActivityAuditRecord[]>;
    },
  };
}

export async function listRecentActivityHistory(
  context: AuthenticatedUserContext | null | undefined,
  store: ActivityHistoryStore = createPrismaActivityHistoryStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  const records = await store.listRecent(user.userId, 100);
  return records.map((record) => mapActivityHistoryItem(record));
}

export async function listTransactionActivityHistory(
  context: AuthenticatedUserContext | null | undefined,
  transactionId: string,
  store: ActivityHistoryStore = createPrismaActivityHistoryStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  const transaction = await store.findOwnedTransaction(user.userId, transactionId);
  assertUserOwnsRecord(user, transaction, "transaction");
  const records = await store.listForTransaction(user.userId, transactionId, 50);
  return records.map((record) => mapActivityHistoryItem(record, true));
}
