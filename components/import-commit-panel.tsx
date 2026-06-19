"use client";

import { useEffect, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { CheckCircle2, Cloud, LockKeyhole, X } from "lucide-react";
import { commitReviewedImport } from "@/lib/account-import-commit";
import { listAccountManualTransactions } from "@/lib/account-manual-transactions";
import { createImportCommitRequest, type ImportCommitSummary } from "@/lib/import-commit";
import { IMPORT_HISTORY_UPDATED_EVENT } from "@/lib/import-history";
import type { MergeTargetReviewSelection } from "@/lib/import-duplicate-scoring";
import type { ImportReviewRow } from "@/lib/import-review";
import type { CsvScanResult } from "@/lib/csv-import";
import type { ManualTransaction } from "@/lib/manual-transactions";

function createRequestId() { return globalThis.crypto?.randomUUID?.() ?? "00000000-0000-4000-8000-000000000000"; }

export function ImportCommitPanel({ rows, mergeSelections, scan, needsReviewCount, onAccountTransactions }: { rows: ImportReviewRow[]; mergeSelections: Record<string, MergeTargetReviewSelection>; scan: CsvScanResult; needsReviewCount: number; onAccountTransactions(transactions: ManualTransaction[]): void }) {
  const { isLoaded, isSignedIn } = useUser();
  const [requestId] = useState(createRequestId);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [summary, setSummary] = useState<ImportCommitSummary | null>(null);
  const [message, setMessage] = useState("");
  const importCount = rows.filter((row) => row.action === "IMPORT").length;
  const skipCount = rows.filter((row) => row.action === "SKIP").length;
  const mergeCount = rows.filter((row) => row.action === "MERGE").length;

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    void listAccountManualTransactions().then((result) => { if (!cancelled && result.ok) onAccountTransactions(result.transactions); });
    return () => { cancelled = true; };
  }, [isSignedIn, onAccountTransactions]);

  async function commitImport() {
    if (summary || isCommitting || needsReviewCount > 0) return;
    setIsCommitting(true); setMessage("");
    try {
      const request = createImportCommitRequest({ requestId, rows, mergeSelections, metadata: { parsedRowCount: rows.length, privateFieldCount: scan.privateColumnCount, detectedBankName: scan.profile.bankName || undefined, hasHeader: scan.hasHeader, amountMode: scan.amountMode, detectedDateFormats: scan.detectedDateFormats, warningCodes: scan.warningCodes } });
      const result = await commitReviewedImport(request);
      if (!result.ok) { setMessage(`${result.error} Your review is still open; correct the highlighted item or try again.`); return; }
      setSummary(result.summary); setShowConfirmation(false); window.dispatchEvent(new Event(IMPORT_HISTORY_UPDATED_EVENT));
      setMessage(result.summary.alreadyCommitted ? "This reviewed import was already saved. No duplicate transactions were created." : `Import saved: ${result.summary.importedCount} imported, ${result.summary.skippedCount} skipped and ${result.summary.mergedCount} merged.`);
    } catch (error) { setMessage(`${error instanceof Error ? error.message : "Check the reviewed rows and try again."} Your review was preserved.`); }
    finally { setIsCommitting(false); }
  }

  if (!isLoaded) return <section className="rounded-[2rem] border border-border bg-surface-mint p-5 sm:p-6"><p className="text-sm font-semibold text-brand-deepTeal">Checking account access…</p></section>;
  if (!isSignedIn) return <section className="rounded-[2rem] border border-brand-teal bg-surface-mint p-5 sm:p-6"><div className="flex items-start gap-3"><LockKeyhole aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" /><div><h2 className="text-xl font-bold text-brand-deepTeal">Sign in to save this reviewed import</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Email-code sign-in is a valid test path. Your browser-local review stays available.</p></div></div><SignInButton mode="modal"><button type="button" className="mt-4 min-h-12 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white">Sign in to continue</button></SignInButton></section>;

  return <section className="rounded-[2rem] border border-brand-green bg-surface-mint p-5 sm:p-6" aria-labelledby="commit-import-heading">
    <div className="flex items-start gap-3">{summary ? <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" /> : <Cloud aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />}<div><h2 id="commit-import-heading" className="text-xl font-bold text-brand-deepTeal">{summary ? "Reviewed import saved" : "Save reviewed transactions to your account"}</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Only safe reviewed fields, integer cents, outcomes, warning codes and aggregate metadata are saved. The CSV, filename, raw rows and private bank details are never included.</p></div></div>
    {!summary && needsReviewCount > 0 && <p role="status" className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">{needsReviewCount} transaction{needsReviewCount === 1 ? " still needs" : "s still need"} review before this import is ready to save.</p>}
    {!summary && !showConfirmation && <button type="button" disabled={isCommitting || needsReviewCount > 0} onClick={() => setShowConfirmation(true)} className="mt-4 min-h-12 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">{needsReviewCount > 0 ? "Finish reviewing first" : "Review save summary"}</button>}
    {!summary && showConfirmation && <div role="dialog" aria-modal="false" aria-labelledby="save-confirmation-heading" className="mt-4 rounded-2xl border border-brand-green bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h3 id="save-confirmation-heading" className="font-bold text-brand-deepTeal">Confirm account save</h3><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">{importCount} will be imported, {skipCount} skipped and {mergeCount} merged. The request is idempotent, so retrying cannot create duplicate batches.</p></div><button type="button" onClick={() => setShowConfirmation(false)} aria-label="Close save confirmation" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border"><X aria-hidden="true" className="h-4 w-4" /></button></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={isCommitting} onClick={commitImport} className="min-h-11 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white disabled:opacity-45">{isCommitting ? "Saving reviewed import…" : "Confirm and save"}</button><button type="button" disabled={isCommitting} onClick={() => setShowConfirmation(false)} className="min-h-11 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal">Keep reviewing</button></div></div>}
    {message && <p role="status" className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold text-brand-deepTeal">{message}</p>}
  </section>;
}
