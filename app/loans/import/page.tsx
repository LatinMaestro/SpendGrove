import { AppShell } from "@/components/app-shell";
import { LoanCsvReview } from "@/components/loan-csv-review";
import { getBuildSafeClerkEnvStatus, getBuildSafeDatabaseEnvStatus } from "@/src/server/env";

export const dynamic = "force-dynamic";

export default function LoanCsvReviewPage() {
  const clerk = getBuildSafeClerkEnvStatus();
  const database = getBuildSafeDatabaseEnvStatus();

  return (
    <AppShell>
      <LoanCsvReview accountPersistenceAvailable={clerk.clerkConfigured && database.runtimeDatabaseConfigured} />
    </AppShell>
  );
}
