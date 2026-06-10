"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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

const reviewActions: Array<{
  value: ImportReviewAction;
  label: string;
  description: string;
}> = [
  { value: "IMPORT", label: "Import", description: "Intend to add later" },
  { value: "SKIP", label: "Skip", description: "Leave out later" },
  { value: "MERGE", label: "Merge", description: "Match later" },
];

const suggestionLabels: Record<MerchantSuggestionSource, string> = {
  USER_RULE: "Your local rule",
  USER_ALIAS: "Your local alias",
  KEYWORD: "Local keyword",
  FALLBACK: "Needs review",
};

const categoryGroups = Array.from(new Set(manualCategories.map((category) => category.group))).map((group) => ({
  group,
  categories: manualCategories.filter((category) => category.group === group),
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
  try {
    return normalizeMerchantName(row.description || "Payment") !== normalizeMerchantName(row.merchantName);
  } catch {
    return false;
  }
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
      className={`min-h-12 rounded-2xl border px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-brand-green ${selected
        ? "border-brand-green bg-surface-mint text-brand-deepTeal"
        : "border-border bg-white text-brand-deepTeal/70"
      }`}
    >
      <span className="block text-sm font-bold">{action.label}</span>
      <span className="mt-0.5 block text-[11px]">{action.description}</span>
    </button>
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
  onDetails(details: { merchantName: string; categoryId: string }): void;
  onApplySameMerchant(): void;
  onSaveRule(): void;
  onSaveAlias(): void;
}) {
  const aliasAvailable = canSaveAlias(row);

  return (
    <article className="rounded-3xl border border-border bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">CSV row {row.rowNumber}</p>
          <p className="mt-1 font-bold text-brand-deepTeal">{row.description || "Payment"}</p>
          <p className="mt-1 text-sm text-brand-deepTeal/65">{formatReviewDate(row.date)}</p>
        </div>
        <p className="font-bold text-brand-deepTeal">
          {row.amountCents === null ? "Amount needs review" : formatAudFromCents(row.amountCents)}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-brand-green/40 bg-surface-mint p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-teal">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" /> Suggestion
          </span>
          <span className="text-xs font-bold text-brand-deepTeal">{suggestionLabels[row.suggestionSource]}</span>
          <span className="text-xs text-brand-deepTeal/60">{row.suggestionConfidence.toLocaleLowerCase("en-AU")} confidence</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-brand-deepTeal/70">{row.suggestionReason} Suggestions are never final and can be changed below.</p>
        {row.categoryConfirmed ? (
          <p className="mt-2 text-xs font-bold text-brand-green">Reviewed in this transient import.</p>
        ) : (
          <button type="button" onClick={() => onDetails({ merchantName: row.merchantName, categoryId: row.categoryId })} className="mt-3 min-h-10 rounded-full border border-brand-teal bg-white px-4 text-xs font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
            Confirm this suggestion
          </button>
        )}
      </div>

      <fieldset className="mt-4">
        <legend className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">Intended action only</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
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
          <p className="mt-2 rounded-2xl bg-warning-amber/10 p-3 text-xs leading-5 text-brand-deepTeal/75">
            Merge is a review intention only. No match is selected and no transaction is changed in this task.
          </p>
        )}
      </fieldset>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-brand-deepTeal">
          Safe merchant label
          <input
            value={row.merchantName}
            maxLength={120}
            onChange={(event) => onDetails({ merchantName: event.target.value, categoryId: row.categoryId })}
            className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          />
          <span className="mt-1 block text-xs font-normal text-brand-deepTeal/60">Private-looking identifiers are removed before this transient value is accepted.</span>
        </label>
        <label className="text-sm font-semibold text-brand-deepTeal">
          Category
          <select
            value={row.categoryId}
            onChange={(event) => onDetails({ merchantName: row.merchantName, categoryId: event.target.value })}
            className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          >
            {categoryGroups.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <span className="mt-1 block text-xs font-normal text-brand-deepTeal/60">This edit remains in the current browser review only.</span>
        </label>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button type="button" disabled={!row.categoryConfirmed} onClick={onApplySameMerchant} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal disabled:cursor-not-allowed disabled:opacity-40">
          <Link2 aria-hidden="true" className="h-4 w-4" /> Apply to same merchant
        </button>
        <button type="button" disabled={!row.categoryConfirmed} onClick={onSaveRule} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal disabled:cursor-not-allowed disabled:opacity-40">
          <Save aria-hidden="true" className="h-4 w-4" /> Save local rule
        </button>
        <button type="button" disabled={!row.categoryConfirmed || !aliasAvailable} onClick={onSaveAlias} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal disabled:cursor-not-allowed disabled:opacity-40">
          <Save aria-hidden="true" className="h-4 w-4" /> Save local alias
        </button>
      </div>
      <p className="mt-2 text-xs leading-5 text-brand-deepTeal/60">Confirm or edit the suggestion before applying or saving it. Local rules speed up future reviews but remain suggestions.</p>

      {row.warningCodes.length > 0 && (
        <p className="mt-4 text-xs font-semibold text-warning-amber">
          Needs review: {row.warningCodes.join(", ").replaceAll("_", " ").toLocaleLowerCase("en-AU")}
        </p>
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

  function updateDetails(rowId: string, details: { merchantName: string; categoryId: string }) {
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
    setNotice("Category applied to matching cleaned merchants in this transient review only.");
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
        alias: row.description || "Payment",
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
              <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">
                Continue to review sanitised rows and choose intended Import, Skip or Merge actions. Local merchant suggestions may help, but every suggestion requires review and nothing creates transactions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={startReview}
            disabled={!canStartReview}
            className="mt-4 min-h-12 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-green disabled:cursor-not-allowed disabled:bg-brand-deepTeal/20 disabled:text-brand-deepTeal/55"
          >
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
                <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-deepTeal/70">
                  Sanitised rows can receive local merchant and category suggestions. Suggestions stay reviewable; Import, Skip and Merge remain intentions in memory only.
                </p>
              </div>
              <button type="button" onClick={resetReview} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
                <RotateCcw aria-hidden="true" className="h-4 w-4" /> Reset review
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                ["Rows", summary.totalRows],
                ["Import", summary.importCount],
                ["Skip", summary.skipCount],
                ["Merge", summary.mergeCount],
                ["Warnings", summary.warningCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-surface-mint p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-brand-deepTeal">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="review-rows-heading">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="review-rows-heading" className="text-xl font-bold text-brand-deepTeal">Sanitised review rows</h2>
                <p className="mt-2 text-sm text-brand-deepTeal/65">Page {page + 1} of {pageCount} · up to {REVIEW_PAGE_SIZE} rows per page</p>
              </div>
              <div className="flex gap-2">
                <button type="button" aria-label="Previous review page" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-teal text-brand-deepTeal disabled:opacity-30"><ChevronLeft aria-hidden="true" className="h-5 w-5" /></button>
                <button type="button" aria-label="Next review page" disabled={page >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-teal text-brand-deepTeal disabled:opacity-30"><ChevronRight aria-hidden="true" className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {visibleRows.map((row) => (
                <ReviewRowCard
                  key={row.id}
                  row={row}
                  onAction={(action) => updateAction(row.id, action)}
                  onDetails={(details) => updateDetails(row.id, details)}
                  onApplySameMerchant={() => applySameMerchant(row.id)}
                  onSaveRule={() => saveRule(row)}
                  onSaveAlias={() => saveAlias(row)}
                />
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-brand-green bg-surface-mint p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Archive aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
              <div>
                <h2 className="text-xl font-bold text-brand-deepTeal">Save review summary only</h2>
                <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">
                  This stores only the timestamp, status and aggregate action counts in this browser. It never stores filenames, rows, descriptions, merchants, categories, amounts or private identifiers.
                </p>
              </div>
            </div>
            <button type="button" onClick={saveSummaryOnly} className="mt-4 min-h-12 rounded-full bg-brand-deepTeal px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-green">Save local summary</button>
          </section>
        </>
      )}

      <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="merchant-rules-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" />
            <div>
              <h2 id="merchant-rules-heading" className="text-xl font-bold text-brand-deepTeal">Browser-local merchant helpers</h2>
              <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">{merchantData.rules.length} rules and {merchantData.aliases.length} aliases. Stored locally as cleaned names and category choices only—never raw bank descriptions.</p>
            </div>
          </div>
          {(merchantData.rules.length > 0 || merchantData.aliases.length > 0) && (
            <button type="button" onClick={clearMerchantRules} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal">
              <Trash2 aria-hidden="true" className="h-4 w-4" /> Clear local helpers
            </button>
          )}
        </div>
        {!merchantStorageAvailable && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Browser storage is unavailable. Merchant suggestions still work, but new rules cannot persist.</p>}
        {merchantRecovered && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Invalid local merchant data was ignored and safely reset.</p>}
      </section>

      <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="import-history-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <History aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" />
            <div>
              <h2 id="import-history-heading" className="text-xl font-bold text-brand-deepTeal">Browser-local review history</h2>
              <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Safe summary metadata only. This is not saved import history, cloud sync or account storage.</p>
            </div>
          </div>
          {historyEntries.length > 0 && <button type="button" onClick={clearHistory} className="min-h-12 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal">Clear summaries</button>}
        </div>

        {!storageAvailable && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Browser storage is unavailable. Review rows still work transiently.</p>}
        {historyRecovered && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Invalid local history was ignored and safely reset.</p>}
        {notice && <p role="status" className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">{notice}</p>}

        <div className="mt-4 space-y-3">
          {historyEntries.length === 0 ? (
            <div className="rounded-2xl bg-surface-mint p-4">
              <p className="font-bold text-brand-deepTeal">No review summaries saved</p>
              <p className="mt-1 text-sm text-brand-deepTeal/65">Complete a transient review, then optionally save aggregate counts only.</p>
            </div>
          ) : historyEntries.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-brand-deepTeal">Review summary</p>
                  <p className="mt-1 text-xs text-brand-deepTeal/60">{formatHistoryTimestamp(entry.createdAt)}</p>
                </div>
                <span className="rounded-full bg-surface-mint px-3 py-1.5 text-xs font-bold text-brand-teal">Summary saved</span>
              </div>
              <p className="mt-3 text-sm text-brand-deepTeal/70">{entry.totalRows} rows · {entry.importCount} Import · {entry.skipCount} Skip · {entry.mergeCount} Merge · {entry.warningCount} warnings</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-surface-mint p-5">
        <p className="flex items-center gap-2 font-bold text-brand-deepTeal"><CheckCircle2 aria-hidden="true" className="h-5 w-5 text-brand-green" /> Task 1.7 safety boundary</p>
        <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Merchant cleanup, rules, aliases and category suggestions run locally. Suggestions require review; no row action commits, transaction creation, database writes, raw-row storage, server upload, Basiq, AI or third-party processing occur.</p>
      </section>
    </div>
  );
}
