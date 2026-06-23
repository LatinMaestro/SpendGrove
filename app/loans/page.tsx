import { AppShell } from "@/components/app-shell";
import { LoansManager } from "@/components/loans-manager";
import { getBuildSafeClerkEnvStatus, getBuildSafeDatabaseEnvStatus } from "@/src/server/env";

export const dynamic = "force-dynamic";

export default function LoansPage() {
  const clerk = getBuildSafeClerkEnvStatus();
  const database = getBuildSafeDatabaseEnvStatus();

  return (
    <AppShell>
      <LoansManager accountPersistenceAvailable={clerk.clerkConfigured && database.runtimeDatabaseConfigured} />
    </AppShell>
  );
}
