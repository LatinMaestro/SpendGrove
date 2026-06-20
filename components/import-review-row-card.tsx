"use client";

import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, Link2, Pencil } from "lucide-react";
import { ReviewCategoryPicker } from "@/components/review-category-picker";
import type { CustomCategory } from "@/lib/custom-categories";
import { getReviewCategory } from "@/lib/custom-categories";
import type { DuplicateCandidate } from "@/lib/import-duplicate-scoring";
import type { ImportReviewSourceDetails } from "@/lib/import-review-source-details";
import type { ImportReviewAction, ImportReviewEditType, ImportReviewRow } from "@/lib/import-review";
import type { ManualCategoryType } from "@/lib/manual-categories";
import { formatAudFromCents } from "@/lib/money";

const reviewActions: Array<{ value: ImportReviewAction; label: string }> = [{ value: "IMPORT", label: "Import" }, { value: "SKIP", label: "Skip" }, { value: "MERGE", label: "Merge" }];

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

function duplicateChipText(candidate: DuplicateCandidate) {
  if (candidate.source === "SAME_IMPORT") return "Possible duplicate in this import";
  if (candidate.transactionSource === "IMPORTED") {
    return candidate.confidence === "LIKELY" ? "Already in SpendGrove" : "Possible existing match";
  }
  return `${candidate.confidence === "LIKELY" ? "Likely" : "Possible"} match · Already entered manually`;
}

function DuplicateCandidateDetails({ candidate, isSelected, onChoose }: { candidate: DuplicateCandidate; isSelected: boolean; onChoose(candidate: DuplicateCandidate): void }) {
  const title = candidate.source === "SAME_IMPORT"
    ? "Possible duplicate in this import"
    : candidate.transactionSource === "IMPORTED"
      ? candidate.confidence === "LIKELY" ? "Already in SpendGrove" : "Possible existing transaction"
      : `${candidate.confidence === "LIKELY" ? "Likely" : "Possible"} match already entered manually`;
  return <article className="rounded-2xl bg-white p-3 text-xs leading-5 text-brand-deepTeal/70"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold text-brand-deepTeal">{title}</p><p className="mt-1">{candidate.source === "SAME_IMPORT" ? `Row ${candidate.rowNumber ?? "nearby"}` : candidate.merchantName} · {formatReviewDate(candidate.date)} · {formatAudFromCents(candidate.amountCents)}</p><p className="mt-1 font-semibold text-brand-teal">{candidate.reasons.join(" · ")}</p></div>{candidate.canMergeTarget ? <button type="button" onClick={() => onChoose(candidate)} disabled={isSelected} className="min-h-10 shrink-0 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal disabled:border-brand-green disabled:bg-surface-mint disabled:text-brand-green">{isSelected ? "Merge target selected" : "Choose this as the merge target"}</button> : <span className="rounded-full bg-surface-mint px-3 py-1.5 text-xs font-bold text-brand-teal">Warning only</span>}</div>{candidate.source === "SAME_IMPORT" && <p className="mt-2 text-brand-deepTeal/60">Rows from the same CSV cannot be merge targets.</p>}{candidate.transactionSource === "IMPORTED" && <p className="mt-2 text-brand-deepTeal/60">SpendGrove recommends Skip so another copy is not created.</p>}{candidate.canMergeTarget && <p className="mt-2 text-brand-deepTeal/60">This only marks your review choice until you confirm the import.</p>}</article>;
}

