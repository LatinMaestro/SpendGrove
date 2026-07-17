"use client";

import { useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, FileSearch, FileUp, RefreshCw, ShieldCheck, TableProperties } from "lucide-react";
import { ImportReviewFoundation } from "@/components/import-review-foundation";
import { SavedImportProfilesPanel } from "@/components/saved-import-profiles-panel";
import {
  MAX_CSV_FILE_SIZE_BYTES,
  parseCsvDocument,
  scanCsvDocument,
  type CsvColumnRole,
  type CsvScanResult,
  type TransientCsvDocument,
} from "@/lib/csv-import";
import { moveBackFromReview, moveToMappingStep, moveToReviewStep, resetImportFlow, type ImportFlowStep } from "@/lib/import-flow";
import { createImportMappingPreview } from "@/lib/import-mapping-preview";
import { getManualCategory } from "@/lib/manual-categories";
import { formatAudFromCents } from "@/lib/money";

const roleOptions: Array<{ value: CsvColumnRole; label: string }> = [
  { value: "DATE", label: "Transaction date" },
  { value: "AMOUNT", label: "Transaction amount" },
  { value: "DEBIT", label: "Money out / Debit" },
  { value: "CREDIT", label: "Money in / Credit" },
  { value: "DESCRIPTION", label: "Description" },
  { value: "MERCHANT", label: "Merchant / payee" },
  { value: "IGNORE", label: "Ignore column" },
];

