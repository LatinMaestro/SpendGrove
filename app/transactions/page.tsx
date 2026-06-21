import { AppShell } from "@/components/app-shell";
import { DurableManualTransactions } from "@/components/durable-manual-transactions";
import { ManualTransactionMigrationPanel } from "@/components/manual-transaction-migration-panel";
import { ManualTransactions } from "@/components/manual-transactions";
import { getBuildSafeClerkEnvStatus, getBuildSafeDatabaseEnvStatus } from "@/src/server/env";
import { CheckCircle2 } from "lucide-react";

function safeImportedCount(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !/^\d{1,5}$/.test(candidate)) return null;
  return Number(candidate);
}

export default function TransactionsPage({ searchParams }: { searchParams?: { import?: string | string[]; count?: string | string[] } }) {
  const clerkStatus = getBuildSafeClerkEnvStatus();
  const databaseStatus = getBuildSafeDatabaseEnvStatus();
  const accountPersistenceAvailable = clerkStatus.clerkConfigured && databaseStatus.runtimeDatabaseConfigured;
  const importComplete = searchParams?.import === "complete";
  const importedCount = safeImportedCount(searchParams?.count);

  return (
    <AppShell>
      {importComplete && (
        <section role="status" className="mb-5 flex items-start gap-3 rounded-3xl border border-brand-green bg-surface-mint p-5 text-brand-deepTeal shadow-soft">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
          <div>
            <p className="font-bold">{importedCount === 0 ? "Import complete. No new transactions were added." : "Import complete. Your transactions have been added."}</p>
            {importedCount !== null && <p className="mt-1 text-sm text-brand-deepTeal/70">Imported {importedCount} transaction{importedCount === 1 ? "" : "s"}.</p>}
          </div>
        </section>
      )}
      {accountPersistenceAvailable ? (
        <div className="space-y-5">
          <ManualTransactionMigrationPanel />
          <DurableManualTransactions />
        </div>
      ) : <ManualTransactions />}
    </AppShell>
  );
}
