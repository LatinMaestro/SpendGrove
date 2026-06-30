import { z } from "zod";
import { reviewedLoanRepaymentSchema } from "@/lib/loan-repayment-commit";

export const loanRepaymentArchiveSchema = z.object({
  isArchived: z.boolean(),
}).strict();

export type LoanRepaymentArchiveInput = z.infer<typeof loanRepaymentArchiveSchema>;

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
