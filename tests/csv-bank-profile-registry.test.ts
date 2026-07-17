import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  confirmedEverydayCsvProfiles,
  everydayBankFormatRegister,
  getEverydayBankFormatEntry,
} from "@/lib/csv-bank-profiles";
import { parseCsvDocument, scanCsvDocument } from "@/lib/csv-import";

async function fixture(name: string) {
  return readFile(new URL(`../sample-data/synthetic/${name}`, import.meta.url), "utf8");
}

describe("Phase 7 everyday bank format registry", () => {
  it("tracks all nineteen master-specification targets without claiming unevidenced support", () => {
    expect(everydayBankFormatRegister).toHaveLength(19);
    expect(new Set(everydayBankFormatRegister.map((entry) => entry.bankId)).size).toBe(19);
    expect(everydayBankFormatRegister.filter((entry) => entry.supportStatus === "CONFIRMED_PROFILE")).toHaveLength(4);
    expect(everydayBankFormatRegister.filter((entry) => entry.supportStatus === "GENERIC_ONLY")).toHaveLength(15);
    expect(confirmedEverydayCsvProfiles.map((entry) => entry.id)).toEqual([
      "commbank-everyday-v1",
      "anz-everyday-v1",
      "nab-everyday-v1",
      "westpac-everyday-v1",
    ]);
  });

  it("keeps each generic-only target free of runtime matching profiles", () => {
    everydayBankFormatRegister
      .filter((entry) => entry.supportStatus === "GENERIC_ONLY")
      .forEach((entry) => expect(entry.profiles).toEqual([]));
  });

  it("does not conflate related brands without format evidence", () => {
    expect(getEverydayBankFormatEntry("st-george")?.bankId).not.toBe("westpac");
    expect(getEverydayBankFormatEntry("banksa")?.bankId).not.toBe("westpac");
    expect(getEverydayBankFormatEntry("bank-of-melbourne")?.bankId).not.toBe("westpac");
    expect(getEverydayBankFormatEntry("adelaide")?.bankId).not.toBe("bendigo");
  });

  it.each([
    ["anz-everyday.csv", "anz-everyday-v1", "ANZ"],
    ["nab-everyday.csv", "nab-everyday-v1", "NAB"],
  ])("detects the confirmed %s synthetic layout", async (name, profileId, bankName) => {
    const scan = scanCsvDocument(parseCsvDocument(await fixture(name)));

    expect(scan.profile).toMatchObject({
      profileId,
      bankName,
      requiresManualMapping: false,
    });
    expect(scan.previewRows.map((row) => Math.sign(row.amountCents ?? 0))).toEqual([-1, 1]);
  });

  it("keeps an overlapping generic layout manual instead of assigning a bank", () => {
    const scan = scanCsvDocument(parseCsvDocument([
      "Date,Amount,Description,Balance",
      "17/07/2026,-12.50,Synthetic purchase,987.50",
    ].join("\n")));

    expect(scan.profile).toMatchObject({
      profileId: "generic-transaction-v1",
      bankName: "Generic or custom CSV",
      requiresManualMapping: true,
    });
  });

  it("records only safe structural evidence identifiers", () => {
    confirmedEverydayCsvProfiles.forEach((entry) => {
      expect(entry.requiredHeaders.length).toBeGreaterThanOrEqual(3);
      expect(entry.fixtureIds.length).toBeGreaterThan(0);
      expect(entry.fixtureIds.every((value) => value.endsWith(".csv"))).toBe(true);
    });
    expect(JSON.stringify(everydayBankFormatRegister)).not.toMatch(/\d{6,}/);
  });
});
