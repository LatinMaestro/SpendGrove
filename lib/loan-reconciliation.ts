export type ReconciliationCandidateMode = "SUGGESTED" | "MANUAL";
export type ReconciliationCandidateConfidence = "HIGH" | "MEDIUM" | "MANUAL";
export type ReconciliationReasonCode = "EXACT_AMOUNT_NEAR_DATE" | "ROUNDING_VARIANCE" | "EXACT_AMOUNT_DELAYED_DATE" | "MANUAL_OVERRIDE";

export type LoanReconciliationCandidate = {
  transactionId: string;
  transactionDate: string;
  transactionAmountCents: number;
  existingAllocationCents: number;
  amountVarianceCents: number;
  dateDifferenceDays: number;
  confidence: ReconciliationCandidateConfidence;
  reasonCode: ReconciliationReasonCode;
};

export function scoreReconciliationCandidate(input: {
  repaymentTotalCents: number;
  repaymentDate: string;
  transactionId: string;
  transactionDate: string;
  transactionAmountCents: number;
  existingAllocationCents?: number;
  mode: ReconciliationCandidateMode;
}): LoanReconciliationCandidate | null {
  const repaymentDate = new Date(`${input.repaymentDate}T00:00:00.000Z`);
  const transactionDate = new Date(`${input.transactionDate}T00:00:00.000Z`);
  if (Number.isNaN(repaymentDate.getTime()) || Number.isNaN(transactionDate.getTime())) return null;
  const dateDifferenceDays = Math.abs(Math.round((transactionDate.getTime() - repaymentDate.getTime()) / 86_400_000));
  const existingAllocationCents = Math.max(0, input.existingAllocationCents ?? 0);
  const combinedBreakdownCents = existingAllocationCents + input.repaymentTotalCents;
  const amountVarianceCents = Math.abs(input.transactionAmountCents) - combinedBreakdownCents;
  const absoluteVariance = Math.abs(amountVarianceCents);

  let confidence: ReconciliationCandidateConfidence | null = null;
  let reasonCode: ReconciliationReasonCode | null = null;
  if (absoluteVariance === 0 && dateDifferenceDays <= 1) {
    confidence = "HIGH";
    reasonCode = "EXACT_AMOUNT_NEAR_DATE";
  } else if (absoluteVariance <= 2 && dateDifferenceDays <= 3) {
    confidence = "MEDIUM";
    reasonCode = absoluteVariance === 0 ? "EXACT_AMOUNT_DELAYED_DATE" : "ROUNDING_VARIANCE";
  } else if (absoluteVariance === 0 && dateDifferenceDays <= 7) {
    confidence = "MEDIUM";
    reasonCode = "EXACT_AMOUNT_DELAYED_DATE";
  } else if (input.mode === "MANUAL" && absoluteVariance <= 100 && dateDifferenceDays <= 7) {
    confidence = "MANUAL";
    reasonCode = "MANUAL_OVERRIDE";
  }
  if (!confidence || !reasonCode) return null;

  return {
    transactionId: input.transactionId,
    transactionDate: input.transactionDate,
    transactionAmountCents: input.transactionAmountCents,
    existingAllocationCents,
    amountVarianceCents,
    dateDifferenceDays,
    confidence,
    reasonCode,
  };
}
