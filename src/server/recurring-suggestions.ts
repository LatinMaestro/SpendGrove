import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { auditEventSchema } from "@/lib/validation/audit";
import { assertNoPrivateBankIdentifiers } from "@/lib/validation/privacy";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

export type RecurringCadenceCode = "WEEKLY" | "FORTNIGHTLY" | "MONTHLY" | "OTHER";
export type RecurringConfidenceCode = "HIGH" | "REVIEW";
export type RecurringTransactionType = "INCOME" | "EXPENSE";

export type RecurringEvidenceRecord = {
  id: string;
  userId: string;
  date: Date | string;
  amountCents: number;
  type: string;
  status: string;
  splitRole: string;
  deletedAt?: Date | string | null;
  merchantProfileId: string | null;
  categoryId: string | null;
  merchantProfile: {
    id: string;
    name: string;
    isActive: boolean;
    deletedAt?: Date | string | null;
  } | null;
  category: {
    id: string;
    name: string;
    isArchived: boolean;
    deletedAt?: Date | string | null;
  } | null;
};

export type RecurringSuggestion = {
  key: string;
  label: string;
  categoryId: string;
  categoryLabel: string;
  transactionType: RecurringTransactionType;
  expectedAmountCents: number;
  cadence: Exclude<RecurringCadenceCode, "OTHER">;
  nextExpectedDate: string;
  confidence: RecurringConfidenceCode;
  occurrenceCount: number;
  why: string;
};

export type DbRecurringItem = {
  id: string;
  userId: string;
  categoryId: string | null;
  label: string;
  transactionType: string;
  expectedAmountCents: number | null;
  cadence: string;
  nextExpectedDate: Date | string | null;
  status: string;
  archivedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  category?: {
    name: string;
    isArchived: boolean;
    deletedAt?: Date | string | null;
  } | null;
};

export type RecurringItemView = {
  id: string;
  label: string;
  categoryId: string | null;
  categoryLabel: string | null;
  transactionType: string;
  expectedAmountCents: number | null;
  cadence: RecurringCadenceCode;
  nextExpectedDate: string | null;
  status: "ACTIVE" | "ARCHIVED";
  updatedAt: string;
};

type RecurringItemWrite = {
  label: string;
  expectedAmountCents: number;
  cadence: RecurringCadenceCode;
  nextExpectedDate: Date | null;
};

type ConfirmRecurringItemWrite = RecurringItemWrite & {
  categoryId: string;
  transactionType: RecurringTransactionType;
};

type SafeAuditWrite = {
  userId: string;
  entityType: "RECURRING_ITEM" | "RECURRING_SUGGESTION_DISMISSAL";
  entityId?: string;
  action: "CREATED" | "UPDATED" | "ARCHIVED";
  metadata: Prisma.InputJsonObject;
};

export type RecurringPersistenceStore = {
  listEvidence(userId: string): Promise<RecurringEvidenceRecord[]>;
  listDismissedKeys(userId: string): Promise<string[]>;
  listItems(userId: string): Promise<DbRecurringItem[]>;
  confirm(userId: string, input: ConfirmRecurringItemWrite, audit: SafeAuditWrite, now: Date): Promise<DbRecurringItem>;
  dismiss(userId: string, suggestionKey: string, audit: SafeAuditWrite, now: Date): Promise<void>;
  update(userId: string, itemId: string, expectedUpdatedAt: Date, input: RecurringItemWrite, audit: SafeAuditWrite): Promise<DbRecurringItem | null>;
  archive(userId: string, itemId: string, expectedUpdatedAt: Date, now: Date, audit: SafeAuditWrite): Promise<DbRecurringItem | null>;
};

export class RecurringSuggestionUnavailableError extends Error {
  constructor() {
    super("That recurring suggestion is no longer available. Refresh and review the current suggestions.");
    this.name = "RecurringSuggestionUnavailableError";
  }
}

export class RecurringItemConflictError extends Error {
  constructor() {
    super("That recurring item changed since you opened it. Refresh before trying again.");
    this.name = "RecurringItemConflictError";
  }
}

const cadenceSchema = z.enum(["WEEKLY", "FORTNIGHTLY", "MONTHLY", "OTHER"]);
const suggestionKeySchema = z.string().regex(/^[a-f0-9]{64}$/);
const itemIdSchema = z.string().min(1).max(128);
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const amountCentsSchema = z.number().int().min(-100_000_000_000).max(100_000_000_000).refine((value) => value !== 0, "Enter a non-zero expected amount.");

