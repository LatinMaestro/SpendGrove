import { z } from "zod";
import type { MergeTargetReviewSelection } from "@/lib/import-duplicate-scoring";
import type { ImportReviewRow } from "@/lib/import-review";
import { nonZeroCentsSchema } from "@/lib/validation/money";
import { containsPrivateBankIdentifier } from "@/lib/validation/privacy";

const warningCodeSchema = z.string().trim().min(1).max(80).regex(/^[A-Z0-9_-]+$/);
const safeTextSchema = z.string().trim().min(1).max(120).refine(
  (value) => !containsPrivateBankIdentifier(value),
  "Private banking identifiers are not permitted in import commits.",
);
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const rowBase = {
  rowNumber: z.number().int().positive(),
  warningCodes: z.array(warningCodeSchema).max(20).default([]),
};

export const importCommitRowSchema = z.discriminatedUnion("action", [
  z.object({
    ...rowBase,
    action: z.literal("IMPORT"),
    date: dateOnlySchema,
    amountCents: nonZeroCentsSchema,
    description: safeTextSchema,
    merchantName: safeTextSchema,
    categoryId: z.string().trim().min(1).max(128),
  }).strict(),
  z.object({
    ...rowBase,
    action: z.literal("SKIP"),
  }).strict(),
  z.object({
    ...rowBase,
    action: z.literal("MERGE"),
    date: dateOnlySchema,
    amountCents: nonZeroCentsSchema,
    description: safeTextSchema,
    merchantName: safeTextSchema,
    categoryId: z.string().trim().min(1).max(128),
    targetTransactionId: z.string().trim().min(1).max(128),
  }).strict(),
]);

export const importCommitRequestSchema = z.object({
  requestId: z.string().uuid(),
  rows: z.array(importCommitRowSchema).min(1).max(5000),
  metadata: z.object({
    parsedRowCount: z.number().int().nonnegative().max(5000),
    privateFieldCount: z.number().int().nonnegative().max(100),
    detectedBankName: z.string().trim().min(1).max(120).optional(),
    hasHeader: z.boolean(),
    amountMode: z.enum(["SIGNED_AMOUNT", "DEBIT_CREDIT"]),
    detectedDateFormats: z.array(z.enum(["YYYY-MM-DD", "DD/MM/YYYY", "DD-MM-YYYY", "DD/MM/YY", "DD-MM-YY"])).max(5),
    warningCodes: z.array(warningCodeSchema).max(20),
  }).strict(),
}).strict().superRefine((request, context) => {
  const rowNumbers = new Set<number>();
  request.rows.forEach((row, index) => {
    if (rowNumbers.has(row.rowNumber)) {
      context.addIssue({ code: "custom", path: ["rows", index, "rowNumber"], message: "Each reviewed row must appear only once." });
    }
    rowNumbers.add(row.rowNumber);
  });
  if (request.metadata.parsedRowCount !== request.rows.length) {
    context.addIssue({ code: "custom", path: ["metadata", "parsedRowCount"], message: "Reviewed row count must match the parsed row count." });
  }
});

export type ImportCommitRequest = z.infer<typeof importCommitRequestSchema>;
export type ImportCommitRow = z.infer<typeof importCommitRowSchema>;

export type ImportCommitSummary = {
  batchId: string;
  totalCount: number;
  importedCount: number;
  skippedCount: number;
  mergedCount: number;
  warningCount: number;
  alreadyCommitted: boolean;
};

export function createImportCommitRequest(input: {
  requestId: string;
  rows: ImportReviewRow[];
  mergeSelections: Record<string, MergeTargetReviewSelection>;
  metadata: ImportCommitRequest["metadata"];
}) {
  return importCommitRequestSchema.parse({
    requestId: input.requestId,
    rows: input.rows.map((row) => {
      if (row.action === "SKIP") {
        return { rowNumber: row.rowNumber, action: "SKIP" as const, warningCodes: row.warningCodes };
      }
      if (!row.date || row.amountCents === null) {
        throw new Error(`Row ${row.rowNumber} needs a valid date and amount before it can be committed.`);
      }
      const reviewed = {
        rowNumber: row.rowNumber,
        action: row.action,
        date: row.date,
        amountCents: row.amountCents,
        description: row.description || row.merchantName || "Payment",
        merchantName: row.merchantName || row.description || "Payment",
        categoryId: row.categoryId,
        warningCodes: row.warningCodes,
      };
      if (row.action === "MERGE") {
        const selection = input.mergeSelections[row.id];
        if (!selection || selection.status !== "REVIEW_ONLY") {
          throw new Error(`Row ${row.rowNumber} needs an existing manual transaction selected as its merge target.`);
        }
        return { ...reviewed, action: "MERGE" as const, targetTransactionId: selection.targetTransactionId };
      }
      return { ...reviewed, action: "IMPORT" as const };
    }),
    metadata: input.metadata,
  });
}
