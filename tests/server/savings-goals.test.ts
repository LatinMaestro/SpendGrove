import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  SavingsGoalConflictError,
  SavingsGoalsUnavailableError,
  listSavingsGoals,
  mutateSavingsGoal,
  savingsGoalMutationSchema,
  type SavingsGoalRecord,
  type SavingsGoalStore,
} from "@/src/server/savings-goals";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/savings-goals.ts", import.meta.url);

function goal(overrides: Partial<SavingsGoalRecord> = {}): SavingsGoalRecord {
  return {
    id: "goal_1",
    userId: "user_1",
    name: "Emergency buffer",
    targetAmountCents: 500_000,
    targetDate: new Date("2027-06-30T00:00:00.000Z"),
    openingProgressCents: 100_000,
    status: "ACTIVE",
    completedAt: null,
    archivedAt: null,
    updatedAt: new Date("2026-07-17T00:00:00.000Z"),
    contributions: [
      {
        id: "contribution_1",
        userId: "user_1",
        savingsGoalId: "goal_1",
        amountCents: 25_000,
        contributionDate: new Date("2026-07-17T00:00:00.000Z"),
        note: null,
        deletedAt: null,
      },
    ],
    ...overrides,
  };
}

function memoryStore(overrides: Partial<SavingsGoalStore> = {}) {
  const calls: Array<{ action: string; userId: string }> = [];
  const store: SavingsGoalStore = {
    async list(userId) {
      calls.push({ action: "list", userId });
      return [goal({ userId })];
    },
    async create(userId, input) {
      calls.push({ action: "create", userId });
      return goal({ userId, ...input });
    },
    async update(userId, _goalId, _expectedUpdatedAt, input) {
      calls.push({ action: "update", userId });
      return goal({ userId, ...input });
    },
    async setStatus(userId, _goalId, _expectedUpdatedAt, status) {
      calls.push({ action: "status", userId });
      return goal({ userId, status });
    },
    async addContribution(userId, _goalId, input) {
      calls.push({ action: "contribution", userId });
      return goal({
        userId,
        contributions: [
          ...goal().contributions,
          {
            id: "contribution_2",
            userId,
            savingsGoalId: "goal_1",
            ...input,
            deletedAt: null,
          },
        ],
      });
    },
    async deleteContribution(userId) {
      calls.push({ action: "delete-contribution", userId });
      return goal({ userId, contributions: [] });
    },
    ...overrides,
  };
  return { store, calls };
}

describe("Phase 9 guarded savings goal service", () => {
  it("fails closed before authentication or store access", async () => {
    const list = vi.fn();
    const { store } = memoryStore({ list });

    await expect(listSavingsGoals(createTestUserContext("user_1"), store))
      .rejects.toBeInstanceOf(SavingsGoalsUnavailableError);
    expect(list).not.toHaveBeenCalled();
  });

  it("keeps every operation owner scoped and returns planning progress only", async () => {
    const { store, calls } = memoryStore();
    const [listed, created] = await Promise.all([
      listSavingsGoals(
        createTestUserContext("user_7"),
        store,
        { runtimeEnabled: true },
      ),
      mutateSavingsGoal(
        createTestUserContext("user_7"),
        {
          action: "CREATE",
          name: "  Holiday   fund ",
          targetAmountCents: 800_000,
          targetDate: "2027-01-31",
          openingProgressCents: 50_000,
        },
        store,
        new Date("2026-07-17T00:00:00.000Z"),
        { runtimeEnabled: true },
      ),
    ]);

    expect(calls).toEqual([
      { action: "list", userId: "user_7" },
      { action: "create", userId: "user_7" },
    ]);
    expect(listed[0]).toMatchObject({
      progressCents: 125_000,
      remainingCents: 375_000,
      progressPercent: 25,
    });
    expect(created).toMatchObject({
      name: "Holiday fund",
      targetAmountCents: 800_000,
      progressCents: 75_000,
    });
  });

  it("supports manual contributions without creating or linking transactions", async () => {
    const { store } = memoryStore();
    const result = await mutateSavingsGoal(
      createTestUserContext("user_1"),
      {
        action: "ADD_CONTRIBUTION",
        goalId: "goal_1",
        amountCents: 10_000,
        contributionDate: "2026-07-17",
        note: "Manual progress",
      },
      store,
      new Date("2026-07-17T01:00:00.000Z"),
      { runtimeEnabled: true },
    );

    expect(result.progressCents).toBe(135_000);
    expect(result.remainingCents).toBe(365_000);
  });

  it("supports edit, pause, resume, complete, archive, restore and contribution removal", async () => {
    const { store, calls } = memoryStore();
    const context = createTestUserContext("user_1");
    const updatedAt = "2026-07-17T00:00:00.000Z";
    await mutateSavingsGoal(context, {
      action: "UPDATE", goalId: "goal_1", updatedAt, name: "Updated buffer",
      targetAmountCents: 600_000, targetDate: null, openingProgressCents: 100_000,
    }, store, new Date(), { runtimeEnabled: true });
    for (const status of ["PAUSED", "ACTIVE", "COMPLETED", "ARCHIVED", "ACTIVE"] as const) {
      await mutateSavingsGoal(context, {
        action: "SET_STATUS", goalId: "goal_1", updatedAt, status,
      }, store, new Date(), { runtimeEnabled: true });
    }
    await mutateSavingsGoal(context, {
      action: "DELETE_CONTRIBUTION", goalId: "goal_1", contributionId: "contribution_1",
    }, store, new Date(), { runtimeEnabled: true });

    expect(calls.map((call) => call.action)).toEqual([
      "update", "status", "status", "status", "status", "status", "delete-contribution",
    ]);
  });

  it("rejects zero, negative and malformed goal values", () => {
    expect(savingsGoalMutationSchema.safeParse({
      action: "CREATE",
      name: "Goal",
      targetAmountCents: 0,
      targetDate: null,
      openingProgressCents: 0,
    }).success).toBe(false);
    expect(savingsGoalMutationSchema.safeParse({
      action: "ADD_CONTRIBUTION",
      goalId: "goal_1",
      amountCents: -1,
      contributionDate: "2026-07-17",
      note: null,
    }).success).toBe(false);
  });

  it("fails safely for missing, stale or another-user records", async () => {
    const { store } = memoryStore({
      async update() {
        return null;
      },
    });
    await expect(mutateSavingsGoal(
      createTestUserContext("user_2"),
      {
        action: "UPDATE",
        goalId: "goal_1",
        updatedAt: "2026-07-17T00:00:00.000Z",
        name: "Updated goal",
        targetAmountCents: 600_000,
        targetDate: null,
        openingProgressCents: 0,
      },
      store,
      new Date(),
      { runtimeEnabled: true },
    )).rejects.toBeInstanceOf(SavingsGoalConflictError);
  });

  it("contains no transaction linking, provider calls or private-source fields", async () => {
    const service = await readFile(servicePath, "utf8");
    expect(service).toContain("isVerifiedPreviewRuntime()");
    expect(service).not.toMatch(/\.transaction\.(create|update|delete)/);
    expect(service).not.toContain("rawCsv");
    expect(service).not.toContain("accountNumber");
    expect(service).not.toContain("filename");
    expect(service).not.toContain("provider");
  });
});
