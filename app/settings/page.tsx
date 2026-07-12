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
        {(accountHistoryAvailable || developmentTestingAvailable) && (
          <details className="rounded-3xl border border-border bg-surface-base p-5 shadow-soft">
            <summary className="cursor-pointer text-lg font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">Advanced account tools</summary>
            <p className="mt-2 text-sm leading-6 text-brand-deepTeal/65">Import history and development testing tools are available here when needed.</p>
            <div className="mt-4 space-y-5">
              {accountHistoryAvailable && <AccountImportHistoryPanel />}
              {developmentTestingAvailable && <DevelopmentTransactionResetPanel />}
            </div>
          </details>
        )}
      </div>
    </AppShell>
  );
}
