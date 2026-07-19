import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  InAppReminderConflictError,
  InAppRemindersUnavailableError,
  buildReminderCandidate,
  getInAppReminders,
  inAppReminderMutationSchema,
  mutateInAppReminder,
  refreshDerivedInAppReminders,
  type InAppReminderSourceStore,
  type InAppReminderStore,
  type ReminderCandidate,
} from "@/src/server/in-app-reminders";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/in-app-reminders.ts", import.meta.url);

function memoryStore(overrides: Partial<InAppReminderStore> = {}) {
  const calls: Array<{ action: string; userId: string }> = [];
  const candidates: ReminderCandidate[] = [];
  const store: InAppReminderStore = {
    async listPreferences(userId) {
      calls.push({ action: "preferences", userId });
      return [{
        id: "preference_1",
        userId,
        family: "IMPORT",
        isEnabled: true,
        leadDays: 0,
        thresholdPercent: null,
      }];
    },
    async listReminders(userId) {
      calls.push({ action: "reminders", userId });
      return [{
        id: "reminder_1",
        userId,
        family: "IMPORT",
        sourceEntityId: null,
        dedupeKey: "safe-key",
        dueDate: new Date("2026-08-01T00:00:00.000Z"),
        status: "ACTIVE",
        acknowledgedAt: null,
        dismissedAt: null,
        archivedAt: null,
      }];
    },
    async setPreference(userId, input) {
      calls.push({ action: "set-preference", userId });
      return { id: "preference_1", userId, ...input };
    },
    async createCandidate(userId, candidate) {
      calls.push({ action: "create-candidate", userId });
      candidates.push(candidate);
      return {
        id: `reminder_${candidates.length + 1}`,
        userId,
        ...candidate,
        status: "ACTIVE",
        acknowledgedAt: null,
        dismissedAt: null,
        archivedAt: null,
      };
    },
    async setStatus(userId, reminderId, status) {
      calls.push({ action: "status", userId });
      return {
        id: reminderId,
        userId,
        family: "IMPORT",
        sourceEntityId: null,
        dedupeKey: "safe-key",
        dueDate: new Date("2026-08-01T00:00:00.000Z"),
        status,
        acknowledgedAt: null,
        dismissedAt: null,
        archivedAt: null,
      };
    },
    ...overrides,
  };
  return { store, calls, candidates };
}

function sourceStore(): InAppReminderSourceStore {
  return {
    async listRecurring() {
      return [{ id: "recurring_1", nextExpectedDate: new Date("2026-08-10T00:00:00.000Z") }];
    },
    async listGoals() {
      return [{
        id: "goal_1",
        targetAmountCents: 100_000,
        targetDate: new Date("2026-09-01T00:00:00.000Z"),
        openingProgressCents: 25_000,
        contributions: [],
      }];
    },
    async listUnmatchedLoans() {
      return [{ id: "repayment_1", repaymentDate: new Date("2026-07-18T00:00:00.000Z") }];
    },
  };
}

