"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle2, ChevronLeft, ChevronRight, History, RotateCcw, ShieldCheck, Undo2 } from "lucide-react";
import { CustomCategoryManager, useCustomCategoryCatalogue } from "@/components/custom-category-controls";
import { ImportCommitPanel } from "@/components/import-commit-panel";
import { ImportReviewRowCard } from "@/components/import-review-row-card";
import { MerchantConflictPrompt, MerchantRuleManager } from "@/components/merchant-rule-manager";
import type { CsvScanResult, TransientCsvDocument } from "@/lib/csv-import";
import {
  createMergeTargetReviewSelection,
  findImportDuplicateCandidates,
  type DuplicateCandidate,
  type MergeTargetReviewSelection,
} from "@/lib/import-duplicate-scoring";
import {
  countImportReviewRowsNeedingAttention,
  getImportReviewPage,
  importReviewPageCount,
} from "@/lib/import-review-acceptance";
import {
  addImportHistoryEntry,
  applyMerchantSuggestionsToRows,
  createImportHistoryEntry,
  createTransientImportReviewRows,
  loadImportHistoryFromStorage,
  saveImportHistoryToStorage,
  summarizeImportReview,
  updateImportReviewAction,
  updateImportReviewDetails,
  type ImportHistoryEntry,
  type ImportReviewAction,
  type ImportReviewEditType,
  type ImportReviewRow,
} from "@/lib/import-review";
import {
  applyCategoryToMatchingMerchants,
  countApplySameMerchantMatches,
  undoLastApplySameMerchant,
  type ApplySameMerchantUndo,
} from "@/lib/import-review-bulk";
import {
  isRowPotentiallyDeductible,
  updateTaxReviewMetadata,
  type ImportReviewTaxMetadata,
} from "@/lib/import-review-metadata";
import { loadManualTransactionsFromStorage } from "@/lib/manual-transaction-storage";
import type { ManualTransaction } from "@/lib/manual-transactions";
import {
  deleteMerchantAlias,
  deleteMerchantRule,
  emptyLocalMerchantData,
  loadMerchantRulesFromStorage,
  MerchantConflictError,
  renameMerchantAlias,
  renameMerchantProfile,
  saveConfirmedMerchantRule,
  saveMerchantAlias,
  saveMerchantRulesToStorage,
  setMerchantAliasActive,
  setMerchantRuleActive,
  type LocalMerchantData,
  type MerchantConflict,
  type MerchantConflictResolution,
} from "@/lib/merchant-rules";

type PendingMerchantConflict = {
  kind: "RULE" | "ALIAS";
  rowId: string;
  alias?: string;
  conflict: MerchantConflict;
};

function formatHistoryTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp));
}

