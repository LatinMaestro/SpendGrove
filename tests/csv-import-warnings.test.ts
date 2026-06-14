import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  getCsvWarningMessages,
  parseCsvDocument,
  scanCsvDocument,
  validateCsvMapping,
} from "@/lib/csv-import";

async function fixture(name: string) {
  return readFile(new URL(`../sample-data/synthetic/${name}`, import.meta.url), "utf8");
}

describe("CSV parser warning paths", () => {
  it("uses values to complete a generic mapping when headers are unfamiliar", async () => {
    const document = parseCsvDocument(await fixture("unknown-manual-mapping.csv"));
    const scan = scanCsvDocument(document);

    expect(scan.profile).toMatchObject({
      profileId: "generic-transaction-v1",
      requiresManualMapping: true,
    });
    expect(scan.mapping).toMatchObject({
      0: "DATE",
      1: "AMOUNT",
      2: "DESCRIPTION",
      3: "IGNORE",
    });
    expect(scan.columns[0]).toMatchObject({
      suggestedRole: "DATE",
      roleSource: "VALUES",
    });
    expect(scan.mappingIssues).toEqual([]);
    expect(scan.previewRows[0]).toMatchObject({
      date: "2026-06-01",
      amountCents: -1640,
    });
  });

  it("warns when transaction rows have inconsistent column counts", async () => {
    const document = parseCsvDocument(await fixture("inconsistent-columns.csv"));
    const scan = scanCsvDocument(document);

    expect(document.structuralWarningCodes).toContain("INCONSISTENT_COLUMN_COUNT");
    expect(scan.warningCodes).toContain("INCONSISTENT_COLUMN_COUNT");
    expect(scan.parsedRowCount).toBe(3);
    expect(getCsvWarningMessages(scan.warningCodes)).toContain(
      "Some lines contain a different number of columns. Those transactions need an extra check.",
    );
  });

  it("routes unsupported structures to manual matching without guessing core fields", async () => {
    const document = parseCsvDocument(await fixture("unsupported-two-column.csv"));
    const scan = scanCsvDocument(document);

    expect(scan.profile).toMatchObject({
      profileId: null,
      requiresManualMapping: true,
    });
    expect(scan.mappingIssues).toEqual(expect.arrayContaining([
      "Choose a date column.",
      "Choose a transaction amount column, or both money-out and money-in columns.",
    ]));
    expect(scan.warningCodes).toEqual(expect.arrayContaining([
      "MAPPING_INCOMPLETE",
      "STRUCTURE_NOT_RECOGNIZED",
    ]));
  });

  it("rejects duplicate roles and conflicting amount layouts", () => {
    expect(validateCsvMapping({
      0: "DATE",
      1: "DATE",
      2: "AMOUNT",
      3: "DESCRIPTION",
    })).toContain("Choose only one date column.");

    expect(validateCsvMapping({
      0: "DATE",
      1: "AMOUNT",
      2: "DEBIT",
      3: "CREDIT",
      4: "DESCRIPTION",
    })).toContain("Use either one transaction amount column or separate money-out and money-in columns.");
  });
});
