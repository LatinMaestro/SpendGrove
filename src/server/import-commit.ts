import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient, type TransactionType } from "@prisma/client";
import { getManualCategory, manualCategories, type ManualCategory, type ManualCategoryType } from "@/lib/manual-categories";
import { normalizeMerchantName } from "@/lib/merchant-rules";
import { importCommitRequestSchema, type ImportCommitRequest, type ImportCommitSummary } from "@/lib/import-commit";
import { auditEventSchema } from "@/lib/validation/audit";
import { assertNoPrivateBankIdentifiers, sanitizeBankDescription, sanitizeTransactionNarration } from "@/lib/validation/privacy";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { OwnershipError, requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";
import { createPropertyLinkAuditEvent } from "@/src/server/property-transaction-links";
import { autoReconcileHighConfidenceRepaymentsForTransactions } from "@/src/server/loan-auto-reconciliation";

export class ImportCommitConflictError extends Error {
  constructor(message = "This reviewed import is already being committed. Please refresh before trying again.") {
    super(message);
    this.name = "ImportCommitConflictError";
  }
}

type ImportCommitStore = {
  commit(userId: string, request: ImportCommitRequest, now: Date): Promise<ImportCommitSummary>;
};

const categoryGroupTypes: Record<string, ManualCategoryType> = {
  Income: "INCOME",
  "Everyday spending": "EXPENSE",
  "Bills and household": "EXPENSE",
  Financial: "EXPENSE",
  "Work and tax": "EXPENSE",
  Review: "EXPENSE",
};
const categoryGroupOrder = ["Income", "Everyday spending", "Bills and household", "Financial", "Work and tax", "Review"];

function dateOnlyToUtcDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("A reviewed row contains an invalid transaction date.");
  }
  return date;
}

function transactionType(categoryType: ManualCategoryType | string): TransactionType {
  if (categoryType === "INCOME") return "INCOME";
  if (categoryType === "TRANSFER") return "TRANSFER";
  return "EXPENSE";
}

function categoryChildSortOrder(category: ManualCategory) {
  const index = manualCategories.filter((candidate) => candidate.group === category.group).findIndex((candidate) => candidate.id === category.id);
  return index >= 0 ? index : 0;
}

async function resolveOwnedCategory(tx: Prisma.TransactionClient, userId: string, categoryId: string) {
  const seeded = getManualCategory(categoryId);
  if (seeded) {
    const parentType = categoryGroupTypes[seeded.group] ?? seeded.type;
    const parent = await tx.category.upsert({
      where: { userId_name_type: { userId, name: seeded.group, type: parentType } },
      update: { isSeeded: true, isArchived: false, deletedAt: null, sortOrder: Math.max(0, categoryGroupOrder.indexOf(seeded.group)) },
      create: { userId, name: seeded.group, type: parentType, isSeeded: true, sortOrder: Math.max(0, categoryGroupOrder.indexOf(seeded.group)) },
    });
    return tx.category.upsert({
      where: { userId_name_type: { userId, name: seeded.name, type: seeded.type } },
      update: { parentId: parent.id, isSeeded: true, isArchived: false, deletedAt: null, sortOrder: categoryChildSortOrder(seeded) },
      create: { userId, name: seeded.name, type: seeded.type, parentId: parent.id, isSeeded: true, sortOrder: categoryChildSortOrder(seeded) },
      select: { id: true, type: true },
    });
  }
  const owned = await tx.category.findFirst({
    where: { id: categoryId, userId, isArchived: false, deletedAt: null },
    select: { id: true, type: true },
  });
  if (!owned) throw new OwnershipError("approved category");
  return owned;
}

function summaryFromBatch(batch: {
  id: string;
  rowCount: number;
  importedCount: number;
  skippedCount: number;
  mergedCount: number;
  warningCodes: string[];
}, alreadyCommitted: boolean): ImportCommitSummary {
  return {
    batchId: batch.id,
    totalCount: batch.rowCount,
    importedCount: batch.importedCount,
    skippedCount: batch.skippedCount,
    mergedCount: batch.mergedCount,
    warningCount: batch.warningCodes.length,
    alreadyCommitted,
  };
}

