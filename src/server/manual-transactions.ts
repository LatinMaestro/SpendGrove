import { createHash } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { getManualCategory, manualCategories, type ManualCategory, type ManualCategoryType } from "@/lib/manual-categories";
import type { ManualTransactionMigrationItem } from "@/lib/manual-transaction-migration";
import {
  validateManualTransactionDraft,
  type ManualTransaction,
  type ManualTransactionDraft,
} from "@/lib/manual-transactions";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { assertUserOwnsRecord, requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

export type AccountTransaction = Omit<ManualTransaction, "source"> & {
  source: "MANUAL" | "IMPORTED";
  merchantName: string;
};

export type DbManualTransactionCategoryRecord = {
  id: string;
  name: string;
  type: ManualCategoryType | string;
  parent?: {
    name: string;
  } | null;
};

export type DbManualTransactionRecord = {
  id: string;
  userId: string;
  type: ManualCategoryType | string;
  source?: "MANUAL" | "IMPORTED" | string;
  amountCents: number;
  date: Date | string;
  description: string;
  merchantName?: string | null;
  categoryId?: string | null;
  category?: DbManualTransactionCategoryRecord | null;
  notes?: string | null;
  csvMatchHint: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
};

export type ManualTransactionCreateData = {
  id?: string;
  type: ManualCategoryType;
  amountCents: number;
  date: Date;
  description: string;
  categoryId: string;
  notes: string;
  csvMatchHint: boolean;
};

export type ManualTransactionPersistenceStore = {
  listActive(userId: string, dateFrom?: Date, dateTo?: Date): Promise<DbManualTransactionRecord[]>;
  hasActiveAfter?(userId: string, date: Date): Promise<boolean>;
  latestActiveDate?(userId: string): Promise<Date | null>;
  findActiveById(userId: string, transactionId: string): Promise<DbManualTransactionRecord | null>;
  findById?(userId: string, transactionId: string): Promise<DbManualTransactionRecord | null>;
  create(userId: string, data: ManualTransactionCreateData): Promise<DbManualTransactionRecord>;
  update(userId: string, transactionId: string, data: ManualTransactionCreateData): Promise<DbManualTransactionRecord>;
  softDelete(userId: string, transactionId: string, deletedAt: Date): Promise<DbManualTransactionRecord>;
  resolveSeededCategoryId(userId: string, category: ManualCategory): Promise<string>;
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

const transactionInclude = {
  category: {
    include: {
      parent: true,
    },
  },
} satisfies Prisma.TransactionInclude;

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDateOnly(value: Date | string) {
  return toIsoString(value).slice(0, 10);
}

function dateOnlyToUtcDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function getCategoryGroupSortOrder(groupName: string) {
  const index = categoryGroupOrder.indexOf(groupName);
  return index >= 0 ? index : categoryGroupOrder.length;
}

function getCategoryChildSortOrder(category: ManualCategory) {
  const index = manualCategories.filter((candidate) => candidate.group === category.group).findIndex((candidate) => candidate.id === category.id);
  return index >= 0 ? index : 0;
}

function toManualCategoryId(category: DbManualTransactionCategoryRecord | null | undefined) {
  if (!category) return "";

  const manualType = category.type as ManualCategoryType;
  const matchingCategory = manualCategories.find((candidate) =>
    candidate.name === category.name &&
    candidate.type === manualType &&
    (!category.parent?.name || candidate.group === category.parent.name),
  );

  return matchingCategory?.id ?? category.id;
}

function toAccountTransaction(record: DbManualTransactionRecord): AccountTransaction {
  return {
    id: record.id,
    type: record.type as ManualCategoryType,
    source: record.source === "IMPORTED" ? "IMPORTED" : "MANUAL",
    amountCents: record.amountCents,
    date: toDateOnly(record.date),
    description: record.description,
    merchantName: record.merchantName ?? record.description,
    categoryId: toManualCategoryId(record.category),
    notes: record.notes ?? "",
    csvMatchHint: record.csvMatchHint,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
    deletedAt: record.deletedAt ? toIsoString(record.deletedAt) : null,
  };
}

function getValidatedCategory(draft: ManualTransactionDraft) {
  const validated = validateManualTransactionDraft(draft);
  const category = getManualCategory(validated.categoryId);

  if (!category || category.type !== validated.type) {
    throw new Error("Choose an approved category that matches the transaction type.");
  }

  return { validated, category };
}

function migrationTransactionId(userId: string, localId: string) {
  const digest = createHash("sha256").update(`${userId}:${localId}`).digest("hex").slice(0, 40);
  return `migration_${digest}`;
}

function migrationItemToDraft(transaction: ManualTransactionMigrationItem): ManualTransactionDraft {
  const amountCents = transaction.type === "TRANSFER" ? transaction.amountCents : Math.abs(transaction.amountCents);
  return {
    type: transaction.type,
    amountInput: (amountCents / 100).toFixed(2),
    date: transaction.date,
    description: transaction.description,
    categoryId: transaction.categoryId,
    notes: transaction.notes,
    csvMatchHint: transaction.csvMatchHint,
  };
}

export function createPrismaManualTransactionStore(prisma: PrismaClient = getPrismaClient()): ManualTransactionPersistenceStore {
  return {
    async listActive(userId, dateFrom, dateTo) {
      return prisma.transaction.findMany({
        where: {
          userId,
          status: "ACTIVE",
          deletedAt: null,
          splitRole: {
            not: "PARENT",
          },
          ...(dateFrom && dateTo ? { date: { gte: dateFrom, lt: dateTo } } : {}),
        },
        include: transactionInclude,
        orderBy: [
          { date: "desc" },
          { updatedAt: "desc" },
        ],
      }) as unknown as Promise<DbManualTransactionRecord[]>;
    },
    async hasActiveAfter(userId, date) {
      const record = await prisma.transaction.findFirst({
        where: {
          userId,
          status: "ACTIVE",
          deletedAt: null,
          splitRole: { not: "PARENT" },
          date: { gte: date },
        },
        select: { id: true },
      });
      return Boolean(record);
    },
    async latestActiveDate(userId) {
      const record = await prisma.transaction.findFirst({
        where: {
          userId,
          status: "ACTIVE",
          deletedAt: null,
          splitRole: { not: "PARENT" },
        },
        orderBy: [{ date: "desc" }, { updatedAt: "desc" }],
        select: { date: true },
      });
      return record?.date ?? null;
    },
    async findActiveById(userId, transactionId) {
      return prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId,
          status: "ACTIVE",
          deletedAt: null,
          splitRole: {
            not: "PARENT",
          },
        },
        include: transactionInclude,
      }) as unknown as Promise<DbManualTransactionRecord | null>;
    },
    async findById(userId, transactionId) {
      return prisma.transaction.findFirst({
        where: { id: transactionId, userId, source: "MANUAL" },
        include: transactionInclude,
      }) as unknown as Promise<DbManualTransactionRecord | null>;
    },
    async create(userId, data) {
      return prisma.transaction.create({
        data: {
          id: data.id,
          userId,
          categoryId: data.categoryId,
          type: data.type,
          source: "MANUAL",
          status: "ACTIVE",
          splitRole: "NONE",
          amountCents: data.amountCents,
          date: data.date,
          description: data.description,
          notes: data.notes || null,
          csvMatchHint: data.csvMatchHint,
        },
        include: transactionInclude,
      }) as unknown as Promise<DbManualTransactionRecord>;
    },
    async update(_userId, transactionId, data) {
      return prisma.transaction.update({
        where: {
          id: transactionId,
        },
        data: {
          categoryId: data.categoryId,
          type: data.type,
          amountCents: data.amountCents,
          date: data.date,
          description: data.description,
          notes: data.notes || null,
          csvMatchHint: data.csvMatchHint,
        },
        include: transactionInclude,
      }) as unknown as Promise<DbManualTransactionRecord>;
    },
    async softDelete(_userId, transactionId, deletedAt) {
      return prisma.transaction.update({
        where: {
          id: transactionId,
        },
        data: {
          status: "DELETED",
          deletedAt,
        },
        include: transactionInclude,
      }) as unknown as Promise<DbManualTransactionRecord>;
    },
    async resolveSeededCategoryId(userId, category) {
      const parentType = categoryGroupTypes[category.group] ?? category.type;
      const parent = await prisma.category.upsert({
        where: {
          userId_name_type: {
            userId,
            name: category.group,
            type: parentType,
          },
        },
        update: {
          isSeeded: true,
          isArchived: false,
          deletedAt: null,
          sortOrder: getCategoryGroupSortOrder(category.group),
        },
        create: {
          userId,
          name: category.group,
          type: parentType,
          isSeeded: true,
          sortOrder: getCategoryGroupSortOrder(category.group),
        },
      });

      const child = await prisma.category.upsert({
        where: {
          userId_name_type: {
            userId,
            name: category.name,
            type: category.type,
          },
        },
        update: {
          parentId: parent.id,
          isSeeded: true,
          isArchived: false,
          deletedAt: null,
          sortOrder: getCategoryChildSortOrder(category),
        },
        create: {
          userId,
          name: category.name,
          type: category.type,
          parentId: parent.id,
          isSeeded: true,
          sortOrder: getCategoryChildSortOrder(category),
        },
      });

      return child.id;
    },
  };
}

