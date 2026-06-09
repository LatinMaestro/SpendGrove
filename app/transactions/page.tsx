import Link from "next/link";
import { ArrowRight, ShieldCheck, WalletCards } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export default function TransactionsPage() {
  return (
    <AppShell>
      <section className="rounded-[2rem] border border-border bg-surface-base p-6 text-center shadow-soft" aria-labelledby="transactions-empty-heading">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-mint text-brand-green">
          <WalletCards aria-hidden="true" className="h-7 w-7" />
        </div>
        <p className="mt-4 text-sm font-semibold text-brand-teal">Transactions</p>
        <h2 id="transactions-empty-heading" className="mt-2 text-2xl font-bold text-brand-deepTeal">No transactions yet.</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-brand-deepTeal/75">
          There are no saved, imported or example transactions in this account. Manual transaction entry will be implemented in the next approved Phase 1 task.
        </p>
        <Link href="/onboarding" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
          Review privacy setup
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>

      <section className="mt-5 rounded-3xl border border-border bg-surface-mint p-5" aria-labelledby="transaction-trust-heading">
        <div className="flex items-start gap-3">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" />
          <div>
            <h2 id="transaction-trust-heading" className="font-bold text-brand-deepTeal">Clear about what is stored</h2>
            <p className="mt-1 text-sm leading-6 text-brand-deepTeal/75">
              This screen does not load a database, create a transaction or display synthetic financial activity. Future transaction changes will be explicit and user-controlled.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
