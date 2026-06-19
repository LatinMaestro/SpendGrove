import { describe, expect, it } from "vitest";
import { parseCsvDocument, scanCsvDocument } from "@/lib/csv-import";
import {
  IMPORT_REVIEW_PAGE_SIZE,
  countImportReviewRowsNeedingAttention,
  getImportReviewPage,
  importReviewPageCount,
} from "@/lib/import-review-acceptance";
import {
  createTransientImportReviewRows,
  updateImportReviewAction,
  updateImportReviewDetails,
} from "@/lib/import-review";
import { manualCategories } from "@/lib/manual-categories";

function syntheticReview(rowCount: number) {
  const csv = Array.from({ length: rowCount }, (_, index) => {
    const day = String((index % 28) + 1).padStart(2, "0");
    return `${day}/06/2026,-${(10 + (index % 30)).toFixed(2)},Fictional merchant ${index + 1}`;
  }).join("\n");
  const document = parseCsvDocument(csv);
  const scan = scanCsvDocument(document, { 0: "DATE", 1: "AMOUNT", 2: "DESCRIPTION" });
  return createTransientImportReviewRows(document, scan.columns, scan.mapping);
}

describe("Phase 3A import review acceptance safeguards", () => {
  it("keeps a 600-row review in bounded 25-row pages", () => {
    const rows = syntheticReview(600);
    expect(rows).toHaveLength(600);
    expect(IMPORT_REVIEW_PAGE_SIZE).toBe(25);
    expect(importReviewPageCount(rows)).toBe(24);
    expect(getImportReviewPage(rows, 1)).toHaveLength(25);
    expect(getImportReviewPage(rows, 24)).toHaveLength(25);
    expect(getImportReviewPage(rows, 99)[0].rowNumber).toBe(576);
  });

  it("counts fallback categories as needing review and updates after category/action changes", () => {
    const rows = syntheticReview(3);
    expect(countImportReviewRowsNeedingAttention(rows)).toBe(3);

    const groceries = manualCategories.find((category) => category.name === "Groceries")!;
    const reviewed = updateImportReviewDetails(rows, rows[0].id, {
      merchantName: rows[0].merchantName,
      categoryId: groceries.id,
      editType: "CATEGORY_EDIT",
    });
    expect(countImportReviewRowsNeedingAttention(reviewed)).toBe(2);

    const skipped = updateImportReviewAction(reviewed, rows[1].id, "SKIP");
    expect(countImportReviewRowsNeedingAttention(skipped)).toBe(1);
  });

  it("counts unresolved merge targets and clears the count when a target is selected", () => {
    const groceries = manualCategories.find((category) => category.name === "Groceries")!;
    let rows = syntheticReview(1);
    rows = updateImportReviewDetails(rows, rows[0].id, {
      merchantName: rows[0].merchantName,
      categoryId: groceries.id,
      editType: "CATEGORY_EDIT",
    });
    rows = updateImportReviewAction(rows, rows[0].id, "MERGE");
    expect(countImportReviewRowsNeedingAttention(rows)).toBe(1);
    expect(countImportReviewRowsNeedingAttention(rows, {
      [rows[0].id]: {
        rowId: rows[0].id,
        targetTransactionId: "manual-safe-target",
        selectedAt: "2026-06-19T00:00:00.000Z",
        status: "REVIEW_ONLY",
      },
    })).toBe(0);
  });
});
