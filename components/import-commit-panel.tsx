"use client";

import { useEffect, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { CheckCircle2, Cloud, LockKeyhole } from "lucide-react";
import { commitReviewedImport } from "@/lib/account-import-commit";
import { listAccountManualTransactions } from "@/lib/account-manual-transactions";
import { createImportCommitRequest, type ImportCommitSummary } from "@/lib/import-commit";
import { IMPORT_HISTORY_UPDATED_EVENT } from "@/lib/import-history";
import type { MergeTargetReviewSelection } from "@/lib/import-duplicate-scoring";
import type { ImportReviewRow } from "@/lib/import-review";
import type { CsvScanResult } from "@/lib/csv-import";
import type { ManualTransaction } from "@/lib/manual-transactions";

function createRequestId() {
  return globalThis.crypto?.randomUUID?.() ?? "00000000-0000-4000-8000-000000000000";
}

export function ImportCommitPanel({
  rows,
  mergeSelections,
  scan,
  needsReviewCount,
  onAccountTransactions,
}: {
  rows: ImportReviewRow[];
  mergeSelections: Record<string, MergeTargetReviewSelection>;
  scan: CsvScanResult;
  needsReviewCount: number;
  onAccountTransactions(transactions: ManualTransaction[]): void;
}) {
  const { isLoaded, isSignedIn } = useUser();
  const [requestId] = useState(createRequestId);
  const [isCommitting, setIsCommitting] = useState(false);
  const [summary, setSummary] = useState<ImportCommitSummary | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    void listAccountManualTransactions().then((result) => {
      if (!cancelled && result.ok) onAccountTransactions(result.transactions);
    });
    return () => { cancelled = true; };
  }, [isSignedIn, onAccountTransactions]);

  async function commitImport() {
    if (summary || isCommitting || needsReviewCount > 0) return;
    const importCount = rows.filter((row) => row.action === "IMPORT").length;
    const skipCount = rows.filter((row) => row.action === "SKIP").length;
    const mergeCount = rows.filter((row) => row.action === "MERGE").length;
    const confirmed = window.confirm(
      `Save this reviewed import to your account? ${importCount} will be imported, ${skipCount} skipped and ${mergeCount} merged. This cannot be submitted twice.`,
    );
    if (!confirmed) return;

    setIsCommitting(true);
    setMessage("");
    try {
      const request = createImportCommitRequest({
        requestId,
        rows,
        mergeSelections,
        metadata: {
          parsedRowCount: rows.length,
          privateFieldCount: scan.privateColumnCount,
          detectedBankName: scan.profile.bankName || undefined,
          hasHeader: scan.hasHeader,
          amountMode: scan.amountMode,
          detectedDateFormats: scan.detectedDateFormats,
          warningCodes: scan.warningCodes,
        },
      });
      const result = await commitReviewedImport(request);
      if (!result.ok) { setMessage(result.error); return; }
      setSummary(result.summary);
      window.dispatchEvent(new Event(IMPORT_HISTORY_UPDATED_EVENT));
      setMessage(result.summary.alreadyCommitted
        ? "This reviewed import was already saved. No duplicate transactions were created."
        : `Import saved: ${result.summary.importedCount} imported, ${result.summary.skippedCount} skipped and ${result.summary.mergedCount} merged.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Check the reviewed rows and try again.");
    } finally {
      setIsCommitting(false);
    }
  }

  if (!isLoaded) return <section className="rounded-[2rem] border border-border bg-surface-mint p-5 sm:p-6"><p className="text-sm font-semibold text-brand-deepTeal">Checking account access…</p></section>;
  if (!isSignedIn) {
    return <section className="rounded-[2rem] border border-brand-teal bg-surface-mint p-5 sm:p-6"><div className="flex items-start gap-3"><LockKeyhole aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" /><div><h2 className="text-xl font-bold text-brand-deepTeal">Sign in to save this reviewed import</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Your browser-local review stays available, but SpendGrove will not silently write transactions without an authenticated account.</p></div></div><SignInButton mode="modal"><button type="button" className="mt-4 min-h-12 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white">Sign in to continue</button></SignInButton></section>;
  }

  return (
    <section className="rounded-[2rem] border border-brand-green bg-surface-mint p-5 sm:p-6" aria-labelledby="commit-import-heading">
      <div className="flex items-start gap-3">{summary ? <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" /> : <Cloud aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />}<div><h2 id="commit-import-heading" className="text-xl font-bold text-brand-deepTeal">{summary ? "Reviewed import saved" : "Save reviewed transactions to your account"}</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Only safe reviewed fields, integer cents, action outcomes, warning codes and aggregate metadata are saved. The CSV, filename, raw rows and private bank details are never included.</p></div></div>
      {!summary && needsReviewCount > 0 && <p role="status" className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">{needsReviewCount} transaction{needsReviewCount === 1 ? " still needs" : "s still need"} review before this import is ready to save.</p>}
      {!summary && <button type="button" disabled={isCommitting || needsReviewCount > 0} onClick={commitImport} className="mt-4 min-h-12 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">{isCommitting ? "Saving reviewed import…" : needsReviewCount > 0 ? "Finish reviewing first" : "Confirm and save import"}</button>}
      {message && <p role="status" className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold text-brand-deepTeal">{message}</p>}
    </section>
  );
}
