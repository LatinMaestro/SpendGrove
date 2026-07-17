import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { auditEventSchema } from "@/lib/validation/audit";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";
import { PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED } from "@/src/server/phase-9-runtime";

export type SavingsGoalStatusCode = "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";

type SavingsGoalContributionRecord = {
  id: string;
  userId: string;
  savingsGoalId: string;
  amountCents: number;
  contributionDate: Date | string;
  note: string | null;
  deletedAt: Date | string | null;
};

export type SavingsGoalRecord = {
  id: string;
  userId: string;
  name: string;
  targetAmountCents: number;
  targetDate: Date | string | null;
  openingProgressCents: number;
  status: SavingsGoalStatusCode;
  completedAt: Date | string | null;
  archivedAt: Date | string | null;
  updatedAt: Date | string;
  contributions: SavingsGoalContributionRecord[];
};

export type SavingsGoalView = {
  id: string;
  name: string;
  targetAmountCents: number;
  targetDate: string | null;
  progressCents: number;
  remainingCents: number;
  progressPercent: number;
  status: SavingsGoalStatusCode;
  completedAt: string | null;
  updatedAt: string;
};

type GoalFields = {
  name: string;
  targetAmountCents: number;
  targetDate: Date | null;
  openingProgressCents: number;
};

type ContributionFields = {
  amountCents: number;
  contributionDate: Date;
  note: string | null;
};

export type SavingsGoalStore = {
  list(userId: string): Promise<SavingsGoalRecord[]>;
  create(userId: string, input: GoalFields, now: Date): Promise<SavingsGoalRecord>;
  update(
    userId: string,
    goalId: string,
    expectedUpdatedAt: Date,
    input: GoalFields,
  ): Promise<SavingsGoalRecord | null>;
  setStatus(
    userId: string,
    goalId: string,
    expectedUpdatedAt: Date,
    status: SavingsGoalStatusCode,
    now: Date,
  ): Promise<SavingsGoalRecord | null>;
  addContribution(
    userId: string,
    goalId: string,
    input: ContributionFields,
    now: Date,
  ): Promise<SavingsGoalRecord | null>;
  deleteContribution(
    userId: string,
    goalId: string,
    contributionId: string,
    now: Date,
  ): Promise<SavingsGoalRecord | null>;
};

export class SavingsGoalsUnavailableError extends Error {
  constructor() {
    super("Savings goals are not available until the Preview migration is verified.");
    this.name = "SavingsGoalsUnavailableError";
  }
}

export class SavingsGoalConflictError extends Error {
  constructor() {
    super("That savings goal changed or is not available for your account.");
    this.name = "SavingsGoalConflictError";
  }
}

const idSchema = z.string().trim().min(1).max(128);
const centsSchema = z.number().int().positive().max(100_000_000_000);
const openingProgressSchema = z.number().int().min(0).max(100_000_000_000);
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();
const nameSchema = z.string().trim().min(1, "Enter a goal name.").max(80)
  .transform((value) => value.replace(/\s+/g, " "));
const noteSchema = z.string().trim().max(240).nullable()
  .transform((value) => value || null);

const goalFieldsSchema = z.object({
  name: nameSchema,
  targetAmountCents: centsSchema,
  targetDate: dateOnlySchema,
  openingProgressCents: openingProgressSchema.default(0),
}).strict();

export const savingsGoalMutationSchema = z.discriminatedUnion("action", [
  goalFieldsSchema.extend({ action: z.literal("CREATE") }).strict(),
  goalFieldsSchema.extend({
    action: z.literal("UPDATE"),
    goalId: idSchema,
    updatedAt: z.string().datetime(),
  }).strict(),
  z.object({
    action: z.literal("SET_STATUS"),
    goalId: idSchema,
    updatedAt: z.string().datetime(),
    status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]),
  }).strict(),
  z.object({
    action: z.literal("ADD_CONTRIBUTION"),
    goalId: idSchema,
    amountCents: centsSchema,
    contributionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    note: noteSchema.default(null),
  }).strict(),
  z.object({
    action: z.literal("DELETE_CONTRIBUTION"),
    goalId: idSchema,
    contributionId: idSchema,
  }).strict(),
]);

