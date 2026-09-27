import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { auditEventSchema } from "@/lib/validation/audit";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getCategoryBudgetSnapshot } from "@/src/server/category-budgets";
import { getPrismaClient } from "@/src/server/db";
import { isVerifiedPreviewRuntime } from "@/src/server/preview-runtime";

export type ReminderFamilyCode =
  | "RECURRING_EXPECTED_DATE"
  | "BUDGET_EIGHTY_PERCENT"
  | "BUDGET_FULL"
  | "IMPORT"
  | "SAVINGS_GOAL"
  | "UNMATCHED_LOAN"
  | "EOFY_PREPARATION";

export type ReminderStatusCode = "ACTIVE" | "ACKNOWLEDGED" | "DISMISSED" | "ARCHIVED";

const REMINDER_FAMILIES: ReminderFamilyCode[] = [
  "RECURRING_EXPECTED_DATE",
  "BUDGET_EIGHTY_PERCENT",
  "BUDGET_FULL",
  "IMPORT",
  "SAVINGS_GOAL",
  "UNMATCHED_LOAN",
  "EOFY_PREPARATION",
];

type ReminderPreferenceRecord = {
  id: string;
  userId: string;
  family: ReminderFamilyCode;
  isEnabled: boolean;
  leadDays: number;
  thresholdPercent: number | null;
};

type ReminderRecord = {
  id: string;
  userId: string;
  family: ReminderFamilyCode;
  sourceEntityId: string | null;
  dedupeKey: string;
  dueDate: Date | string;
  status: ReminderStatusCode;
  acknowledgedAt: Date | string | null;
  dismissedAt: Date | string | null;
  archivedAt: Date | string | null;
};

export type ReminderCandidate = {
  family: ReminderFamilyCode;
  sourceEntityId: string | null;
  dedupeKey: string;
  dueDate: Date;
};

type RecurringReminderSource = { id: string; nextExpectedDate: Date | string };
type GoalReminderSource = {
  id: string;
  targetAmountCents: number;
  targetDate: Date | string | null;
  openingProgressCents: number;
  contributions: Array<{ amountCents: number }>;
};
type LoanReminderSource = { id: string; repaymentDate: Date | string };

export type InAppReminderSourceStore = {
  listRecurring(userId: string): Promise<RecurringReminderSource[]>;
  listGoals(userId: string): Promise<GoalReminderSource[]>;
  listUnmatchedLoans(userId: string): Promise<LoanReminderSource[]>;
};

export type InAppReminderStore = {
  listPreferences(userId: string): Promise<ReminderPreferenceRecord[]>;
  listReminders(userId: string): Promise<ReminderRecord[]>;
  setPreference(
    userId: string,
    input: {
      family: ReminderFamilyCode;
      isEnabled: boolean;
      leadDays: number;
      thresholdPercent: number | null;
    },
  ): Promise<ReminderPreferenceRecord>;
  createCandidate(userId: string, candidate: ReminderCandidate, now: Date): Promise<ReminderRecord | null>;
  setStatus(
    userId: string,
    reminderId: string,
    status: ReminderStatusCode,
    now: Date,
  ): Promise<ReminderRecord | null>;
};

export class InAppRemindersUnavailableError extends Error {
  constructor() {
    super("In-app reminders are available only in the verified Preview environment.");
    this.name = "InAppRemindersUnavailableError";
  }
}

export class InAppReminderConflictError extends Error {
  constructor() {
    super("That reminder changed or is not available for your account.");
    this.name = "InAppReminderConflictError";
  }
}

const familySchema = z.enum([
  "RECURRING_EXPECTED_DATE",
  "BUDGET_EIGHTY_PERCENT",
  "BUDGET_FULL",
  "IMPORT",
  "SAVINGS_GOAL",
  "UNMATCHED_LOAN",
  "EOFY_PREPARATION",
]);
const idSchema = z.string().trim().min(1).max(128);
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const preferenceSchema = z.object({
  action: z.literal("SET_PREFERENCE"),
  family: familySchema,
  isEnabled: z.boolean(),
  leadDays: z.number().int().min(0).max(365),
  thresholdPercent: z.number().int().min(1).max(100).nullable(),
}).strict().superRefine((input, context) => {
  const expectedThreshold = input.family === "BUDGET_EIGHTY_PERCENT"
    ? 80
    : input.family === "BUDGET_FULL"
      ? 100
      : null;
  if (input.thresholdPercent !== expectedThreshold) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: expectedThreshold === null
        ? "A percentage is available only for budget reminders."
        : `Use the fixed ${expectedThreshold}% budget threshold.`,
      path: ["thresholdPercent"],
    });
  }
});

