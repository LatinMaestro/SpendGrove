"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Link2, Save } from "lucide-react";
import { ReviewCategorySelector } from "@/components/custom-category-controls";
import type { CustomCategory } from "@/lib/custom-categories";
import { formatAudFromCents } from "@/lib/money";
import type { DuplicateCandidate } from "@/lib/import-duplicate-scoring";
import type { ImportReviewAction, ImportReviewEditType, ImportReviewRow } from "@/lib/import-review";
import { canSaveLocalMerchantRule } from "@/lib/import-review-metadata";
import type { ManualCategoryType } from "@/lib/manual-categories";
import { normalizeMerchantName, type MerchantSuggestionSource } from "@/lib/merchant-rules";
import { getReviewCategory } from "@/lib/custom-categories";

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

function formatReviewDate(date: string | null) {
  if (!date) return "Date needs review";
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
}

function reviewStatusText(row: ImportReviewRow) {
  if (row.reviewState === "MANUALLY_REVIEWED") return "Manually reviewed";
  if (row.reviewState === "CONFIRMED_SUGGESTION") return "Category checked";
  if (row.reviewState === "APPLIED_TO_MATCH") return "Applied to same merchant";
  return "";
}

function isUsefulAlias(row: ImportReviewRow, alias: string) {
  if (!canSaveLocalMerchantRule(row)) return false;
  try {
    const aliasKey = normalizeMerchantName(alias);
    return aliasKey !== normalizeMerchantName(row.merchantName) && !genericAliasKeys.has(aliasKey);
  } catch {
    return false;
  }
}

function duplicateChipText(candidate: DuplicateCandidate) {
  if (candidate.source === "SAME_IMPORT") return "Possible duplicate in this import";
  return `${candidate.confidence === "LIKELY" ? "Likely" : "Possible"} match · Already entered manually`;
}

function DuplicateCandidateDetails({ candidate, isSelected, onChoose }: { candidate: DuplicateCandidate; isSelected: boolean; onChoose(candidate: DuplicateCandidate): void }) {
  return (
    <article className="rounded-2xl bg-white p-3 text-xs leading-5 text-brand-deepTeal/70">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-bold text-brand-deepTeal">{candidate.source === "SAME_IMPORT" ? "Possible duplicate in this import" : `${candidate.confidence === "LIKELY" ? "Likely" : "Possible"} match already entered manually`}</p>
          <p className="mt-1">{candidate.source === "SAME_IMPORT" ? `Row ${candidate.rowNumber ?? "nearby"}` : candidate.merchantName} · {formatReviewDate(candidate.date)} · {formatAudFromCents(candidate.amountCents)}</p>
          <p className="mt-1 font-semibold text-brand-teal">{candidate.reasons.join(" · ")}</p>
        </div>
        {candidate.canMergeTarget ? (
          <button type="button" onClick={() => onChoose(candidate)} disabled={isSelected} className="min-h-10 shrink-0 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal disabled:border-brand-green disabled:bg-surface-mint disabled:text-brand-green">{isSelected ? "Merge target selected" : "Choose this as the merge target"}</button>
        ) : <span className="rounded-full bg-surface-mint px-3 py-1.5 text-xs font-bold text-brand-teal">Warning only</span>}
      </div>
      {candidate.source === "SAME_IMPORT" && <p className="mt-2 text-brand-deepTeal/60">Rows from the same CSV cannot be merge targets.</p>}
      {candidate.canMergeTarget && <p className="mt-2 text-brand-deepTeal/60">This only marks your review choice until you confirm the import.</p>}
    </article>
  );
}

