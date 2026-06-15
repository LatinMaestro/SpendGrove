import type { ImportReviewRow } from "@/lib/import-review";
import { normalizeMerchantName } from "@/lib/merchant-rules";

export type ApplySameMerchantUndo = {
  sourceRowId: string;
  affectedRowIds: string[];
  previousRows: ImportReviewRow[];
};

export type ApplySameMerchantResult = {
  rows: ImportReviewRow[];
  affectedCount: number;
  undo: ApplySameMerchantUndo | null;
};

function matchingEligibleRows(rows: ImportReviewRow[], source: ImportReviewRow) {
  const sourceKey = normalizeMerchantName(source.merchantName);
  return rows.filter((row) =>
    row.id !== source.id &&
    row.action !== "SKIP" &&
    normalizeMerchantName(row.merchantName) === sourceKey,
  );
}

export function countApplySameMerchantMatches(rows: ImportReviewRow[], rowId: string) {
  const source = rows.find((row) => row.id === rowId);
  if (!source || !source.categoryConfirmed || source.action === "SKIP") return 0;
  return matchingEligibleRows(rows, source).length;
}

export function applyCategoryToMatchingMerchants(
  rows: ImportReviewRow[],
  rowId: string,
): ApplySameMerchantResult {
  const source = rows.find((row) => row.id === rowId);
  if (!source || !source.categoryConfirmed || source.action === "SKIP") {
    return { rows, affectedCount: 0, undo: null };
  }

  const matches = matchingEligibleRows(rows, source);
  if (matches.length === 0) return { rows, affectedCount: 0, undo: null };
  const affectedIds = new Set(matches.map((row) => row.id));
  const previousRows = matches.map((row) => ({ ...row, warningCodes: [...row.warningCodes] }));
  const nextRows = rows.map((row) => affectedIds.has(row.id)
    ? {
        ...row,
        categoryId: source.categoryId,
        categoryConfirmed: true,
        reviewState: "APPLIED_TO_MATCH" as const,
        suggestionReason: "Applied to the same cleaned merchant in this review.",
      }
    : row);

  return {
    rows: nextRows,
    affectedCount: matches.length,
    undo: {
      sourceRowId: source.id,
      affectedRowIds: matches.map((row) => row.id),
      previousRows,
    },
  };
}

export function undoLastApplySameMerchant(
  rows: ImportReviewRow[],
  undo: ApplySameMerchantUndo | null,
) {
  if (!undo) return rows;
  const previousById = new Map(undo.previousRows.map((row) => [row.id, row]));
  return rows.map((row) => previousById.get(row.id) ?? row);
}
