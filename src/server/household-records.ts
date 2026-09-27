import { type Prisma, type PrismaClient } from "@prisma/client";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";
import { isVerifiedPreviewRuntime } from "@/src/server/preview-runtime";
import type { HouseholdShareType } from "@/src/server/households";

export type HouseholdRecordSummary = {
  entityType: HouseholdShareType;
  entityId: string;
  title: string;
  detail: string;
};

export type HouseholdSharedRecordSummary = HouseholdRecordSummary & {
  shareId: string;
  isOwnedByYou: boolean;
};

export type HouseholdRecordStore = {
  listOwnedCandidates(userId: string): Promise<HouseholdRecordSummary[]>;
  listSharedRecords(userId: string, householdId: string): Promise<HouseholdSharedRecordSummary[] | null>;
};

export class HouseholdRecordsUnavailableError extends Error {
  constructor() {
    super("Household records are available only in the verified Preview environment.");
    this.name = "HouseholdRecordsUnavailableError";
  }
}

function dateKey(value: Date | string) {
  return (value instanceof Date ? value : new Date(value)).toISOString().slice(0, 10);
}

function moneyDirection(type: string) {
  if (type === "INCOME") return "Money in";
  if (type === "TRANSFER") return "Transfer";
  return "Money out";
}

function reportSummary(entityId: string): HouseholdRecordSummary | null {
  const titles: Record<string, string> = {
    monthly: "Monthly spending report",
    loan: "Loan report",
    property: "Property report",
    "accountant-pack": "Accountant record pack",
  };
  return titles[entityId]
    ? { entityType: "REPORT", entityId, title: titles[entityId], detail: "Read-only report selection" }
    : null;
}

async function resolveSummary(
  tx: Prisma.TransactionClient,
  ownerUserId: string,
  entityType: HouseholdShareType,
  entityId: string,
): Promise<HouseholdRecordSummary | null> {
  if (entityType === "REPORT") return reportSummary(entityId);
  if (entityType === "TRANSACTION") {
    const record = await tx.transaction.findFirst({
      where: {
        id: entityId,
        userId: ownerUserId,
        status: "ACTIVE",
        deletedAt: null,
        splitRole: { not: "PARENT" },
      },
      select: { id: true, date: true, type: true, amountCents: true, category: { select: { name: true } } },
    });
    return record ? {
      entityType,
      entityId: record.id,
      title: record.category?.name ?? moneyDirection(record.type),
      detail: `${dateKey(record.date)} · ${moneyDirection(record.type)} · ${record.amountCents} cents`,
    } : null;
  }
  if (entityType === "PROPERTY") {
    const record = await tx.property.findFirst({
      where: { id: entityId, userId: ownerUserId, isArchived: false, deletedAt: null },
      select: { id: true, nickname: true, usage: true },
    });
    return record ? {
      entityType,
      entityId: record.id,
      title: record.nickname,
      detail: record.usage === "INVESTMENT" ? "Investment Property" : "Owner-occupied Property",
    } : null;
  }
  if (entityType === "LOAN_ACCOUNT") {
    const record = await tx.loanAccount.findFirst({
      where: { id: entityId, userId: ownerUserId, isArchived: false, deletedAt: null },
      select: { id: true, nickname: true, purpose: true },
    });
    return record ? {
      entityType,
      entityId: record.id,
      title: record.nickname,
      detail: record.purpose === "INVESTMENT" ? "Investment loan" : "Personal loan",
    } : null;
  }
  if (entityType === "CATEGORY_BUDGET") {
    const record = await tx.categoryBudget.findFirst({
      where: { id: entityId, userId: ownerUserId, status: "ACTIVE" },
      select: { id: true, category: { select: { name: true } } },
    });
    return record ? {
      entityType,
      entityId: record.id,
      title: record.category.name,
      detail: "Monthly budget",
    } : null;
  }
  if (entityType === "RECURRING_ITEM") {
    const record = await tx.recurringItem.findFirst({
      where: { id: entityId, userId: ownerUserId, status: { not: "ARCHIVED" } },
      select: { id: true, label: true, cadence: true },
    });
    return record ? {
      entityType,
      entityId: record.id,
      title: record.label,
      detail: record.cadence === "FORTNIGHTLY" ? "Every 2 weeks" : record.cadence.toLowerCase(),
    } : null;
  }
  if (entityType === "SAVINGS_GOAL") {
    const record = await tx.savingsGoal.findFirst({
      where: { id: entityId, userId: ownerUserId, status: { not: "ARCHIVED" } },
      select: { id: true, name: true, targetDate: true },
    });
    return record ? {
      entityType,
      entityId: record.id,
      title: record.name,
      detail: record.targetDate ? `Target ${dateKey(record.targetDate)}` : "Savings goal",
    } : null;
  }
  const record = await tx.netWorthSnapshot.findFirst({
    where: { id: entityId, userId: ownerUserId, archivedAt: null },
    select: { id: true, snapshotDate: true },
  });
  return record ? {
    entityType,
    entityId: record.id,
    title: `Net worth snapshot · ${dateKey(record.snapshotDate)}`,
    detail: "Manual snapshot",
  } : null;
}

