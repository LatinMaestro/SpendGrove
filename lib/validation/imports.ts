import { z } from "zod";
import { centsSchema } from "@/lib/validation/money";
import {
  importBatchStatusSchema,
  importRowActionSchema,
  importRowStatusSchema,
  importTypeSchema,
} from "@/lib/validation/enums";
import { assertSafeJson, normalizeSafeText } from "@/lib/validation/privacy";

const safeFileNameSchema = z.string()
  .trim()
  .max(160)
  .regex(/^[\w .()\-]+$/)
  .transform(normalizeSafeText)
  .optional();
const fileNameHashSchema = z.string().trim().regex(/^[a-f0-9]{32,128}$/i).optional();
const safeHeaderSchema = z.string().trim().max(120).transform(normalizeSafeText);
const warningCodeSchema = z.string().trim().min(1).max(80).regex(/^[A-Z0-9_\-]+$/i);
const optionalSafeDescriptionSchema = z.string().trim().min(1).max(300).transform(normalizeSafeText).optional();

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
  importedCount: z.number().int().nonnegative().default(0),
  skippedCount: z.number().int().nonnegative().default(0),
  mergedCount: z.number().int().nonnegative().default(0),
  detectedBankName: z.string().trim().max(120).transform(normalizeSafeText).optional(),
  detectedAccountType: z.string().trim().max(80).transform(normalizeSafeText).optional(),
  mappingSummary: z.unknown().optional().transform((value) => value === undefined ? undefined : assertSafeJson(value, "mappingSummary")),
  excludedPrivateHeaders: z.array(safeHeaderSchema).default([]),
  warningCodes: z.array(warningCodeSchema).default([]),
}).strict();

const importRowReviewFields = z.object({
  userId: z.string().min(1),
  importBatchId: z.string().min(1),
  rowNumber: z.number().int().positive(),
  action: importRowActionSchema.default("UNDECIDED"),
  status: importRowStatusSchema.default("NEEDS_REVIEW"),
  mappedDate: z.coerce.date().optional(),
  amountCents: centsSchema.optional(),
  description: optionalSafeDescriptionSchema,
  merchantName: z.string().trim().min(1).max(160).transform(normalizeSafeText).optional(),
  categoryId: z.string().min(1).optional(),
  matchedTransactionId: z.string().min(1).optional(),
  committedTransactionId: z.string().min(1).optional(),
  warningCodes: z.array(warningCodeSchema).default([]),
  metadata: z.unknown().optional().transform((value) => value === undefined ? undefined : assertSafeJson(value, "metadata")),
}).strict();

function validateImportRowAction(
  value: {
    action?: "UNDECIDED" | "IMPORT" | "SKIP" | "MERGE";
    mappedDate?: Date;
    amountCents?: number;
    description?: string;
    merchantName?: string | null;
    matchedTransactionId?: string | null;
  },
  context: z.RefinementCtx,
) {
  if (value.action === "IMPORT") {
    if (!value.mappedDate) context.addIssue({ code: "custom", path: ["mappedDate"], message: "Import rows require a mapped date before import." });
    if (value.amountCents === undefined) context.addIssue({ code: "custom", path: ["amountCents"], message: "Import rows require an amount before import." });
    if (!value.description && !value.merchantName) context.addIssue({ code: "custom", path: ["description"], message: "Import rows require a safe description or merchant before import." });
  }

  if (value.action === "MERGE" && !value.matchedTransactionId) {
    context.addIssue({ code: "custom", path: ["matchedTransactionId"], message: "Merge rows require a matched transaction." });
  }
}

export const importRowReviewSchema = importRowReviewFields.superRefine(validateImportRowAction);

export const importRowActionUpdateSchema = z.object({
  action: importRowActionSchema.optional(),
  status: importRowStatusSchema.optional(),
  mappedDate: z.coerce.date().optional(),
  amountCents: centsSchema.optional(),
  description: optionalSafeDescriptionSchema,
  merchantName: z.string().trim().min(1).max(160).transform(normalizeSafeText).nullable().optional(),
  categoryId: z.string().min(1).nullable().optional(),
  matchedTransactionId: z.string().min(1).nullable().optional(),
  committedTransactionId: z.string().min(1).nullable().optional(),
  warningCodes: z.array(warningCodeSchema).optional(),
  metadata: z.unknown().optional().transform((value) => value === undefined ? undefined : assertSafeJson(value, "metadata")),
}).strict().superRefine(validateImportRowAction);
