import { AppShell } from "@/components/app-shell";
import { RecurringSuggestions } from "@/components/recurring-suggestions";
import { getBuildSafeClerkEnvStatus, getBuildSafeDatabaseEnvStatus } from "@/src/server/env";

export default function RegularPaymentsPage() {
  const clerkStatus = getBuildSafeClerkEnvStatus();
  const databaseStatus = getBuildSafeDatabaseEnvStatus();
  const accountPersistenceAvailable = clerkStatus.clerkConfigured && databaseStatus.runtimeDatabaseConfigured;

  return (
    <AppShell>
      <RecurringSuggestions accountPersistenceAvailable={accountPersistenceAvailable} />
    </AppShell>
  );
}