export function createPrismaHouseholdRecordStore(
  prisma: PrismaClient = getPrismaClient(),
): HouseholdRecordStore {
  return {
    async listOwnedCandidates(userId) {
      return prisma.$transaction(async (tx) => {
        const [
          transactions,
          properties,
          loans,
          budgets,
          recurring,
          goals,
          snapshots,
        ] = await Promise.all([
          tx.transaction.findMany({
            where: {
              userId,
              status: "ACTIVE",
              deletedAt: null,
              splitRole: { not: "PARENT" },
            },
            orderBy: [{ date: "desc" }, { createdAt: "desc" }],
            take: 50,
            select: { id: true },
          }),
          tx.property.findMany({
            where: { userId, isArchived: false, deletedAt: null },
            orderBy: { nickname: "asc" },
            select: { id: true },
          }),
          tx.loanAccount.findMany({
            where: { userId, isArchived: false, deletedAt: null },
            orderBy: { nickname: "asc" },
            select: { id: true },
          }),
          tx.categoryBudget.findMany({
            where: { userId, status: "ACTIVE" },
            orderBy: { createdAt: "asc" },
            select: { id: true },
          }),
          tx.recurringItem.findMany({
            where: { userId, status: { not: "ARCHIVED" } },
            orderBy: { createdAt: "asc" },
            select: { id: true },
          }),
          tx.savingsGoal.findMany({
            where: { userId, status: { not: "ARCHIVED" } },
            orderBy: { createdAt: "asc" },
            select: { id: true },
          }),
          tx.netWorthSnapshot.findMany({
            where: { userId, archivedAt: null },
            orderBy: { snapshotDate: "desc" },
            select: { id: true },
          }),
        ]);
        const refs: Array<{ entityType: HouseholdShareType; entityId: string }> = [
          ...transactions.map((entry) => ({ entityType: "TRANSACTION" as const, entityId: entry.id })),
          ...properties.map((entry) => ({ entityType: "PROPERTY" as const, entityId: entry.id })),
          ...loans.map((entry) => ({ entityType: "LOAN_ACCOUNT" as const, entityId: entry.id })),
          ...budgets.map((entry) => ({ entityType: "CATEGORY_BUDGET" as const, entityId: entry.id })),
          ...recurring.map((entry) => ({ entityType: "RECURRING_ITEM" as const, entityId: entry.id })),
          ...goals.map((entry) => ({ entityType: "SAVINGS_GOAL" as const, entityId: entry.id })),
          ...snapshots.map((entry) => ({ entityType: "NET_WORTH_SNAPSHOT" as const, entityId: entry.id })),
          ...["monthly", "loan", "property", "accountant-pack"].map((entityId) => ({
            entityType: "REPORT" as const,
            entityId,
          })),
        ];
        const summaries = await Promise.all(
          refs.map((entry) => resolveSummary(tx, userId, entry.entityType, entry.entityId)),
        );
        return summaries.filter((entry): entry is HouseholdRecordSummary => Boolean(entry));
      });
    },

    async listSharedRecords(userId, householdId) {
      return prisma.$transaction(async (tx) => {
        const member = await tx.householdMembership.findFirst({
          where: { householdId, userId, status: "ACTIVE" },
          select: { id: true },
        });
        if (!member) return null;
        const shares = await tx.householdRecordShare.findMany({
          where: { householdId, revokedAt: null },
          orderBy: { sharedAt: "desc" },
          select: {
            id: true,
            ownerUserId: true,
            entityType: true,
            entityId: true,
          },
        });
        const summaries = await Promise.all(shares.map(async (share) => {
          const summary = await resolveSummary(
            tx,
            share.ownerUserId,
            share.entityType as HouseholdShareType,
            share.entityId,
          );
          return summary ? {
            ...summary,
            shareId: share.id,
            isOwnedByYou: share.ownerUserId === userId,
          } : null;
        }));
        return summaries.filter((entry): entry is HouseholdSharedRecordSummary => Boolean(entry));
      });
    },
  };
}

type RuntimeOptions = { runtimeEnabled?: boolean };

function requireRuntime(options: RuntimeOptions) {
  if (!(options.runtimeEnabled ?? isVerifiedPreviewRuntime())) {
    throw new HouseholdRecordsUnavailableError();
  }
}

export async function listHouseholdRecordWorkspace(
  context: AuthenticatedUserContext | null | undefined,
  householdId: string,
  store: HouseholdRecordStore = createPrismaHouseholdRecordStore(),
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  const sharedRecords = await store.listSharedRecords(user.userId, householdId);
  if (!sharedRecords) throw new Error("That household is not available for your account.");
  const candidates = await store.listOwnedCandidates(user.userId);
  return { candidates, sharedRecords };
}
