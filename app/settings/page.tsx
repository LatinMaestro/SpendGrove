import { AccountImportHistoryPanel } from "@/components/account-import-history-panel";
import { AppShell } from "@/components/app-shell";
import { SettingsPanel } from "@/components/settings-panel";
import { getBuildSafeClerkEnvStatus, getBuildSafeDatabaseEnvStatus } from "@/src/server/env";

export default function SettingsPage() {
  const clerkStatus = getBuildSafeClerkEnvStatus();
  const databaseStatus = getBuildSafeDatabaseEnvStatus();
  const accountHistoryAvailable = clerkStatus.clerkConfigured && databaseStatus.runtimeDatabaseConfigured;

  return (
    <AppShell>
      <div className="space-y-5">
        <SettingsPanel />
        {accountHistoryAvailable && <AccountImportHistoryPanel />}
      </div>
    </AppShell>
  );
}
