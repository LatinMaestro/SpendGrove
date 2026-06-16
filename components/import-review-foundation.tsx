"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History,
  Link2,
  RotateCcw,
  Save,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import {
  CustomCategoryManager,
  ReviewCategorySelector,
  useCustomCategoryCatalogue,
} from "@/components/custom-category-controls";
import {
  MerchantConflictPrompt,
  MerchantRuleManager,
} from "@/components/merchant-rule-manager";
import { getReviewCategory, type CustomCategory } from "@/lib/custom-categories";
import { formatAudFromCents } from "@/lib/money";
import type { CsvScanResult, TransientCsvDocument } from "@/lib/csv-import";
import {
  createMergeTargetReviewSelection,
  findImportDuplicateCandidates,
  type DuplicateCandidate,
  type MergeTargetReviewSelection,
} from "@/lib/import-duplicate-scoring";
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
  canSaveLocalMerchantRule,
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
  normalizeMerchantName,
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
  type MerchantSuggestionSource,
} from "@/lib/merchant-rules";
import type { ManualCategoryType } from "@/lib/manual-categories";

const genericAliasKeys = new Set(["payment", "bank transfer", "transfer", "loan repayment", "salary", "refund"]);

const reviewActions: Array<{ value: ImportReviewAction; label: string }> = [
  { value: "IMPORT", label: "Import" },
  { value: "SKIP", label: "Skip" },
  { value: "MERGE", label: "Merge" },
];

const suggestionLabels: Record<MerchantSuggestionSource, string> = {
  USER_RULE: "Your saved choice",
  USER_ALIAS: "Saved merchant match",
  KEYWORD: "Suggested from the merchant",
  FALLBACK: "Choose a category",
};

type PendingMerchantConflict = {
  kind: "RULE" | "ALIAS";
  rowId: string;
  alias?: string;
  conflict: MerchantConflict;
};

