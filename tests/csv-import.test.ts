import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  assessCsvColumns,
  getCsvWarningMessages,
  getSafeSelectedCsvLabel,
  hasConfidentCsvHeader,
  parseAustralianCsvDate,
  parseCsvDocument,
  scanCsvDocument,
  validateCsvMapping,
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
    expect(scan.warningCodes).toContain("PRIVATE_COLUMNS_EXCLUDED");
    expect(scan.parsedRowCount).toBe(4);
    expect(scan.previewRows[0]).toMatchObject({
      date: "2026-06-05",
      amountCents: -4235,
      description: "Woolworths",
    });
    expect(JSON.stringify(scan)).not.toContain("SYNTHETIC-ONLY");
  });

  it("supports separate debit and credit amount columns", async () => {
    const document = parseCsvDocument(await fixture("westpac-split-amounts.csv"));
    const scan = scanCsvDocument(document);

    expect(scan.profile.profileId).toBe("westpac-everyday-v1");
    expect(scan.amountMode).toBe("DEBIT_CREDIT");
    expect(scan.previewRows[0].amountCents).toBe(-6325);
    expect(scan.previewRows[1].amountCents).toBe(245);
    expect(scan.privateColumnCount).toBe(1);
  });

  it("suggests a complete generic mapping while keeping it reviewable", async () => {
    const document = parseCsvDocument(await fixture("generic-headered-signed.csv"));
    const scan = scanCsvDocument(document);

    expect(document.hasHeader).toBe(true);
    expect(scan.profile).toMatchObject({
      profileId: "generic-transaction-v1",
      bankName: "Generic or custom CSV",
      requiresManualMapping: true,
    });
    expect(scan.mapping).toMatchObject({ 0: "DATE", 1: "AMOUNT", 2: "DESCRIPTION", 3: "IGNORE" });
    expect(scan.mappingIssues).toEqual([]);
    expect(scan.warningCodes).toContain("MANUAL_MAPPING_REQUIRED");
    expect(scan.previewRows[0]).toMatchObject({
      date: "2026-06-12",
      amountCents: -3120,
      description: "Bunnings",
    });
  });

  it("recognises clear generic debit and credit headers", async () => {
    const document = parseCsvDocument(await fixture("generic-headered-debit-credit.csv"));
    const scan = scanCsvDocument(document);

    expect(scan.mapping).toMatchObject({
      0: "DATE",
      1: "DESCRIPTION",
      2: "DEBIT",
      3: "CREDIT",
      4: "IGNORE",
    });
    expect(scan.amountMode).toBe("DEBIT_CREDIT");
    expect(scan.mappingIssues).toEqual([]);
    expect(scan.previewRows.map((row) => row.amountCents)).toEqual([-5430, 320, -8800]);
  });

  it("uses value structure to suggest unknown columns without silently accepting a bank profile", async () => {
    const document = parseCsvDocument(await fixture("unknown-manual-mapping.csv"));
    const scan = scanCsvDocument(document);

    expect(document.hasHeader).toBe(true);
    expect(scan.profile).toMatchObject({
      profileId: "generic-transaction-v1",
      requiresManualMapping: true,
    });
    expect(scan.mapping).toMatchObject({ 0: "DATE", 1: "AMOUNT", 2: "DESCRIPTION", 3: "IGNORE" });
    expect(scan.mappingIssues).toEqual([]);
    expect(scan.previewRows[0]).toMatchObject({
      date: "2026-06-01",
      amountCents: -1640,
      description: "Aldi",
    });
  });

  it("preserves every first row in a headerless fixture and suggests generic roles", async () => {
    const document = parseCsvDocument(await fixture("headerless-signed-amount.csv"));
    const scan = scanCsvDocument(document);

    expect(document.hasHeader).toBe(false);
    expect(document.rows).toHaveLength(3);
    expect(document.headers).toEqual(["Column 1", "Column 2", "Column 3"]);
    expect(scan.mapping).toMatchObject({ 0: "DATE", 1: "AMOUNT", 2: "DESCRIPTION" });
    expect(scan.previewRows[0]).toMatchObject({
      rowNumber: 1,
      date: "2026-06-12",
      amountCents: -2480,
      description: "Woolworths",
    });
    expect(scan.warningCodes).toContain("HEADER_NOT_DETECTED");
    expect(scan.warningCodes).toContain("MANUAL_MAPPING_REQUIRED");
  });

  it("reports inconsistent column counts without exposing row values", async () => {
    const document = parseCsvDocument(await fixture("inconsistent-columns.csv"));
    const scan = scanCsvDocument(document);

    expect(document.structuralWarningCodes).toContain("INCONSISTENT_COLUMN_COUNT");
    expect(scan.warningCodes).toContain("INCONSISTENT_COLUMN_COUNT");
    expect(getCsvWarningMessages(scan.warningCodes)).toContain(
      "Some lines contain a different number of columns. Those transactions need an extra check.",
    );
  });

  it("flags unsupported structures for manual matching instead of guessing", async () => {
    const document = parseCsvDocument(await fixture("unsupported-two-column.csv"));
    const scan = scanCsvDocument(document);

    expect(scan.mappingIssues).toEqual(expect.arrayContaining([
      "Choose a date column.",
      "Choose a transaction amount column, or both money-out and money-in columns.",
    ]));
    expect(scan.warningCodes).toContain("STRUCTURE_NOT_RECOGNIZED");
    expect(scan.warningCodes).toContain("MAPPING_INCOMPLETE");
  });

  it("preserves a headerless mixed narration column and sanitises its first row", () => {
    const firstSyntheticRow = [
      "05/06/2026",
      "+42.35",
      "OSKO transfer to Fictional Person account 12345678 reference 987654321",
      "+1457.65",
    ];
    const csvText = [
      firstSyntheticRow.join(","),
      "06/06/2026,-4.80,Woolworths terminal 76543210 card xx4321,+1452.85",
    ].join("\n");

    expect(hasConfidentCsvHeader(firstSyntheticRow)).toBe(false);
    const document = parseCsvDocument(csvText);
    const initialScan = scanCsvDocument(document);

    expect(document.hasHeader).toBe(false);
    expect(document.headers).toEqual(["Column 1", "Column 2", "Column 3", "Column 4"]);
    expect(document.rows).toHaveLength(2);
    expect(document.rows[0]).toEqual(firstSyntheticRow);
    expect(initialScan.columns[2]).toMatchObject({
      safeLabel: "Column 3",
      isNarrative: true,
      isPrivate: false,
    });

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
      description: "Bank transfer",
    });
    expect(mappedScan.previewRows[1].description).toBe("Woolworths");
    expect(JSON.stringify(mappedScan)).not.toContain("Fictional Person");
    expect(JSON.stringify(mappedScan)).not.toContain("12345678");
    expect(JSON.stringify(mappedScan)).not.toContain("987654321");
  });

  it("sanitises mixed headered narrations instead of excluding the column", () => {
    const document = parseCsvDocument([
      "Date,Amount,Memo",
      "09/06/2026,-12.50,Transfer to Fictional Recipient acct 87654321",
      "10/06/2026,-18.75,Coles card xx6789 terminal 23456789",
    ].join("\n"));
    const scan = scanCsvDocument(document);

    expect(scan.columns[2]).toMatchObject({
      isNarrative: true,
      isPrivate: false,
      suggestedRole: "DESCRIPTION",
    });
    expect(scan.previewRows[0].description).toBe("Bank transfer");
    expect(scan.previewRows[1].description).toBe("Coles");
    expect(JSON.stringify(scan)).not.toContain("Fictional Recipient");
    expect(JSON.stringify(scan)).not.toContain("87654321");
    expect(JSON.stringify(scan)).not.toContain("23456789");
  });

  it("keeps genuine private identifier columns excluded", () => {
    const document = parseCsvDocument([
      "Date,Amount,Description,Account Number,BSB,Account Name,Card Number,Customer ID,Loan Reference",
      "09/06/2026,-12.50,Synthetic purchase,12345678,000-000,Fictional Account Holder,4444333322221111,76543210,987654321",
    ].join("\n"));
    const columns = assessCsvColumns(document);
    const scan = scanCsvDocument(document);

    expect(columns.slice(3)).toHaveLength(6);
    columns.slice(3).forEach((column) => {
      expect(column.isPrivate).toBe(true);
      expect(column.suggestedRole).toBe("PRIVATE");
    });
    expect(scan.privateColumnCount).toBe(6);
    expect(JSON.stringify(scan)).not.toContain("Fictional Account Holder");
    expect(JSON.stringify(scan)).not.toContain("4444333322221111");
    expect(JSON.stringify(scan)).not.toContain("987654321");
  });

  it("excludes an identifier-only headerless column", () => {
    const document = parseCsvDocument([
      "09/06/2026,-12.50,Synthetic purchase,12345678",
      "10/06/2026,-8.25,Synthetic transport,87654321",
    ].join("\n"));
    const columns = assessCsvColumns(document);

    expect(columns[3]).toMatchObject({
      isNarrative: false,
      isPrivate: true,
      privacyReason: "Private identifier-only column",
      suggestedRole: "PRIVATE",
    });
  });

  it("rejects conflicting or duplicate mappings", () => {
    expect(validateCsvMapping({
      0: "DATE",
      1: "AMOUNT",
      2: "DEBIT",
      3: "DESCRIPTION",
    })).toContain("Use either one transaction amount column or separate money-out and money-in columns.");

    expect(validateCsvMapping({
      0: "DATE",
      1: "DEBIT",
      2: "DESCRIPTION",
    })).toContain("Choose both money-out and money-in columns for a split amount file.");
  });

  it("never exposes the original selected filename", () => {
    expect(getSafeSelectedCsvLabel("Account-1234-private.csv")).toBe("Selected CSV file");
    expect(getSafeSelectedCsvLabel("ordinary.csv")).toBe("Selected CSV file");
  });

  it("parses quoted fields, Australian dates and integer-cent amounts", () => {
    const document = parseCsvDocument([
      "Date,Amount,Description",
      '9/6/26,"$1,234.56","Groceries, weekly"',
    ].join("\n"));
    const scan = scanCsvDocument(document);

    expect(parseAustralianCsvDate("9/6/26")).toBe("2026-06-09");
    expect(parseAustralianCsvDate("31/02/2026")).toBeNull();
    expect(scan.detectedDateFormats).toEqual(["DD/MM/YY"]);
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
