"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardCheck, Download, RefreshCw, Save, Sparkles } from "lucide-react";

const classificationOptions = [
  ["PROPERTY_INCOME", "Property income record"],
  ["PROPERTY_OUTGOING", "Property outgoing record"],
  ["REFUND_OR_REVERSAL", "Refund or reversal record"],
  ["LOAN_PAYMENT_CONTEXT", "Loan payment cashflow record"],
  ["TRANSFER_CONTEXT", "Transfer context"],
  ["OTHER_PROPERTY_RECORD", "Other Property record"],
  ["EXCLUDED", "Exclude from summaries and export"],
] as const;

type Classification = typeof classificationOptions[number][0];
type ReviewRecord = {
  transactionId: string;
  date: string;
  amountCents: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  categoryName: string | null;
  transactionUpdatedAt: string;
  provenance: "MANUAL_PROPERTY_LINK" | "LOAN_RECONCILIATION" | "BOTH";
  relationshipConflict: boolean;
  archivedLoanContext: boolean;
  classification: Classification | null;
  classificationNeedsReview: boolean;
  suggestedClassification: Classification | null;
  suggestionReasonCode: string | null;
  reviewUpdatedAt: string | null;
};
type Review = {
  property: { id: string; nickname: string; isArchived: boolean };
  financialYear: { endingYear: number; label: string; startDate: string; endDate: string };
  records: ReviewRecord[];
};
type SummaryGroup = { count: number; totalCents: number };
type Summary = {
  propertyIncome: SummaryGroup;
  propertyOutgoing: SummaryGroup;
  refundOrReversal: SummaryGroup;
  loanPaymentCashflow: SummaryGroup;
  transferContextCount: number;
  otherPropertyRecordCount: number;
};

function currentEndingYear() {
  const today = new Date();
  return today.getMonth() >= 6 ? today.getFullYear() + 1 : today.getFullYear();
}

function money(cents: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Math.abs(cents) / 100);
}

function connectionLabel(value: ReviewRecord["provenance"]) {
  if (value === "BOTH") return "Manual Property link and loan repayment connection";
  if (value === "LOAN_RECONCILIATION") return "Loan repayment connection";
  return "Manual Property link";
}

function classificationLabel(value: Classification) {
  return classificationOptions.find(([classification]) => classification === value)?.[1] ?? "Suggested record classification";
}

function availableClassifications(record: ReviewRecord) {
  const values = new Set<Classification>(["OTHER_PROPERTY_RECORD", "EXCLUDED"]);
  if (record.type === "INCOME" && record.amountCents > 0) {
    values.add("PROPERTY_INCOME");
    values.add("REFUND_OR_REVERSAL");
  }
  if (record.type === "EXPENSE" && record.amountCents < 0) {
    values.add("PROPERTY_OUTGOING");
    if (record.provenance !== "MANUAL_PROPERTY_LINK") values.add("LOAN_PAYMENT_CONTEXT");
  }
  if (record.type === "TRANSFER") values.add("TRANSFER_CONTEXT");
  return classificationOptions.filter(([value]) => values.has(value));
}

