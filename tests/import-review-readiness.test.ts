import { describe, expect, it } from "vitest";
import type { ImportReviewRow } from "@/lib/import-review";
import { countReadyImportRows, countRowsInNeedsReviewCategory, createImportReviewWorkingSet, filterImportReviewRows, filterImportReviewRowsByWorkingSet, importReviewBlockerMessage, importReviewRowBlockers, importReviewRowHasHardBlocker, importReviewRowNeedsAttention } from "@/lib/import-review-readiness";
import { manualCategories } from "@/lib/manual-categories";

const categoryId = (name: string) => manualCategories.find((category) => category.name === name)!.id;
function row(overrides: Partial<ImportReviewRow> = {}): ImportReviewRow {
  return { id: "row-1", rowNumber: 1, date: "2026-06-19", amountCents: -1000, description: "Synthetic merchant", merchantName: "Synthetic merchant", categoryId: categoryId("Groceries"), action: "IMPORT", warningCodes: [], suggestionSource: "FALLBACK", suggestionConfidence: "LOW", suggestionReason: "Review", categoryConfirmed: true, merchantEdited: false, reviewState: "MANUALLY_REVIEWED", ...overrides };
}

describe("import review readiness and filtering", () => {
  it("removes Needs review after a valid category when no warning remains", () => {
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

  it("treats the approved Needs review category as a soft warning", () => {
    const needsReview = row({ categoryId: categoryId("Needs review"), categoryConfirmed: false });
    expect(importReviewRowHasHardBlocker(needsReview)).toBe(false);
    expect(importReviewRowNeedsAttention(needsReview)).toBe(true);
    expect(countRowsInNeedsReviewCategory([needsReview])).toBe(1);
  });

  it("keeps a captured filtered working set stable after category selection", () => {
    const unresolved = row({ id: "unresolved", categoryId: categoryId("Needs review"), categoryConfirmed: false });
    const alreadyReady = row({ id: "ready" });
    const workingSet = createImportReviewWorkingSet([unresolved, alreadyReady]);
    expect(workingSet).toEqual(["unresolved"]);

    const resolved = row({ id: "unresolved", categoryId: categoryId("Groceries"), categoryConfirmed: true });
    const visible = filterImportReviewRowsByWorkingSet([resolved, alreadyReady], workingSet);
    expect(visible).toEqual([resolved]);
    expect(importReviewRowNeedsAttention(visible[0])).toBe(false);
  });

  it("refreshes the filtered set only when intentionally recaptured", () => {
    const unresolved = row({ id: "unresolved", categoryId: categoryId("Needs review"), categoryConfirmed: false });
    const initial = createImportReviewWorkingSet([unresolved]);
    const resolved = row({ id: "unresolved", categoryId: categoryId("Groceries"), categoryConfirmed: true });
    expect(filterImportReviewRowsByWorkingSet([resolved], initial)).toHaveLength(1);
    expect(filterImportReviewRowsByWorkingSet([resolved], createImportReviewWorkingSet([resolved]))).toHaveLength(0);
  });

  it("retains the dynamic filter helper for non-working-set callers", () => {
    const ready = row({ id: "ready" });
    const unresolved = row({ id: "unresolved", categoryId: categoryId("Needs review"), categoryConfirmed: false });
    expect(filterImportReviewRows([ready, unresolved], true)).toEqual([unresolved]);
    expect(filterImportReviewRows([ready, unresolved], false)).toEqual([ready, unresolved]);
  });

  it("keeps unresolved Merge rows filtered until an eligible target is chosen", () => {
    const merge = row({ id: "merge", action: "MERGE" });
    expect(importReviewRowNeedsAttention(merge)).toBe(true);
    expect(importReviewRowNeedsAttention(merge, { merge: { rowId: "merge", targetTransactionId: "manual-1", selectedAt: "2026-06-19T00:00:00.000Z", status: "REVIEW_ONLY" } })).toBe(false);
  });
});
