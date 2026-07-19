import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";
import { isVerifiedPreviewRuntime } from "@/src/server/preview-runtime";

export const ACCOUNT_EXPORT_CONTRACT = "spendgrove.account-export";
export const ACCOUNT_EXPORT_VERSION = 1 as const;

type JsonPrimitive = string | number | boolean | null;
export type ExportJsonValue = JsonPrimitive | ExportJsonValue[] | { [key: string]: ExportJsonValue };
export type ExportRecord = { [key: string]: ExportJsonValue };

export type AccountExportData = {
  profile: ExportRecord;
  settings: ExportRecord | null;
  categories: ExportRecord[];
  transactions: ExportRecord[];
  importBatches: ExportRecord[];
  importRows: ExportRecord[];
  bankImportProfiles: ExportRecord[];
  merchantProfiles: ExportRecord[];
  merchantAliases: ExportRecord[];
  merchantRules: ExportRecord[];
  properties: ExportRecord[];
  loanAccounts: ExportRecord[];
  loanRepayments: ExportRecord[];
  loanReconciliationLinks: ExportRecord[];
  propertyTransactionLinks: ExportRecord[];
  propertyReportReviews: ExportRecord[];
  recurringItems: ExportRecord[];
  recurringSuggestionDismissals: ExportRecord[];
  categoryBudgets: ExportRecord[];
  bulkOperations: ExportRecord[];
  transferLinks: ExportRecord[];
  importUndoOperations: ExportRecord[];
  savingsGoals: ExportRecord[];
  savingsGoalContributions: ExportRecord[];
  netWorthItems: ExportRecord[];
  netWorthValuations: ExportRecord[];
  netWorthSnapshots: ExportRecord[];
  netWorthSnapshotEntries: ExportRecord[];
  recurringLifecycle: ExportRecord[];
  recurringInstances: ExportRecord[];
  reminderPreferences: ExportRecord[];
  reminders: ExportRecord[];
  households: ExportRecord[];
  householdMemberships: ExportRecord[];
  householdInvitations: ExportRecord[];
  householdShares: ExportRecord[];
  accountantGrantsOwned: ExportRecord[];
  accountantGrantsAccepted: ExportRecord[];
  accountantScopesOwned: ExportRecord[];
  accountantScopesAccepted: ExportRecord[];
  documents: ExportRecord[];
  documentLinks: ExportRecord[];
  auditEvents: ExportRecord[];
};

export type SpendGroveAccountExport = {
  contract: typeof ACCOUNT_EXPORT_CONTRACT;
  version: typeof ACCOUNT_EXPORT_VERSION;
  generatedAt: string;
  currency: "AUD";
  calendarTimezone: string;
  moneyRepresentation: "signed integer cents";
  australianDateRepresentation: "YYYY-MM-DD";
  timestampRepresentation: "UTC ISO 8601";
  recordCounts: Record<string, number>;
  data: AccountExportData;
};

export type AccountExportStore = {
  read(userId: string): Promise<AccountExportData | null>;
};

export class AccountExportUnavailableError extends Error {
  constructor() {
    super("Your account export could not be prepared safely. Please try again.");
    this.name = "AccountExportUnavailableError";
  }
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toSafeJson(value: unknown, dateOnly = false): ExportJsonValue {
  if (value === null) return null;
  if (value instanceof Date) return dateOnly ? toDateOnly(value) : value.toISOString();
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((item) => toSafeJson(item));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, toSafeJson(item)]),
    );
  }
  throw new AccountExportUnavailableError();
}

function serializeRecord<T extends object>(record: T, dateOnlyFields: readonly string[] = []): ExportRecord {
  const dateFields = new Set(dateOnlyFields);
  return Object.fromEntries(
    Object.entries(record)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toSafeJson(value, dateFields.has(key))]),
  );
}

function serializeRows<T extends object>(rows: T[], dateOnlyFields: readonly string[] = []) {
  return rows.map((row) => serializeRecord(row, dateOnlyFields));
}

