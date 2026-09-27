import Link from "next/link";
import { BarChart3, FileUp, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EverydayInsights } from "@/components/everyday-insights";
import { InAppReminders } from "@/components/in-app-reminders";
import { OnboardingPrompt } from "@/components/onboarding-prompt";
import { PageHeader } from "@/components/ui/app-primitives";
import { getBuildSafeClerkEnvStatus, getBuildSafeDatabaseEnvStatus } from "@/src/server/env";
import { isVerifiedPreviewRuntime } from "@/src/server/preview-runtime";

export default function HomePage() {
  const clerkStatus = getBuildSafeClerkEnvStatus();
  const databaseStatus = getBuildSafeDatabaseEnvStatus();
  const accountPersistenceAvailable = clerkStatus.clerkConfigured && databaseStatus.runtimeDatabaseConfigured;

  return (
    <AppShell>
      <PageHeader
        title="Home"
        description="Your everyday money for this month."
        action={
          <Link
            href="/import"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white transition-colors hover:bg-brand-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <FileUp aria-hidden="true" className="h-4 w-4" />
            Import transactions
          </Link>
        }
      />

      <OnboardingPrompt />
      <EverydayInsights accountPersistenceAvailable={accountPersistenceAvailable} />
      <InAppReminders available={accountPersistenceAvailable && isVerifiedPreviewRuntime()} />

      <section className="mt-7 border-t border-border pt-5" aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="text-sm font-semibold text-muted">Quick actions</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href="/transactions"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface-base px-4 text-sm font-bold text-brand-evergreen transition-colors hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add transaction
          </Link>
          <Link
            href="/reports"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface-base px-4 text-sm font-bold text-brand-evergreen transition-colors hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            <BarChart3 aria-hidden="true" className="h-4 w-4" />
            View reports
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
