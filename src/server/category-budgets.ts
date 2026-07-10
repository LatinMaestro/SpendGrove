import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { auditEventSchema } from "@/lib/validation/audit";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

export type BudgetCategoryView = {
  id: string;
  name: string;
};

export type BudgetTransactionRecord = {
  userId: string;
  categoryId: string | null;
  type: string;
  status: string;
  splitRole: string;
  deletedAt: Date | string | null;
  amountCents: number;
  date: Date | string;
};

export type DbCategoryBudget = {
  id: string;
  userId: string;
  categoryId: string;
  amountCents: number;
  period: string;
  status: string;
  archivedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  category: {
    id: string;
    userId: string;
    name: string;
    type: string;
    isArchived: boolean;
    deletedAt: Date | string | null;
  };
};

export type CategoryBudgetView = {
  id: string;
  categoryId: string;
  categoryLabel: string;
  amountCents: number;
  period: "MONTHLY";
  status: "ACTIVE" | "ARCHIVED";
  spentCents: number;
  remainingCents: number;
  progressPercent: number;
  updatedAt: string;
};

type SafeAuditWrite = {
  userId: string;
  entityType: "CATEGORY_BUDGET";
  entityId?: string;
  action: "CREATED" | "UPDATED" | "ARCHIVED";
  metadata: Prisma.InputJsonObject;
};

type BudgetWrite = {
  categoryId: string;
  amountCents: number;
};

export type CategoryBudgetPersistenceStore = {
  listCategories(userId: string): Promise<BudgetCategoryView[]>;
  listBudgets(userId: string): Promise<DbCategoryBudget[]>;
  listExpenseTransactions(userId: string, start: Date, end: Date): Promise<BudgetTransactionRecord[]>;
  create(userId: string, input: BudgetWrite, audit: SafeAuditWrite, now: Date): Promise<DbCategoryBudget>;
  update(userId: string, budgetId: string, expectedUpdatedAt: Date, input: BudgetWrite, audit: SafeAuditWrite): Promise<DbCategoryBudget | null>;
  archive(userId: string, budgetId: string, expectedUpdatedAt: Date, now: Date, audit: SafeAuditWrite): Promise<DbCategoryBudget | null>;
};

export class CategoryBudgetConflictError extends Error {
  constructor(message = "That budget changed since you opened it. Refresh before trying again.") {
    super(message);
    this.name = "CategoryBudgetConflictError";
  }
}

export class CategoryBudgetDuplicateError extends Error {
  constructor() {
    super("An active monthly budget already exists for that category.");
    this.name = "CategoryBudgetDuplicateError";
  }
}

const categoryIdSchema = z.string().min(1).max(128);
const budgetIdSchema = z.string().min(1).max(128);
const amountCentsSchema = z.number().int().positive("Enter a monthly budget greater than zero.").max(100_000_000_000);

export const categoryBudgetMutationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("CREATE"),
    categoryId: categoryIdSchema,
    amountCents: amountCentsSchema,
  }).strict(),
  z.object({
    action: z.literal("UPDATE"),
    budgetId: budgetIdSchema,
    updatedAt: z.string().datetime(),
    categoryId: categoryIdSchema,
    amountCents: amountCentsSchema,
  }).strict(),
  z.object({
    action: z.literal("ARCHIVE"),
    budgetId: budgetIdSchema,
    updatedAt: z.string().datetime(),
  }).strict(),
]);

export type CategoryBudgetMutation = z.infer<typeof categoryBudgetMutationSchema>;

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function safeAudit(
  userId: string,
  action: SafeAuditWrite["action"],
  reasonCode: string,
  entityId?: string,
  metadata: Prisma.InputJsonObject = {},
): SafeAuditWrite {
  return auditEventSchema.parse({
    userId,
    entityType: "CATEGORY_BUDGET",
    entityId,
    action,
    metadata: {
      reasonCode,
      ...metadata,
    },
  }) as SafeAuditWrite;
}

export function getAustralianCalendarMonth(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const label = new Intl.DateTimeFormat("en-AU", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
  }).format(start);
  return {
    key: String(year) + "-" + String(month).padStart(2, "0"),
    label,
    start,
    end,
  };
}

