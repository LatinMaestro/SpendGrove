"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { CheckCircle2, ChevronLeft, ChevronRight, Cloud LockKeyhole, RefreshCw, RotateCcw, ShieldCheck, Undo2 } from "lucide-react";
import { listAccountTransactionsForImportReview } from "@/lib/account-manual-transactions";
import { CustomCategoryManager, useCustomCategoryCatalogue } from "@/components/custom-category-controls";
import { ImportCommitPanel } from "@/components/import-commit-panel";
import { ImportReviewRowCard, type ImportReviewPropertyOption } from "@/components/import-review-row-card";
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
import { applyMerchantSuggestionsToRows, createTransientImportReviewRows, summarizeImportReview, updateImportReviewAction, updateImportReviewDetails, updateImportReviewPropertyLink, type ImportReviewAction, type ImportReviewEditType, type ImportReviewRow } from "@/lib/import-review";
import { manualCategories } from "@/lib/manual-categories";
import { deleteMerchantAlias, deleteMerchantRule, emptyLocalMerchantData, MerchantConflictError, renameMerchantAlias, renameMerchantProfile, setMerchantAliasActive, setMerchantRuleActive, type LocalMerchantData, type MerchantConflict, type MerchantConflictResolution } from "@/lib/merchant-rules";

type PendingMerchantConflict = { kind: "RULE" | "ALIAS"; rowId: string; alias?: string; conflict: MerchantConflict };
type DuplicateAnalysisStatus = "WAITING_FOR_AUTH" | "LOADING" | "READY" | "SIGNED_OUT" | "UNAVAILABLE";
type PropertyOptionsStatus = "SIGNED_OUT" | "LOADING" | "READY" | "UNAVAILABLE";
const categoryId = (name: string) => manualCategories.find((category) => category.name === name)!.id;

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
  const [merchantData, setMerchantData] = useState<LocalMerchantData>(emptyLocalMerchantData());
  const [merchantUndo, setMerchantUndo] = useState<LocalMerchantData | null>(null);
  const [existingTransactions, setExistingTransactions] = useState<ExistingAccountTransaction[]>([]);
  const [mergeSelections, setMergeSelections] = useState<Record<string, MergeTargetReviewSelection>>({});
  const [merchantRecovered, setMerchantRecovered] = useState(false);
  const [merchantMigrated, setMerchantMigrated] = useState(false);
  const [merchantStaleReferenceCount, setMerchantStaleReferenceCount] = useState(0);
  const [merchantStorageAvailable, setMerchantStorageAvailable] = useState(true);
  const [applyUndo, setApplyUndo] = useState<ApplySameMerchantUndo | null>(null);
  const [pendingConflict, setPendingConflict] = useState<PendingMerchantConflict | null>(null);
  const [notice, setNotice] = useState("");
  const [duplicateAnalysisStatus, setDuplicateAnalysisStatus] = useState<DuplicateAnalysisStatus>("WAITING_FOR_AUTH");
  const [duplicateAnalysisError, setDuplicateAnalysisError] = useState("");
  const [duplicateAnalysisAttempt, setDuplicateAnalysisAttempt] = useState(0);
  const [localReviewDataReady, setLocalReviewDataReady] = useState(false);
  const [propertyOptions, setPropertyOptions] = useState<ImportReviewPropertyOption[]>([]);
  const [propertyOptionsStatus, setPropertyOptionsStatus] = useState<PropertyOptionsStatus>("SIGNED_OUT");

  useEffect(() => {
    // Private-beta account screens never read or rewrite earlier browser-only
    // prototype records. Account-backed catalogues load through their own APIs.
    setMerchantData(emptyLocalMerchantData());
    setMerchantRecovered(false);
    setMerchantMigrated(false);
    setMerchantStaleReferenceCount(0);
    setMerchantStorageAvailable(true);
    setExistingTransactions([]);
    setLocalReviewDataReady(true);
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
  const reviewStarted = reviewRows !== null;

  useEffect(() => { setReviewPage((page) => Math.min(page, pageCount)); }, [pageCount]);

  useEffect(() => {
    if (!reviewStarted) {
      setDuplicateAnalysisStatus("WAITING_FOR_AUTH");
      setDuplicateAnalysisError("");
      return;
    }
    if (!isLoaded || !localReviewDataReady) {
      setDuplicateAnalysisStatus("WAITING_FOR_AUTH");
      return;
    }
    if (!isSignedIn) {
      setExistingTransactions([]);
      setDuplicateAnalysisStatus("UNAVAILABLE");
      setDuplicateAnalysisError("Your session ended. Sign in again before reviewing this import.");
      return;
    }

    let cancelled = false;
    setDuplicateAnalysisStatus("LOADING");
    setDuplicateAnalysisError("");
    void listAccountTransactionsForImportReview().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setDuplicateAnalysisStatus("UNAVAILABLE");
        setDuplicateAnalysisError(result.error);
        return;
      }
      setExistingTransactions(result.transactions);
      setReviewRows((current) => current
        ? defaultLikelyExistingDuplicatesToSkip(current, result.transactions, actionReviewedRowIds.current)
        : current);
      setDuplicateAnalysisStatus("READY");
    });
    return () => { cancelled = true; };
  }, [duplicateAnalysisAttempt, isLoaded, isSignedIn, localReviewDataReady, reviewStarted]);

  useEffect(() => {
    if (!reviewStarted) {
      setPropertyOptions([]);
      setPropertyOptionsStatus("SIGNED_OUT");
      return;
    }
    if (!isLoaded) {
      setPropertyOptionsStatus("LOADING");
      return;
    }
    if (!isSignedIn) {
      setPropertyOptions([]);
      setPropertyOptionsStatus("SIGNED_OUT");
      return;
    }

    let cancelled = false;
    setPropertyOptionsStatus("LOADING");
    void fetch("/api/account/loans", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { ok?: boolean; properties?: Array<ImportReviewPropertyOption & { isArchived?: boolean }> };
        if (!response.ok || !result.ok || !Array.isArray(result.properties)) throw new Error("Properties could not be loaded safely.");
        return result.properties.filter((property) => !("isArchived" in property) || !property.isArchived);
      })
      .then((properties) => {
        if (cancelled) return;
        setPropertyOptions(properties.map((property) => ({
          id: property.id,
          nickname: property.nickname,
          usage: property.usage,
        })));
        setPropertyOptionsStatus("READY");
      })
      .catch(() => {
        if (cancelled) return;
        setPropertyOptions([]);
        setPropertyOptionsStatus("UNAVAILABLE");
      });
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, reviewStarted]);

  function replaceMerchantData(nextData: LocalMerchantData) { setMerchantData(nextData); setReviewRows((current) => current ? applyMerchantSuggestionsToRows(current, nextData) : current); }
  function startReview() { actionReviewedRowIds.current.clear(); setDuplicateAnalysisStatus("WAITING_FOR_AUTH"); setDuplicateAnalysisError(""); setDuplicateAnalysisAttempt((attempt) => attempt + 1); setReviewRows(createTransientImportReviewRows(document, scan.columns, scan.mapping, merchantData)); setReviewPage(1); setOnlyNeedsReview(false); setReviewWorkingSet(null); setTaxMetadata({}); setMergeSelections({}); setApplyUndo(null); setNotice(""); }
  function resetReview() { startReview(); setNotice("Your current choices, record-keeping notes and edits were reset. Saved suggestions and summary history were not changed."); }
  function setNeedsReviewFilter(enabled: boolean) { setOnlyNeedsReview(enabled); setReviewWorkingSet(enabled ? createImportReviewWorkingSet(rows, mergeSelections) : null); setReviewPage(1); }
  function refreshNeedsReviewFilter() { setReviewWorkingSet(createImportReviewWorkingSet(rows, mergeSelections)); setReviewPage(1); setNotice("Resolved items were hidden and the Needs review list was refreshed."); }
  function updateAction(rowId: string, action: ImportReviewAction) { if (!reviewRows) return; actionReviewedRowIds.current.add(rowId); setReviewRows(updateImportReviewAction(reviewRows, rowId, action)); if (action !== "MERGE") setMergeSelections((current) => { const next = { ...current }; delete next[rowId]; return next; }); setNotice(action === "MERGE" ? "Merge selected. Choose an eligible existing manual transaction in the duplicate check before final account save." : ""); }
  function persistMerchantData(nextData: LocalMerchantData, successNotice: string, allowUndo = false) { if (allowUndo) setMerchantUndo(merchantData); setMerchantStorageAvailable(true); replaceMerchantData(nextData); setNotice(successNotice); }
  function saveRule(row: ImportReviewRow, resolution?: MerchantConflictResolution, automatic = false) { try { const nextData = learnMerchantCategory(merchantData, row, resolution); const categoryName = getReviewCategory(customCategoryCatalogue.categories, row.categoryId)?.name ?? "your category"; persistMerchantData(nextData, resolution === "KEEP_EXISTING" ? "The existing saved rule was kept." : automatic ? `Saved for next time: ${row.merchantName} → ${categoryName}` : "Merchant rule saved. Your review choices were kept.", automatic); setPendingConflict(null); } catch (error) { if (error instanceof MerchantConflictError) setPendingConflict({ kind: "RULE", rowId: row.id, conflict: error.conflict }); else setNotice(error instanceof Error ? error.message : "This merchant rule could not be saved."); } }
  function saveEditedMerchantName(row: ImportReviewRow, previousMerchantName: string, resolution?: MerchantConflictResolution) { try { const nextData = learnEditedMerchantName(merchantData, { previousMerchantName, merchantName: row.merchantName, categoryId: row.categoryId, resolution }); persistMerchantData(nextData, `Saved for next time: ${previousMerchantName} → ${row.merchantName}`, true); setPendingConflict(null); } catch (error) { if (error instanceof MerchantConflictError) setPendingConflict({ kind: "ALIAS", rowId: row.id, alias: previousMerchantName, conflict: error.conflict }); else setNotice(error instanceof Error ? error.message : "This merchant name could not be saved."); } }
  function updateDetails(rowId: string, details: { merchantName: string; categoryId: string; editType: ImportReviewEditType }) { if (!reviewRows) return; try { const nextRows = updateImportReviewDetails(reviewRows, rowId, details); setReviewRows(nextRows); setNotice(""); if (details.editType === "CATEGORY_EDIT" && details.categoryId !== categoryId("Needs review")) { const changedRow = nextRows.find((row) => row.id === rowId); if (changedRow) saveRule(changedRow, undefined, true); } } catch { setNotice("That merchant or category choice was not accepted because it was unsafe or unavailable."); } }
  function updatePropertyLink(rowId: string, propertyId: string | null) { if (!reviewRows) return; try { setReviewRows(updateImportReviewPropertyLink(reviewRows, rowId, propertyId)); setNotice(propertyId ? "Property record choice saved for this browser review. The link will be created only after import succeeds." : "Property record choice removed for this browser review."); } catch { setNotice("That Property choice was not accepted safely."); } }
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
  const analysisPending = reviewStarted && (
    duplicateAnalysisStatus === "WAITING_FOR_AUTH" ||
    duplicateAnalysisStatus === "LOADING"
  );
  const analysisUnavailable = reviewStarted && duplicateAnalysisStatus === "UNAVAILABLE";
  const reviewPrepared = reviewStarted && (
    duplicateAnalysisStatus === "READY" ||
    duplicateAnalysisStatus === "SIGNED_OUT"
  );

  return <div className="space-y-5">
    {!reviewRows ? <section className="rounded-3xl border border-border bg-surface-mint p-5 sm:p-6"><div className="flex items-start gap-3"><ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" /><div><p className="font-bold text-brand-deepTeal">Ready to review</p><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Check each transaction, choose a category and select Import, Skip or Merge. Nothing creates transactions until you explicitly confirm.</p></div></div><button type="button" onClick={startReview} disabled={!canStartReview} className="mt-4 min-h-12 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white disabled:opacity-45">{canStartReview ? "Choose what to import" : "Finish matching columns first"}</button></section> : <>
      {analysisPending && <section role="status" aria-live="polite" className="rounded-2xl border border-border bg-surface-base p-4"><div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-mint text-brand-evergreen"><RefreshCw aria-hidden="true" className="h-6 w-6 animate-spin" /></div><div><h2 className="mt-1 text-lg font-bold text-foreground">Preparing your review</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-brand-deepTeal/70">Checking this file against transactions already in SpendGrove so duplicates can be skipped before review.</p><p className="mt-2 text-xs font-semibold text-muted">{duplicateAnalysisStatus === "WAITING_FOR_AUTH" ? "Checking account access…" : "Checking existing transactions…"}</p></div></div></section>}
      {analysisUnavailable && <section role="alert" className="rounded-2xl border border-warning-amber bg-warning-amber/10 p-6 sm:p-8"><h2 className="text-2xl font-bold text-brand-deepTeal">We could not check for existing transactions</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-brand-deepTeal/75">{duplicateAnalysisError} Retry before reviewing this import.</p><button type="button" onClick={() => setDuplicateAnalysisAttempt((attempt) => attempt + 1)} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white"><RefreshCw aria-hidden="true" className="h-4 w-4" /> Retry duplicate check</button></section>}
      {reviewPrepared && <>
      <section className="rounded-2xl border border-border bg-surface-base p-4 sm:p-5" aria-labelledby="review-summary-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-brand-teal">Review transactions</p><h2 id="review-summary-heading" className="mt-1 text-lg font-bold text-foreground">Check your transactions</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-brand-deepTeal/70">Resolve anything marked Needs review, then import the transactions you approve.</p></div><details className="w-full sm:w-auto"><summary className="min-h-11 cursor-pointer rounded-full border border-border px-4 py-3 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">Review options</summary><div className="mt-2 flex flex-wrap gap-2">{merchantUndo && <button type="button" onClick={undoMerchantLearning} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal"><Undo2 aria-hidden="true" className="h-4 w-4" /> Undo saved merchant choice</button>}{applyUndo && <button type="button" onClick={undoApply} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal"><Undo2 aria-hidden="true" className="h-4 w-4" /> Undo last apply</button>}<button type="button" onClick={resetReview} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal"><RotateCcw aria-hidden="true" className="h-4 w-4" /> Reset review</button></div></details></div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-surface-subtle">{[["Transactions", summary.totalRows], ["Needs review", needsReviewCount], ["Ready to import", readyImportCount]].map(([label, value]) => <div key={label} className="px-3 py-3 text-center"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-1 text-2xl font-bold text-brand-deepTeal">{value}</p></div>)}</div>
        <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><label className="flex min-h-10 cursor-pointer items-center gap-3"><input type="checkbox" checked={onlyNeedsReview} onChange={(event) => setNeedsReviewFilter(event.target.checked)} className="h-5 w-5 rounded border-border text-brand-green focus:ring-brand-green" /><span className="text-sm font-bold text-brand-deepTeal">Only show items needing review</span></label>{onlyNeedsReview && <button type="button" onClick={refreshNeedsReviewFilter} className="min-h-10 self-start rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal sm:self-auto">Hide resolved items</button>}</div>
        {onlyNeedsReview && <p className="mt-2 text-xs leading-5 text-brand-deepTeal/60">Rows stay visible until each required choice is complete.</p>}
        {likelyExistingDuplicateCount > 0 && <div role="status" className="mt-4 rounded-2xl border border-warning-amber bg-warning-amber/10 p-4 text-sm leading-6 text-brand-deepTeal"><p className="font-bold">{overlappingImport ? "This file looks like it may overlap with transactions already imported." : "Some transactions look already saved."}</p><p className="mt-1">{likelyExistingDuplicateCount} row{likelyExistingDuplicateCount === 1 ? "" : "s"} look{likelyExistingDuplicateCount === 1 ? "s" : ""} already saved in SpendGrove. High-confidence matches are set to Skip; review before importing.</p></div>}
        <div className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 ${isSignedIn ? "border-brand-green bg-surface-mint" : "border-brand-teal bg-white"}`}>{isSignedIn ? <Cloud aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" /> : <LockKeyhole aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" />}<div><p className="text-sm font-bold text-brand-deepTeal">{isSignedIn ? "Account duplicate check complete" : "Sign in before importing to check against saved account transactions"}</p><p className="mt-1 text-xs leading-5 text-brand-deepTeal/65">{isSignedIn ? "Existing saved transactions were checked before this review was shown." : "You can continue this browser-local review, but saved account duplicate protection has not run."}</p>{!isSignedIn && <SignInButton mode="modal"><button type="button" className="mt-3 min-h-10 rounded-full bg-brand-deepTeal px-4 text-xs font-bold text-white">Sign in with email code or reset access</button></SignInButton>}</div></div>
        {pendingConflict && <div className="mt-5"><MerchantConflictPrompt conflict={pendingConflict.conflict} onChoose={resolveConflict} /></div>}{notice && <p role="status" className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">{notice}</p>}
      </section>
      <section ref={reviewTopRef} className="scroll-mt-4" aria-labelledby="review-rows-heading">
        <div><h2 id="review-rows-heading" className="text-xl font-bold text-brand-deepTeal">Transactions to review</h2><p className="mt-2 text-sm text-brand-deepTeal/65">Showing page {reviewPage} of {pageCount}, with up to 25 transactions at a time. Summary counts always cover all {rows.length} transactions.</p></div>
        {visibleRows.length === 0 ? <div className="mt-5 rounded-2xl bg-surface-mint p-5"><p className="font-bold text-brand-deepTeal">No items need review</p><p className="mt-1 text-sm text-brand-deepTeal/65">You can import when ready, or turn the filter off to see every transaction.</p></div> : <div className="mt-4 space-y-3">{visibleRows.map((row) => { const blockers = importReviewRowBlockers(row, mergeSelections); return <ImportReviewRowCard key={row.id} row={row} customCategories={customCategoryCatalogue.categories} matchingRowCount={countApplySameMerchantMatches(rows, row.id)} duplicateCandidates={duplicateCandidatesByRow[row.id] ?? []} selectedMergeTargetId={mergeSelections[row.id]?.targetTransactionId} isPotentiallyDeductible={isRowPotentiallyDeductible(taxMetadata, row.id)} needsAttention={importReviewRowNeedsAttention(row, mergeSelections)} blockerMessage={importReviewBlockerMessage(blockers)} ambiguousTransfer={isAmbiguousTransferText(row.merchantName, row.description)} sourceDetails={sourceDetailsByRow[row.rowNumber]} propertyOptions={propertyOptions} propertyOptionsStatus={propertyOptionsStatus} onAction={(action) => updateAction(row.id, action)} onDetails={(details) => updateDetails(row.id, details)} onCreateCategory={customCategoryCatalogue.create} onTaxChange={(value) => { setTaxMetadata((current) => updateTaxReviewMetadata(current, row.id, value)); setNotice(""); }} onPropertyLinkChange={(propertyId) => updatePropertyLink(row.id, propertyId)} onApplySameMerchant={() => applySameMerchant(row.id)} onChooseMergeTarget={(candidate) => chooseMergeTarget(row, candidate)} onMerchantNameCommit={(previous) => saveEditedMerchantName(row, previous)} />; })}</div>}
        {pageCount > 1 && <nav aria-label="Import review pages" className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><button type="button" disabled={reviewPage <= 1} onClick={() => changeReviewPage(reviewPage - 1)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal disabled:opacity-35"><ChevronLeft aria-hidden="true" className="h-4 w-4" /> Previous</button><div className="order-3 flex w-full items-center justify-center gap-1 sm:order-none sm:w-auto">{reviewPageNumbers.map((page, index) => <div key={page} className="flex items-center gap-1">{index > 0 && page - reviewPageNumbers[index - 1] > 1 && <span aria-hidden="true" className="px-1 text-brand-deepTeal/45">…</span>}<button type="button" onClick={() => changeReviewPage(page)} aria-current={page === reviewPage ? "page" : undefined} aria-label={`Go to review page ${page}`} className={`min-h-10 min-w-10 rounded-full border px-3 text-sm font-bold ${page === reviewPage ? "border-brand-green bg-surface-mint text-brand-deepTeal" : "border-border bg-white text-brand-teal"}`}>{page}</button></div>)}</div><button type="button" disabled={reviewPage >= pageCount} onClick={() => changeReviewPage(reviewPage + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal disabled:opacity-35">Next <ChevronRight aria-hidden="true" className="h-4 w-4" /></button></nav>}
      </section>
      <ImportCommitPanel rows={rows} mergeSelections={mergeSelections} scan={scan} />
      </>}
    </>}
    {!reviewRows && <>
      <details className="rounded-2xl border border-border bg-surface-base"><summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-bold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Import settings</summary><div className="space-y-4 border-t border-border p-4">
      <CustomCategoryManager categories={customCategoryCatalogue.categories} storageAvailable={customCategoryCatalogue.storageAvailable} recoveredFromCorruption={customCategoryCatalogue.recoveredFromCorruption} unsupportedVersion={customCategoryCatalogue.unsupportedVersion} notice={customCategoryCatalogue.notice} onRename={customCategoryCatalogue.rename} onArchiveChange={customCategoryCatalogue.setArchived} />
      <MerchantRuleManager data={merchantData} storageAvailable={merchantStorageAvailable} recoveredFromCorruption={merchantRecovered} migrated={merchantMigrated} staleReferenceCount={merchantStaleReferenceCount} onDataChange={replaceMerchantData} onRenameProfile={(id, name) => persistMerchantData(renameMerchantProfile(merchantData, id, name), "Merchant name updated.")} onRenameAlias={(id, name, resolution) => persistMerchantData(renameMerchantAlias(merchantData, id, name, resolution), resolution === "KEEP_EXISTING" ? "The existing matching name was kept." : "Matching merchant name updated.")} onAliasActiveChange={(id, active) => persistMerchantData(setMerchantAliasActive(merchantData, id, active), active ? "Matching merchant name restored." : "Matching merchant name disabled.")} onDeleteAlias={(id) => persistMerchantData(deleteMerchantAlias(merchantData, id), "Matching merchant name deleted.")} onRuleActiveChange={(id, active) => persistMerchantData(setMerchantRuleActive(merchantData, id, active), active ? "Merchant rule restored." : "Merchant rule disabled.")} onDeleteRule={(id) => persistMerchantData(deleteMerchantRule(merchantData, id), "Merchant rule deleted.")} onClear={() => persistMerchantData(emptyLocalMerchantData(), "Saved merchant suggestions cleared from your account.")} />
      </div></details>
      
      <section className="rounded-3xl border border-border bg-surface-mint p-5"><p className="flex items-center gap-2 font-bold text-brand-deepTeal"><CheckCircle2 aria-hidden="true" className="h-5 w-5 text-brand-green" /> Your privacy</p><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Your CSV file stays in this browser. Only the cleaned transaction details you approve are saved.</p></section>
    </>}
  </div>;
}