export async function listDurableManualTransactions(
  context: AuthenticatedUserContext | null | undefined,
  store: ManualTransactionPersistenceStore = createPrismaManualTransactionStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  const records = await store.listActive(user.userId);
  return records.map(toAccountTransaction);
}

export async function listDurableManualTransactionsForMonth(
  context: AuthenticatedUserContext | null | undefined,
  monthKey: string,
  store: ManualTransactionPersistenceStore = createPrismaManualTransactionStore(),
  options: { fallbackToLatest?: boolean } = {},
) {
  const user = requireAuthenticatedUserContext(context);

  function monthWindow(key: string) {
    const match = /^(\d{4})-(\d{2})$/.exec(key);
    if (!match) throw new Error("Choose a valid transaction month.");
    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    if (!Number.isInteger(year) || monthIndex < 0 || monthIndex > 11) {
      throw new Error("Choose a valid transaction month.");
    }
    return {
      key,
      dateFrom: new Date(Date.UTC(year, monthIndex, 1)),
      dateTo: new Date(Date.UTC(year, monthIndex + 1, 1)),
    };
  }

  let window = monthWindow(monthKey);
  let records = await store.listActive(user.userId, window.dateFrom, window.dateTo);

  if (options.fallbackToLatest && records.length === 0 && store.latestActiveDate) {
    const latestDate = await store.latestActiveDate(user.userId);
    if (latestDate) {
      const latestMonthKey = `${latestDate.getUTCFullYear()}-${String(latestDate.getUTCMonth() + 1).padStart(2, "0")}`;
      if (latestMonthKey !== monthKey) {
        window = monthWindow(latestMonthKey);
        records = await store.listActive(user.userId, window.dateFrom, window.dateTo);
      }
    }
  }

  const hasLaterTransactions = store.hasActiveAfter
    ? await store.hasActiveAfter(user.userId, window.dateTo)
    : false;

  return {
    transactions: records.map(toAccountTransaction),
    month: {
      key: window.key,
      label: new Intl.DateTimeFormat("en-AU", {
        month: "long",
        year: "numeric",
        timeZone: "Australia/Brisbane",
      }).format(window.dateFrom),
    },
    hasLaterTransactions,
  };
}