export type SavingsGoalMutation = z.infer<typeof savingsGoalMutationSchema>;

function dateOnly(value: string | null) {
  if (value === null) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error("Choose a valid date.");
  }
  return parsed;
}

function iso(value: Date | string | null) {
  if (value === null) return null;
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function safeAudit(
  userId: string,
  entityType: "SAVINGS_GOAL" | "SAVINGS_GOAL_CONTRIBUTION",
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

function toView(record: SavingsGoalRecord): SavingsGoalView {
  const contributionCents = record.contributions.reduce((sum, contribution) => (
    contribution.deletedAt ? sum : sum + contribution.amountCents
  ), 0);
  const progressCents = record.openingProgressCents + contributionCents;
  return {
    id: record.id,
    name: record.name,
    targetAmountCents: record.targetAmountCents,
    targetDate: iso(record.targetDate)?.slice(0, 10) ?? null,
    progressCents,
    remainingCents: Math.max(record.targetAmountCents - progressCents, 0),
    progressPercent: record.targetAmountCents > 0
      ? Math.round((progressCents / record.targetAmountCents) * 1000) / 10
      : 0,
    status: record.status,
    completedAt: iso(record.completedAt),
    updatedAt: iso(record.updatedAt) as string,
  };
}

async function ownedGoal(
  tx: Prisma.TransactionClient,
  userId: string,
  goalId: string,
) {
  return tx.savingsGoal.findFirst({
    where: { id: goalId, userId },
    include: {
      contributions: {
        where: { deletedAt: null },
        orderBy: [{ contributionDate: "desc" }, { createdAt: "desc" }],
      },
    },
  });
}

export function createPrismaSavingsGoalStore(
  prisma: PrismaClient = getPrismaClient(),
): SavingsGoalStore {
  return {
    async list(userId) {
      return prisma.savingsGoal.findMany({
        where: { userId },
        include: {
          contributions: {
            where: { deletedAt: null },
            orderBy: [{ contributionDate: "desc" }, { createdAt: "desc" }],
          },
        },
        orderBy: [{ status: "asc" }, { targetDate: "asc" }, { name: "asc" }],
      }) as unknown as Promise<SavingsGoalRecord[]>;
    },

    async create(userId, input, now) {
      return prisma.$transaction(async (tx) => {
        const created = await tx.savingsGoal.create({
          data: { userId, ...input, createdAt: now },
          include: { contributions: true },
        });
        await tx.auditEvent.create({
          data: safeAudit(userId, "SAVINGS_GOAL", created.id, "CREATED", "SAVINGS_GOAL_CREATED"),
        });
        return created as unknown as SavingsGoalRecord;
      });
    },

    async update(userId, goalId, expectedUpdatedAt, input) {
      return prisma.$transaction(async (tx) => {
        const changed = await tx.savingsGoal.updateMany({
          where: { id: goalId, userId, updatedAt: expectedUpdatedAt },
          data: input,
        });
        if (changed.count !== 1) return null;
        await tx.auditEvent.create({
          data: safeAudit(userId, "SAVINGS_GOAL", goalId, "UPDATED", "SAVINGS_GOAL_UPDATED"),
        });
        return ownedGoal(tx, userId, goalId) as unknown as Promise<SavingsGoalRecord | null>;
      });
    },

    async setStatus(userId, goalId, expectedUpdatedAt, status, now) {
      return prisma.$transaction(async (tx) => {
        const changed = await tx.savingsGoal.updateMany({
          where: { id: goalId, userId, updatedAt: expectedUpdatedAt },
          data: {
            status,
            completedAt: status === "COMPLETED" ? now : null,
            archivedAt: status === "ARCHIVED" ? now : null,
          },
        });
        if (changed.count !== 1) return null;
        await tx.auditEvent.create({
          data: safeAudit(
            userId,
            "SAVINGS_GOAL",
            goalId,
            status === "ARCHIVED" ? "ARCHIVED" : "UPDATED",
            `SAVINGS_GOAL_STATUS_${status}`,
          ),
        });
        return ownedGoal(tx, userId, goalId) as unknown as Promise<SavingsGoalRecord | null>;
      });
    },

    async addContribution(userId, goalId, input, now) {
      return prisma.$transaction(async (tx) => {
        const goal = await tx.savingsGoal.findFirst({
          where: { id: goalId, userId, status: { not: "ARCHIVED" } },
          select: { id: true },
        });
        if (!goal) return null;
        const contribution = await tx.savingsGoalContribution.create({
          data: { userId, savingsGoalId: goalId, ...input, createdAt: now },
        });
        await tx.auditEvent.create({
          data: safeAudit(
            userId,
            "SAVINGS_GOAL_CONTRIBUTION",
            contribution.id,
            "CREATED",
            "SAVINGS_GOAL_CONTRIBUTION_ADDED",
          ),
        });
        return ownedGoal(tx, userId, goalId) as unknown as Promise<SavingsGoalRecord | null>;
      });
    },

    async deleteContribution(userId, goalId, contributionId, now) {
      return prisma.$transaction(async (tx) => {
        const changed = await tx.savingsGoalContribution.updateMany({
          where: {
            id: contributionId,
            userId,
            savingsGoalId: goalId,
            deletedAt: null,
          },
          data: { deletedAt: now },
        });
        if (changed.count !== 1) return null;
        await tx.auditEvent.create({
          data: safeAudit(
            userId,
            "SAVINGS_GOAL_CONTRIBUTION",
            contributionId,
            "DELETED",
            "SAVINGS_GOAL_CONTRIBUTION_REMOVED",
          ),
        });
        return ownedGoal(tx, userId, goalId) as unknown as Promise<SavingsGoalRecord | null>;
      });
    },
  };
}

type RuntimeOptions = { runtimeEnabled?: boolean };

function requireRuntime(options: RuntimeOptions) {
  if (!(options.runtimeEnabled ?? PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED)) {
    throw new SavingsGoalsUnavailableError();
  }
}

export async function listSavingsGoals(
  context: AuthenticatedUserContext | null | undefined,
  store?: SavingsGoalStore,
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  const records = await (store ?? createPrismaSavingsGoalStore()).list(user.userId);
  return records.map(toView);
}

export async function mutateSavingsGoal(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  store?: SavingsGoalStore,
  now = new Date(),
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  const request = savingsGoalMutationSchema.parse(input);
  const resolvedStore = store ?? createPrismaSavingsGoalStore();
  let record: SavingsGoalRecord | null;

  if (request.action === "CREATE") {
    record = await resolvedStore.create(user.userId, {
      name: request.name,
      targetAmountCents: request.targetAmountCents,
      targetDate: dateOnly(request.targetDate),
      openingProgressCents: request.openingProgressCents,
    }, now);
  } else if (request.action === "UPDATE") {
    record = await resolvedStore.update(
      user.userId,
      request.goalId,
      new Date(request.updatedAt),
      {
        name: request.name,
        targetAmountCents: request.targetAmountCents,
        targetDate: dateOnly(request.targetDate),
        openingProgressCents: request.openingProgressCents,
      },
    );
  } else if (request.action === "SET_STATUS") {
    record = await resolvedStore.setStatus(
      user.userId,
      request.goalId,
      new Date(request.updatedAt),
      request.status,
      now,
    );
  } else if (request.action === "ADD_CONTRIBUTION") {
    record = await resolvedStore.addContribution(user.userId, request.goalId, {
      amountCents: request.amountCents,
      contributionDate: dateOnly(request.contributionDate) as Date,
      note: request.note,
    }, now);
  } else {
    record = await resolvedStore.deleteContribution(
      user.userId,
      request.goalId,
      request.contributionId,
      now,
    );
  }

  if (!record) throw new SavingsGoalConflictError();
  return toView(record);
}
