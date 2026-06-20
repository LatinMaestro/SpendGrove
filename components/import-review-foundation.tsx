"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { CheckCircle2, ChevronLeft, ChevronRight, Cloud, History, LockKeyhole, RotateCcw, ShieldCheck, Undo2 } from "lucide-react";
import { CustomCategoryManager, useCustomCategoryCatalogue } from "@/components/custom-category-controls";
import { ImportCommitPanel } from "@/components/import-commit-panel";
import { ImportReviewRowCard } from "@/components/import-review-row-card";
import { MerchantConflictPrompt, MerchantRuleManager } from "@/components/merchant-rule-manager";
import type { CsvScanResult, TransientCsvDocument } from "@/lib/csv-import";
import { getReviewCategory } from "@/lib/custom-categories";
import {
  countLikelyExistingDuplicateRows,
  createMergeTargetReviewSelection,
  defaultLikelyExistingDuplicatesToSkip,
  findImportDuplicateCandidates,
  looksLikeOverlappingImport,
  type DuplicateCandidate,
  type ExistingAccountTransaction,
  type MergeTargetReviewSelection,
} from "@/lib/import-duplicate-scoring";
import { getImportReviewPage, importReviewPageCount } from "@/lib/import-review-acceptance";
import { applyCategoryToMatchingMerchants, countApplySameMerchantMatches, undoLastApplySameMerchant, type ApplySameMerchantUndo } from "@/lib/import-review-bulk";
import { isAmbiguousTransferText } from "@/lib/import-review-merchant-identity";
import { learnEditedMerchantName, learnMerchantCategory } from "@/lib/import-review-merchant-learning";
import { createImportReviewWorkingSet, countImportReviewRowsNeedingAttention, countReadyImportRows, filterImportReviewRowsByWorkingSet, importReviewBlockerMessage, importReviewRowBlockers, importReviewRowNeedsAttention } from "@/lib/import-review-readiness";
import { createTransientImportReviewSourceDetails } from "@/lib/import-review-source-details";
import { isRowPotentiallyDeductible, updateTaxReviewMetadata, type ImportReviewTaxMetadata } from "@/lib/import-review-metadata";
import { applyMerchantSuggestionsToRows, createTransientImportReviewRows, loadImportHistoryFromStorage, summarizeImportReview, updateImportReviewAction, updateImportReviewDetails, type ImportHistoryEntry, type ImportReviewAction, type ImportReviewEditType, type ImportReviewRow } from "@/lib/import-review";
import { loadManualTransactionsFromStorage } from "@/lib/manual-transaction-storage";
import { manualCategories } from "@/lib/manual-categories";
import { deleteMerchantAlias, deleteMerchantRule, emptyLocalMerchantData, loadMerchantRulesFromStorage, MerchantConflictError, renameMerchantAlias, renameMerchantProfile, saveMerchantRulesToStorage, setMerchantAliasActive, setMerchantRuleActive, type LocalMerchantData, type MerchantConflict, type MerchantConflictResolution } from "@/lib/merchant-rules";

type PendingMerchantConflict = { kind: "RULE" | "ALIAS"; rowId: string; alias?: string; conflict: MerchantConflict };
const categoryId = (name: string) => manualCategories.find((category) => category.name === name)!.id;

function formatHistoryTimestamp(timestamp: string) { return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp)); }
function visibleReviewPageNumbers(currentPage: number, pageCount: number) {
  return [...new Set([1, currentPage - 1, currentPage, currentPage + 1, pageCount])]
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((left, right) => left - right);
}

