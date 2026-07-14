import { AppShell } from "@/components/app-shell";
import { CategoryBudgets } from "@/components/category-budgets";
import { getBuildSafeClerkEnvStatus, getBuildSafeDatabaseEnvStatus } from "@/src/server/env";

export default function BudgetsPage() {
  const clerkStatus = getBuildSafeClerkEnvStatus();
  const databaseStatus = getBuildSafeDatabaseEnvStatus();
  const accountPersistenceAvailable = clerkStatus.clerkConfigured && databaseStatus.runtimeDatabaseConfigured;

  return (
    <AppShell>
      <CategoryBudgets accountPersistenceAvailable={accountPersistenceAvailable} />
    </AppShell>
  );
}
