import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseCsvDocument, scanCsvDocument } from "@/lib/csv-import";
import { createImportCommitRequest } from "@/lib/import-commit";
import { createTransientImportReviewRows } from "@/lib/import-review";
import { createTransientImportReviewSourceDetails } from "@/lib/import-review-source-details";

async function source(path: string) { return readFile(new URL(`../${path}`, import.meta.url), "utf8"); }

describe("browser-local CSV source details", () => {
  it("shows mapped source fields while excluding private columns", () => {
    const document = parseCsvDocument("Date,Amount,Description,Account Number\n19/06/2026,-12.34,Transfer reference Account 12345678,12345678");
    const scan = scanCsvDocument(document, { 0: "DATE", 1: "AMOUNT", 2: "DESCRIPTION", 3: "PRIVATE" });
    const details = createTransientImportReviewSourceDetails(document, scan.columns, scan.mapping);
    expect(details[2].fields).toEqual([
      { label: "Date", value: "19/06/2026" },
      { label: "Amount", value: "-12.34" },
      { label: "Description", value: "Transfer reference Account 12345678" },
    ]);
    expect(details[2].fields.map((field) => field.label)).not.toContain("Private column 4");
  });

  it("never adds source detail objects or private source values to the commit payload", () => {
    const document = parseCsvDocument("Date,Amount,Description,Account Number\n19/06/2026,-12.34,Transfer reference Account 12345678,12345678");
    const scan = scanCsvDocument(document, { 0: "DATE", 1: "AMOUNT", 2: "DESCRIPTION", 3: "PRIVATE" });
    const rows = createTransientImportReviewRows(document, scan.columns, scan.mapping);
    const request = createImportCommitRequest({
      requestId: "11111111-1111-4111-8111-111111111111",
      rows,
      mergeSelections: {},
      metadata: { parsedRowCount: rows.length, privateFieldCount: scan.privateColumnCount, hasHeader: scan.hasHeader, amountMode: scan.amountMode, detectedDateFormats: scan.detectedDateFormats, warningCodes: scan.warningCodes },
    });
    expect(JSON.stringify(request)).not.toMatch(/sourceDetails|12345678|Account Number|rawRow|rawCsv/i);
  });

  it("keeps the source-detail helper out of durable server, profile, merchant and history paths", async () => {
    const durableSources = await Promise.all([
      source("lib/import-commit.ts"),
      source("src/server/import-commit.ts"),
      source("src/server/import-history.ts"),
      source("src/server/saved-import-profiles.ts"),
      source("src/server/merchant-rules.ts"),
    ]);
    durableSources.forEach((content) => expect(content).not.toContain("import-review-source-details"));
  });
});
