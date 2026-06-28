import { z } from "zod";
import type { LoanCsvReviewRow } from "@/lib/loan-csv-review";

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid repayment date.");
const optionalCentsSchema = z.number().int().nonnegative().nullable();

export const reviewedLoanRepaymentSchema = z.object({
  repaymentDate: dateOnlySchema,
  totalPaymentCents: z.number().int().positive("A repayment total must be greater than zero."),
  principalCents: optionalCentsSchema,
  interestCents: optionalCentsSchema,
  feeCents: optionalCentsSchema,
  balanceAfterCents: optionalCentsSchema,
}).strict().superRefine((row, context) => {
  const components = [row.principalCents, row.interestCents, row.feeCents];
  const knownTotal = components.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  if (knownTotal > row.totalPaymentCents + 2) {
    context.addIssue({ code: "custom", message: "Repayment components cannot exceed the total payment." });
  }
  if (components.every((value) => value !== null) && Math.abs(knownTotal - row.totalPaymentCents) > 2) {
    context.addIssue({ code: "custom", message: "Complete repayment components must match the total within two cents." });
  }
});

export const loanRepaymentCommitRequestSchema = z.object({
  requestId: z.string().uuid(),
  loanAccountId: z.string().trim().min(1).max(128),
  reviewedRowCount: z.number().int().positive().max(5000),
  excludedRowCount: z.number().int().nonnegative().max(5000),
  privateFieldCount: z.number().int().nonnegative().max(100),
  rows: z.array(reviewedLoanRepaymentSchema).min(1).max(5000),
}).strict().superRefine((request, context) => {
  if (request.rows.length + request.excludedRowCount !== request.reviewedRowCount) {
    context.addIssue({ code: "custom", message: "Saved and excluded repayment counts must match the reviewed rows." });
  }
});

export type LoanRepaymentCommitRequest = z.infer<typeof loanRepaymentCommitRequestSchema>;

export type LoanRepaymentCommitSummary = {
  batchId: string;
  totalCount: number;
  savedCount: number;
  excludedCount: number;
  alreadyCommitted: boolean;
};

export type SafeLoanImportHistoryEntry = {
  completedAt: string;
  reviewedCount: number;
  savedCount: number;
  excludedCount: number;
};

export function isCommittableLoanRepaymentRow(row: LoanCsvReviewRow) {
  const isRepayment = row.classification === null || row.classification === "REPAYMENT";
  return isRepayment
    && row.date !== null
    && row.totalPaymentCents !== null
    && row.totalPaymentCents > 0
    && row.warningCodes.length === 0;
}

export function createLoanRepaymentCommitRequest(input: {
  requestId: string;
  loanAccountId: string;
  rows: LoanCsvReviewRow[];
  selectedRowNumbers: Set<number>;
  privateFieldCount: number;
}) {
  const selectedRows = input.rows.filter((row) => input.selectedRowNumbers.has(row.rowNumber));
  if (selectedRows.some((row) => !isCommittableLoanRepaymentRow(row))) {
    throw new Error("Only clear repayment breakdowns without warnings can be saved.");
  }
  return loanRepaymentCommitRequestSchema.parse({
    requestId: input.requestId,
    loanAccountId: input.loanAccountId,
    reviewedRowCount: input.rows.length,
    excludedRowCount: input.rows.length - selectedRows.length,
    privateFieldCount: input.privateFieldCount,
    rows: selectedRows.map((row) => ({
      repaymentDate: row.date,
      totalPaymentCents: row.totalPaymentCents,
      principalCents: row.principalCents,
      interestCents: row.interestCents,
      feeCents: row.feeCents,
      balanceAfterCents: row.balanceAfterCents,
    })),
  });
}
