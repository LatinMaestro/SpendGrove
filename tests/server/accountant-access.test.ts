import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  AccountantAccessConflictError,
  AccountantAccessUnavailableError,
  accountantAccessMutationSchema,
  authorizeAccountantScope,
  listAccountantAccess,
  mutateAccountantAccess,
  type AccountantAccessStore,
} from "@/src/server/accountant-access";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/accountant-access.ts", import.meta.url);
const now = new Date("2026-07-17T12:00:00.000Z");

function grant(overrides: Record<string, unknown> = {}) {
  return {
    id: "grant_1",
    ownerUserId: "owner_1",
    accountantUserId: null,
    status: "PENDING" as const,
    expiresAt: new Date("2026-07-18T12:00:00.000Z"),
    acceptedAt: null,
    revokedAt: null,
    scopes: [{
      id: "scope_1",
      scopeType: "REPORT" as const,
      scopeKey: "property",
      entityId: null,
      revokedAt: null,
    }],
    ...overrides,
  };
}

function memoryStore(overrides: Partial<AccountantAccessStore> = {}) {
  const calls: Array<Record<string, unknown>> = [];
  const store: AccountantAccessStore = {
    async listOwned(ownerUserId) {
      calls.push({ action: "list-owned", ownerUserId });
      return [grant({ ownerUserId })];
    },
    async listAccepted(accountantUserId) {
      calls.push({ action: "list-accepted", accountantUserId });
      return [grant({
        accountantUserId,
        status: "ACTIVE" as const,
        acceptedAt: now,
      })];
    },
    async createGrant(ownerUserId, tokenHash, intendedIdentityHash, expiresAt) {
      calls.push({
        action: "create",
        ownerUserId,
        tokenHash,
        intendedIdentityHash,
        expiresAt,
      });
      return { id: "grant_1" };
    },
    async acceptGrant(accountantUserId, tokenHash, identityHash) {
      calls.push({ action: "accept", accountantUserId, tokenHash, identityHash });
      return grant({
        accountantUserId,
        status: "ACTIVE" as const,
        acceptedAt: now,
      });
    },
    async addScope(ownerUserId, grantId, scopeType, scopeKey, entityId) {
      calls.push({ action: "add-scope", ownerUserId, grantId, scopeType, scopeKey, entityId });
      return grant({ ownerUserId });
    },
    async revokeScope(ownerUserId, grantId, scopeId) {
      calls.push({ action: "revoke-scope", ownerUserId, grantId, scopeId });
      return grant({ ownerUserId });
    },
    async revokeGrant(ownerUserId, grantId) {
      calls.push({ action: "revoke-grant", ownerUserId, grantId });
      return true;
    },
    async authorizeScope(accountantUserId, scopeType, scopeKey, entityId) {
      calls.push({ action: "authorize", accountantUserId, scopeType, scopeKey, entityId });
      return { ownerUserId: "owner_1", scopeType, scopeKey, entityId };
    },
    ...overrides,
  };
  return { store, calls };
}

