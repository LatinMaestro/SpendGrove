import { z } from "zod";
import { reviewedLoanRepaymentSchema } from "@/lib/loan-repayment-commit";

export const loanRepaymentArchiveSchema = z.object({
  isArchived: z.boolean(),
}).strict();

export type LoanRepaymentArchiveInput = z.infer<typeof loanRepaymentArchiveSchema>;

const loanRepaymentBulkArchiveSelectionSchema = z.object({
  repaymentId: z.string().trim().min(1).max(128),
  expectedUpdatedAt: z.string().datetime({ message: "Refresh repayment history before continuing." }),
}).strict();

export const loanRepaymentBulkArchiveSchema = z.object({
  isArchived: z.boolean(),
  confirmed: z.literal(true),
  repayments: z.array(loanRepaymentBulkArchiveSelectionSchema).min(1).max(100),
}).strict().superRefine((input, context) => {
  const ids = new Set<string>();
  input.repayments.forEach((selection, index) => {
    if (ids.has(selection.repaymentId)) {
      context.addIssue({ code: "custom", path: ["repayments", index, "repaymentId"], message: "Choose each repayment only once." });
    }
    ids.add(selection.repaymentId);
  });
});

export type LoanRepaymentBulkArchiveInput = z.infer<typeof loanRepaymentBulkArchiveSchema>;

export type LoanRepaymentBulkArchiveSummary = {
  requestedCount: number;
  changedCount: number;
  skippedCount: number;
  isArchived: boolean;
};

export const loanRepaymentCorrectionSchema = z.object({
  expectedUpdatedAt: z.string().datetime({ message: "Refresh this repayment before editing it." }),
  repayment: reviewedLoanRepaymentSchema,
}).strict();

export type LoanRepaymentCorrectionInput = z.infer<typeof loanRepaymentCorrectionSchema>;

export type SafeLinkedTransactionContext = {
  transactionId: string;
  date: string;
  amountCents: number;
};

export type SafeLoanRepayment = {
  id: string;
  loanAccountId: string;
  repaymentDate: string;
  totalPaymentCents: number;
  principalCents: number | null;
  interestCents: number | null;
  feeCents: number | null;
  balanceAfterCents: number | null;
  source: "MANUAL" | "LOAN_CSV";
  reconciliationStatus: "UNMATCHED" | "NEEDS_REVIEW" | "LINKED";
  isArchived: boolean;
  updatedAt: string;
  linkedTransaction: SafeLinkedTransactionContext | null;
};
