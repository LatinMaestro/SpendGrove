"use client";

import { useState } from "react";
import { ClipboardCheck, Download, RefreshCw } from "lucide-react";

type ReviewRecord = {
  transactionId: string;
  date: string;
  amountCents: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  categoryName: string | null;
  provenance: "MANUAL_PROPERTY_LINK" | "LOAN_RECONCILIATION" | "BOTH";
  relationshipConflict: boolean;
  archivedLoanContext: boolean;
};
type Review = {
  property: { id: string; nickname: string; isArchived: boolean };
  financialYear: { endingYear: number; label: string; startDate: string; endDate: string };
  records: ReviewRecord[];
};
type SummaryGroup = { count: number; totalCents: number };
type Summary = {
  moneyIn: SummaryGroup;
  moneyOut: SummaryGroup;
  loanPaymentCashflow: SummaryGroup;
  transferContextCount: number;
  totalLinkedRecordCount: number;
};

function currentEndingYear() {
  const today = new Date();
  return today.getMonth() >= 6 ? today.getFullYear() + 1 : today.getFullYear();
}

function money(cents: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Math.abs(cents) / 100);
}

function connectionLabel(value: ReviewRecord["provenance"]) {
  if (value === "BOTH") return "Included through its Property link and linked loan repayment";
  if (value === "LOAN_RECONCILIATION") return "Included through a linked loan repayment";
  return "Included because this transaction is linked to this Property";
}

export function PropertyRecordReview({ propertyId }: Readonly<{ propertyId: string }>) {
  const defaultYear = currentEndingYear();
  const [endingYear, setEndingYear] = useState(defaultYear);
  const [review, setReview] = useState<Review | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showExportWarning, setShowExportWarning] = useState(false);
  const years = Array.from({ length: 7 }, (_, index) => defaultYear - index);

  async function load(year = endingYear) {
    setIsLoading(true);
    setError("");
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
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Property records could not be loaded safely.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mt-4 border-t border-border pt-4" aria-labelledby={`property-records-${propertyId}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h4 id={`property-records-${propertyId}`} className="flex items-center gap-2 text-sm font-bold text-brand-deepTeal">
            <ClipboardCheck aria-hidden="true" className="h-4 w-4 text-brand-teal" /> Property records
          </h4>
          <p className="mt-1 text-xs leading-5 text-brand-deepTeal/65">Linked records are included automatically for the selected Australian financial year.</p>
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
        <p>Record keeping only - not tax advice. This view uses current linked transactions and does not change their category, amount or cashflow treatment.</p>
      </div>
      {error && <p role="alert" className="mt-3 rounded-xl bg-danger-red/10 p-3 text-xs font-semibold text-danger-red">{error}</p>}
      {review && review.property.isArchived && <p className="mt-3 text-xs font-bold text-brand-teal">Archived Property context</p>}
      {review && review.records.length === 0 && <p className="mt-3 text-xs text-brand-deepTeal/65">No eligible linked records were found for {review.financialYear.label}.</p>}
      {review && summary && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div>
            <h5 className="text-sm font-bold text-brand-deepTeal">Linked record summary</h5>
            <p className="mt-1 text-xs leading-5 text-brand-deepTeal/65">Simple money-in, money-out and context groups only. Linked loan payments are already part of money out and are not added again.</p>
          </div>
          <dl className="grid gap-2 sm:grid-cols-2">
            {([
              ["Money in records", summary.moneyIn],
              ["Money out records", summary.moneyOut],
              ["Linked loan payment cashflow records", summary.loanPaymentCashflow],
            ] as const).map(([label, group]) => (
              <div key={label} className="rounded-xl bg-surface-mint p-3">
                <dt className="text-xs font-semibold text-brand-deepTeal/65">{label}</dt>
                <dd className="mt-1 text-sm font-bold text-brand-deepTeal">{money(group.totalCents)} <span className="font-normal text-brand-deepTeal/60">· {group.count} record{group.count === 1 ? "" : "s"}</span></dd>
              </div>
            ))}
            <div className="rounded-xl bg-surface-mint p-3">
              <dt className="text-xs font-semibold text-brand-deepTeal/65">Total linked records</dt>
              <dd className="mt-1 text-sm font-bold text-brand-deepTeal">{summary.totalLinkedRecordCount}</dd>
            </div>
          </dl>
          <p className="text-xs text-brand-deepTeal/65">Transfer context: {summary.transferContextCount}</p>
          {!showExportWarning ? (
            <button type="button" onClick={() => setShowExportWarning(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-teal"><Download aria-hidden="true" className="h-4 w-4" /> Prepare CSV export</button>
          ) : (
            <div className="rounded-2xl border border-brand-teal/30 bg-white p-3">
              <p className="text-xs leading-5 text-brand-deepTeal">SpendGrove provides record-keeping information only, not tax advice. Review your linked records before downloading.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={`/api/account/properties/${encodeURIComponent(propertyId)}/report-export?financialYear=${endingYear}`} download className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-green px-4 text-xs font-bold text-white"><Download aria-hidden="true" className="h-4 w-4" /> Download linked records CSV</a>
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
                <span><strong className="block">{record.categoryName ?? "Uncategorised"}</strong><span className="mt-1 block text-brand-deepTeal/60">{record.date} · {record.type}</span></span>
                <strong>{record.amountCents > 0 ? "+" : record.amountCents < 0 ? "-" : ""}{money(record.amountCents)}</strong>
              </div>
              <p className="mt-2 text-xs text-brand-deepTeal/65">{connectionLabel(record.provenance)}</p>
              {record.archivedLoanContext && <p className="mt-2 text-xs font-semibold text-brand-teal">Connected through archived Loan Account context.</p>}
              {record.relationshipConflict && <p className="mt-2 text-xs font-semibold text-amber-700">The manual Property link controls this record; another loan connection points elsewhere.</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
