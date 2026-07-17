import { AppShell } from "@/components/app-shell";
import { LocalPrototypeDataNotice } from "@/components/auth/local-prototype-data-notice";
import { PageHeader } from "@/components/ui/app-primitives";
import { DurableManualTransactions } from "@/components/durable-manual-transactions";
import { getBuildSafeClerkEnvStatus, getBuildSafeDatabaseEnvStatus } from "@/src/server/env";
import { CheckCircle2 } from "lucide-react";

function safeImportedCount(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !/^\d{1,5}$/.test(candidate)) return null;
  return Number(candidate);
}

export default async function TransactionsPage({ searchParams }: { searchParams?: Promise<{ import?: string | string[]; count?: string | string[] }> }) {
  const resolvedSearchParams = await searchParams;
  const clerkStatus = getBuildSafeClerkEnvStatus();
  const databaseStatus = getBuildSafeDatabaseEnvStatus();
  const accountPersistenceAvailable = clerkStatus.clerkConfigured && databaseStatus.runtimeDatabaseConfigured;
  const importComplete = resolvedSearchParams?.import === "complete";
  const importedCount = safeImportedCount(resolvedSearchParams?.count);

  return (
    <AppShell>
      <PageHeader title="Transactions" description="See what happened, one month at a time." />
      {importComplete && (
        <section role="status" className="mb-5 mt-5 flex items-start gap-3 rounded-xl border border-brand-leaf/30 bg-brand-leaf/5 p-4 text-foreground">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-leaf" />
          <div>
            <p className="font-bold">{importedCount === 0 ? "Import complete. No new transactions were added." : "Import complete. Your transactions have been added."}</p>
            {importedCount !== null && <p className="mt-1 text-sm text-brand-deepTeal/70">Imported {importedCount} transaction{importedCount === 1 ? "" : "s"}.</p>}
          </div>
        </section>
      )}
      <LocalPrototypeDataNotice context="account" />
      {accountPersistenceAvailable ? (
        <DurableManualTransactions />
      ) : (
        <section role="alert" className="rounded-2xl border border-warning-amber bg-warning-amber/10 p-5">
          <h2 className="font-bold text-brand-deepTeal">Account records are unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">
            SpendGrove could not connect to account storage. Your browser-only prototype data has not been changed.
          </p>
        </section>
      )}
    </AppShell>
  );
}
