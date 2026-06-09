import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  assessCsvColumns,
  getSafeSelectedCsvLabel,
  hasConfidentCsvHeader,
  parseAustralianCsvDate,
  parseCsvDocument,
  scanCsvDocument,
  type CsvMapping,
} from "@/lib/csv-import";

async function fixture(name: string) {
  return readFile(new URL(`../sample-data/synthetic/${name}`, import.meta.url), "utf8");
}

describe("CSV import foundation", () => {
  it("detects a supported profile and excludes private columns from previews", async () => {
    const document = parseCsvDocument(await fixture("commbank-everyday.csv"));
    const scan = scanCsvDocument(document);

    expect(document.hasHeader).toBe(true);
    expect(scan.profile).toMatchObject({
      profileId: "commbank-everyday-v1",
      bankName: "Commonwealth Bank",
      requiresManualMapping: false,
    });
    expect(scan.privateColumnCount).toBe(1);
    expect(scan.parsedRowCount).toBe(4);
    expect(scan.previewRows[0]).toMatchObject({
      date: "2026-06-05",
      amountCents: -4235,
      description: "Woolworths Metro",
    });
    expect(JSON.stringify(scan)).not.toContain("SYNTHETIC-ONLY");
  });

  it("supports separate debit and credit amount columns", async () => {
    const document = parseCsvDocument(await fixture("westpac-split-amounts.csv"));
    const scan = scanCsvDocument(document);

    expect(scan.profile.profileId).toBe("westpac-everyday-v1");
    expect(scan.previewRows[0].amountCents).toBe(-6325);
    expect(scan.previewRows[1].amountCents).toBe(245);
    expect(scan.privateColumnCount).toBe(1);
  });

  it("routes unknown headers to manual mapping instead of failing silently", async () => {
    const document = parseCsvDocument(await fixture("unknown-manual-mapping.csv"));
    const initialScan = scanCsvDocument(document);

    expect(document.hasHeader).toBe(true);
    expect(initialScan.profile).toMatchObject({
      profileId: null,
      requiresManualMapping: true,
    });
    expect(initialScan.mappingIssues.length).toBeGreaterThan(0);

    const manualMapping: CsvMapping = {
      0: "DATE",
      1: "AMOUNT",
      2: "DESCRIPTION",
      3: "IGNORE",
    };
    const mappedScan = scanCsvDocument(document, manualMapping);
    expect(mappedScan.mappingIssues).toEqual([]);
    expect(mappedScan.previewRows[0]).toMatchObject({
      date: "2026-06-01",
      amountCents: -1640,
      description: "Aldi groceries",
    });
  });

  it("preserves every row in a headerless CSV and parses explicit positive amounts", () => {
    const firstSyntheticRow = ["05/06/2026", "+42.35", "Synthetic refund", "+1457.65"];
    const csvText = [
      firstSyntheticRow.join(","),
      "06/06/2026,-4.80,Synthetic transport,+1452.85",
    ].join("\n");

    expect(hasConfidentCsvHeader(firstSyntheticRow)).toBe(false);
    const document = parseCsvDocument(csvText);
    const initialScan = scanCsvDocument(document);

    expect(document.hasHeader).toBe(false);
    expect(document.headers).toEqual(["Column 1", "Column 2", "Column 3", "Column 4"]);
    expect(document.rows).toHaveLength(2);
    expect(document.rows[0]).toEqual(firstSyntheticRow);
    expect(initialScan.columns.map((column) => column.safeLabel)).toEqual(document.headers);
    expect(initialScan.profile).toMatchObject({ profileId: null, requiresManualMapping: true });

    const mappedScan = scanCsvDocument(document, {
      0: "DATE",
      1: "AMOUNT",
      2: "DESCRIPTION",
      3: "IGNORE",
    });
    expect(mappedScan.parsedRowCount).toBe(2);
    expect(mappedScan.previewRows[0]).toMatchObject({
      rowNumber: 1,
      date: "2026-06-05",
      amountCents: 4235,
      description: "Synthetic refund",
    });
  });

  it("never exposes the original selected filename", () => {
    expect(getSafeSelectedCsvLabel("Account-1234-private.csv")).toBe("Selected CSV file");
    expect(getSafeSelectedCsvLabel("ordinary.csv")).toBe("Selected CSV file");
  });

  it("detects private value patterns even when the header looks harmless", () => {
    const document = parseCsvDocument([
      "Date,Amount,Memo,Description",
      "09/06/2026,-12.50,BSB 000-000,Coffee",
    ].join("\n"));
    const columns = assessCsvColumns(document);

    expect(columns[2]).toMatchObject({
      isPrivate: true,
      privacyReason: "Private identifier pattern",
      suggestedRole: "PRIVATE",
    });
    expect(JSON.stringify(scanCsvDocument(document))).not.toContain("000-000");
  });

  it("parses quoted fields, Australian dates and integer-cent amounts", () => {
    const document = parseCsvDocument([
      "Date,Amount,Description",
      '9/6/26,"$1,234.56","Groceries, weekly"',
    ].join("\n"));
    const scan = scanCsvDocument(document);

    expect(parseAustralianCsvDate("9/6/26")).toBe("2026-06-09");
    expect(parseAustralianCsvDate("31/02/2026")).toBeNull();
    expect(scan.previewRows[0]).toMatchObject({
      date: "2026-06-09",
      amountCents: 123456,
      description: "Groceries, weekly",
    });
  });

  it("rejects malformed or structurally incomplete CSV input", () => {
    expect(() => parseCsvDocument("")).toThrow("empty");
    expect(() => parseCsvDocument("Date,Amount\n")).toThrow("at least one data row");
    expect(() => parseCsvDocument('Date,Amount\n"09/06/2026,12.00')).toThrow("unclosed quoted field");
  });
});