export function ImportReviewRowCard({
  row, customCategories, matchingRowCount, duplicateCandidates, selectedMergeTargetId, isPotentiallyDeductible,
  onAction, onDetails, onCreateCategory, onTaxChange, onApplySameMerchant, onChooseMergeTarget, onSaveRule, onSaveAlias,
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
  const currentCategory = getReviewCategory(customCategories, row.categoryId);
  const topDuplicateCandidate = duplicateCandidates[0];
  const statusText = reviewStatusText(row);

  return (
    <article className="rounded-3xl border border-border bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate font-bold text-brand-deepTeal">{row.merchantName || "Payment"}</p><p className="mt-1 text-sm text-brand-deepTeal/60">{formatReviewDate(row.date)}</p></div><p className="shrink-0 font-bold text-brand-deepTeal">{row.amountCents === null ? "Review amount" : formatAudFromCents(row.amountCents)}</p></div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-3 py-1.5 font-bold ${meaningfulSuggestion ? "bg-surface-mint text-brand-teal" : "bg-warning-amber/10 text-brand-deepTeal"}`}>{meaningfulSuggestion ? `Suggested: ${currentCategory?.name ?? "Review category"}` : "Needs review"}</span>
        {topDuplicateCandidate && <span className="rounded-full bg-warning-amber/10 px-3 py-1.5 font-bold text-brand-deepTeal">{duplicateChipText(topDuplicateCandidate)}</span>}
        {statusText && <span className="font-bold text-brand-green">{statusText}</span>}
        {row.warningCodes.length > 0 && <span className="font-semibold text-warning-amber">Needs a quick check</span>}
      </div>
      <ReviewCategorySelector row={row} customCategories={customCategories} onDetails={onDetails} onCreate={onCreateCategory} />
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-surface-mint p-3"><input type="checkbox" checked={isPotentiallyDeductible} onChange={(event) => onTaxChange(event.target.checked)} className="mt-1 h-5 w-5 rounded border-border text-brand-green focus:ring-brand-green" /><span><span className="block text-sm font-bold text-brand-deepTeal">Potentially deductible?</span><span className="mt-0.5 block text-xs leading-5 text-brand-deepTeal/60">For record-keeping only—not tax advice. This choice is not saved as a transaction.</span></span></label>
      {row.categoryConfirmed && row.action !== "SKIP" && matchingRowCount > 0 && <button type="button" onClick={onApplySameMerchant} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal"><Link2 aria-hidden="true" className="h-4 w-4" /> Apply to {matchingRowCount} matching transaction{matchingRowCount === 1 ? "" : "s"}</button>}
      <fieldset className="mt-4"><legend className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">What should happen?</legend><div className="mt-2 grid grid-cols-3 gap-1 rounded-2xl bg-surface-mint p-1">{reviewActions.map((action) => <button key={action.value} type="button" onClick={() => onAction(action.value)} aria-pressed={row.action === action.value} className={`min-h-10 rounded-xl border px-3 py-2 text-sm font-bold ${row.action === action.value ? "border-brand-green bg-white text-brand-deepTeal" : "border-transparent text-brand-deepTeal/70"}`}>{action.label}</button>)}</div>{row.action === "MERGE" && <p className="mt-2 text-xs leading-5 text-brand-deepTeal/60">Choose an existing manual transaction below before confirming the import.</p>}</fieldset>
      <button type="button" onClick={() => setShowMore((current) => !current)} aria-expanded={showMore} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-brand-teal">{showMore ? <ChevronUp aria-hidden="true" className="h-4 w-4" /> : <ChevronDown aria-hidden="true" className="h-4 w-4" />}{showMore ? "Hide options" : "More options"}</button>
      {showMore && <div className="mt-3 rounded-2xl border border-border bg-surface-mint/60 p-4">
        {duplicateCandidates.length > 0 && <div className="mb-4 space-y-3"><p className="text-sm font-bold text-brand-deepTeal">Duplicate check</p>{duplicateCandidates.map((candidate) => <DuplicateCandidateDetails key={`${candidate.source}-${candidate.candidateId}`} candidate={candidate} isSelected={selectedMergeTargetId === candidate.candidateId} onChoose={onChooseMergeTarget} />)}</div>}
        <label className="text-sm font-semibold text-brand-deepTeal">Merchant name<input value={row.merchantName} maxLength={80} onChange={(event) => onDetails({ merchantName: event.target.value, categoryId: row.categoryId, editType: "MERCHANT_EDIT" })} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm" /></label>
        {row.description && row.description !== row.merchantName && <p className="mt-3 text-xs leading-5 text-brand-deepTeal/65"><span className="font-bold">Description with private details removed:</span> {row.description}</p>}
        <div className="mt-4 rounded-2xl bg-white p-3 text-xs leading-5 text-brand-deepTeal/70"><p className="font-bold text-brand-deepTeal">How we chose this</p><p className="mt-1">{suggestionLabels[row.suggestionSource]} · {row.suggestionConfidence.toLocaleLowerCase("en-AU")} confidence</p><p className="mt-1">{row.suggestionReason}</p></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{canSaveLocalMerchantRule(row) ? <button type="button" onClick={onSaveRule} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal bg-white px-4 text-xs font-bold text-brand-deepTeal"><Save aria-hidden="true" className="h-4 w-4" /> Save merchant rule</button> : <p className="rounded-2xl bg-white p-3 text-xs leading-5 text-brand-deepTeal/60">Check or change the category before saving this choice.</p>}<div className="rounded-2xl bg-white p-3"><label className="text-xs font-bold text-brand-deepTeal">Also use this for matching merchants<input value={alias} onChange={(event) => setAlias(event.target.value)} maxLength={80} placeholder="e.g. Woolies" className="mt-2 min-h-10 w-full rounded-xl border border-border px-3 text-sm" /></label><button type="button" disabled={!isUsefulAlias(row, alias)} onClick={() => onSaveAlias(alias)} className="mt-2 min-h-10 w-full rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal disabled:opacity-40">Save matching name</button></div></div>
        <p className="mt-3 text-xs leading-5 text-brand-deepTeal/60">Saved choices keep only cleaned merchant names and category IDs. Full bank descriptions and private account details stay excluded.</p>
      </div>}
    </article>
  );
}
