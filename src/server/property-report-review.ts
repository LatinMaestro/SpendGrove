import {
  Prisma,
  type PrismaClient,
  type PropertyRecordClassification,
  type TransactionType,
} from "@prisma/client";
import { z } from "zod";
import { auditEventSchema } from "@/lib/validation/audit";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { OwnershipError, requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

export const propertyFinancialYearSchema = z.coerce.number().int().min(2001).max(2100);

const classificationSchema = z.enum([
  "PROPERTY_INCOME",
  "PROPERTY_OUTGOING",
  "REFUND_OR_REVERSAL",
  "LOAN_PAYMENT_CONTEXT",
  "TRANSFER_CONTEXT",
  "OTHER_PROPERTY_RECORD",
  "EXCLUDED",
]);

export const propertyRecordReviewRequestSchema = z.object({
  transactionId: z.string().trim().min(1),
  classification: classificationSchema,
  expectedTransactionUpdatedAt: z.string().datetime(),
  expectedReviewUpdatedAt: z.string().datetime().nullable(),
}).strict();

const bulkSuggestionItemSchema = z.object({
  transactionId: z.string().trim().min(1),
  expectedTransactionUpdatedAt: z.string().datetime(),
  expectedReviewUpdatedAt: z.string().datetime().nullable(),
}).strict();

export type PropertyBulkSuggestionItem = z.infer<typeof bulkSuggestionItemSchema>;

export const propertyBulkSuggestionRequestSchema = z.object({
  endingYear: propertyFinancialYearSchema,
  confirmed: z.literal(true),
  items: z.array(bulkSuggestionItemSchema).min(1).max(100),
}).strict().superRefine((value, context) => {
  const ids = new Set<string>();
  value.items.forEach((item, index) => {
    if (ids.has(item.transactionId)) {
      context.addIssue({ code: "custom", path: ["items", index, "transactionId"], message: "Choose each record once." });
    }
    ids.add(item.transactionId);
  });
});

export type PropertyRecordProvenance = "MANUAL_PROPERTY_LINK" | "LOAN_RECONCILIATION" | "BOTH";
export type PropertyClassificationSuggestionReason =
  | "LOAN_RECONCILIATION_EXPENSE"
  | "MANUAL_PROPERTY_EXPENSE"
  | "SEEDED_RENTAL_INCOME"
  | "SEEDED_REFUND_OR_REBATE"
  | "TRANSFER_RECORD";

export type SafePropertyReviewRecord = {
  transactionId: string;
  date: string;
  amountCents: number;
  type: TransactionType;
  categoryName: string | null;
  transactionUpdatedAt: string;
  provenance: PropertyRecordProvenance;
  relationshipConflict: boolean;
  archivedLoanContext: boolean;
  classification: PropertyRecordClassification | null;
  classificationNeedsReview: boolean;
  suggestedClassification: PropertyRecordClassification | null;
  suggestionReasonCode: PropertyClassificationSuggestionReason | null;
  reviewUpdatedAt: string | null;
};

export type SafePropertyRecordReview = {
  property: { id: string; nickname: string; isArchived: boolean };
  financialYear: { endingYear: number; label: string; startDate: string; endDate: string };
  records: SafePropertyReviewRecord[];
};

type CandidateTransaction = {
  id: string;
  userId: string;
  date: Date;
  amountCents: number;
  type: TransactionType;
  status: "ACTIVE" | "NEEDS_REVIEW" | "DELETED";
  splitRole: "NONE" | "PARENT" | "CHILD";
  deletedAt: Date | null;
  updatedAt: Date;
  category: { name: string; isSeeded: boolean } | null;
  propertyReportReview: {
    propertyId: string;
    classification: PropertyRecordClassification;
    updatedAt: Date;
  } | null;
};

export type PropertyReviewManualPath = { propertyId: string; transaction: CandidateTransaction };
export type PropertyReviewLoanPath = {
  propertyId: string;
  loanArchived: boolean;
  transaction: CandidateTransaction;
};

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function australianFinancialYear(endingYear: number) {
  const validated = propertyFinancialYearSchema.parse(endingYear);
  return {
    endingYear: validated,
    label: `${validated - 1}-${String(validated).slice(-2)}`,
    start: new Date(Date.UTC(validated - 1, 6, 1)),
    end: new Date(Date.UTC(validated, 6, 1)),
    startDate: `${validated - 1}-07-01`,
    endDate: `${validated}-06-30`,
  };
}

export function isClassificationCompatible(
  classification: PropertyRecordClassification,
  record: Pick<SafePropertyReviewRecord, "type" | "amountCents" | "provenance">,
) {
  if (classification === "OTHER_PROPERTY_RECORD" || classification === "EXCLUDED") return true;
  if (classification === "PROPERTY_INCOME") return record.type === "INCOME" && record.amountCents > 0;
  if (classification === "PROPERTY_OUTGOING") return record.type === "EXPENSE" && record.amountCents < 0;
  if (classification === "REFUND_OR_REVERSAL") return record.type === "INCOME" && record.amountCents > 0;
  if (classification === "TRANSFER_CONTEXT") return record.type === "TRANSFER";
  return record.type === "EXPENSE"
    && record.amountCents < 0
    && (record.provenance === "LOAN_RECONCILIATION" || record.provenance === "BOTH");
}

export function suggestPropertyRecordClassification(record: Pick<
  SafePropertyReviewRecord,
  "type" | "amountCents" | "provenance" | "relationshipConflict" | "classification" | "classificationNeedsReview"
> & { categoryName: string | null; categoryIsSeeded: boolean }) {
  if (record.classification !== null || record.classificationNeedsReview || record.relationshipConflict) return null;
  if (record.type === "TRANSFER") {
    return { classification: "TRANSFER_CONTEXT" as const, reasonCode: "TRANSFER_RECORD" as const };
  }
  if (record.type === "EXPENSE" && record.amountCents < 0) {
    if (record.provenance === "LOAN_RECONCILIATION" || record.provenance === "BOTH") {
      return { classification: "LOAN_PAYMENT_CONTEXT" as const, reasonCode: "LOAN_RECONCILIATION_EXPENSE" as const };
    }
    return { classification: "PROPERTY_OUTGOING" as const, reasonCode: "MANUAL_PROPERTY_EXPENSE" as const };
  }
  if (record.type === "INCOME" && record.amountCents > 0 && record.categoryIsSeeded) {
    const category = record.categoryName?.trim().toLocaleLowerCase("en-AU");
    if (category === "rental income") {
      return { classification: "PROPERTY_INCOME" as const, reasonCode: "SEEDED_RENTAL_INCOME" as const };
    }
    if (category === "refunds / rebates") {
      return { classification: "REFUND_OR_REVERSAL" as const, reasonCode: "SEEDED_REFUND_OR_REBATE" as const };
    }
  }
  return null;
}

export function selectApplicablePropertySuggestions(
  records: SafePropertyReviewRecord[],
  items: PropertyBulkSuggestionItem[],
) {
  const currentRecords = new Map(records.map((record) => [record.transactionId, record]));
  return items.flatMap((item) => {
    const record = currentRecords.get(item.transactionId);
    if (!record || record.classification !== null || record.classificationNeedsReview
      || !record.suggestedClassification || record.relationshipConflict
      || record.transactionUpdatedAt !== item.expectedTransactionUpdatedAt
      || record.reviewUpdatedAt !== item.expectedReviewUpdatedAt
      || !isClassificationCompatible(record.suggestedClassification, record)) return [];
    return [{ item, record, classification: record.suggestedClassification }];
  });
}

export function resolvePropertyReviewRecords(
  userId: string,
  propertyId: string,
  manualPaths: PropertyReviewManualPath[],
  loanPaths: PropertyReviewLoanPath[],
) {
  const manualByTransaction = new Map(manualPaths.map((path) => [path.transaction.id, path]));
  const loansByTransaction = new Map<string, PropertyReviewLoanPath[]>();
  for (const path of loanPaths) {
    const paths = loansByTransaction.get(path.transaction.id) ?? [];
    paths.push(path);
    loansByTransaction.set(path.transaction.id, paths);
  }

  const transactionIds = new Set([...manualByTransaction.keys(), ...loansByTransaction.keys()]);
  const records: SafePropertyReviewRecord[] = [];
  for (const transactionId of transactionIds) {
    const manual = manualByTransaction.get(transactionId);
    const loanPathsForTransaction = loansByTransaction.get(transactionId) ?? [];
    const transaction = manual?.transaction ?? loanPathsForTransaction[0]?.transaction;
    if (!transaction || transaction.userId !== userId || transaction.status !== "ACTIVE"
      || transaction.deletedAt || transaction.splitRole === "PARENT" || transaction.amountCents === 0) continue;

    const loanPropertyIds = new Set(loanPathsForTransaction.map((path) => path.propertyId));
    let provenance: PropertyRecordProvenance;
    let relationshipConflict = false;
    if (manual) {
      if (manual.propertyId !== propertyId) continue;
      provenance = loanPropertyIds.has(propertyId) ? "BOTH" : "MANUAL_PROPERTY_LINK";
      relationshipConflict = [...loanPropertyIds].some((id) => id !== propertyId);
    } else {
      if (loanPropertyIds.size !== 1 || !loanPropertyIds.has(propertyId)) continue;
      provenance = "LOAN_RECONCILIATION";
    }

    const review = transaction.propertyReportReview?.propertyId === propertyId
      ? transaction.propertyReportReview
      : null;
    const record: SafePropertyReviewRecord = {
      transactionId,
      date: dateOnly(transaction.date),
      amountCents: transaction.amountCents,
      type: transaction.type,
      categoryName: transaction.category?.name ?? null,
      transactionUpdatedAt: transaction.updatedAt.toISOString(),
      provenance,
      relationshipConflict,
      archivedLoanContext: loanPathsForTransaction.some((path) => path.loanArchived),
      classification: review?.classification ?? null,
      classificationNeedsReview: false,
      suggestedClassification: null,
      suggestionReasonCode: null,
      reviewUpdatedAt: review?.updatedAt.toISOString() ?? null,
    };
    record.classificationNeedsReview = record.classification !== null
      && !isClassificationCompatible(record.classification, record);
    const suggestion = suggestPropertyRecordClassification({
      ...record,
      categoryIsSeeded: transaction.category?.isSeeded ?? false,
    });
    record.suggestedClassification = suggestion?.classification ?? null;
    record.suggestionReasonCode = suggestion?.reasonCode ?? null;
    records.push(record);
  }
  return records.sort((left, right) => right.date.localeCompare(left.date) || left.transactionId.localeCompare(right.transactionId));
}

export class PropertyRecordReviewConflictError extends Error {
  constructor(message = "That record changed. Refresh the review and try again.") {
    super(message);
    this.name = "PropertyRecordReviewConflictError";
  }
}

export class PropertyRecordClassificationError extends Error {
  constructor() {
    super("Choose a classification that matches the current record type and connection.");
    this.name = "PropertyRecordClassificationError";
  }
}

export function createPropertyReviewAuditEvent(
  userId: string,
  transactionId: string,
  classification: PropertyRecordClassification,
  state: "CREATED" | "UPDATED",
  reasonCode: "MANUAL_USER_REVIEW" | "CONFIRMED_SUGGESTION" = "MANUAL_USER_REVIEW",
) {
  const audit = {
    userId,
    entityType: "TRANSACTION" as const,
    entityId: transactionId,
    action: "UPDATED" as const,
    metadata: { propertyReviewState: state, classification, reasonCode },
  };
  auditEventSchema.parse(audit);
  return audit;
}

const transactionSelect = {
  id: true,
  userId: true,
  date: true,
  amountCents: true,
  type: true,
  status: true,
  splitRole: true,
  deletedAt: true,
  updatedAt: true,
  category: { select: { name: true, isSeeded: true } },
  propertyReportReview: { select: { propertyId: true, classification: true, updatedAt: true } },
} as const;

export type PropertyRecordReviewStore = {
  read(userId: string, propertyId: string, endingYear: number): Promise<SafePropertyRecordReview>;
  classify(
    userId: string,
    propertyId: string,
    input: z.infer<typeof propertyRecordReviewRequestSchema>,
  ): Promise<{ classification: PropertyRecordClassification; updatedAt: string }>;
  applySuggestions(
    userId: string,
    propertyId: string,
    input: z.infer<typeof propertyBulkSuggestionRequestSchema>,
  ): Promise<{
    classifiedCount: number;
    skippedCount: number;
    remainingReviewCount: number;
  }>;
};

async function readWithPrisma(
  prisma: Prisma.TransactionClient,
  userId: string,
  propertyId: string,
  endingYear: number,
) {
  const financialYear = australianFinancialYear(endingYear);
  const property = await prisma.property.findFirst({
    where: { id: propertyId, userId, deletedAt: null },
    select: { id: true, userId: true, nickname: true, isArchived: true },
  });
  if (!property || property.userId !== userId) throw new OwnershipError("Property");

  const transactionWhere: Prisma.TransactionWhereInput = {
    userId,
    status: "ACTIVE" as const,
    deletedAt: null,
    amountCents: { not: 0 },
    splitRole: { in: ["NONE", "CHILD"] },
    date: { gte: financialYear.start, lt: financialYear.end },
  };
  const [manualLinks, loanLinks] = await Promise.all([
    prisma.propertyTransactionLink.findMany({
      where: { userId, unlinkedAt: null, property: { userId, deletedAt: null }, transaction: transactionWhere },
      select: { userId: true, propertyId: true, transaction: { select: transactionSelect } },
    }),
    prisma.loanReconciliationLink.findMany({
      where: {
        userId,
        unlinkedAt: null,
        transaction: transactionWhere,
        loanRepayment: {
          userId,
          isArchived: false,
          deletedAt: null,
          loanAccount: { userId, propertyId: { not: null }, deletedAt: null, property: { userId, deletedAt: null } },
        },
      },
      select: {
        userId: true,
        transaction: { select: transactionSelect },
        loanRepayment: { select: { userId: true, loanAccount: { select: { userId: true, propertyId: true, isArchived: true } } } },
      },
    }),
  ]);

  if (manualLinks.some((link) => link.userId !== userId || link.transaction.userId !== userId)
    || loanLinks.some((link) => link.userId !== userId || link.transaction.userId !== userId
      || link.loanRepayment.userId !== userId || link.loanRepayment.loanAccount.userId !== userId)) {
    throw new OwnershipError("Property record review");
  }

  const records = resolvePropertyReviewRecords(
    userId,
    propertyId,
    manualLinks,
    loanLinks.flatMap((link) => link.loanRepayment.loanAccount.propertyId ? [{
      propertyId: link.loanRepayment.loanAccount.propertyId,
      loanArchived: link.loanRepayment.loanAccount.isArchived,
      transaction: link.transaction,
    }] : []),
  );
  return {
    property: { id: property.id, nickname: property.nickname, isArchived: property.isArchived },
    financialYear: {
      endingYear: financialYear.endingYear,
      label: financialYear.label,
      startDate: financialYear.startDate,
      endDate: financialYear.endDate,
    },
    records,
  };
}

export function createPrismaPropertyRecordReviewStore(
  prisma: PrismaClient = getPrismaClient(),
): PropertyRecordReviewStore {
  return {
    read: (userId, propertyId, endingYear) => readWithPrisma(prisma as Prisma.TransactionClient, userId, propertyId, endingYear),
    async classify(userId, propertyId, rawInput) {
      const input = propertyRecordReviewRequestSchema.parse(rawInput);
      try {
        return await prisma.$transaction(async (tx) => {
          const transaction = await tx.transaction.findFirst({
            where: { id: input.transactionId, userId },
            select: { date: true, updatedAt: true },
          });
          if (!transaction) throw new OwnershipError("eligible Property record");
          if (transaction.updatedAt.toISOString() !== input.expectedTransactionUpdatedAt) {
            throw new PropertyRecordReviewConflictError();
          }
          const endingYear = transaction.date.getUTCMonth() >= 6
            ? transaction.date.getUTCFullYear() + 1
            : transaction.date.getUTCFullYear();
          const review = await readWithPrisma(tx, userId, propertyId, endingYear);
          const record = review.records.find((item) => item.transactionId === input.transactionId);
          if (!record) throw new OwnershipError("eligible Property record");
          if (!isClassificationCompatible(input.classification, record)) throw new PropertyRecordClassificationError();

          const existing = await tx.propertyReportReview.findUnique({
            where: { transactionId: input.transactionId },
            select: { id: true, userId: true, propertyId: true, updatedAt: true },
          });
          if (existing && existing.userId !== userId) throw new OwnershipError("Property review");
          const currentExpected = existing?.propertyId === propertyId ? existing.updatedAt.toISOString() : null;
          if (currentExpected !== input.expectedReviewUpdatedAt) throw new PropertyRecordReviewConflictError();

          const saved = existing
            ? await tx.propertyReportReview.update({
              where: { id: existing.id },
              data: { propertyId, classification: input.classification },
              select: { classification: true, updatedAt: true },
            })
            : await tx.propertyReportReview.create({
              data: { userId, propertyId, transactionId: input.transactionId, classification: input.classification },
              select: { classification: true, updatedAt: true },
            });
          await tx.auditEvent.create({
            data: createPropertyReviewAuditEvent(userId, input.transactionId, input.classification, existing ? "UPDATED" : "CREATED"),
          });
          return { classification: saved.classification, updatedAt: saved.updatedAt.toISOString() };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 30_000 });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034")) {
          throw new PropertyRecordReviewConflictError();
        }
        throw error;
      }
    },
    async applySuggestions(userId, propertyId, rawInput) {
      const input = propertyBulkSuggestionRequestSchema.parse(rawInput);
      try {
        return await prisma.$transaction(async (tx) => {
          const review = await readWithPrisma(tx, userId, propertyId, input.endingYear);
          const applicable = selectApplicablePropertySuggestions(review.records, input.items);
          let classifiedCount = 0;

          for (const { item, record, classification } of applicable) {
            const existing = await tx.propertyReportReview.findUnique({
              where: { transactionId: item.transactionId },
              select: { id: true, userId: true, propertyId: true, updatedAt: true },
            });
            if (existing && existing.userId !== userId) throw new OwnershipError("Property review");
            const currentExpected = existing?.propertyId === propertyId ? existing.updatedAt.toISOString() : null;
            if (currentExpected !== item.expectedReviewUpdatedAt) continue;

            if (existing) {
              await tx.propertyReportReview.update({
                where: { id: existing.id },
                data: { propertyId, classification },
              });
            } else {
              await tx.propertyReportReview.create({
                data: {
                  userId,
                  propertyId,
                  transactionId: item.transactionId,
                  classification,
                },
              });
            }
            await tx.auditEvent.create({
              data: createPropertyReviewAuditEvent(
                userId,
                item.transactionId,
                classification,
                existing ? "UPDATED" : "CREATED",
                "CONFIRMED_SUGGESTION",
              ),
            });
            classifiedCount += 1;
          }

          const refreshed = await readWithPrisma(tx, userId, propertyId, input.endingYear);
          const remainingReviewCount = refreshed.records.filter((record) =>
            record.classification === null || record.classificationNeedsReview
          ).length;
          return {
            classifiedCount,
            skippedCount: input.items.length - classifiedCount,
            remainingReviewCount,
          };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 30_000 });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034")) {
          throw new PropertyRecordReviewConflictError("Some records changed. Refresh the review before applying suggestions again.");
        }
        throw error;
      }
    },
  };
}

export async function getPropertyRecordReview(
  context: AuthenticatedUserContext | null | undefined,
  propertyId: string,
  endingYear: unknown,
  store: PropertyRecordReviewStore = createPrismaPropertyRecordReviewStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  return store.read(user.userId, propertyId, propertyFinancialYearSchema.parse(endingYear));
}

export async function classifyPropertyRecord(
  context: AuthenticatedUserContext | null | undefined,
  propertyId: string,
  input: unknown,
  store: PropertyRecordReviewStore = createPrismaPropertyRecordReviewStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  return store.classify(user.userId, propertyId, propertyRecordReviewRequestSchema.parse(input));
}

export async function applyPropertyRecordSuggestions(
  context: AuthenticatedUserContext | null | undefined,
  propertyId: string,
  input: unknown,
  store: PropertyRecordReviewStore = createPrismaPropertyRecordReviewStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  return store.applySuggestions(user.userId, propertyId, propertyBulkSuggestionRequestSchema.parse(input));
}
