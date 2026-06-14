import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseCsvDocument, scanCsvDocument } from "@/lib/csv-import";
import {
  createSafeImportProfileContract,
  safeImportProfileContractSchema,
} from "@/lib/import-profile-contract";

async function fixture(name: string) {
  return readFile(new URL(`../sample-data/synthetic/${name}`, import.meta.url), "utf8");
}

describe("safe import profile contract", () => {
  it("creates versioned safe mapping metadata without headers, rows or filenames", async () => {
    const document = parseCsvDocument(await fixture("commbank-everyday.csv"));
    const scan = scanCsvDocument(document);
    const profile = createSafeImportProfileContract({
      displayName: "Everyday transactions",
      bankName: "Commonwealth Bank",
      accountType: "EVERYDAY_TRANSACTION",
      scan,
    });
    const serialized = JSON.stringify(profile);

    expect(profile).toMatchObject({
      version: 1,
      displayName: "Everyday transactions",
      bankName: "Commonwealth Bank",
      accountType: "EVERYDAY_TRANSACTION",
      hasHeader: true,
      amountMode: "SIGNED_AMOUNT",
      dateFormats: ["DD/MM/YYYY"],
    });
    expect(profile.privateColumnIndexes).toEqual([4]);
    expect(profile.columnRoles).toEqual(expect.arrayContaining([
      { columnIndex: 0, role: "DATE" },
      { columnIndex: 1, role: "AMOUNT" },
      { columnIndex: 2, role: "DESCRIPTION" },
    ]));
    expect(serialized).not.toContain("Account Number");
    expect(serialized).not.toContain("SYNTHETIC-ONLY");
    expect(serialized).not.toContain("commbank-everyday.csv");
    expect(serialized).not.toContain("Woolworths");
  });

  it("supports separate debit and credit profile mappings", async () => {
    const document = parseCsvDocument(await fixture("generic-headered-debit-credit.csv"));
    const scan = scanCsvDocument(document);
    const profile = createSafeImportProfileContract({
      displayName: "Generic split amount",
      accountType: "UNKNOWN",
      scan,
    });

    expect(profile.amountMode).toBe("DEBIT_CREDIT");
    expect(profile.columnRoles).toEqual(expect.arrayContaining([
      { columnIndex: 2, role: "DEBIT" },
      { columnIndex: 3, role: "CREDIT" },
    ]));
  });

  it("rejects private identifiers and invalid profile mappings", () => {
    expect(() => safeImportProfileContractSchema.parse({
      version: 1,
      displayName: "Account 12345678",
      accountType: "UNKNOWN",
      hasHeader: true,
      columnCount: 3,
      columnRoles: [
        { columnIndex: 0, role: "DATE" },
        { columnIndex: 1, role: "AMOUNT" },
        { columnIndex: 2, role: "DESCRIPTION" },
      ],
      amountMode: "SIGNED_AMOUNT",
      confidence: 80,
    })).toThrow();

    expect(() => safeImportProfileContractSchema.parse({
      version: 1,
      displayName: "Invalid duplicate mapping",
      accountType: "UNKNOWN",
      hasHeader: true,
      columnCount: 3,
      columnRoles: [
        { columnIndex: 0, role: "DATE" },
        { columnIndex: 1, role: "AMOUNT" },
        { columnIndex: 1, role: "DESCRIPTION" },
      ],
      amountMode: "SIGNED_AMOUNT",
      confidence: 80,
    })).toThrow();
  });
});
