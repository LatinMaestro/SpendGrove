import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { auditEventSchema } from "@/lib/validation/audit";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";
import { PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED } from "@/src/server/phase-9-runtime";

export type NetWorthKindCode = "ASSET" | "LIABILITY";
export type NetWorthCategoryCode =
  | "CASH"
  | "PROPERTY"
  | "INVESTMENT"
  | "SUPERANNUATION"
  | "VEHICLE"
  | "OTHER_ASSET"
  | "HOME_LOAN"
  | "PERSONAL_LOAN"
  | "CREDIT_CARD"
  | "OTHER_LIABILITY";

type ValuationRecord = {
  id: string;
  valueCents: number;
  valuationDate: Date | string;
  note: string | null;
  deletedAt: Date | string | null;
};

export type NetWorthItemRecord = {
  id: string;
  userId: string;
  propertyId: string | null;
  loanAccountId: string | null;
  name: string;
  kind: NetWorthKindCode;
  category: NetWorthCategoryCode;
  status: "ACTIVE" | "ARCHIVED";
  archivedAt: Date | string | null;
  updatedAt: Date | string;
  valuations: ValuationRecord[];
};

export type NetWorthSnapshotRecord = {
  id: string;
  userId: string;
  snapshotDate: Date | string;
  totalAssetCents: number;
  totalLiabilityCents: number;
  netWorthCents: number;
  archivedAt: Date | string | null;
  entries: Array<{
    netWorthItemId: string;
    itemName: string;
    kind: NetWorthKindCode;
    category: NetWorthCategoryCode;
    valueCents: number;
    valuationDate: Date | string;
  }>;
};

type ItemFields = {
  name: string;
  kind: NetWorthKindCode;
  category: NetWorthCategoryCode;
  propertyId: string | null;
  loanAccountId: string | null;
};

type ValuationFields = {
  valueCents: number;
  valuationDate: Date;
  note: string | null;
};

export type NetWorthStore = {
  listItems(userId: string): Promise<NetWorthItemRecord[]>;
  listSnapshots(userId: string): Promise<NetWorthSnapshotRecord[]>;
  createItem(userId: string, input: ItemFields, now: Date): Promise<NetWorthItemRecord | null>;
  addValuation(
    userId: string,
    itemId: string,
    input: ValuationFields,
    now: Date,
  ): Promise<NetWorthItemRecord | null>;
  setItemStatus(
    userId: string,
    itemId: string,
    expectedUpdatedAt: Date,
    status: "ACTIVE" | "ARCHIVED",
    now: Date,
  ): Promise<NetWorthItemRecord | null>;
  createSnapshot(userId: string, snapshotDate: Date, now: Date): Promise<NetWorthSnapshotRecord>;
};

export class NetWorthUnavailableError extends Error {
  constructor() {
    super("Net worth is not available until the Preview migration is verified.");
    this.name = "NetWorthUnavailableError";
  }
}

export class NetWorthConflictError extends Error {
  constructor() {
    super("That net worth record changed or is not available for your account.");
    this.name = "NetWorthConflictError";
  }
}

const kindSchema = z.enum(["ASSET", "LIABILITY"]);
const categorySchema = z.enum([
  "CASH",
  "PROPERTY",
  "INVESTMENT",
  "SUPERANNUATION",
  "VEHICLE",
  "OTHER_ASSET",
  "HOME_LOAN",
  "PERSONAL_LOAN",
  "CREDIT_CARD",
  "OTHER_LIABILITY",
]);
const assetCategories = new Set<NetWorthCategoryCode>([
  "CASH", "PROPERTY", "INVESTMENT", "SUPERANNUATION", "VEHICLE", "OTHER_ASSET",
]);
const liabilityCategories = new Set<NetWorthCategoryCode>([
  "HOME_LOAN", "PERSONAL_LOAN", "CREDIT_CARD", "OTHER_LIABILITY",
]);
const idSchema = z.string().trim().min(1).max(128);
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const nameSchema = z.string().trim().min(1).max(80)
  .transform((value) => value.replace(/\s+/g, " "));
const noteSchema = z.string().trim().max(240).nullable()
  .transform((value) => value || null);

const itemFieldsSchema = z.object({
  name: nameSchema,
  kind: kindSchema,
  category: categorySchema,
  propertyId: idSchema.nullable().default(null),
  loanAccountId: idSchema.nullable().default(null),
}).strict().superRefine((input, context) => {
  const compatible = input.kind === "ASSET"
    ? assetCategories.has(input.category)
    : liabilityCategories.has(input.category);
  if (!compatible) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Choose a category that matches this asset or liability.",
      path: ["category"],
    });
  }
  if (input.propertyId && (input.kind !== "ASSET" || input.category !== "PROPERTY")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A Property link is available only for a Property asset.",
      path: ["propertyId"],
    });
  }
  if (input.loanAccountId && input.kind !== "LIABILITY") {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A Loan Account link is available only for a liability.",
      path: ["loanAccountId"],
    });
  }
  if (input.propertyId && input.loanAccountId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Link either a Property or a Loan Account, not both.",
    });
  }
});