export function computeMonthlySpentCents(
  userId: string,
  categoryId: string,
  records: BudgetTransactionRecord[],
  start: Date,
  end: Date,
) {
  return records.reduce((total, record) => {
    const date = record.date instanceof Date ? record.date : new Date(record.date);
    if (
      record.userId !== userId
      || record.categoryId !== categoryId
      || record.type !== "EXPENSE"
      || record.status !== "ACTIVE"
      || record.deletedAt
      || record.splitRole === "PARENT"
      || !Number.isInteger(record.amountCents)
      || Number.isNaN(date.getTime())
      || date < start
      || date >= end
    ) {
      return total;
    }
    return total + Math.abs(record.amountCents);
  }, 0);
}

function toBudgetView(
  record: DbCategoryBudget,
  spentCents: number,
): CategoryBudgetView {
  return {
    id: record.id,
    categoryId: record.categoryId,
    categoryLabel: record.category && record.category.userId === record.userId && !record.category.deletedAt
      ? record.category.name
      : "Category unavailable",
    amountCents: record.amountCents,
    period: "MONTHLY",
    status: record.status as "ACTIVE" | "ARCHIVED",
    spentCents,
    remainingCents: Math.max(record.amountCents - spentCents, 0),
    progressPercent: record.amountCents > 0
      ? Math.round((spentCents / record.amountCents) * 1000) / 10
      : 0,
    updatedAt: toIso(record.updatedAt),
  };
}

