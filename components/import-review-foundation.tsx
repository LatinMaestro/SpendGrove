"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  History,
  Link2,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { formatAudFromCents } from "@/lib/money";
import { manualCategories } from "@/lib/manual-categories";
import type { CsvScanResult, TransientCsvDocument } from "@/lib/csv-import";
import {
  addImportHistoryEntry,
  applyCategoryToSameMerchant,
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
  emptyLocalMerchantData,
  loadMerchantRulesFromStorage,
  normalizeMerchantName,
  saveConfirmedMerchantRule,
  saveMerchantAlias,
  saveMerchantRulesToStorage,
  type LocalMerchantData,
  type MerchantSuggestionSource,
} from "@/lib/merchant-rules";

const REVIEW_PAGE_SIZE = 20;
const genericAliasKeys = new Set(["payment", "bank transfer", "transfer", "loan repayment", "salary", "refund"]);

const reviewActions: Array<{ value: ImportReviewAction; label: string }> = [
  { value: "IMPORT", label: "Import" },
  { value: "SKIP", label: "Skip" },
  { value: "MERGE", label: "Merge" },
];

const suggestionLabels: Record<MerchantSuggestionSource, string> = {
  USER_RULE: "Local rule",
  USER_ALIAS: "Local alias",
  KEYWORD: "Local suggestion",
  FALLBACK: "Manual review",
};

const importCategorySections = [
  { sourceGroup: "Everyday spending", label: "Everyday" },
  { sourceGroup: "Bills and household", label: "Bills and household" },
  { sourceGroup: "Financial", label: "Financial / transfers" },
  { sourceGroup: "Income", label: "Income / refunds" },
  { sourceGroup: "Work and tax", label: "Work / tax" },
  { sourceGroup: "Review", label: "Review" },
] as const;

const categoryGroups = importCategorySections.map((section) => ({
  label: section.label,
  categories: manualCategories.filter((category) => category.group === section.sourceGroup),
}));

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

function canSaveAlias(row: ImportReviewRow) {
  if (!row.merchantEdited || !row.description) return false;
  try {
    const aliasKey = normalizeMerchantName(row.description);
    const canonicalKey = normalizeMerchantName(row.merchantName);
    return aliasKey !== canonicalKey && !genericAliasKeys.has(aliasKey);
  } catch {
    return false;
  }
}