export const netWorthMutationSchema = z.discriminatedUnion("action", [
  itemFieldsSchema.extend({ action: z.literal("CREATE_ITEM") }).strict(),
  z.object({
    action: z.literal("ADD_VALUATION"),
    itemId: idSchema,
    valueCents: z.number().int().positive().max(1_000_000_000_000),
    valuationDate: dateOnlySchema,
    note: noteSchema.default(null),
  }).strict(),
  z.object({
    action: z.literal("SET_ITEM_STATUS"),
    itemId: idSchema,
    updatedAt: z.string().datetime(),
    status: z.enum(["ACTIVE", "ARCHIVED"]),
  }).strict(),
  z.object({
    action: z.literal("CREATE_SNAPSHOT"),
    snapshotDate: dateOnlySchema,
  }).strict(),
]);

function dateOnly(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error("Choose a valid date.");
  }
  return parsed;
}

function iso(value: Date | string) {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function safeAudit(
  userId: string,
  entityType: "NET_WORTH_ITEM" | "NET_WORTH_VALUATION" | "NET_WORTH_SNAPSHOT",
  entityId: string,
  action: "CREATED" | "UPDATED" | "ARCHIVED",
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

function itemView(record: NetWorthItemRecord) {
  const current = record.valuations
    .filter((valuation) => !valuation.deletedAt)
    .sort((a, b) => iso(b.valuationDate).localeCompare(iso(a.valuationDate)))[0] ?? null;
  return {
    id: record.id,
    name: record.name,
    kind: record.kind,
    category: record.category,
    status: record.status,
    propertyId: record.propertyId,
    loanAccountId: record.loanAccountId,
    currentValueCents: current?.valueCents ?? null,
    valuationDate: current ? iso(current.valuationDate).slice(0, 10) : null,
    updatedAt: iso(record.updatedAt),
  };
}

function snapshotView(record: NetWorthSnapshotRecord) {
  return {
    id: record.id,
    snapshotDate: iso(record.snapshotDate).slice(0, 10),
    totalAssetCents: record.totalAssetCents,
    totalLiabilityCents: record.totalLiabilityCents,
    netWorthCents: record.netWorthCents,
    entryCount: record.entries.length,
  };
}

async function ownedItem(tx: Prisma.TransactionClient, userId: string, itemId: string) {
  return tx.netWorthItem.findFirst({
    where: { id: itemId, userId },
    include: {
      valuations: {
        where: { deletedAt: null },
        orderBy: [{ valuationDate: "desc" }, { createdAt: "desc" }],
      },
    },
  });
}

export function createPrismaNetWorthStore(
  prisma: PrismaClient = getPrismaClient(),
): NetWorthStore {
  return {
    async listItems(userId) {
      return prisma.netWorthItem.findMany({
        where: { userId },
        include: {
          valuations: {
            where: { deletedAt: null },
            orderBy: [{ valuationDate: "desc" }, { createdAt: "desc" }],
          },
        },
        orderBy: [{ status: "asc" }, { kind: "asc" }, { name: "asc" }],
      }) as unknown as Promise<NetWorthItemRecord[]>;
    },

    async listSnapshots(userId) {
      return prisma.netWorthSnapshot.findMany({
        where: { userId, archivedAt: null },
        include: { entries: true },
        orderBy: { snapshotDate: "desc" },
      }) as unknown as Promise<NetWorthSnapshotRecord[]>;
    },

    async createItem(userId, input, now) {
      return prisma.$transaction(async (tx) => {
        if (input.propertyId) {
          const property = await tx.property.findFirst({
            where: { id: input.propertyId, userId, deletedAt: null },
            select: { id: true },
          });
          if (!property) return null;
        }
        if (input.loanAccountId) {
          const loan = await tx.loanAccount.findFirst({
            where: { id: input.loanAccountId, userId, deletedAt: null },
            select: { id: true },
          });
          if (!loan) return null;
        }
        const created = await tx.netWorthItem.create({
          data: { userId, ...input, createdAt: now },
          include: { valuations: true },
        });
        await tx.auditEvent.create({
          data: safeAudit(userId, "NET_WORTH_ITEM", created.id, "CREATED", "NET_WORTH_ITEM_CREATED"),
        });
        return created as unknown as NetWorthItemRecord;
      });
    },

    async addValuation(userId, itemId, input, now) {
      return prisma.$transaction(async (tx) => {
        const item = await tx.netWorthItem.findFirst({
          where: { id: itemId, userId, status: "ACTIVE" },
          select: { id: true },
        });
        if (!item) return null;
        const valuation = await tx.netWorthValuation.create({
          data: { userId, netWorthItemId: itemId, ...input, createdAt: now },
        });
        await tx.auditEvent.create({
          data: safeAudit(
            userId,
            "NET_WORTH_VALUATION",
            valuation.id,
            "CREATED",
            "NET_WORTH_VALUATION_ADDED",
          ),
        });
        return ownedItem(tx, userId, itemId) as unknown as Promise<NetWorthItemRecord | null>;
      });
    },

    async setItemStatus(userId, itemId, expectedUpdatedAt, status, now) {
      return prisma.$transaction(async (tx) => {
        const changed = await tx.netWorthItem.updateMany({
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
            "NET_WORTH_ITEM",
            itemId,
            status === "ARCHIVED" ? "ARCHIVED" : "UPDATED",
            status === "ARCHIVED" ? "NET_WORTH_ITEM_ARCHIVED" : "NET_WORTH_ITEM_RESTORED",
          ),
        });
        return ownedItem(tx, userId, itemId) as unknown as Promise<NetWorthItemRecord | null>;
      });
    },

    async createSnapshot(userId, snapshotDate, now) {
      return prisma.$transaction(async (tx) => {
        const items = await tx.netWorthItem.findMany({
          where: { userId, status: "ACTIVE" },
          include: {
            valuations: {
              where: { deletedAt: null, valuationDate: { lte: snapshotDate } },
              orderBy: [{ valuationDate: "desc" }, { createdAt: "desc" }],
              take: 1,
            },
          },
          orderBy: { name: "asc" },
        });
        const entries = items.flatMap((item) => {
          const valuation = item.valuations[0];
          return valuation ? [{
            userId,
            netWorthItemId: item.id,
            itemName: item.name,
            kind: item.kind,
            category: item.category,
            valueCents: valuation.valueCents,
            valuationDate: valuation.valuationDate,
          }] : [];
        });
        const totalAssetCents = entries
          .filter((entry) => entry.kind === "ASSET")
          .reduce((sum, entry) => sum + entry.valueCents, 0);
        const totalLiabilityCents = entries
          .filter((entry) => entry.kind === "LIABILITY")
          .reduce((sum, entry) => sum + entry.valueCents, 0);
        const created = await tx.netWorthSnapshot.create({
          data: {
            userId,
            snapshotDate,
            totalAssetCents,
            totalLiabilityCents,
            netWorthCents: totalAssetCents - totalLiabilityCents,
            createdAt: now,
            entries: { create: entries },
          },
          include: { entries: true },
        });
        await tx.auditEvent.create({
          data: safeAudit(
            userId,
            "NET_WORTH_SNAPSHOT",
            created.id,
            "CREATED",
            "NET_WORTH_SNAPSHOT_CREATED",
          ),
        });
        return created as unknown as NetWorthSnapshotRecord;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },
  };
}

type RuntimeOptions = { runtimeEnabled?: boolean };

function requireRuntime(options: RuntimeOptions) {
  if (!(options.runtimeEnabled ?? PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED)) {
    throw new NetWorthUnavailableError();
  }
}

export async function getNetWorthOverview(
  context: AuthenticatedUserContext | null | undefined,
  store?: NetWorthStore,
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  const resolvedStore = store ?? createPrismaNetWorthStore();
  const [items, snapshots] = await Promise.all([
    resolvedStore.listItems(user.userId),
    resolvedStore.listSnapshots(user.userId),
  ]);
  return {
    items: items.map(itemView),
    snapshots: snapshots.map(snapshotView),
  };
}

export async function mutateNetWorth(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  store?: NetWorthStore,
  now = new Date(),
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  const request = netWorthMutationSchema.parse(input);
  const resolvedStore = store ?? createPrismaNetWorthStore();

  if (request.action === "CREATE_ITEM") {
    const record = await resolvedStore.createItem(user.userId, {
      name: request.name,
      kind: request.kind,
      category: request.category,
      propertyId: request.propertyId,
      loanAccountId: request.loanAccountId,
    }, now);
    if (!record) throw new NetWorthConflictError();
    return { type: "ITEM" as const, item: itemView(record) };
  }
  if (request.action === "ADD_VALUATION") {
    const record = await resolvedStore.addValuation(user.userId, request.itemId, {
      valueCents: request.valueCents,
      valuationDate: dateOnly(request.valuationDate),
      note: request.note,
    }, now);
    if (!record) throw new NetWorthConflictError();
    return { type: "ITEM" as const, item: itemView(record) };
  }
  if (request.action === "SET_ITEM_STATUS") {
    const record = await resolvedStore.setItemStatus(
      user.userId,
      request.itemId,
      new Date(request.updatedAt),
      request.status,
      now,
    );
    if (!record) throw new NetWorthConflictError();
    return { type: "ITEM" as const, item: itemView(record) };
  }
  const snapshot = await resolvedStore.createSnapshot(
    user.userId,
    dateOnly(request.snapshotDate),
    now,
  );
  return { type: "SNAPSHOT" as const, snapshot: snapshotView(snapshot) };
}
