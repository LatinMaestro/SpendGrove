import { AppShell } from "@/components/app-shell";
import { DurableManualTransactions } from "@/components/durable-manual-transactions";
import { ManualTransactionMigrationPanel } from "@/components/manual-transaction-migration-panel";
import { ManualTransactions } from "@/components/manual-transactions";
import { getBuildSafeClerkEnvStatus, getBuildSafeDatabaseEnvStatus } from "@/src/server/env";

export default function TransactionsPage() {
  const clerkStatus = getBuildSafeClerkEnvStatus();
  const databaseStatus = getBuildSafeDatabaseEnvStatus();
  const accountPersistenceAvailable = clerkStatus.clerkConfigured && databaseStatus.runtimeDatabaseConfigured;

  return (
    <AppShell>
      {accountPersistenceAvailable ? (
        <div className="space-y-5">
          <ManualTransactionMigrationPanel />
          <DurableManualTransactions />
        </div>
      ) : <ManualTransactions />}
    </AppShell>
  );
}