export function createPrismaCategoryBudgetStore(
  prisma: PrismaClient = getPrismaClient(),
): CategoryBudgetPersistenceStore {
  return {
    async listCategories(userId) {
      return prisma.category.findMany({
        where: {
          userId,
          type: "EXPENSE",
          isArchived: false,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      });
    },
    async listBudgets(userId) {
      return prisma.categoryBudget.findMany({
        where: { userId },
        include: { category: true },
        orderBy: [
          { status: "asc" },
          { category: { name: "asc" } },
          { updatedAt: "desc" },
        ],
      }) as unknown as Promise<DbCategoryBudget[]>;
    },
    async listExpenseTransactions(userId, start, end) {
      return prisma.transaction.findMany({
        where: {
          userId,
          type: "EXPENSE",
          status: "ACTIVE",
          deletedAt: null,
          splitRole: { not: "PARENT" },
          categoryId: { not: null },
          date: { gte: start, lt: end },
        },
        select: {
          userId: true,
          categoryId: true,
          type: true,
          status: true,
          splitRole: true,
          deletedAt: true,
          amountCents: true,
          date: true,
        },
      });
    },
    async create(userId, input, audit, now) {
      return prisma.$transaction(async (transaction) => {
        const existing = await transaction.categoryBudget.findFirst({
          where: {
            userId,
            categoryId: input.categoryId,
            period: "MONTHLY",
            status: "ACTIVE",
          },
          select: { id: true },
        });
        if (existing) throw new CategoryBudgetDuplicateError();
        const created = await transaction.categoryBudget.create({
          data: {
            userId,
            categoryId: input.categoryId,
            amountCents: input.amountCents,
            period: "MONTHLY",
            status: "ACTIVE",
            archivedAt: null,
            createdAt: now,
          },
          include: { category: true },
        });
        await transaction.auditEvent.create({
          data: {
            ...audit,
            entityId: created.id,
          },
        });
        return created as unknown as DbCategoryBudget;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },
    async update(userId, budgetId, expectedUpdatedAt, input, audit) {
      return prisma.$transaction(async (transaction) => {
        const duplicate = await transaction.categoryBudget.findFirst({
          where: {
            userId,
            id: { not: budgetId },
            categoryId: input.categoryId,
            period: "MONTHLY",
            status: "ACTIVE",
          },
          select: { id: true },
        });
        if (duplicate) throw new CategoryBudgetDuplicateError();
        const result = await transaction.categoryBudget.updateMany({
          where: {
            id: budgetId,
            userId,
            status: "ACTIVE",
            updatedAt: expectedUpdatedAt,
          },
          data: {
            categoryId: input.categoryId,
            amountCents: input.amountCents,
          },
        });
        if (result.count !== 1) return null;
        await transaction.auditEvent.create({ data: audit });
        return transaction.categoryBudget.findFirst({
          where: { id: budgetId, userId },
          include: { category: true },
        }) as unknown as DbCategoryBudget;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    },
    async archive(userId, budgetId, expectedUpdatedAt, now, audit) {
      return prisma.$transaction(async (transaction) => {
        const result = await transaction.categoryBudget.updateMany({
          where: {
            id: budgetId,
            userId,
            status: "ACTIVE",
            updatedAt: expectedUpdatedAt,
          },
          data: {
            status: "ARCHIVED",
            archivedAt: now,
          },
        });
        if (result.count !== 1) return null;
        await transaction.auditEvent.create({ data: audit });
        return transaction.categoryBudget.findFirst({
          where: { id: budgetId, userId },
          include: { category: true },
        }) as unknown as DbCategoryBudget;
      });
    },
  };
}

async function snapshotForUser(
  userId: string,
  store: CategoryBudgetPersistenceStore,
  now: Date,
) {
  const month = getAustralianCalendarMonth(now);
  const [categories, records, transactions] = await Promise.all([
    store.listCategories(userId),
    store.listBudgets(userId),
    store.listExpenseTransactions(userId, month.start, month.end),
  ]);
  const budgets = records.map((record) => toBudgetView(
    record,
    record.status === "ACTIVE"
      ? computeMonthlySpentCents(userId, record.categoryId, transactions, month.start, month.end)
      : 0,
  ));
  return {
    month: { key: month.key, label: month.label },
    categories,
    budgets,
    archivedCount: budgets.filter((budget) => budget.status === "ARCHIVED").length,
  };
}

export async function getCategoryBudgetSnapshot(
  context: AuthenticatedUserContext | null | undefined,
  store: CategoryBudgetPersistenceStore = createPrismaCategoryBudgetStore(),
  now = new Date(),
) {
  const user = requireAuthenticatedUserContext(context);
  return snapshotForUser(user.userId, store, now);
}

function requireActiveCategory(categories: BudgetCategoryView[], categoryId: string) {
  const category = categories.find((candidate) => candidate.id === categoryId);
  if (!category) throw new Error("Choose an active expense category.");
  return category;
}

export async function applyCategoryBudgetMutation(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  store: CategoryBudgetPersistenceStore = createPrismaCategoryBudgetStore(),
  now = new Date(),
) {
  const user = requireAuthenticatedUserContext(context);
  const request = categoryBudgetMutationSchema.parse(input);

  if (request.action === "CREATE") {
    requireActiveCategory(await store.listCategories(user.userId), request.categoryId);
    await store.create(
      user.userId,
      { categoryId: request.categoryId, amountCents: request.amountCents },
      safeAudit(user.userId, "CREATED", "BUDGET_CREATED", undefined, {
        periodCode: "MONTHLY",
        methodCode: "USER_CREATED",
      }),
      now,
    );
  }

  if (request.action === "UPDATE") {
    requireActiveCategory(await store.listCategories(user.userId), request.categoryId);
    const updated = await store.update(
      user.userId,
      request.budgetId,
      new Date(request.updatedAt),
      { categoryId: request.categoryId, amountCents: request.amountCents },
      safeAudit(user.userId, "UPDATED", "BUDGET_UPDATED", request.budgetId, {
        changedFieldCodes: ["CATEGORY", "AMOUNT"],
        periodCode: "MONTHLY",
      }),
    );
    if (!updated) throw new CategoryBudgetConflictError();
  }

  if (request.action === "ARCHIVE") {
    const archived = await store.archive(
      user.userId,
      request.budgetId,
      new Date(request.updatedAt),
      now,
      safeAudit(user.userId, "ARCHIVED", "BUDGET_ARCHIVED", request.budgetId, {
        stateCode: "ARCHIVED",
      }),
    );
    if (!archived) throw new CategoryBudgetConflictError();
  }

  return snapshotForUser(user.userId, store, now);
}
