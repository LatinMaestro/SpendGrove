import { AccountImportHistoryPanel } from "@/components/account-import-history-panel";
import { AppShell } from "@/components/app-shell";
import { DevelopmentTransactionResetPanel } from "@/components/development-transaction-reset-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { isDevelopmentTestingEnvironment } from "@/src/server/development-testing";
import { getBuildSafeClerkEnvStatus, getBuildSafeDatabaseEnvStatus } from "@/src/server/env";

export default function SettingsPage() {
  const clerkStatus = getBuildSafeClerkEnvStatus();
  const databaseStatus = getBuildSafeDatabaseEnvStatus();
  const accountHistoryAvailable = clerkStatus.clerkConfigured && databaseStatus.runtimeDatabaseConfigured;
  const developmentTestingAvailable = accountHistoryAvailable && isDevelopmentTestingEnvironment();

  return (
    <AppShell>
      <div className="space-y-5">
        <SettingsPanel />
        {developmentTestingAvailable && <DevelopmentTransactionResetPanel />}
        {accountHistoryAvailable && <AccountImportHistoryPanel />}
      </div>
    </AppShell>
  );
}