export function createPrismaImportCommitStore(prisma: PrismaClient = getPrismaClient()): ImportCommitStore {
  return {
    async commit(userId, request, now) {
      const existing = await prisma.importBatch.findUnique({ where: { id: request.requestId } });
      if (existing) {
        if (existing.userId !== userId) throw new OwnershipError("import batch");
        if (existing.status !== "COMPLETED") throw new ImportCommitConflictError();
        return summaryFromBatch(existing, true);
      }

      try {
        const committed = await prisma.$transaction(async (tx) => {
          const importedCount = request.rows.filter((row) => row.action === "IMPORT").length;
          const skippedCount = request.rows.filter((row) => row.action === "SKIP").length;
          const mergedCount = request.rows.filter((row) => row.action === "MERGE").length;
          const warningCodes = Array.from(new Set([
            ...request.metadata.warningCodes,
            ...request.rows.flatMap((row) => row.warningCodes),
          ])).sort();

          const batch = await tx.importBatch.create({
            data: {
              id: request.requestId,
              userId,
              status: "COMPLETED",
              rowCount: request.rows.length,
              parsedRowCount: request.metadata.parsedRowCount,
              privateFieldCount: request.metadata.privateFieldCount,
              importedCount,
              skippedCount,
              mergedCount,
              detectedBankName: request.metadata.detectedBankName,
              mappingSummary: {
                hasHeader: request.metadata.hasHeader,
                amountMode: request.metadata.amountMode,
                detectedDateFormats: request.metadata.detectedDateFormats,
              },
              warningCodes,
              completedAt: now,
            },
          });

          const reviewedRows = request.rows.filter((row) => row.action !== "SKIP");
          const categoryByRequestedId = new Map<string, { id: string; type: string }>();
          for (const categoryId of new Set(reviewedRows.map((row) => row.categoryId))) {
            categoryByRequestedId.set(categoryId, await resolveOwnedCategory(tx, userId, categoryId));
          }

          const mergeTargetIds = request.rows.flatMap((row) => row.action === "MERGE" ? [row.targetTransactionId] : []);
          const mergeTargets = mergeTargetIds.length === 0 ? [] : await tx.transaction.findMany({
            where: {
              id: { in: mergeTargetIds },
              userId,
              source: "MANUAL",
              status: "ACTIVE",
              deletedAt: null,
              splitRole: { not: "PARENT" },
            },
            select: { id: true },
          });
          const availableMergeTargets = new Set(mergeTargets.map((target) => target.id));
          if (mergeTargetIds.some((targetId) => !availableMergeTargets.has(targetId))) {
            throw new OwnershipError("manual merge target");
          }

          const propertyLinkPropertyIds = Array.from(new Set(request.rows.flatMap((row) => (
            row.action === "IMPORT" && row.propertyLinkPropertyId ? [row.propertyLinkPropertyId] : []
          ))));
          const propertyLinkProperties = propertyLinkPropertyIds.length === 0 ? [] : await tx.property.findMany({
            where: {
              id: { in: propertyLinkPropertyIds },
              userId,
              isArchived: false,
              deletedAt: null,
            },
            select: { id: true },
          });
          const activePropertyIds = new Set(propertyLinkProperties.map((property) => property.id));
          if (propertyLinkPropertyIds.some((propertyId) => !activePropertyIds.has(propertyId))) {
            throw new OwnershipError("active Property");
          }

          const normalizedMerchantByRow = new Map<number, string>();
          reviewedRows.forEach((row) => {
            try { normalizedMerchantByRow.set(row.rowNumber, normalizeMerchantName(row.merchantName)); } catch { /* no profile link */ }
          });
          const normalizedMerchantNames = Array.from(new Set(normalizedMerchantByRow.values()));
          const merchantProfiles = normalizedMerchantNames.length === 0 ? [] : await tx.merchantProfile.findMany({
            where: { userId, normalizedName: { in: normalizedMerchantNames }, isActive: true, deletedAt: null },
            select: { id: true, normalizedName: true },
          });
          const merchantProfileByNormalizedName = new Map(merchantProfiles.map((profile) => [profile.normalizedName, profile.id]));

          const transactionCreates: Prisma.TransactionCreateManyInput[] = [];
          const importRowCreates: Prisma.ImportRowCreateManyInput[] = [];
          const propertyLinkCreates: Prisma.PropertyTransactionLinkCreateManyInput[] = [];
          const propertyLinkAuditCreates: Prisma.AuditEventCreateManyInput[] = [];

          for (const row of request.rows) {
            if (row.action === "SKIP") {
              importRowCreates.push({
                userId,
                importBatchId: batch.id,
                rowNumber: row.rowNumber,
                action: "SKIP",
                status: "SKIPPED",
                warningCodes: row.warningCodes,
              });
              continue;
            }

            const category = categoryByRequestedId.get(row.categoryId);
            if (!category) throw new OwnershipError("approved category");
            const description = sanitizeBankDescription(row.description || row.merchantName) || "Payment";
            const merchantName = sanitizeTransactionNarration(row.merchantName || row.description) || "Payment";
            assertNoPrivateBankIdentifiers(description, "Reviewed description");
            assertNoPrivateBankIdentifiers(merchantName, "Reviewed merchant");
            const mappedDate = dateOnlyToUtcDate(row.date);

            if (row.action === "MERGE") {
              importRowCreates.push({
                userId,
                importBatchId: batch.id,
                rowNumber: row.rowNumber,
                action: "MERGE",
                status: "MERGED",
                mappedDate,
                amountCents: row.amountCents,
                description,
                merchantName,
                categoryId: category.id,
                matchedTransactionId: row.targetTransactionId,
                warningCodes: row.warningCodes,
              });
              continue;
            }

            const transactionId = randomUUID();
            const normalizedMerchantName = normalizedMerchantByRow.get(row.rowNumber);
            transactionCreates.push({
              id: transactionId,
              userId,
              categoryId: category.id,
              importBatchId: batch.id,
              merchantProfileId: normalizedMerchantName ? merchantProfileByNormalizedName.get(normalizedMerchantName) ?? null : null,
              type: transactionType(category.type),
              source: "IMPORTED",
              status: "ACTIVE",
              splitRole: "NONE",
              amountCents: row.amountCents,
              date: mappedDate,
              description,
              importedDescriptionSanitized: description,
              merchantName,
              reviewedAt: now,
            });
            if (row.propertyLinkPropertyId) {
              propertyLinkCreates.push({
                userId,
                transactionId,
                propertyId: row.propertyLinkPropertyId,
              });
              propertyLinkAuditCreates.push(createPropertyLinkAuditEvent(
                userId,
                transactionId,
                "LINKED",
                "IMPORT_REVIEW_PROPERTY_LINK",
              ));
            }
            importRowCreates.push({
              userId,
              importBatchId: batch.id,
              rowNumber: row.rowNumber,
              action: "IMPORT",
              status: "COMMITTED",
              mappedDate,
              amountCents: row.amountCents,
              description,
              merchantName,
              categoryId: category.id,
              committedTransactionId: transactionId,
              warningCodes: row.warningCodes,
            });
          }

          if (transactionCreates.length > 0) await tx.transaction.createMany({ data: transactionCreates });
          if (propertyLinkCreates.length > 0) await tx.propertyTransactionLink.createMany({ data: propertyLinkCreates });
          if (importRowCreates.length > 0) await tx.importRow.createMany({ data: importRowCreates });
          if (propertyLinkAuditCreates.length > 0) await tx.auditEvent.createMany({ data: propertyLinkAuditCreates });

          const auditMetadata = {
            totalCount: request.rows.length,
            importedCount,
            skippedCount,
            mergedCount,
            warningCount: warningCodes.length,
            privateFieldCount: request.metadata.privateFieldCount,
          } satisfies Prisma.InputJsonObject;
          auditEventSchema.parse({
            userId,
            entityType: "IMPORT_BATCH",
            entityId: batch.id,
            action: "IMPORTED",
            metadata: auditMetadata,
          });
          await tx.auditEvent.create({
            data: {
              userId,
              entityType: "IMPORT_BATCH",
              entityId: batch.id,
              action: "IMPORTED",
              metadata: auditMetadata,
            },
          });
          return {
            summary: summaryFromBatch({ ...batch, warningCodes }, false),
            transactionIds: transactionCreates.map((transaction) => String(transaction.id)),
          };
        }, { maxWait: 10_000, timeout: 30_000 });

        try {
          await autoReconcileHighConfidenceRepaymentsForTransactions(
            prisma,
            userId,
            committed.transactionIds,
          );
        } catch {
          // The import remains successful; changed or ambiguous candidates stay available for manual review.
        }
        return committed.summary;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const committed = await prisma.importBatch.findFirst({
            where: { id: request.requestId, userId, status: "COMPLETED" },
          });
          if (committed) return summaryFromBatch(committed, true);
          throw new ImportCommitConflictError();
        }
        throw error;
      }
    },
  };
}

export async function commitReviewedImport(
  context: AuthenticatedUserContext | null | undefined,
  input: ImportCommitRequest,
  store: ImportCommitStore = createPrismaImportCommitStore(),
  now = new Date(),
) {
  const user = requireAuthenticatedUserContext(context);
  const request = importCommitRequestSchema.parse(input);
  return store.commit(user.userId, request, now);
}

export type { ImportCommitStore };