describe("Phase 9 Preview in-app reminder service", () => {
  it("fails closed outside verified Preview before store access", async () => {
    const listPreferences = vi.fn();
    const { store } = memoryStore({ listPreferences });
    await expect(getInAppReminders(createTestUserContext("user_1"), store))
      .rejects.toBeInstanceOf(InAppRemindersUnavailableError);
    expect(listPreferences).not.toHaveBeenCalled();
  });

  it("uses deterministic opaque dedupe keys without rendered messages or amounts", () => {
    const first = buildReminderCandidate(
      "SAVINGS_GOAL",
      "goal_1",
      new Date("2026-08-01T00:00:00.000Z"),
      "MILESTONE:25",
    );
    const second = buildReminderCandidate(
      "SAVINGS_GOAL",
      "goal_1",
      new Date("2026-08-02T00:00:00.000Z"),
      "MILESTONE:25",
    );
    expect(first.dedupeKey).toBe(second.dedupeKey);
    expect(first.dedupeKey).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toHaveProperty("message");
    expect(first).not.toHaveProperty("amountCents");
  });

  it("returns all opt-in families with missing preferences safely disabled", async () => {
    const { store } = memoryStore();
    const result = await getInAppReminders(
      createTestUserContext("user_6"),
      store,
      { runtimeEnabled: true, now: new Date("2026-08-01T00:00:00.000Z") },
    );
    expect(result.preferences).toHaveLength(7);
    expect(result.preferences.find((entry) => entry.family === "IMPORT")?.isEnabled).toBe(true);
    expect(result.preferences.find((entry) => entry.family === "SAVINGS_GOAL")?.isEnabled).toBe(false);
    expect(result.reminders[0]).toMatchObject({ timing: "DUE" });
  });

  it("materialises only enabled owner-scoped derived families with fixed budget thresholds", async () => {
    const { store, candidates } = memoryStore({
      async listPreferences(userId) {
        return [
          { id: "p1", userId, family: "RECURRING_EXPECTED_DATE", isEnabled: true, leadDays: 3, thresholdPercent: null },
          { id: "p2", userId, family: "BUDGET_EIGHTY_PERCENT", isEnabled: true, leadDays: 0, thresholdPercent: 80 },
          { id: "p3", userId, family: "BUDGET_FULL", isEnabled: true, leadDays: 0, thresholdPercent: 100 },
          { id: "p4", userId, family: "SAVINGS_GOAL", isEnabled: true, leadDays: 7, thresholdPercent: null },
          { id: "p5", userId, family: "UNMATCHED_LOAN", isEnabled: true, leadDays: 0, thresholdPercent: null },
        ];
      },
    });
    const budgetLoader = vi.fn(async () => ({
      month: { key: "2026-07", label: "July 2026" },
      categories: [],
      archivedCount: 0,
      budgets: [{
        id: "budget_1",
        categoryId: "category_1",
        categoryLabel: "Synthetic category",
        amountCents: 100_000,
        period: "MONTHLY" as const,
        status: "ACTIVE" as const,
        spentCents: 100_000,
        remainingCents: 0,
        progressPercent: 100,
        updatedAt: "2026-07-01T00:00:00.000Z",
      }],
    }));
    const result = await refreshDerivedInAppReminders(
      createTestUserContext("user_9"),
      { reminderStore: store, sourceStore: sourceStore(), budgetLoader },
      new Date("2026-07-19T00:00:00.000Z"),
      { runtimeEnabled: true },
    );

    expect(result.candidateCount).toBe(6);
    expect(new Set(candidates.map((entry) => entry.family))).toEqual(new Set([
      "RECURRING_EXPECTED_DATE",
      "BUDGET_EIGHTY_PERCENT",
      "BUDGET_FULL",
      "SAVINGS_GOAL",
      "UNMATCHED_LOAN",
    ]));
    expect(candidates.find((entry) => entry.family === "RECURRING_EXPECTED_DATE")?.dueDate.toISOString().slice(0, 10)).toBe("2026-08-07");
    expect(budgetLoader).toHaveBeenCalledOnce();
  });

  it("keeps user-selected date reminders limited to import and EOFY", async () => {
    expect(inAppReminderMutationSchema.safeParse({
      action: "CREATE_DATE_REMINDER",
      family: "IMPORT",
      dueDate: "2026-08-01",
    }).success).toBe(true);
    expect(inAppReminderMutationSchema.safeParse({
      action: "CREATE_DATE_REMINDER",
      family: "SAVINGS_GOAL",
      dueDate: "2026-08-01",
    }).success).toBe(false);

    const { store } = memoryStore({ async createCandidate() { return null; } });
    const result = await mutateInAppReminder(
      createTestUserContext("user_1"),
      { action: "CREATE_DATE_REMINDER", family: "EOFY_PREPARATION", dueDate: "2027-06-01" },
      store,
      new Date("2026-07-19T00:00:00.000Z"),
      { runtimeEnabled: true },
    );
    expect(result).toEqual({ type: "REMINDER", reminder: null });
  });

  it("enforces exact budget thresholds and no threshold on other families", () => {
    expect(inAppReminderMutationSchema.safeParse({
      action: "SET_PREFERENCE",
      family: "BUDGET_EIGHTY_PERCENT",
      isEnabled: true,
      leadDays: 0,
      thresholdPercent: 80,
    }).success).toBe(true);
    expect(inAppReminderMutationSchema.safeParse({
      action: "SET_PREFERENCE",
      family: "BUDGET_EIGHTY_PERCENT",
      isEnabled: true,
      leadDays: 0,
      thresholdPercent: 90,
    }).success).toBe(false);
    expect(inAppReminderMutationSchema.safeParse({
      action: "SET_PREFERENCE",
      family: "IMPORT",
      isEnabled: true,
      leadDays: 0,
      thresholdPercent: 80,
    }).success).toBe(false);
  });

  it("fails safely when another user's reminder is not found", async () => {
    const { store } = memoryStore({ async setStatus() { return null; } });
    await expect(mutateInAppReminder(
      createTestUserContext("user_2"),
      { action: "SET_STATUS", reminderId: "reminder_1", status: "DISMISSED" },
      store,
      new Date(),
      { runtimeEnabled: true },
    )).rejects.toBeInstanceOf(InAppReminderConflictError);
  });

  it("contains no push, provider, private-source or financial mutation path", async () => {
    const service = await readFile(servicePath, "utf8");
    expect(service).toContain("isVerifiedPreviewRuntime()");
    expect(service).not.toContain("rawCsv");
    expect(service).not.toContain("accountNumber");
    expect(service).not.toContain("merchant");
    expect(service).not.toContain("pushToken");
    expect(service).not.toMatch(/(?:prisma|tx)\.transaction\.(?:create|update|delete)\s*\(/);
  });
});
