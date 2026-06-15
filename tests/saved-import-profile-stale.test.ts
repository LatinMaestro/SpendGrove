import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseCsvDocument, scanCsvDocument } from "@/lib/csv-import";
import { createSafeImportProfileContract } from "@/lib/import-profile-contract";
import {
  applySavedImportProfile,
  createSavedImportProfile,
  matchSavedImportProfiles,
} from "@/lib/saved-import-profiles";

async function fixture(name: string) {
  return readFile(new URL(`../sample-data/synthetic/${name}`, import.meta.url), "utf8");
}

describe("stale saved import profiles", () => {
  it("does not offer or apply a profile when the future file structure has changed", async () => {
    const originalDocument = parseCsvDocument(await fixture("generic-headered-signed.csv"));
    const originalScan = scanCsvDocument(originalDocument);
    const profile = createSavedImportProfile({
      id: "mapping-stale-fixture",
      contract: createSafeImportProfileContract({
        displayName: "Original layout",
        accountType: "UNKNOWN",
        scan: originalScan,
      }),
    });

    const changedDocument = parseCsvDocument(await fixture("generic-headered-debit-credit.csv"));
    const changedScan = scanCsvDocument(changedDocument);

    expect(matchSavedImportProfiles([profile], changedScan)).toEqual([]);
    expect(() => applySavedImportProfile(changedDocument, profile)).toThrow(
      "This saved mapping does not fit the selected file.",
    );
  });
});