const labelSchema = z.string().trim().min(1, "Enter a short recurring item label.").max(60, "Keep the recurring item label to 60 characters.").transform((value) => value.replace(/\s+/g, " ")).superRefine((value, context) => {
  try {
    assertNoPrivateBankIdentifiers(value, "Recurring item label");
  } catch {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Remove account or private banking identifiers from the label." });
  }
});

const recurringItemFieldsSchema = z.object({
  label: labelSchema,
  expectedAmountCents: amountCentsSchema,
  cadence: cadenceSchema,
  nextExpectedDate: dateOnlySchema.nullable(),
}).strict();

export const recurringMutationSchema = z.discriminatedUnion("action", [
  recurringItemFieldsSchema.extend({
    action: z.literal("CONFIRM"),
    suggestionKey: suggestionKeySchema,
  }).strict(),
  z.object({
    action: z.literal("DISMISS"),
    suggestionKey: suggestionKeySchema,
  }).strict(),
  recurringItemFieldsSchema.extend({
    action: z.literal("UPDATE"),
    itemId: itemIdSchema,
    updatedAt: z.string().datetime(),
  }).strict(),
  z.object({
    action: z.literal("ARCHIVE"),
    itemId: itemIdSchema,
    updatedAt: z.string().datetime(),
  }).strict(),
]);

export type RecurringMutation = z.infer<typeof recurringMutationSchema>;

const DAY_MS = 86_400_000;
const cadenceWindows = [
  { cadence: "WEEKLY" as const, minimumDays: 6, maximumDays: 8 },
  { cadence: "FORTNIGHTLY" as const, minimumDays: 13, maximumDays: 16 },
  { cadence: "MONTHLY" as const, minimumDays: 27, maximumDays: 34 },
];

function asDate(value: Date | string) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateOnlyToUtc(value: string | null) {
  if (value === null) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Choose a valid next expected date.");
  }
  return date;
}

function daysBetween(earlier: Date, later: Date) {
  return Math.round((later.getTime() - earlier.getTime()) / DAY_MS);
}

function detectCadence(dates: Date[]) {
  if (dates.length < 2) return null;
  const gaps = dates.slice(1).map((date, index) => daysBetween(dates[index], date));
  return cadenceWindows.find((window) => gaps.every((gap) => (
    gap >= window.minimumDays && gap <= window.maximumDays
  )))?.cadence ?? null;
}

function addCadence(date: Date, cadence: Exclude<RecurringCadenceCode, "OTHER">) {
  const next = new Date(date);
  if (cadence === "MONTHLY") {
    next.setUTCMonth(next.getUTCMonth() + 1);
  } else {
    next.setUTCDate(next.getUTCDate() + (cadence === "FORTNIGHTLY" ? 14 : 7));
  }
  return next.toISOString().slice(0, 10);
}

function cadenceLabel(cadence: Exclude<RecurringCadenceCode, "OTHER">) {
  if (cadence === "WEEKLY") return "weekly";
  if (cadence === "FORTNIGHTLY") return "fortnightly";
  return "monthly";
}

function normalizedLabel(value: string) {
  return value.trim().toLocaleLowerCase("en-AU").replace(/\s+/g, " ");
}

function evidenceMatchesType(record: RecurringEvidenceRecord): record is RecurringEvidenceRecord & { type: RecurringTransactionType } {
  return (record.type === "EXPENSE" && record.amountCents < 0)
    || (record.type === "INCOME" && record.amountCents > 0);
}

function structuralMatch(item: DbRecurringItem, suggestion: RecurringSuggestion) {
  return item.status === "ACTIVE"
    && item.categoryId === suggestion.categoryId
    && item.transactionType === suggestion.transactionType
    && item.expectedAmountCents === suggestion.expectedAmountCents
    && item.cadence === suggestion.cadence;
}

function withoutConfirmedSuggestions(suggestions: RecurringSuggestion[], items: DbRecurringItem[]) {
  const remaining = [...suggestions];
  const activeItems = items.filter((item) => item.status === "ACTIVE");
  for (const item of activeItems) {
    let matchIndex = remaining.findIndex((suggestion) => (
      structuralMatch(item, suggestion)
      && normalizedLabel(item.label) === normalizedLabel(suggestion.label)
    ));
    if (matchIndex < 0) matchIndex = remaining.findIndex((suggestion) => structuralMatch(item, suggestion));
    if (matchIndex >= 0) remaining.splice(matchIndex, 1);
  }
  return remaining;
}

