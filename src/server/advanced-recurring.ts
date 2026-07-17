import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { auditEventSchema } from "@/lib/validation/audit";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";
import { PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED } from "@/src/server/phase-9-runtime";

export type AdvancedRecurringStatus =
  | "ACTIVE"
  | "PAUSED"
  | "CANCELLED"
  | "UNKNOWN"
  | "NEEDS_REVIEW"
  | "ARCHIVED";

type RecurringInstanceRecord = {
  id: string;
  userId: string;
  recurringItemId: string;
  transactionId: string;
  linkedAt: Date | string;
  unlinkedAt: Date | string | null;
  transaction: {
    id: string;
    userId: string;
    date: Date | string;
    amountCents: number;
    type: string;
    status: string;
    splitRole: string;
    deletedAt: Date | string | null;
  };
};

export type AdvancedRecurringItemRecord = {
  id: string;
  userId: string;
  label: string;
  transactionType: string;
  expectedAmountCents: number | null;
  expectedAmountMinCents: number | null;
  expectedAmountMaxCents: number | null;
  cadence: string;
  nextExpectedDate: Date | string | null;
  source: string | null;
  detectionConfidence: string | null;
  status: AdvancedRecurringStatus;
  archivedAt: Date | string | null;
  updatedAt: Date | string;
  instances: RecurringInstanceRecord[];
};

export type AdvancedRecurringStore = {
  list(userId: string): Promise<AdvancedRecurringItemRecord[]>;
  setStatus(
    userId: string,
    itemId: string,
    expectedUpdatedAt: Date,
    status: AdvancedRecurringStatus,
    now: Date,
  ): Promise<AdvancedRecurringItemRecord | null>;
  linkInstance(
    userId: string,
    itemId: string,
    transactionId: string,
    now: Date,
  ): Promise<{ item: AdvancedRecurringItemRecord | null; reason?: string }>;
  unlinkInstance(
    userId: string,
    itemId: string,
    instanceId: string,
    now: Date,
  ): Promise<AdvancedRecurringItemRecord | null>;
};

export class AdvancedRecurringUnavailableError extends Error {
  constructor() {
    super("Advanced regular payments are not available until the Preview migration is verified.");
    this.name = "AdvancedRecurringUnavailableError";
  }
}

export class AdvancedRecurringConflictError extends Error {
  constructor(message = "That regular payment changed or is not available for your account.") {
    super(message);
    this.name = "AdvancedRecurringConflictError";
  }
}

const idSchema = z.string().trim().min(1).max(128);

export const advancedRecurringMutationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("SET_STATUS"),
    itemId: idSchema,
    updatedAt: z.string().datetime(),
    status: z.enum(["ACTIVE", "PAUSED", "CANCELLED", "UNKNOWN", "NEEDS_REVIEW", "ARCHIVED"]),
  }).strict(),
  z.object({
    action: z.literal("LINK_INSTANCE"),
    itemId: idSchema,
    transactionId: idSchema,
  }).strict(),
  z.object({
    action: z.literal("UNLINK_INSTANCE"),
    itemId: idSchema,
    instanceId: idSchema,
  }).strict(),
]);

