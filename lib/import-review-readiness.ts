import type { MergeTargetReviewSelection } from "@/lib/import-duplicate-scoring";
import type { ImportReviewRow } from "@/lib/import-review";
import { getManualCategory } from "@/lib/manual-categories";

export type ImportReviewBlocker = "DATE" | "AMOUNT" | "CATEGORY" | "WARNING" | "MERGE_TARGET";

export function importReviewRowBlockers(
  row: ImportReviewRow,
  mergeSelections: Record<string, MergeTargetReviewSelection> = {},
): ImportReviewBlocker[] {
  if (row.action === "SKIP") return [];
  const blockers: ImportReviewBlocker[] = [];
  const category = getManualCategory(row.categoryId);
  if (!row.date) blockers.push("DATE");
  if (row.amountCents === null || row.amountCents === 0) blockers.push("AMOUNT");
  if (!category || category.name === "Needs review") blockers.push("CATEGORY");
  if (row.warningCodes.length > 0) blockers.push("WARNING");
  if (row.action === "MERGE" && mergeSelections[row.id]?.status !== "REVIEW_ONLY") blockers.push("MERGE_TARGET");
  return blockers;
}

export function importReviewBlockerMessage(blockers: ImportReviewBlocker[]) {
  if (blockers.includes("DATE")) return "Choose or correct the transaction date.";
  if (blockers.includes("AMOUNT")) return "This transaction needs a non-zero amount.";
  if (blockers.includes("CATEGORY")) return "Choose a category.";
  if (blockers.includes("MERGE_TARGET")) return "Choose an eligible existing manual transaction to merge with.";
  if (blockers.includes("WARNING")) return "Check the parser warning before saving.";
  return "";
}

export function importReviewRowNeedsAttention(row: ImportReviewRow, mergeSelections: Record<string, MergeTargetReviewSelection> = {}) {
  return importReviewRowBlockers(row, mergeSelections).length > 0;
}

export function countImportReviewRowsNeedingAttention(rows: ImportReviewRow[], mergeSelections: Record<string, MergeTargetReviewSelection> = {}) {
  return rows.filter((row) => importReviewRowNeedsAttention(row, mergeSelections)).length;
}

export function countReadyImportRows(rows: ImportReviewRow[], mergeSelections: Record<string, MergeTargetReviewSelection> = {}) {
  return rows.filter((row) => row.action === "IMPORT" && !importReviewRowNeedsAttention(row, mergeSelections)).length;
}

export function filterImportReviewRows(rows: ImportReviewRow[], onlyNeedsReview: boolean, mergeSelections: Record<string, MergeTargetReviewSelection> = {}) {
  return onlyNeedsReview ? rows.filter((row) => importReviewRowNeedsAttention(row, mergeSelections)) : rows;
}