export const inAppReminderMutationSchema = z.union([
  preferenceSchema,
  z.object({ action: z.literal("REFRESH_DERIVED") }).strict(),
  z.object({
    action: z.literal("CREATE_DATE_REMINDER"),
    family: z.enum(["IMPORT", "EOFY_PREPARATION"]),
    dueDate: dateOnlySchema,
  }).strict(),
  z.object({
    action: z.literal("SET_STATUS"),
    reminderId: idSchema,
    status: z.enum(["ACKNOWLEDGED", "DISMISSED", "ARCHIVED"]),
  }).strict(),
]);

function dateOnly(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error("Choose a valid reminder date.");
  }
  return parsed;
}

function iso(value: Date | string) {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function australianDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function shiftDate(value: Date | string, days: number) {
  const key = iso(value).slice(0, 10);
  const shifted = dateOnly(key);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

export function buildReminderCandidate(
  family: ReminderFamilyCode,
  sourceEntityId: string | null,
  dueDate: Date,
  eventKey = dueDate.toISOString().slice(0, 10),
): ReminderCandidate {
  const dedupeKey = createHash("sha256")
    .update(`${family}|${sourceEntityId ?? "account"}|${eventKey}`)
    .digest("hex");
  return { family, sourceEntityId, dedupeKey, dueDate };
}

function safeAudit(
  userId: string,
  entityType: "REMINDER_PREFERENCE" | "REMINDER",
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

function defaultPreference(family: ReminderFamilyCode) {
  return {
    family,
    isEnabled: false,
    leadDays: 0,
    thresholdPercent: family === "BUDGET_EIGHTY_PERCENT"
      ? 80
      : family === "BUDGET_FULL"
        ? 100
        : null,
  };
}

function preferenceView(record: ReminderPreferenceRecord) {
  return {
    family: record.family,
    isEnabled: record.isEnabled,
    leadDays: record.leadDays,
    thresholdPercent: record.thresholdPercent,
  };
}

function reminderView(record: ReminderRecord, today: string) {
  const dueDate = iso(record.dueDate).slice(0, 10);
  return {
    id: record.id,
    family: record.family,
    dueDate,
    status: record.status,
    timing: dueDate < today ? "OVERDUE" as const : dueDate === today ? "DUE" as const : "UPCOMING" as const,
  };
}

export function createPrismaInAppReminderSourceStore(
  prisma: PrismaClient = getPrismaClient(),
): InAppReminderSourceStore {
  return {
    async listRecurring(userId) {
      return prisma.recurringItem.findMany({
        where: { userId, status: "ACTIVE", nextExpectedDate: { not: null } },
        select: { id: true, nextExpectedDate: true },
      }) as unknown as Promise<RecurringReminderSource[]>;
    },
    async listGoals(userId) {
      return prisma.savingsGoal.findMany({
        where: { userId, status: "ACTIVE" },
        select: {
          id: true,
          targetAmountCents: true,
          targetDate: true,
          openingProgressCents: true,
          contributions: { where: { userId, deletedAt: null }, select: { amountCents: true } },
        },
      }) as unknown as Promise<GoalReminderSource[]>;
    },
    async listUnmatchedLoans(userId) {
      return prisma.loanRepayment.findMany({
        where: {
          userId,
          reconciliationStatus: "UNMATCHED",
          isArchived: false,
          deletedAt: null,
        },
        select: { id: true, repaymentDate: true },
      }) as unknown as Promise<LoanReminderSource[]>;
    },
  };
}

export function createPrismaInAppReminderStore(
  prisma: PrismaClient = getPrismaClient(),
): InAppReminderStore {
  return {
    async listPreferences(userId) {
      return prisma.reminderPreference.findMany({
        where: { userId },
        orderBy: { family: "asc" },
      }) as unknown as Promise<ReminderPreferenceRecord[]>;
    },

    async listReminders(userId) {
      return prisma.reminder.findMany({
        where: { userId, status: { not: "ARCHIVED" } },
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      }) as unknown as Promise<ReminderRecord[]>;
    },

    async setPreference(userId, input) {
      return prisma.$transaction(async (tx) => {
        const preference = await tx.reminderPreference.upsert({
          where: { userId_family: { userId, family: input.family } },
          create: { userId, ...input },
          update: {
            isEnabled: input.isEnabled,
            leadDays: input.leadDays,
            thresholdPercent: input.thresholdPercent,
          },
        });
        await tx.auditEvent.create({
          data: safeAudit(
            userId,
            "REMINDER_PREFERENCE",
            preference.id,
            "UPDATED",
            input.isEnabled ? "REMINDER_PREFERENCE_ENABLED" : "REMINDER_PREFERENCE_DISABLED",
          ),
        });
        return preference as ReminderPreferenceRecord;
      });
    },

    async createCandidate(userId, candidate, now) {
      return prisma.$transaction(async (tx) => {
        const preference = await tx.reminderPreference.findUnique({
          where: { userId_family: { userId, family: candidate.family } },
          select: { isEnabled: true },
        });
        if (!preference?.isEnabled) return null;
        const existing = await tx.reminder.findUnique({
          where: { userId_dedupeKey: { userId, dedupeKey: candidate.dedupeKey } },
        });
        if (existing) return existing as ReminderRecord;
        const reminder = await tx.reminder.create({
          data: { userId, ...candidate, createdAt: now },
        });
        await tx.auditEvent.create({
          data: safeAudit(userId, "REMINDER", reminder.id, "CREATED", "IN_APP_REMINDER_CREATED"),
        });
        return reminder as ReminderRecord;
      });
    },

    async setStatus(userId, reminderId, status, now) {
      return prisma.$transaction(async (tx) => {
        const changed = await tx.reminder.updateMany({
          where: { id: reminderId, userId },
          data: {
            status,
            acknowledgedAt: status === "ACKNOWLEDGED" ? now : null,
            dismissedAt: status === "DISMISSED" ? now : null,
            archivedAt: status === "ARCHIVED" ? now : null,
          },
        });
        if (changed.count !== 1) return null;
        await tx.auditEvent.create({
          data: safeAudit(
            userId,
            "REMINDER",
            reminderId,
            status === "ARCHIVED" ? "ARCHIVED" : "UPDATED",
            `IN_APP_REMINDER_${status}`,
          ),
        });
        return tx.reminder.findFirst({
          where: { id: reminderId, userId },
        }) as unknown as Promise<ReminderRecord | null>;
      });
    },
  };
}

type RuntimeOptions = { runtimeEnabled?: boolean; now?: Date };

function requireRuntime(options: RuntimeOptions) {
  if (!(options.runtimeEnabled ?? isVerifiedPreviewRuntime())) {
    throw new InAppRemindersUnavailableError();
  }
}

type ReminderRefreshDependencies = {
  reminderStore?: InAppReminderStore;
  sourceStore?: InAppReminderSourceStore;
  budgetLoader?: typeof getCategoryBudgetSnapshot;
};

export async function refreshDerivedInAppReminders(
  context: AuthenticatedUserContext | null | undefined,
  dependencies: ReminderRefreshDependencies = {},
  now = new Date(),
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  const reminderStore = dependencies.reminderStore ?? createPrismaInAppReminderStore();
  const sourceStore = dependencies.sourceStore ?? createPrismaInAppReminderSourceStore();
  const preferences = await reminderStore.listPreferences(user.userId);
  const enabled = new Map(preferences.filter((entry) => entry.isEnabled).map((entry) => [entry.family, entry]));
  const candidates: ReminderCandidate[] = [];
  const todayKey = australianDateKey(now);
  const today = dateOnly(todayKey);

  if (enabled.has("RECURRING_EXPECTED_DATE")) {
    const preference = enabled.get("RECURRING_EXPECTED_DATE")!;
    for (const source of await sourceStore.listRecurring(user.userId)) {
      const expectedKey = iso(source.nextExpectedDate).slice(0, 10);
      candidates.push(buildReminderCandidate(
        "RECURRING_EXPECTED_DATE",
        source.id,
        shiftDate(source.nextExpectedDate, -preference.leadDays),
        `EXPECTED:${expectedKey}`,
      ));
    }
  }

  if (enabled.has("SAVINGS_GOAL")) {
    const preference = enabled.get("SAVINGS_GOAL")!;
    for (const source of await sourceStore.listGoals(user.userId)) {
      if (source.targetDate) {
        const targetKey = iso(source.targetDate).slice(0, 10);
        candidates.push(buildReminderCandidate(
          "SAVINGS_GOAL",
          source.id,
          shiftDate(source.targetDate, -preference.leadDays),
          `TARGET:${targetKey}`,
        ));
      }
      const progress = source.openingProgressCents
        + source.contributions.reduce((sum, entry) => sum + entry.amountCents, 0);
      for (const milestone of [25, 50, 75, 100]) {
        if (progress * 100 >= source.targetAmountCents * milestone) {
          candidates.push(buildReminderCandidate(
            "SAVINGS_GOAL",
            source.id,
            today,
            `MILESTONE:${milestone}`,
          ));
        }
      }
    }
  }

  const budgetFamilies = (["BUDGET_EIGHTY_PERCENT", "BUDGET_FULL"] as const)
    .filter((family) => enabled.has(family));
  if (budgetFamilies.length) {
    const snapshot = await (dependencies.budgetLoader ?? getCategoryBudgetSnapshot)(context, undefined, now);
    for (const budget of snapshot.budgets.filter((entry) => entry.status === "ACTIVE")) {
      for (const family of budgetFamilies) {
        const threshold = family === "BUDGET_EIGHTY_PERCENT" ? 80 : 100;
        if (budget.progressPercent >= threshold) {
          candidates.push(buildReminderCandidate(
            family,
            budget.id,
            today,
            `${snapshot.month.key}:${threshold}`,
          ));
        }
      }
    }
  }

  if (enabled.has("UNMATCHED_LOAN")) {
    const preference = enabled.get("UNMATCHED_LOAN")!;
    for (const source of await sourceStore.listUnmatchedLoans(user.userId)) {
      candidates.push(buildReminderCandidate(
        "UNMATCHED_LOAN",
        source.id,
        shiftDate(source.repaymentDate, -preference.leadDays),
        "UNMATCHED",
      ));
    }
  }

  await Promise.all(candidates.map((candidate) => reminderStore.createCandidate(user.userId, candidate, now)));
  return { candidateCount: candidates.length };
}

export async function getInAppReminders(
  context: AuthenticatedUserContext | null | undefined,
  store?: InAppReminderStore,
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  const resolvedStore = store ?? createPrismaInAppReminderStore();
  const [storedPreferences, reminders] = await Promise.all([
    resolvedStore.listPreferences(user.userId),
    resolvedStore.listReminders(user.userId),
  ]);
  const preferenceMap = new Map(storedPreferences.map((entry) => [entry.family, entry]));
  const preferences = REMINDER_FAMILIES.map((family) => (
    preferenceMap.has(family) ? preferenceView(preferenceMap.get(family)!) : defaultPreference(family)
  ));
  const today = australianDateKey(options.now ?? new Date());
  return {
    preferences,
    reminders: reminders.map((record) => reminderView(record, today)),
  };
}

export async function mutateInAppReminder(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  store?: InAppReminderStore,
  now = new Date(),
  options: RuntimeOptions = {},
  refreshDependencies: Omit<ReminderRefreshDependencies, "reminderStore"> = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  const request = inAppReminderMutationSchema.parse(input);
  const resolvedStore = store ?? createPrismaInAppReminderStore();

  if (request.action === "SET_PREFERENCE") {
    return {
      type: "PREFERENCE" as const,
      preference: preferenceView(await resolvedStore.setPreference(user.userId, {
        family: request.family,
        isEnabled: request.isEnabled,
        leadDays: request.leadDays,
        thresholdPercent: request.thresholdPercent,
      })),
    };
  }
  if (request.action === "REFRESH_DERIVED") {
    const result = await refreshDerivedInAppReminders(
      context,
      { ...refreshDependencies, reminderStore: resolvedStore },
      now,
      options,
    );
    return { type: "REFRESH" as const, ...result };
  }
  if (request.action === "CREATE_DATE_REMINDER") {
    const candidate = buildReminderCandidate(
      request.family,
      null,
      dateOnly(request.dueDate),
      `USER_SELECTED:${request.dueDate}`,
    );
    const reminder = await resolvedStore.createCandidate(user.userId, candidate, now);
    return {
      type: "REMINDER" as const,
      reminder: reminder ? reminderView(reminder, australianDateKey(now)) : null,
    };
  }
  const reminder = await resolvedStore.setStatus(
    user.userId,
    request.reminderId,
    request.status,
    now,
  );
  if (!reminder) throw new InAppReminderConflictError();
  return {
    type: "REMINDER" as const,
    reminder: reminderView(reminder, australianDateKey(now)),
  };
}
