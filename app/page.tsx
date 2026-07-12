import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CategoryBudgets } from "@/components/category-budgets";
import { EverydayInsights } from "@/components/everyday-insights";
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

      <section className="rounded-[2rem] bg-brand-deepTeal p-6 text-white shadow-soft" aria-labelledby="home-overview-heading">
        <p className="text-sm font-semibold text-white/75">Your everyday money</p>
        <h2 id="home-overview-heading" className="mt-2 text-3xl font-bold leading-tight">See what matters this month.</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
          Review your spending, budgets and regular payments without connecting your bank.
        </p>
        <Link href="/import" className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-green px-6 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-white">
          Import transactions <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        <p className="mt-3 text-sm text-white/70">
          Already imported? <Link href="/transactions" className="font-bold text-white underline decoration-white/40 underline-offset-4">Review transactions</Link>
        </p>
      </section>

      <EverydayInsights accountPersistenceAvailable={accountPersistenceAvailable} />
      <RecurringSuggestions accountPersistenceAvailable={accountPersistenceAvailable} />
      <CategoryBudgets accountPersistenceAvailable={accountPersistenceAvailable} />
    </AppShell>
  );
}
