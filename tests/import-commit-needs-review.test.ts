import { describe, expect, it } from "vitest";
import { createImportCommitRequest } from "@/lib/import-commit";
import type { ImportReviewRow } from "@/lib/import-review";
import { manualCategories } from "@/lib/manual-categories";
import { commitReviewedImport, type ImportCommitStore } from "@/src/server/import-commit";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const needsReviewCategoryId = manualCategories.find((category) => category.name === "Needs review")!.id;

function reviewRow(overrides: Partial<ImportReviewRow> = {}): ImportReviewRow {
  return { id: "row-1", rowNumber: 1, date: "2026-06-19", amountCents: -1234, description: "Synthetic payment", merchantName: "Synthetic payment", categoryId: needsReviewCategoryId, action: "IMPORT", warningCodes: [], suggestionSource: "FALLBACK", suggestionConfidence: "LOW", suggestionReason: "Review", categoryConfirmed: false, merchantEdited: false, reviewState: "UNREVIEWED", ...overrides };
}

const metadata = { parsedRowCount: 1, privateFieldCount: 0, hasHeader: true, amountMode: "SIGNED_AMOUNT" as const, detectedDateFormats: ["DD/MM/YYYY" as const], warningCodes: [] };

describe("Needs review import commits", () => {
  it("commits an approved Needs review category with a safe aggregate warning code", async () => {
    const request = createImportCommitRequest({ requestId: "11111111-1111-4111-8111-111111111111", rows: [reviewRow()], mergeSelections: {}, metadata });
    expect(request.rows[0]).toMatchObject({ categoryId: needsReviewCategoryId, warningCodes: ["NEEDS_REVIEW_CATEGORY"] });

    const summaries = new Map<string, Awaited<ReturnType<ImportCommitStore["commit"]>>>();
    const store: ImportCommitStore = { async commit(_userId, input) {
      const existing = summaries.get(input.requestId);
      if (existing) return { ...existing, alreadyCommitted: true };
      const summary = { batchId: input.requestId, totalCount: 1, importedCount: 1, skippedCount: 0, mergedCount: 0, warningCount: 1, alreadyCommitted: false };
      summaries.set(input.requestId, summary);
      return summary;
    } };

    const first = await commitReviewedImport(createTestUserContext("user_1"), request, store);
    const retry = await commitReviewedImport(createTestUserContext("user_1"), request, store);
    expect(first).toMatchObject({ importedCount: 1, warningCount: 1, alreadyCommitted: false });
    expect(retry).toMatchObject({ importedCount: 1, alreadyCommitted: true });
    expect(summaries.size).toBe(1);
  });

  it("still rejects invalid amounts, invalid dates and unrecognised categories before network save", () => {
    expect(() => createImportCommitRequest({ requestId: "11111111-1111-4111-8111-111111111111", rows: [reviewRow({ amountCents: 0 })], mergeSelections: {}, metadata })).toThrow(/Row 1: invalid amount/);
    expect(() => createImportCommitRequest({ requestId: "11111111-1111-4111-8111-111111111111", rows: [reviewRow({ date: null })], mergeSelections: {}, metadata })).toThrow(/Row 1: invalid date/);
    expect(() => createImportCommitRequest({ requestId: "11111111-1111-4111-8111-111111111111", rows: [reviewRow({ categoryId: "fake-category" })], mergeSelections: {}, metadata })).toThrow(/Row 1: category not recognised/);
  });
});