function reviewStatusText(row: ImportReviewRow) {
  if (row.reviewState === "MANUALLY_REVIEWED") return "Manually reviewed";
  if (row.reviewState === "CONFIRMED_SUGGESTION") return "Category checked";
  if (row.reviewState === "APPLIED_TO_MATCH") return "Applied to matching merchant";
  return "";
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
        ? "border-brand-green bg-surface-mint text-brand-deepTeal"
        : "border-border bg-white text-brand-deepTeal/70"
      }`}
    >
      {action.label}
    </button>
  );
}

function CategorySelector({
  row,
  onDetails,
}: {
  row: ImportReviewRow;
  onDetails(details: { merchantName: string; categoryId: string; editType: ImportReviewEditType }): void;
}) {
  const meaningfulSuggestion = row.suggestionSource !== "FALLBACK" && row.suggestionConfidence !== "LOW";

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`category-${row.id}`} className="text-sm font-bold text-brand-deepTeal">Category</label>
        {meaningfulSuggestion && !row.categoryConfirmed && (
          <button
            type="button"
            onClick={() => onDetails({ merchantName: row.merchantName, categoryId: row.categoryId, editType: "CONFIRM_SUGGESTION" })}
            className="text-xs font-bold text-brand-teal underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            Use this category
          </button>
        )}
      </div>
      <select
        id={`category-${row.id}`}
        value={row.categoryId}
        onChange={(event) => onDetails({ merchantName: row.merchantName, categoryId: event.target.value, editType: "CATEGORY_EDIT" })}
        className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
      >
        {categoryGroups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <p className="mt-1 text-xs text-brand-deepTeal/55">Full Phase 1 catalogue, including transfer, financial, income/refund and work/tax categories.</p>
    </div>
  );
}

function ReviewRowCard({
  row,
  onAction,
  onDetails,
  onApplySameMerchant,
  onSaveRule,
  onSaveAlias,
}: {
  row: ImportReviewRow;
  onAction(action: ImportReviewAction): void;
  onDetails(details: { merchantName: string; categoryId: string; editType: ImportReviewEditType }): void;
  onApplySameMerchant(): void;
  onSaveRule(): void;
  onSaveAlias(): void;
}) {
  const [showMore, setShowMore] = useState(false);
  const meaningfulSuggestion = row.suggestionSource !== "FALLBACK" && row.suggestionConfidence !== "LOW";
  const aliasAvailable = canSaveAlias(row);
  const statusText = reviewStatusText(row);
  const currentCategory = manualCategories.find((category) => category.id === row.categoryId);
  const hasDistinctDescription = row.description && row.description !== row.merchantName;

  return (
    <article className="rounded-3xl border border-border bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-bold text-brand-deepTeal">{row.merchantName || "Payment"}</p>
          <p className="mt-1 text-sm text-brand-deepTeal/60">{formatReviewDate(row.date)} · CSV row {row.rowNumber}</p>
        </div>
        <p className="shrink-0 font-bold text-brand-deepTeal">
          {row.amountCents === null ? "Review amount" : formatAudFromCents(row.amountCents)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-3 py-1.5 font-bold ${meaningfulSuggestion ? "bg-surface-mint text-brand-teal" : "bg-warning-amber/10 text-brand-deepTeal"}`}>
          {meaningfulSuggestion ? `${suggestionLabels[row.suggestionSource]}: ${currentCategory?.name ?? "Review category"}` : "Choose a category"}
        </span>
        {statusText && <span className="font-bold text-brand-green">{statusText}</span>}
        {row.warningCodes.length > 0 && <span className="font-semibold text-warning-amber">Row needs review</span>}
      </div>

      <CategorySelector row={row} onDetails={onDetails} />

      {row.categoryConfirmed && (
        <button
          type="button"
          onClick={onApplySameMerchant}
          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green"
        >
          <Link2 aria-hidden="true" className="h-4 w-4" /> Apply to same merchant
        </button>
      )}

      <fieldset className="mt-4">
        <legend className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">Intended action</legend>
        <div className="mt-2 grid grid-cols-3 gap-1 rounded-2xl bg-surface-mint p-1">
          {reviewActions.map((action) => (
            <ActionButton
              key={action.value}
              action={action}
              selected={row.action === action.value}
              onClick={() => onAction(action.value)}
            />
          ))}
        </div>
        {row.action === "MERGE" && (
          <p className="mt-2 text-xs leading-5 text-brand-deepTeal/60">Merge is an intention only; no transaction is matched or changed.</p>
        )}
      </fieldset>

      <button
        type="button"
        onClick={() => setShowMore((current) => !current)}
        aria-expanded={showMore}
        className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-green"
      >
        {showMore ? <ChevronUp aria-hidden="true" className="h-4 w-4" /> : <ChevronDown aria-hidden="true" className="h-4 w-4" />}
        {showMore ? "Hide options" : "More options"}
      </button>

      {showMore && (
        <div className="mt-3 rounded-2xl border border-border bg-surface-mint/60 p-4">
          <label className="text-sm font-semibold text-brand-deepTeal">
            Safe merchant label
            <input
              value={row.merchantName}
              maxLength={120}
              onChange={(event) => onDetails({ merchantName: event.target.value, categoryId: row.categoryId, editType: "MERCHANT_EDIT" })}
              className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
            />
          </label>
          {hasDistinctDescription && (
            <p className="mt-3 text-xs leading-5 text-brand-deepTeal/65"><span className="font-bold">Sanitised description:</span> {row.description}</p>
          )}

          <div className="mt-4 rounded-2xl bg-white p-3 text-xs leading-5 text-brand-deepTeal/70">
            <p className="font-bold text-brand-deepTeal">Suggestion details</p>
            <p className="mt-1">{suggestionLabels[row.suggestionSource]} · {row.suggestionConfidence.toLocaleLowerCase("en-AU")} confidence</p>
            <p className="mt-1">{row.suggestionReason}</p>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" disabled={!row.categoryConfirmed} onClick={onSaveRule} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal bg-white px-4 text-xs font-bold text-brand-deepTeal disabled:cursor-not-allowed disabled:opacity-40">
              <Save aria-hidden="true" className="h-4 w-4" /> Save local rule
            </button>
            <button type="button" disabled={!row.categoryConfirmed || !aliasAvailable} onClick={onSaveAlias} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal bg-white px-4 text-xs font-bold text-brand-deepTeal disabled:cursor-not-allowed disabled:opacity-40">
              <Save aria-hidden="true" className="h-4 w-4" /> Save local alias
            </button>
          </div>

          {!row.categoryConfirmed ? (
            <p className="mt-2 text-xs leading-5 text-brand-deepTeal/60">Check or change the category before saving a local rule.</p>
          ) : !aliasAvailable ? (
            <p className="mt-2 text-xs leading-5 text-brand-deepTeal/60">Save alias is available only after a meaningful safe merchant rename with a distinct non-generic alias.</p>
          ) : null}
          <p className="mt-3 text-xs leading-5 text-brand-deepTeal/60">Privacy note: only cleaned merchant helpers and category choices can be stored locally. Raw descriptions and private banking identifiers remain excluded.</p>
        </div>
      )}
    </article>
  );
}

