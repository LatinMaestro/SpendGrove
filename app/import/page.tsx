import { AccountImportHistoryPanel } from "@/components/account-import-history-panel";
import { AppShell } from "@/components/app-shell";
import { CsvImportFoundation } from "@/components/csv-import-foundation";

export default function ImportPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <CsvImportFoundation />
        <AccountImportHistoryPanel />
      </div>
    </AppShell>
  );
}
