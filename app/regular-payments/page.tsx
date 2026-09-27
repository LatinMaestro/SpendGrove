import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/app-primitives";
import { RecurringSuggestions } from "@/components/recurring-suggestions";
import { AdvancedRecurringLifecycle } from "@/components/advanced-recurring-lifecycle";
import { getBuildSafeClerkEnvStatus, getBuildSafeDatabaseEnvStatus } from "@/src/server/env";
import { isVerifiedPreviewRuntime } from "@/src/server/preview-runtime";

export default function RegularPaymentsPage() {
  const clerkStatus = getBuildSafeClerkEnvStatus();
  const databaseStatus = getBuildSafeDatabaseEnvStatus();
  const accountPersistenceAvailable = clerkStatus.clerkConfigured && databaseStatus.runtimeDatabaseConfigured;

  return (
    <AppShell>
      <Link href="/" className="mb-4 inline-flex min-h-11 items-center gap-1 rounded-lg text-sm font-bold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"><ChevronLeft aria-hidden="true" className="h-4 w-4" /> Back to Home</Link>
      <PageHeader title="Regular payments" description="Review suggestions and manage the payments you have confirmed." />
      <RecurringSuggestions accountPersistenceAvailable={accountPersistenceAvailable} />
      <AdvancedRecurringLifecycle available={isVerifiedPreviewRuntime()} />
    </AppShell>
  );
}
