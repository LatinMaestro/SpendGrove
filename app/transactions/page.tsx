import { AppShell } from "@/components/app-shell";
import { FeatureCard } from "@/components/feature-card";
import { formatAudFromCents } from "@/lib/money";

const demoTransactions = [
  { merchant: "Woolworths", category: "Groceries", amountCents: -8425, date: "8 June 2026" },
  { merchant: "Translink", category: "Transport", amountCents: -620, date: "7 June 2026" },
  { merchant: "Salary payment", category: "Income", amountCents: 245000, date: "6 June 2026" },
];

export default function TransactionsPage() {
  return (
    <AppShell>
      <FeatureCard title="Manual transactions" body="Create, edit, delete and later match transactions against CSV imports. CRUD wiring is the next Phase 1 implementation layer.">
        <button className="min-h-12 rounded-full bg-brand-green px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal">
          Add transaction
        </button>
      </FeatureCard>

      <section className="mt-5 space-y-3" aria-label="Synthetic transaction examples">
        {demoTransactions.map((transaction) => (
          <article key={`${transaction.merchant}-${transaction.date}`} className="rounded-3xl border border-border bg-surface-base p-4 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-brand-deepTeal">{transaction.merchant}</h2>
                <p className="mt-1 text-sm text-brand-deepTeal/70">{transaction.date} · {transaction.category}</p>
              </div>
              <p className="font-bold text-brand-deepTeal">{formatAudFromCents(transaction.amountCents)}</p>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
