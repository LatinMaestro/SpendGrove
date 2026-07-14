import type { MergeTargetReviewSelection } from "@/lib/import-duplicate-scoring";
import type { ImportReviewRow } from "@/lib/import-review";
import { getManualCategory } from "@/lib/manual-categories";

export type ImportReviewBlocker = "DATE" | "AMOUNT" | "CATEGORY" | "MERGE_TARGET";

export type ImportReviewBlockingRow = {
  rowNumber: number;
  blockers: ImportReviewBlocker[];
};

export function importReviewRowBlockers(
  row: ImportReviewRow,
  mergeSelections: Record<string, MergeTargetReviewSelection> = {},
): ImportReviewBlocker[] {
  if (row.action === "SKIP") return [];
  const blockers: ImportReviewBlocker[] = [];
  if (!row.date) blockers.push("DATE");
  if (row.amountCents === null || row.amountCents === 0) blockers.push("AMOUNT");
  if (!getManualCategory(row.categoryId)) blockers.push("CATEGORY");
  if (row.action === "MERGE" && mergeSelections[row.id]?.status !== "REVIEW_ONLY") blockers.push("MERGE_TARGET");
  return blockers;
}

export function importReviewBlockerMessage(blockers: ImportReviewBlocker[]) {
  if (blockers.includes("DATE")) return "Choose or correct the transaction date.";
  if (blockers.includes("AMOUNT")) return "This transaction needs a non-zero amount.";
  if (blockers.includes("CATEGORY")) return "Choose a recognised category.";
  if (blockers.includes("MERGE_TARGET")) return "Choose an eligible existing manual transaction to merge with.";
  return "";
}

export function importReviewBlockerReason(blocker: ImportReviewBlocker) {
  if (blocker === "DATE") return "invalid date";
  if (blocker === "AMOUNT") return "invalid amount";
  if (blocker === "CATEGORY") return "category not recognised";
  return "merge target missing";
}

export function importReviewRowHasHardBlocker(
  row: ImportReviewRow,
  mergeSelections: Record<string, MergeTargetReviewSelection> = {},
) {
  return importReviewRowBlockers(row, mergeSelections).length > 0;
}

export function importReviewRowIsInNeedsReviewCategory(row: ImportReviewRow) {
  return row.action !== "SKIP" && (
    getManualCategory(row.categoryId)?.name === "Needs review"
    || (row.suggestionSource === "FALLBACK" && !row.categoryConfirmed)
  );
}

/**
 * Suggestion provenance and non-critical parser warning codes are informative,
 * not unresolved row state. A row needs attention only when it has a true
 * commit blocker or is intentionally left in the approved placeholder category.
 */
export function importReviewRowNeedsAttention(
  row: ImportReviewRow,
  mergeSelections: Record<string, MergeTargetReviewSelection> = {},
) {
  if (row.action === "SKIP") return false;
  return importReviewRowHasHardBlocker(row, mergeSelections)
    || importReviewRowIsInNeedsReviewCategory(row);
}

export function listImportReviewBlockingRows(
  rows: ImportReviewRow[],
  mergeSelections: Record<string, MergeTargetReviewSelection> = {},
): ImportReviewBlockingRow[] {
  return rows.flatMap((row) => {
    const blockers = importReviewRowBlockers(row, mergeSelections);
    return blockers.length > 0 ? [{ rowNumber: row.rowNumber, blockers }] : [];
  });
}

export function countImportReviewRowsNeedingAttention(
  rows: ImportReviewRow[],
  mergeSelections: Record<string, MergeTargetReviewSelection> = {},
) {
  return rows.filter((row) => importReviewRowNeedsAttention(row, mergeSelections)).length;
}

export function countRowsInNeedsReviewCategory(rows: ImportReviewRow[]) {
  return rows.filter(importReviewRowIsInNeedsReviewCategory).length;
}

export function countReadyImportRows(
  rows: ImportReviewRow[],
  mergeSelections: Record<string, MergeTargetReviewSelection> = {},
) {
  return rows.filter((row) => row.action === "IMPORT" && !importReviewRowNeedsAttention(row, mergeSelections)).length;
}

export function createImportReviewWorkingSet(
  rows: ImportReviewRow[],
  mergeSelections: Record<string, MergeTargetReviewSelection> = {},
) {
  return rows.filter((row) => importReviewRowNeedsAttention(row, mergeSelections)).map((row) => row.id);
}

export function filterImportReviewRowsByWorkingSet(rows: ImportReviewRow[], workingSet: string[]) {
  const included = new Set(workingSet);
  return rows.filter((row) => included.has(row.id));
}

export function filterImportReviewRows(
  rows: ImportReviewRow[],
  onlyNeedsReview: boolean,
  mergeSelections: Record<string, MergeTargetReviewSelection> = {},
) {
  return onlyNeedsReview ? rows.filter((row) => importReviewRowNeedsAttention(row, mergeSelections)) : rows;
}
