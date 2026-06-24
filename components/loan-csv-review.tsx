"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SignInButton, useUser } from "@clerk/nextjs";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Landmark,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  assessLoanCsvColumns,
  buildLoanCsvReview,
  buildSuggestedLoanCsvMapping,
  detectLoanCsvMappingMode,
  type LoanCsvColumn,
  type LoanCsvColumnRole,
  type LoanCsvMapping,
  type LoanCsvMappingMode,
  type LoanCsvReviewRow,
  shouldSuggestPropertyRecordKeeping,
} from "@/lib/loan-csv-review";
import { MAX_CSV_FILE_SIZE_BYTES, parseCsvDocument, type TransientCsvDocument } from "@/lib/csv-import";

type PropertyRecord = {
  id: string;
  nickname: string;
  usage: "OWNER_OCCUPIED" | "INVESTMENT" | "OTHER";
  isArchived: boolean;
};

type LoanRecord = {
  id: string;
  nickname: string;
  type: "HOME_LOAN" | "CAR_LOAN" | "PERSONAL_LOAN" | "OTHER";
  purpose: "OWNER_OCCUPIER" | "INVESTMENT" | "PERSONAL" | "OTHER";
  isArchived: boolean;
  property?: PropertyRecord | null;
};

type LoanResult =
  | { ok: true; loans: LoanRecord[]; properties: PropertyRecord[] }
  | { ok: false; error: string };

const roleLabels: Record<LoanCsvColumnRole, string> = {
  DATE: "Date",
  TOTAL_PAYMENT: "Total payment",
  PRINCIPAL: "Principal",
  INTEREST: "Interest",
  FEES: "Fees",
  SIGNED_AMOUNT: "Signed amount",
  EVENT_TYPE: "Loan event type",
  BALANCE_AFTER: "Balance after",
  IGNORE: "Do not use",
  PRIVATE: "Private — excluded",
};

const selectableRoles: Record<LoanCsvMappingMode, LoanCsvColumnRole[]> = {
  COMPONENT_COLUMNS: ["DATE", "TOTAL_PAYMENT", "PRINCIPAL", "INTEREST", "FEES", "BALANCE_AFTER", "IGNORE"],
  ROW_EVENT_LEDGER: ["DATE", "SIGNED_AMOUNT", "EVENT_TYPE", "BALANCE_AFTER", "IGNORE"],
};

const classificationLabels: Record<NonNullable<LoanCsvReviewRow["classification"]>, string> = {
  REPAYMENT: "Repayment",
  INTEREST: "Interest",
  FEE: "Fee",
  LOAN_ADVANCE: "Loan advance",
  ADJUSTMENT: "Adjustment",
  UNKNOWN: "Needs review",
};

function loanLabel(loan: LoanRecord) {
  if (loan.type === "CAR_LOAN") return "Car loan";
  if (loan.type === "PERSONAL_LOAN") return "Personal loan";
  if (loan.type === "HOME_LOAN" && loan.purpose === "OWNER_OCCUPIER") return "Owner-occupier";
  if (loan.type === "HOME_LOAN" && loan.purpose === "INVESTMENT") return "Investment";
  return "Other";
}

function propertyUsageLabel(usage: PropertyRecord["usage"]) {
  return usage === "OWNER_OCCUPIED" ? "Owner-occupied" : usage === "INVESTMENT" ? "Investment" : "Other";
}

function aud(cents: number | null) {
  if (cents === null) return "Needs review";
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);
}