export function createRecurringSuggestionKey(input: {
  merchantProfileId: string;
  categoryId: string;
  transactionType: RecurringTransactionType;
  amountCents: number;
  cadence: Exclude<RecurringCadenceCode, "OTHER">;
}) {
  return createHash("sha256")
    .update(["v1", input.merchantProfileId, input.categoryId, input.transactionType, String(input.amountCents), input.cadence].join("|"))
    .digest("hex");
}

export function detectRecurringSuggestions(
  userId: string,
  evidence: RecurringEvidenceRecord[],
  dismissedKeys: string[] = [],
) {
  const dismissed = new Set(dismissedKeys);
  const groups = new Map<string, RecurringEvidenceRecord[]>();

  for (const record of evidence) {
    if (
      record.userId !== userId
      || record.status !== "ACTIVE"
      || record.deletedAt
      || record.splitRole === "PARENT"
      || !record.merchantProfileId
      || !record.categoryId
      || !record.merchantProfile?.isActive
      || record.merchantProfile.deletedAt
      || record.category?.isArchived
      || record.category?.deletedAt
      || !evidenceMatchesType(record)
      || !Number.isInteger(record.amountCents)
    ) {
      continue;
    }

    const date = asDate(record.date);
    if (!date) continue;
    const groupKey = [
      record.merchantProfileId,
      record.categoryId,
      record.type,
      String(record.amountCents),
    ].join("|");
    const current = groups.get(groupKey) ?? [];
    current.push(record);
    groups.set(groupKey, current);
  }

  const suggestions: RecurringSuggestion[] = [];
  for (const records of groups.values()) {
    const sorted = [...records].sort((left, right) => {
      const leftDate = asDate(left.date)?.getTime() ?? 0;
      const rightDate = asDate(right.date)?.getTime() ?? 0;
      return leftDate - rightDate || left.id.localeCompare(right.id);
    });
    if (sorted.length < 2) continue;
    const dates = sorted.map((record) => asDate(record.date)).filter((date): date is Date => date !== null);
    if (dates.length !== sorted.length) continue;
    const cadence = detectCadence(dates);
    if (!cadence) continue;

    const first = sorted[0] as RecurringEvidenceRecord & { type: RecurringTransactionType };
    const key = createRecurringSuggestionKey({
      merchantProfileId: first.merchantProfileId!,
      categoryId: first.categoryId!,
      transactionType: first.type,
      amountCents: first.amountCents,
      cadence,
    });
    if (dismissed.has(key)) continue;

    const confidence: RecurringConfidenceCode = sorted.length >= 3 ? "HIGH" : "REVIEW";
    suggestions.push({
      key,
      label: first.merchantProfile!.name,
      categoryId: first.categoryId!,
      categoryLabel: first.category!.name,
      transactionType: first.type,
      expectedAmountCents: first.amountCents,
      cadence,
      nextExpectedDate: addCadence(dates[dates.length - 1], cadence),
      confidence,
      occurrenceCount: sorted.length,
      why: `${sorted.length} active transactions share the same confirmed merchant, category and amount with a ${cadenceLabel(cadence)} interval.`,
    });
  }

  return suggestions.sort((left, right) => (
    left.label.localeCompare(right.label)
    || left.categoryLabel.localeCompare(right.categoryLabel)
    || left.key.localeCompare(right.key)
  ));
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toItemView(record: DbRecurringItem): RecurringItemView {
  return {
    id: record.id,
    label: record.label,
    categoryId: record.categoryId,
    categoryLabel: record.category && !record.category.isArchived && !record.category.deletedAt
      ? record.category.name
      : null,
    transactionType: record.transactionType,
    expectedAmountCents: record.expectedAmountCents,
    cadence: record.cadence as RecurringCadenceCode,
    nextExpectedDate: record.nextExpectedDate ? toIso(record.nextExpectedDate).slice(0, 10) : null,
    status: record.status as "ACTIVE" | "ARCHIVED",
    updatedAt: toIso(record.updatedAt),
  };
}

function safeAudit(
  userId: string,
  entityType: SafeAuditWrite["entityType"],
  action: SafeAuditWrite["action"],
  reasonCode: string,
  entityId?: string,
  extra: Prisma.InputJsonObject = {},
): SafeAuditWrite {
  const audit = {
    userId,
    entityType,
    entityId,
    action,
    metadata: {
      reasonCode,
      ...extra,
    } satisfies Prisma.InputJsonObject,
  };
  auditEventSchema.parse(audit);
  return audit;
}

function assertAmountDirection(transactionType: string, amountCents: number) {
  if ((transactionType === "EXPENSE" && amountCents >= 0) || (transactionType === "INCOME" && amountCents <= 0)) {
    throw new Error("Keep the expected amount direction consistent with the recurring transaction type.");
  }
}

async function loadRecurringState(userId: string, store: RecurringPersistenceStore) {
  const [evidence, dismissedKeys, items] = await Promise.all([
    store.listEvidence(userId),
    store.listDismissedKeys(userId),
    store.listItems(userId),
  ]);
  const detected = detectRecurringSuggestions(userId, evidence, dismissedKeys);
  return { detected, items };
}

async function snapshotForUser(userId: string, store: RecurringPersistenceStore) {
  const { detected, items } = await loadRecurringState(userId, store);
  return {
    suggestions: withoutConfirmedSuggestions(detected, items),
    items: items.map(toItemView).sort((left, right) => (
      Number(left.status === "ARCHIVED") - Number(right.status === "ARCHIVED")
      || left.label.localeCompare(right.label)
    )),
  };
}

export function createPrismaRecurringStore(prisma: PrismaClient = getPrismaClient()): RecurringPersistenceStore {
  const recurringItemInclude = {
    category: {
      select: {
        name: true,
        isArchived: true,
        deletedAt: true,
      },
    },
  } satisfies Prisma.RecurringItemInclude;

  return {
    async listEvidence(userId) {
      return prisma.transaction.findMany({
        where: {
          userId,
          status: "ACTIVE",
          deletedAt: null,
          splitRole: { not: "PARENT" },
          type: { in: ["EXPENSE", "INCOME"] },
          merchantProfileId: { not: null },
          categoryId: { not: null },
        },
        select: {
          id: true,
          userId: true,
          date: true,
          amountCents: true,
          type: true,
          status: true,
          splitRole: true,
          deletedAt: true,
          merchantProfileId: true,
          categoryId: true,
          merchantProfile: {
            select: {
              id: true,
              name: true,
              isActive: true,
              deletedAt: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              isArchived: true,
              deletedAt: true,
            },
          },
        },
        orderBy: [{ date: "asc" }, { id: "asc" }],
      }) as unknown as Promise<RecurringEvidenceRecord[]>;
    },
    async listDismissedKeys(userId) {
      const records = await prisma.recurringSuggestionDismissal.findMany({
        where: { userId },
        select: { suggestionKey: true },
      });
      return records.map((record) => record.suggestionKey);
    },
    async listItems(userId) {
      return prisma.recurringItem.findMany({
        where: { userId },
        include: recurringItemInclude,
        orderBy: [{ status: "asc" }, { label: "asc" }],
      }) as unknown as Promise<DbRecurringItem[]>;
    },
    async confirm(userId, input, audit, now) {
      return prisma.$transaction(async (tx) => {
        const existing = await tx.recurringItem.findFirst({
          where: {
            userId,
            categoryId: input.categoryId,
            transactionType: input.transactionType,
            expectedAmountCents: input.expectedAmountCents,
            cadence: input.cadence,
            label: input.label,
            status: "ACTIVE",
          },
          include: recurringItemInclude,
        });
        if (existing) return existing as unknown as DbRecurringItem;

        const created = await tx.recurringItem.create({
          data: {
            userId,
            categoryId: input.categoryId,
            label: input.label,
            transactionType: input.transactionType,
            expectedAmountCents: input.expectedAmountCents,
            cadence: input.cadence,
            nextExpectedDate: input.nextExpectedDate,
            status: "ACTIVE",
            createdAt: now,
            updatedAt: now,
          },
          include: recurringItemInclude,
        });
        await tx.auditEvent.create({
          data: {
            ...audit,
            entityId: created.id,
          },
        });
        return created as unknown as DbRecurringItem;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },
    async dismiss(userId, suggestionKey, audit, now) {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.recurringSuggestionDismissal.findUnique({
          where: { userId_suggestionKey: { userId, suggestionKey } },
        });
        if (existing) return;
        const created = await tx.recurringSuggestionDismissal.create({
          data: { userId, suggestionKey, dismissedAt: now, createdAt: now, updatedAt: now },
        });
        await tx.auditEvent.create({ data: { ...audit, entityId: created.id } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },
    async update(userId, itemId, expectedUpdatedAt, input, audit) {
      return prisma.$transaction(async (tx) => {
        const result = await tx.recurringItem.updateMany({
          where: { id: itemId, userId, status: "ACTIVE", updatedAt: expectedUpdatedAt },
          data: input,
        });
        if (result.count !== 1) return null;
        await tx.auditEvent.create({ data: audit });
        return tx.recurringItem.findFirst({
          where: { id: itemId, userId },
          include: recurringItemInclude,
        }) as unknown as Promise<DbRecurringItem | null>;
      });
    },
    async archive(userId, itemId, expectedUpdatedAt, now, audit) {
      return prisma.$transaction(async (tx) => {
        const result = await tx.recurringItem.updateMany({
          where: { id: itemId, userId, status: "ACTIVE", updatedAt: expectedUpdatedAt },
          data: { status: "ARCHIVED", archivedAt: now },
        });
        if (result.count !== 1) return null;
        await tx.auditEvent.create({ data: audit });
        return tx.recurringItem.findFirst({
          where: { id: itemId, userId },
          include: recurringItemInclude,
        }) as unknown as Promise<DbRecurringItem | null>;
      });
    },
  };
}

export async function getRecurringSnapshot(
  context: AuthenticatedUserContext | null | undefined,
  store: RecurringPersistenceStore = createPrismaRecurringStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  return snapshotForUser(user.userId, store);
}

export async function applyRecurringMutation(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  store: RecurringPersistenceStore = createPrismaRecurringStore(),
  now = new Date(),
) {
  const user = requireAuthenticatedUserContext(context);
  const request = recurringMutationSchema.parse(input);

  if (request.action === "CONFIRM") {
    const { detected } = await loadRecurringState(user.userId, store);
    const suggestion = detected.find((candidate) => candidate.key === request.suggestionKey);
    if (!suggestion) throw new RecurringSuggestionUnavailableError();
    assertAmountDirection(suggestion.transactionType, request.expectedAmountCents);
    await store.confirm(user.userId, {
      categoryId: suggestion.categoryId,
      transactionType: suggestion.transactionType,
      label: request.label,
      expectedAmountCents: request.expectedAmountCents,
      cadence: request.cadence,
      nextExpectedDate: dateOnlyToUtc(request.nextExpectedDate),
    }, safeAudit(
      user.userId,
      "RECURRING_ITEM",
      "CREATED",
      "RECURRING_SUGGESTION_CONFIRMED",
      undefined,
      { confidenceCode: suggestion.confidence, methodCode: "USER_CONFIRMED" },
    ), now);
  }

  if (request.action === "DISMISS") {
    const snapshot = await snapshotForUser(user.userId, store);
    const suggestion = snapshot.suggestions.find((candidate) => candidate.key === request.suggestionKey);
    if (!suggestion) throw new RecurringSuggestionUnavailableError();
    await store.dismiss(
      user.userId,
      request.suggestionKey,
      safeAudit(
        user.userId,
        "RECURRING_SUGGESTION_DISMISSAL",
        "CREATED",
        "RECURRING_SUGGESTION_DISMISSED",
        undefined,
        { confidenceCode: suggestion.confidence, methodCode: "USER_DISMISSED" },
      ),
      now,
    );
  }

  if (request.action === "UPDATE") {
    const items = await store.listItems(user.userId);
    const existing = items.find((item) => item.id === request.itemId && item.status === "ACTIVE");
    if (!existing) throw new RecurringItemConflictError();
    assertAmountDirection(existing.transactionType, request.expectedAmountCents);
    const updated = await store.update(
      user.userId,
      request.itemId,
      new Date(request.updatedAt),
      {
        label: request.label,
        expectedAmountCents: request.expectedAmountCents,
        cadence: request.cadence,
        nextExpectedDate: dateOnlyToUtc(request.nextExpectedDate),
      },
      safeAudit(user.userId, "RECURRING_ITEM", "UPDATED", "RECURRING_ITEM_UPDATED", request.itemId, {
        changedFieldCodes: ["LABEL", "EXPECTED_AMOUNT", "CADENCE", "NEXT_EXPECTED_DATE"],
      }),
    );
    if (!updated) throw new RecurringItemConflictError();
  }

  if (request.action === "ARCHIVE") {
    const archived = await store.archive(
      user.userId,
      request.itemId,
      new Date(request.updatedAt),
      now,
      safeAudit(user.userId, "RECURRING_ITEM", "ARCHIVED", "RECURRING_ITEM_ARCHIVED", request.itemId, {
        stateCode: "ARCHIVED",
      }),
    );
    if (!archived) throw new RecurringItemConflictError();
  }

  return snapshotForUser(user.userId, store);
}
