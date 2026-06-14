import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseCsvDocument, scanCsvDocument } from "@/lib/csv-import";

async function fixture(name: string) {
  return readFile(new URL(`../sample-data/synthetic/${name}`, import.meta.url), "utf8");
}

describe("CSV parser regression formats", () => {
  it("suggests a complete reviewable mapping for a generic signed-amount file", async () => {
    const document = parseCsvDocument(await fixture("generic-headered-signed.csv"));
    const scan = scanCsvDocument(document);

    expect(document).toMatchObject({
      hasHeader: true,
      headerConfidence: 95,
    });
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
    expect(scan.mappingIssues).toEqual([]);
    expect(scan.amountMode).toBe("SIGNED_AMOUNT");
    expect(scan.detectedDateFormats).toEqual(["DD/MM/YYYY"]);
    expect(scan.previewRows[0]).toMatchObject({
      date: "2026-06-12",
      amountCents: -3120,
    });
  });

  it("suggests separate money-out and money-in columns", async () => {
    const document = parseCsvDocument(await fixture("generic-headered-debit-credit.csv"));
    const scan = scanCsvDocument(document);

    expect(scan.profile).toMatchObject({
      profileId: "generic-transaction-v1",
      requiresManualMapping: true,
    });
    expect(scan.mapping).toMatchObject({
      0: "DATE",
      1: "DESCRIPTION",
      2: "DEBIT",
      3: "CREDIT",
      4: "IGNORE",
    });
    expect(scan.mappingIssues).toEqual([]);
    expect(scan.amountMode).toBe("DEBIT_CREDIT");
    expect(scan.previewRows[0].amountCents).toBe(-5430);
    expect(scan.previewRows[1].amountCents).toBe(320);
  });

  it("preserves the first row of a headerless file and suggests generic roles", async () => {
    const csvText = await fixture("headerless-signed-amount.csv");
    const firstRecord = csvText.trim().split(/\r?\n/)[0].split(",");
    const document = parseCsvDocument(csvText);
    const scan = scanCsvDocument(document);

    expect(document.hasHeader).toBe(false);
    expect(document.headers).toEqual(["Column 1", "Column 2", "Column 3", "Column 4"]);
    expect(document.rows).toHaveLength(3);
    expect(document.rows[0]).toEqual(firstRecord);
    expect(scan.mapping).toMatchObject({
      0: "DATE",
      1: "AMOUNT",
      2: "DESCRIPTION",
      3: "IGNORE",
    });
    expect(scan.mappingIssues).toEqual([]);
    expect(scan.warningCodes).toEqual(expect.arrayContaining([
      "HEADER_NOT_DETECTED",
      "MANUAL_MAPPING_REQUIRED",
    ]));
    expect(scan.previewRows[0]).toMatchObject({
      rowNumber: 1,
      date: "2026-06-12",
      amountCents: -2480,
      description: "Woolworths",
    });
  });
});
