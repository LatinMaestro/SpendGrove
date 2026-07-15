import { AppShell } from "@/components/app-shell";
import { LoansManager } from "@/components/loans-manager";
import { getBuildSafeClerkEnvStatus, getBuildSafeDatabaseEnvStatus } from "@/src/server/env";

export const dynamic = "force-dynamic";

type LoansPageProps = {
  searchParams?: Promise<{
    loanImport?: string | string[];
    saved?: string | string[];
  }>;
};

function singleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function safeSavedCount(value: string | string[] | undefined) {
  const count = Number(singleValue(value));
  return Number.isInteger(count) && count > 0 && count <= 5000 ? count : null;
}

export default async function LoansPage({ searchParams }: Readonly<LoansPageProps>) {
  const resolvedSearchParams = await searchParams;
  const clerk = getBuildSafeClerkEnvStatus();
  const database = getBuildSafeDatabaseEnvStatus();
  const loanImportCompleted = singleValue(resolvedSearchParams?.loanImport) === "saved";

  return (
    <AppShell>
      <LoansManager
        accountPersistenceAvailable={clerk.clerkConfigured && database.runtimeDatabaseConfigured}
        loanImportCompleted={loanImportCompleted}
        loanImportSavedCount={loanImportCompleted ? safeSavedCount(resolvedSearchParams?.saved) : null}
      />
    </AppShell>
  );
}
