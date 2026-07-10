import Link from "next/link";
import { FileUp, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CategoryBudgets } from "@/components/category-budgets";
import { EverydayInsights } from "@/components/everyday-insights";
import { FeatureCard } from "@/components/feature-card";
import { OnboardingPrompt } from "@/components/onboarding-prompt";
import { RecurringSuggestions } from "@/components/recurring-suggestions";
import { getBuildSafeClerkEnvStatus, getBuildSafeDatabaseEnvStatus } from "@/src/server/env";

export default function HomePage() {
  const clerkStatus = getBuildSafeClerkEnvStatus();
  const databaseStatus = getBuildSafeDatabaseEnvStatus();
  const accountPersistenceAvailable = clerkStatus.clerkConfigured && databaseStatus.runtimeDatabaseConfigured;

  return (
    <AppShell>
      <OnboardingPrompt />

      <section className="rounded-[2rem] bg-brand-deepTeal p-6 text-white shadow-soft">
        <p className="text-sm font-semibold text-white/75">Privacy-first tracking</p>
        <h2 className="mt-3 text-3xl font-bold leading-tight">Track your money without handing over your bank login.</h2>
        <p className="mt-4 text-sm leading-6 text-white/75">
          Add transactions manually or import a bank CSV through review-before-commit. SpendGrove does not require a live bank connection.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/transactions" className="rounded-full bg-brand-green px-5 py-3 text-center text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-white">
            Review transactions
          </Link>
          <Link href="/import" className="rounded-full bg-white/12 px-5 py-3 text-center text-sm font-bold text-white ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-white">
            Import a bank CSV
          </Link>
        </div>
      </section>

      <EverydayInsights accountPersistenceAvailable={accountPersistenceAvailable} />
      <RecurringSuggestions accountPersistenceAvailable={accountPersistenceAvailable} />
      <CategoryBudgets accountPersistenceAvailable={accountPersistenceAvailable} />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <FeatureCard title="Simple Mode first" body="Reviewed everyday transactions stay at the centre of recurring suggestions, category budgets and transparent monthly insights.">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-teal">
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            Everyday transactions remain the only cashflow records.
          </div>
        </FeatureCard>
        <FeatureCard title="Privacy stays visible" body="No bank login is requested, raw CSV files and rows are not stored and each import remains review-before-commit.">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-teal">
            <FileUp aria-hidden="true" className="h-4 w-4" />
            Insights use only safe structured transaction facts.
          </div>
        </FeatureCard>
      </div>
    </AppShell>
  );
}
