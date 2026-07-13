export type LoanDisplayTransaction = {
  id: string;
  date: string;
  amountCents: number;
  type: "INCOME" | "EXPENSE";
  merchantName: string | null;
  categoryName: string | null;
};

export function propertyTransactionsForLoanView<T extends LoanDisplayTransaction>(
  manualPropertyTransactions: readonly T[],
  loanDerivedTransactions: readonly Pick<LoanDisplayTransaction, "id">[],
): T[] {
  const loanDerivedIds = new Set(loanDerivedTransactions.map((transaction) => transaction.id));
  return manualPropertyTransactions.filter((transaction) => !loanDerivedIds.has(transaction.id));
}
