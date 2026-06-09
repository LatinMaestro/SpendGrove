import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { FeatureCard } from "@/components/feature-card";
import { OnboardingPrompt } from "@/components/onboarding-prompt";
import { formatAudFromCents } from "@/lib/money";

const snapshotItems = [
  { label: "This month", value: formatAudFromCents(128450) },
  { label: "Needs review", value: "0 rows" },
  { label: "CSV imports", value: "Not started" },
];

export default function HomePage() {
  return (
    <AppShell>
      <OnboardingPrompt />

      <section className="rounded-[2rem] bg-brand-deepTeal p-6 text-white shadow-soft">
        <p className="text-sm font-semibold text-white/75">Privacy-first tracking</p>
        <h2 className="mt-3 text-3xl font-bold leading-tight">Track your money without handing over your bank login.</h2>
        <p className="mt-4 text-sm leading-6 text-white/75">
          Start with a manual transaction or explore a CSV workflow where private fields are excluded and every row is reviewed.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/transactions" className="rounded-full bg-brand-green px-5 py-3 text-center text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-white">
            Add a transaction
          </Link>
          <Link href="/import" className="rounded-full bg-white/12 px-5 py-3 text-center text-sm font-bold text-white ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-white">
            Start CSV import
          </Link>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        {snapshotItems.map((item) => (
          <div key={item.label} className="rounded-3xl border border-border bg-surface-base p-4 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-teal">{item.label}</p>
            <p className="mt-2 text-xl font-bold text-brand-deepTeal">{item.value}</p>
          </div>
        ))}
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <FeatureCard title="Simple Mode first" body="Australian defaults and core transaction/import paths stay prominent, while unfinished advanced modules remain hidden or clearly disabled." />
        <FeatureCard title="Privacy stays visible" body="No bank login is requested, raw CSVs are not stored by default and review-before-commit remains the import rule." />
      </div>
    </AppShell>
  );
}