export async function createDurableManualTransaction(
  context: AuthenticatedUserContext | null | undefined,
  draft: ManualTransactionDraft,
  store: ManualTransactionPersistenceStore = createPrismaManualTransactionStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  const { validated, category } = getValidatedCategory(draft);
  const categoryId = await store.resolveSeededCategoryId(user.userId, category);
  const record = await store.create(user.userId, {
    type: validated.type,
    amountCents: validated.amountCents,
    date: dateOnlyToUtcDate(validated.date),
    description: validated.description,
    categoryId,
    notes: validated.notes,
    csvMatchHint: validated.csvMatchHint,
  });

  assertUserOwnsRecord(user, record, "transaction");
  return toAccountTransaction(record);
}

export async function updateDurableManualTransaction(
  context: AuthenticatedUserContext | null | undefined,
  transactionId: string,
  draft: ManualTransactionDraft,
  store: ManualTransactionPersistenceStore = createPrismaManualTransactionStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  const existing = await store.findActiveById(user.userId, transactionId);
  assertUserOwnsRecord(user, existing, "transaction");

  const { validated, category } = getValidatedCategory(draft);
  const categoryId = await store.resolveSeededCategoryId(user.userId, category);
  const record = await store.update(user.userId, transactionId, {
    type: validated.type,
    amountCents: validated.amountCents,
    date: dateOnlyToUtcDate(validated.date),
    description: validated.description,
    categoryId,
    notes: validated.notes,
    csvMatchHint: validated.csvMatchHint,
  });

  assertUserOwnsRecord(user, record, "transaction");
  return toAccountTransaction(record);
}

export async function softDeleteDurableManualTransaction(
  context: AuthenticatedUserContext | null | undefined,
  transactionId: string,
  store: ManualTransactionPersistenceStore = createPrismaManualTransactionStore(),
  now = new Date(),
) {
  const user = requireAuthenticatedUserContext(context);
  const existing = await store.findActiveById(user.userId, transactionId);
  assertUserOwnsRecord(user, existing, "transaction");

  const record = await store.softDelete(user.userId, transactionId, now);
  assertUserOwnsRecord(user, record, "transaction");
  return toAccountTransaction(record);
}

export async function migrateDurableManualTransactions(
  context: AuthenticatedUserContext | null | undefined,
  localTransactions: ManualTransactionMigrationItem[],
  store: ManualTransactionPersistenceStore = createPrismaManualTransactionStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  if (!store.findById) throw new Error("Manual transaction migration is unavailable.");
  let importedCount = 0;
  let skippedCount = 0;

  for (const localTransaction of localTransactions) {
    if (localTransaction.deletedAt) {
      skippedCount += 1;
      continue;
    }
    const transactionId = migrationTransactionId(user.userId, localTransaction.id);
    if (await store.findById(user.userId, transactionId)) {
      skippedCount += 1;
      continue;
    }
    const { validated, category } = getValidatedCategory(migrationItemToDraft(localTransaction));
    const categoryId = await store.resolveSeededCategoryId(user.userId, category);
    const record = await store.create(user.userId, {
      id: transactionId,
      type: validated.type,
      amountCents: validated.amountCents,
      date: dateOnlyToUtcDate(validated.date),
      description: validated.description,
      categoryId,
      notes: validated.notes,
      csvMatchHint: validated.csvMatchHint,
    });
    assertUserOwnsRecord(user, record, "transaction");
    importedCount += 1;
  }

  return {
    transactions: await listDurableManualTransactions(user, store),
    importedCount,
    skippedCount,
  };
}