function formatReviewDate(date: string | null) {
  if (!date) return "Date needs review";
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatHistoryTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function isUsefulAlias(row: ImportReviewRow, alias: string) {
  if (!canSaveLocalMerchantRule(row)) return false;
  try {
    const aliasKey = normalizeMerchantName(alias);
    const merchantKey = normalizeMerchantName(row.merchantName);
    return aliasKey !== merchantKey && !genericAliasKeys.has(aliasKey);
  } catch {
    return false;
  }
}

function reviewStatusText(row: ImportReviewRow) {
  if (row.reviewState === "MANUALLY_REVIEWED") return "Manually reviewed";
  if (row.reviewState === "CONFIRMED_SUGGESTION") return "Category checked";
  if (row.reviewState === "APPLIED_TO_MATCH") return "Applied to same merchant";
  return "";
}

function matchConfidenceLabel(candidate: DuplicateCandidate) {
  return candidate.confidence === "LIKELY" ? "Likely match" : "Possible match";
}

function duplicateChipText(candidate: DuplicateCandidate) {
  if (candidate.source === "SAME_IMPORT") return "Possible duplicate in this import";
  return `${matchConfidenceLabel(candidate)} · Already entered manually`;
}

function duplicateDetailTitle(candidate: DuplicateCandidate) {
  if (candidate.source === "SAME_IMPORT") return "Possible duplicate in this import";
  return candidate.confidence === "LIKELY" ? "Likely match already entered manually" : "Possible match already entered manually";
}

function ActionButton({
  action,
  selected,
  onClick,
}: {
  action: (typeof reviewActions)[number];
  selected: boolean;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-10 rounded-xl border px-3 py-2 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-green ${selected
        ? "border-brand-green bg-white text-brand-deepTeal"
        : "border-transparent bg-transparent text-brand-deepTeal/70"
      }`}
    >
      {action.label}
    </button>
  );
}

function DuplicateCandidateDetails({
  candidate,
  isSelected,
  onChoose,
}: {
  candidate: DuplicateCandidate;
  isSelected: boolean;
  onChoose(candidate: DuplicateCandidate): void;
}) {
  return (
    <article className="rounded-2xl bg-white p-3 text-xs leading-5 text-brand-deepTeal/70">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-bold text-brand-deepTeal">{duplicateDetailTitle(candidate)}</p>
          <p className="mt-1">
            {candidate.source === "SAME_IMPORT" ? `Row ${candidate.rowNumber ?? "nearby"}` : candidate.merchantName}
            {" · "}{formatReviewDate(candidate.date)}{" · "}{formatAudFromCents(candidate.amountCents)}
          </p>
          <p className="mt-1 font-semibold text-brand-teal">{candidate.reasons.join(" · ")}</p>
        </div>
        {candidate.canMergeTarget ? (
          <button
            type="button"
            onClick={() => onChoose(candidate)}
            disabled={isSelected}
            className="min-h-10 shrink-0 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal disabled:cursor-default disabled:border-brand-green disabled:bg-surface-mint disabled:text-brand-green"
          >
            {isSelected ? "Merge target selected" : "Choose this as the merge target"}
          </button>
        ) : (
          <span className="rounded-full bg-surface-mint px-3 py-1.5 text-xs font-bold text-brand-teal">
            Warning only
          </span>
        )}
      </div>
      {candidate.source === "SAME_IMPORT" && (
        <p className="mt-2 text-brand-deepTeal/60">Rows from the same CSV cannot be merge targets.</p>
      )}
      {candidate.canMergeTarget && (
        <p className="mt-2 text-brand-deepTeal/60">This only marks your review choice. Nothing is saved yet.</p>
      )}
    </article>
  );
}

function ReviewRowCard({
  row,
  customCategories,
  matchingRowCount,
  duplicateCandidates,
  selectedMergeTargetId,
  isPotentiallyDeductible,
  onAction,
  onDetails,
  onCreateCategory,
  onTaxChange,
  onApplySameMerchant,
  onChooseMergeTarget,
  onSaveRule,
  onSaveAlias,
}: {
  row: ImportReviewRow;
  customCategories: CustomCategory[];
  matchingRowCount: number;
  duplicateCandidates: DuplicateCandidate[];
  selectedMergeTargetId?: string;
  isPotentiallyDeductible: boolean;
  onAction(action: ImportReviewAction): void;
  onDetails(details: { merchantName: string; categoryId: string; editType: ImportReviewEditType }): void;
  onCreateCategory(input: { name: string; type: ManualCategoryType }): CustomCategory;
  onTaxChange(value: boolean): void;
  onApplySameMerchant(): void;
  onChooseMergeTarget(candidate: DuplicateCandidate): void;
  onSaveRule(): void;
  onSaveAlias(alias: string): void;
}) {
  const [showMore, setShowMore] = useState(false);
  const [alias, setAlias] = useState("");
  const meaningfulSuggestion = row.suggestionSource !== "FALLBACK" && row.suggestionConfidence !== "LOW";
  const ruleAvailable = canSaveLocalMerchantRule(row);
  const aliasAvailable = isUsefulAlias(row, alias);
  const statusText = reviewStatusText(row);
  const currentCategory = getReviewCategory(customCategories, row.categoryId);
  const hasDistinctDescription = row.description && row.description !== row.merchantName;
  const topDuplicateCandidate = duplicateCandidates[0];

  return (
    <article className="rounded-3xl border border-border bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-bold text-brand-deepTeal">{row.merchantName || "Payment"}</p>
          <p className="mt-1 text-sm text-brand-deepTeal/60">{formatReviewDate(row.date)}</p>
        </div>
        <p className="shrink-0 font-bold text-brand-deepTeal">
          {row.amountCents === null ? "Review amount" : formatAudFromCents(row.amountCents)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-3 py-1.5 font-bold ${meaningfulSuggestion ? "bg-surface-mint text-brand-teal" : "bg-warning-amber/10 text-brand-deepTeal"}`}>
          {meaningfulSuggestion ? `Suggested: ${currentCategory?.name ?? "Review category"}` : "Choose a category"}
        </span>
        {topDuplicateCandidate && (
          <span className="rounded-full bg-warning-amber/10 px-3 py-1.5 font-bold text-brand-deepTeal">
            {duplicateChipText(topDuplicateCandidate)}
          </span>
        )}
        {statusText && <span className="font-bold text-brand-green">{statusText}</span>}
        {row.warningCodes.length > 0 && <span className="font-semibold text-warning-amber">Needs a quick check</span>}
      </div>

      <ReviewCategorySelector row={row} customCategories={customCategories} onDetails={onDetails} onCreate={onCreateCategory} />

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-surface-mint p-3">
        <input type="checkbox" checked={isPotentiallyDeductible} onChange={(event) => onTaxChange(event.target.checked)} className="mt-1 h-5 w-5 rounded border-border text-brand-green focus:ring-brand-green" />
        <span><span className="block text-sm font-bold text-brand-deepTeal">Potentially deductible?</span><span className="mt-0.5 block text-xs leading-5 text-brand-deepTeal/60">For record-keeping only—not tax advice. This choice is not saved as a transaction.</span></span>
      </label>

      {row.categoryConfirmed && row.action !== "SKIP" && matchingRowCount > 0 && (
        <button type="button" onClick={onApplySameMerchant} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
          <Link2 aria-hidden="true" className="h-4 w-4" /> Apply to {matchingRowCount} matching transaction{matchingRowCount === 1 ? "" : "s"}
        </button>
      )}

      <fieldset className="mt-4">
        <legend className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">What should happen later?</legend>
        <div className="mt-2 grid grid-cols-3 gap-1 rounded-2xl bg-surface-mint p-1">
          {reviewActions.map((action) => <ActionButton key={action.value} action={action} selected={row.action === action.value} onClick={() => onAction(action.value)} />)}
        </div>
        {row.action === "MERGE" && <p className="mt-2 text-xs leading-5 text-brand-deepTeal/60">This only records your choice for review. No transaction is matched or changed.</p>}
      </fieldset>

      <button type="button" onClick={() => setShowMore((current) => !current)} aria-expanded={showMore} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-green">
        {showMore ? <ChevronUp aria-hidden="true" className="h-4 w-4" /> : <ChevronDown aria-hidden="true" className="h-4 w-4" />}{showMore ? "Hide options" : "More options"}
      </button>

      {showMore && (
        <div className="mt-3 rounded-2xl border border-border bg-surface-mint/60 p-4">
          {duplicateCandidates.length > 0 && (
            <div className="mb-4 space-y-3">
              <div>
                <p className="text-sm font-bold text-brand-deepTeal">Duplicate check</p>
                <p className="mt-1 text-xs leading-5 text-brand-deepTeal/60">Possible matches are for review only. Same-file duplicates are warnings, not merge targets.</p>
              </div>
              {duplicateCandidates.map((candidate) => (
                <DuplicateCandidateDetails
                  key={`${candidate.source}-${candidate.candidateId}`}
                  candidate={candidate}
                  isSelected={selectedMergeTargetId === candidate.candidateId}
                  onChoose={onChooseMergeTarget}
                />
              ))}
            </div>
          )}
          <label className="text-sm font-semibold text-brand-deepTeal">Merchant name<input value={row.merchantName} maxLength={80} onChange={(event) => onDetails({ merchantName: event.target.value, categoryId: row.categoryId, editType: "MERCHANT_EDIT" })} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" /></label>
          {hasDistinctDescription && <p className="mt-3 text-xs leading-5 text-brand-deepTeal/65"><span className="font-bold">Description with private details removed:</span> {row.description}</p>}
          <div className="mt-4 rounded-2xl bg-white p-3 text-xs leading-5 text-brand-deepTeal/70"><p className="font-bold text-brand-deepTeal">How we chose this</p><p className="mt-1">{suggestionLabels[row.suggestionSource]} · {row.suggestionConfidence.toLocaleLowerCase("en-AU")} confidence</p><p className="mt-1">{row.suggestionReason}</p></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ruleAvailable ? <button type="button" onClick={onSaveRule} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal bg-white px-4 text-xs font-bold text-brand-deepTeal"><Save aria-hidden="true" className="h-4 w-4" /> Save merchant rule</button> : <p className="rounded-2xl bg-white p-3 text-xs leading-5 text-brand-deepTeal/60">Check or change the category before saving this choice.</p>}
            <div className="rounded-2xl bg-white p-3"><label className="text-xs font-bold text-brand-deepTeal">Also use this for matching merchants<input value={alias} onChange={(event) => setAlias(event.target.value)} maxLength={80} placeholder="e.g. Woolies" className="mt-2 min-h-10 w-full rounded-xl border border-border px-3 text-sm" /></label><button type="button" disabled={!aliasAvailable} onClick={() => onSaveAlias(alias)} className="mt-2 min-h-10 w-full rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal disabled:cursor-not-allowed disabled:opacity-40">Save matching name</button></div>
          </div>
          <p className="mt-3 text-xs leading-5 text-brand-deepTeal/60">Saved choices keep only cleaned merchant names and category IDs on this device. Full bank descriptions and private account details stay excluded.</p>
        </div>
      )}
    </article>
  );
}