export function ImportReviewFoundation({ document, scan, autoStart = false }: { document: TransientCsvDocument; scan: CsvScanResult; autoStart?: boolean }) {
  const customCategoryCatalogue = useCustomCategoryCatalogue();
  const [reviewRows, setReviewRows] = useState<ImportReviewRow[] | null>(() => autoStart && scan.mappingIssues.length === 0 ? createTransientImportReviewRows(document, scan.columns, scan.mapping) : null);
  const [reviewPage, setReviewPage] = useState(1);
  const [taxMetadata, setTaxMetadata] = useState<ImportReviewTaxMetadata>({});
  const [historyEntries, setHistoryEntries] = useState<ImportHistoryEntry[]>([]);
  const [merchantData, setMerchantData] = useState<LocalMerchantData>(emptyLocalMerchantData());
  const [manualTransactions, setManualTransactions] = useState<ManualTransaction[]>([]);
  const [mergeSelections, setMergeSelections] = useState<Record<string, MergeTargetReviewSelection>>({});
  const [historyRecovered, setHistoryRecovered] = useState(false);
  const [merchantRecovered, setMerchantRecovered] = useState(false);
  const [merchantMigrated, setMerchantMigrated] = useState(false);
  const [merchantStaleReferenceCount, setMerchantStaleReferenceCount] = useState(0);
  const [manualRecovered, setManualRecovered] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [merchantStorageAvailable, setMerchantStorageAvailable] = useState(true);
  const [manualStorageAvailable, setManualStorageAvailable] = useState(true);
  const [applyUndo, setApplyUndo] = useState<ApplySameMerchantUndo | null>(null);
  const [pendingConflict, setPendingConflict] = useState<PendingMerchantConflict | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const history = loadImportHistoryFromStorage(window.localStorage);
    const merchants = loadMerchantRulesFromStorage(window.localStorage);
    const manual = loadManualTransactionsFromStorage(window.localStorage);
    setHistoryEntries(history.entries);
    setHistoryRecovered(history.recoveredFromCorruption);
    setStorageAvailable(history.storageAvailable);
    setMerchantData(merchants.data);
    setMerchantRecovered(merchants.recoveredFromCorruption);
    setMerchantMigrated(merchants.migrated);
    setMerchantStaleReferenceCount(merchants.staleReferenceCount);
    setMerchantStorageAvailable(merchants.storageAvailable);
    setManualTransactions(manual.transactions);
    setManualRecovered(manual.recoveredFromCorruption);
    setManualStorageAvailable(manual.storageAvailable);
    if (merchants.migrated || merchants.staleReferenceCount > 0) saveMerchantRulesToStorage(window.localStorage, merchants.data);
    setReviewRows((current) => current ? applyMerchantSuggestionsToRows(current, merchants.data) : current);
  }, []);

  const rows = reviewRows ?? [];
  const summary = useMemo(() => summarizeImportReview(rows), [rows]);
  const needsReviewCount = useMemo(() => countImportReviewRowsNeedingAttention(rows, mergeSelections), [mergeSelections, rows]);
  const pageCount = useMemo(() => importReviewPageCount(rows), [rows]);
  const visibleRows = useMemo(() => getImportReviewPage(rows, reviewPage), [reviewPage, rows]);
  const duplicateCandidatesByRow = useMemo(() => {
    const candidatesByRow: Record<string, DuplicateCandidate[]> = {};
    visibleRows.forEach((row) => { candidatesByRow[row.id] = findImportDuplicateCandidates(row, rows, manualTransactions); });
    return candidatesByRow;
  }, [manualTransactions, rows, visibleRows]);
  const canStartReview = scan.mappingIssues.length === 0;

  function replaceMerchantData(nextData: LocalMerchantData) {
    setMerchantData(nextData);
    setReviewRows((current) => current ? applyMerchantSuggestionsToRows(current, nextData) : current);
  }
  function startReview() { setReviewRows(createTransientImportReviewRows(document, scan.columns, scan.mapping, merchantData)); setReviewPage(1); setTaxMetadata({}); setMergeSelections({}); setApplyUndo(null); setNotice(""); }
  function resetReview() { setReviewRows(createTransientImportReviewRows(document, scan.columns, scan.mapping, merchantData)); setReviewPage(1); setTaxMetadata({}); setMergeSelections({}); setApplyUndo(null); setNotice("Your current choices, tax flags and edits were reset. Saved suggestions and summary history were not changed."); }
  function updateAction(rowId: string, action: ImportReviewAction) {
    if (!reviewRows) return;
    if (action === "MERGE" && !window.confirm("Mark this row as Merge? You will need to choose an existing manual transaction before saving.")) return;
    setReviewRows(updateImportReviewAction(reviewRows, rowId, action));
    if (action !== "MERGE") setMergeSelections((current) => { const next = { ...current }; delete next[rowId]; return next; });
    setNotice(action === "MERGE" ? "Merge marked. Choose an existing manual transaction in More options before saving." : "");
  }
  function updateDetails(rowId: string, details: { merchantName: string; categoryId: string; editType: ImportReviewEditType }) {
    if (!reviewRows) return;
    try { setReviewRows(updateImportReviewDetails(reviewRows, rowId, details)); setNotice(""); }
    catch { setNotice("That merchant or category choice was not accepted because it was unsafe or unavailable."); }
  }
  function chooseMergeTarget(row: ImportReviewRow, candidate: DuplicateCandidate) {
    if (!reviewRows || !window.confirm("Choose this existing manual transaction as the merge target?")) return;
    try {
      const selection = createMergeTargetReviewSelection(row, candidate);
      setMergeSelections((current) => ({ ...current, [row.id]: selection }));
      setReviewRows(updateImportReviewAction(reviewRows, row.id, "MERGE"));
      setNotice("Merge target selected. It will be linked only when you confirm the import.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Only existing manual transactions can be selected as merge targets."); }
  }
  function applySameMerchant(rowId: string) {
    if (!reviewRows) return;
    const result = applyCategoryToMatchingMerchants(reviewRows, rowId);
    setReviewRows(result.rows); setApplyUndo(result.undo);
    setNotice(result.affectedCount > 0 ? `Category applied to ${result.affectedCount} matching transaction${result.affectedCount === 1 ? "" : "s"}. Import, Skip and Merge choices were not changed.` : "No other eligible matching transactions were found.");
  }
  function undoApply() { if (!reviewRows || !applyUndo) return; setReviewRows(undoLastApplySameMerchant(reviewRows, applyUndo)); setApplyUndo(null); setNotice("Last apply-to-same-merchant change undone."); }
  function persistMerchantData(nextData: LocalMerchantData, successNotice: string) {
    const saved = saveMerchantRulesToStorage(window.localStorage, nextData);
    setMerchantStorageAvailable(saved); replaceMerchantData(nextData);
    setNotice(saved ? successNotice : "Browser storage is unavailable. The merchant choice will last only while this review is open.");
  }
  function saveRule(row: ImportReviewRow, resolution?: MerchantConflictResolution) {
    try {
      const nextData = saveConfirmedMerchantRule(merchantData, { merchantName: row.merchantName, categoryId: row.categoryId, resolution });
      persistMerchantData(nextData, resolution === "KEEP_EXISTING" ? "The existing saved rule was kept." : "Merchant rule saved. Your review choices were kept.");
      setPendingConflict(null);
    } catch (error) {
      if (error instanceof MerchantConflictError) setPendingConflict({ kind: "RULE", rowId: row.id, conflict: error.conflict });
      else setNotice(error instanceof Error ? error.message : "This merchant rule could not be saved.");
    }
  }
  function saveAlias(row: ImportReviewRow, alias: string, resolution?: MerchantConflictResolution) {
    try {
      const nextData = saveMerchantAlias(merchantData, { alias, canonicalName: row.merchantName, categoryId: row.categoryId, resolution });
      persistMerchantData(nextData, resolution === "KEEP_EXISTING" ? "The existing saved match was kept." : "Matching merchant name saved. Your review choices were kept.");
      setPendingConflict(null);
    } catch (error) {
      if (error instanceof MerchantConflictError) setPendingConflict({ kind: "ALIAS", rowId: row.id, alias, conflict: error.conflict });
      else setNotice(error instanceof Error ? error.message : "This matching merchant name could not be saved.");
    }
  }
  function resolveConflict(resolution: MerchantConflictResolution) {
    if (!pendingConflict) return;
    if (resolution === "CANCEL") { setPendingConflict(null); setNotice("No saved merchant choices were changed."); return; }
    const row = reviewRows?.find((candidate) => candidate.id === pendingConflict.rowId);
    if (!row) { setPendingConflict(null); return; }
    if (resolution === "KEEP_EXISTING") { setPendingConflict(null); setNotice("The existing saved choice was kept."); return; }
    if (pendingConflict.kind === "RULE") saveRule(row, resolution); else saveAlias(row, pendingConflict.alias ?? "", resolution);
  }
  function saveSummaryOnly() {
    if (!reviewRows) return;
    const nextEntries = addImportHistoryEntry(historyEntries, createImportHistoryEntry(summary));
    const saved = saveImportHistoryToStorage(window.localStorage, nextEntries);
    setStorageAvailable(saved);
    if (saved) { setHistoryEntries(nextEntries); setNotice("Review summary saved on this device. No file rows, tax flags or transactions were saved."); }
    else setNotice("Browser storage is unavailable. The review stays open, but no summary was saved.");
  }

  return <div className="space-y-5">
    {!reviewRows ? <section className="rounded-3xl border border-border bg-surface-mint p-5 sm:p-6"><div className="flex items-start gap-3"><ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" /><div><p className="font-bold text-brand-deepTeal">Ready to review</p><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Check each transaction, choose a category and select Import, Skip or Merge. Nothing creates transactions until you explicitly confirm.</p></div></div><button type="button" onClick={startReview} disabled={!canStartReview} className="mt-4 min-h-12 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white disabled:opacity-45">{canStartReview ? "Check your transactions" : "Finish matching columns first"}</button></section> : <>
      <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="review-summary-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-brand-teal">Review before saving</p><h2 id="review-summary-heading" className="mt-1 text-2xl font-bold text-brand-deepTeal">Check your transactions</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-brand-deepTeal/70">Work through the rows in smaller pages. Your choices are kept when you change page or save a merchant suggestion.</p></div><div className="flex flex-wrap gap-2">{applyUndo && <button type="button" onClick={undoApply} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal"><Undo2 aria-hidden="true" className="h-4 w-4" /> Undo last apply</button>}<button type="button" onClick={resetReview} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal"><RotateCcw aria-hidden="true" className="h-4 w-4" /> Reset review</button></div></div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">{[["Transactions", summary.totalRows], ["Import", summary.importCount], ["Skip", summary.skipCount], ["Merge", summary.mergeCount], ["Needs review", needsReviewCount]].map(([label, value]) => <div key={label} className="rounded-2xl bg-surface-mint p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">{label}</p><p className="mt-1 text-2xl font-bold text-brand-deepTeal">{value}</p></div>)}</div>
        {pendingConflict && <div className="mt-5"><MerchantConflictPrompt conflict={pendingConflict.conflict} onChoose={resolveConflict} /></div>}
      </section>
      <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="review-rows-heading">
        <div><h2 id="review-rows-heading" className="text-xl font-bold text-brand-deepTeal">Transactions to review</h2><p className="mt-2 text-sm text-brand-deepTeal/65">Showing page {reviewPage} of {pageCount}, with up to 25 transactions at a time. All {rows.length} review choices stay available for the final save.</p>{manualRecovered && <p className="mt-2 rounded-2xl bg-warning-amber/10 p-3 text-sm font-semibold text-brand-deepTeal">Unreadable manual transactions on this device were ignored for duplicate checks.</p>}{!manualStorageAvailable && <p className="mt-2 rounded-2xl bg-warning-amber/10 p-3 text-sm font-semibold text-brand-deepTeal">Browser storage is unavailable. Signed-in account transactions will still be checked where available.</p>}</div>
        <div className="mt-5 space-y-4">{visibleRows.map((row) => <ImportReviewRowCard key={row.id} row={row} customCategories={customCategoryCatalogue.categories} matchingRowCount={countApplySameMerchantMatches(rows, row.id)} duplicateCandidates={duplicateCandidatesByRow[row.id] ?? []} selectedMergeTargetId={mergeSelections[row.id]?.targetTransactionId} isPotentiallyDeductible={isRowPotentiallyDeductible(taxMetadata, row.id)} onAction={(action) => updateAction(row.id, action)} onDetails={(details) => updateDetails(row.id, details)} onCreateCategory={customCategoryCatalogue.create} onTaxChange={(value) => { setTaxMetadata((current) => updateTaxReviewMetadata(current, row.id, value)); setNotice(""); }} onApplySameMerchant={() => applySameMerchant(row.id)} onChooseMergeTarget={(candidate) => chooseMergeTarget(row, candidate)} onSaveRule={() => saveRule(row)} onSaveAlias={(alias) => saveAlias(row, alias)} />)}</div>
        {pageCount > 1 && <nav aria-label="Import review pages" className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5"><button type="button" disabled={reviewPage <= 1} onClick={() => { setReviewPage((page) => Math.max(1, page - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal disabled:opacity-35"><ChevronLeft aria-hidden="true" className="h-4 w-4" /> Previous</button><span className="text-sm font-bold text-brand-deepTeal">{reviewPage} / {pageCount}</span><button type="button" disabled={reviewPage >= pageCount} onClick={() => { setReviewPage((page) => Math.min(pageCount, page + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal disabled:opacity-35">Next <ChevronRight aria-hidden="true" className="h-4 w-4" /></button></nav>}
      </section>
      <ImportCommitPanel rows={rows} mergeSelections={mergeSelections} scan={scan} needsReviewCount={needsReviewCount} onAccountTransactions={setManualTransactions} />
      <section className="rounded-[2rem] border border-brand-green bg-surface-mint p-5 sm:p-6"><div className="flex items-start gap-3"><Archive aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" /><div><h2 className="text-xl font-bold text-brand-deepTeal">Save review summary only</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">This optional device summary stores only the time, status and total action counts—never transactions, tax flags, descriptions, categories, amounts or private account details.</p></div></div><button type="button" onClick={saveSummaryOnly} className="mt-4 min-h-12 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white">Save summary on this device</button></section>
    </>}
    <CustomCategoryManager categories={customCategoryCatalogue.categories} storageAvailable={customCategoryCatalogue.storageAvailable} recoveredFromCorruption={customCategoryCatalogue.recoveredFromCorruption} unsupportedVersion={customCategoryCatalogue.unsupportedVersion} notice={customCategoryCatalogue.notice} onRename={customCategoryCatalogue.rename} onArchiveChange={customCategoryCatalogue.setArchived} />
    <MerchantRuleManager data={merchantData} storageAvailable={merchantStorageAvailable} recoveredFromCorruption={merchantRecovered} migrated={merchantMigrated} staleReferenceCount={merchantStaleReferenceCount} onDataChange={replaceMerchantData} onRenameProfile={(id, name) => persistMerchantData(renameMerchantProfile(merchantData, id, name), "Merchant name updated.")} onRenameAlias={(id, name, resolution) => persistMerchantData(renameMerchantAlias(merchantData, id, name, resolution), resolution === "KEEP_EXISTING" ? "The existing matching name was kept." : "Matching merchant name updated.")} onAliasActiveChange={(id, active) => persistMerchantData(setMerchantAliasActive(merchantData, id, active), active ? "Matching merchant name restored." : "Matching merchant name disabled.")} onDeleteAlias={(id) => persistMerchantData(deleteMerchantAlias(merchantData, id), "Matching merchant name deleted.")} onRuleActiveChange={(id, active) => persistMerchantData(setMerchantRuleActive(merchantData, id, active), active ? "Merchant rule restored." : "Merchant rule disabled.")} onDeleteRule={(id) => persistMerchantData(deleteMerchantRule(merchantData, id), "Merchant rule deleted.")} onClear={() => persistMerchantData(emptyLocalMerchantData(), "Saved merchant suggestions cleared from this device.")} />
    <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="import-history-heading"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><History aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" /><div><h2 id="import-history-heading" className="text-xl font-bold text-brand-deepTeal">Recent review summaries</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Summary counts only. Durable import history is recorded separately when you confirm an account save.</p></div></div>{historyEntries.length > 0 && <button type="button" onClick={() => { const saved = saveImportHistoryToStorage(window.localStorage, []); setStorageAvailable(saved); if (saved) setHistoryEntries([]); }} className="min-h-12 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal">Clear summaries</button>}</div>{!storageAvailable && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Browser storage is unavailable. You can still finish this review while the page is open.</p>}{historyRecovered && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Unreadable saved summaries were ignored and safely reset.</p>}{notice && <p role="status" className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">{notice}</p>}<div className="mt-4 space-y-3">{historyEntries.length === 0 ? <div className="rounded-2xl bg-surface-mint p-4"><p className="font-bold text-brand-deepTeal">No review summaries saved</p></div> : historyEntries.map((entry) => <article key={entry.id} className="rounded-2xl border border-border p-4"><p className="font-bold text-brand-deepTeal">Review summary</p><p className="mt-1 text-xs text-brand-deepTeal/60">{formatHistoryTimestamp(entry.createdAt)}</p><p className="mt-3 text-sm text-brand-deepTeal/70">{entry.totalRows} transactions · {entry.importCount} Import · {entry.skipCount} Skip · {entry.mergeCount} Merge · {entry.warningCount} parser warnings</p></article>)}</div></section>
    <section className="rounded-3xl border border-border bg-surface-mint p-5"><p className="flex items-center gap-2 font-bold text-brand-deepTeal"><CheckCircle2 aria-hidden="true" className="h-5 w-5 text-brand-green" /> Your privacy</p><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">CSV files, filenames, raw rows and private account details are never uploaded or persisted. Only safe reviewed fields are sent when you explicitly confirm an authenticated account save.</p></section>
  </div>;
}