export function ImportReviewFoundation({ document, scan, autoStart = false }: { document: TransientCsvDocument; scan: CsvScanResult; autoStart?: boolean }) {
  const { isLoaded, isSignedIn } = useUser();
  const reviewTopRef = useRef<HTMLElement>(null);
  const actionReviewedRowIds = useRef(new Set<string>());
  const customCategoryCatalogue = useCustomCategoryCatalogue();
  const [reviewRows, setReviewRows] = useState<ImportReviewRow[] | null>(() => autoStart && scan.mappingIssues.length === 0 ? createTransientImportReviewRows(document, scan.columns, scan.mapping) : null);
  const [reviewPage, setReviewPage] = useState(1);
  const [onlyNeedsReview, setOnlyNeedsReview] = useState(false);
  const [reviewWorkingSet, setReviewWorkingSet] = useState<string[] | null>(null);
  const [taxMetadata, setTaxMetadata] = useState<ImportReviewTaxMetadata>({});
  const [historyEntries, setHistoryEntries] = useState<ImportHistoryEntry[]>([]);
  const [merchantData, setMerchantData] = useState<LocalMerchantData>(emptyLocalMerchantData());
  const [merchantUndo, setMerchantUndo] = useState<LocalMerchantData | null>(null);
  const [existingTransactions, setExistingTransactions] = useState<ExistingAccountTransaction[]>([]);
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
    setHistoryEntries(history.entries); setHistoryRecovered(history.recoveredFromCorruption); setStorageAvailable(history.storageAvailable);
    setMerchantData(merchants.data); setMerchantRecovered(merchants.recoveredFromCorruption); setMerchantMigrated(merchants.migrated); setMerchantStaleReferenceCount(merchants.staleReferenceCount); setMerchantStorageAvailable(merchants.storageAvailable);
    setExistingTransactions(manual.transactions); setManualRecovered(manual.recoveredFromCorruption); setManualStorageAvailable(manual.storageAvailable);
    if (merchants.migrated || merchants.staleReferenceCount > 0) saveMerchantRulesToStorage(window.localStorage, merchants.data);
    setReviewRows((current) => current ? applyMerchantSuggestionsToRows(current, merchants.data) : current);
  }, []);

  const rows = reviewRows ?? [];
  const summary = useMemo(() => summarizeImportReview(rows), [rows]);
  const needsReviewCount = useMemo(() => countImportReviewRowsNeedingAttention(rows, mergeSelections), [mergeSelections, rows]);
  const readyImportCount = useMemo(() => countReadyImportRows(rows, mergeSelections), [mergeSelections, rows]);
  const sourceDetailsByRow = useMemo(() => createTransientImportReviewSourceDetails(document, scan.columns, scan.mapping), [document, scan.columns, scan.mapping]);
  const filteredRows = useMemo(() => onlyNeedsReview ? filterImportReviewRowsByWorkingSet(rows, reviewWorkingSet ?? []) : rows, [onlyNeedsReview, reviewWorkingSet, rows]);
  const pageCount = useMemo(() => importReviewPageCount(filteredRows), [filteredRows]);
  const visibleRows = useMemo(() => getImportReviewPage(filteredRows, reviewPage), [filteredRows, reviewPage]);
  const reviewPageNumbers = useMemo(() => visibleReviewPageNumbers(reviewPage, pageCount), [pageCount, reviewPage]);
  const duplicateCandidatesByRow = useMemo(() => { const result: Record<string, DuplicateCandidate[]> = {}; visibleRows.forEach((row) => { result[row.id] = findImportDuplicateCandidates(row, rows, existingTransactions); }); return result; }, [existingTransactions, rows, visibleRows]);
  const likelyExistingDuplicateCount = useMemo(() => countLikelyExistingDuplicateRows(rows, existingTransactions), [existingTransactions, rows]);
  const overlappingImport = looksLikeOverlappingImport(likelyExistingDuplicateCount, rows.length);
  const canStartReview = scan.mappingIssues.length === 0;

  useEffect(() => { setReviewPage((page) => Math.min(page, pageCount)); }, [pageCount]);

  function replaceMerchantData(nextData: LocalMerchantData) { setMerchantData(nextData); setReviewRows((current) => current ? applyMerchantSuggestionsToRows(current, nextData) : current); }
  function startReview() { actionReviewedRowIds.current.clear(); setReviewRows(createTransientImportReviewRows(document, scan.columns, scan.mapping, merchantData)); setReviewPage(1); setOnlyNeedsReview(false); setReviewWorkingSet(null); setTaxMetadata({}); setMergeSelections({}); setApplyUndo(null); setNotice(""); }
  function resetReview() { startReview(); setNotice("Your current choices, tax flags and edits were reset. Saved suggestions and summary history were not changed."); }
  function setNeedsReviewFilter(enabled: boolean) { setOnlyNeedsReview(enabled); setReviewWorkingSet(enabled ? createImportReviewWorkingSet(rows, mergeSelections) : null); setReviewPage(1); }
  function refreshNeedsReviewFilter() { setReviewWorkingSet(createImportReviewWorkingSet(rows, mergeSelections)); setReviewPage(1); setNotice("Resolved items were hidden and the Needs review list was refreshed."); }
  function updateAction(rowId: string, action: ImportReviewAction) { if (!reviewRows) return; actionReviewedRowIds.current.add(rowId); setReviewRows(updateImportReviewAction(reviewRows, rowId, action)); if (action !== "MERGE") setMergeSelections((current) => { const next = { ...current }; delete next[rowId]; return next; }); setNotice(action === "MERGE" ? "Merge selected. Choose an eligible existing manual transaction in the duplicate check before final account save." : ""); }
  function persistMerchantData(nextData: LocalMerchantData, successNotice: string, allowUndo = false) { if (allowUndo) setMerchantUndo(merchantData); const saved = saveMerchantRulesToStorage(window.localStorage, nextData); setMerchantStorageAvailable(saved); replaceMerchantData(nextData); setNotice(saved ? successNotice : "Browser storage is unavailable. The merchant choice will last only while this review is open."); }
  function saveRule(row: ImportReviewRow, resolution?: MerchantConflictResolution, automatic = false) { try { const nextData = learnMerchantCategory(merchantData, row, resolution); const categoryName = getReviewCategory(customCategoryCatalogue.categories, row.categoryId)?.name ?? "your category"; persistMerchantData(nextData, resolution === "KEEP_EXISTING" ? "The existing saved rule was kept." : automatic ? `Saved for next time: ${row.merchantName} → ${categoryName}` : "Merchant rule saved. Your review choices were kept.", automatic); setPendingConflict(null); } catch (error) { if (error instanceof MerchantConflictError) setPendingConflict({ kind: "RULE", rowId: row.id, conflict: error.conflict }); else setNotice(error instanceof Error ? error.message : "This merchant rule could not be saved."); } }
  function saveEditedMerchantName(row: ImportReviewRow, previousMerchantName: string, resolution?: MerchantConflictResolution) { try { const nextData = learnEditedMerchantName(merchantData, { previousMerchantName, merchantName: row.merchantName, categoryId: row.categoryId, resolution }); persistMerchantData(nextData, `Saved for next time: ${previousMerchantName} → ${row.merchantName}`, true); setPendingConflict(null); } catch (error) { if (error instanceof MerchantConflictError) setPendingConflict({ kind: "ALIAS", rowId: row.id, alias: previousMerchantName, conflict: error.conflict }); else setNotice(error instanceof Error ? error.message : "This merchant name could not be saved."); } }
  function updateDetails(rowId: string, details: { merchantName: string; categoryId: string; editType: ImportReviewEditType }) { if (!reviewRows) return; try { const nextRows = updateImportReviewDetails(reviewRows, rowId, details); setReviewRows(nextRows); setNotice(""); if (details.editType === "CATEGORY_EDIT" && details.categoryId !== categoryId("Needs review")) { const changedRow = nextRows.find((row) => row.id === rowId); if (changedRow) saveRule(changedRow, undefined, true); } } catch { setNotice("That merchant or category choice was not accepted because it was unsafe or unavailable."); } }
  function resolveConflict(resolution: MerchantConflictResolution) { if (!pendingConflict) return; if (resolution === "CANCEL") { setPendingConflict(null); setNotice("No saved merchant choices were changed."); return; } const row = reviewRows?.find((candidate) => candidate.id === pendingConflict.rowId); if (!row) { setPendingConflict(null); return; } if (resolution === "KEEP_EXISTING") { setPendingConflict(null); setNotice("The existing saved choice was kept."); return; } if (pendingConflict.kind === "RULE") saveRule(row, resolution, true); else if (pendingConflict.alias) saveEditedMerchantName(row, pendingConflict.alias, resolution); }
  function undoMerchantLearning() { if (!merchantUndo) return; const previous = merchantUndo; setMerchantUndo(null); persistMerchantData(previous, "The last automatically saved merchant choice was undone."); }
  function chooseMergeTarget(row: ImportReviewRow, candidate: DuplicateCandidate) { if (!reviewRows) return; try { const selection = createMergeTargetReviewSelection(row, candidate); setMergeSelections((current) => ({ ...current, [row.id]: selection })); setReviewRows(updateImportReviewAction(reviewRows, row.id, "MERGE")); setNotice("Merge target selected. It will be linked only when you confirm the import."); } catch (error) { setNotice(error instanceof Error ? error.message : "Only existing manual transactions can be selected as merge targets."); } }
  function applySameMerchant(rowId: string) { if (!reviewRows) return; const result = applyCategoryToMatchingMerchants(reviewRows, rowId); setReviewRows(result.rows); setApplyUndo(result.undo); setNotice(result.affectedCount > 0 ? `Category applied to ${result.affectedCount} safely grouped transaction${result.affectedCount === 1 ? "" : "s"}. Import, Skip and Merge choices were not changed.` : "No other eligible matching transactions were found."); }
  function undoApply() { if (!reviewRows || !applyUndo) return; setReviewRows(undoLastApplySameMerchant(reviewRows, applyUndo)); setApplyUndo(null); setNotice("Last apply-to-same-merchant change undone."); }
  function changeReviewPage(nextPage: number) {
    const safePage = Math.min(Math.max(nextPage, 1), pageCount);
    setReviewPage(safePage);
    window.requestAnimationFrame(() => reviewTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  const handleAccountTransactions = useCallback((transactions: ExistingAccountTransaction[]) => {
    setExistingTransactions(transactions);
    setReviewRows((current) => current
      ? defaultLikelyExistingDuplicatesToSkip(current, transactions, actionReviewedRowIds.current)
      : current);
  }, []);

  return <div className="space-y-5">
    {!reviewRows ? <section className="rounded-3xl border border-border bg-surface-mint p-5 sm:p-6"><div className="flex items-start gap-3"><ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" /><div><p className="font-bold text-brand-deepTeal">Ready to review</p><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Check each transaction, choose a category and select Import, Skip or Merge. Nothing creates transactions until you explicitly confirm.</p></div></div><button type="button" onClick={startReview} disabled={!canStartReview} className="mt-4 min-h-12 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white disabled:opacity-45">{canStartReview ? "Check your transactions" : "Finish matching columns first"}</button></section> : <>
      <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="review-summary-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-brand-teal">Review before saving</p><h2 id="review-summary-heading" className="mt-1 text-2xl font-bold text-brand-deepTeal">Check your transactions</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-brand-deepTeal/70">Review unresolved items, make any follow-up changes and import when you are ready.</p></div><div className="flex flex-wrap gap-2">{merchantUndo && <button type="button" onClick={undoMerchantLearning} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal"><Undo2 aria-hidden="true" className="h-4 w-4" /> Undo saved merchant choice</button>}{applyUndo && <button type="button" onClick={undoApply} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal"><Undo2 aria-hidden="true" className="h-4 w-4" /> Undo last apply</button>}<button type="button" onClick={resetReview} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal"><RotateCcw aria-hidden="true" className="h-4 w-4" /> Reset review</button></div></div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">{[["Transactions", summary.totalRows], ["Needs review", needsReviewCount], ["Ready to import", readyImportCount], ["Skip", summary.skipCount], ["Merge", summary.mergeCount]].map(([label, value]) => <div key={label} className="rounded-2xl bg-surface-mint p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">{label}</p><p className="mt-1 text-2xl font-bold text-brand-deepTeal">{value}</p></div>)}</div>
        <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><label className="flex min-h-10 cursor-pointer items-center gap-3"><input type="checkbox" checked={onlyNeedsReview} onChange={(event) => setNeedsReviewFilter(event.target.checked)} className="h-5 w-5 rounded border-border text-brand-green focus:ring-brand-green" /><span className="text-sm font-bold text-brand-deepTeal">Only show items needing review</span></label>{onlyNeedsReview && <button type="button" onClick={refreshNeedsReviewFilter} className="min-h-10 self-start rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal sm:self-auto">Hide resolved items</button>}</div>
        {onlyNeedsReview && <p className="mt-2 text-xs leading-5 text-brand-deepTeal/60">Rows stay visible while you finish merchant, tax, matching and action choices. Use Hide resolved items when you want to refresh this list.</p>}
        {likelyExistingDuplicateCount > 0 && <div role="status" className="mt-4 rounded-2xl border border-warning-amber bg-warning-amber/10 p-4 text-sm leading-6 text-brand-deepTeal"><p className="font-bold">{overlappingImport ? "This file looks like it may overlap with transactions already imported." : "Some transactions look already saved."}</p><p className="mt-1">{likelyExistingDuplicateCount} row{likelyExistingDuplicateCount === 1 ? "" : "s"} look{likelyExistingDuplicateCount === 1 ? "s" : ""} already saved in SpendGrove. High-confidence matches are set to Skip; review before importing.</p></div>}
        <div className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 ${isSignedIn ? "border-brand-green bg-surface-mint" : "border-brand-teal bg-white"}`}>{isSignedIn ? <Cloud aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" /> : <LockKeyhole aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" />}<div><p className="text-sm font-bold text-brand-deepTeal">{!isLoaded ? "Checking account access…" : isSignedIn ? "Ready for account save" : "Sign in before final account save"}</p><p className="mt-1 text-xs leading-5 text-brand-deepTeal/65">Email-code sign-in is a valid test path. CSV review stays browser-local.</p>{isLoaded && !isSignedIn && <SignInButton mode="modal"><button type="button" className="mt-3 min-h-10 rounded-full bg-brand-deepTeal px-4 text-xs font-bold text-white">Sign in with email code or reset access</button></SignInButton>}</div></div>
        {pendingConflict && <div className="mt-5"><MerchantConflictPrompt conflict={pendingConflict.conflict} onChoose={resolveConflict} /></div>}{notice && <p role="status" className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">{notice}</p>}
      </section>
      <section ref={reviewTopRef} className="scroll-mt-4 rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="review-rows-heading">
        <div><h2 id="review-rows-heading" className="text-xl font-bold text-brand-deepTeal">Transactions to review</h2><p className="mt-2 text-sm text-brand-deepTeal/65">Showing page {reviewPage} of {pageCount}, with up to 25 transactions at a time. Summary counts always cover all {rows.length} transactions.</p>{manualRecovered && <p className="mt-2 rounded-2xl bg-warning-amber/10 p-3 text-sm font-semibold text-brand-deepTeal">Unreadable manual transactions on this device were ignored for duplicate checks.</p>}{!manualStorageAvailable && <p className="mt-2 rounded-2xl bg-warning-amber/10 p-3 text-sm font-semibold text-brand-deepTeal">Browser storage is unavailable. Signed-in account transactions will still be checked where available.</p>}</div>
        {visibleRows.length === 0 ? <div className="mt-5 rounded-2xl bg-surface-mint p-5"><p className="font-bold text-brand-deepTeal">No items need review</p><p className="mt-1 text-sm text-brand-deepTeal/65">You can import when ready, or turn the filter off to see every transaction.</p></div> : <div className="mt-5 space-y-4">{visibleRows.map((row) => { const blockers = importReviewRowBlockers(row, mergeSelections); return <ImportReviewRowCard key={row.id} row={row} customCategories={customCategoryCatalogue.categories} matchingRowCount={countApplySameMerchantMatches(rows, row.id)} duplicateCandidates={duplicateCandidatesByRow[row.id] ?? []} selectedMergeTargetId={mergeSelections[row.id]?.targetTransactionId} isPotentiallyDeductible={isRowPotentiallyDeductible(taxMetadata, row.id)} needsAttention={importReviewRowNeedsAttention(row, mergeSelections)} blockerMessage={importReviewBlockerMessage(blockers)} ambiguousTransfer={isAmbiguousTransferText(row.merchantName, row.description)} sourceDetails={sourceDetailsByRow[row.rowNumber]} onAction={(action) => updateAction(row.id, action)} onDetails={(details) => updateDetails(row.id, details)} onCreateCategory={customCategoryCatalogue.create} onTaxChange={(value) => { setTaxMetadata((current) => updateTaxReviewMetadata(current, row.id, value)); setNotice(""); }} onApplySameMerchant={() => applySameMerchant(row.id)} onChooseMergeTarget={(candidate) => chooseMergeTarget(row, candidate)} onMerchantNameCommit={(previous) => saveEditedMerchantName(row, previous)} />; })}</div>}
        {pageCount > 1 && <nav aria-label="Import review pages" className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><button type="button" disabled={reviewPage <= 1} onClick={() => changeReviewPage(reviewPage - 1)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal disabled:opacity-35"><ChevronLeft aria-hidden="true" className="h-4 w-4" /> Previous</button><div className="order-3 flex w-full items-center justify-center gap-1 sm:order-none sm:w-auto">{reviewPageNumbers.map((page, index) => <div key={page} className="flex items-center gap-1">{index > 0 && page - reviewPageNumbers[index - 1] > 1 && <span aria-hidden="true" className="px-1 text-brand-deepTeal/45">…</span>}<button type="button" onClick={() => changeReviewPage(page)} aria-current={page === reviewPage ? "page" : undefined} aria-label={`Go to review page ${page}`} className={`min-h-10 min-w-10 rounded-full border px-3 text-sm font-bold ${page === reviewPage ? "border-brand-green bg-surface-mint text-brand-deepTeal" : "border-border bg-white text-brand-teal"}`}>{page}</button></div>)}</div><button type="button" disabled={reviewPage >= pageCount} onClick={() => changeReviewPage(reviewPage + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal disabled:opacity-35">Next <ChevronRight aria-hidden="true" className="h-4 w-4" /></button></nav>}
      </section>
      <ImportCommitPanel rows={rows} mergeSelections={mergeSelections} scan={scan} onAccountTransactions={handleAccountTransactions} />
    </>}
    {!reviewRows && <>
      <CustomCategoryManager categories={customCategoryCatalogue.categories} storageAvailable={customCategoryCatalogue.storageAvailable} recoveredFromCorruption={customCategoryCatalogue.recoveredFromCorruption} unsupportedVersion={customCategoryCatalogue.unsupportedVersion} notice={customCategoryCatalogue.notice} onRename={customCategoryCatalogue.rename} onArchiveChange={customCategoryCatalogue.setArchived} />
      <MerchantRuleManager data={merchantData} storageAvailable={merchantStorageAvailable} recoveredFromCorruption={merchantRecovered} migrated={merchantMigrated} staleReferenceCount={merchantStaleReferenceCount} onDataChange={replaceMerchantData} onRenameProfile={(id, name) => persistMerchantData(renameMerchantProfile(merchantData, id, name), "Merchant name updated.")} onRenameAlias={(id, name, resolution) => persistMerchantData(renameMerchantAlias(merchantData, id, name, resolution), resolution === "KEEP_EXISTING" ? "The existing matching name was kept." : "Matching merchant name updated.")} onAliasActiveChange={(id, active) => persistMerchantData(setMerchantAliasActive(merchantData, id, active), active ? "Matching merchant name restored." : "Matching merchant name disabled.")} onDeleteAlias={(id) => persistMerchantData(deleteMerchantAlias(merchantData, id), "Matching merchant name deleted.")} onRuleActiveChange={(id, active) => persistMerchantData(setMerchantRuleActive(merchantData, id, active), active ? "Merchant rule restored." : "Merchant rule disabled.")} onDeleteRule={(id) => persistMerchantData(deleteMerchantRule(merchantData, id), "Merchant rule deleted.")} onClear={() => persistMerchantData(emptyLocalMerchantData(), "Saved merchant suggestions cleared from this device.")} />
      <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="import-history-heading"><div className="flex items-start gap-3"><History aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" /><div><h2 id="import-history-heading" className="text-xl font-bold text-brand-deepTeal">Recent review summaries</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Summary counts only. Durable history is recorded separately after account save.</p></div></div>{!storageAvailable && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Browser storage is unavailable. You can still finish this review while the page is open.</p>}{historyRecovered && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Unreadable saved summaries were ignored and safely reset.</p>}<div className="mt-4 space-y-3">{historyEntries.length === 0 ? <div className="rounded-2xl bg-surface-mint p-4"><p className="font-bold text-brand-deepTeal">No review summaries saved</p></div> : historyEntries.map((entry) => <article key={entry.id} className="rounded-2xl border border-border p-4"><p className="font-bold text-brand-deepTeal">Review summary</p><p className="mt-1 text-xs text-brand-deepTeal/60">{formatHistoryTimestamp(entry.createdAt)}</p><p className="mt-3 text-sm text-brand-deepTeal/70">{entry.totalRows} transactions · {entry.importCount} Import · {entry.skipCount} Skip · {entry.mergeCount} Merge · {entry.warningCount} parser warnings</p></article>)}</div></section>
      <section className="rounded-3xl border border-border bg-surface-mint p-5"><p className="flex items-center gap-2 font-bold text-brand-deepTeal"><CheckCircle2 aria-hidden="true" className="h-5 w-5 text-brand-green" /> Your privacy</p><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">CSV files, filenames, raw rows and private account details are never uploaded or persisted. Only safe reviewed fields are sent when you explicitly confirm an authenticated account save.</p></section>
    </>}
  </div>;
}
