import { z } from "zod";
import { centsSchema } from "@/lib/validation/money";
import {
  importBatchStatusSchema,
  importRowActionSchema,
  importRowStatusSchema,
  importTypeSchema,
} from "@/lib/validation/enums";
import { assertSafeJson, normalizeSafeText } from "@/lib/validation/privacy";

const safeFileNameSchema = z.string().trim().max(160).regex(/^[\w .()\-]+$/).transform(normalizeSafeText).optional();
const fileNameHashSchema = z.string().trim().min(16).max(128).optional();
const safeHeaderSchema = z.string().trim().max(120).transform(normalizeSafeText);

export const importBatchMetadataSchema = z.object({
  userId: z.string().min(1),
  type: importTypeSchema.default("TRANSACTION_CSV"),
  status: importBatchStatusSchema.default("CREATED"),
  bankImportProfileId: z.string().min(1).optional(),
  safeFileName: safeFileNameSchema,
  originalFileNameRedacted: safeFileNameSchema,
  fileNameHash: fileNameHashSchema,
  fileSizeBytes: z.number().int().nonnegative().optional(),
  rowCount: z.number().int().nonnegative().default(0),
  parsedRowCount: z.number().int().nonnegative().default(0),
  privateFieldCount: z.number().int().nonnegative().default(0),
  detectedBankName: z.string().trim().max(120).transform(normalizeSafeText).optional(),
  detectedAccountType: z.string().trim().max(80).transform(normalizeSafeText).optional(),
  mappingSummary: z.unknown().optional().transform((value) => value === undefined ? undefined : assertSafeJson(value, "mappingSummary")),
  excludedPrivateHeaders: z.array(safeHeaderSchema).default([]),
  warningCodes: z.array(z.string().trim().max(80)).default([]),
});

export const importRowReviewSchema = z.object({
  userId: z.string().min(1),
  importBatchId: z.string().min(1),
  rowNumber: z.number().int().positive(),
  action: importRowActionSchema.default("UNDECIDED"),
  status: importRowStatusSchema.default("NEEDS_REVIEW"),
  mappedDate: z.coerce.date().optional(),
  amountCents: centsSchema.optional(),
  description: z.string().trim().max(300).transform(normalizeSafeText).optional(),
  merchantName: z.string().trim().max(160).transform(normalizeSafeText).optional(),
  categoryId: z.string().min(1).optional(),
  matchedTransactionId: z.string().min(1).optional(),
  committedTransactionId: z.string().min(1).optional(),
  warningCodes: z.unknown().optional().transform((value) => value === undefined ? undefined : assertSafeJson(value, "warningCodes")),
  metadata: z.unknown().optional().transform((value) => value === undefined ? undefined : assertSafeJson(value, "metadata")),
}).superRefine((value, context) => {
  if (value.action === "IMPORT") {
    if (!value.mappedDate) context.addIssue({ code: "custom", path: ["mappedDate"], message: "Import rows require a mapped date before import." });
    if (value.amountCents === undefined) context.addIssue({ code: "custom", path: ["amountCents"], message: "Import rows require an amount before import." });
    if (!value.description && !value.merchantName) context.addIssue({ code: "custom", path: ["description"], message: "Import rows require a safe description or merchant before import." });
  }

  if (value.action === "MERGE" && !value.matchedTransactionId) {
    context.addIssue({ code: "custom", path: ["matchedTransactionId"], message: "Merge rows require a matched transaction." });
  }
});
