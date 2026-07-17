import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  HouseholdConflictError,
  HouseholdUnavailableError,
  listHouseholds,
  mutateHousehold,
  householdMutationSchema,
  type HouseholdStore,
} from "@/src/server/households";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/households.ts", import.meta.url);
const now = new Date("2026-07-17T12:00:00.000Z");

function household(userId = "user_1") {
  return {
    id: "household_1",
    name: "Our home",
    status: "ACTIVE" as const,
    memberships: [{
      id: "membership_1",
      userId,
      role: "ADMIN" as const,
      status: "ACTIVE" as const,
    }],
    shares: [{
      id: "share_1",
      ownerUserId: userId,
      entityType: "TRANSACTION" as const,
      entityId: "transaction_private_1",
      revokedAt: null,
    }],
  };
}

function memoryStore(overrides: Partial<HouseholdStore> = {}) {
  const calls: Array<Record<string, unknown>> = [];
  const store: HouseholdStore = {
    async listForMember(userId) {
      calls.push({ action: "list", userId });
      return [household(userId)];
    },
    async create(userId, name) {
      calls.push({ action: "create", userId, name });
      return household(userId);
    },
    async createInvitation(
      userId,
      householdId,
      role,
      tokenHash,
      intendedIdentityHash,
      expiresAt,
    ) {
      calls.push({
        action: "invite",
        userId,
        householdId,
        role,
        tokenHash,
        intendedIdentityHash,
        expiresAt,
      });
      return { id: "invitation_1" };
    },
    async acceptInvitation(userId, tokenHash, identityHash) {
      calls.push({ action: "accept", userId, tokenHash, identityHash });
      return household(userId);
    },
    async setRole(userId, householdId, membershipId, role) {
      calls.push({ action: "role", userId, householdId, membershipId, role });
      return household(userId);
    },
    async endMembership(userId, householdId, membershipId, status) {
      calls.push({ action: "end", userId, householdId, membershipId, status });
      return { ended: true, household: status === "LEFT" ? null : household(userId) };
    },
    async shareRecord(userId, householdId, entityType, entityId) {
      calls.push({ action: "share", userId, householdId, entityType, entityId });
      return household(userId);
    },
    async revokeShare(userId, householdId, shareId) {
      calls.push({ action: "revoke", userId, householdId, shareId });
      return household(userId);
    },
    ...overrides,
  };
  return { store, calls };
}

