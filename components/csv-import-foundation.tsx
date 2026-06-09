"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  FileUp,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  TableProperties,
} from "lucide-react";
import { formatAudFromCents } from "@/lib/money";
import {
  getSafeSelectedCsvLabel,
  MAX_CSV_FILE_SIZE_BYTES,
  parseCsvDocument,
  scanCsvDocument,
  type CsvColumnRole,
  type CsvScanResult,
  type TransientCsvDocument,
} from "@/lib/csv-import";

const roleOptions: Array<{ value: CsvColumnRole; label: string }> = [
  { value: "DATE", label: "Transaction date" },
  { value: "AMOUNT", label: "Signed amount" },
  { value: "DEBIT", label: "Debit / money out" },
  { value: "CREDIT", label: "Credit / money in" },
  { value: "DESCRIPTION", label: "Description" },
  { value: "MERCHANT", label: "Merchant / payee" },
  { value: "IGNORE", label: "Ignore column" },
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} bytes`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatPreviewDate(date: string | null) {
  if (!date) return "Needs mapping";
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function CsvImportFoundation() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [document, setDocument] = useState<TransientCsvDocument | null>(null);
  const [scan, setScan] = useState<CsvScanResult | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<number | null>(null);
  const [selectedFileLabel, setSelectedFileLabel] = useState("");
  const [error, setError] = useState("");
  const [isReading, setIsReading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setIsReading(true);

    try {
      if (!file.name.toLocaleLowerCase("en-AU").endsWith(".csv")) {
        throw new Error("Choose a CSV file. Other statement formats are not supported in this task.");
      }
      if (file.size > MAX_CSV_FILE_SIZE_BYTES) {
        throw new Error("Choose a CSV smaller than 5 MB for this Phase 1 foundation.");
      }

      const parsedDocument = parseCsvDocument(await file.text());
      setDocument(parsedDocument);
      setScan(scanCsvDocument(parsedDocument));
      setSelectedFileSize(file.size);
      setSelectedFileLabel(getSafeSelectedCsvLabel(file.name));
    } catch (fileError) {
      setDocument(null);
      setScan(null);
      setSelectedFileSize(null);
      setSelectedFileLabel("");
      setError(fileError instanceof Error ? fileError.message : "The CSV could not be checked.");
    } finally {
      setIsReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function updateMapping(columnIndex: number, role: CsvColumnRole) {
    if (!document || !scan) return;
    setScan(scanCsvDocument(document, { ...scan.mapping, [columnIndex]: role }));
  }

  function clearFile() {
    setDocument(null);
    setScan(null);
    setSelectedFileSize(null);
    setSelectedFileLabel("");
    setError("");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-border bg-surface-mint p-5 shadow-soft sm:p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-brand-green p-3 text-white">
            <ShieldCheck aria-hidden="true" className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-teal">CSV import foundation</p>
            <h2 className="mt-2 text-2xl font-bold text-brand-deepTeal">Your file is checked locally first.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-deepTeal/75">
              SpendGrove reads the selected CSV inside this browser, excludes private banking fields and shows only sanitised mapped previews. The file is not uploaded, saved or sent to a third party.
            </p>
          </div>
        </div>
      </section>

      {!scan ? (
        <section className="rounded-[2rem] border border-dashed border-brand-teal bg-surface-base p-6 text-center shadow-soft sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-mint text-brand-green">
            <FileUp aria-hidden="true" className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-bold text-brand-deepTeal">Choose a transaction CSV</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-brand-deepTeal/70">
            Use a transaction export only. Home loan and personal loan CSVs remain outside this task. Original filenames are not displayed because they may contain private account information.
          </p>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => void handleFile(event.target.files?.[0])} />
          <button type="button" onClick={() => inputRef.current?.click()} disabled={isReading} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-deepTeal px-6 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-green disabled:cursor-wait disabled:opacity-70">
            {isReading ? <RefreshCw aria-hidden="true" className="h-5 w-5 animate-spin" /> : <FileSearch aria-hidden="true" className="h-5 w-5" />}
            {isReading ? "Checking locally…" : "Select CSV file"}
          </button>
          <p className="mt-3 text-xs font-semibold text-brand-teal">CSV only · maximum 5 MB · transient browser memory</p>
          {error && <p role="alert" className="mx-auto mt-5 max-w-xl rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
        </section>
      ) : (
        <>
          <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="scan-summary-heading">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-teal">Local privacy scan complete</p>
                <h2 id="scan-summary-heading" className="mt-1 text-2xl font-bold text-brand-deepTeal">{scan.profile.displayName}</h2>
                <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">
                  {selectedFileLabel} · {selectedFileSize === null ? "size unavailable" : formatFileSize(selectedFileSize)} · {scan.parsedRowCount} data row{scan.parsedRowCount === 1 ? "" : "s"}
                </p>
              </div>
              <button type="button" onClick={clearFile} className="min-h-12 rounded-full border border-brand-teal px-5 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">Choose another file</button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-surface-mint p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Detected profile</p>
                <p className="mt-2 font-bold text-brand-deepTeal">{scan.profile.bankName}</p>
                <p className="mt-1 text-xs text-brand-deepTeal/65">{scan.profile.confidence}% structural confidence</p>
              </div>
              <div className="rounded-2xl bg-surface-mint p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Header row</p>
                <p className="mt-2 font-bold text-brand-deepTeal">{scan.hasHeader ? "Detected" : "Not detected"}</p>
                <p className="mt-1 text-xs text-brand-deepTeal/65">{scan.hasHeader ? "First row used as labels" : "First row preserved as data"}</p>
              </div>
              <div className="rounded-2xl bg-surface-mint p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Private columns</p>
                <p className="mt-2 font-bold text-brand-deepTeal">{scan.privateColumnCount} excluded</p>
                <p className="mt-1 text-xs text-brand-deepTeal/65">Never shown in row previews</p>
              </div>
              <div className="rounded-2xl bg-surface-mint p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Next state</p>
                <p className="mt-2 font-bold text-brand-deepTeal">{scan.mappingIssues.length > 0 || scan.profile.requiresManualMapping ? "Manual mapping" : "Mapping ready"}</p>
                <p className="mt-1 text-xs text-brand-deepTeal/65">Nothing has been saved</p>
              </div>
            </div>

            {scan.profile.requiresManualMapping && (
              <div role="status" className="mt-5 flex gap-3 rounded-2xl border border-warning-amber bg-warning-amber/10 p-4 text-sm leading-6 text-brand-deepTeal">
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warning-amber" />
                <p><strong>Manual mapping recommended.</strong> {scan.hasHeader ? "This CSV is unknown or only partly matches a supported profile." : "No confident header row was found, so generic column labels are used and every row remains data."} Confirm the columns below rather than relying on a low-confidence guess.</p>
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="privacy-columns-heading">
            <div className="flex items-start gap-3">
              <LockKeyhole aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
              <div>
                <h2 id="privacy-columns-heading" className="text-xl font-bold text-brand-deepTeal">Private columns excluded</h2>
                <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Header and sample-value patterns are checked locally. Excluded columns cannot be selected for mapping and their values never enter the preview.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {scan.columns.filter((column) => column.isPrivate).length > 0 ? scan.columns.filter((column) => column.isPrivate).map((column) => (
                <div key={column.index} className="flex items-center justify-between gap-3 rounded-2xl bg-danger-red/10 p-4">
                  <div><p className="font-bold text-brand-deepTeal">{column.safeLabel}</p><p className="mt-1 text-xs text-brand-deepTeal/65">{column.privacyReason}</p></div>
                  <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-danger-red">Excluded</span>
                </div>
              )) : (
                <div className="rounded-2xl bg-surface-mint p-4 sm:col-span-2">
                  <p className="flex items-center gap-2 font-bold text-brand-deepTeal"><CheckCircle2 aria-hidden="true" className="h-5 w-5 text-brand-green" /> No private columns detected in the checked sample.</p>
                  <p className="mt-1 text-sm text-brand-deepTeal/65">You still review the mapped fields before any later commit step.</p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="column-mapping-heading">
            <div className="flex items-start gap-3">
              <TableProperties aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal" />
              <div><h2 id="column-mapping-heading" className="text-xl font-bold text-brand-deepTeal">Map safe columns</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Confirm how non-private columns should be interpreted. Headerless and unknown formats remain here until the required fields are mapped.</p></div>
            </div>
            <div className="mt-5 space-y-3">
              {scan.columns.filter((column) => !column.isPrivate).map((column) => (
                <label key={column.index} className="grid gap-2 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_14rem] sm:items-center">
                  <span><strong className="block text-brand-deepTeal">{column.safeLabel}</strong><span className="mt-1 block text-xs text-brand-deepTeal/60">CSV column {column.index + 1}</span></span>
                  <select value={scan.mapping[column.index]} onChange={(event) => updateMapping(column.index, event.target.value as CsvColumnRole)} className="min-h-12 rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-brand-deepTeal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20">
                    {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              ))}
            </div>
            {scan.mappingIssues.length > 0 && <div role="status" className="mt-5 rounded-2xl bg-warning-amber/10 p-4"><p className="font-bold text-brand-deepTeal">Mapping needs attention</p><ul className="mt-2 space-y-1 text-sm text-brand-deepTeal/75">{scan.mappingIssues.map((issue) => <li key={issue}>• {issue}</li>)}</ul></div>}
          </section>

          <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="sanitised-preview-heading">
            <div><p className="text-sm font-semibold text-brand-teal">Sanitised mapped fields only</p><h2 id="sanitised-preview-heading" className="mt-1 text-xl font-bold text-brand-deepTeal">Row preview</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Private columns, balances, references and ignored fields are not shown. This preview is transient and does not create transactions.</p></div>
            <div className="mt-5 space-y-3">
              {scan.previewRows.map((row) => (
                <article key={row.rowNumber} className="rounded-2xl bg-surface-mint p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">CSV row {row.rowNumber}</p><p className="mt-1 font-bold text-brand-deepTeal">{row.description || row.merchantName || "Description needs mapping"}</p><p className="mt-1 text-sm text-brand-deepTeal/65">{formatPreviewDate(row.date)}</p></div>
                    <p className="font-bold text-brand-deepTeal">{row.amountCents === null ? "Amount needs mapping" : formatAudFromCents(row.amountCents)}</p>
                  </div>
                  {row.warningCodes.length > 0 && <p className="mt-3 text-xs font-semibold text-warning-amber">Needs review: {row.warningCodes.join(", ").replaceAll("_", " ").toLocaleLowerCase("en-AU")}</p>}
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-surface-mint p-5">
            <p className="font-bold text-brand-deepTeal">Review-before-commit boundary</p>
            <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Task 1.5 stops after privacy scanning, profile detection and mapping. Import, Skip and Merge actions—and creating or changing transactions—belong to Task 1.6 and are not active here.</p>
            <button type="button" disabled className="mt-4 min-h-12 cursor-not-allowed rounded-full bg-brand-deepTeal/20 px-5 text-sm font-bold text-brand-deepTeal/55">Continue to row review — Task 1.6</button>
          </section>
        </>
      )}

      <section className="rounded-3xl border border-border bg-surface-base p-5 shadow-soft">
        <p className="flex items-center gap-2 font-bold text-brand-deepTeal"><CheckCircle2 aria-hidden="true" className="h-5 w-5 text-brand-green" /> Local-only guarantees in this task</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-brand-deepTeal/70">
          <li>• No raw CSV persistence, upload, server request or third-party processing.</li>
          <li>• No raw row logging, runtime database write or transaction creation.</li>
          <li>• Closing or refreshing the page clears the selected file and transient scan.</li>
        </ul>
      </section>
    </div>
  );
}
