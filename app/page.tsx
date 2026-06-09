import Link from "next/link";
import { FileUp, ShieldCheck, WalletCards } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { FeatureCard } from "@/components/feature-card";
import { OnboardingPrompt } from "@/components/onboarding-prompt";

const emptySnapshotItems = [
  { label: "Transactions", value: "None yet" },
  { label: "Needs review", value: "Nothing waiting" },
  { label: "CSV imports", value: "None yet" },
];

export default function HomePage() {
  return (
    <AppShell>
      <OnboardingPrompt />

      <section className="rounded-[2rem] bg-brand-deepTeal p-6 text-white shadow-soft">
        <p className="text-sm font-semibold text-white/75">Privacy-first tracking</p>
        <h2 className="mt-3 text-3xl font-bold leading-tight">Track your money without handing over your bank login.</h2>
        <p className="mt-4 text-sm leading-6 text-white/75">
          SpendGrove does not contain any financial data yet. Start by reviewing the setup, then use manual transactions or privacy-safe CSV import as those Phase 1 tools become available.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/onboarding" className="rounded-full bg-brand-green px-5 py-3 text-center text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-white">
            Review privacy setup
          </Link>
          <Link href="/import" className="rounded-full bg-white/12 px-5 py-3 text-center text-sm font-bold text-white ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-white">
            Explore CSV import
          </Link>
        </div>
      </section>

      <section className="mt-5 rounded-[2rem] border border-border bg-surface-base p-6 shadow-soft" aria-labelledby="empty-finance-heading">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-surface-mint p-3 text-brand-green">
            <WalletCards aria-hidden="true" className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-teal">Empty account</p>
            <h2 id="empty-finance-heading" className="mt-1 text-2xl font-bold text-brand-deepTeal">No transactions or balances yet.</h2>
            <p className="mt-2 text-sm leading-6 text-brand-deepTeal/75">
              This is a genuine empty state—not a demo balance. SpendGrove will only show financial information after you deliberately add or import it in a later approved task.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Empty financial overview">
        {emptySnapshotItems.map((item) => (
          <div key={item.label} className="rounded-3xl border border-border bg-surface-base p-4 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-teal">{item.label}</p>
            <p className="mt-2 text-lg font-bold text-brand-deepTeal">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <FeatureCard title="Simple Mode first" body="Australian defaults and core transaction/import paths stay prominent, while unfinished advanced modules remain hidden or clearly disabled.">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-teal">
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            No example financial figures are presented as saved data.
          </div>
        </FeatureCard>
        <FeatureCard title="Privacy stays visible" body="No bank login is requested, raw CSVs are not stored by default and review-before-commit remains the import rule.">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-teal">
            <FileUp aria-hidden="true" className="h-4 w-4" />
            Import remains an explanatory foundation only.
          </div>
        </FeatureCard>
      </div>
    </AppShell>
  );
}
