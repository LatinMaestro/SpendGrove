import { describe, expect, it } from "vitest";
import { createSavedImportProfile } from "@/lib/saved-import-profiles";
import { AuthenticationRequiredError, OwnershipError } from "@/src/server/auth/ownership";
import {
  createDurableSavedImportProfile,
  deleteDurableSavedImportProfile,
  listDurableSavedImportProfiles,
  migrateDurableSavedImportProfiles,
  resetDurableSavedImportProfiles,
  updateDurableSavedImportProfile,
  type DbSavedImportProfileRecord,
  type SavedImportProfilePersistenceStore,
} from "@/src/server/saved-import-profiles";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

function fixtureProfile(id = "mapping-everyday", displayName = "Everyday account") {
  return createSavedImportProfile({
    id,
    now: new Date("2026-06-18T00:00:00.000Z"),
    contract: {
      version: 1,
      displayName,
      bankName: "Fictional Australian Bank",
      accountType: "EVERYDAY_TRANSACTION",
      hasHeader: true,
      columnCount: 3,
      columnRoles: [
        { columnIndex: 0, role: "DATE" },
        { columnIndex: 1, role: "AMOUNT" },
        { columnIndex: 2, role: "DESCRIPTION" },
      ],
      ignoredColumnIndexes: [],
      privateColumnIndexes: [],
      dateFormats: ["DD/MM/YYYY"],
      amountMode: "SIGNED_AMOUNT",
      confidence: 90,
    },
  });
}

function createMemoryStore() {
  const records: DbSavedImportProfileRecord[] = [];

  const store: SavedImportProfilePersistenceStore & { records: DbSavedImportProfileRecord[] } = {
    records,
    async list(userId) {
      return records.filter((record) => record.userId === userId);
    },
    async listNames(userId) {
      return records.filter((record) => record.userId === userId).map(({ id, displayName }) => ({ id, displayName }));
    },
    async findById(userId, profileId) {
      return records.find((record) => record.userId === userId && record.id === profileId) ?? null;
    },
    async create(userId, profile, envelope) {
      const record: DbSavedImportProfileRecord = {
        id: profile.id,
        userId,
        displayName: profile.contract.displayName,
        bankName: profile.contract.bankName ?? null,
        accountType: profile.contract.accountType,
        hasHeader: profile.contract.hasHeader,
        dateFormats: profile.contract.dateFormats,
        columnMapping: envelope,
        confidence: profile.contract.confidence,
        isUserConfirmed: true,
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
      };
      records.push(record);
      return record;
    },
    async update(userId, profileId, data) {
      const record = records.find((candidate) => candidate.userId === userId && candidate.id === profileId);
      if (!record) throw new Error("record not found");
      Object.assign(record, data, { updatedAt: new Date("2026-06-19T00:00:00.000Z") });
      return record;
    },
    async delete(userId, profileId) {
      const index = records.findIndex((record) => record.userId === userId && record.id === profileId);
      if (index >= 0) records.splice(index, 1);
    },
    async deleteAll(userId) {
      const before = records.length;
      for (let index = records.length - 1; index >= 0; index -= 1) {
        if (records[index].userId === userId) records.splice(index, 1);
      }
      return before - records.length;
    },
  };

  return store;
}

describe("durable saved import profiles", () => {
  it("creates, lists, renames, disables, marks used and deletes user-owned profiles", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();
    const created = await createDurableSavedImportProfile(user, fixtureProfile(), store);

    expect(created.contract).toMatchObject({
      displayName: "Everyday account",
      columnCount: 3,
      amountMode: "SIGNED_AMOUNT",
    });
    expect(await listDurableSavedImportProfiles(user, store)).toHaveLength(1);

    const renamed = await updateDurableSavedImportProfile(user, created.id, { displayName: "Weekly banking" }, store);
    expect(renamed.contract.displayName).toBe("Weekly banking");

    const disabled = await updateDurableSavedImportProfile(user, created.id, { isEnabled: false }, store);
    expect(disabled.isEnabled).toBe(false);

    const used = await updateDurableSavedImportProfile(user, created.id, { markUsed: true }, store);
    expect(used.lastUsedAt).not.toBeNull();

    await deleteDurableSavedImportProfile(user, created.id, store);
    expect(await listDurableSavedImportProfiles(user, store)).toEqual([]);
  });

  it("prevents case-insensitive duplicate mapping names", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();
    await createDurableSavedImportProfile(user, fixtureProfile(), store);

    await expect(createDurableSavedImportProfile(
      user,
      fixtureProfile("mapping-copy", "  EVERYDAY ACCOUNT  "),
      store,
    )).rejects.toThrow(/already exists/i);
  });

  it("rejects missing auth and cross-user updates", async () => {
    const userOne = createTestUserContext("user_1");
    const userTwo = createTestUserContext("user_2");
    const store = createMemoryStore();
    const created = await createDurableSavedImportProfile(userOne, fixtureProfile(), store);

    await expect(listDurableSavedImportProfiles(null, store)).rejects.toThrow(AuthenticationRequiredError);
    await expect(updateDurableSavedImportProfile(userTwo, created.id, { isEnabled: false }, store)).rejects.toThrow(OwnershipError);
    await expect(deleteDurableSavedImportProfile(userTwo, created.id, store)).rejects.toThrow(OwnershipError);
  });

  it("migrates confirmed safe profiles and skips existing IDs or names", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();
    await createDurableSavedImportProfile(user, fixtureProfile(), store);

    const result = await migrateDurableSavedImportProfiles(user, [
      fixtureProfile(),
      fixtureProfile("mapping-savings", "Savings mapping"),
    ], store);

    expect(result.importedCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.profiles.map((profile) => profile.contract.displayName)).toEqual(expect.arrayContaining([
      "Everyday account",
      "Savings mapping",
    ]));
  });

  it("resets only the authenticated user's saved profiles", async () => {
    const userOne = createTestUserContext("user_1");
    const userTwo = createTestUserContext("user_2");
    const store = createMemoryStore();
    await createDurableSavedImportProfile(userOne, fixtureProfile(), store);
    await createDurableSavedImportProfile(userTwo, fixtureProfile("mapping-other", "Other account"), store);

    expect(await resetDurableSavedImportProfiles(userOne, store)).toBe(1);
    expect(await listDurableSavedImportProfiles(userOne, store)).toEqual([]);
    expect(await listDurableSavedImportProfiles(userTwo, store)).toHaveLength(1);
  });

  it("rejects private labels before any durable write", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();
    const unsafe = fixtureProfile();
    unsafe.contract = { ...unsafe.contract, displayName: "Account 12345678" };

    await expect(createDurableSavedImportProfile(user, unsafe, store)).rejects.toThrow(/private/i);
    expect(store.records).toEqual([]);
  });

  it("stores no filenames, sample values, rows, balances or private identifiers", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();
    await createDurableSavedImportProfile(user, fixtureProfile(), store);
    const stored = JSON.stringify(store.records);

    expect(stored).not.toContain("filename");
    expect(stored).not.toContain("sample");
    expect(stored).not.toContain("balance");
    expect(stored).not.toContain("rawRow");
    expect(stored).not.toContain("accountNumber");
  });
});
