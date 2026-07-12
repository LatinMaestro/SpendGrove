"use client";

import { useState } from "react";
import { Building2, ChevronDown, ChevronUp, Landmark } from "lucide-react";
import { PropertyRecordReview } from "@/components/property-record-review";

type PropertyActivity = {
  property: { id: string; nickname: string; usage: string; isArchived: boolean };
  transactions: Array<{
    id: string;
    date: string;
    amountCents: number;
    type: "INCOME" | "EXPENSE";
    merchantName: string | null;
    categoryName: string | null;
  }>;
  loanTransactions: Array<{
    id: string;
    date: string;
    amountCents: number;
    type: "INCOME" | "EXPENSE";
    merchantName: string | null;
    categoryName: string | null;
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

export function PropertyRecordKeepingActivity({ propertyId }: Readonly<{ propertyId: string }>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activity, setActivity] = useState<PropertyActivity | null>(null);
  const [error, setError] = useState("");

  async function toggle() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
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
                    {activity.loanTransactions.map((transaction) => (
                      <li key={transaction.id} className="rounded-xl bg-surface-mint p-3 text-xs text-brand-deepTeal">
                        <div className="flex items-start justify-between gap-3">
                          <span><strong className="block">{transaction.merchantName ?? "Everyday transaction"}</strong><span className="mt-1 block text-brand-deepTeal/60">{dateLabel(transaction.date)}{transaction.categoryName ? ` - ${transaction.categoryName}` : ""}</span><span className="mt-1 block text-brand-teal">Connected via {transaction.loanAccounts.map((loan) => loan.nickname).join(", ")}</span></span>
                          <strong>{transaction.type === "INCOME" ? "+" : "-"}{money(transaction.amountCents)}</strong>
                        </div>
                      </li>
                    ))}
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
                    {activity.transactions.map((transaction) => (
                      <li key={transaction.id} className="rounded-xl border border-border p-3 text-xs text-brand-deepTeal">
                        <div className="flex items-start justify-between gap-3">
                          <span><strong className="block">{transaction.merchantName ?? "Everyday transaction"}</strong><span className="mt-1 block text-brand-deepTeal/60">{dateLabel(transaction.date)}{transaction.categoryName ? ` - ${transaction.categoryName}` : ""}</span></span>
                          <strong>{transaction.type === "INCOME" ? "+" : "-"}{money(transaction.amountCents)}</strong>
                        </div>
                      </li>
                    ))}
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
