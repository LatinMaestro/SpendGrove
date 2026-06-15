import { describe, expect, it } from "vitest";
import type { ImportReviewRow } from "@/lib/import-review";
import {
  applyCategoryToMatchingMerchants,
  countApplySameMerchantMatches,
  undoLastApplySameMerchant,
} from "@/lib/import-review-bulk";
import { manualCategories } from "@/lib/manual-categories";

function categoryId(name: string) {
  return manualCategories.find((category) => category.name === name)!.id;
}

function reviewRow(overrides: Partial<ImportReviewRow> & Pick<ImportReviewRow, "id" | "merchantName">): ImportReviewRow {
  return {
    id: overrides.id,
    rowNumber: overrides.rowNumber ?? 1,
    date: overrides.date ?? "2026-06-15",
    amountCents: overrides.amountCents ?? -1250,
    description: overrides.description ?? overrides.merchantName,
    merchantName: overrides.merchantName,
    categoryId: overrides.categoryId ?? categoryId("Needs review"),
    action: overrides.action ?? "IMPORT",
    warningCodes: overrides.warningCodes ?? [],
    suggestionSource: overrides.suggestionSource ?? "FALLBACK",
    suggestionConfidence: overrides.suggestionConfidence ?? "LOW",
    suggestionReason: overrides.suggestionReason ?? "Choose a category manually.",
    categoryConfirmed: overrides.categoryConfirmed ?? false,
    merchantEdited: overrides.merchantEdited ?? false,
    reviewState: overrides.reviewState ?? "UNREVIEWED",
  };
}

function merchantRows() {
  return [
    reviewRow({
      id: "source",
      merchantName: "Blue Lantern store North",
      categoryId: categoryId("Dining out"),
      categoryConfirmed: true,
      reviewState: "MANUALLY_REVIEWED",
      suggestionSource: "KEYWORD",
      suggestionConfidence: "MEDIUM",
      suggestionReason: "Reviewed by the user.",
    }),
    reviewRow({
      id: "matching-merge",
      rowNumber: 2,
      merchantName: "Blue Lantern store South",
      action: "MERGE",
    }),
    reviewRow({
      id: "matching-skipped",
      rowNumber: 3,
      merchantName: "Blue Lantern branch West",
      action: "SKIP",
    }),
    reviewRow({
      id: "different",
      rowNumber: 4,
      merchantName: "Green Garden Cafe",
    }),
  ];
}

describe("apply to same merchant", () => {
  it("shows the count of matching non-skipped transactions before applying", () => {
    const rows = merchantRows();
    expect(countApplySameMerchantMatches(rows, "source")).toBe(1);
    expect(countApplySameMerchantMatches(rows, "matching-skipped")).toBe(0);
  });

  it("uses cleaned merchant identity, excludes skipped rows, and preserves actions", () => {
    const rows = merchantRows();
    const result = applyCategoryToMatchingMerchants(rows, "source");

    expect(result.affectedCount).toBe(1);
    expect(result.undo?.affectedRowIds).toEqual(["matching-merge"]);
    expect(result.rows.find((row) => row.id === "matching-merge")).toMatchObject({
      categoryId: categoryId("Dining out"),
      categoryConfirmed: true,
      reviewState: "APPLIED_TO_MATCH",
      action: "MERGE",
    });
    expect(result.rows.find((row) => row.id === "matching-skipped")).toMatchObject({
      categoryId: categoryId("Needs review"),
      categoryConfirmed: false,
      action: "SKIP",
    });
    expect(result.rows.find((row) => row.id === "different")).toMatchObject({
      categoryId: categoryId("Needs review"),
      action: "IMPORT",
    });
  });

  it("undoes only the latest category-review changes and never restores an older action", () => {
    const applied = applyCategoryToMatchingMerchants(merchantRows(), "source");
    const changedAfterApply = applied.rows.map((row) => row.id === "matching-merge"
      ? { ...row, action: "SKIP" as const }
      : row);
    const undone = undoLastApplySameMerchant(changedAfterApply, applied.undo);

    expect(undone.find((row) => row.id === "matching-merge")).toMatchObject({
      categoryId: categoryId("Needs review"),
      categoryConfirmed: false,
      reviewState: "UNREVIEWED",
      action: "SKIP",
    });
  });

  it("does not apply from an unconfirmed or skipped source row", () => {
    const unconfirmed = merchantRows().map((row) => row.id === "source"
      ? { ...row, categoryConfirmed: false }
      : row);
    const skipped = merchantRows().map((row) => row.id === "source"
      ? { ...row, action: "SKIP" as const }
      : row);

    expect(applyCategoryToMatchingMerchants(unconfirmed, "source")).toMatchObject({
      affectedCount: 0,
      undo: null,
    });
    expect(applyCategoryToMatchingMerchants(skipped, "source")).toMatchObject({
      affectedCount: 0,
      undo: null,
    });
  });

  it("does not touch separate tax-review metadata", () => {
    const taxReview = {
      source: true,
      "matching-merge": false,
      "matching-skipped": true,
    };
    const before = structuredClone(taxReview);

    applyCategoryToMatchingMerchants(merchantRows(), "source");

    expect(taxReview).toEqual(before);
  });
});