describe("Phase 10 guarded household service", () => {
  it("fails closed before authentication or store access", async () => {
    const listForMember = vi.fn();
    const { store } = memoryStore({ listForMember });

    await expect(listHouseholds(createTestUserContext("user_1"), store))
      .rejects.toBeInstanceOf(HouseholdUnavailableError);
    expect(listForMember).not.toHaveBeenCalled();
  });

  it("keeps household reads and creation owner scoped without exposing member user IDs", async () => {
    const { store, calls } = memoryStore();
    const [listed, created] = await Promise.all([
      listHouseholds(createTestUserContext("user_7"), store, { runtimeEnabled: true }),
      mutateHousehold(
        createTestUserContext("user_7"),
        { action: "CREATE", name: "  Our   home " },
        store,
        now,
        { runtimeEnabled: true },
      ),
    ]);

    expect(calls).toEqual([
      { action: "list", userId: "user_7" },
      { action: "create", userId: "user_7", name: "Our home" },
    ]);
    expect(listed[0]).toMatchObject({
      name: "Our home",
      members: [{ id: "membership_1", role: "ADMIN" }],
      sharedRecords: [{ id: "share_1", entityType: "TRANSACTION" }],
    });
    expect(JSON.stringify(listed)).not.toContain("user_7");
    expect(JSON.stringify(listed)).not.toContain("transaction_private_1");
    expect(created.type).toBe("HOUSEHOLD");
  });

  it("returns an invitation token once while passing only its hash to persistence", async () => {
    const { store, calls } = memoryStore();
    const result = await mutateHousehold(
      createTestUserContext("user_1"),
      {
        action: "INVITE",
        householdId: "household_1",
        role: "MEMBER",
        intendedIdentityHash: null,
        expiresAt: "2026-07-18T12:00:00.000Z",
      },
      store,
      now,
      { runtimeEnabled: true },
    );

    expect(result.type).toBe("INVITATION");
    if (result.type !== "INVITATION") throw new Error("Expected invitation result.");
    const call = calls[0];
    expect(call).toMatchObject({
      action: "invite",
      userId: "user_1",
      householdId: "household_1",
      role: "MEMBER",
    });
    expect(call.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(call.tokenHash).not.toBe(result.token);
    expect(result.token.length).toBeGreaterThanOrEqual(32);
  });

  it("hashes acceptance tokens before persistence and never passes the raw token", async () => {
    const { store, calls } = memoryStore();
    const token = "a".repeat(32);
    await mutateHousehold(
      createTestUserContext("user_2"),
      { action: "ACCEPT_INVITATION", token, identityHash: null },
      store,
      now,
      { runtimeEnabled: true },
    );

    expect(calls).toEqual([{
      action: "accept",
      userId: "user_2",
      tokenHash: createHash("sha256").update(token).digest("hex"),
      identityHash: null,
    }]);
    expect(JSON.stringify(calls)).not.toContain(token);
  });

  it("does not report a blocked leave as successful", async () => {
    const { store } = memoryStore({
      async endMembership() {
        return { ended: false, household: null };
      },
    });
    await expect(mutateHousehold(
      createTestUserContext("user_1"),
      {
        action: "END_MEMBERSHIP",
        householdId: "household_1",
        membershipId: "membership_1",
        status: "LEFT",
      },
      store,
      now,
      { runtimeEnabled: true },
    )).rejects.toBeInstanceOf(HouseholdConflictError);
  });

  it("returns a distinct success result only after a confirmed self-leave", async () => {
    const { store } = memoryStore();
    await expect(mutateHousehold(
      createTestUserContext("user_1"),
      {
        action: "END_MEMBERSHIP",
        householdId: "household_1",
        membershipId: "membership_1",
        status: "LEFT",
      },
      store,
      now,
      { runtimeEnabled: true },
    )).resolves.toEqual({ type: "LEFT" });
  });

  it("passes record-sharing ownership context through the guarded store boundary", async () => {
    const { store, calls } = memoryStore();
    await mutateHousehold(
      createTestUserContext("user_8"),
      {
        action: "SHARE",
        householdId: "household_1",
        entityType: "PROPERTY",
        entityId: "property_1",
      },
      store,
      now,
      { runtimeEnabled: true },
    );

    expect(calls).toEqual([{
      action: "share",
      userId: "user_8",
      householdId: "household_1",
      entityType: "PROPERTY",
      entityId: "property_1",
    }]);
  });

  it("rejects malformed identities and unknown record types", () => {
    expect(householdMutationSchema.safeParse({
      action: "INVITE",
      householdId: "household_1",
      role: "MEMBER",
      intendedIdentityHash: "email@example.com",
      expiresAt: "2026-07-18T12:00:00.000Z",
    }).success).toBe(false);
    expect(householdMutationSchema.safeParse({
      action: "SHARE",
      householdId: "household_1",
      entityType: "USER",
      entityId: "user_1",
    }).success).toBe(false);
  });

  it("contains no delivery provider, browser-local sharing or private-source logging", async () => {
    const service = await readFile(servicePath, "utf8");
    expect(service).toContain("PHASE_10_COLLABORATION_RUNTIME_ENABLED");
    expect(service).toContain("PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED");
    expect(service).not.toMatch(/console\.(?:log|info|warn|error)/);
    expect(service).not.toContain("localStorage");
    expect(service).not.toContain("rawCsv");
    expect(service).not.toContain("accountNumber");
    expect(service).not.toContain("filename");
    expect(service).not.toContain("sendEmail");
    expect(service).not.toContain("Resend");
    expect(service).not.toMatch(/\.transaction\.(?:create|update|delete)/);
  });
});
