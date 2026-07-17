import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  InAppReminderConflictError,
  InAppRemindersUnavailableError,
  buildReminderCandidate,
  getInAppReminders,
  inAppReminderMutationSchema,
  mutateInAppReminder,
  type InAppReminderStore,
} from "@/src/server/in-app-reminders";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/in-app-reminders.ts", import.meta.url);

function memoryStore(overrides: Partial<InAppReminderStore> = {}) {
  const calls: Array<{ action: string; userId: string }> = [];
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
      return {
        id: "reminder_2",
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
  return { store, calls };
}

describe("Phase 9 guarded in-app reminder service", () => {
  it("fails closed before store access", async () => {
    const listPreferences = vi.fn();
    const { store } = memoryStore({ listPreferences });
    await expect(getInAppReminders(createTestUserContext("user_1"), store))
      .rejects.toBeInstanceOf(InAppRemindersUnavailableError);
    expect(listPreferences).not.toHaveBeenCalled();
  });

  it("uses deterministic opaque keys without persisted rendered messages", () => {
    const first = buildReminderCandidate(
      "SAVINGS_GOAL",
      "goal_1",
      new Date("2026-08-01T00:00:00.000Z"),
    );
    const second = buildReminderCandidate(
      "SAVINGS_GOAL",
      "goal_1",
      new Date("2026-08-01T00:00:00.000Z"),
    );
    expect(first.dedupeKey).toBe(second.dedupeKey);
    expect(first.dedupeKey).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toHaveProperty("message");
    expect(first).not.toHaveProperty("amountCents");
  });

  it("keeps preferences and reminders owner scoped", async () => {
    const { store, calls } = memoryStore();
    await getInAppReminders(
      createTestUserContext("user_6"),
      store,
      { runtimeEnabled: true },
    );
    await mutateInAppReminder(
      createTestUserContext("user_6"),
      {
        action: "SET_PREFERENCE",
        family: "EOFY_PREPARATION",
        isEnabled: true,
        leadDays: 30,
        thresholdPercent: null,
      },
      store,
      new Date(),
      { runtimeEnabled: true },
    );
    expect(calls).toEqual([
      { action: "preferences", userId: "user_6" },
      { action: "reminders", userId: "user_6" },
      { action: "set-preference", userId: "user_6" },
    ]);
  });

  it("keeps budget percentages limited to budget reminder families", () => {
    expect(inAppReminderMutationSchema.safeParse({
      action: "SET_PREFERENCE",
      family: "IMPORT",
      isEnabled: true,
      leadDays: 0,
      thresholdPercent: 80,
    }).success).toBe(false);
    expect(inAppReminderMutationSchema.safeParse({
      action: "SET_PREFERENCE",
      family: "BUDGET_EIGHTY_PERCENT",
      isEnabled: true,
      leadDays: 0,
      thresholdPercent: 80,
    }).success).toBe(true);
  });

  it("allows a disabled preference to suppress candidate creation safely", async () => {
    const { store } = memoryStore({
      async createCandidate() {
        return null;
      },
    });
    const result = await mutateInAppReminder(
      createTestUserContext("user_1"),
      {
        action: "CREATE_CANDIDATE",
        family: "IMPORT",
        sourceEntityId: null,
        dueDate: "2026-08-01",
      },
      store,
      new Date(),
      { runtimeEnabled: true },
    );
    expect(result).toEqual({ type: "REMINDER", reminder: null });
  });

  it("fails safely when another user's reminder is not found", async () => {
    const { store } = memoryStore({
      async setStatus() {
        return null;
      },
    });
    await expect(mutateInAppReminder(
      createTestUserContext("user_2"),
      {
        action: "SET_STATUS",
        reminderId: "reminder_1",
        status: "DISMISSED",
      },
      store,
      new Date(),
      { runtimeEnabled: true },
    )).rejects.toBeInstanceOf(InAppReminderConflictError);
  });

  it("contains no push, provider, private-source or financial mutation path", async () => {
    const service = await readFile(servicePath, "utf8");
    expect(service).toContain("PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED");
    expect(service).not.toContain("rawCsv");
    expect(service).not.toContain("accountNumber");
    expect(service).not.toContain("merchant");
    expect(service).not.toContain("pushToken");
    expect(service).not.toMatch(/(?:prisma|tx)\.transaction\.(?:create|update|delete)\s*\(/);
  });
});
