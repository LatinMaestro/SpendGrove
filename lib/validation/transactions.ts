import { z } from "zod";
import { nonZeroCentsSchema } from "@/lib/validation/money";
import {
  splitRoleSchema,
  transactionSourceSchema,
  transactionStatusSchema,
  transactionTypeSchema,
} from "@/lib/validation/enums";
import { normalizeSafeText } from "@/lib/validation/privacy";

const optionalIdSchema = z.string().min(1).optional();
const transactionDescriptionSchema = z.string().trim().min(1).max(300).transform(normalizeSafeText);
const optionalSafeTextSchema = z.string().trim().max(300).transform(normalizeSafeText).optional();

const transactionCreateFields = z.object({
  userId: z.string().min(1),
  categoryId: optionalIdSchema,
  importBatchId: optionalIdSchema,
  merchantProfileId: optionalIdSchema,
  type: transactionTypeSchema,
  source: transactionSourceSchema,
  status: transactionStatusSchema.default("ACTIVE"),
  splitRole: splitRoleSchema.default("NONE"),
  parentTransactionId: optionalIdSchema,
  amountCents: nonZeroCentsSchema,
  date: z.coerce.date(),
  description: transactionDescriptionSchema,
  importedDescriptionSanitized: optionalSafeTextSchema,
  merchantName: optionalSafeTextSchema,
  notes: optionalSafeTextSchema,
  csvMatchHint: z.boolean().default(false),
  importFingerprint: z.string().trim().max(160).optional(),
  duplicateKey: z.string().trim().max(160).optional(),
}).strict();

function validateSplitRelationship(
  value: { splitRole?: "NONE" | "PARENT" | "CHILD"; parentTransactionId?: string | null },
  context: z.RefinementCtx,
) {
  if (value.splitRole === "PARENT" && value.parentTransactionId) {
    context.addIssue({ code: "custom", path: ["parentTransactionId"], message: "Split parent transactions cannot also have a parent transaction." });
  }

  if (value.splitRole === "CHILD" && !value.parentTransactionId) {
    context.addIssue({ code: "custom", path: ["parentTransactionId"], message: "Split child transactions require a parent transaction." });
  }
}

export const transactionCreateSchema = transactionCreateFields.superRefine((value, context) => {
  validateSplitRelationship(value, context);

  if (value.source === "IMPORTED" && !value.importBatchId) {
    context.addIssue({ code: "custom", path: ["importBatchId"], message: "Imported transactions require an import batch." });
  }

  if (value.source === "MANUAL" && value.importBatchId) {
    context.addIssue({ code: "custom", path: ["importBatchId"], message: "Manual transactions preserve their source and are linked to merge activity through import rows and audit events." });
  }
});

export const transactionUpdateSchema = z.object({
  categoryId: z.string().min(1).nullable().optional(),
  merchantProfileId: z.string().min(1).nullable().optional(),
  type: transactionTypeSchema.optional(),
  status: transactionStatusSchema.optional(),
  splitRole: splitRoleSchema.optional(),
  parentTransactionId: z.string().min(1).nullable().optional(),
  amountCents: nonZeroCentsSchema.optional(),
  date: z.coerce.date().optional(),
  description: transactionDescriptionSchema.optional(),
  importedDescriptionSanitized: z.string().trim().max(300).transform(normalizeSafeText).nullable().optional(),
  merchantName: z.string().trim().max(300).transform(normalizeSafeText).nullable().optional(),
  notes: z.string().trim().max(300).transform(normalizeSafeText).nullable().optional(),
  csvMatchHint: z.boolean().optional(),
  importFingerprint: z.string().trim().max(160).nullable().optional(),
  duplicateKey: z.string().trim().max(160).nullable().optional(),
  reviewedAt: z.coerce.date().nullable().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
}).strict().superRefine(validateSplitRelationship);

export const transactionTotalsFilter = {
  deletedAt: null,
  splitRole: { not: "PARENT" },
} as const;
