import { z } from "zod";
import { nonZeroCentsSchema } from "@/lib/validation/money";
import {
  splitRoleSchema,
  transactionSourceSchema,
  transactionStatusSchema,
  transactionTypeSchema,
} from "@/lib/validation/enums";
import { normalizeSafeText } from "@/lib/validation/privacy";

const transactionDescriptionSchema = z.string().trim().min(1).max(300).transform(normalizeSafeText);
const optionalSafeTextSchema = z.string().trim().max(300).transform(normalizeSafeText).optional();

export const transactionCreateSchema = z.object({
  userId: z.string().min(1),
  categoryId: z.string().min(1).optional(),
  importBatchId: z.string().min(1).optional(),
  merchantProfileId: z.string().min(1).optional(),
  type: transactionTypeSchema,
  source: transactionSourceSchema,
  status: transactionStatusSchema.default("ACTIVE"),
  splitRole: splitRoleSchema.default("NONE"),
  parentTransactionId: z.string().min(1).optional(),
  amountCents: nonZeroCentsSchema,
  date: z.coerce.date(),
  description: transactionDescriptionSchema,
  importedDescriptionSanitized: optionalSafeTextSchema,
  merchantName: optionalSafeTextSchema,
  notes: optionalSafeTextSchema,
  csvMatchHint: z.boolean().default(false),
  importFingerprint: z.string().trim().max(160).optional(),
  duplicateKey: z.string().trim().max(160).optional(),
}).superRefine((value, context) => {
  if (value.splitRole === "PARENT" && value.parentTransactionId) {
    context.addIssue({ code: "custom", path: ["parentTransactionId"], message: "Split parent transactions cannot also have a parent transaction." });
  }

  if (value.splitRole === "CHILD" && !value.parentTransactionId) {
    context.addIssue({ code: "custom", path: ["parentTransactionId"], message: "Split child transactions require a parent transaction." });
  }
});

export const transactionUpdateSchema = transactionCreateSchema
  .omit({ userId: true, source: true })
  .partial()
  .extend({
    deletedAt: z.date().nullable().optional(),
  });

export const transactionTotalsFilter = {
  deletedAt: null,
  splitRole: { not: "PARENT" },
} as const;
