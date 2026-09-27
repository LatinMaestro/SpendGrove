"use client";

import { useState } from "react";
import { FileClock, FileUp, ShieldCheck } from "lucide-react";
import { AccountImportHistoryPanel } from "@/components/account-import-history-panel";
import { CsvImportFoundation } from "@/components/csv-import-foundation";

type ImportCentreView = "NEW" | "HISTORY";

const views: Array<{
  id: ImportCentreView;
  label: string;
  description: string;
  icon: typeof FileUp;
}> = [
  {
    id: "NEW",
    label: "New import",
    description: "Choose, review and import a CSV.",
    icon: FileUp,
  },
  {
    id: "HISTORY",
    label: "Past imports",
    description: "See safe outcomes from committed imports.",
    icon: FileClock,
  },
];

export function ImportCentre({ importUndoAvailable = false }: { importUndoAvailable?: boolean }) {
  const [view, setView] = useState<ImportCentreView>("NEW");

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-teal">Import Centre</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Bring in transactions</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Review a bank CSV before anything is added to your account.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Import Centre views"
          className="grid w-full gap-1 rounded-2xl border border-border bg-surface-subtle p-1 sm:w-auto sm:grid-cols-2"
        >
          {views.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                id={`import-centre-${item.id.toLowerCase()}-tab`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`import-centre-${item.id.toLowerCase()}-panel`}
                onClick={() => setView(item.id)}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                  active
                    ? "bg-surface-base text-brand-evergreen shadow-sm"
                    : "text-muted hover:bg-surface-base/70 hover:text-foreground"
                }`}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {view === "NEW" ? (
        <section
          id="import-centre-new-panel"
          role="tabpanel"
          aria-labelledby="import-centre-new-tab"
          tabIndex={0}
          className="focus:outline-none"
        >
          <CsvImportFoundation />
        </section>
      ) : (
        <section
          id="import-centre-history-panel"
          role="tabpanel"
          aria-labelledby="import-centre-history-tab"
          tabIndex={0}
          className="focus:outline-none"
        >
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-border bg-surface-base p-4">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" />
            <div>
              <h2 className="font-semibold text-foreground">Private by design</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Past imports show safe totals and outcomes only. CSV contents, filenames and bank details are not shown.
              </p>
            </div>
          </div>
          <AccountImportHistoryPanel importUndoAvailable={importUndoAvailable} />
        </section>
      )}
    </div>
  );
}
