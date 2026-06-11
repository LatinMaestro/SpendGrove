import type {
  CsvColumnAssessment,
  CsvMapping,
  TransientCsvDocument,
} from "@/lib/csv-import";
import {
  createTransientImportReviewRows,
  type ImportReviewRow,
} from "@/lib/import-review";
import type { LocalMerchantData } from "@/lib/merchant-rules";

export const IMPORT_MAPPING_PREVIEW_LIMIT = 3;

export function createImportMappingPreview(
  document: TransientCsvDocument,
  columns: CsvColumnAssessment[],
  mapping: CsvMapping,
  merchantData?: LocalMerchantData,
): ImportReviewRow[] {
  const previewDocument: TransientCsvDocument = {
    ...document,
    rows: document.rows.slice(0, IMPORT_MAPPING_PREVIEW_LIMIT),
  };

  return createTransientImportReviewRows(
    previewDocument,
    columns,
    mapping,
    merchantData,
  );
}
