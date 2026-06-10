import { z } from "zod";
import {
  buildSanitizedCsvPreview,
  CSV_PREVIEW_ROW_LIMIT,
  type CsvColumnAssessment,
  type CsvMapping,
  type TransientCsvDocument,
} from "@/lib/csv-import";
import { getManualCategory, manualCategories } from "@/lib/manual-categories";
import {
  containsPrivateBankIdentifier,
  sanitizeTransactionNarration,
} from "@/lib/validation/privacy";

export const IMPORT_HISTORY_STORAGE_KEY = "spendgrove.phase1.import-history.v1";
export const IMPORT_HISTORY_STORAGE_VERSION = 1 as const;
export const IMPORT_HISTORY_LIMIT = 20;

export type ImportReviewAction = "IMPORT" | "SKIP" | "MERGE";

export type ImportReviewRow = {
  id: string;
  rowNumber: number;
  date: string | null;
  amountCents: number | null;
  description: string;
  merchantName: string;
  categoryId: string;
  action: ImportReviewAction;
  warningCodes: string[];
};

export type ImportReviewSummary = {
  totalRows: number;
  importCount: number;
  skipCount: number;
  mergeCount: number;
  warningCount: number;
};

export type ImportHistoryEntry = ImportReviewSummary & {
  id: string;
  createdAt: string;
  status: "REVIEW_SAVED";
};

export type ImportHistoryStorageResult = {
  entries: ImportHistoryEntry[];
  recoveredFromCorruption: boolean;
};

export type ImportHistoryStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

const reviewActionSchema = z.enum(["IMPORT", "SKIP", "MERGE"]);

const safeNarrationSchema = z.string().max(120).refine(
  (value) => !containsPrivateBankIdentifier(value),
  "Private banking identifiers are not permitted in review text.",
);

const importReviewRowSchema = z.object({
  id: z.string().min(1),
  rowNumber: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  amountCents: z.number().int().safe().nullable(),
  description: safeNarrationSchema,
  merchantName: safeNarrationSchema,
  categoryId: z.string().min(1),
  action: reviewActionSchema,
  warningCodes: z.array(z.string().regex(/^[A-Z0-9_]+$/)),
}).strict().superRefine((row, context) => {
  if (!getManualCategory(row.categoryId)) {
    context.addIssue({
      code: "custom",
      path: ["categoryId"],
      message: "Choose an approved category.",
    });
  }
});

const importHistoryEntrySchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  status: z.literal("REVIEW_SAVED"),
  totalRows: z.number().int().nonnegative(),
  importCount: z.number().int().nonnegative(),
  skipCount: z.number().int().nonnegative(),
  mergeCount: z.number().int().nonnegative(),
  warningCount: z.number().int().nonnegative(),
}).strict().superRefine((entry, context) => {
  if (entry.importCount + entry.skipCount + entry.mergeCount !== entry.totalRows) {
    context.addIssue({
      code: "custom",
      path: ["totalRows"],
      message: "Import history counts must equal the total row count.",
    });
  }
});

const importHistoryEnvelopeSchema = z.object({
  version: z.literal(IMPORT_HISTORY_STORAGE_VERSION),
  entries: z.array(importHistoryEntrySchema).max(IMPORT_HISTORY_LIMIT),
}).strict();

function categoryIdByName(name: string) {
  const category = manualCategories.find((candidate) => candidate.name === name);
  if (!category) throw new Error(`Missing seeded category: ${name}`);
  return category.id;
}

function defaultCategoryId(amountCents: number | null, description: string) {
  if (/transfer/i.test(description)) return categoryIdByName("Transfer to review");
  if ((amountCents ?? 0) > 0) return categoryIdByName("Other income");
  return categoryIdByName("Uncategorised");
}

