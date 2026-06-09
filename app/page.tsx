import Link from "next/link";
import { FileUp, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { FeatureCard } from "@/components/feature-card";
import { HomeTransactionStatus } from "@/components/home-transaction-status";
import { OnboardingPrompt } from "@/components/onboarding-prompt";

export default function HomePage() {
  return (
    <AppShell>
      <OnboardingPrompt />

      <section className="rounded-[2rem] bg-brand-deepTeal p-6 text-white shadow-soft">
        <p className="text-sm font-semibold text-white/75">Privacy-first tracking</p>
        <h2 className="mt-3 text-3xl font-bold leading-tight">Track your money without handing over your bank login.</h2>
        <p className="mt-4 text-sm leading-6 text-white/75">
          Add manual transactions when you are ready. During this Phase 1 prototype they stay in your current browser and are not synced to a cloud account or production database.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/transactions" className="rounded-full bg-brand-green px-5 py-3 text-center text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-white">
            Add a manual transaction
          </Link>
          <Link href="/onboarding" className="rounded-full bg-white/12 px-5 py-3 text-center text-sm font-bold text-white ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-white">
            Review privacy setup
          </Link>
        </div>
      </section>

      <HomeTransactionStatus />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <FeatureCard title="Simple Mode first" body="Australian defaults and core transaction/import paths stay prominent, while unfinished advanced modules remain hidden or clearly disabled.">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-teal">
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            Only user-created local entries appear as financial data.
          </div>
        </FeatureCard>
        <FeatureCard title="Privacy stays visible" body="No bank login is requested, raw CSVs are not stored by default and review-before-commit remains the import rule.">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-teal">
            <FileUp aria-hidden="true" className="h-4 w-4" />
            CSV import remains an explanatory foundation only.
          </div>
        </FeatureCard>
      </div>
    </AppShell>
  );
}