function iso(value: Date | string | null) {
  if (value === null) return null;
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function safeAudit(
  userId: string,
  entityType: "RECURRING_ITEM" | "RECURRING_INSTANCE",
  entityId: string,
  action: "CREATED" | "UPDATED" | "ARCHIVED" | "DELETED",
  reasonCode: string,
): Prisma.AuditEventUncheckedCreateInput {
  return auditEventSchema.parse({
    userId,
    entityType,
    entityId,
    action,
    metadata: { reasonCode },
  }) as Prisma.AuditEventUncheckedCreateInput;
}

function toView(record: AdvancedRecurringItemRecord) {
  return {
    id: record.id,
    label: record.label,
    transactionType: record.transactionType,
    expectedAmountCents: record.expectedAmountCents,
    expectedAmountMinCents: record.expectedAmountMinCents,
    expectedAmountMaxCents: record.expectedAmountMaxCents,
    cadence: record.cadence,
    nextExpectedDate: iso(record.nextExpectedDate)?.slice(0, 10) ?? null,
    source: record.source,
    status: record.status,
    updatedAt: iso(record.updatedAt) as string,
    instances: record.instances
      .filter((instance) => !instance.unlinkedAt)
      .map((instance) => ({
        id: instance.id,
        transactionId: instance.transactionId,
        date: (iso(instance.transaction.date) as string).slice(0, 10),
        amountCents: instance.transaction.amountCents,
      })),
  };
}

function expectedRange(item: {
  expectedAmountCents: number | null;
  expectedAmountMinCents: number | null;
  expectedAmountMaxCents: number | null;
}) {
  const values = [
    item.expectedAmountMinCents,
    item.expectedAmountMaxCents,
    item.expectedAmountCents,
  ].filter((value): value is number => Number.isInteger(value));
  if (values.length === 0) return null;
  return { minimum: Math.min(...values), maximum: Math.max(...values) };
}

export function recurringInstanceCompatibility(
  item: Pick<
    AdvancedRecurringItemRecord,
    "status" | "transactionType" | "expectedAmountCents" | "expectedAmountMinCents" | "expectedAmountMaxCents"
  >,
  transaction: RecurringInstanceRecord["transaction"],
) {
  if (!["ACTIVE", "NEEDS_REVIEW"].includes(item.status)) return "ITEM_NOT_LINKABLE" as const;
  if (
    transaction.status !== "ACTIVE"
    || transaction.deletedAt
    || transaction.splitRole === "PARENT"
  ) return "TRANSACTION_NOT_ELIGIBLE" as const;
  if (transaction.type !== item.transactionType) return "DIRECTION_MISMATCH" as const;
  if (
    (transaction.type === "EXPENSE" && transaction.amountCents >= 0)
    || (transaction.type === "INCOME" && transaction.amountCents <= 0)
    || transaction.type === "TRANSFER"
  ) return "DIRECTION_MISMATCH" as const;
  const range = expectedRange(item);
  if (range && (
    transaction.amountCents < range.minimum
    || transaction.amountCents > range.maximum
  )) return "AMOUNT_MISMATCH" as const;
  return null;
}

async function ownedItem(tx: Prisma.TransactionClient, userId: string, itemId: string) {
  return tx.recurringItem.findFirst({
    where: { id: itemId, userId },
    include: {
      instances: {
        where: { unlinkedAt: null },
        include: {
          transaction: {
            select: {
              id: true,
              userId: true,
              date: true,
              amountCents: true,
              type: true,
              status: true,
              splitRole: true,
              deletedAt: true,
            },
          },
        },
        orderBy: { linkedAt: "desc" },
      },
    },
  });
}

export function createPrismaAdvancedRecurringStore(
  prisma: PrismaClient = getPrismaClient(),
): AdvancedRecurringStore {
  return {
    async list(userId) {
      return prisma.recurringItem.findMany({
        where: { userId },
        include: {
          instances: {
            where: { unlinkedAt: null },
            include: {
              transaction: {
                select: {
                  id: true,
                  userId: true,
                  date: true,
                  amountCents: true,
                  type: true,
                  status: true,
                  splitRole: true,
                  deletedAt: true,
                },
              },
            },
            orderBy: { linkedAt: "desc" },
          },
        },
        orderBy: [{ status: "asc" }, { label: "asc" }],
      }) as unknown as Promise<AdvancedRecurringItemRecord[]>;
    },

    async setStatus(userId, itemId, expectedUpdatedAt, status, now) {
      return prisma.$transaction(async (tx) => {
        const changed = await tx.recurringItem.updateMany({
          where: { id: itemId, userId, updatedAt: expectedUpdatedAt },
          data: {
            status,
            archivedAt: status === "ARCHIVED" ? now : null,
          },
        });
        if (changed.count !== 1) return null;
        await tx.auditEvent.create({
          data: safeAudit(
            userId,
            "RECURRING_ITEM",
            itemId,
            status === "ARCHIVED" ? "ARCHIVED" : "UPDATED",
            `RECURRING_ITEM_STATUS_${status}`,
          ),
        });
        return ownedItem(tx, userId, itemId) as unknown as Promise<AdvancedRecurringItemRecord | null>;
      });
    },

    async linkInstance(userId, itemId, transactionId, now) {
      return prisma.$transaction(async (tx) => {
        const [item, transaction] = await Promise.all([
          tx.recurringItem.findFirst({
            where: { id: itemId, userId },
            select: {
              id: true,
              status: true,
              transactionType: true,
              expectedAmountCents: true,
              expectedAmountMinCents: true,
              expectedAmountMaxCents: true,
            },
          }),
          tx.transaction.findFirst({
            where: { id: transactionId, userId },
            select: {
              id: true,
              userId: true,
              date: true,
              amountCents: true,
              type: true,
              status: true,
              splitRole: true,
              deletedAt: true,
            },
          }),
        ]);
        if (!item || !transaction) return { item: null, reason: "NOT_FOUND_OR_NOT_OWNED" };
        const incompatibility = recurringInstanceCompatibility(
          item as Parameters<typeof recurringInstanceCompatibility>[0],
          transaction,
        );
        if (incompatibility) return { item: null, reason: incompatibility };

        const existing = await tx.recurringInstance.findUnique({
          where: { transactionId },
        });
        let instanceId: string;
        if (existing) {
          if (
            existing.userId !== userId
            || existing.recurringItemId !== itemId
            || existing.unlinkedAt === null
          ) return { item: null, reason: "TRANSACTION_ALREADY_LINKED" };
          const restored = await tx.recurringInstance.update({
            where: { id: existing.id },
            data: { unlinkedAt: null, linkedAt: now },
          });
          instanceId = restored.id;
        } else {
          const created = await tx.recurringInstance.create({
            data: { userId, recurringItemId: itemId, transactionId, linkedAt: now },
          });
          instanceId = created.id;
        }
        await tx.auditEvent.create({
          data: safeAudit(
            userId,
            "RECURRING_INSTANCE",
            instanceId,
            "CREATED",
            "RECURRING_INSTANCE_LINKED",
          ),
        });
        return {
          item: await ownedItem(tx, userId, itemId) as unknown as AdvancedRecurringItemRecord,
        };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },

    async unlinkInstance(userId, itemId, instanceId, now) {
      return prisma.$transaction(async (tx) => {
        const changed = await tx.recurringInstance.updateMany({
          where: {
            id: instanceId,
            userId,
            recurringItemId: itemId,
            unlinkedAt: null,
          },
          data: { unlinkedAt: now },
        });
        if (changed.count !== 1) return null;
        await tx.auditEvent.create({
          data: safeAudit(
            userId,
            "RECURRING_INSTANCE",
            instanceId,
            "DELETED",
            "RECURRING_INSTANCE_UNLINKED",
          ),
        });
        return ownedItem(tx, userId, itemId) as unknown as Promise<AdvancedRecurringItemRecord | null>;
      });
    },
  };
}

type RuntimeOptions = { runtimeEnabled?: boolean };

function requireRuntime(options: RuntimeOptions) {
  if (!(options.runtimeEnabled ?? PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED)) {
    throw new AdvancedRecurringUnavailableError();
  }
}

export async function listAdvancedRecurringItems(
  context: AuthenticatedUserContext | null | undefined,
  store?: AdvancedRecurringStore,
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  return (await (store ?? createPrismaAdvancedRecurringStore()).list(user.userId)).map(toView);
}

export async function mutateAdvancedRecurringItem(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  store?: AdvancedRecurringStore,
  now = new Date(),
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  const request = advancedRecurringMutationSchema.parse(input);
  const resolvedStore = store ?? createPrismaAdvancedRecurringStore();
  let record: AdvancedRecurringItemRecord | null;

  if (request.action === "SET_STATUS") {
    record = await resolvedStore.setStatus(
      user.userId,
      request.itemId,
      new Date(request.updatedAt),
      request.status,
      now,
    );
  } else if (request.action === "LINK_INSTANCE") {
    const result = await resolvedStore.linkInstance(
      user.userId,
      request.itemId,
      request.transactionId,
      now,
    );
    if (!result.item) {
      throw new AdvancedRecurringConflictError(
        result.reason === "AMOUNT_MISMATCH"
          ? "That transaction amount does not match this regular payment."
          : "That transaction cannot be linked to this regular payment.",
      );
    }
    record = result.item;
  } else {
    record = await resolvedStore.unlinkInstance(
      user.userId,
      request.itemId,
      request.instanceId,
      now,
    );
  }

  if (!record) throw new AdvancedRecurringConflictError();
  return toView(record);
}