function createLocalId(prefix: string) {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createTransientImportReviewRows(
  document: TransientCsvDocument,
  columns: CsvColumnAssessment[],
  mapping: CsvMapping,
) {
  const rows: ImportReviewRow[] = [];

  for (let offset = 0; offset < document.rows.length; offset += CSV_PREVIEW_ROW_LIMIT) {
    const chunkDocument: TransientCsvDocument = {
      ...document,
      rows: document.rows.slice(offset, offset + CSV_PREVIEW_ROW_LIMIT),
    };
    const chunk = buildSanitizedCsvPreview(chunkDocument, columns, mapping);
    if (chunk.mappingIssues.length > 0) {
      throw new Error("Complete the required column mapping before reviewing rows.");
    }

    chunk.previewRows.forEach((row) => {
      const adjustedRowNumber = row.rowNumber + offset;
      const description = sanitizeTransactionNarration(row.description);
      const merchantName = sanitizeTransactionNarration(row.merchantName || row.description);
      rows.push(importReviewRowSchema.parse({
        id: `csv-row-${adjustedRowNumber}`,
        rowNumber: adjustedRowNumber,
        date: row.date,
        amountCents: row.amountCents,
        description,
        merchantName,
        categoryId: defaultCategoryId(row.amountCents, description),
        action: "IMPORT",
        warningCodes: row.warningCodes,
      }));
    });
  }

  return rows;
}

export function updateImportReviewAction(
  rows: ImportReviewRow[],
  rowId: string,
  action: ImportReviewAction,
) {
  const validatedAction = reviewActionSchema.parse(action);
  return rows.map((row) => row.id === rowId
    ? importReviewRowSchema.parse({ ...row, action: validatedAction })
    : row);
}

export function updateImportReviewDetails(
  rows: ImportReviewRow[],
  rowId: string,
  details: { merchantName: string; categoryId: string },
) {
  const merchantName = sanitizeTransactionNarration(details.merchantName);
  return rows.map((row) => row.id === rowId
    ? importReviewRowSchema.parse({ ...row, merchantName, categoryId: details.categoryId })
    : row);
}

export function summarizeImportReview(rows: ImportReviewRow[]): ImportReviewSummary {
  return rows.reduce<ImportReviewSummary>((summary, row) => ({
    totalRows: summary.totalRows + 1,
    importCount: summary.importCount + (row.action === "IMPORT" ? 1 : 0),
    skipCount: summary.skipCount + (row.action === "SKIP" ? 1 : 0),
    mergeCount: summary.mergeCount + (row.action === "MERGE" ? 1 : 0),
    warningCount: summary.warningCount + (row.warningCodes.length > 0 ? 1 : 0),
  }), { totalRows: 0, importCount: 0, skipCount: 0, mergeCount: 0, warningCount: 0 });
}

export function createImportHistoryEntry(
  summary: ImportReviewSummary,
  options: { id?: string; now?: Date } = {},
) {
  return importHistoryEntrySchema.parse({
    id: options.id ?? createLocalId("review"),
    createdAt: (options.now ?? new Date()).toISOString(),
    status: "REVIEW_SAVED",
    ...summary,
  });
}

export function addImportHistoryEntry(
  entries: ImportHistoryEntry[],
  entry: ImportHistoryEntry,
) {
  return [importHistoryEntrySchema.parse(entry), ...entries]
    .slice(0, IMPORT_HISTORY_LIMIT);
}

export function parseImportHistoryStorage(rawValue: string | null): ImportHistoryStorageResult {
  if (!rawValue) return { entries: [], recoveredFromCorruption: false };

  try {
    const parsed = importHistoryEnvelopeSchema.safeParse(JSON.parse(rawValue));
    if (!parsed.success) return { entries: [], recoveredFromCorruption: true };
    return { entries: parsed.data.entries, recoveredFromCorruption: false };
  } catch {
    return { entries: [], recoveredFromCorruption: true };
  }
}

export function serializeImportHistoryStorage(entries: ImportHistoryEntry[]) {
  return JSON.stringify(importHistoryEnvelopeSchema.parse({
    version: IMPORT_HISTORY_STORAGE_VERSION,
    entries,
  }));
}

export function loadImportHistoryFromStorage(storage: ImportHistoryStorage) {
  try {
    return {
      ...parseImportHistoryStorage(storage.getItem(IMPORT_HISTORY_STORAGE_KEY)),
      storageAvailable: true,
    };
  } catch {
    return { entries: [], recoveredFromCorruption: false, storageAvailable: false };
  }
}

export function saveImportHistoryToStorage(
  storage: ImportHistoryStorage,
  entries: ImportHistoryEntry[],
) {
  try {
    storage.setItem(IMPORT_HISTORY_STORAGE_KEY, serializeImportHistoryStorage(entries));
    return true;
  } catch {
    return false;
  }
}
