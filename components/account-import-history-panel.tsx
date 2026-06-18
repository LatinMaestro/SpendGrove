"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { History, Link2, ShieldCheck } from "lucide-react";
import { listAccountImportHistory } from "@/lib/account-import-history";
import {
  IMPORT_HISTORY_UPDATED_EVENT,
  type AccountImportHistoryEntry,
  type SafeImportRowOutcome,
} from "@/lib/import-history";

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Recorded safely";
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function outcomeText(outcome: SafeImportRowOutcome) {
  if (outcome.outcome === "SKIPPED") return "Skipped · no transaction created";
  if (outcome.outcome === "IMPORTED") {
    return outcome.linkState === "ACTIVE"
      ? "Imported · transaction link active"
      : "Imported · transaction link unavailable";
  }
  if (outcome.outcome === "MERGED") {
    return outcome.linkState === "ACTIVE"
      ? "Merged · manual transaction link active"
      : "Merged · manual transaction link unavailable";
  }
  return "Outcome unavailable · no financial content shown";
}

export function AccountImportHistoryPanel() {
  const { isLoaded, isSignedIn } = useUser();
  const [entries, setEntries] = useState<AccountImportHistoryEntry[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setEntries([]);
      setError("");
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    async function loadHistory() {
      setStatus("loading");
      setError("");
      const result = await listAccountImportHistory(controller.signal);
      if (controller.signal.aborted) return;
      if (!result.ok) {
        setStatus("error");
        setError(result.error);
        return;
      }
      setEntries(result.entries);
      setStatus("ready");
    }

    const refreshHistory = () => { void loadHistory(); };
    void loadHistory();
    window.addEventListener(IMPORT_HISTORY_UPDATED_EVENT, refreshHistory);
    return () => {
      controller.abort();
      window.removeEventListener(IMPORT_HISTORY_UPDATED_EVENT, refreshHistory);
    };
  }, [isLoaded, isSignedIn, retryToken]);

  return (
    <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="account-import-history-heading">
      <div className="flex items-start gap-3">
        <History aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" />
        <div>
          <p className="text-sm font-semibold text-brand-teal">Signed-in account history</p>
          <h2 id="account-import-history-heading" className="mt-1 text-xl font-bold text-brand-deepTeal">Committed imports</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-deepTeal/70">Safe totals, row outcomes and link state only. CSV content, filenames, descriptions, amounts, account details and private identifiers are never returned by this history view.</p>
        </div>
      </div>

      {!isLoaded && <p className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">Checking account access…</p>}
      {isLoaded && !isSignedIn && <div className="mt-4 rounded-2xl bg-surface-mint p-4"><p className="font-bold text-brand-deepTeal">Sign in to view committed imports</p><p className="mt-1 text-sm leading-6 text-brand-deepTeal/65">Browser-local review summaries remain available in the import workflow on this device.</p></div>}
      {isSignedIn && status === "loading" && <p className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">Loading safe account history…</p>}
      {isSignedIn && status === "error" && <div role="alert" className="mt-4 rounded-2xl bg-warning-amber/10 p-4"><p className="font-bold text-brand-deepTeal">History could not be loaded</p><p className="mt-1 text-sm leading-6 text-brand-deepTeal/65">{error}</p><button type="button" onClick={() => setRetryToken((value) => value + 1)} className="mt-3 min-h-10 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal">Try again</button></div>}
      {isSignedIn && status === "ready" && entries.length === 0 && <div className="mt-4 rounded-2xl bg-surface-mint p-4"><p className="font-bold text-brand-deepTeal">No committed imports yet</p><p className="mt-1 text-sm leading-6 text-brand-deepTeal/65">After you review and explicitly confirm an import, its safe account summary will appear here.</p></div>}

      {isSignedIn && status === "ready" && entries.length > 0 && <div className="mt-5 space-y-4">{entries.map((entry) => (
        <article key={entry.batchId} className="rounded-3xl border border-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold text-brand-deepTeal">Committed import</p><p className="mt-1 text-xs text-brand-deepTeal/60">{formatTimestamp(entry.completedAt)}</p></div><span className="w-fit rounded-full bg-surface-mint px-3 py-1.5 text-xs font-bold text-brand-teal">Completed safely</span></div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Transactions", entry.totalCount], ["Imported", entry.importedCount], ["Skipped", entry.skippedCount], ["Merged", entry.mergedCount]].map(([label, value]) => <div key={label} className="rounded-2xl bg-surface-mint p-3"><p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-teal">{label}</p><p className="mt-1 text-xl font-bold text-brand-deepTeal">{value}</p></div>)}</div>
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-surface-mint p-3"><ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" /><p className="text-xs leading-5 text-brand-deepTeal/70">{entry.warningCount} safe warning code{entry.warningCount === 1 ? "" : "s"} recorded · {entry.privateFieldCount} private field{entry.privateFieldCount === 1 ? "" : "s"} excluded. No source values are shown.</p></div>
          {entry.audit && <p className="mt-3 text-xs leading-5 text-brand-deepTeal/60">Audit trail recorded {formatTimestamp(entry.audit.occurredAt)} · {entry.audit.metadata.importedCount} imported · {entry.audit.metadata.skippedCount} skipped · {entry.audit.metadata.mergedCount} merged.</p>}
          {entry.outcomes.length > 0 && <details className="mt-4 rounded-2xl border border-border bg-white"><summary className="cursor-pointer px-4 py-3 text-sm font-bold text-brand-deepTeal">View safe row outcomes</summary><div className="border-t border-border px-4 py-3"><div className="space-y-2">{entry.outcomes.map((outcome) => <div key={`${entry.batchId}-${outcome.rowNumber}`} className="flex items-start gap-2 text-sm text-brand-deepTeal/70"><Link2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" /><p><span className="font-bold text-brand-deepTeal">Row {outcome.rowNumber}:</span> {outcomeText(outcome)}{outcome.warningCount > 0 ? ` · ${outcome.warningCount} warning${outcome.warningCount === 1 ? "" : "s"}` : ""}</p></div>)}</div>{entry.hiddenOutcomeCount > 0 && <p className="mt-3 text-xs text-brand-deepTeal/60">{entry.hiddenOutcomeCount} additional outcome{entry.hiddenOutcomeCount === 1 ? "" : "s"} omitted from this concise view.</p>}</div></details>}
        </article>
      ))}</div>}
    </section>
  );
}