const defaultAccountExportStore: AccountExportStore = {
  async read(userId) {
    const db = getPrismaClient();
    const [
      profile,
      settings,
      categories,
      transactions,
      importBatches,
      importRows,
      bankImportProfiles,
      merchantProfiles,
      merchantAliases,
      merchantRules,
      properties,
      loanAccounts,
      loanRepayments,
      loanReconciliationLinks,
      propertyTransactionLinks,
      propertyReportReviews,
      recurringItems,
      recurringSuggestionDismissals,
      categoryBudgets,
      auditEvents,
    ] = await db.$transaction([
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, name: true, status: true, country: true, timezone: true,
          createdAt: true, updatedAt: true,
        },
      }),
      db.userSettings.findUnique({
        where: { userId },
        select: {
          id: true, userId: true, simpleMode: true, currency: true, locale: true,
          financialYearStartMonth: true, featureFlags: true, createdAt: true, updatedAt: true,
        },
      }),
      db.category.findMany({
        where: { userId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true, userId: true, name: true, type: true, parentId: true, colour: true, icon: true,
          isSeeded: true, isArchived: true, deletedAt: true, sortOrder: true, createdAt: true, updatedAt: true,
        },
      }),
      db.transaction.findMany({
        where: { userId },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        select: {
          id: true, userId: true, categoryId: true, importBatchId: true, merchantProfileId: true,
          type: true, source: true, status: true, splitRole: true, parentTransactionId: true,
          amountCents: true, date: true, description: true, importedDescriptionSanitized: true,
          merchantName: true, notes: true, reviewedAt: true, deletedAt: true, createdAt: true, updatedAt: true,
        },
      }),
      db.importBatch.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true, userId: true, type: true, status: true, bankImportProfileId: true,
          fileSizeBytes: true, rowCount: true, parsedRowCount: true, privateFieldCount: true,
          importedCount: true, skippedCount: true, mergedCount: true, warningCodes: true,
          createdAt: true, completedAt: true, deletedAt: true, updatedAt: true,
        },
      }),
      db.importRow.findMany({
        where: { userId },
        orderBy: [{ importBatchId: "asc" }, { rowNumber: "asc" }],
        select: {
          id: true, userId: true, importBatchId: true, rowNumber: true, action: true, status: true,
          mappedDate: true, amountCents: true, categoryId: true, matchedTransactionId: true,
          committedTransactionId: true, warningCodes: true, createdAt: true, updatedAt: true,
        },
      }),
      db.bankImportProfile.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true, userId: true, displayName: true, bankName: true, accountType: true, hasHeader: true,
          dateFormats: true, columnMapping: true, ignoredHeaders: true, privateHeaderPatterns: true,
          confidence: true, isUserConfirmed: true, createdAt: true, updatedAt: true,
        },
      }),
      db.merchantProfile.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true, userId: true, name: true, normalizedName: true, defaultCategoryId: true,
          isActive: true, deletedAt: true, createdAt: true, updatedAt: true,
        },
      }),
      db.merchantAlias.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true, userId: true, merchantProfileId: true, aliasName: true, normalizedAlias: true,
          isActive: true, deactivatedAt: true, deletedAt: true, createdAt: true, updatedAt: true,
        },
      }),
      db.merchantRule.findMany({
        where: { userId },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        select: {
          id: true, userId: true, merchantProfileId: true, categoryId: true, type: true, pattern: true,
          normalizedPattern: true, priority: true, isActive: true, deactivatedAt: true, deletedAt: true,
          createdAt: true, updatedAt: true,
        },
      }),
      db.property.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true, userId: true, nickname: true, usage: true, isArchived: true, archivedAt: true,
          deletedAt: true, createdAt: true, updatedAt: true,
        },
      }),
      db.loanAccount.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true, userId: true, propertyId: true, nickname: true, lenderName: true, purpose: true,
          type: true, currentBalanceCents: true, balanceAsOf: true, isArchived: true, archivedAt: true,
          deletedAt: true, createdAt: true, updatedAt: true,
        },
      }),
      db.loanRepayment.findMany({
        where: { userId },
        orderBy: [{ repaymentDate: "asc" }, { createdAt: "asc" }],
        select: {
          id: true, userId: true, loanAccountId: true, importBatchId: true, repaymentDate: true,
          totalPaymentCents: true, principalCents: true, interestCents: true, feeCents: true,
          balanceAfterCents: true, source: true, reconciliationStatus: true, isArchived: true,
          archivedAt: true, deletedAt: true, createdAt: true, updatedAt: true,
        },
      }),
      db.loanReconciliationLink.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true, userId: true, loanRepaymentId: true, transactionId: true, confidence: true,
          amountVarianceCents: true, dateDifferenceDays: true, method: true, reason: true,
          unlinkedAt: true, createdAt: true, updatedAt: true,
        },
      }),
      db.propertyTransactionLink.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true, userId: true, transactionId: true, propertyId: true, unlinkedAt: true,
          createdAt: true, updatedAt: true,
        },
      }),
      db.propertyReportReview.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true, userId: true, propertyId: true, transactionId: true, classification: true,
          createdAt: true, updatedAt: true,
        },
      }),
      db.recurringItem.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true, userId: true, categoryId: true, label: true, transactionType: true,
          expectedAmountCents: true, cadence: true, nextExpectedDate: true, status: true,
          archivedAt: true, createdAt: true, updatedAt: true,
        },
      }),
      db.recurringSuggestionDismissal.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true, userId: true, suggestionKey: true, dismissedAt: true, createdAt: true, updatedAt: true,
        },
      }),
      db.categoryBudget.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true, userId: true, categoryId: true, amountCents: true, period: true, status: true,
          archivedAt: true, createdAt: true, updatedAt: true,
        },
      }),
      db.auditEvent.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true, userId: true, entityType: true, entityId: true, action: true, createdAt: true,
        },
      }),
    ]);

    if (!profile) return null;

    const bulkOperations = isVerifiedPreviewRuntime()
      ? await db.bulkOperation.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          userId: true,
          type: true,
          status: true,
          requestedCount: true,
          appliedCount: true,
          skippedCount: true,
          failedCount: true,
          undoBlockedCount: true,
          createdAt: true,
          completedAt: true,
          undoExpiresAt: true,
          revertedAt: true,
          updatedAt: true,
        },
      })
      : [];

    const transferLinks = isVerifiedPreviewRuntime()
      ? await db.transferLink.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          userId: true,
          outgoingTransactionId: true,
          incomingTransactionId: true,
          confirmedAt: true,
          unlinkedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      : [];

    const importUndoOperations = isVerifiedPreviewRuntime()
      ? await db.importUndoOperation.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          userId: true,
          importBatchId: true,
          status: true,
          requestedCount: true,
          undoneCount: true,
          noChangeCount: true,
          blockedCount: true,
          failedCount: true,
          restoredCount: true,
          restoreBlockedCount: true,
          createdAt: true,
          completedAt: true,
          restoredAt: true,
          updatedAt: true,
        },
      })
      : [];

    const [savingsGoals, savingsGoalContributions] = isVerifiedPreviewRuntime()
      ? await db.$transaction([
        db.savingsGoal.findMany({
          where: { userId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true, userId: true, name: true, targetAmountCents: true, targetDate: true,
            openingProgressCents: true, status: true, completedAt: true, archivedAt: true,
            createdAt: true, updatedAt: true,
          },
        }),
        db.savingsGoalContribution.findMany({
          where: { userId },
          orderBy: [{ contributionDate: "asc" }, { createdAt: "asc" }],
          select: {
            id: true, userId: true, savingsGoalId: true, amountCents: true,
            contributionDate: true, note: true, deletedAt: true, createdAt: true, updatedAt: true,
          },
        }),
      ])
      : [[], []];

    const [netWorthItems, netWorthValuations, netWorthSnapshots, netWorthSnapshotEntries] = isVerifiedPreviewRuntime()
      ? await db.$transaction([
        db.netWorthItem.findMany({
          where: { userId }, orderBy: { createdAt: "asc" },
          select: {
            id: true, userId: true, propertyId: true, loanAccountId: true, name: true,
            kind: true, category: true, status: true, archivedAt: true, createdAt: true, updatedAt: true,
          },
        }),
        db.netWorthValuation.findMany({
          where: { userId }, orderBy: [{ valuationDate: "asc" }, { createdAt: "asc" }],
          select: {
            id: true, userId: true, netWorthItemId: true, valueCents: true, valuationDate: true,
            note: true, deletedAt: true, createdAt: true, updatedAt: true,
          },
        }),
        db.netWorthSnapshot.findMany({
          where: { userId }, orderBy: { snapshotDate: "asc" },
          select: {
            id: true, userId: true, snapshotDate: true, totalAssetCents: true,
            totalLiabilityCents: true, netWorthCents: true, archivedAt: true, createdAt: true, updatedAt: true,
          },
        }),
        db.netWorthSnapshotEntry.findMany({
          where: { userId }, orderBy: { createdAt: "asc" },
          select: {
            id: true, userId: true, snapshotId: true, netWorthItemId: true, itemName: true,
            kind: true, category: true, valueCents: true, valuationDate: true, createdAt: true,
          },
        }),
      ])
      : [[], [], [], []];

    const [recurringLifecycle, recurringInstances] = isVerifiedPreviewRuntime()
      ? await db.$transaction([
        db.recurringItem.findMany({
          where: { userId }, orderBy: { createdAt: "asc" },
          select: {
            id: true, userId: true, categoryId: true, label: true, transactionType: true,
            expectedAmountCents: true, expectedAmountMinCents: true, expectedAmountMaxCents: true,
            cadence: true, nextExpectedDate: true, source: true, detectionConfidence: true,
            status: true, archivedAt: true, createdAt: true, updatedAt: true,
          },
        }),
        db.recurringInstance.findMany({
          where: { userId }, orderBy: { linkedAt: "asc" },
          select: {
            id: true, userId: true, recurringItemId: true, transactionId: true,
            linkedAt: true, unlinkedAt: true, createdAt: true, updatedAt: true,
          },
        }),
      ])
      : [[], []];

    const [reminderPreferences, reminders] = isVerifiedPreviewRuntime()
      ? await db.$transaction([
        db.reminderPreference.findMany({
          where: { userId },
          orderBy: { family: "asc" },
          select: {
            id: true, userId: true, family: true, isEnabled: true,
            leadDays: true, thresholdPercent: true, createdAt: true, updatedAt: true,
          },
        }),
        db.reminder.findMany({
          where: { userId },
          orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
          select: {
            id: true, userId: true, family: true, sourceEntityId: true,
            dueDate: true, status: true, acknowledgedAt: true, dismissedAt: true,
            archivedAt: true, createdAt: true, updatedAt: true,
          },
        }),
      ])
      : [[], []];

    const [households, householdMemberships, householdInvitations, householdShares] = isVerifiedPreviewRuntime()
      ? await db.$transaction([
        db.household.findMany({
          where: { creatorUserId: userId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true, creatorUserId: true, name: true, status: true,
            archivedAt: true, createdAt: true, updatedAt: true,
          },
        }),
        db.householdMembership.findMany({
          where: { userId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true, householdId: true, userId: true, role: true, status: true,
            joinedAt: true, endedAt: true, createdAt: true, updatedAt: true,
          },
        }),
        db.householdInvitation.findMany({
          where: { OR: [{ inviterUserId: userId }, { acceptedUserId: userId }] },
          orderBy: { createdAt: "asc" },
          select: {
            id: true, householdId: true, inviterUserId: true, acceptedUserId: true,
            role: true, status: true, expiresAt: true, acceptedAt: true,
            revokedAt: true, createdAt: true, updatedAt: true,
          },
        }),
        db.householdRecordShare.findMany({
          where: { ownerUserId: userId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true, householdId: true, ownerUserId: true, entityType: true,
            entityId: true, sharedAt: true, revokedAt: true, createdAt: true, updatedAt: true,
          },
        }),
      ])
      : [[], [], [], []];

    const [
      accountantGrantsOwned,
      accountantGrantsAccepted,
      accountantScopesOwned,
      accountantScopesAccepted,
    ] = isVerifiedPreviewRuntime()
      ? await db.$transaction([
        db.accountantAccessGrant.findMany({
          where: { ownerUserId: userId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true, status: true, expiresAt: true, acceptedAt: true,
            revokedAt: true, createdAt: true, updatedAt: true,
          },
        }),
        db.accountantAccessGrant.findMany({
          where: { accountantUserId: userId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true, status: true, expiresAt: true, acceptedAt: true,
            revokedAt: true, createdAt: true, updatedAt: true,
          },
        }),
        db.accountantAccessScope.findMany({
          where: { ownerUserId: userId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true, grantId: true, scopeType: true, scopeKey: true,
            entityId: true, sharedAt: true, revokedAt: true, createdAt: true, updatedAt: true,
          },
        }),
        db.accountantAccessScope.findMany({
          where: { grant: { accountantUserId: userId } },
          orderBy: { createdAt: "asc" },
          select: {
            id: true, grantId: true, scopeType: true, scopeKey: true,
            entityId: true, sharedAt: true, revokedAt: true, createdAt: true, updatedAt: true,
          },
        }),
      ])
      : [[], [], [], []];

    const [documents, documentLinks] = isVerifiedPreviewRuntime()
      ? await db.$transaction([
        db.document.findMany({
          where: { userId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true, userId: true, displayName: true, category: true,
            status: true, contentType: true, sizeBytes: true, documentDate: true,
            financialYear: true, availableAt: true, quarantinedAt: true,
            failedAt: true, deletedAt: true, providerDeletedAt: true,
            createdAt: true, updatedAt: true,
          },
        }),
        db.documentLink.findMany({
          where: { userId },
          orderBy: { createdAt: "asc" },
          select: {
            id: true, userId: true, documentId: true, targetType: true,
            targetKey: true, targetEntityId: true, linkedAt: true,
            revokedAt: true, createdAt: true, updatedAt: true,
          },
        }),
      ])
      : [[], []];

    return {
      profile: serializeRecord(profile),
      settings: settings ? serializeRecord(settings) : null,
      categories: serializeRows(categories),
      transactions: serializeRows(transactions, ["date"]),
      importBatches: serializeRows(importBatches),
      importRows: serializeRows(importRows, ["mappedDate"]),
      bankImportProfiles: serializeRows(bankImportProfiles),
      merchantProfiles: serializeRows(merchantProfiles),
      merchantAliases: serializeRows(merchantAliases),
      merchantRules: serializeRows(merchantRules),
      properties: serializeRows(properties),
      loanAccounts: serializeRows(loanAccounts, ["balanceAsOf"]),
      loanRepayments: serializeRows(loanRepayments, ["repaymentDate"]),
      loanReconciliationLinks: serializeRows(loanReconciliationLinks),
      propertyTransactionLinks: serializeRows(propertyTransactionLinks),
      propertyReportReviews: serializeRows(propertyReportReviews),
      recurringItems: serializeRows(recurringItems, ["nextExpectedDate"]),
      recurringSuggestionDismissals: serializeRows(recurringSuggestionDismissals),
      categoryBudgets: serializeRows(categoryBudgets),
      bulkOperations: serializeRows(bulkOperations),
      transferLinks: serializeRows(transferLinks),
      importUndoOperations: serializeRows(importUndoOperations),
      savingsGoals: serializeRows(savingsGoals, ["targetDate"]),
      savingsGoalContributions: serializeRows(savingsGoalContributions, ["contributionDate"]),
      netWorthItems: serializeRows(netWorthItems),
      netWorthValuations: serializeRows(netWorthValuations, ["valuationDate"]),
      netWorthSnapshots: serializeRows(netWorthSnapshots, ["snapshotDate"]),
      netWorthSnapshotEntries: serializeRows(netWorthSnapshotEntries, ["valuationDate"]),
      recurringLifecycle: serializeRows(recurringLifecycle, ["nextExpectedDate"]),
      recurringInstances: serializeRows(recurringInstances),
      reminderPreferences: serializeRows(reminderPreferences),
      reminders: serializeRows(reminders, ["dueDate"]),
      households: serializeRows(households),
      householdMemberships: serializeRows(householdMemberships),
      householdInvitations: serializeRows(householdInvitations),
      householdShares: serializeRows(householdShares),
      accountantGrantsOwned: serializeRows(accountantGrantsOwned),
      accountantGrantsAccepted: serializeRows(accountantGrantsAccepted),
      accountantScopesOwned: serializeRows(accountantScopesOwned),
      accountantScopesAccepted: serializeRows(accountantScopesAccepted),
      documents: serializeRows(documents, ["documentDate"]),
      documentLinks: serializeRows(documentLinks),
      auditEvents: serializeRows(auditEvents),
    };
  },
};

function countRecords(data: AccountExportData) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => Array.isArray(value))
      .map(([key, value]) => [key, (value as ExportRecord[]).length]),
  );
}

export async function createAccountExport(
  context: AuthenticatedUserContext | null | undefined,
  store: AccountExportStore = defaultAccountExportStore,
  now = new Date(),
): Promise<SpendGroveAccountExport> {
  const user = requireAuthenticatedUserContext(context);
  const data = await store.read(user.userId);
  if (!data) throw new AccountExportUnavailableError();

  return {
    contract: ACCOUNT_EXPORT_CONTRACT,
    version: ACCOUNT_EXPORT_VERSION,
    generatedAt: now.toISOString(),
    currency: "AUD",
    calendarTimezone: typeof data.profile.timezone === "string"
      ? data.profile.timezone
      : "Australia/Brisbane",
    moneyRepresentation: "signed integer cents",
    australianDateRepresentation: "YYYY-MM-DD",
    timestampRepresentation: "UTC ISO 8601",
    recordCounts: countRecords(data),
    data,
  };
}

export function accountExportFileName(now = new Date()) {
  return `spendgrove-account-export-${now.toISOString().slice(0, 10)}.json`;
}
