import type { MergeTargetReviewSelection } from "@/lib/import-duplicate-scoring";
import type { ImportReviewRow } from "@/lib/import-review";
import { getManualCategory } from "@/lib/manual-categories";

export const IMPORT_REVIEW_PAGE_SIZE = 25;

export function importReviewPageCount(
  rows: ImportReviewRow[],
  pageSize = IMPORT_REVIEW_PAGE_SIZE,
) {
  return Math.max(1, Math.ceil(rows.length / pageSize));
}

export function clampImportReviewPage(
  page: number,
  rows: ImportReviewRow[],
  pageSize = IMPORT_REVIEW_PAGE_SIZE,
) {
  return Math.min(Math.max(Math.trunc(page), 1), importReviewPageCount(rows, pageSize));
}

export function getImportReviewPage(
  rows: ImportReviewRow[],
  page: number,
  pageSize = IMPORT_REVIEW_PAGE_SIZE,
) {
  const safePage = clampImportReviewPage(page, rows, pageSize);
  const start = (safePage - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function importReviewRowNeedsAttention(
  row: ImportReviewRow,
  mergeSelections: Record<string, MergeTargetReviewSelection> = {},
) {
  if (row.action === "SKIP") return false;
  const category = getManualCategory(row.categoryId);
  if (!row.date || row.amountCents === null) return true;
  if (!category || category.name === "Needs review") return true;
  if (row.warningCodes.length > 0) return true;
  if (row.action === "MERGE" && mergeSelections[row.id]?.status !== "REVIEW_ONLY") return true;
  return false;
}

export function countImportReviewRowsNeedingAttention(
  rows: ImportReviewRow[],
  mergeSelections: Record<string, MergeTargetReviewSelection> = {},
) {
  return rows.filter((row) => importReviewRowNeedsAttention(row, mergeSelections)).length;
}