export function ImportReviewFoundation({ document, scan, autoStart = false }: { document: TransientCsvDocument; scan: CsvScanResult; autoStart?: boolean }) {
  const customCategoryCatalogue = useCustomCategoryCatalogue();
  const [reviewRows, setReviewRows] = useState<ImportReviewRow[] | null>(() => autoStart && scan.mappingIssues.length === 0 ? createTransientImportReviewRows(document, scan.columns, scan.mapping) : null);
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

  const summary = useMemo(() => summarizeImportReview(reviewRows ?? []), [reviewRows]);
  const duplicateCandidatesByRow = useMemo(() => {
    const candidatesByRow: Record<string, DuplicateCandidate[]> = {};
    if (!reviewRows) return candidatesByRow;
    reviewRows.forEach((row) => {
      candidatesByRow[row.id] = findImportDuplicateCandidates(row, reviewRows, manualTransactions);
    });
    return candidatesByRow;
  }, [manualTransactions, reviewRows]);
  const canStartReview = scan.mappingIssues.length === 0;

  function startReview() { setReviewRows(createTransientImportReviewRows(document, scan.columns, scan.mapping, merchantData)); setTaxMetadata({}); setMergeSelections({}); setApplyUndo(null); setNotice(""); }
  function resetReview() { setReviewRows(createTransientImportReviewRows(document, scan.columns, scan.mapping, merchantData)); setTaxMetadata({}); setMergeSelections({}); setApplyUndo(null); setNotice("Your current choices, tax flags and edits were reset. Saved suggestions and summary history were not changed."); }
  function updateAction(rowId: string, action: ImportReviewAction) {
    if (!reviewRows) return;
    if (action === "MERGE" && !window.confirm("Mark this row as Merge for review? This only marks your review choice. Nothing is saved yet.")) return;
    setReviewRows(updateImportReviewAction(reviewRows, rowId, action));
    if (action !== "MERGE") {
      setMergeSelections((current) => {
        const nextSelections = { ...current };
        delete nextSelections[rowId];
        return nextSelections;
      });
    }
    setNotice(action === "MERGE" ? "Merge marked for review only. Nothing is saved yet." : "");
  }
  function updateDetails(rowId: string, details: { merchantName: string; categoryId: string; editType: ImportReviewEditType }) { if (!reviewRows) return; try { setReviewRows(updateImportReviewDetails(reviewRows, rowId, details)); setNotice(""); } catch { setNotice("That merchant or category choice was not accepted because it was unsafe or unavailable."); } }
  function updateTaxFlag(rowId: string, isPotentiallyDeductible: boolean) { setTaxMetadata((current) => updateTaxReviewMetadata(current, rowId, isPotentiallyDeductible)); setNotice(""); }

  function chooseMergeTarget(row: ImportReviewRow, candidate: DuplicateCandidate) {
    if (!reviewRows) return;
    if (!window.confirm("Choose this existing manual transaction as the merge target? This only marks your review choice. Nothing is saved yet.")) return;
    try {
      const selection = createMergeTargetReviewSelection(row, candidate);
      setMergeSelections((current) => ({ ...current, [row.id]: selection }));
      setReviewRows(updateImportReviewAction(reviewRows, row.id, "MERGE"));
      setNotice("Merge target selected for review only. Nothing is saved yet.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Only existing manual transactions can be selected as merge targets.");
    }
  }

  function applySameMerchant(rowId: string) {
    if (!reviewRows) return;
    const result = applyCategoryToMatchingMerchants(reviewRows, rowId);
    setReviewRows(result.rows);
    setApplyUndo(result.undo);
    setNotice(result.affectedCount > 0 ? `Category applied to ${result.affectedCount} matching transaction${result.affectedCount === 1 ? "" : "s"}. Import, Skip and Merge choices were not changed.` : "No other eligible matching transactions were found.");
  }

  function undoApply() {
    if (!reviewRows || !applyUndo) return;
    setReviewRows(undoLastApplySameMerchant(reviewRows, applyUndo));
    setApplyUndo(null);
    setNotice("Last apply-to-same-merchant change undone.");
  }

  function persistMerchantData(nextData: LocalMerchantData, successNotice: string) {
    const saved = saveMerchantRulesToStorage(window.localStorage, nextData);
    setMerchantStorageAvailable(saved);
    setMerchantData(nextData);
    setReviewRows((current) => current ? applyMerchantSuggestionsToRows(current, nextData) : current);
    setNotice(saved ? successNotice : "Browser storage is unavailable. The merchant choice will last only while this review is open.");
  }

  function saveRule(row: ImportReviewRow, resolution?: MerchantConflictResolution) {
    if (!canSaveLocalMerchantRule(row)) { setNotice("Check or change the category before saving this choice for next time."); return; }
    try {
      const nextData = saveConfirmedMerchantRule(merchantData, { merchantName: row.merchantName, categoryId: row.categoryId, resolution });
      persistMerchantData(nextData, resolution === "KEEP_EXISTING" ? "The existing saved rule was kept." : "Merchant rule saved on this device. Future matches remain suggestions you can change.");
      setPendingConflict(null);
    } catch (error) {
      if (error instanceof MerchantConflictError) setPendingConflict({ kind: "RULE", rowId: row.id, conflict: error.conflict });
      else setNotice(error instanceof Error ? error.message : "This merchant rule could not be saved.");
    }
  }

  function saveAlias(row: ImportReviewRow, alias: string, resolution?: MerchantConflictResolution) {
    if (!isUsefulAlias(row, alias)) { setNotice("Enter a short, safe matching name that differs from the main merchant name."); return; }
    try {
      const nextData = saveMerchantAlias(merchantData, { alias, canonicalName: row.merchantName, categoryId: row.categoryId, resolution });
      persistMerchantData(nextData, resolution === "KEEP_EXISTING" ? "The existing saved match was kept." : "Matching merchant name saved on this device. Future matches remain suggestions you can change.");
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
    if (pendingConflict.kind === "RULE") saveRule(row, resolution);
    else saveAlias(row, pendingConflict.alias ?? "", resolution);
  }

  function clearMerchantRules() { const emptyData = emptyLocalMerchantData(); const saved = saveMerchantRulesToStorage(window.localStorage, emptyData); setMerchantStorageAvailable(saved); setMerchantData(emptyData); setReviewRows((current) => current ? applyMerchantSuggestionsToRows(current, emptyData) : current); setNotice(saved ? "Saved merchant suggestions cleared from this device." : "Browser storage is unavailable."); }
  function renameProfile(profileId: string, name: string) { persistMerchantData(renameMerchantProfile(merchantData, profileId, name), "Merchant name updated on this device."); }
  function renameAlias(aliasId: string, name: string, resolution?: MerchantConflictResolution) { persistMerchantData(renameMerchantAlias(merchantData, aliasId, name, resolution), resolution === "KEEP_EXISTING" ? "The existing matching name was kept." : "Matching merchant name updated on this device."); }
  function changeAliasActive(aliasId: string, isActive: boolean) { persistMerchantData(setMerchantAliasActive(merchantData, aliasId, isActive), isActive ? "Matching merchant name restored." : "Matching merchant name disabled."); }
  function removeAlias(aliasId: string) { persistMerchantData(deleteMerchantAlias(merchantData, aliasId), "Matching merchant name deleted from this device."); }
  function changeRuleActive(ruleId: string, isActive: boolean) { persistMerchantData(setMerchantRuleActive(merchantData, ruleId, isActive), isActive ? "Merchant rule restored." : "Merchant rule disabled."); }
  function removeRule(ruleId: string) { persistMerchantData(deleteMerchantRule(merchantData, ruleId), "Merchant rule deleted from this device."); }

  function saveSummaryOnly() { if (!reviewRows) return; const entry = createImportHistoryEntry(summary); const nextEntries = addImportHistoryEntry(historyEntries, entry); const saved = saveImportHistoryToStorage(window.localStorage, nextEntries); setStorageAvailable(saved); if (saved) { setHistoryEntries(nextEntries); setNotice("Review summary saved on this device. No file rows, tax flags or transactions were saved."); } else setNotice("Browser storage is unavailable. The review stays open, but no summary was saved."); }
  function clearHistory() { const saved = saveImportHistoryToStorage(window.localStorage, []); setStorageAvailable(saved); if (saved) { setHistoryEntries([]); setNotice("Review summaries cleared from this device."); } }

  return (
    <div className="space-y-5">
      {!reviewRows ? (
        <section className="rounded-3xl border border-border bg-surface-mint p-5 sm:p-6"><div className="flex items-start gap-3"><ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" /><div><p className="font-bold text-brand-deepTeal">Ready to review</p><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Check each transaction, choose a category, optionally mark it as potentially deductible and select Import, Skip or Merge. Nothing creates transactions.</p></div></div><button type="button" onClick={startReview} disabled={!canStartReview} className="mt-4 min-h-12 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-brand-deepTeal/20 disabled:text-brand-deepTeal/55">{canStartReview ? "Check your transactions" : "Finish matching columns first"}</button></section>
      ) : (
        <>
          <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="review-summary-heading"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-brand-teal">Review before saving</p><h2 id="review-summary-heading" className="mt-1 text-2xl font-bold text-brand-deepTeal">Check your transactions</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-brand-deepTeal/70">Check the category, optional tax record-keeping flag and intended action. Your choices are not saved as transactions.</p></div><div className="flex flex-wrap gap-2">{applyUndo && <button type="button" onClick={undoApply} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal"><Undo2 aria-hidden="true" className="h-4 w-4" /> Undo last apply</button>}<button type="button" onClick={resetReview} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal"><RotateCcw aria-hidden="true" className="h-4 w-4" /> Reset review</button></div></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">{[["Transactions", summary.totalRows], ["Import", summary.importCount], ["Skip", summary.skipCount], ["Merge", summary.mergeCount], ["Check", summary.warningCount]].map(([label, value]) => <div key={label} className="rounded-2xl bg-surface-mint p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">{label}</p><p className="mt-1 text-2xl font-bold text-brand-deepTeal">{value}</p></div>)}</div>{pendingConflict && <div className="mt-5"><MerchantConflictPrompt conflict={pendingConflict.conflict} onChoose={resolveConflict} /></div>}</section>
          <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="review-rows-heading"><div><h2 id="review-rows-heading" className="text-xl font-bold text-brand-deepTeal">Transactions to review</h2><p className="mt-2 text-sm text-brand-deepTeal/65">Scroll through all {reviewRows.length} transaction{reviewRows.length === 1 ? "" : "s"} in one continuous list.</p>{manualRecovered && <p className="mt-2 rounded-2xl bg-warning-amber/10 p-3 text-sm font-semibold text-brand-deepTeal">Unreadable manual transactions on this device were ignored for duplicate checks.</p>}{!manualStorageAvailable && <p className="mt-2 rounded-2xl bg-warning-amber/10 p-3 text-sm font-semibold text-brand-deepTeal">Browser storage is unavailable, so existing manual transactions cannot be checked right now.</p>}</div><div className="mt-5 space-y-4">{reviewRows.map((row) => <ReviewRowCard key={row.id} row={row} customCategories={customCategoryCatalogue.categories} matchingRowCount={countApplySameMerchantMatches(reviewRows, row.id)} duplicateCandidates={duplicateCandidatesByRow[row.id] ?? []} selectedMergeTargetId={mergeSelections[row.id]?.targetTransactionId} isPotentiallyDeductible={isRowPotentiallyDeductible(taxMetadata, row.id)} onAction={(action) => updateAction(row.id, action)} onDetails={(details) => updateDetails(row.id, details)} onCreateCategory={customCategoryCatalogue.create} onTaxChange={(value) => updateTaxFlag(row.id, value)} onApplySameMerchant={() => applySameMerchant(row.id)} onChooseMergeTarget={(candidate) => chooseMergeTarget(row, candidate)} onSaveRule={() => saveRule(row)} onSaveAlias={(alias) => saveAlias(row, alias)} />)}</div></section>
          <section className="rounded-[2rem] border border-brand-green bg-surface-mint p-5 sm:p-6"><div className="flex items-start gap-3"><Archive aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" /><div><h2 className="text-xl font-bold text-brand-deepTeal">Save review summary only</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">This stores only the time, status and total action counts on this device—never transactions, tax flags, descriptions, categories, amounts or private account details.</p></div></div><button type="button" onClick={saveSummaryOnly} className="mt-4 min-h-12 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white">Save summary on this device</button></section>
        </>
      )}

      <CustomCategoryManager categories={customCategoryCatalogue.categories} storageAvailable={customCategoryCatalogue.storageAvailable} recoveredFromCorruption={customCategoryCatalogue.recoveredFromCorruption} unsupportedVersion={customCategoryCatalogue.unsupportedVersion} notice={customCategoryCatalogue.notice} onRename={customCategoryCatalogue.rename} onArchiveChange={customCategoryCatalogue.setArchived} />
      <MerchantRuleManager data={merchantData} storageAvailable={merchantStorageAvailable} recoveredFromCorruption={merchantRecovered} migrated={merchantMigrated} staleReferenceCount={merchantStaleReferenceCount} onRenameProfile={renameProfile} onRenameAlias={renameAlias} onAliasActiveChange={changeAliasActive} onDeleteAlias={removeAlias} onRuleActiveChange={changeRuleActive} onDeleteRule={removeRule} onClear={clearMerchantRules} />

      <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="import-history-heading"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><History aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" /><div><h2 id="import-history-heading" className="text-xl font-bold text-brand-deepTeal">Recent review summaries</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Summary counts only. This is not saved import history, cloud sync or account storage.</p></div></div>{historyEntries.length > 0 && <button type="button" onClick={clearHistory} className="min-h-12 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal">Clear summaries</button>}</div>{!storageAvailable && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Browser storage is unavailable. You can still finish this review while the page is open.</p>}{historyRecovered && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Unreadable saved summaries were ignored and safely reset.</p>}{notice && <p role="status" className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">{notice}</p>}<div className="mt-4 space-y-3">{historyEntries.length === 0 ? <div className="rounded-2xl bg-surface-mint p-4"><p className="font-bold text-brand-deepTeal">No review summaries saved</p><p className="mt-1 text-sm text-brand-deepTeal/65">After checking your transactions, you can optionally save the total counts only.</p></div> : historyEntries.map((entry) => <article key={entry.id} className="rounded-2xl border border-border p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-bold text-brand-deepTeal">Review summary</p><p className="mt-1 text-xs text-brand-deepTeal/60">{formatHistoryTimestamp(entry.createdAt)}</p></div><span className="rounded-full bg-surface-mint px-3 py-1.5 text-xs font-bold text-brand-teal">Summary saved</span></div><p className="mt-3 text-sm text-brand-deepTeal/70">{entry.totalRows} transactions · {entry.importCount} Import · {entry.skipCount} Skip · {entry.mergeCount} Merge · {entry.warningCount} to check</p></article>)}</div></section>
      <section className="rounded-3xl border border-border bg-surface-mint p-5"><p className="flex items-center gap-2 font-bold text-brand-deepTeal"><CheckCircle2 aria-hidden="true" className="h-5 w-5 text-brand-green" /> Your privacy</p><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Nothing is uploaded or saved as a transaction. Private account details stay hidden. Tax choices and duplicate checks are for review only.</p></section>
    </div>
  );
}