function dateLabel(date: string | null) {
  if (!date) return "Date needs review";
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

function ReviewRow({ row, selectedLoan }: Readonly<{ row: LoanCsvReviewRow; selectedLoan: LoanRecord }>) {
  const isRepaymentBreakdown = row.isGroupedRepayment || (!row.classification && row.totalPaymentCents !== null);
  const title = row.isGroupedRepayment
    ? "Repayment breakdown"
    : row.classification ? classificationLabels[row.classification] : `CSV row ${row.rowNumber}`;
  const primaryAmount = row.totalPaymentCents ?? row.eventAmountCents ?? row.principalCents ?? row.interestCents ?? row.feeCents;
  const suggestPropertyRecordKeeping = shouldSuggestPropertyRecordKeeping(selectedLoan.purpose, row);
  return (
    <article className="rounded-3xl border border-border bg-surface-base p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-teal">
            {title}
          </p>
          <h3 className="mt-1 text-lg font-bold text-brand-deepTeal">
            {isRepaymentBreakdown ? "Repayment date" : "Review date"}: {dateLabel(row.date)}
          </h3>
          {row.sourceRowCount > 1 && (
            <p className="mt-1 text-xs font-semibold text-brand-deepTeal/60">
              Grouped from {row.sourceRowCount} same-day ledger rows.
            </p>
          )}
        </div>
        <p className="text-lg font-bold text-brand-deepTeal">{aud(primaryAmount)}</p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {([
          ["Total repayment", row.totalPaymentCents],
          ["Principal", row.principalCents],
          ["Interest", row.interestCents],
          ["Fees", row.feeCents],
          ["Balance after", row.balanceAfterCents],
        ] as const).map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-surface-mint p-3">
            <dt className="text-xs font-semibold text-brand-deepTeal/60">{label}</dt>
            <dd className="mt-1 font-bold text-brand-deepTeal">{value === null ? "Not supplied" : aud(value)}</dd>
          </div>
        ))}
      </dl>
      {row.componentNotes.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-brand-deepTeal">
          {row.componentNotes.map((note) => (
            <li key={note} className="rounded-full bg-brand-green/10 px-3 py-1">{note}</li>
          ))}
        </ul>
      )}
      {suggestPropertyRecordKeeping && (
        <p className="mt-4 rounded-2xl bg-brand-green/10 p-3 text-sm font-semibold text-brand-deepTeal">
          Potential property tax record: interest on an investment loan - review later for record-keeping.
        </p>
      )}
      {row.warningCodes.length > 0 && (
        <p className="mt-4 flex gap-2 rounded-2xl bg-warning-amber/10 p-3 text-sm font-semibold text-brand-deepTeal">
          <AlertTriangle aria-hidden="true" className="h-5 w-5 shrink-0 text-warning-amber" />
          Check this row’s date, amount or classification before any later commit step.
        </p>
      )}
    </article>
  );
}

function Unavailable() {
  return (
    <section className="rounded-[2rem] border border-border bg-surface-base p-6 shadow-soft">
      <p className="text-sm font-semibold text-brand-teal">Loan CSV review</p>
      <h2 className="mt-1 text-2xl font-bold text-brand-deepTeal">Account storage is not configured here</h2>
      <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">A Loan Account is required before local CSV review can begin.</p>
    </section>
  );
}

export function LoanCsvReview({ accountPersistenceAvailable }: Readonly<{ accountPersistenceAvailable: boolean }>) {
  if (!accountPersistenceAvailable) return <Unavailable />;
  return <AuthenticatedLoanCsvReview />;
}

