import { z } from "zod";

export const loanRepaymentArchiveSchema = z.object({
  isArchived: z.boolean(),
}).strict();

export type LoanRepaymentArchiveInput = z.infer<typeof loanRepaymentArchiveSchema>;

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
  linkedTransaction: SafeLinkedTransactionContext | null;
};
