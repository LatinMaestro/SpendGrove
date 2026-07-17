import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { auditEventSchema } from "@/lib/validation/audit";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";
import { PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED } from "@/src/server/phase-9-runtime";

export type ReminderFamilyCode =
  | "RECURRING_EXPECTED_DATE"
  | "BUDGET_EIGHTY_PERCENT"
  | "BUDGET_FULL"
  | "IMPORT"
  | "SAVINGS_GOAL"
  | "UNMATCHED_LOAN"
  | "EOFY_PREPARATION";

export type ReminderStatusCode = "ACTIVE" | "ACKNOWLEDGED" | "DISMISSED" | "ARCHIVED";

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
  createCandidate(
    userId: string,
    candidate: ReminderCandidate,
    now: Date,
  ): Promise<ReminderRecord | null>;
  setStatus(
    userId: string,
    reminderId: string,
    status: ReminderStatusCode,
    now: Date,
  ): Promise<ReminderRecord | null>;
};

export class InAppRemindersUnavailableError extends Error {
  constructor() {
    super("In-app reminders are not available until the Preview migration is verified.");
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
  const isBudgetFamily = input.family === "BUDGET_EIGHTY_PERCENT"
    || input.family === "BUDGET_FULL";
  if (!isBudgetFamily && input.thresholdPercent !== null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A percentage is available only for budget reminders.",
      path: ["thresholdPercent"],
    });
  }
});

export const inAppReminderMutationSchema = z.union([
  preferenceSchema,
  z.object({
    action: z.literal("CREATE_CANDIDATE"),
    family: familySchema,
    sourceEntityId: idSchema.nullable(),
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

export function buildReminderCandidate(
  family: ReminderFamilyCode,
  sourceEntityId: string | null,
  dueDate: Date,
): ReminderCandidate {
  const dateKey = dueDate.toISOString().slice(0, 10);
  const dedupeKey = createHash("sha256")
    .update(`${family}|${sourceEntityId ?? "account"}|${dateKey}`)
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

function preferenceView(record: ReminderPreferenceRecord) {
  return {
    family: record.family,
    isEnabled: record.isEnabled,
    leadDays: record.leadDays,
    thresholdPercent: record.thresholdPercent,
  };
}

function reminderView(record: ReminderRecord) {
  return {
    id: record.id,
    family: record.family,
    dueDate: iso(record.dueDate).slice(0, 10),
    status: record.status,
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
          data: safeAudit(
            userId,
            "REMINDER",
            reminder.id,
            "CREATED",
            "IN_APP_REMINDER_CREATED",
          ),
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

type RuntimeOptions = { runtimeEnabled?: boolean };

function requireRuntime(options: RuntimeOptions) {
  if (!(options.runtimeEnabled ?? PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED)) {
    throw new InAppRemindersUnavailableError();
  }
}

export async function getInAppReminders(
  context: AuthenticatedUserContext | null | undefined,
  store?: InAppReminderStore,
  options: RuntimeOptions = {},
) {
  requireRuntime(options);
  const user = requireAuthenticatedUserContext(context);
  const resolvedStore = store ?? createPrismaInAppReminderStore();
  const [preferences, reminders] = await Promise.all([
    resolvedStore.listPreferences(user.userId),
    resolvedStore.listReminders(user.userId),
  ]);
  return {
    preferences: preferences.map(preferenceView),
    reminders: reminders.map(reminderView),
  };
}

export async function mutateInAppReminder(
  context: AuthenticatedUserContext | null | undefined,
  input: unknown,
  store?: InAppReminderStore,
  now = new Date(),
  options: RuntimeOptions = {},
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
  if (request.action === "CREATE_CANDIDATE") {
    const candidate = buildReminderCandidate(
      request.family,
      request.sourceEntityId,
      dateOnly(request.dueDate),
    );
    const reminder = await resolvedStore.createCandidate(user.userId, candidate, now);
    return {
      type: "REMINDER" as const,
      reminder: reminder ? reminderView(reminder) : null,
    };
  }
  const reminder = await resolvedStore.setStatus(
    user.userId,
    request.reminderId,
    request.status,
    now,
  );
  if (!reminder) throw new InAppReminderConflictError();
  return { type: "REMINDER" as const, reminder: reminderView(reminder) };
}
