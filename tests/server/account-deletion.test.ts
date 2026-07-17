import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  AccountDeletionOwnershipError,
  deleteSpendGroveAccount,
  type AccountDataDeletionStore,
  type ClerkIdentityDeletionStore,
} from "@/src/server/account-deletion";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/account-deletion.ts", import.meta.url);
const routePath = new URL("../../app/api/account/delete/route.ts", import.meta.url);
const componentPath = new URL("../../components/account-deletion.tsx", import.meta.url);
const settingsPath = new URL("../../app/settings/page.tsx", import.meta.url);
const schemaPath = new URL("../../prisma/schema.prisma", import.meta.url);

function context(userId: string, providerUserId: string) {
  return { ...createTestUserContext(userId), providerUserId };
}

function stores(options: { dataFailure?: Error; identityFailure?: Error } = {}) {
  const calls: string[] = [];
  const dataStore: AccountDataDeletionStore = {
    async deleteOwnerData(userId, providerUserId) {
      calls.push(`data:${userId}:${providerUserId}`);
      if (options.dataFailure) throw options.dataFailure;
    },
  };
  const identityStore: ClerkIdentityDeletionStore = {
    async deleteIdentity(providerUserId) {
      calls.push(`identity:${providerUserId}`);
      if (options.identityFailure) throw options.identityFailure;
    },
  };
  return { calls, dataStore, identityStore };
}

describe("Phase 5 immediate account deletion", () => {
  it("requires exact typed confirmation before any deletion", async () => {
    const testStores = stores();
    await expect(deleteSpendGroveAccount(
      createTestUserContext("user_1"),
      { confirmation: "delete" },
      testStores.dataStore,
      testStores.identityStore,
    )).rejects.toBeInstanceOf(ZodError);
    expect(testStores.calls).toEqual([]);
  });

  it("deletes owner data before the same Clerk identity and reports completion", async () => {
    const testStores = stores();
    const result = await deleteSpendGroveAccount(
      context("user_1", "clerk_user_1"),
      { confirmation: "DELETE" },
      testStores.dataStore,
      testStores.identityStore,
    );

    expect(testStores.calls).toEqual([
      "data:user_1:clerk_user_1",
      "identity:clerk_user_1",
    ]);
    expect(result).toEqual({
      ok: true,
      appDataDeleted: true,
      identityDeleted: true,
      stateCode: "ACCOUNT_DELETED",
      message: "Your SpendGrove account and account data have been deleted.",
    });
  });

  it("rolls back the workflow before Clerk deletion when app-data deletion fails", async () => {
    const testStores = stores({ dataFailure: new Error("synthetic transaction failure") });
    await expect(deleteSpendGroveAccount(
      context("user_1", "clerk_user_1"),
      { confirmation: "DELETE" },
      testStores.dataStore,
      testStores.identityStore,
    )).rejects.toThrow("synthetic transaction failure");
    expect(testStores.calls).toEqual(["data:user_1:clerk_user_1"]);
  });

  it("truthfully reports a retryable partial result when Clerk deletion fails", async () => {
    const testStores = stores({ identityFailure: new Error("synthetic provider failure") });
    const result = await deleteSpendGroveAccount(
      context("user_1", "clerk_user_1"),
      { confirmation: "DELETE" },
      testStores.dataStore,
      testStores.identityStore,
    );

    expect(testStores.calls).toEqual([
      "data:user_1:clerk_user_1",
      "identity:clerk_user_1",
    ]);
    expect(result).toMatchObject({
      ok: false,
      appDataDeleted: true,
      identityDeleted: false,
      stateCode: "IDENTITY_DELETION_RETRY_REQUIRED",
    });
    expect(JSON.stringify(result)).not.toContain("synthetic provider failure");
  });

  it("rejects unauthenticated deletion before touching either store", async () => {
    const testStores = stores();
    await expect(deleteSpendGroveAccount(
      null,
      { confirmation: "DELETE" },
      testStores.dataStore,
      testStores.identityStore,
    )).rejects.toThrow(/authenticated/i);
    expect(testStores.calls).toEqual([]);
  });

  it("covers all current owner-owned entities in a dependency-safe transaction", async () => {
    const service = await readFile(servicePath, "utf8");
    const expectedOrder = [
      "auditEvent.deleteMany",
      "propertyReportReview.deleteMany",
      "propertyTransactionLink.deleteMany",
      "loanReconciliationLink.deleteMany",
      "loanRepayment.deleteMany",
      "categoryBudget.deleteMany",
      "recurringItem.deleteMany",
      "recurringSuggestionDismissal.deleteMany",
      "importRow.deleteMany",
      "merchantAlias.deleteMany",
      "merchantRule.deleteMany",
      "transaction.deleteMany",
      "importBatch.deleteMany",
      "loanAccount.deleteMany",
      "property.deleteMany",
      "merchantProfile.deleteMany",
      "bankImportProfile.deleteMany",
      "category.deleteMany",
      "userSettings.deleteMany",
      "user.deleteMany",
    ];

    let previousIndex = -1;
    for (const operation of expectedOrder) {
      const index = service.indexOf(operation);
      expect(index, operation).toBeGreaterThan(previousIndex);
      previousIndex = index;
    }
    expect(service).toContain("await db.$transaction(async (transaction) =>");
    expect(service.match(/where: \{ userId \}/g)?.length).toBeGreaterThanOrEqual(19);
    expect(service).toContain('authProvider: "CLERK"');
    expect(service).toContain("authProviderUserId: providerUserId");
    expect(service).toContain("if (deletedUser.count !== 1)");
    expect(() => new AccountDeletionOwnershipError()).not.toThrow();
  });

  it("requires strict recent reverification and returns only safe deletion state", async () => {
    const [route, component, settings] = await Promise.all([
      readFile(routePath, "utf8"),
      readFile(componentPath, "utf8"),
      readFile(settingsPath, "utf8"),
    ]);
    expect(route).toContain('has({ reverification: "strict" })');
    expect(route).toContain('reverificationErrorResponse("strict")');
    expect(route).toContain('"Cache-Control": "private, no-store, max-age=0"');
    expect(component).toContain("useReverification");
    expect(component).toContain("isReverificationCancelledError");
    expect(component).toContain('confirmation !== "DELETE"');
    expect(component).toContain("Download your account data");
    expect(component).toContain("It cannot be undone");
    expect(component).toContain("Account deletion cancelled. Nothing was changed.");
    expect(settings).toContain("<AccountDeletion />");
  });

  it("preserves browser-local data and requires no schema or migration construct", async () => {
    const [service, component, schema] = await Promise.all([
      readFile(servicePath, "utf8"),
      readFile(componentPath, "utf8"),
      readFile(schemaPath, "utf8"),
    ]);
    expect(service).not.toMatch(/localStorage|sessionStorage|indexedDB/);
    expect(component).not.toMatch(/localStorage|sessionStorage|indexedDB/);
    expect(schema).not.toMatch(/DeletionJob|DeletionRequest|DeletionGracePeriod/);
    expect(service).not.toMatch(/migrate|rawQuery|executeRaw/);
  });
});
