export type ComparableLoanRepayment = {
  repaymentDate: string;
  totalPaymentCents: number;
  principalCents: number | null;
  interestCents: number | null;
  feeCents: number | null;
  balanceAfterCents: number | null;
};

export type LoanRepaymentDuplicateSignal = {
  reviewRowNumber: number;
  classification: "LIKELY_DUPLICATE" | "POSSIBLE_OVERLAP";
  reasonCode: "EXACT_STRUCTURED_MATCH" | "SAME_DATE_AND_TOTAL";
};

function hasSameStructuredTuple(left: ComparableLoanRepayment, right: ComparableLoanRepayment) {
  return left.repaymentDate === right.repaymentDate
    && left.totalPaymentCents === right.totalPaymentCents
    && left.principalCents === right.principalCents
    && left.interestCents === right.interestCents
    && left.feeCents === right.feeCents
    && left.balanceAfterCents === right.balanceAfterCents;
}

export function classifyLoanRepaymentDuplicate(
  row: ComparableLoanRepayment,
  candidates: readonly ComparableLoanRepayment[],
) {
  if (candidates.some((candidate) => hasSameStructuredTuple(row, candidate))) {
    return { classification: "LIKELY_DUPLICATE", reasonCode: "EXACT_STRUCTURED_MATCH" } as const;
  }
  if (candidates.some((candidate) =>
    row.repaymentDate === candidate.repaymentDate
    && row.totalPaymentCents === candidate.totalPaymentCents
  )) {
    return { classification: "POSSIBLE_OVERLAP", reasonCode: "SAME_DATE_AND_TOTAL" } as const;
  }
  return null;
}

export function assessLoanRepaymentDuplicates<T extends ComparableLoanRepayment & { reviewRowNumber: number }>(
  rows: readonly T[],
  existingRepayments: readonly ComparableLoanRepayment[],
) {
  const earlierRows: ComparableLoanRepayment[] = [];
  return rows.flatMap((row): LoanRepaymentDuplicateSignal[] => {
    const signal = classifyLoanRepaymentDuplicate(row, [...existingRepayments, ...earlierRows]);
    earlierRows.push(row);
    return signal ? [{ reviewRowNumber: row.reviewRowNumber, ...signal }] : [];
  });
}