function AuthenticatedLoanCsvReview() {
  const { isLoaded, isSignedIn } = useUser();
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [document, setDocument] = useState<TransientCsvDocument | null>(null);
  const [columns, setColumns] = useState<LoanCsvColumn[]>([]);
  const [mode, setMode] = useState<LoanCsvMappingMode>("COMPONENT_COLUMNS");
  const [mappings, setMappings] = useState<Record<LoanCsvMappingMode, LoanCsvMapping>>({
    COMPONENT_COLUMNS: {},
    ROW_EVENT_LEDGER: {},
  });
  const [step, setStep] = useState<"SELECT" | "MAP" | "REVIEW">("SELECT");
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    async function loadLoans() {
      setIsReady(false);
      try {
        const response = await fetch("/api/account/loans", { cache: "no-store" });
        const result = await response.json() as LoanResult;
        if (!cancelled) {
          if (result.ok) setLoans(result.loans.filter((loan) => !loan.isArchived));
          else setError(result.error);
        }
      } catch {
        if (!cancelled) setError("We could not load your Loan Accounts.");
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }
    void loadLoans();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  const selectedLoan = loans.find((loan) => loan.id === selectedLoanId) ?? null;
  const mapping = mappings[mode];
  const review = useMemo(
    () => document ? buildLoanCsvReview(document, columns, mapping, mode) : null,
    [columns, document, mapping, mode],
  );

  function clearCsv() {
    setDocument(null);
    setColumns([]);
    setMode("COMPONENT_COLUMNS");
    setMappings({ COMPONENT_COLUMNS: {}, ROW_EVENT_LEDGER: {} });
    setStep("SELECT");
    setError("");
  }

  async function chooseFile(file: File | undefined) {
    setError("");
    if (!selectedLoan) {
      setError("Choose the Loan Account that owns this CSV first.");
      return;
    }
    if (!file) return;
    if (file.size > MAX_CSV_FILE_SIZE_BYTES) {
      setError("Choose a CSV smaller than 5 MB.");
      return;
    }
    try {
      const nextDocument = parseCsvDocument(await file.text());
      const nextColumns = assessLoanCsvColumns(nextDocument);
      const nextMode = detectLoanCsvMappingMode(nextDocument, nextColumns);
      setDocument(nextDocument);
      setColumns(nextColumns);
      setMode(nextMode);
      setMappings({
        COMPONENT_COLUMNS: buildSuggestedLoanCsvMapping(nextColumns, "COMPONENT_COLUMNS"),
        ROW_EVENT_LEDGER: buildSuggestedLoanCsvMapping(nextColumns, "ROW_EVENT_LEDGER"),
      });
      setStep("MAP");
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : "We could not read that CSV safely.");
    }
  }

  if (!isLoaded) return <section aria-busy="true" className="rounded-[2rem] border border-border bg-surface-base p-8 text-center shadow-soft"><p className="font-semibold text-brand-deepTeal/70">Checking your account session…</p></section>;

  if (!isSignedIn) {
    return (
      <section className="rounded-[2rem] border border-border bg-surface-base p-6 shadow-soft">
        <p className="text-sm font-semibold text-brand-teal">Loan CSV review</p>
        <h2 className="mt-1 text-2xl font-bold text-brand-deepTeal">Sign in and choose a Loan Account first</h2>
        <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">The CSV itself remains in this browser tab and is not uploaded or saved.</p>
        <SignInButton mode="modal"><button type="button" className="mt-4 min-h-12 rounded-full bg-brand-green px-5 text-sm font-bold text-white">Sign in</button></SignInButton>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] bg-brand-deepTeal p-6 text-white shadow-soft">
        <Link href="/loans" className="inline-flex items-center gap-2 text-sm font-bold text-white/75"><ArrowLeft aria-hidden="true" className="h-4 w-4" /> Loans</Link>
        <p className="mt-5 text-sm font-semibold text-white/70">Browser-local review</p>
        <h1 className="mt-2 text-3xl font-bold">Import Loan CSV</h1>
        <p className="mt-3 text-sm leading-6 text-white/75">Choose a loan account, match the columns, and review repayment breakdowns before anything is saved.</p>
        <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">Review only - nothing saved yet</p>
      </section>

      <section className="rounded-3xl border border-border bg-surface-base p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-surface-mint p-3 text-brand-green"><Landmark aria-hidden="true" className="h-5 w-5" /></div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-teal">Step 1</p>
            <h2 className="mt-1 text-xl font-bold text-brand-deepTeal">Choose the owning Loan Account</h2>
          </div>
        </div>
        {!isReady ? <p className="mt-4 text-sm text-brand-deepTeal/70">Loading Loan Accounts…</p> : loans.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm text-brand-deepTeal">Add an active Loan Account before reviewing a CSV.</p>
        ) : (
          <label className="mt-4 block text-sm font-bold text-brand-deepTeal">
            Loan Account
            <select
              value={selectedLoanId}
              onChange={(event) => {
                setSelectedLoanId(event.target.value);
                if (document) clearCsv();
              }}
              className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal"
            >
              <option value="">Choose a Loan Account</option>
              {loans.map((loan) => <option key={loan.id} value={loan.id}>{loan.nickname} · {loanLabel(loan)}</option>)}
            </select>
          </label>
        )}
        {selectedLoan && (
          <div className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm text-brand-deepTeal">
            <p><strong>{selectedLoan.nickname}</strong> · {loanLabel(selectedLoan)}</p>
            {selectedLoan.property && <p className="mt-2 flex items-center gap-2"><Building2 aria-hidden="true" className="h-4 w-4 text-brand-teal" /> {selectedLoan.property.nickname} · {propertyUsageLabel(selectedLoan.property.usage)}</p>}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-surface-base p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-surface-mint p-3 text-brand-green"><FileSpreadsheet aria-hidden="true" className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-teal">Step 2</p>
            <h2 className="mt-1 text-xl font-bold text-brand-deepTeal">Choose and match the CSV</h2>
          </div>
        </div>
        {!document && (
          <label className={`mt-4 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-5 text-center ${selectedLoan ? "border-brand-green bg-brand-green/5" : "cursor-not-allowed border-border bg-surface-mint opacity-60"}`}>
            <span className="font-bold text-brand-deepTeal">{selectedLoan ? "Choose loan CSV" : "Choose a Loan Account first"}</span>
            <span className="mt-1 text-xs text-brand-deepTeal/60">CSV only · maximum 5 MB · filename is not retained</span>
            <input type="file" accept=".csv,text/csv" disabled={!selectedLoan} className="sr-only" onChange={(event) => void chooseFile(event.target.files?.[0])} />
          </label>
        )}
        {document && (
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-brand-green/5 p-4">
              <div><p className="font-bold text-brand-deepTeal">Selected loan CSV</p><p className="text-xs text-brand-deepTeal/60">{document.rows.length} loan row{document.rows.length === 1 ? "" : "s"} held in this tab</p></div>
              <button type="button" onClick={clearCsv} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal"><RotateCcw aria-hidden="true" className="h-4 w-4" /> Reset</button>
            </div>
            <fieldset className="mt-4 rounded-3xl bg-surface-mint p-4">
              <legend className="px-1 text-sm font-bold text-brand-deepTeal">Loan CSV format</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {([
                  ["ROW_EVENT_LEDGER", "Loan ledger", "Rows describe events such as repayments, interest, fees or balance changes."],
                  ["COMPONENT_COLUMNS", "Repayment breakdown", "Columns separately provide payment, principal, interest or fees."],
                ] as const).map(([value, label, description]) => (
                  <label key={value} className={`cursor-pointer rounded-2xl border p-3 ${mode === value ? "border-brand-green bg-white" : "border-border bg-surface-base"}`}>
                    <span className="flex items-center gap-2 font-bold text-brand-deepTeal">
                      <input
                        type="radio"
                        name="loan-csv-format"
                        value={value}
                        checked={mode === value}
                        onChange={() => {
                          setMode(value);
                          setStep("MAP");
                        }}
                      />
                      {label}
                    </span>
                    <span className="mt-1 block pl-6 text-xs leading-5 text-brand-deepTeal/65">{description}</span>
                  </label>
                ))}
              </div>
              {mode === "ROW_EVENT_LEDGER" && (
                <p className="mt-3 rounded-2xl bg-brand-green/10 p-3 text-sm text-brand-deepTeal">
                  This looks like a loan ledger CSV. We matched the date, amount, event type and balance columns. Same-day repayment, interest and fee rows are grouped into one repayment breakdown where safe.
                </p>
              )}
            </fieldset>
            <div className="mt-4 space-y-3">
              {columns.map((column) => (
                <label key={column.index} className="grid gap-2 rounded-2xl border border-border p-3 text-sm font-bold text-brand-deepTeal sm:grid-cols-2 sm:items-center">
                  <span>{column.safeLabel}</span>
                  <select
                    value={mapping[column.index] ?? "IGNORE"}
                    disabled={column.isPrivate}
                    onChange={(event) => setMappings({
                      ...mappings,
                      [mode]: { ...mapping, [column.index]: event.target.value as LoanCsvColumnRole },
                    })}
                    className="min-h-11 rounded-xl border border-border bg-white px-3 font-normal disabled:bg-surface-mint"
                  >
                    {(column.isPrivate ? ["PRIVATE" as const] : selectableRoles[mode]).map((role) => (
                      <option key={role} value={role}>
                        {role === "DATE" ? mode === "ROW_EVENT_LEDGER" ? "Event date" : "Repayment date" : roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            {review && review.mappingIssues.length > 0 && <ul className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm text-brand-deepTeal">{review.mappingIssues.map((issue) => <li key={issue}>• {issue}</li>)}</ul>}
            <button type="button" disabled={!review || review.mappingIssues.length > 0} onClick={() => setStep("REVIEW")} className="mt-4 min-h-12 w-full rounded-full bg-brand-green px-5 text-sm font-bold text-white disabled:opacity-45">Review loan rows</button>
          </div>
        )}
      </section>

      {step === "REVIEW" && review && selectedLoan && (
        <section>
          <div className="px-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-teal">Step 3</p>
            <h2 className="mt-1 text-2xl font-bold text-brand-deepTeal">Review only — nothing saved</h2>
            <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">These sanitized amounts belong to <strong>{selectedLoan.nickname}</strong>. Raw narration is not shown.</p>
          </div>
          <div className="mt-4 space-y-4">{review.rows.map((row) => <ReviewRow key={row.rowNumber} row={row} selectedLoan={selectedLoan} />)}</div>
          <div className="mt-5 rounded-3xl border border-brand-green/30 bg-brand-green/5 p-5 text-sm leading-6 text-brand-deepTeal">
            <p className="flex items-center gap-2 font-bold"><CheckCircle2 aria-hidden="true" className="h-5 w-5 text-brand-green" /> Review complete for this tab</p>
            <p className="mt-2">Durable repayment commit and reconciliation are deliberately not available in Milestone 1.</p>
          </div>
        </section>
      )}

      {error && <p role="alert" className="rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
      <section className="rounded-3xl bg-surface-mint p-5 text-sm leading-6 text-brand-deepTeal/75">
        <p className="flex items-center gap-2 font-bold text-brand-deepTeal"><ShieldCheck aria-hidden="true" className="h-5 w-5 text-brand-green" /> Browser-local privacy boundary</p>
        <p className="mt-2">The file, raw rows, filename and narration stay in browser memory and are discarded when reset or when this page closes. Only the selected safe Loan Account metadata is read from SpendGrove.</p>
      </section>
    </div>
  );
}
