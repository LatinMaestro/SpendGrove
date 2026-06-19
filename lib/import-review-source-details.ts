import type { CsvColumnAssessment, CsvMapping, CsvColumnRole, TransientCsvDocument } from "@/lib/csv-import";

const reviewSourceRoles = new Set<CsvColumnRole>([
  "DATE",
  "AMOUNT",
  "DEBIT",
  "CREDIT",
  "DESCRIPTION",
  "MERCHANT",
]);

export type ImportReviewSourceField = {
  label: string;
  value: string;
};

export type ImportReviewSourceDetails = {
  fields: ImportReviewSourceField[];
};

/**
 * Projects only the active browser-memory CSV row into review-only display fields.
 * Private/ignored columns are excluded and callers must never add this object to a
 * commit, saved mapping, merchant rule, audit event, or account-history payload.
 */
export function createTransientImportReviewSourceDetails(
  document: TransientCsvDocument,
  columns: CsvColumnAssessment[],
  mapping: CsvMapping,
) {
  const visibleColumns = columns.filter((column) =>
    !column.isPrivate && reviewSourceRoles.has(mapping[column.index] ?? "IGNORE"),
  );

  return Object.fromEntries(document.rows.map((sourceRow, index) => {
    const rowNumber = index + (document.hasHeader ? 2 : 1);
    const fields = visibleColumns
      .map((column): ImportReviewSourceField => ({
        label: column.safeLabel,
        value: (sourceRow[column.index] ?? "").trim().slice(0, 500),
      }))
      .filter((field) => field.value.length > 0);
    return [rowNumber, { fields } satisfies ImportReviewSourceDetails];
  })) as Record<number, ImportReviewSourceDetails>;
}
