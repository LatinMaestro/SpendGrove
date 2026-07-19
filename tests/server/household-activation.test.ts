import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  HouseholdRecordsUnavailableError,
  listHouseholdRecordWorkspace,
  type HouseholdRecordStore,
} from "@/src/server/household-records";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const recordsPath = new URL("../../src/server/household-records.ts", import.meta.url);
const householdPath = new URL("../../src/server/households.ts", import.meta.url);
const componentPath = new URL("../../components/household-access.tsx", import.meta.url);
const settingsPath = new URL("../../app/settings/page.tsx", import.meta.url);
const routePath = new URL("../../app/api/account/household-records/route.ts", import.meta.url);
const exportPath = new URL("../../src/server/account-export.ts", import.meta.url);
const deletionPath = new URL("../../src/server/account-deletion.ts", import.meta.url);

function store(overrides: Partial<HouseholdRecordStore> = {}) {
  const userIds: string[] = [];
  const value: HouseholdRecordStore = {
    async listOwnedCandidates(userId) {
      userIds.push(`candidates:${userId}`);
      return [{
        entityType: "PROPERTY",
        entityId: "property_1",
        title: "Synthetic home",
        detail: "Owner-occupied Property",
      }];
    },
    async listSharedRecords(userId, householdId) {
      userIds.push(`shared:${userId}:${householdId}`);
      return [{
        shareId: "share_1",
        entityType: "PROPERTY",
        entityId: "property_1",
        title: "Synthetic home",
        detail: "Owner-occupied Property",
        isOwnedByYou: true,
      }];
    },
    ...overrides,
  };
  return { value, userIds };
}

describe("Preview household record access", () => {
  it("fails closed before store access outside verified Preview", async () => {
    const listSharedRecords = vi.fn();
    const testStore = store({ listSharedRecords });
    await expect(listHouseholdRecordWorkspace(
      createTestUserContext("user_1"),
      "household_1",
      testStore.value,
    )).rejects.toBeInstanceOf(HouseholdRecordsUnavailableError);
    expect(listSharedRecords).not.toHaveBeenCalled();
  });

  it("scopes candidates and shared reads to the authenticated member", async () => {
    const testStore = store();
    const result = await listHouseholdRecordWorkspace(
      createTestUserContext("user_7"),
      "household_1",
      testStore.value,
      { runtimeEnabled: true },
    );
    expect(testStore.userIds).toEqual([
      "shared:user_7:household_1",
      "candidates:user_7",
    ]);
    expect(result.sharedRecords[0]).toMatchObject({
      shareId: "share_1",
      isOwnedByYou: true,
    });
  });

  it("denies a direct household ID that has no active membership", async () => {
    const testStore = store({ async listSharedRecords() { return null; } });
    await expect(listHouseholdRecordWorkspace(
      createTestUserContext("attacker"),
      "household_1",
      testStore.value,
      { runtimeEnabled: true },
    )).rejects.toThrow(/not available for your account/i);
  });

  it("returns purpose-limited summaries and never raw private source fields", async () => {
    const records = await readFile(recordsPath, "utf8");
    expect(records).toContain('householdMembership.findFirst');
    expect(records).toContain('status: "ACTIVE"');
    expect(records).toContain("ownerUserId");
    expect(records).not.toMatch(/description:\s*true|merchantName:\s*true|notes:\s*true|importedDescriptionSanitized:\s*true/);
    expect(records).not.toMatch(/console\.(?:log|info|warn|error)/);
    expect(records).not.toContain("rawCsv");
    expect(records).not.toContain("accountNumber");
    expect(records).not.toContain("filename");
  });

  it("keeps sharing explicit, revocable and private by default in Settings", async () => {
    const [component, settings, route, households] = await Promise.all([
      readFile(componentPath, "utf8"),
      readFile(settingsPath, "utf8"),
      readFile(routePath, "utf8"),
      readFile(householdPath, "utf8"),
    ]);
    expect(settings).toContain("accountHistoryAvailable && isVerifiedPreviewRuntime()");
    expect(component).toContain("Existing records are never shared automatically.");
    expect(component).toContain("Share record");
    expect(component).toContain("Stop sharing");
    expect(component).toContain("Leave");
    expect(component).toContain("Make administrator");
    expect(component).toContain("Remove");
    expect(component).toContain("SpendGrove does not send invitation emails.");
    expect(route).toContain("getCurrentUserContext()");
    expect(households).toContain("randomBytes(32)");
    expect(households).toContain("hashToken(request.token)");
  });

  it("exports safe household lifecycle and handles account deletion without orphaning access", async () => {
    const [accountExport, deletion] = await Promise.all([
      readFile(exportPath, "utf8"),
      readFile(deletionPath, "utf8"),
    ]);
    expect(accountExport).toContain("householdMemberships: ExportRecord[]");
    expect(accountExport).toContain("householdInvitations: ExportRecord[]");
    expect(accountExport).toContain("householdShares: ExportRecord[]");
    const invitationSelect = accountExport.match(/db\.householdInvitation\.findMany\([\s\S]*?\n        \}\)/)?.[0] ?? "";
    expect(invitationSelect).not.toMatch(/tokenHash|intendedIdentityHash/);
    expect(deletion).toContain("HouseholdAccountDeletionBlockedError");
    expect(deletion).toContain("creatorUserId: replacement.userId");
    expect(deletion).toContain("householdRecordShare.deleteMany");
    expect(deletion).toContain("householdMembership.deleteMany");
  });
});
