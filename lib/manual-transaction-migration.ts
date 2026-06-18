import { z } from "zod";
import { getManualCategory } from "@/lib/manual-categories";
import { containsPrivateBankIdentifier } from "@/lib/validation/privacy";

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const safeManualTextSchema = z.string().trim().max(300).refine(
  (value) => !containsPrivateBankIdentifier(value),
  "Private banking identifiers are not permitted in manual transaction migration.",
);

export const manualTransactionMigrationItemSchema = z.object({
  id: z.string().trim().min(1).max(200),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  source: z.literal("MANUAL"),
  amountCents: z.number().int().safe().refine((value) => value !== 0),
  date: dateOnlySchema,
  description: safeManualTextSchema.refine((value) => value.length > 0, "Enter a description."),
  categoryId: z.string().trim().min(1).max(128),
  notes: safeManualTextSchema,
  csvMatchHint: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
}).strict().superRefine((transaction, context) => {
  const category = getManualCategory(transaction.categoryId);
  if (!category || category.type !== transaction.type) {
    context.addIssue({ code: "custom", path: ["categoryId"], message: "Choose an approved category that matches the transaction type." });
  }
  if (transaction.type === "EXPENSE" && transaction.amountCents >= 0) {
    context.addIssue({ code: "custom", path: ["amountCents"], message: "Expense amounts must be negative integer cents." });
  }
  if (transaction.type === "INCOME" && transaction.amountCents <= 0) {
    context.addIssue({ code: "custom", path: ["amountCents"], message: "Income amounts must be positive integer cents." });
  }
});

export const manualTransactionMigrationRequestSchema = z.object({
  transactions: z.array(manualTransactionMigrationItemSchema).max(500),
}).strict();

export type ManualTransactionMigrationItem = z.infer<typeof manualTransactionMigrationItemSchema>;
export type ManualTransactionMigrationRequest = z.infer<typeof manualTransactionMigrationRequestSchema>;
