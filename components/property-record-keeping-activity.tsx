"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, ChevronDown, ChevronUp, Landmark, X } from "lucide-react";
import { PropertyRecordReview } from "@/components/property-record-review";
import { propertyTransactionsForLoanView } from "@/lib/loan-display";

type PropertyActivityTransaction = {
  id: string;
  date: string;
  amountCents: number;
  type: "INCOME" | "EXPENSE";
  merchantName: string | null;
  categoryName: string | null;
};

type PropertyActivity = {
  property: { id: string; nickname: string; usage: string; isArchived: boolean };
  transactions: PropertyActivityTransaction[];
  loanTransactions: Array<PropertyActivityTransaction & {
    loanAccounts: Array<{ id: string; nickname: string }>;
  }>;
};

function money(cents: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Math.abs(cents) / 100);
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${date}T00:00:00Z`));
}

function TransactionRow({ transaction }: Readonly<{ transaction: PropertyActivityTransaction }>) {
  const title = transaction.categoryName ?? transaction.merchantName ?? "Everyday transaction";
  return (
    <li className="rounded-xl border border-border p-3 text-xs text-brand-deepTeal">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <strong className="block truncate">{title}</strong>
          <span className="mt-1 block text-brand-deepTeal/60">{dateLabel(transaction.date)} · {transaction.type === "INCOME" ? "Money in" : "Money out"}</span>
        </span>
        <strong className="shrink-0">{transaction.type === "INCOME" ? "+" : "-"}{money(transaction.amountCents)}</strong>
      </div>
    </li>
  );
}

export function PropertyRecordKeepingActivity({
  propertyId,
  variant = "full",
}: Readonly<{
  propertyId: string;
  variant?: "full" | "loan-detail";
}>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activity, setActivity] = useState<PropertyActivity | null>(null);
  const [error, setError] = useState("");
  const [showAllPropertyTransactions, setShowAllPropertyTransactions] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const loadActivity = useCallback(async () => {
    if (activity || isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/account/properties/${encodeURIComponent(propertyId)}/activity`, {
        method: "GET",
        cache: "no-store",
      });
      const result = await response.json() as { ok: boolean; activity?: PropertyActivity; error?: string };
      if (!response.ok || !result.ok || !result.activity) {
        setError(result.error ?? "Property records could not be loaded safely.");
      } else {
        setActivity(result.activity);
      }
    } catch {
      setError("Property records could not be loaded safely.");
    } finally {
      setIsLoading(false);
    }
  }, [activity, isLoading, propertyId]);

  useEffect(() => {
    if (variant === "loan-detail") void loadActivity();
  }, [loadActivity, variant]);

  async function toggle() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    await loadActivity();
  }

  if (variant === "loan-detail") {
    const propertyTransactions = activity
      ? propertyTransactionsForLoanView(activity.transactions, activity.loanTransactions)
      : [];
    const visibleTransactions = showAllPropertyTransactions ? propertyTransactions : propertyTransactions.slice(0, 3);

    return (
      <div className="mt-4 space-y-4">
        <section className="border-t border-border pt-4" aria-labelledby={`property-transactions-${propertyId}`}>
          <h4 id={`property-transactions-${propertyId}`} className="text-sm font-bold text-brand-deepTeal">Property transactions</h4>
          {isLoading && <p className="mt-3 text-sm font-semibold text-brand-deepTeal/65">Loading transactions...</p>}
          {error && <p role="alert" className="mt-3 rounded-xl bg-danger-red/10 p-3 text-xs font-semibold text-danger-red">{error}</p>}
          {activity && propertyTransactions.length === 0 && (
            <p className="mt-3 rounded-xl bg-surface-mint p-3 text-xs text-brand-deepTeal/65">No other transactions are linked to this Property.</p>
          )}
          {visibleTransactions.length > 0 && (
            <ul className="mt-3 space-y-2">
              {visibleTransactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)}
            </ul>
          )}
          {propertyTransactions.length > 3 && (
            <button type="button" onClick={() => setShowAllPropertyTransactions((current) => !current)} className="mt-3 min-h-10 w-full rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
              {showAllPropertyTransactions ? "Show latest three" : `View all property transactions (${propertyTransactions.length})`}
            </button>
          )}
        </section>

        <div className="border-t border-border pt-4">
          <button type="button" onClick={() => setIsReportOpen(true)} className="min-h-11 rounded-full border border-border px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">View property report</button>
        </div>

        {isReportOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-deepTeal/55 backdrop-blur-sm sm:items-center sm:p-6">
            <section role="dialog" aria-modal="true" aria-labelledby={`property-report-title-${propertyId}`} onKeyDown={(event) => { if (event.key === "Escape") setIsReportOpen(false); }} className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] bg-surface-base p-5 shadow-2xl sm:rounded-[2rem] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-brand-teal">Property records</p>
                  <h3 id={`property-report-title-${propertyId}`} className="mt-1 text-2xl font-bold text-brand-deepTeal">Property report</h3>
                  <p className="mt-2 text-xs leading-5 text-brand-deepTeal/65">Record keeping only - not tax advice.</p>
                </div>
                <button type="button" autoFocus onClick={() => setIsReportOpen(false)} aria-label="Close property report" className="min-h-11 min-w-11 rounded-full border border-border p-3 text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4">
                <PropertyRecordReview propertyId={propertyId} />
              </div>
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-3">
      <button type="button" onClick={() => void toggle()} aria-expanded={isOpen} className="flex min-h-10 w-full items-center justify-between gap-3 text-left text-sm font-bold text-brand-deepTeal">
        <span className="flex items-center gap-2"><Building2 aria-hidden="true" className="h-4 w-4 text-brand-teal" /> Property records</span>
        {isOpen ? <ChevronUp aria-hidden="true" className="h-4 w-4" /> : <ChevronDown aria-hidden="true" className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs leading-5 text-brand-deepTeal/65">These are your original everyday transactions. Nothing is counted twice.</p>
          {isLoading && <p className="mt-3 text-sm font-semibold text-brand-deepTeal/65">Loading activity...</p>}
          {error && <p role="alert" className="mt-3 rounded-xl bg-danger-red/10 p-3 text-xs font-semibold text-danger-red">{error}</p>}
          {activity && (
            <div className="mt-3 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">Linked through loan repayments</h4>
                <p className="mt-2 text-xs leading-5 text-brand-deepTeal/65">Shown here because the loan belongs to this property.</p>
                {activity.loanTransactions.length === 0 ? (
                  <p className="mt-2 rounded-xl bg-surface-mint p-3 text-xs text-brand-deepTeal/65">No active loan repayment transactions are connected yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {activity.loanTransactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)}
                  </ul>
                )}
              </div>

              <div className="border-t border-border pt-3">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-teal"><Landmark aria-hidden="true" className="h-4 w-4" /> Other linked transactions</h4>
                <p className="mt-2 text-xs leading-5 text-brand-deepTeal/65">Transactions you chose to link to this property.</p>
                {activity.transactions.length === 0 ? (
                  <p className="mt-2 rounded-xl bg-surface-mint p-3 text-xs text-brand-deepTeal/65">No transactions have been manually linked to this Property. Loan repayment connections above are unaffected.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {activity.transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)}
                  </ul>
                )}
              </div>
              <p className="border-t border-border pt-3 text-xs leading-5 text-brand-deepTeal/65">Linking does not change the transaction, category or amount. Record keeping only - not tax advice.</p>
              <PropertyRecordReview propertyId={propertyId} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