export function ImportReviewRowCard({ row, customCategories, matchingRowCount, duplicateCandidates, selectedMergeTargetId, isPotentiallyDeductible, needsAttention, blockerMessage, ambiguousTransfer, sourceDetails, onAction, onDetails, onCreateCategory, onTaxChange, onApplySameMerchant, onChooseMergeTarget, onMerchantNameCommit }: {
  row: ImportReviewRow; customCategories: CustomCategory[]; matchingRowCount: number; duplicateCandidates: DuplicateCandidate[]; selectedMergeTargetId?: string; isPotentiallyDeductible: boolean; needsAttention: boolean; blockerMessage: string; ambiguousTransfer: boolean; sourceDetails?: ImportReviewSourceDetails;
  onAction(action: ImportReviewAction): void; onDetails(details: { merchantName: string; categoryId: string; editType: ImportReviewEditType }): void; onCreateCategory(input: { name: string; type: ManualCategoryType }): CustomCategory; onTaxChange(value: boolean): void; onApplySameMerchant(): void; onChooseMergeTarget(candidate: DuplicateCandidate): void; onMerchantNameCommit(previousMerchantName: string): void;
}) {
  const [showMore, setShowMore] = useState(false);
  const [showMerchantEdit, setShowMerchantEdit] = useState(false);
  const previousMerchantName = useRef(row.merchantName);
  const currentCategory = getReviewCategory(customCategories, row.categoryId);
  const topDuplicateCandidate = duplicateCandidates[0];
  const statusText = reviewStatusText(row);

  function finishMerchantEdit() {
    setShowMerchantEdit(false);
    if (row.merchantName.trim() === previousMerchantName.current.trim()) return;
    onMerchantNameCommit(previousMerchantName.current);
  }

  return <article className="rounded-3xl border border-border bg-white p-4 sm:p-5">
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate font-bold text-brand-deepTeal">{row.merchantName || "Payment"}</p><p className="mt-1 text-sm text-brand-deepTeal/60">{formatReviewDate(row.date)}</p></div><p className="shrink-0 font-bold text-brand-deepTeal">{row.amountCents === null ? "Review amount" : formatAudFromCents(row.amountCents)}</p></div>
    <button type="button" onClick={() => setShowMerchantEdit((current) => !current)} aria-expanded={showMerchantEdit} className="mt-2 inline-flex min-h-9 items-center gap-2 text-xs font-bold text-brand-teal"><Pencil aria-hidden="true" className="h-3.5 w-3.5" /> Edit merchant name</button>
    {showMerchantEdit && <label className="mt-2 block text-sm font-semibold text-brand-deepTeal">Clean merchant name<input value={row.merchantName} maxLength={80} autoFocus onChange={(event) => onDetails({ merchantName: event.target.value, categoryId: row.categoryId, editType: "MERCHANT_EDIT" })} onBlur={finishMerchantEdit} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm" /><span className="mt-1 block text-xs font-normal leading-5 text-brand-deepTeal/60">Saved automatically when you finish editing. Private bank narration remains excluded.</span></label>}
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className={`rounded-full px-3 py-1.5 font-bold ${needsAttention ? "bg-warning-amber/10 text-brand-deepTeal" : "bg-surface-mint text-brand-green"}`}>{needsAttention ? "Needs review" : `Ready · ${currentCategory?.name ?? "Category checked"}`}</span>{topDuplicateCandidate && <span className="rounded-full bg-warning-amber/10 px-3 py-1.5 font-bold text-brand-deepTeal">{duplicateChipText(topDuplicateCandidate)}</span>}{statusText && <span className="font-bold text-brand-green">{statusText}</span>}</div>
    {blockerMessage && <p className="mt-2 text-xs font-semibold text-warning-amber">{blockerMessage}</p>}
    <ReviewCategoryPicker row={row} customCategories={customCategories} onDetails={onDetails} onCreate={onCreateCategory} />
    {ambiguousTransfer && <p className="mt-3 text-xs font-semibold leading-5 text-brand-teal">This may be a transfer. Check the source details in More options if you are unsure.</p>}
    <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-surface-mint p-3"><input type="checkbox" checked={isPotentiallyDeductible} onChange={(event) => onTaxChange(event.target.checked)} className="mt-1 h-5 w-5 rounded border-border text-brand-green focus:ring-brand-green" /><span><span className="block text-sm font-bold text-brand-deepTeal">Potentially deductible?</span><span className="mt-0.5 block text-xs leading-5 text-brand-deepTeal/60">For record-keeping only—not tax advice. This choice is not saved as a transaction.</span></span></label>
    {row.categoryConfirmed && row.action !== "SKIP" && matchingRowCount > 0 && <button type="button" onClick={onApplySameMerchant} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal"><Link2 aria-hidden="true" className="h-4 w-4" /> Apply to {matchingRowCount} matching transaction{matchingRowCount === 1 ? "" : "s"}</button>}
    <fieldset className="mt-4"><legend className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">What should happen?</legend><div className="mt-2 grid grid-cols-3 gap-1 rounded-2xl bg-surface-mint p-1">{reviewActions.map((action) => <button key={action.value} type="button" onClick={() => onAction(action.value)} aria-pressed={row.action === action.value} className={`min-h-10 rounded-xl border px-3 py-2 text-sm font-bold ${row.action === action.value ? "border-brand-green bg-white text-brand-deepTeal" : "border-transparent text-brand-deepTeal/70"}`}>{action.label}</button>)}</div>{row.action === "MERGE" && <div role="status" className="mt-3 rounded-2xl border border-brand-teal/30 bg-surface-mint p-3 text-xs leading-5 text-brand-deepTeal"><p className="font-bold">Merge selected</p><p className="mt-1">Choose an eligible existing manual transaction below before final account save. Rows from this CSV cannot be merge targets.</p></div>}</fieldset>
    {topDuplicateCandidate?.source === "EXISTING_TRANSACTION" && topDuplicateCandidate.confidence === "LIKELY" && row.action === "SKIP" && <p className="mt-3 rounded-2xl bg-warning-amber/10 p-3 text-xs font-semibold leading-5 text-brand-deepTeal">Skip was selected because this looks already saved. Choose Import only if you deliberately want another copy.</p>}
    {duplicateCandidates.length > 0 && <div className="mt-4 space-y-3"><p className="text-sm font-bold text-brand-deepTeal">Duplicate check</p>{duplicateCandidates.map((candidate) => <DuplicateCandidateDetails key={`${candidate.source}-${candidate.candidateId}`} candidate={candidate} isSelected={selectedMergeTargetId === candidate.candidateId} onChoose={onChooseMergeTarget} />)}</div>}
    <button type="button" onClick={() => setShowMore((current) => !current)} aria-expanded={showMore} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-brand-teal">{showMore ? <ChevronUp aria-hidden="true" className="h-4 w-4" /> : <ChevronDown aria-hidden="true" className="h-4 w-4" />}{showMore ? "Hide options" : "More options"}</button>
    {showMore && <section aria-label="Source details from this CSV" className="mt-3 rounded-2xl border border-border bg-white p-4"><p className="text-sm font-bold text-brand-deepTeal">Source details from this CSV</p><p className="mt-1 text-xs leading-5 text-brand-deepTeal/60">Shown only during this browser review to help you choose a category. These details are not saved to your account.</p>{sourceDetails && sourceDetails.fields.length > 0 ? <dl className="mt-3 grid gap-2 text-xs">{sourceDetails.fields.map((field, index) => <div key={`${field.label}-${index}`} className="grid gap-1 sm:grid-cols-[10rem_1fr]"><dt className="font-bold text-brand-teal">{field.label}</dt><dd className="break-words text-brand-deepTeal">{field.value}</dd></div>)}</dl> : <p className="mt-3 text-xs text-brand-deepTeal/60">No additional mapped source details are available for this row.</p>}</section>}
  </article>;
}
