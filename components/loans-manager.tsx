"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SignInButton, useUser } from "@clerk/nextjs";
import {
  AlertTriangle,
  Archive,
  Building2,
  Car,
  CheckCircle2,
  Home,
  History,
  Landmark,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import type { LoanRepaymentBulkArchiveSummary, SafeLoanRepayment } from "@/lib/loan-repayment-history";
import type { LoanReconciliationCandidate, ReconciliationCandidateMode } from "@/lib/loan-reconciliation";
import { parseMoneyToCents } from "@/lib/validation/money";
import { PropertyRecordKeepingActivity } from "@/components/property-record-keeping-activity";
import { PageHeader } from "@/components/ui/app-primitives";

type LoanKind = "OWNER_OCCUPIER_HOME" | "INVESTMENT_PROPERTY" | "CAR" | "PERSONAL" | "OTHER";
type PropertyUsage = "OWNER_OCCUPIED" | "INVESTMENT" | "OTHER";

type PropertyRecord = {
  id: string;
  nickname: string;
  usage: PropertyUsage;
  isArchived: boolean;
};

type LoanRecord = {
  id: string;
  nickname: string;
  type: "HOME_LOAN" | "CAR_LOAN" | "PERSONAL_LOAN" | "OTHER";
  purpose: "OWNER_OCCUPIER" | "INVESTMENT" | "PERSONAL" | "OTHER";
  isArchived: boolean;
  propertyId?: string | null;
  property?: PropertyRecord | null;
};

type LoanResult =
  | { ok: true; loans: LoanRecord[]; properties: PropertyRecord[] }
  | { ok: false; error: string };

type RepaymentCorrectionDraft = {
  repaymentDate: string;
  totalPayment: string;
  principal: string;
  interest: string;
  fees: string;
  balanceAfter: string;
};

const repaymentMoneyFields: Array<{
  key: keyof Pick<RepaymentCorrectionDraft, "totalPayment" | "principal" | "interest" | "fees" | "balanceAfter">;
  label: string;
  required?: boolean;
}> = [
  { key: "totalPayment", label: "Total repayment", required: true },
  { key: "principal", label: "Principal" },
  { key: "interest", label: "Interest" },
  { key: "fees", label: "Fees" },
  { key: "balanceAfter", label: "Balance after" },
];

const choices: Array<{
  kind: LoanKind;
  label: string;
  tag: string;
  type: LoanRecord["type"];
  purpose: LoanRecord["purpose"];
  propertyRelevant: boolean;
}> = [
  { kind: "OWNER_OCCUPIER_HOME", label: "Owner-occupier home loan", tag: "Owner-occupier", type: "HOME_LOAN", purpose: "OWNER_OCCUPIER", propertyRelevant: true },
  { kind: "INVESTMENT_PROPERTY", label: "Investment property loan", tag: "Investment", type: "HOME_LOAN", purpose: "INVESTMENT", propertyRelevant: true },
  { kind: "CAR", label: "Car loan", tag: "Car loan", type: "CAR_LOAN", purpose: "PERSONAL", propertyRelevant: false },
  { kind: "PERSONAL", label: "Personal loan", tag: "Personal loan", type: "PERSONAL_LOAN", purpose: "PERSONAL", propertyRelevant: false },
  { kind: "OTHER", label: "Other loan", tag: "Other", type: "OTHER", purpose: "OTHER", propertyRelevant: false },
];

const propertyUsageLabels: Record<PropertyUsage, string> = {
  OWNER_OCCUPIED: "Owner-occupied",
  INVESTMENT: "Investment",
  OTHER: "Other",
};

function choiceForLoan(loan: LoanRecord) {
  return choices.find((choice) => choice.type === loan.type && choice.purpose === loan.purpose) ?? choices[4];
}

function aud(cents: number | null) {
  if (cents === null) return "Not supplied";
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

function RepaymentHistory({
  repayments,
  isSaving,
  candidateReviews,
  candidateLoadingId,
  reconciliationSavingId,
  confirmedLinks,
  overrideDates,
  onArchiveChange,
  onBulkArchiveChange,
  onEdit,
  onLoadCandidates,
  onConfirmationChange,
  onOverrideDateChange,
  onLink,
  onUnlink,
}: Readonly<{
  repayments: SafeLoanRepayment[];
  isSaving: boolean;
  candidateReviews: Record<string, { mode: ReconciliationCandidateMode; candidates: LoanReconciliationCandidate[] }>;
  candidateLoadingId: string;
  reconciliationSavingId: string;
  confirmedLinks: Record<string, boolean>;
  overrideDates: Record<string, string>;
  onArchiveChange: (repayment: SafeLoanRepayment, isArchived: boolean) => void;
  onBulkArchiveChange: (repayments: SafeLoanRepayment[], isArchived: boolean) => Promise<LoanRepaymentBulkArchiveSummary>;
  onEdit: (repayment: SafeLoanRepayment) => void;
  onLoadCandidates: (repayment: SafeLoanRepayment, mode: ReconciliationCandidateMode, overrideDate?: string) => void;
  onConfirmationChange: (key: string, confirmed: boolean) => void;
  onOverrideDateChange: (repaymentId: string, date: string) => void;
  onLink: (repayment: SafeLoanRepayment, candidate: LoanReconciliationCandidate, mode: ReconciliationCandidateMode, confirmed: boolean) => void;
  onUnlink: (repayment: SafeLoanRepayment) => void;
}>) {
  const [historyFilter, setHistoryFilter] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [cleanupMode, setCleanupMode] = useState(false);
  const [selectedRepaymentIds, setSelectedRepaymentIds] = useState<Set<string>>(new Set());
  const [bulkConfirmed, setBulkConfirmed] = useState(false);
  const [bulkSummary, setBulkSummary] = useState<LoanRepaymentBulkArchiveSummary | null>(null);
  const [showAllRepayments, setShowAllRepayments] = useState(false);
  const [openRepaymentId, setOpenRepaymentId] = useState<string | null>(null);
  const [matchingRepaymentId, setMatchingRepaymentId] = useState<string | null>(null);
  const [searchByDateRepaymentId, setSearchByDateRepaymentId] = useState<string | null>(null);
  const visibleRepayments = repayments.filter((repayment) => repayment.isArchived === (historyFilter === "ARCHIVED"));
  const displayedRepayments = showAllRepayments ? visibleRepayments : visibleRepayments.slice(0, 3);
  const selectedRepayments = visibleRepayments.filter((repayment) => selectedRepaymentIds.has(repayment.id));

  function changeHistoryFilter(filter: "ACTIVE" | "ARCHIVED") {
    setHistoryFilter(filter);
    setCleanupMode(false);
    setSelectedRepaymentIds(new Set());
    setBulkConfirmed(false);
    setBulkSummary(null);
    setShowAllRepayments(false);
    setOpenRepaymentId(null);
  }

  function changeBulkSelection(repaymentId: string, selected: boolean) {
    setSelectedRepaymentIds((current) => {
      const next = new Set(current);
      if (selected && next.size < 100) next.add(repaymentId);
      else if (!selected) next.delete(repaymentId);
      return next;
    });
    setBulkConfirmed(false);
    setBulkSummary(null);
  }

  async function applyBulkCleanup() {
    if (!bulkConfirmed || selectedRepayments.length === 0) return;
    try {
      const summary = await onBulkArchiveChange(selectedRepayments, historyFilter === "ACTIVE");
      setBulkSummary(summary);
      setSelectedRepaymentIds(new Set());
      setBulkConfirmed(false);
    } catch {
      setBulkSummary(null);
    }
  }

  function beginMatching(repayment: SafeLoanRepayment) {
    setMatchingRepaymentId(repayment.id);
    setSearchByDateRepaymentId(null);
    if (!candidateReviews[repayment.id]) onLoadCandidates(repayment, "SUGGESTED");
  }

  if (repayments.length === 0) {
    return (
      <section className="mt-5 border-t border-border pt-5" aria-labelledby="loan-repayments-heading">
        <h3 id="loan-repayments-heading" className="text-xl font-bold text-brand-deepTeal">Loan repayments</h3>
        <p className="mt-3 rounded-2xl bg-surface-mint p-3 text-sm text-brand-deepTeal/65">No repayments imported yet.</p>
      </section>
    );
  }

  return (
    <section className="mt-5 border-t border-border pt-5" aria-labelledby="loan-repayments-heading">
      <div className="flex items-center gap-2">
        <History aria-hidden="true" className="h-4 w-4 text-brand-teal" />
        <h3 id="loan-repayments-heading" className="text-xl font-bold text-brand-deepTeal">Loan repayments</h3>
      </div>

      <div className="mt-3 space-y-2">
        {visibleRepayments.length === 0 && <p className="rounded-2xl bg-surface-mint p-3 text-xs text-brand-deepTeal/65">No {historyFilter === "ACTIVE" ? "current" : "deleted"} repayments.</p>}
        {displayedRepayments.map((repayment) => {
          const isOpen = openRepaymentId === repayment.id;
          const review = candidateReviews[repayment.id];
          return (
            <div key={repayment.id}>
              {cleanupMode && (
                <label className="mb-2 flex items-start gap-2 rounded-xl bg-surface-mint p-3 text-xs font-semibold text-brand-deepTeal">
                  <input type="checkbox" checked={selectedRepaymentIds.has(repayment.id)} disabled={isSaving || (historyFilter === "ACTIVE" && Boolean(repayment.linkedTransaction)) || (!selectedRepaymentIds.has(repayment.id) && selectedRepaymentIds.size >= 100)} onChange={(event) => changeBulkSelection(repayment.id, event.target.checked)} className="mt-0.5 accent-brand-green" />
                  {historyFilter === "ACTIVE" && repayment.linkedTransaction ? "Unlink before deleting" : `Select ${dateLabel(repayment.repaymentDate)} repayment`}
                </label>
              )}
              <article className={`rounded-2xl border border-border p-3 ${repayment.isArchived ? "bg-surface-mint opacity-70" : "bg-white"}`}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`repayment-details-${repayment.id}`}
                  onClick={() => setOpenRepaymentId(isOpen ? null : repayment.id)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 text-left focus:outline-none focus:ring-2 focus:ring-brand-green"
                >
                  <span>
                    <strong className="block text-sm text-brand-deepTeal">{dateLabel(repayment.repaymentDate)}</strong>
                    {repayment.isArchived && <span className="text-xs text-brand-deepTeal/60">Deleted</span>}
                    {!repayment.isArchived && repayment.reconciliationStatus === "NEEDS_REVIEW" && <span className="text-xs font-bold text-warning-amber">Needs review</span>}
                  </span>
                  <span className="flex items-center gap-3">
                    <strong className="text-sm text-brand-deepTeal">{aud(repayment.totalPaymentCents)}</strong>
                    <span className="text-xs font-bold text-brand-teal">{isOpen ? "Hide details" : "Details"}</span>
                  </span>
                </button>

                {isOpen && (
                  <div id={`repayment-details-${repayment.id}`} className="mt-3 border-t border-border pt-3">
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      {([["Principal", repayment.principalCents], ["Interest", repayment.interestCents], ["Fees", repayment.feeCents], ["Balance after", repayment.balanceAfterCents]] as const)
                        .filter(([, value]) => value !== null)
                        .map(([label, value]) => (
                          <div key={label} className="rounded-xl bg-surface-mint p-2">
                            <dt className="text-brand-deepTeal/60">{label}</dt>
                            <dd className="mt-1 font-bold text-brand-deepTeal">{aud(value)}</dd>
                          </div>
                        ))}
                    </dl>

                    {!repayment.isArchived && !repayment.linkedTransaction && matchingRepaymentId !== repayment.id && (
                      <div className="mt-3 rounded-xl bg-surface-mint p-3 text-xs text-brand-deepTeal">
                        <p className="font-bold">Needs review</p>
                        <p className="mt-1 leading-5 text-brand-deepTeal/65">SpendGrove could not find a clear matching transaction.</p>
                        <button type="button" disabled={candidateLoadingId === repayment.id} onClick={() => beginMatching(repayment)} className="mt-3 min-h-10 rounded-full bg-brand-green px-3 font-bold text-white disabled:opacity-50">
                          {candidateLoadingId === repayment.id ? "Checking…" : "Match transaction"}
                        </button>
                      </div>
                    )}

                    {!repayment.isArchived && !repayment.linkedTransaction && matchingRepaymentId === repayment.id && (
                      <div className="mt-3 rounded-xl border border-brand-teal/20 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-bold text-brand-deepTeal">Match transaction</p>
                          <button type="button" onClick={() => { setMatchingRepaymentId(null); setSearchByDateRepaymentId(null); }} className="min-h-10 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal">Cancel</button>
                        </div>

                        {candidateLoadingId === repayment.id && <p className="mt-3 text-xs font-semibold text-brand-deepTeal/65">Checking transactions…</p>}
                        {review && candidateLoadingId !== repayment.id && (
                          <div className="mt-3">
                            <p className="text-xs font-bold text-brand-deepTeal">{review.mode === "OVERRIDE" ? "Transactions on this date" : review.mode === "MANUAL" ? "Other transactions" : "Suggested transactions"}</p>
                            {review.candidates.length === 0 ? (
                              <p className="mt-2 rounded-xl bg-surface-mint p-3 text-xs text-brand-deepTeal">No matching transaction was found.</p>
                            ) : (
                              <ul className="mt-2 space-y-2">
                                {review.candidates.map((candidate) => {
                                  const requiresConfirmation = candidate.confidence !== "HIGH" || review.mode === "OVERRIDE";
                                  const confirmationKey = `${repayment.id}:${candidate.transactionId}`;
                                  return (
                                    <li key={candidate.transactionId} className="rounded-xl bg-surface-mint p-3 text-xs text-brand-deepTeal">
                                      <div className="flex items-center justify-between gap-3">
                                        <strong>{dateLabel(candidate.transactionDate)}</strong>
                                        <strong>{aud(Math.abs(candidate.transactionAmountCents))}</strong>
                                      </div>
                                      {requiresConfirmation && (
                                        <label className="mt-3 flex items-start gap-2 rounded-lg bg-white p-2 font-semibold">
                                          <input type="checkbox" checked={Boolean(confirmedLinks[confirmationKey])} onChange={(event) => onConfirmationChange(confirmationKey, event.target.checked)} className="mt-0.5 accent-brand-green" />
                                          This transaction does not closely match the repayment. Are you sure you want to link it?
                                        </label>
                                      )}
                                      <button
                                        type="button"
                                        disabled={reconciliationSavingId === repayment.id || (requiresConfirmation && !confirmedLinks[confirmationKey])}
                                        onClick={() => onLink(repayment, candidate, review.mode, Boolean(confirmedLinks[confirmationKey]))}
                                        className="mt-3 min-h-10 rounded-full bg-brand-green px-3 font-bold text-white disabled:opacity-45"
                                      >
                                        {reconciliationSavingId === repayment.id ? "Linking…" : "Link transaction"}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}

                            {review.mode === "SUGGESTED" && (
                              <button type="button" disabled={candidateLoadingId === repayment.id} onClick={() => onLoadCandidates(repayment, "MANUAL")} className="mt-3 min-h-10 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal disabled:opacity-50">Search for another transaction</button>
                            )}

                            {review.mode !== "OVERRIDE" && searchByDateRepaymentId !== repayment.id && (
                              <button type="button" onClick={() => setSearchByDateRepaymentId(repayment.id)} className="mt-3 min-h-10 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal">Search by date</button>
                            )}

                            {searchByDateRepaymentId === repayment.id && (
                              <div className="mt-3 rounded-xl bg-white p-3">
                                <label className="block text-xs font-bold text-brand-deepTeal">Search by date
                                  <input type="date" value={overrideDates[repayment.id] ?? ""} onChange={(event) => onOverrideDateChange(repayment.id, event.target.value)} className="mt-2 min-h-10 w-full rounded-lg border border-border px-2 font-normal" />
                                </label>
                                <button type="button" disabled={!overrideDates[repayment.id] || candidateLoadingId === repayment.id} onClick={() => onLoadCandidates(repayment, "OVERRIDE", overrideDates[repayment.id])} className="mt-2 min-h-10 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal disabled:opacity-45">Find transactions</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {repayment.isArchived && <p className="mt-3 text-xs font-semibold text-brand-deepTeal/60">Restore this repayment before editing it.</p>}

                    <details className="mt-3">
                      <summary className="inline-flex min-h-10 cursor-pointer list-none items-center rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">More</summary>
                      <div className="mt-2 flex flex-wrap gap-2 rounded-xl bg-surface-mint p-3">
                        {!repayment.isArchived && !repayment.linkedTransaction && repayment.reconciliationStatus === "UNMATCHED" && (
                          <button type="button" disabled={isSaving} onClick={() => onEdit(repayment)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal disabled:opacity-50">
                            <Pencil aria-hidden="true" className="h-4 w-4" /> Edit repayment
                          </button>
                        )}
                        {!repayment.isArchived && repayment.linkedTransaction && (
                          <button type="button" disabled={reconciliationSavingId === repayment.id} onClick={() => onUnlink(repayment)} className="min-h-10 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal disabled:opacity-50">
                            {reconciliationSavingId === repayment.id ? "Unlinking…" : "Unlink repayment"}
                          </button>
                        )}
                        <button type="button" disabled={isSaving} onClick={() => onArchiveChange(repayment, !repayment.isArchived)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal disabled:opacity-50">
                          {repayment.isArchived ? <RotateCcw aria-hidden="true" className="h-4 w-4" /> : <Archive aria-hidden="true" className="h-4 w-4" />}
                          {repayment.isArchived ? "Restore repayment" : "Delete repayment"}
                        </button>
                      </div>
                    </details>
                  </div>
                )}
              </article>
            </div>
          );
        })}
      </div>

      {visibleRepayments.length > 3 && !cleanupMode && (
        <button type="button" onClick={() => setShowAllRepayments((current) => !current)} className="mt-3 min-h-10 w-full rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
          {showAllRepayments ? "Show latest three" : `View all repayments (${visibleRepayments.length})`}
        </button>
      )}

      <details
        className="mt-4 border-t border-border pt-3"
        onToggle={(event) => changeHistoryFilter(event.currentTarget.open ? "ARCHIVED" : "ACTIVE")}
      >
        <summary className="min-h-10 cursor-pointer text-xs font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">Deleted repayments</summary>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Repayment management filter">
          <button type="button" onClick={() => changeHistoryFilter("ACTIVE")} className={`min-h-10 rounded-full px-3 text-xs font-bold ${historyFilter === "ACTIVE" ? "bg-brand-deepTeal text-white" : "border border-border text-brand-deepTeal"}`}>Current ({repayments.filter((repayment) => !repayment.isArchived).length})</button>
          <button type="button" onClick={() => changeHistoryFilter("ARCHIVED")} className={`min-h-10 rounded-full px-3 text-xs font-bold ${historyFilter === "ARCHIVED" ? "bg-brand-deepTeal text-white" : "border border-border text-brand-deepTeal"}`}>Deleted ({repayments.filter((repayment) => repayment.isArchived).length})</button>
          <button type="button" onClick={() => { setCleanupMode((current) => { if (!current) setShowAllRepayments(true); return !current; }); setSelectedRepaymentIds(new Set()); setBulkConfirmed(false); setBulkSummary(null); }} className="min-h-10 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal">{cleanupMode ? "Finish selecting" : `Select to ${historyFilter === "ACTIVE" ? "delete" : "restore"}`}</button>
        </div>
        {cleanupMode && (
          <div className="mt-3 rounded-2xl border border-brand-teal/30 bg-surface-mint p-4 text-xs text-brand-deepTeal">
            <p className="font-bold">{selectedRepayments.length} selected · maximum 100</p>
            <p className="mt-1">Linked or newly changed repayments are skipped safely. Everyday transactions are never changed or deleted.</p>
            <label className="mt-3 flex items-start gap-2 rounded-xl bg-white p-3 font-semibold">
              <input type="checkbox" checked={bulkConfirmed} disabled={selectedRepayments.length === 0 || isSaving} onChange={(event) => setBulkConfirmed(event.target.checked)} className="mt-0.5 accent-brand-green" />
              I reviewed this selection and want to {historyFilter === "ACTIVE" ? "delete" : "restore"} these repayments.
            </label>
            <button type="button" disabled={!bulkConfirmed || selectedRepayments.length === 0 || isSaving} onClick={() => void applyBulkCleanup()} className="mt-3 min-h-10 rounded-full bg-brand-deepTeal px-4 font-bold text-white disabled:opacity-45">{isSaving ? "Saving…" : historyFilter === "ACTIVE" ? "Delete selected" : "Restore selected"}</button>
          </div>
        )}
        {bulkSummary && <p role="status" className="mt-3 rounded-2xl bg-brand-green/10 p-3 text-xs font-semibold text-brand-deepTeal">{bulkSummary.changedCount} changed and {bulkSummary.skippedCount} skipped because they were already updated, linked or already in that state.</p>}
      </details>
    </section>
  );
}

async function readResult(response: Response): Promise<LoanResult> {
  try {
    const payload = await response.json() as LoanResult;
    return payload.ok ? payload : { ok: false, error: payload.error || "We could not read the account response safely." };
  } catch {
    return { ok: false, error: "We could not read the account response safely." };
  }
}

function Modal({ title, description, onClose, children }: Readonly<{
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}>) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-deepTeal/55 backdrop-blur-sm sm:items-center sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="loan-modal-title" className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-surface-base p-5 shadow-2xl sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="loan-modal-title" className="text-2xl font-bold text-brand-deepTeal">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">{description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-border p-3 text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function centsDraft(value: number | null) {
  return value === null ? "" : (value / 100).toFixed(2);
}

function repaymentCorrectionDraft(repayment: SafeLoanRepayment): RepaymentCorrectionDraft {
  return {
    repaymentDate: repayment.repaymentDate,
    totalPayment: centsDraft(repayment.totalPaymentCents),
    principal: centsDraft(repayment.principalCents),
    interest: centsDraft(repayment.interestCents),
    fees: centsDraft(repayment.feeCents),
    balanceAfter: centsDraft(repayment.balanceAfterCents),
  };
}

function optionalCents(value: string) {
  return value.trim() === "" ? null : parseMoneyToCents(value);
}

function RepaymentCorrectionEditor({ draft, error, isSaving, onChange, onClose, onSave }: Readonly<{
  draft: RepaymentCorrectionDraft;
  error: string;
  isSaving: boolean;
  onChange: (draft: RepaymentCorrectionDraft) => void;
  onClose: () => void;
  onSave: () => void;
}>) {
  return (
    <Modal title="Edit repayment" description="Correct the repayment details below. The original import record stays unchanged." onClose={onClose}>
      <form className="mt-6 space-y-5" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
        <label className="block text-sm font-bold text-brand-deepTeal">Repayment date
          <input type="date" value={draft.repaymentDate} onChange={(event) => onChange({ ...draft, repaymentDate: event.target.value })} required className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          {repaymentMoneyFields.map((field) => (
            <label key={field.key} className="block text-sm font-bold text-brand-deepTeal">{field.label} (AUD)
              <input type="number" inputMode="decimal" min="0" step="0.01" value={draft[field.key]} onChange={(event) => onChange({ ...draft, [field.key]: event.target.value })} required={field.required} placeholder={field.required ? "0.00" : "Not supplied"} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal" />
            </label>
          ))}
        </div>
        <p className="rounded-2xl bg-surface-mint p-4 text-sm leading-6 text-brand-deepTeal/70">Leave optional values blank to keep them as not supplied. Complete principal, interest and fee values must match the total within two cents.</p>
        {error && <p role="alert" className="rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" disabled={isSaving} onClick={onClose} className="min-h-12 rounded-full border border-border px-5 text-sm font-bold text-brand-deepTeal">Cancel</button>
          <button type="submit" disabled={isSaving} className="min-h-12 rounded-full bg-brand-green px-6 text-sm font-bold text-white disabled:opacity-50">{isSaving ? "Saving…" : "Save correction"}</button>
        </div>
      </form>
    </Modal>
  );
}

type LoanDraft = {
  nickname: string;
  kind: LoanKind;
  propertyMode: "none" | "existing" | "new";
  propertyId: string;
  propertyNickname: string;
  propertyUsage: PropertyUsage;
};

function emptyLoanDraft(): LoanDraft {
  return {
    nickname: "",
    kind: "OWNER_OCCUPIER_HOME",
    propertyMode: "none",
    propertyId: "",
    propertyNickname: "",
    propertyUsage: "OWNER_OCCUPIED",
  };
}

function loanDraft(loan: LoanRecord): LoanDraft {
  return {
    nickname: loan.nickname,
    kind: choiceForLoan(loan).kind,
    propertyMode: loan.propertyId ? "existing" : "none",
    propertyId: loan.propertyId ?? "",
    propertyNickname: "",
    propertyUsage: loan.property?.usage ?? "OTHER",
  };
}

function LoanEditor({ draft, properties, isEditing, error, isSaving, onChange, onClose, onSave }: Readonly<{
  draft: LoanDraft;
  properties: PropertyRecord[];
  isEditing: boolean;
  error: string;
  isSaving: boolean;
  onChange: (draft: LoanDraft) => void;
  onClose: () => void;
  onSave: () => void;
}>) {
  const choice = choices.find((candidate) => candidate.kind === draft.kind) ?? choices[4];
  const activeProperties = properties.filter((property) => !property.isArchived);
  const propertyModes = isEditing ? (["none", "existing"] as const) : (["none", "existing", "new"] as const);

  function setKind(kind: LoanKind) {
    const nextChoice = choices.find((candidate) => candidate.kind === kind) ?? choices[4];
    onChange({
      ...draft,
      kind,
      propertyMode: nextChoice.propertyRelevant ? draft.propertyMode : "none",
      propertyId: nextChoice.propertyRelevant ? draft.propertyId : "",
    });
  }

  return (
    <Modal
      title={isEditing ? "Edit Loan Account" : "Add loan"}
      description="Use a nickname you recognise. Do not enter an account number, reference, customer ID or exact address."
      onClose={onClose}
    >
      <form className="mt-6 space-y-5" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
        <label className="block text-sm font-bold text-brand-deepTeal">
          Loan nickname
          <input
            autoFocus
            disabled={isSaving}
            value={draft.nickname}
            onChange={(event) => onChange({ ...draft, nickname: event.target.value })}
            maxLength={80}
            placeholder="For example: Family home loan"
            className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
            required
          />
        </label>

        <label className="block text-sm font-bold text-brand-deepTeal">
          Loan type
          <select
            disabled={isSaving}
            value={draft.kind}
            onChange={(event) => setKind(event.target.value as LoanKind)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
          >
            {choices.map((option) => <option key={option.kind} value={option.kind}>{option.label}</option>)}
          </select>
        </label>

        {choice.propertyRelevant && (
          <fieldset className="rounded-3xl bg-surface-mint p-4">
            <legend className="px-1 text-sm font-bold text-brand-deepTeal">Optional property link</legend>
            <p className="mt-1 text-xs leading-5 text-brand-deepTeal/65">Supporting metadata only. No exact address is requested.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {propertyModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  disabled={isSaving || (mode === "existing" && activeProperties.length === 0)}
                  aria-pressed={draft.propertyMode === mode}
                  onClick={() => onChange({ ...draft, propertyMode: mode })}
                  className={`min-h-11 rounded-2xl px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-green disabled:opacity-45 ${draft.propertyMode === mode ? "bg-brand-deepTeal text-white" : "border border-border bg-white text-brand-deepTeal"}`}
                >
                  {mode === "none" ? "No property" : mode === "existing" ? "Link existing" : "Create property"}
                </button>
              ))}
            </div>
            {draft.propertyMode === "existing" && (
              <label className="mt-4 block text-sm font-bold text-brand-deepTeal">
                Property
                <select
                  value={draft.propertyId}
                  onChange={(event) => onChange({ ...draft, propertyId: event.target.value })}
                  className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal"
                  required
                >
                  <option value="">Choose a property</option>
                  {activeProperties.map((property) => <option key={property.id} value={property.id}>{property.nickname} · {propertyUsageLabels[property.usage]}</option>)}
                </select>
              </label>
            )}
            {!isEditing && draft.propertyMode === "new" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold text-brand-deepTeal">
                  Property nickname
                  <input value={draft.propertyNickname} onChange={(event) => onChange({ ...draft, propertyNickname: event.target.value })} maxLength={80} placeholder="For example: Family home" className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal" required />
                </label>
                <label className="text-sm font-bold text-brand-deepTeal">
                  Property usage
                  <select value={draft.propertyUsage} onChange={(event) => onChange({ ...draft, propertyUsage: event.target.value as PropertyUsage })} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal">
                    {Object.entries(propertyUsageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
              </div>
            )}
          </fieldset>
        )}

        <div className="rounded-2xl border border-brand-green/30 bg-brand-green/5 p-4 text-sm leading-6 text-brand-deepTeal">
          <strong>Neutral record keeping:</strong> Loan purpose and optional property usage are descriptive only. SpendGrove does not decide whether interest or fees are deductible.
        </div>
        {error && <p role="alert" className="rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" disabled={isSaving} onClick={onClose} className="min-h-12 rounded-full border border-border px-5 text-sm font-bold text-brand-deepTeal">Cancel</button>
          <button type="submit" disabled={isSaving} className="min-h-12 rounded-full bg-brand-green px-6 text-sm font-bold text-white disabled:opacity-50">{isSaving ? "Saving…" : "Save Loan Account"}</button>
        </div>
      </form>
    </Modal>
  );
}

function LoansUnavailable() {
  return (
    <section className="rounded-[2rem] border border-border bg-surface-base p-6 shadow-soft">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-surface-mint p-3 text-brand-green"><Landmark aria-hidden="true" className="h-6 w-6" /></div>
        <div>
          <p className="text-sm font-semibold text-brand-teal">Loans</p>
          <h2 className="mt-1 text-2xl font-bold text-brand-deepTeal">Account storage is not configured here</h2>
          <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Loan and optional property metadata is account-only. SpendGrove does not keep a browser-local copy of private loan details.</p>
        </div>
      </div>
    </section>
  );
}

export function LoansManager({
  accountPersistenceAvailable,
  loanImportCompleted = false,
  loanImportSavedCount = null,
}: Readonly<{
  accountPersistenceAvailable: boolean;
  loanImportCompleted?: boolean;
  loanImportSavedCount?: number | null;
}>) {
  if (!accountPersistenceAvailable) return <LoansUnavailable />;
  return <AuthenticatedLoansManager loanImportCompleted={loanImportCompleted} loanImportSavedCount={loanImportSavedCount} />;
}

function AuthenticatedLoansManager({
  loanImportCompleted,
  loanImportSavedCount,
}: Readonly<{
  loanImportCompleted: boolean;
  loanImportSavedCount: number | null;
}>) {
  const { isLoaded, isSignedIn } = useUser();
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [repayments, setRepayments] = useState<SafeLoanRepayment[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [candidateReviews, setCandidateReviews] = useState<Record<string, { mode: ReconciliationCandidateMode; candidates: LoanReconciliationCandidate[] }>>({});
  const [candidateLoadingId, setCandidateLoadingId] = useState("");
  const [reconciliationSavingId, setReconciliationSavingId] = useState("");
  const [confirmedLinks, setConfirmedLinks] = useState<Record<string, boolean>>({});
  const [overrideDates, setOverrideDates] = useState<Record<string, string>>({});
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<{ loanId?: string; draft: LoanDraft } | null>(null);
  const [propertyEditor, setPropertyEditor] = useState<PropertyRecord | null>(null);
  const [propertyNickname, setPropertyNickname] = useState("");
  const [propertyUsage, setPropertyUsage] = useState<PropertyUsage>("OTHER");
  const [repaymentEditor, setRepaymentEditor] = useState<{ repayment: SafeLoanRepayment; draft: RepaymentCorrectionDraft } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    async function loadLoans() {
      setIsReady(false);
      setError("");
      const [result, repaymentResponse] = await Promise.all([
        readResult(await fetch("/api/account/loans", { cache: "no-store" })),
        fetch("/api/account/loan-repayments", { cache: "no-store" }),
      ]);
      const repaymentResult = await repaymentResponse.json() as { ok: boolean; repayments?: SafeLoanRepayment[]; error?: string };
      if (cancelled) return;
      if (result.ok) {
        setLoans(result.loans);
        setProperties(result.properties);
        if (repaymentResult.ok) setRepayments(repaymentResult.repayments ?? []);
        else setError(repaymentResult.error || "We could not load repayment history.");
      } else {
        setError(result.error);
      }
      setIsReady(true);
    }
    void loadLoans();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  const activeLoans = useMemo(() => loans.filter((loan) => !loan.isArchived), [loans]);
  const selectedLoan = useMemo(
    () => activeLoans.find((loan) => loan.id === selectedLoanId) ?? null,
    [activeLoans, selectedLoanId],
  );
  const selectedLoanRepayments = useMemo(
    () => selectedLoan
      ? repayments
          .filter((repayment) => repayment.loanAccountId === selectedLoan.id)
          .sort((left, right) => right.repaymentDate.localeCompare(left.repaymentDate))
      : [],
    [repayments, selectedLoan],
  );
  const selectedPropertyActivityKey = selectedLoanRepayments
    .map((repayment) => `${repayment.id}:${repayment.updatedAt}:${repayment.linkedTransaction?.transactionId ?? "none"}`)
    .join("|");
  const archivedLoans = useMemo(() => loans.filter((loan) => loan.isArchived), [loans]);
  const activeLoanPropertyIds = useMemo(
    () => new Set(activeLoans.flatMap((loan) => loan.propertyId ? [loan.propertyId] : [])),
    [activeLoans],
  );
  const otherProperties = useMemo(
    () => properties.filter((property) => !activeLoanPropertyIds.has(property.id)),
    [activeLoanPropertyIds, properties],
  );

  function applyResult(result: LoanResult) {
    if (result.ok) {
      setLoans(result.loans);
      setProperties(result.properties);
      setError("");
      return true;
    }
    setError(result.error);
    return false;
  }

  async function saveLoan() {
    if (!editor || isSaving) return;
    setIsSaving(true);
    setError("");
    const choice = choices.find((candidate) => candidate.kind === editor.draft.kind) ?? choices[4];
    const isEditing = Boolean(editor.loanId);
    const body = isEditing
      ? {
          nickname: editor.draft.nickname,
          choice: { kind: choice.kind, type: choice.type, purpose: choice.purpose },
          propertyId: choice.propertyRelevant && editor.draft.propertyMode === "existing" ? editor.draft.propertyId : null,
        }
      : {
          nickname: editor.draft.nickname,
          choice: { kind: choice.kind, type: choice.type, purpose: choice.purpose },
          propertyId: choice.propertyRelevant && editor.draft.propertyMode === "existing" ? editor.draft.propertyId : undefined,
          newProperty: choice.propertyRelevant && editor.draft.propertyMode === "new"
            ? { nickname: editor.draft.propertyNickname, usage: editor.draft.propertyUsage }
            : undefined,
        };
    const response = await fetch(isEditing ? `/api/account/loans/${editor.loanId}` : "/api/account/loans", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await readResult(response);
    setIsSaving(false);
    if (applyResult(result)) setEditor(null);
  }

  async function setLoanArchived(loan: LoanRecord, isArchived: boolean) {
    setIsSaving(true);
    const result = await readResult(await fetch(`/api/account/loans/${loan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived }),
    }));
    setIsSaving(false);
    applyResult(result);
  }

  async function setRepaymentArchived(repayment: SafeLoanRepayment, isArchived: boolean) {
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/account/loan-repayments/${repayment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived }),
      });
      const result = await response.json() as { ok: boolean; repayment?: SafeLoanRepayment; error?: string };
      if (!response.ok || !result.ok || !result.repayment) throw new Error(result.error || "We could not update that repayment.");
      setRepayments((current) => current.map((item) => item.id === repayment.id ? result.repayment! : item));
      setCandidateReviews((current) => {
        const next = { ...current };
        delete next[repayment.id];
        return next;
      });
    } catch (repaymentError) {
      setError(repaymentError instanceof Error ? repaymentError.message : "We could not update that repayment safely.");
    } finally {
      setIsSaving(false);
    }
  }

  async function bulkSetRepaymentArchived(selected: SafeLoanRepayment[], isArchived: boolean) {
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch("/api/account/loan-repayments/archive", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isArchived,
          confirmed: true,
          repayments: selected.slice(0, 100).map((repayment) => ({
            repaymentId: repayment.id,
            expectedUpdatedAt: repayment.updatedAt,
          })),
        }),
      });
      const result = await response.json() as { ok: boolean; summary?: LoanRepaymentBulkArchiveSummary; error?: string };
      if (!response.ok || !result.ok || !result.summary) throw new Error(result.error || "We could not update those repayments.");
      await refreshRepaymentHistory();
      setCandidateReviews({});
      return result.summary;
    } catch (cleanupError) {
      setError(cleanupError instanceof Error ? cleanupError.message : "We could not update those repayments safely.");
      throw cleanupError;
    } finally {
      setIsSaving(false);
    }
  }

  async function saveRepaymentCorrection() {
    if (!repaymentEditor || isSaving) return;
    setIsSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/account/loan-repayments/${repaymentEditor.repayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedUpdatedAt: repaymentEditor.repayment.updatedAt,
          repayment: {
            repaymentDate: repaymentEditor.draft.repaymentDate,
            totalPaymentCents: parseMoneyToCents(repaymentEditor.draft.totalPayment),
            principalCents: optionalCents(repaymentEditor.draft.principal),
            interestCents: optionalCents(repaymentEditor.draft.interest),
            feeCents: optionalCents(repaymentEditor.draft.fees),
            balanceAfterCents: optionalCents(repaymentEditor.draft.balanceAfter),
          },
        }),
      });
      const result = await response.json() as { ok: boolean; repayment?: SafeLoanRepayment; error?: string };
      if (!response.ok || !result.ok || !result.repayment) throw new Error(result.error || "We could not save that correction.");
      setRepayments((current) => current.map((item) => item.id === result.repayment!.id ? result.repayment! : item));
      setCandidateReviews((current) => {
        const next = { ...current };
        delete next[result.repayment!.id];
        return next;
      });
      setRepaymentEditor(null);
    } catch (correctionError) {
      setError(correctionError instanceof Error ? correctionError.message : "We could not save that correction safely.");
    } finally {
      setIsSaving(false);
    }
  }

  async function loadReconciliationCandidates(repayment: SafeLoanRepayment, mode: ReconciliationCandidateMode, overrideDate?: string) {
    setCandidateLoadingId(repayment.id);
    setError("");
    try {
      const modeParam = mode === "OVERRIDE" ? "override" : mode === "MANUAL" ? "manual" : "suggested";
      const dateParam = mode === "OVERRIDE" && overrideDate ? `&date=${encodeURIComponent(overrideDate)}` : "";
      const response = await fetch(`/api/account/loan-repayments/${repayment.id}/candidates?mode=${modeParam}${dateParam}`, { cache: "no-store" });
      const result = await response.json() as { ok: boolean; mode?: ReconciliationCandidateMode; candidates?: LoanReconciliationCandidate[]; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "We could not check possible matches.");
      setCandidateReviews((current) => ({ ...current, [repayment.id]: { mode: result.mode ?? mode, candidates: result.candidates ?? [] } }));
    } catch (candidateError) {
      setError(candidateError instanceof Error ? candidateError.message : "We could not check possible matches safely.");
    } finally {
      setCandidateLoadingId("");
    }
  }

  async function refreshRepaymentHistory() {
    const response = await fetch("/api/account/loan-repayments", { cache: "no-store" });
    const result = await response.json() as { ok: boolean; repayments?: SafeLoanRepayment[]; error?: string };
    if (!response.ok || !result.ok) throw new Error(result.error || "We could not refresh repayment history.");
    setRepayments(result.repayments ?? []);
  }

  async function linkRepayment(repayment: SafeLoanRepayment, candidate: LoanReconciliationCandidate, mode: ReconciliationCandidateMode, mismatchConfirmed: boolean) {
    setReconciliationSavingId(repayment.id);
    setError("");
    try {
      const response = await fetch(`/api/account/loan-repayments/${repayment.id}/reconciliation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: candidate.transactionId, selectionMode: mode, mismatchConfirmed }),
      });
      const result = await response.json() as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "We could not link that repayment.");
      await refreshRepaymentHistory();
      setCandidateReviews((current) => {
        const next = { ...current };
        delete next[repayment.id];
        return next;
      });
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : "We could not link that repayment safely.");
    } finally {
      setReconciliationSavingId("");
    }
  }

  async function unlinkRepayment(repayment: SafeLoanRepayment) {
    setReconciliationSavingId(repayment.id);
    setError("");
    try {
      const response = await fetch(`/api/account/loan-repayments/${repayment.id}/reconciliation`, { method: "DELETE" });
      const result = await response.json() as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "We could not unlink that repayment.");
      await refreshRepaymentHistory();
    } catch (unlinkError) {
      setError(unlinkError instanceof Error ? unlinkError.message : "We could not unlink that repayment safely.");
    } finally {
      setReconciliationSavingId("");
    }
  }

  function openProperty(property: PropertyRecord) {
    setPropertyEditor(property);
    setPropertyNickname(property.nickname);
    setPropertyUsage(property.usage);
    setError("");
  }

  async function saveProperty(isArchived = propertyEditor?.isArchived ?? false) {
    if (!propertyEditor || isSaving) return;
    setIsSaving(true);
    const result = await readResult(await fetch(`/api/account/properties/${propertyEditor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: propertyNickname, usage: propertyUsage, isArchived }),
    }));
    setIsSaving(false);
    if (applyResult(result)) setPropertyEditor(null);
  }

  if (!isLoaded) return <section aria-busy="true" className="rounded-[2rem] border border-border bg-surface-base p-8 text-center shadow-soft"><p className="font-semibold text-brand-deepTeal/70">Checking your account session…</p></section>;

  if (!isSignedIn) {
    return (
      <section className="rounded-[2rem] border border-border bg-surface-base p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-surface-mint p-3 text-brand-green"><Landmark aria-hidden="true" className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-semibold text-brand-teal">Loans</p>
            <h2 className="mt-1 text-2xl font-bold text-brand-deepTeal">Sign in to manage Loan Accounts</h2>
            <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Loan and optional property metadata is account-only. No browser-local fallback stores private loan details.</p>
            {!isSignedIn && <SignInButton mode="modal"><button type="button" className="mt-4 min-h-12 rounded-full bg-brand-green px-5 text-sm font-bold text-white">Sign in</button></SignInButton>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {!selectedLoan && (
        <PageHeader
          title="Loans"
          description="Keep repayments together and review Property transactions only when they are relevant."
          action={(
            <div className="flex flex-wrap gap-2">
              <Link href="/loans/import" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface-base px-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-green">
                Import repayments
              </Link>
              <button type="button" onClick={() => { setError(""); setEditor({ draft: emptyLoanDraft() }); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-evergreen px-4 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand-green">
                <Plus aria-hidden="true" className="h-4 w-4" /> Add loan
              </button>
            </div>
          )}
        />
      )}

      {!selectedLoan && loanImportCompleted && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-brand-green bg-brand-green/10 p-4 text-sm text-brand-deepTeal">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
          <p>
            <strong className="block">Loan CSV imported.</strong>
            {loanImportSavedCount === null
              ? "Repayments were saved."
              : `${loanImportSavedCount} repayment${loanImportSavedCount === 1 ? "" : "s"} saved.`}
          </p>
        </div>
      )}

      {error && <div role="alert" className="flex gap-3 rounded-2xl border border-warning-amber bg-warning-amber/10 p-4 text-sm text-brand-deepTeal"><AlertTriangle aria-hidden="true" className="h-5 w-5 shrink-0 text-warning-amber" /><p>{error}</p></div>}

      {!isReady ? (
        <section aria-busy="true" className="rounded-[2rem] border border-border bg-surface-base p-8 text-center shadow-soft"><p className="font-semibold text-brand-deepTeal/70">Loading your Loan Accounts…</p></section>
      ) : activeLoans.length === 0 ? (
        <section className="rounded-[2rem] border border-border bg-surface-base p-8 text-center shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-mint text-brand-green"><Landmark aria-hidden="true" className="h-7 w-7" /></div>
          <h2 className="mt-5 text-2xl font-bold text-brand-deepTeal">No loans yet.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-deepTeal/70">Add your first loan using a safe nickname. Property details are optional.</p>
        </section>
      ) : selectedLoan ? (
        <section aria-labelledby="selected-loan-heading">
          <button type="button" onClick={() => setSelectedLoanId(null)} className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">Back to loans</button>
          <article className="mt-3 rounded-2xl border border-border bg-surface-base p-4 sm:p-5">
            <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-teal">Loan</p>
                <h2 id="selected-loan-heading" className="mt-1 truncate text-2xl font-bold text-brand-deepTeal">{selectedLoan.nickname}</h2>
                <p className="mt-1 text-sm text-brand-deepTeal/65">{choiceForLoan(selectedLoan).tag}{selectedLoan.property ? ` · ${selectedLoan.property.nickname}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setError(""); setEditor({ loanId: selectedLoan.id, draft: loanDraft(selectedLoan) }); }} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal px-4 text-xs font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">
                  <Pencil aria-hidden="true" className="h-4 w-4" /> Edit loan
                </button>
                <details className="relative">
                  <summary className="flex min-h-10 cursor-pointer list-none items-center rounded-full border border-border px-4 text-xs font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">More</summary>
                  <div className="mt-2 space-y-2 rounded-2xl border border-border bg-white p-3 shadow-soft sm:absolute sm:right-0 sm:z-10 sm:min-w-52">
                    {selectedLoan.property && (
                      <button type="button" aria-label={`Edit ${selectedLoan.property.nickname} Property`} onClick={() => openProperty(selectedLoan.property!)} className="min-h-10 w-full rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal">Edit property</button>
                    )}
                    <button type="button" disabled={isSaving} onClick={() => void setLoanArchived(selectedLoan, true)} className="min-h-10 w-full rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal">Delete loan</button>
                  </div>
                </details>
              </div>
            </div>

            <RepaymentHistory
              repayments={selectedLoanRepayments}
              isSaving={isSaving}
              candidateReviews={candidateReviews}
              candidateLoadingId={candidateLoadingId}
              reconciliationSavingId={reconciliationSavingId}
              confirmedLinks={confirmedLinks}
              overrideDates={overrideDates}
              onArchiveChange={(repayment, archived) => void setRepaymentArchived(repayment, archived)}
              onBulkArchiveChange={bulkSetRepaymentArchived}
              onEdit={(repayment) => { setError(""); setRepaymentEditor({ repayment, draft: repaymentCorrectionDraft(repayment) }); }}
              onLoadCandidates={(repayment, mode, overrideDate) => void loadReconciliationCandidates(repayment, mode, overrideDate)}
              onConfirmationChange={(key, confirmed) => setConfirmedLinks((current) => ({ ...current, [key]: confirmed }))}
              onOverrideDateChange={(repaymentId, date) => setOverrideDates((current) => ({ ...current, [repaymentId]: date }))}
              onLink={(repayment, candidate, mode, confirmed) => void linkRepayment(repayment, candidate, mode, confirmed)}
              onUnlink={(repayment) => void unlinkRepayment(repayment)}
            />

            {selectedLoan.property && (
              <PropertyRecordKeepingActivity key={`${selectedLoan.property.id}:${selectedPropertyActivityKey}`} propertyId={selectedLoan.property.id} variant="loan-detail" />
            )}
          </article>
        </section>
      ) : (
        <section aria-labelledby="loan-list-heading">
          <div className="px-1"><h2 id="loan-list-heading" className="text-lg font-semibold text-foreground">Your loans</h2><p className="mt-0.5 text-sm text-muted">{activeLoans.length} active</p></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {activeLoans.map((loan) => {
              const choice = choiceForLoan(loan);
              const Icon = choice.kind === "CAR" ? Car : choice.propertyRelevant ? Home : Landmark;
              const loanRepayments = repayments
                .filter((repayment) => repayment.loanAccountId === loan.id && !repayment.isArchived)
                .sort((left, right) => right.repaymentDate.localeCompare(left.repaymentDate));
              const latestRepayment = loanRepayments[0] ?? null;
              const needsReview = loanRepayments.some((repayment) => repayment.reconciliationStatus === "NEEDS_REVIEW");

              return (
                <article key={loan.id} className="rounded-2xl border border-border bg-surface-base p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-2xl bg-surface-mint p-3 text-brand-green"><Icon aria-hidden="true" className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-brand-deepTeal">{loan.nickname}</h3>
                      <p className="mt-1 text-sm text-brand-deepTeal/65">{choice.tag}{loan.property ? ` · ${loan.property.nickname}` : ""}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-brand-deepTeal/65">
                    {latestRepayment ? `Latest repayment ${dateLabel(latestRepayment.repaymentDate)} · ${aud(latestRepayment.totalPaymentCents)}` : "No repayments imported yet"}
                  </p>
                  {needsReview && <p className="mt-2 text-xs font-bold text-warning-amber">Needs review</p>}
                  <button type="button" onClick={() => setSelectedLoanId(loan.id)} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-evergreen px-4 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand-green">View loan</button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {!selectedLoan && otherProperties.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface-base p-4">
          <p className="text-sm font-semibold text-brand-teal">Other property records</p>
          <h2 className="mt-1 text-xl font-bold text-brand-deepTeal">Properties without an active loan</h2>
          <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">These properties are not linked to an active loan.</p>
          <div className="mt-4 space-y-3">
            {otherProperties.map((property) => (
              <div key={property.id} className="space-y-2 rounded-2xl bg-surface-mint p-2">
                <button type="button" onClick={() => openProperty(property)} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-2 text-left focus:outline-none focus:ring-2 focus:ring-brand-green">
                  <span><strong className="block text-brand-deepTeal">{property.nickname}</strong><span className="text-xs text-brand-deepTeal/65">{propertyUsageLabels[property.usage]}{property.isArchived ? " · Deleted" : ""}</span></span>
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-brand-teal"><Pencil aria-hidden="true" className="h-4 w-4" /> Edit</span>
                </button>
                <PropertyRecordKeepingActivity propertyId={property.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      {!selectedLoan && archivedLoans.length > 0 && (
        <details className="rounded-2xl border border-border bg-surface-base">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green">
            Deleted loans ({archivedLoans.length})
            <span aria-hidden="true" className="text-muted">›</span>
          </summary>
          <div className="space-y-2 border-t border-border p-4">{archivedLoans.map((loan) => <div key={loan.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-subtle p-3"><span className="text-sm font-semibold text-foreground">{loan.nickname}</span><button type="button" disabled={isSaving} onClick={() => void setLoanArchived(loan, false)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold text-foreground"><RotateCcw aria-hidden="true" className="h-4 w-4" /> Restore</button></div>)}</div>
        </details>
      )}

      {!selectedLoan && <details className="border-t border-border px-1 py-3 text-sm leading-6 text-muted">
        <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-bold text-brand-deepTeal"><ShieldCheck aria-hidden="true" className="h-5 w-5 text-brand-green" /> How SpendGrove keeps loan information private</summary>
        <p className="mt-2">SpendGrove stores safe nicknames and broad details only. It does not ask for an address, account number, masked reference, customer ID or source narration.</p>
        <p className="mt-2 font-semibold text-brand-teal">Record keeping only - not tax advice.</p>
      </details>}

      {editor && <LoanEditor draft={editor.draft} properties={properties} isEditing={Boolean(editor.loanId)} error={error} isSaving={isSaving} onChange={(draft) => { setEditor({ ...editor, draft }); setError(""); }} onClose={() => setEditor(null)} onSave={() => void saveLoan()} />}

      {repaymentEditor && <RepaymentCorrectionEditor draft={repaymentEditor.draft} error={error} isSaving={isSaving} onChange={(draft) => { setRepaymentEditor({ ...repaymentEditor, draft }); setError(""); }} onClose={() => { setRepaymentEditor(null); setError(""); }} onSave={() => void saveRepaymentCorrection()} />}

      {propertyEditor && (
        <Modal title="Edit property" description="Use a nickname and broad usage only. Do not enter an exact address." onClose={() => setPropertyEditor(null)}>
          <form className="mt-6 space-y-5" onSubmit={(event) => { event.preventDefault(); void saveProperty(); }}>
            <label className="block text-sm font-bold text-brand-deepTeal">Property nickname<input value={propertyNickname} onChange={(event) => setPropertyNickname(event.target.value)} maxLength={80} required className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal" /></label>
            <label className="block text-sm font-bold text-brand-deepTeal">Property usage<select value={propertyUsage} onChange={(event) => setPropertyUsage(event.target.value as PropertyUsage)} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal">{Object.entries(propertyUsageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            {error && <p role="alert" className="rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button type="button" disabled={isSaving} onClick={() => void saveProperty(!propertyEditor.isArchived)} className="min-h-12 rounded-full border border-border px-5 text-sm font-bold text-brand-deepTeal">{propertyEditor.isArchived ? "Restore property" : "Delete property"}</button>
              <button type="submit" disabled={isSaving} className="min-h-12 rounded-full bg-brand-green px-6 text-sm font-bold text-white">{isSaving ? "Saving…" : "Save property"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
