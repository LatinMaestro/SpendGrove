import type { ImportReviewRow } from "@/lib/import-review";

export type ImportReviewTaxMetadata = Record<string, boolean>;

export function updateTaxReviewMetadata(
  metadata: ImportReviewTaxMetadata,
  rowId: string,
  isPotentiallyDeductible: boolean,
): ImportReviewTaxMetadata {
  if (!rowId.trim()) throw new Error("A review row is required.");
  return { ...metadata, [rowId]: isPotentiallyDeductible };
}

export function isRowPotentiallyDeductible(
  metadata: ImportReviewTaxMetadata,
  rowId: string,
) {
  return metadata[rowId] === true;
}

export function canSaveLocalMerchantRule(row: ImportReviewRow) {
  return row.categoryConfirmed && row.reviewState !== "UNREVIEWED";
}
