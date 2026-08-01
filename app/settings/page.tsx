import { AccountDeletion } from "@/components/account-deletion";
import { AccountantAccess } from "@/components/accountant-access";
import { AccountDataManagement } from "@/components/account-data-management";
import { AccountImportHistoryPanel } from "@/components/account-import-history-panel";
import { AppShell } from "@/components/app-shell";
import { DevelopmentTransactionResetPanel } from "@/components/development-transaction-reset-panel";
import { DocumentMetadata } from "@/components/document-metadata";
import { HouseholdAccess } from "@/components/household-access";
import { SettingsPanel } from "@/components/settings-panel";
import { PageHeader } from "@/components/ui/app-primitives";
import { isDevelopmentTestingEnvironment } from "@/src/server/development-testing";
import { isVerifiedPreviewRuntime } from "@/src/server/preview-runtime";
import { getBuildSafeClerkEnvStatus, getBuildSafeDatabaseEnvStatus } from "@/src/server/env";

export default function SettingsPage() {
  const clerkStatus = getBuildSafeClerkEnvStatus();
  const databaseStatus = getBuildSafeDatabaseEnvStatus();
  const accountHistoryAvailable = clerkStatus.clerkConfigured && databaseStatus.runtimeDatabaseConfigured;
  const developmentTestingAvailable = accountHistoryAvailable && isDevelopmentTestingEnvironment();

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader
          title="Settings"
          description="Preferences, privacy and less-common account tools."
        />

        <SettingsPanel />

        {accountHistoryAvailable && <AccountDataManagement />}

        {(accountHistoryAvailable || developmentTestingAvailable) && (
          <section className="mt-6" aria-labelledby="advanced-tools-heading">
            <div className="mb-2 px-1">
              <h2 id="advanced-tools-heading" className="text-base font-semibold text-foreground">Account management</h2>
              <p className="mt-0.5 text-sm text-muted">Import history and recovery tools stay out of the everyday workflow.</p>
            </div>
            <details className="rounded-2xl border border-border bg-surface-base">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green">
                Advanced account tools
                <span aria-hidden="true" className="text-muted">›</span>
              </summary>
              <div className="space-y-5 border-t border-border p-4">
                {accountHistoryAvailable && <AccountImportHistoryPanel />}
                {developmentTestingAvailable && <DevelopmentTransactionResetPanel />}
              </div>
            </details>
          </section>
        )}

        <HouseholdAccess available={accountHistoryAvailable && isVerifiedPreviewRuntime()} />
        <AccountantAccess available={accountHistoryAvailable && isVerifiedPreviewRuntime()} />
        <DocumentMetadata available={accountHistoryAvailable && isVerifiedPreviewRuntime()} />

        {accountHistoryAvailable && <AccountDeletion />}
      </div>
    </AppShell>
  );
}