export function ImportReviewFoundation({
  document,
  scan,
}: {
  document: TransientCsvDocument;
  scan: CsvScanResult;
}) {
  const [reviewRows, setReviewRows] = useState<ImportReviewRow[] | null>(null);
  const [historyEntries, setHistoryEntries] = useState<ImportHistoryEntry[]>([]);
  const [merchantData, setMerchantData] = useState<LocalMerchantData>(emptyLocalMerchantData());
  const [historyRecovered, setHistoryRecovered] = useState(false);
  const [merchantRecovered, setMerchantRecovered] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [merchantStorageAvailable, setMerchantStorageAvailable] = useState(true);
  const [page, setPage] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const history = loadImportHistoryFromStorage(window.localStorage);
    const merchants = loadMerchantRulesFromStorage(window.localStorage);
    setHistoryEntries(history.entries);
    setHistoryRecovered(history.recoveredFromCorruption);
    setStorageAvailable(history.storageAvailable);
    setMerchantData(merchants.data);
    setMerchantRecovered(merchants.recoveredFromCorruption);
    setMerchantStorageAvailable(merchants.storageAvailable);
  }, []);

  const summary = useMemo(
    () => summarizeImportReview(reviewRows ?? []),
    [reviewRows],
  );
  const pageCount = reviewRows ? Math.max(1, Math.ceil(reviewRows.length / REVIEW_PAGE_SIZE)) : 1;
  const visibleRows = reviewRows?.slice(page * REVIEW_PAGE_SIZE, (page + 1) * REVIEW_PAGE_SIZE) ?? [];
  const canStartReview = scan.mappingIssues.length === 0;

  function startReview() {
    setReviewRows(createTransientImportReviewRows(document, scan.columns, scan.mapping, merchantData));
    setPage(0);
    setNotice("");
  }

  function resetReview() {
    setReviewRows(createTransientImportReviewRows(document, scan.columns, scan.mapping, merchantData));
    setPage(0);
    setNotice("Transient row choices and edits were reset. Saved local rules and summary history were not changed.");
  }

  function updateAction(rowId: string, action: ImportReviewAction) {
    if (!reviewRows) return;
    setReviewRows(updateImportReviewAction(reviewRows, rowId, action));
    setNotice("");
  }

  function updateDetails(rowId: string, details: { merchantName: string; categoryId: string; editType: ImportReviewEditType }) {
    if (!reviewRows) return;
    try {
      setReviewRows(updateImportReviewDetails(reviewRows, rowId, details));
      setNotice("");
    } catch {
      setNotice("That merchant label contained private-looking information and was not accepted.");
    }
  }

  function applySameMerchant(rowId: string) {
    if (!reviewRows) return;
    setReviewRows(applyCategoryToSameMerchant(reviewRows, rowId));
    setNotice("Category applied to every matching canonical merchant in this transient review.");
  }

  function persistMerchantData(nextData: LocalMerchantData, successNotice: string) {
    const saved = saveMerchantRulesToStorage(window.localStorage, nextData);
    setMerchantStorageAvailable(saved);
    setMerchantData(nextData);
    setReviewRows((current) => current ? applyMerchantSuggestionsToRows(current, nextData) : current);
    setNotice(saved
      ? successNotice
      : "Browser storage is unavailable. The merchant choice remains available only in this transient review.");
  }

  function saveRule(row: ImportReviewRow) {
    try {
      const nextData = saveConfirmedMerchantRule(merchantData, {
        merchantName: row.merchantName,
        categoryId: row.categoryId,
      });
      persistMerchantData(nextData, "Privacy-safe merchant rule saved in this browser. Future matches remain suggestions.");
    } catch {
      setNotice("This merchant rule could not be saved because it was unsafe or incomplete.");
    }
  }

  function saveAlias(row: ImportReviewRow) {
    try {
      const nextData = saveMerchantAlias(merchantData, {
        alias: row.description,
        canonicalName: row.merchantName,
        categoryId: row.categoryId,
      });
      persistMerchantData(nextData, "Privacy-safe merchant alias saved in this browser. Future matches remain suggestions.");
    } catch {
      setNotice("This alias could not be saved because it matched the merchant name or contained unsafe information.");
    }
  }

  function clearMerchantRules() {
    const emptyData = emptyLocalMerchantData();
    const saved = saveMerchantRulesToStorage(window.localStorage, emptyData);
    setMerchantStorageAvailable(saved);
    setMerchantData(emptyData);
    setReviewRows((current) => current ? applyMerchantSuggestionsToRows(current, emptyData) : current);
    setNotice(saved ? "Browser-local merchant rules and aliases cleared." : "Browser storage is unavailable.");
  }

  function saveSummaryOnly() {
    if (!reviewRows) return;
    const entry = createImportHistoryEntry(summary);
    const nextEntries = addImportHistoryEntry(historyEntries, entry);
    const saved = saveImportHistoryToStorage(window.localStorage, nextEntries);
    setStorageAvailable(saved);
    if (saved) {
      setHistoryEntries(nextEntries);
      setNotice("Review summary saved locally. No CSV rows or transactions were saved.");
    } else {
      setNotice("Browser storage is unavailable. The review remains transient and no summary was saved.");
    }
  }

  function clearHistory() {
    const saved = saveImportHistoryToStorage(window.localStorage, []);
    setStorageAvailable(saved);
    if (saved) {
      setHistoryEntries([]);
      setNotice("Browser-local review summaries cleared.");
    }
  }

  return (
    <div className="space-y-5">
      {!reviewRows ? (
        <section className="rounded-3xl border border-border bg-surface-mint p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
            <div>
              <p className="font-bold text-brand-deepTeal">Review-before-commit foundation</p>
              <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Review each sanitised row, check its category and choose Import, Skip or Merge. Local merchant helpers stay optional and nothing creates transactions.</p>
            </div>
          </div>
          <button type="button" onClick={startReview} disabled={!canStartReview} className="mt-4 min-h-12 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-green disabled:cursor-not-allowed disabled:bg-brand-deepTeal/20 disabled:text-brand-deepTeal/55">
            {canStartReview ? "Review sanitised rows" : "Complete mapping before review"}
          </button>
        </section>
      ) : (
        <>
          <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="review-summary-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-teal">Non-committing prototype</p>
                <h2 id="review-summary-heading" className="mt-1 text-2xl font-bold text-brand-deepTeal">Review intended row actions</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-deepTeal/70">Check the merchant and category, choose Import, Skip or Merge, then move to the next row. All choices remain in this browser review only.</p>
              </div>
              <button type="button" onClick={resetReview} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green"><RotateCcw aria-hidden="true" className="h-4 w-4" /> Reset review</button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[["Rows", summary.totalRows], ["Import", summary.importCount], ["Skip", summary.skipCount], ["Merge", summary.mergeCount], ["Warnings", summary.warningCount]].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-surface-mint p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">{label}</p><p className="mt-1 text-2xl font-bold text-brand-deepTeal">{value}</p></div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="review-rows-heading">
            <div className="flex items-end justify-between gap-4">
              <div><h2 id="review-rows-heading" className="text-xl font-bold text-brand-deepTeal">Sanitised review rows</h2><p className="mt-2 text-sm text-brand-deepTeal/65">Page {page + 1} of {pageCount} · up to {REVIEW_PAGE_SIZE} rows per page</p></div>
              <div className="flex gap-2">
                <button type="button" aria-label="Previous review page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-teal text-brand-deepTeal disabled:opacity-30"><ChevronLeft aria-hidden="true" className="h-5 w-5" /></button>
                <button type="button" aria-label="Next review page" disabled={page >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-teal text-brand-deepTeal disabled:opacity-30"><ChevronRight aria-hidden="true" className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {visibleRows.map((row) => <ReviewRowCard key={row.id} row={row} onAction={(action) => updateAction(row.id, action)} onDetails={(details) => updateDetails(row.id, details)} onApplySameMerchant={() => applySameMerchant(row.id)} onSaveRule={() => saveRule(row)} onSaveAlias={() => saveAlias(row)} />)}
            </div>
          </section>

          <section className="rounded-[2rem] border border-brand-green bg-surface-mint p-5 sm:p-6">
            <div className="flex items-start gap-3"><Archive aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" /><div><h2 className="text-xl font-bold text-brand-deepTeal">Save review summary only</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">This stores only timestamp, status and aggregate action counts in this browser—never filenames, rows, descriptions, merchants, categories, amounts or private identifiers.</p></div></div>
            <button type="button" onClick={saveSummaryOnly} className="mt-4 min-h-12 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-green">Save local summary</button>
          </section>
        </>
      )}

      <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="merchant-rules-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3"><Sparkles aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" /><div><h2 id="merchant-rules-heading" className="text-xl font-bold text-brand-deepTeal">Browser-local merchant helpers</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">{merchantData.rules.length} rules and {merchantData.aliases.length} aliases. Optional helpers are stored as cleaned names and category choices only.</p></div></div>
          {(merchantData.rules.length > 0 || merchantData.aliases.length > 0) && <button type="button" onClick={clearMerchantRules} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal"><Trash2 aria-hidden="true" className="h-4 w-4" /> Clear local helpers</button>}
        </div>
        {!merchantStorageAvailable && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Browser storage is unavailable. Merchant suggestions still work, but new rules cannot persist.</p>}
        {merchantRecovered && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Invalid local merchant data was ignored and safely reset.</p>}
      </section>

      <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="import-history-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3"><History aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" /><div><h2 id="import-history-heading" className="text-xl font-bold text-brand-deepTeal">Browser-local review history</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Safe summary metadata only. This is not saved import history, cloud sync or account storage.</p></div></div>
          {historyEntries.length > 0 && <button type="button" onClick={clearHistory} className="min-h-12 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal">Clear summaries</button>}
        </div>
        {!storageAvailable && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Browser storage is unavailable. Review rows still work transiently.</p>}
        {historyRecovered && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Invalid local history was ignored and safely reset.</p>}
        {notice && <p role="status" className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">{notice}</p>}
        <div className="mt-4 space-y-3">
          {historyEntries.length === 0 ? <div className="rounded-2xl bg-surface-mint p-4"><p className="font-bold text-brand-deepTeal">No review summaries saved</p><p className="mt-1 text-sm text-brand-deepTeal/65">Complete a transient review, then optionally save aggregate counts only.</p></div> : historyEntries.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-border p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-bold text-brand-deepTeal">Review summary</p><p className="mt-1 text-xs text-brand-deepTeal/60">{formatHistoryTimestamp(entry.createdAt)}</p></div><span className="rounded-full bg-surface-mint px-3 py-1.5 text-xs font-bold text-brand-teal">Summary saved</span></div><p className="mt-3 text-sm text-brand-deepTeal/70">{entry.totalRows} rows · {entry.importCount} Import · {entry.skipCount} Skip · {entry.mergeCount} Merge · {entry.warningCount} warnings</p></article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface-mint p-5"><p className="flex items-center gap-2 font-bold text-brand-deepTeal"><CheckCircle2 aria-hidden="true" className="h-5 w-5 text-brand-green" /> Task 1.7 safety boundary</p><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Merchant helpers remain local and optional. No row action commits, transaction creation, database writes, raw-row storage, server upload, Basiq, AI or third-party processing occur.</p></section>
    </div>
  );
}
