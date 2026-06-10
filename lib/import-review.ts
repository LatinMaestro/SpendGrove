import { z } from "zod";
import {
  buildSanitizedCsvPreview,
  CSV_PREVIEW_ROW_LIMIT,
  type CsvColumnAssessment,
  type CsvMapping,
  type TransientCsvDocument,
} from "@/lib/csv-import";
import { getManualCategory } from "@/lib/manual-categories";
import {
  emptyLocalMerchantData,
  normalizeMerchantName,
  suggestMerchantCategory,
  type LocalMerchantData,
  type MerchantSuggestionConfidence,
  type MerchantSuggestionSource,
} from "@/lib/merchant-rules";
import {
  containsPrivateBankIdentifier,
  sanitizeTransactionNarration,
} from "@/lib/validation/privacy";

export const IMPORT_HISTORY_STORAGE_KEY = "spendgrove.phase1.import-history.v1";
export const IMPORT_HISTORY_STORAGE_VERSION = 1 as const;
export const IMPORT_HISTORY_LIMIT = 20;

export type ImportReviewAction = "IMPORT" | "SKIP" | "MERGE";
export type ImportReviewDecisionState = "UNREVIEWED" | "CONFIRMED_SUGGESTION" | "MANUALLY_REVIEWED" | "APPLIED_TO_MATCH";
export type ImportReviewEditType = "CONFIRM_SUGGESTION" | "MERCHANT_EDIT" | "CATEGORY_EDIT";

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
  suggestionSource: MerchantSuggestionSource;
  suggestionConfidence: MerchantSuggestionConfidence;
  suggestionReason: string;
  categoryConfirmed: boolean;
  merchantEdited: boolean;
  reviewState: ImportReviewDecisionState;
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
const suggestionSourceSchema = z.enum(["USER_RULE", "USER_ALIAS", "KEYWORD", "FALLBACK"]);
const suggestionConfidenceSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
const reviewStateSchema = z.enum(["UNREVIEWED", "CONFIRMED_SUGGESTION", "MANUALLY_REVIEWED", "APPLIED_TO_MATCH"]);
const reviewEditTypeSchema = z.enum(["CONFIRM_SUGGESTION", "MERCHANT_EDIT", "CATEGORY_EDIT"]);

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
  suggestionSource: suggestionSourceSchema,
  suggestionConfidence: suggestionConfidenceSchema,
  suggestionReason: z.string().min(1).max(160),
  categoryConfirmed: z.boolean(),
  merchantEdited: z.boolean(),
  reviewState: reviewStateSchema,
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
  merchantData: LocalMerchantData = emptyLocalMerchantData(),
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
      const initialMerchant = sanitizeTransactionNarration(row.merchantName || row.description) || "Payment";
      const suggestion = suggestMerchantCategory(initialMerchant, merchantData);
      rows.push(importReviewRowSchema.parse({
        id: `csv-row-${adjustedRowNumber}`,
        rowNumber: adjustedRowNumber,
        date: row.date,
        amountCents: row.amountCents,
        description,
        merchantName: suggestion.merchantName,
        categoryId: suggestion.categoryId,
        action: "IMPORT",
        warningCodes: row.warningCodes,
        suggestionSource: suggestion.source,
        suggestionConfidence: suggestion.confidence,
        suggestionReason: suggestion.reason,
        categoryConfirmed: false,
        merchantEdited: false,
        reviewState: "UNREVIEWED",
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
  details: {
    merchantName: string;
    categoryId: string;
    editType?: ImportReviewEditType;
  },
) {
  const merchantName = sanitizeTransactionNarration(details.merchantName) || "Payment";
  const editType = reviewEditTypeSchema.parse(details.editType ?? "CATEGORY_EDIT");
  return rows.map((row) => row.id === rowId
    ? importReviewRowSchema.parse({
        ...row,
        merchantName,
        categoryId: details.categoryId,
        categoryConfirmed: editType === "MERCHANT_EDIT" ? row.categoryConfirmed : true,
        merchantEdited: editType === "MERCHANT_EDIT" ? true : row.merchantEdited,
        reviewState: editType === "CONFIRM_SUGGESTION" ? "CONFIRMED_SUGGESTION" : "MANUALLY_REVIEWED",
        suggestionReason: editType === "CONFIRM_SUGGESTION"
          ? "Suggestion confirmed for this transient review."
          : "Manually reviewed in the current import review.",
      })
    : row);
}

export function applyCategoryToSameMerchant(rows: ImportReviewRow[], rowId: string) {
  const source = rows.find((row) => row.id === rowId);
  if (!source || !source.categoryConfirmed) return rows;
  const sourceKey = normalizeMerchantName(source.merchantName);

  return rows.map((row) => normalizeMerchantName(row.merchantName) === sourceKey
    ? importReviewRowSchema.parse({
        ...row,
        categoryId: source.categoryId,
        categoryConfirmed: true,
        reviewState: "APPLIED_TO_MATCH",
        suggestionReason: "Applied to the same cleaned merchant in this review.",
      })
    : row);
}

export function applyMerchantSuggestionsToRows(
  rows: ImportReviewRow[],
  merchantData: LocalMerchantData,
) {
  return rows.map((row) => {
    if (row.reviewState !== "UNREVIEWED") return row;
    const suggestion = suggestMerchantCategory(row.merchantName, merchantData);
    return importReviewRowSchema.parse({
      ...row,
      merchantName: suggestion.merchantName,
      categoryId: suggestion.categoryId,
      suggestionSource: suggestion.source,
      suggestionConfidence: suggestion.confidence,
      suggestionReason: suggestion.reason,
    });
  });
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