function formatFileSize(bytes: number) { return bytes < 1024 ? `${bytes} bytes` : `${(bytes / 1024).toFixed(1)} KB`; }
function formatPreviewDate(date: string | null) {
  if (!date) return "Check date";
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
}
function StepHeading({ step, title, description }: { step: number; title: string; description: string }) {
  const labels = ["Choose file", "Confirm columns", "Review", "Import"];
  return (
    <header>
      <ol aria-label="Import progress" className="grid grid-cols-4 gap-2">
        {labels.map((label, index) => (
          <li key={label} aria-current={index + 1 === step ? "step" : undefined} className={index + 1 <= step ? "border-t-2 border-brand-evergreen pt-2 text-xs font-bold text-brand-evergreen" : "border-t-2 border-border pt-2 text-xs font-semibold text-muted"}>
            <span className="hidden sm:inline">{label}</span><span className="sm:hidden">{index + 1}</span>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-sm font-semibold text-muted">Step {step} of 4</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
    </header>
  );
}

export function CsvImportFoundation() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportFlowStep>("UPLOAD");
  const [document, setDocument] = useState<TransientCsvDocument | null>(null);
  const [scan, setScan] = useState<CsvScanResult | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [mappingConfirmed, setMappingConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [isReading, setIsReading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(""); setIsReading(true); setMappingConfirmed(false);
    try {
      if (!file.name.toLocaleLowerCase("en-AU").endsWith(".csv")) throw new Error("Choose a CSV file. Other statement formats are not supported yet.");
      if (file.size > MAX_CSV_FILE_SIZE_BYTES) throw new Error("Choose a CSV smaller than 5 MB.");
      const parsed = parseCsvDocument(await file.text());
      const checked = scanCsvDocument(parsed);
      setDocument(parsed); setScan(checked); setSelectedFileSize(file.size); setStep(moveToMappingStep(true));
    } catch (fileError) {
      setDocument(null); setScan(null); setSelectedFileSize(null); setStep(resetImportFlow());
      setError(fileError instanceof Error ? fileError.message : "The CSV could not be checked.");
    } finally {
      setIsReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }
  function clearFile() { setDocument(null); setScan(null); setSelectedFileSize(null); setMappingConfirmed(false); setError(""); setStep(resetImportFlow()); }
  function updateMapping(columnIndex: number, role: CsvColumnRole) {
    if (!document || !scan) return;
    setScan(scanCsvDocument(document, { ...scan.mapping, [columnIndex]: role })); setMappingConfirmed(false); setError("");
  }
  function applySavedProfile(nextScan: CsvScanResult) {
    setScan(nextScan);
    setMappingConfirmed(false);
    setError("");
  }
  function confirmMapping() {
    if (!scan || scan.mappingIssues.length > 0) { setError("Check the required column matches before confirming."); return; }
    setMappingConfirmed(true); setError("");
  }
  function continueToReview() {
    if (!scan || !mappingConfirmed) { setError("Confirm the column mapping before continuing to review."); return; }
    try { setStep(moveToReviewStep(scan.mappingIssues)); setError(""); }
    catch (mappingError) { setError(mappingError instanceof Error ? mappingError.message : "Check the column matches before continuing."); }
  }

  if (step === "UPLOAD") return <div className="space-y-5">
    <StepHeading step={1} title="Import transactions" description="Choose a bank CSV, check the transactions, then import only what you approve." />
    <section className="rounded-2xl border border-dashed border-brand-teal/50 bg-surface-base p-6 text-center sm:p-8"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-mint text-brand-green"><FileUp aria-hidden="true" className="h-7 w-7" /></div><h2 className="mt-5 text-2xl font-bold text-brand-deepTeal">Choose your CSV file</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-brand-deepTeal/70">Your file stays on this device. We do not display its original name, upload it or send it to another service.</p><input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => void handleFile(event.target.files?.[0])} /><button type="button" onClick={() => inputRef.current?.click()} disabled={isReading} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-evergreen px-5 text-sm font-bold text-white disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">{isReading ? <RefreshCw aria-hidden="true" className="h-5 w-5 animate-spin" /> : <FileSearch aria-hidden="true" className="h-5 w-5" />}{isReading ? "Checking on this device…" : "Upload CSV"}</button><p className="mt-3 text-xs font-semibold text-brand-teal">CSV only · maximum 5 MB</p>{error && <p role="alert" className="mx-auto mt-5 max-w-xl rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}</section>
    <details className="border-t border-border pt-3 text-sm text-muted"><summary className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg py-3 font-semibold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"><ShieldCheck aria-hidden="true" className="h-4 w-4" /> How this import stays private</summary><ul className="space-y-1 pb-2 leading-6"><li>The file is checked only in this browser.</li><li>Private account details are hidden before review.</li><li>No transactions are created during preview.</li></ul></details>
  </div>;

  if (step === "MAPPING" && document && scan && mappingConfirmed) {
    return <div className="space-y-5">
      <StepHeading step={2} title="Columns ready" description="SpendGrove found the information needed for review. Continue, or open the column choices if something looks wrong." />
      <section className="rounded-2xl border border-border bg-surface-base p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0 text-brand-green" />
          <div>
            <h2 className="text-xl font-bold text-brand-deepTeal">Ready to review {scan.parsedRowCount} transaction row{scan.parsedRowCount === 1 ? "" : "s"}</h2>
            <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">The file remains in this browser and nothing has been saved yet.</p>
          </div>
        </div>
        {error && <p role="alert" className="mt-5 rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => setMappingConfirmed(false)} className="min-h-11 rounded-full border border-border px-4 text-sm font-bold text-brand-deepTeal">More column options</button>
          <button type="button" onClick={continueToReview} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-deepTeal px-6 text-sm font-bold text-white">Review transactions <ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      </section>
    </div>;
  }

  if (step === "MAPPING" && document && scan) {
    const previewRows = scan.mappingIssues.length === 0 ? createImportMappingPreview(document, scan.columns, scan.mapping) : [];
    return <div className="space-y-5">
      <StepHeading step={2} title="Check the columns" description="Confirm the required columns. You can change any match before reviewing transactions." />
      <section className="rounded-2xl border border-border bg-surface-base p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-brand-teal">Selected CSV file</p><h2 className="mt-1 text-xl font-bold text-brand-deepTeal">Ready to match</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">{selectedFileSize === null ? "File size unavailable" : formatFileSize(selectedFileSize)} · {scan.parsedRowCount} transaction row{scan.parsedRowCount === 1 ? "" : "s"} found</p>{!scan.hasHeader && <p className="mt-2 text-sm font-semibold text-brand-green">We kept the first line as a transaction and added simple column labels.</p>}</div><button type="button" onClick={clearFile} className="min-h-12 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal">Choose another file</button></div>{scan.profile.requiresManualMapping && <div role="status" className="mt-5 flex gap-3 rounded-2xl border border-warning-amber bg-warning-amber/10 p-4 text-sm leading-6 text-brand-deepTeal"><AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warning-amber" /><p><strong>Please check the column matches.</strong> Nothing moves forward until the required choices are complete.</p></div>}</section>
      <details className="group rounded-2xl border border-border bg-surface-base">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus sm:px-6">
          Use or manage a saved column setup
          <span aria-hidden="true" className="text-muted transition group-open:rotate-90">›</span>
        </summary>
        <div className="border-t border-border p-4 sm:p-6">
          <SavedImportProfilesPanel
            document={document}
            scan={scan}
            mappingConfirmed={mappingConfirmed}
            onApplyScan={applySavedProfile}
          />
        </div>
      </details>
      <section className="rounded-2xl border border-border bg-surface-base p-5 sm:p-6" aria-labelledby="column-mapping-heading"><div className="flex items-start gap-3"><TableProperties aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" /><div><h2 id="column-mapping-heading" className="text-xl font-bold text-brand-deepTeal">Match and confirm your columns</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Choose what each available column means. Negative amounts are money out and positive amounts are money in.</p></div></div><div className="mt-5 space-y-3">{scan.columns.filter((column) => !column.isPrivate).map((column) => <label key={column.index} className="grid gap-2 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_14rem] sm:items-center"><span><strong className="block text-brand-deepTeal">{column.safeLabel}</strong><span className="mt-1 block text-xs text-brand-deepTeal/60">Column {column.index + 1}</span></span><select value={scan.mapping[column.index]} onChange={(event) => updateMapping(column.index, event.target.value as CsvColumnRole)} className="min-h-12 rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-brand-deepTeal">{roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}</div>
        {scan.mappingIssues.length > 0 && <div role="status" className="mt-5 rounded-2xl bg-warning-amber/10 p-4"><p className="font-bold text-brand-deepTeal">Please finish matching the required columns</p><ul className="mt-2 space-y-1 text-sm text-brand-deepTeal/75">{scan.mappingIssues.map((issue) => <li key={issue}>• {issue}</li>)}</ul></div>}
        <div className="mt-6 border-t border-border pt-6"><h2 className="text-xl font-bold text-brand-deepTeal">Preview</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Check that these look right before reviewing all transactions.</p>{previewRows.length === 0 ? <p className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">Match the required columns to see a preview.</p> : <div className="mt-4 grid gap-3 lg:grid-cols-3">{previewRows.map((row) => { const category = getManualCategory(row.categoryId); return <article key={row.id} className="rounded-2xl bg-surface-mint p-4"><dl className="space-y-3 text-sm"><div><dt className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">Date</dt><dd className="mt-1 font-semibold text-brand-deepTeal">{formatPreviewDate(row.date)}</dd></div><div><dt className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">Amount</dt><dd className="mt-1 font-semibold text-brand-deepTeal">{row.amountCents === null ? "Check amount" : formatAudFromCents(row.amountCents)}</dd></div><div><dt className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">Description / merchant</dt><dd className="mt-1 font-semibold text-brand-deepTeal">{row.merchantName || "Payment"}</dd></div><div><dt className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">Suggested category</dt><dd className="mt-1 font-semibold text-brand-deepTeal">{category?.name ?? "Needs review"}</dd></div></dl></article>; })}</div>}</div>
        {mappingConfirmed && <p role="status" className="mt-5 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">Columns confirmed. Continue to review when you are ready.</p>}{error && <p role="alert" className="mt-5 rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={clearFile} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal"><ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to upload</button>{mappingConfirmed ? <button type="button" onClick={continueToReview} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-deepTeal px-6 text-sm font-bold text-white">Continue to review <ArrowRight aria-hidden="true" className="h-4 w-4" /></button> : <button type="button" onClick={confirmMapping} disabled={scan.mappingIssues.length > 0} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-deepTeal px-6 text-sm font-bold text-white disabled:opacity-35"><CheckCircle2 aria-hidden="true" className="h-4 w-4" /> Confirm mapping</button>}</div>
      </section>
    </div>;
  }

  if (step === "REVIEW" && document && scan) return <div className="space-y-5"><StepHeading step={3} title="Review transactions" description="Choose Import, Skip or Merge for each row, then import the transactions you approve." /><button type="button" onClick={() => setStep(moveBackFromReview())} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-brand-teal bg-white px-5 text-sm font-bold text-brand-deepTeal"><ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to column matching</button><ImportReviewFoundation document={document} scan={scan} autoStart /></div>;
  return null;
}
