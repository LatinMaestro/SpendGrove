import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  AccountantRecordsUnavailableError,
  getAccountantRecordWorkspace,
  type AccountantRecordStore,
} from "@/src/server/accountant-records";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const recordsPath = new URL("../../src/server/accountant-records.ts", import.meta.url);
const accessPath = new URL("../../src/server/accountant-access.ts", import.meta.url);
const componentPath = new URL("../../components/accountant-access.tsx", import.meta.url);
const settingsPath = new URL("../../app/settings/page.tsx", import.meta.url);
const routePath = new URL("../../app/api/account/accountant-access/route.ts", import.meta.url);
const exportPath = new URL("../../src/server/account-export.ts", import.meta.url);
const deletionPath = new URL("../../src/server/account-deletion.ts", import.meta.url);

function store(overrides: Partial<AccountantRecordStore> = {}) {
  const calls: string[] = [];
  const value: AccountantRecordStore = {
    async listOwnedCandidates(userId) {
      calls.push(`candidates:${userId}`);
      return [{
        entityType: "REPORT",
        entityId: "property",
        title: "Property report",
        detail: "Read-only report selection",
      }];
    },
    async listReadableRecords(accountantUserId) {
      calls.push(`readable:${accountantUserId}`);
      return [{
        grantId: "grant_1",
        scopeId: "scope_1",
        entityType: "REPORT",
        entityId: "property",
        title: "Property report",
        detail: "Read-only report selection",
      }];
    },
    ...overrides,
  };
  return { value, calls };
}

describe("Preview read-only accountant activation", () => {
  it("fails closed before any record query outside verified Preview", async () => {
    const listOwnedCandidates = vi.fn();
    const testStore = store({ listOwnedCandidates });
    await expect(getAccountantRecordWorkspace(
      createTestUserContext("user_1"),
      testStore.value,
    )).rejects.toBeInstanceOf(AccountantRecordsUnavailableError);
    expect(listOwnedCandidates).not.toHaveBeenCalled();
  });

  it("scopes owner candidates and accountant reads to the signed-in user", async () => {
    const testStore = store();
    const result = await getAccountantRecordWorkspace(
      createTestUserContext("accountant_1"),
      testStore.value,
      new Date("2026-07-19T00:00:00.000Z"),
      { runtimeEnabled: true },
    );
    expect(testStore.calls).toEqual([
      "candidates:accountant_1",
      "readable:accountant_1",
    ]);
    expect(result.readableRecords[0]).toMatchObject({
      scopeId: "scope_1",
      title: "Property report",
    });
  });

  it("revalidates active, unexpired grants and exact unrevoked scopes on each read", async () => {
    const records = await readFile(recordsPath, "utf8");
    expect(records).toContain('accountantUserId');
    expect(records).toContain('status: "ACTIVE"');
    expect(records).toContain('expiresAt: { gt: now }');
    expect(records).toContain('revokedAt: null');
    expect(records).toContain("resolvePurposeLimitedRecordSummary");
    expect(records).not.toMatch(/\.(?:transaction|property|loanAccount|categoryBudget|recurringItem|savingsGoal|netWorthSnapshot)\.(?:create|update|delete|upsert)/);
  });

  it("keeps UI read-only, selected-scope only and provider-free", async () => {
    const [component, settings, route, access] = await Promise.all([
      readFile(componentPath, "utf8"),
      readFile(settingsPath, "utf8"),
      readFile(routePath, "utf8"),
      readFile(accessPath, "utf8"),
    ]);
    expect(settings).toContain("<AccountantAccess");
    expect(component).toContain("Read-only accountant access");
    expect(component).toContain("Share only the records or reports you select.");
    expect(component).toContain("Stop sharing");
    expect(component).toContain("Remove access");
    expect(component).toContain("does not send invitation emails");
    expect(component).toContain("does not verify professional registration");
    expect(component).not.toMatch(/Edit transaction|Delete transaction|Save transaction/);
    expect(route).toContain("getCurrentUserContext()");
    expect(access).toContain("randomBytes(32)");
    expect(access).toContain("hashToken(request.token)");
    expect(access).not.toContain("sendEmail");
  });

  it("exports no token hashes and revokes grants during account deletion", async () => {
    const [accountExport, deletion] = await Promise.all([
      readFile(exportPath, "utf8"),
      readFile(deletionPath, "utf8"),
    ]);
    expect(accountExport).toContain("accountantGrantsOwned: ExportRecord[]");
    expect(accountExport).toContain("accountantGrantsAccepted: ExportRecord[]");
    expect(accountExport).toContain("accountantScopesOwned: ExportRecord[]");
    expect(accountExport).toContain("accountantScopesAccepted: ExportRecord[]");
    const grantSelect = accountExport.match(/db\.accountantAccessGrant\.findMany\([\s\S]*?\n        \}\)/)?.[0] ?? "";
    expect(grantSelect).not.toMatch(/tokenHash|intendedIdentityHash/);
    expect(deletion).toContain("accountantAccessScope.updateMany");
    expect(deletion).toContain("accountantAccessGrant.updateMany");
    expect(deletion).toContain("accountantAccessScope.deleteMany");
    expect(deletion).toContain("accountantAccessGrant.deleteMany");
  });
});
