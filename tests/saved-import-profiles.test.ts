import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseCsvDocument, scanCsvDocument } from "@/lib/csv-import";
import { createSafeImportProfileContract } from "@/lib/import-profile-contract";
import {
  SAVED_IMPORT_PROFILE_STORAGE_KEY,
  addSavedImportProfile,
  applySavedImportProfile,
  createSavedImportProfile,
  deleteSavedImportProfile,
  loadSavedImportProfilesFromStorage,
  markSavedImportProfileUsed,
  matchSavedImportProfiles,
  parseSavedImportProfileStorage,
  renameSavedImportProfile,
  resetSavedImportProfilesInStorage,
  saveSavedImportProfilesToStorage,
  serializeSavedImportProfileStorage,
  setSavedImportProfileEnabled,
  type SavedImportProfileStorage,
} from "@/lib/saved-import-profiles";

async function fixture(name: string) {
  return readFile(new URL(`../sample-data/synthetic/${name}`, import.meta.url), "utf8");
}

async function createFixtureProfile() {
  const document = parseCsvDocument(await fixture("generic-headered-signed.csv"));
  const scan = scanCsvDocument(document);
  const contract = createSafeImportProfileContract({
    displayName: "Everyday account",
    bankName: "Fictional Australian Bank",
    accountType: "EVERYDAY_TRANSACTION",
    scan,
  });
  return {
    document,
    scan,
    profile: createSavedImportProfile({
      id: "mapping-safe-fixture",
      now: new Date("2026-06-14T00:00:00.000Z"),
      contract,
    }),
  };
}

function memoryStorage(initialValue: string | null = null): SavedImportProfileStorage & { value: string | null } {
  return {
    value: initialValue,
    getItem(key) {
      return key === SAVED_IMPORT_PROFILE_STORAGE_KEY ? this.value : null;
    },
    setItem(key, value) {
      if (key === SAVED_IMPORT_PROFILE_STORAGE_KEY) this.value = value;
    },
    removeItem(key) {
      if (key === SAVED_IMPORT_PROFILE_STORAGE_KEY) this.value = null;
    },
  };
}

describe("browser-local saved import profiles", () => {
  it("saves only versioned safe mapping metadata", async () => {
    const { profile } = await createFixtureProfile();
    const serialized = serializeSavedImportProfileStorage([profile]);
    const parsed = parseSavedImportProfileStorage(serialized);

    expect(parsed).toMatchObject({
      recoveredFromCorruption: false,
      migrated: false,
      unsupportedVersion: false,
    });
    expect(parsed.profiles[0]).toMatchObject({
      id: "mapping-safe-fixture",
      isEnabled: true,
      lastUsedAt: null,
    });
    expect(serialized).not.toContain("generic-headered-signed.csv");
    expect(serialized).not.toContain("Bunnings warehouse");
    expect(serialized).not.toContain("1968.80");
    expect(serialized).not.toContain("Transaction Date");
  });

  it("matches future files using structural metadata and reapplies the mapping for preview", async () => {
    const { document, scan, profile } = await createFixtureProfile();
    const matches = matchSavedImportProfiles([profile], scan);
    const applied = applySavedImportProfile(document, profile);

    expect(matches).toHaveLength(1);
    expect(matches[0].score).toBeGreaterThanOrEqual(70);
    expect(applied.mapping).toEqual(scan.mapping);
    expect(applied.mappingIssues).toEqual([]);
    expect(applied.previewRows[0]).toMatchObject({
      date: "2026-06-12",
      amountCents: -3120,
    });
  });

  it("supports rename, disable, last-used tracking and delete", async () => {
    const { scan, profile } = await createFixtureProfile();
    const initial = addSavedImportProfile([], profile);
    const renamed = renameSavedImportProfile(initial, profile.id, "Weekly banking", new Date("2026-06-15T00:00:00.000Z"));
    const disabled = setSavedImportProfileEnabled(renamed, profile.id, false, new Date("2026-06-16T00:00:00.000Z"));
    const used = markSavedImportProfileUsed(renamed, profile.id, new Date("2026-06-17T00:00:00.000Z"));

    expect(renamed[0].contract.displayName).toBe("Weekly banking");
    expect(disabled[0].isEnabled).toBe(false);
    expect(matchSavedImportProfiles(disabled, scan)).toEqual([]);
    expect(used[0].lastUsedAt).toBe("2026-06-17T00:00:00.000Z");
    expect(deleteSavedImportProfile(used, profile.id)).toEqual([]);
  });

  it("recovers safely from corrupted and unsupported storage", () => {
    expect(parseSavedImportProfileStorage("not-json")).toMatchObject({
      profiles: [],
      recoveredFromCorruption: true,
      unsupportedVersion: false,
    });
    expect(parseSavedImportProfileStorage(JSON.stringify({ version: 99, profiles: [] }))).toMatchObject({
      profiles: [],
      recoveredFromCorruption: false,
      unsupportedVersion: true,
    });
  });

  it("migrates a safe legacy envelope without adding private fields", async () => {
    const { profile } = await createFixtureProfile();
    const legacy = JSON.stringify({
      version: 0,
      profiles: [{
        id: profile.id,
        enabled: profile.isEnabled,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        contract: profile.contract,
      }],
    });
    const result = parseSavedImportProfileStorage(legacy);

    expect(result.migrated).toBe(true);
    expect(result.profiles[0]).toMatchObject({
      id: profile.id,
      isEnabled: true,
      lastUsedAt: null,
    });
  });

  it("handles localStorage read, write and reset failures without blocking import", async () => {
    const { profile } = await createFixtureProfile();
    const failingStorage: SavedImportProfileStorage = {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("blocked"); },
      removeItem() { throw new Error("blocked"); },
    };

    expect(loadSavedImportProfilesFromStorage(failingStorage)).toMatchObject({
      profiles: [],
      storageAvailable: false,
    });
    expect(saveSavedImportProfilesToStorage(failingStorage, [profile])).toBe(false);
    expect(resetSavedImportProfilesInStorage(failingStorage)).toBe(false);
  });

  it("saves and resets a valid browser-local envelope", async () => {
    const { profile } = await createFixtureProfile();
    const storage = memoryStorage();

    expect(saveSavedImportProfilesToStorage(storage, [profile])).toBe(true);
    expect(loadSavedImportProfilesFromStorage(storage).profiles).toHaveLength(1);
    expect(resetSavedImportProfilesInStorage(storage)).toBe(true);
    expect(storage.value).toBeNull();
  });

  it("rejects private identifiers in saved mapping labels", async () => {
    const document = parseCsvDocument(await fixture("generic-headered-signed.csv"));
    const scan = scanCsvDocument(document);

    expect(() => createSafeImportProfileContract({
      displayName: "Account 12345678",
      accountType: "UNKNOWN",
      scan,
    })).toThrow();
    expect(() => createSafeImportProfileContract({
      displayName: "Safe mapping",
      bankName: "BSB 000-000",
      accountType: "UNKNOWN",
      scan,
    })).toThrow();
  });
});
