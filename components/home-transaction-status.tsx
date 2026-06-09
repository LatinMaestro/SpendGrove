"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, WalletCards } from "lucide-react";
import { listActiveManualTransactions } from "@/lib/manual-transactions";
import { loadManualTransactionsFromStorage } from "@/lib/manual-transaction-storage";

export function HomeTransactionStatus() {
  const [activeCount, setActiveCount] = useState<number | null>(null);

  useEffect(() => {
    const loaded = loadManualTransactionsFromStorage(window.localStorage);
    setActiveCount(listActiveManualTransactions(loaded.transactions).length);
  }, []);

  const hasTransactions = activeCount !== null && activeCount > 0;

  return (
    <>
      <section className="mt-5 rounded-[2rem] border border-border bg-surface-base p-6 shadow-soft" aria-labelledby="local-finance-heading">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-surface-mint p-3 text-brand-green">
            <WalletCards aria-hidden="true" className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-teal">Browser-local transactions</p>
            <h2 id="local-finance-heading" className="mt-1 text-2xl font-bold text-brand-deepTeal">
              {hasTransactions ? `${activeCount} active manual transaction${activeCount === 1 ? "" : "s"}.` : "No transactions or balances yet."}
            </h2>
            <p className="mt-2 text-sm leading-6 text-brand-deepTeal/75">
              {hasTransactions
                ? "These are entries you created in this browser. They are not synced to a cloud account or production database."
                : "This is a genuine empty state—not a demo balance. Financial information appears only after you deliberately add it."}
            </p>
            <Link href="/transactions" className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-green">
              <Plus aria-hidden="true" className="h-4 w-4" />
              {hasTransactions ? "Manage transactions" : "Add first transaction"}
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Financial overview status">
        <div className="rounded-3xl border border-border bg-surface-base p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-teal">Transactions</p>
          <p className="mt-2 text-lg font-bold text-brand-deepTeal">{activeCount === null ? "Checking…" : activeCount === 0 ? "None yet" : `${activeCount} local`}</p>
        </div>
        <div className="rounded-3xl border border-border bg-surface-base p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-teal">Needs review</p>
          <p className="mt-2 text-lg font-bold text-brand-deepTeal">Nothing waiting</p>
        </div>
        <div className="rounded-3xl border border-border bg-surface-base p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-teal">CSV imports</p>
          <p className="mt-2 text-lg font-bold text-brand-deepTeal">None yet</p>
        </div>
      </section>
    </>
  );
}
