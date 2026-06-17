import type { PrismaClient } from "@prisma/client";
import { getManualCategory, manualCategories, type ManualCategory, type ManualCategoryType } from "@/lib/manual-categories";
import {
  validateManualTransactionDraft,
  type ManualTransaction,
  type ManualTransactionDraft,
} from "@/lib/manual-transactions";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { assertUserOwnsRecord, requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

type DbCategoryRecord = {
  id: string;
  name: string;
  type: ManualCategoryType | string;
  parent?: {
    name: string;
  } | null;
};

type DbTransactionRecord = {
  id: string;
  userId: string;
  type: ManualCategoryType | string;
  amountCents: number;
  date: Date | string;
  description: string;
  categoryId?: string | null;
  category?: DbCategoryRecord | null;
  notes?: string | null;
  csvMatchHint: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
};

type ManualTransactionCreateData = {
  type: ManualCategoryType;
  amountCents: number;
  date: Date;
  description: string;
  categoryId: string;
  notes: string;
  csvMatchHint: boolean;
};

export type ManualTransactionPersistenceStore = {
  listActive(userId: string): Promise<DbTransactionRecord[]>;
  findActiveById(userId: string, transactionId: string): Promise<DbTransactionRecord | null>;
  create(userId: string, data: ManualTransactionCreateData): Promise<DbTransactionRecord>;
  update(userId: string, transactionId: string, data: ManualTransactionCreateData): Promise<DbTransactionRecord>;
  softDelete(userId: string, transactionId: string, deletedAt: Date): Promise<DbTransactionRecord>;
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
};

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

function toManualCategoryId(category: DbCategoryRecord | null | undefined) {
  if (!category) return "";

  const manualType = category.type as ManualCategoryType;
  const matchingCategory = manualCategories.find((candidate) =>
    candidate.name === category.name &&
    candidate.type === manualType &&
    (!category.parent?.name || candidate.group === category.parent.name),
  );

  return matchingCategory?.id ?? category.id;
}

function toManualTransaction(record: DbTransactionRecord): ManualTransaction {
  return {
    id: record.id,
    type: record.type as ManualCategoryType,
    source: "MANUAL",
    amountCents: record.amountCents,
    date: toDateOnly(record.date),
    description: record.description,
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

export function createPrismaManualTransactionStore(prisma: PrismaClient = getPrismaClient()): ManualTransactionPersistenceStore {
  return {
    async listActive(userId) {
      return prisma.transaction.findMany({
        where: {
          userId,
          source: "MANUAL",
          status: "ACTIVE",
          deletedAt: null,
          splitRole: {
            not: "PARENT",
          },
        },
        include: transactionInclude,
        orderBy: [
          { date: "desc" },
          { updatedAt: "desc" },
        ],
      }) as Promise<DbTransactionRecord[]>;
    },
    async findActiveById(userId, transactionId) {
      return prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId,
          source: "MANUAL",
          status: "ACTIVE",
          deletedAt: null,
          splitRole: {
            not: "PARENT",
          },
        },
        include: transactionInclude,
      }) as Promise<DbTransactionRecord | null>;
    },
    async create(userId, data) {
      return prisma.transaction.create({
        data: {
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
      }) as Promise<DbTransactionRecord>;
    },
    async update(userId, transactionId, data) {
      return prisma.transaction.update({
        where: {
          id: transactionId,
          userId,
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
      }) as Promise<DbTransactionRecord>;
    },
    async softDelete(userId, transactionId, deletedAt) {
      return prisma.transaction.update({
        where: {
          id: transactionId,
          userId,
        },
        data: {
          status: "DELETED",
          deletedAt,
        },
        include: transactionInclude,
      }) as Promise<DbTransactionRecord>;
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
  return records.map(toManualTransaction);
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
  return toManualTransaction(record);
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
  return toManualTransaction(record);
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
  return toManualTransaction(record);
}