describe("Phase 10 guarded accountant access service", () => {
  it("fails closed before authentication or persistence access", async () => {
    const listOwned = vi.fn();
    const { store } = memoryStore({ listOwned });

    await expect(listAccountantAccess(createTestUserContext("user_1"), store))
      .rejects.toBeInstanceOf(AccountantAccessUnavailableError);
    expect(listOwned).not.toHaveBeenCalled();
  });

  it("lists owner and accountant perspectives without exposing user IDs", async () => {
    const { store, calls } = memoryStore();
    const result = await listAccountantAccess(
      createTestUserContext("user_7"),
      store,
      now,
      { runtimeEnabled: true },
    );

    expect(calls).toEqual([
      { action: "list-owned", ownerUserId: "user_7" },
      { action: "list-accepted", accountantUserId: "user_7" },
    ]);
    expect(result.owned[0]).toMatchObject({
      id: "grant_1",
      perspective: "OWNER",
      scopes: [{ id: "scope_1", scopeType: "REPORT", scopeKey: "property" }],
    });
    expect(result.accepted[0].perspective).toBe("ACCOUNTANT");
    expect(JSON.stringify(result)).not.toContain("owner_1");
    expect(JSON.stringify(result)).not.toContain("user_7");
  });

  it("returns a raw invitation token once and persists only its hash", async () => {
    const { store, calls } = memoryStore();
    const result = await mutateAccountantAccess(
      createTestUserContext("owner_1"),
      {
        action: "CREATE_GRANT",
        intendedIdentityHash: null,
        expiresAt: "2026-07-18T12:00:00.000Z",
      },
      store,
      now,
      { runtimeEnabled: true },
    );

    expect(result.type).toBe("INVITATION");
    if (result.type !== "INVITATION") throw new Error("Expected invitation result.");
    expect(calls[0]).toMatchObject({ action: "create", ownerUserId: "owner_1" });
    expect(calls[0].tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(calls[0].tokenHash).not.toBe(result.token);
    expect(result.token.length).toBeGreaterThanOrEqual(32);
  });

  it("hashes acceptance tokens before they reach persistence", async () => {
    const token = "b".repeat(32);
    const { store, calls } = memoryStore();
    await mutateAccountantAccess(
      createTestUserContext("accountant_1"),
      { action: "ACCEPT_GRANT", token, identityHash: null },
      store,
      now,
      { runtimeEnabled: true },
    );

    expect(calls).toEqual([{
      action: "accept",
      accountantUserId: "accountant_1",
      tokenHash: createHash("sha256").update(token).digest("hex"),
      identityHash: null,
    }]);
    expect(JSON.stringify(calls)).not.toContain(token);
  });

  it("creates only an explicit owner-scoped record scope", async () => {
    const { store, calls } = memoryStore();
    await mutateAccountantAccess(
      createTestUserContext("owner_8"),
      {
        action: "ADD_SCOPE",
        grantId: "grant_1",
        scopeType: "PROPERTY",
        entityId: "property_1",
      },
      store,
      now,
      { runtimeEnabled: true },
    );

    expect(calls).toEqual([{
      action: "add-scope",
      ownerUserId: "owner_8",
      grantId: "grant_1",
      scopeType: "PROPERTY",
      scopeKey: "PROPERTY:property_1",
      entityId: "property_1",
    }]);
  });

  it("uses a fixed report whitelist rather than arbitrary report identifiers", async () => {
    expect(accountantAccessMutationSchema.safeParse({
      action: "ADD_SCOPE",
      grantId: "grant_1",
      scopeType: "REPORT",
      reportKey: "all-private-data",
    }).success).toBe(false);

    const { store, calls } = memoryStore();
    await mutateAccountantAccess(
      createTestUserContext("owner_1"),
      {
        action: "ADD_SCOPE",
        grantId: "grant_1",
        scopeType: "REPORT",
        reportKey: "accountant-pack",
      },
      store,
      now,
      { runtimeEnabled: true },
    );
    expect(calls[0]).toMatchObject({
      scopeType: "REPORT",
      scopeKey: "accountant-pack",
      entityId: null,
    });
  });

  it("authorizes only the signed-in accountant and exact selected scope", async () => {
    const { store, calls } = memoryStore();
    const result = await authorizeAccountantScope(
      createTestUserContext("accountant_2"),
      { scopeType: "TRANSACTION", entityId: "transaction_1" },
      store,
      now,
      { runtimeEnabled: true },
    );

    expect(calls).toEqual([{
      action: "authorize",
      accountantUserId: "accountant_2",
      scopeType: "TRANSACTION",
      scopeKey: "TRANSACTION:transaction_1",
      entityId: "transaction_1",
    }]);
    expect(result).toEqual({
      ownerUserId: "owner_1",
      scopeType: "TRANSACTION",
      scopeKey: "TRANSACTION:transaction_1",
      entityId: "transaction_1",
    });
  });

  it("denies revoked, expired or absent selected scope access", async () => {
    const { store } = memoryStore({
      async authorizeScope() {
        return null;
      },
    });
    await expect(authorizeAccountantScope(
      createTestUserContext("accountant_2"),
      { scopeType: "REPORT", reportKey: "property" },
      store,
      now,
      { runtimeEnabled: true },
    )).rejects.toBeInstanceOf(AccountantAccessConflictError);
  });

  it("keeps revocation owner scoped", async () => {
    const { store, calls } = memoryStore();
    await mutateAccountantAccess(
      createTestUserContext("owner_9"),
      { action: "REVOKE_GRANT", grantId: "grant_1" },
      store,
      now,
      { runtimeEnabled: true },
    );
    expect(calls).toEqual([{
      action: "revoke-grant",
      ownerUserId: "owner_9",
      grantId: "grant_1",
    }]);
  });

  it("contains no financial mutation, invitation delivery or private-source logging", async () => {
    const service = await readFile(servicePath, "utf8");
    expect(service).toContain("isVerifiedPreviewRuntime()");
    expect(service).not.toContain("PHASE_10_COLLABORATION_RUNTIME_ENABLED");
    expect(service).not.toContain("PHASE_9_ADVANCED_FINANCE_RUNTIME_ENABLED");
    expect(service).not.toMatch(/console\.(?:log|info|warn|error)/);
    expect(service).not.toContain("localStorage");
    expect(service).not.toContain("rawCsv");
    expect(service).not.toContain("accountNumber");
    expect(service).not.toContain("filename");
    expect(service).not.toContain("sendEmail");
    expect(service).not.toContain("Resend");
    expect(service).not.toMatch(/\.(?:transaction|property|loanAccount|categoryBudget|recurringItem|savingsGoal|netWorthSnapshot)\.(?:create|update|updateMany|delete|deleteMany|upsert)/);
  });
});
