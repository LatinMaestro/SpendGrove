import { describe, expect, it } from "vitest";
import { manualCategories } from "@/lib/manual-categories";
import { parseCsvDocument, scanCsvDocument } from "@/lib/csv-import";
import {
  addImportHistoryEntry,
  createImportHistoryEntry,
  createTransientImportReviewRows,
  loadImportHistoryFromStorage,
  parseImportHistoryStorage,
  saveImportHistoryToStorage,
  serializeImportHistoryStorage,
  summarizeImportReview,
  updateImportReviewAction,
  updateImportReviewDetails,
} from "@/lib/import-review";

function syntheticReviewSource(rowCount = 3) {
  const rows = Array.from({ length: rowCount }, (_, index) => {
    const day = String((index % 28) + 1).padStart(2, "0");
    const amount = index % 2 === 0 ? "-12.50" : "+25.00";
    const description = index === 0
      ? "OSKO transfer to Alex Recipient account 12345678 reference 987654321"
      : index === 1
        ? "Woolworths terminal 76543210 card xx4321"
        : `Synthetic purchase ${index + 1}`;
    return `${day}/06/2026,${amount},${description}`;
  });
  const document = parseCsvDocument(rows.join("\n"));
  const scan = scanCsvDocument(document, {
    0: "DATE",
    1: "AMOUNT",
    2: "DESCRIPTION",
  });
  return { document, scan };
}

describe("import review foundation", () => {
  it("creates safe transient rows across multiple preview-sized chunks", () => {
    const { document, scan } = syntheticReviewSource(21);
    const rows = createTransientImportReviewRows(document, scan.columns, scan.mapping);

    expect(rows).toHaveLength(21);
    expect(rows[0]).toMatchObject({
      id: "csv-row-1",
      rowNumber: 1,
      amountCents: -1250,
      description: "OSKO payment to Alex",
      merchantName: "OSKO payment to Alex",
      action: "IMPORT",
    });
    expect(rows[20].rowNumber).toBe(21);
    expect(JSON.stringify(rows)).not.toContain("Alex Recipient");
    expect(JSON.stringify(rows)).not.toContain("12345678");
    expect(JSON.stringify(rows)).not.toContain("987654321");
  });

  it("updates Import, Skip and Merge intentions and reports live counts", () => {
    const { document, scan } = syntheticReviewSource();
    const initialRows = createTransientImportReviewRows(document, scan.columns, scan.mapping);
    const skipped = updateImportReviewAction(initialRows, initialRows[0].id, "SKIP");
    const merged = updateImportReviewAction(skipped, skipped[1].id, "MERGE");

    expect(summarizeImportReview(merged)).toEqual({
      totalRows: 3,
      importCount: 1,
      skipCount: 1,
      mergeCount: 1,
      warningCount: 0,
    });
  });

  it("allows safe merchant and seeded-category edits without retaining private fragments", () => {
    const { document, scan } = syntheticReviewSource();
    const rows = createTransientImportReviewRows(document, scan.columns, scan.mapping);
    const groceries = manualCategories.find((category) => category.name === "Groceries")!;
    const updated = updateImportReviewDetails(rows, rows[0].id, {
      merchantName: "Transfer to Jordan Recipient account 87654321",
      categoryId: groceries.id,
    });

    expect(updated[0]).toMatchObject({
      merchantName: "Bank transfer to Jordan",
      categoryId: groceries.id,
    });
    expect(JSON.stringify(updated)).not.toContain("Jordan Recipient");
    expect(JSON.stringify(updated)).not.toContain("87654321");
    expect(() => updateImportReviewDetails(rows, rows[0].id, {
      merchantName: "Safe merchant",
      categoryId: "unknown-category",
    })).toThrow("Choose an approved category");
  });

  it("resets transient actions and edits by rebuilding from safe source rows", () => {
    const { document, scan } = syntheticReviewSource();
    const initialRows = createTransientImportReviewRows(document, scan.columns, scan.mapping);
    const changed = updateImportReviewDetails(
      updateImportReviewAction(initialRows, initialRows[0].id, "SKIP"),
      initialRows[0].id,
      { merchantName: "Coles", categoryId: initialRows[0].categoryId },
    );
    const reset = createTransientImportReviewRows(document, scan.columns, scan.mapping);

    expect(changed[0]).toMatchObject({ action: "SKIP", merchantName: "Coles" });
    expect(reset[0]).toMatchObject({ action: "IMPORT", merchantName: "OSKO payment to Alex" });
  });

  it("stores only safe aggregate history metadata", () => {
    const { document, scan } = syntheticReviewSource();
    const rows = createTransientImportReviewRows(document, scan.columns, scan.mapping);
    const summary = summarizeImportReview(rows);
    const entry = createImportHistoryEntry(summary, {
      id: "review-1",
      now: new Date("2026-06-10T00:00:00.000Z"),
    });
    const serialized = serializeImportHistoryStorage(addImportHistoryEntry([], entry));

    expect(JSON.parse(serialized)).toEqual({
      version: 1,
      entries: [{
        id: "review-1",
        createdAt: "2026-06-10T00:00:00.000Z",
        status: "REVIEW_SAVED",
        totalRows: 3,
        importCount: 3,
        skipCount: 0,
        mergeCount: 0,
        warningCount: 0,
      }],
    });
    expect(serialized).not.toContain("description");
    expect(serialized).not.toContain("merchant");
    expect(serialized).not.toContain("category");
    expect(serialized).not.toContain("amount");
    expect(serialized).not.toContain("filename");
  });

  it("recovers safely from corrupted or over-broad local history", () => {
    expect(parseImportHistoryStorage("not-json")).toEqual({
      entries: [],
      recoveredFromCorruption: true,
    });
    expect(parseImportHistoryStorage(JSON.stringify({
      version: 1,
      entries: [{ rawRows: ["not permitted"] }],
    }))).toEqual({
      entries: [],
      recoveredFromCorruption: true,
    });
  });

  it("falls back safely when browser storage is unavailable", () => {
    const unavailableStorage = {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("blocked"); },
    };

    expect(loadImportHistoryFromStorage(unavailableStorage)).toEqual({
      entries: [],
      recoveredFromCorruption: false,
      storageAvailable: false,
    });
    expect(saveImportHistoryToStorage(unavailableStorage, [])).toBe(false);
  });
});
