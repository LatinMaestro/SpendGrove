import { describe, expect, it } from "vitest";
import type { ImportReviewRow } from "@/lib/import-review";
import { countReadyImportRows, filterImportReviewRows, importReviewBlockerMessage, importReviewRowBlockers, importReviewRowNeedsAttention } from "@/lib/import-review-readiness";
import { manualCategories } from "@/lib/manual-categories";

const categoryId = (name: string) => manualCategories.find((category) => category.name === name)!.id;
function row(overrides: Partial<ImportReviewRow> = {}): ImportReviewRow {
  return { id: "row-1", rowNumber: 1, date: "2026-06-19", amountCents: -1000, description: "Synthetic merchant", merchantName: "Synthetic merchant", categoryId: categoryId("Groceries"), action: "IMPORT", warningCodes: [], suggestionSource: "FALLBACK", suggestionConfidence: "LOW", suggestionReason: "Review", categoryConfirmed: true, merchantEdited: false, reviewState: "MANUALLY_REVIEWED", ...overrides };
}

describe("import review readiness and filtering", () => {
  it("removes Needs review after a valid category when no blocker remains", () => {
    const ready = row();
    expect(importReviewRowNeedsAttention(ready)).toBe(false);
    expect(importReviewRowBlockers(ready)).toEqual([]);
    expect(countReadyImportRows([ready])).toBe(1);
  });

  it("blocks zero-dollar rows before commit and explains why", () => {
    const zero = row({ amountCents: 0 });
    const blockers = importReviewRowBlockers(zero);
    expect(blockers).toContain("AMOUNT");
    expect(importReviewBlockerMessage(blockers)).toContain("non-zero amount");
  });

  it("filters unresolved rows without changing row objects", () => {
    const ready = row({ id: "ready" });
    const unresolved = row({ id: "unresolved", categoryId: categoryId("Needs review"), categoryConfirmed: false });
    const rows = [ready, unresolved];
    const filtered = filterImportReviewRows(rows, true);
    expect(filtered).toEqual([unresolved]);
    expect(filtered[0]).toBe(unresolved);
    expect(filterImportReviewRows(rows, false)).toBe(rows);
  });

  it("keeps unresolved Merge rows filtered until an eligible target is chosen", () => {
    const merge = row({ id: "merge", action: "MERGE" });
    expect(importReviewRowNeedsAttention(merge)).toBe(true);
    expect(importReviewRowNeedsAttention(merge, { merge: { rowId: "merge", targetTransactionId: "manual-1", selectedAt: "2026-06-19T00:00:00.000Z", status: "REVIEW_ONLY" } })).toBe(false);
  });
});