export function PropertyRecordReview({ propertyId }: Readonly<{ propertyId: string }>) {
  const defaultYear = currentEndingYear();
  const [endingYear, setEndingYear] = useState(defaultYear);
  const [review, setReview] = useState<Review | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Classification | "">>({});
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showExportWarning, setShowExportWarning] = useState(false);
  const [showSuggestionConfirmation, setShowSuggestionConfirmation] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const years = Array.from({ length: 7 }, (_, index) => defaultYear - index);
  const suggestedRecords = (review?.records ?? []).filter((record) =>
    record.classification === null
    && record.suggestedClassification !== null
    && drafts[record.transactionId] === record.suggestedClassification
  ).slice(0, 100);

  async function load(year = endingYear) {
    setIsLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/account/properties/${encodeURIComponent(propertyId)}/report-review?financialYear=${year}`, {
        method: "GET",
        cache: "no-store",
      });
      const result = await response.json() as { ok: boolean; review?: Review; summary?: Summary; error?: string };
      if (!response.ok || !result.ok || !result.review || !result.summary) throw new Error(result.error ?? "Property records could not be loaded safely.");
      setReview(result.review);
      setSummary(result.summary);
      setShowExportWarning(false);
      setShowSuggestionConfirmation(false);
      setDrafts(Object.fromEntries(result.review.records.map((record) => [
        record.transactionId,
        record.classification ?? record.suggestedClassification ?? "",
      ])));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Property records could not be loaded safely.");
    } finally {
      setIsLoading(false);
    }
  }

  async function save(record: ReviewRecord) {
    const classification = drafts[record.transactionId];
    if (!classification) {
      setError("Choose a record classification before saving.");
      return;
    }
    setSavingId(record.transactionId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/account/properties/${encodeURIComponent(propertyId)}/report-review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: record.transactionId,
          classification,
          expectedTransactionUpdatedAt: record.transactionUpdatedAt,
          expectedReviewUpdatedAt: record.reviewUpdatedAt,
        }),
      });
      const result = await response.json() as {
        ok: boolean;
        result?: { classification: Classification; updatedAt: string };
        error?: string;
      };
      if (!response.ok || !result.ok || !result.result) throw new Error(result.error ?? "The record review could not be saved safely.");
      setReview((current) => current ? {
        ...current,
        records: current.records.map((item) => item.transactionId === record.transactionId
          ? { ...item, classification: result.result!.classification, reviewUpdatedAt: result.result!.updatedAt }
          : item),
      } : current);
      await load();
      setMessage("Record classification saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The record review could not be saved safely.");
    } finally {
      setSavingId(null);
    }
  }

  async function applySuggestedClassifications() {
    if (suggestedRecords.length === 0) return;
    setIsBulkSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/account/properties/${encodeURIComponent(propertyId)}/report-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endingYear,
          confirmed: true,
          items: suggestedRecords.map((record) => ({
            transactionId: record.transactionId,
            expectedTransactionUpdatedAt: record.transactionUpdatedAt,
            expectedReviewUpdatedAt: record.reviewUpdatedAt,
          })),
        }),
      });
      const result = await response.json() as {
        ok: boolean;
        result?: { classifiedCount: number; skippedCount: number; remainingReviewCount: number };
        error?: string;
      };
      if (!response.ok || !result.ok || !result.result) {
        throw new Error(result.error ?? "Suggested classifications could not be applied safely.");
      }
      await load();
      const skippedCopy = result.result.skippedCount > 0 ? ` ${result.result.skippedCount} changed or unsupported record${result.result.skippedCount === 1 ? " was" : "s were"} skipped.` : "";
      setMessage(`Applied suggested classifications to ${result.result.classifiedCount} record${result.result.classifiedCount === 1 ? "" : "s"}. ${result.result.remainingReviewCount} still need review.${skippedCopy}`);
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : "Suggested classifications could not be applied safely.");
    } finally {
      setIsBulkSaving(false);
      setShowSuggestionConfirmation(false);
    }
  }

  return (
    <section className="mt-4 border-t border-border pt-4" aria-labelledby={`property-review-${propertyId}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h4 id={`property-review-${propertyId}`} className="flex items-center gap-2 text-sm font-bold text-brand-deepTeal">
            <ClipboardCheck aria-hidden="true" className="h-4 w-4 text-brand-teal" /> Property record review
          </h4>
          <p className="mt-1 text-xs leading-5 text-brand-deepTeal/65">Review connected records for one Australian financial year. Suggestions stay unconfirmed until you save them.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-bold text-brand-deepTeal">Financial year
            <select value={endingYear} onChange={(event) => { const year = Number(event.target.value); setEndingYear(year); setReview(null); setSummary(null); setShowExportWarning(false); }} className="mt-1 block min-h-10 rounded-xl border border-border bg-white px-3 text-sm">
              {years.map((year) => <option key={year} value={year}>{year - 1}-{String(year).slice(-2)}</option>)}
            </select>
          </label>
          <button type="button" disabled={isLoading} onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-teal">
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> {review ? "Refresh" : "Load records"}
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-surface-mint p-3 text-xs leading-5 text-brand-deepTeal/70">
        <p className="font-bold text-brand-deepTeal">Review before export</p>
        <p>Suggestions are based on transaction type, amount, category and connection source. They are not tax advice. You can change any classification before exporting.</p>
        <p className="mt-1">Classifications do not change the original transaction, category, amount or cashflow treatment.</p>
      </div>
      {error && <p role="alert" className="mt-3 rounded-xl bg-danger-red/10 p-3 text-xs font-semibold text-danger-red">{error}</p>}
      {message && <p role="status" className="mt-3 rounded-xl bg-brand-green/10 p-3 text-xs font-semibold text-brand-green">{message}</p>}
      {review && review.property.isArchived && <p className="mt-3 text-xs font-bold text-brand-teal">Archived Property context</p>}
      {review && review.records.length === 0 && <p className="mt-3 text-xs text-brand-deepTeal/65">No eligible connected records were found for {review.financialYear.label}.</p>}
      {review && suggestedRecords.length > 0 && (
        <div className="mt-4 rounded-2xl border border-brand-teal/30 bg-white p-3">
          <p className="flex items-center gap-2 text-sm font-bold text-brand-deepTeal"><Sparkles aria-hidden="true" className="h-4 w-4 text-brand-teal" /> {suggestedRecords.length} suggested classification{suggestedRecords.length === 1 ? "" : "s"} ready</p>
          <p className="mt-1 text-xs leading-5 text-brand-deepTeal/65">Only unchanged suggestions are included. Rows you change remain available for individual review.</p>
          {!showSuggestionConfirmation ? (
            <button type="button" onClick={() => setShowSuggestionConfirmation(true)} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-teal"><CheckCircle2 aria-hidden="true" className="h-4 w-4" /> Apply suggested classifications</button>
          ) : (
            <div className="mt-3 rounded-xl bg-surface-mint p-3">
              <p className="text-xs leading-5 text-brand-deepTeal">Confirm saving {suggestedRecords.length} suggested classification{suggestedRecords.length === 1 ? "" : "s"}. Ownership, eligibility and stale records will be checked again.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={isBulkSaving} onClick={() => void applySuggestedClassifications()} className="min-h-11 rounded-full bg-brand-green px-4 text-xs font-bold text-white disabled:opacity-50">Confirm and apply</button>
                <button type="button" disabled={isBulkSaving} onClick={() => setShowSuggestionConfirmation(false)} className="min-h-11 rounded-full border border-border px-4 text-xs font-bold text-brand-deepTeal">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
      {review && summary && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div>
            <h5 className="text-sm font-bold text-brand-deepTeal">Reviewed record summary</h5>
            <p className="mt-1 text-xs leading-5 text-brand-deepTeal/65">Separate gross record-keeping groups only. No net result, profit or tax outcome is calculated.</p>
          </div>
          <dl className="grid gap-2 sm:grid-cols-2">
            {([
              ["Property income records", summary.propertyIncome],
              ["Property outgoing records", summary.propertyOutgoing],
              ["Refund/reversal records", summary.refundOrReversal],
              ["Loan payment cashflow records", summary.loanPaymentCashflow],
            ] as const).map(([label, group]) => (
              <div key={label} className="rounded-xl bg-surface-mint p-3">
                <dt className="text-xs font-semibold text-brand-deepTeal/65">{label}</dt>
                <dd className="mt-1 text-sm font-bold text-brand-deepTeal">{money(group.totalCents)} <span className="font-normal text-brand-deepTeal/60">· {group.count} record{group.count === 1 ? "" : "s"}</span></dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-brand-deepTeal/65">Transfer context: {summary.transferContextCount} · Other Property records: {summary.otherPropertyRecordCount}</p>
          {!showExportWarning ? (
            <button type="button" onClick={() => setShowExportWarning(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-teal"><Download aria-hidden="true" className="h-4 w-4" /> Prepare CSV export</button>
          ) : (
            <div className="rounded-2xl border border-brand-teal/30 bg-white p-3">
              <p className="text-xs leading-5 text-brand-deepTeal">SpendGrove provides record-keeping information only, not tax advice. Review your records and speak with a qualified professional if needed.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={`/api/account/properties/${encodeURIComponent(propertyId)}/report-export?financialYear=${endingYear}`} download className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-green px-4 text-xs font-bold text-white"><Download aria-hidden="true" className="h-4 w-4" /> Download reviewed CSV</a>
                <button type="button" onClick={() => setShowExportWarning(false)} className="min-h-11 rounded-full border border-border px-4 text-xs font-bold text-brand-deepTeal">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
      {review && review.records.length > 0 && (
        <ul className="mt-3 space-y-3">
          {review.records.map((record) => (
            <li key={record.transactionId} className="rounded-2xl border border-border bg-white p-3">
              <div className="flex flex-wrap items-start justify-between gap-2 text-xs text-brand-deepTeal">
                <span><strong className="block">{record.categoryName ?? "Uncategorised"}</strong><span className="mt-1 block text-brand-deepTeal/60">{record.date} · {record.type} · {connectionLabel(record.provenance)}</span></span>
                <strong>{record.amountCents > 0 ? "+" : record.amountCents < 0 ? "-" : ""}{money(record.amountCents)}</strong>
              </div>
              {record.archivedLoanContext && <p className="mt-2 text-xs font-semibold text-brand-teal">Connected through archived Loan Account context.</p>}
              {record.relationshipConflict && <p className="mt-2 text-xs font-semibold text-amber-700">The manual Property link controls this record; another loan connection points elsewhere.</p>}
              {record.classificationNeedsReview && <p className="mt-2 text-xs font-semibold text-amber-700">This transaction changed and its saved classification needs review.</p>}
              {record.classification === null && record.suggestedClassification && (
                <p className="mt-2 rounded-xl bg-brand-green/10 p-2 text-xs text-brand-deepTeal"><strong>Suggested classification:</strong> {classificationLabel(record.suggestedClassification)}. Review or change it before saving.</p>
              )}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                <label className="flex-1 text-xs font-bold text-brand-deepTeal">Record classification
                  <select value={drafts[record.transactionId] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [record.transactionId]: event.target.value as Classification | "" }))} className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm">
                    <option value="">Choose classification</option>
                    {availableClassifications(record).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <button type="button" disabled={savingId === record.transactionId || !drafts[record.transactionId] || drafts[record.transactionId] === record.classification} onClick={() => void save(record)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-green px-4 text-xs font-bold text-white disabled:opacity-50">
                  <Save aria-hidden="true" className="h-4 w-4" /> Save review
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
