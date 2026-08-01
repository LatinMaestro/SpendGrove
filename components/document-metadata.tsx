"use client";

import { FileText, Link2, Plus, ShieldCheck, Trash2, Unlink, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";

type Category = "RECEIPT" | "INVOICE" | "LOAN_STATEMENT" | "PROPERTY_RECORD" | "REPORT_EVIDENCE" | "OTHER";
type LinkTarget = {
  id: string;
  targetType: string;
  targetKey: string;
};
type Document = {
  id: string;
  displayName: string;
  category: Category;
  status: string;
  contentType: string;
  sizeBytes: number;
  documentDate: string | null;
  financialYear: string | null;
  links: LinkTarget[];
};
type Candidate = {
  targetType: string;
  targetKey: string;
  targetEntityId: string | null;
  title: string;
  detail: string;
};
type Response = {
  ok: true;
  documents: Document[];
  linkCandidates: Candidate[];
} | { ok: false; error: string };

const CATEGORY_LABEL: Record<Category, string> = {
  RECEIPT: "Receipt",
  INVOICE: "Invoice",
  LOAN_STATEMENT: "Loan statement",
  PROPERTY_RECORD: "Property record",
  REPORT_EVIDENCE: "Report evidence",
  OTHER: "Other",
};

const CONTENT_LABEL: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG image",
  "image/png": "PNG image",
};

async function readResponse(response: globalThis.Response): Promise<Response> {
  try {
    const value = await response.json() as Response;
    if (response.ok && value.ok) return value;
    return { ok: false, error: value.ok ? "Document details could not be loaded." : value.error };
  } catch {
    return { ok: false, error: "Document details could not be loaded." };
  }
}

function dateOnly(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function DocumentMetadata({ available = false }: { available?: boolean }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [linkCandidates, setLinkCandidates] = useState<Candidate[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState<Category>("RECEIPT");
  const [contentType, setContentType] = useState("application/pdf");
  const [documentDate, setDocumentDate] = useState("");
  const [financialYear, setFinancialYear] = useState("");
  const [linkByDocument, setLinkByDocument] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function apply(value: Extract<Response, { ok: true }>) {
    setDocuments(value.documents);
    setLinkCandidates(value.linkCandidates);
  }

  async function load() {
    const result = await readResponse(await fetch("/api/account/documents", { cache: "no-store" }));
    if (result.ok) apply(result);
    else setError(result.error);
    setReady(true);
  }

  useEffect(() => {
    if (available) void load();
  }, [available]);

  async function mutate(input: Record<string, unknown>, key: string, success: string) {
    if (busy) return;
    setBusy(key);
    setError("");
    setMessage("");
    const result = await readResponse(await fetch("/api/account/documents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }));
    setBusy("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    apply(result);
    setMessage(success);
  }

  async function createMetadata() {
    await mutate({
      action: "CREATE_METADATA",
      displayName,
      category,
      contentType,
      documentDate: documentDate || null,
      financialYear: financialYear || null,
    }, "create", "Document record added. No file was uploaded.");
    setDisplayName("");
    setDocumentDate("");
    setFinancialYear("");
    setShowCreate(false);
  }

  if (!available) return null;

  return (
    <section className="mt-6" aria-labelledby="document-metadata-heading">
      <details className="rounded-2xl border border-border bg-surface-base">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green">
          <span className="flex items-center gap-2"><FileText aria-hidden="true" className="h-4 w-4 text-brand-teal" />Documents and receipts</span>
          <span aria-hidden="true" className="text-muted">›</span>
        </summary>
        <div className="space-y-5 border-t border-border p-4 sm:p-5">
          <div>
            <h2 id="document-metadata-heading" className="text-lg font-bold text-brand-deepTeal">Document records</h2>
            <p className="mt-1 text-sm leading-6 text-brand-deepTeal/70">Organise private document details and links now. Secure file storage is not configured, so SpendGrove cannot receive or open file contents.</p>
          </div>

          {message && <p role="status" className="rounded-2xl bg-surface-mint p-3 text-sm font-semibold text-brand-deepTeal">{message}</p>}
          {error && <p role="alert" className="rounded-2xl bg-danger-red/10 p-3 text-sm font-semibold text-danger-red">{error}</p>}

          <div className="flex flex-col gap-3 rounded-2xl bg-surface-mint p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-bold text-brand-deepTeal">Secure file upload unavailable</p><p className="mt-1 text-sm text-brand-deepTeal/65">No file bytes, images or document text leave your device in this Preview.</p></div>
            <button type="button" disabled aria-disabled="true" title="Secure private storage must be approved and configured first." className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-brand-deepTeal opacity-55"><UploadCloud aria-hidden="true" className="h-4 w-4" />Upload file</button>
          </div>

          {!showCreate ? <button type="button" onClick={() => setShowCreate(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white"><Plus aria-hidden="true" className="h-4 w-4" />Add document record</button> : (
            <div className="rounded-2xl border border-border p-4">
              <h3 className="font-bold text-brand-deepTeal">New document record</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-brand-deepTeal">Document label<input value={displayName} maxLength={120} onChange={(event) => setDisplayName(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal" /></label>
                <label className="text-xs font-bold text-brand-deepTeal">Category<select value={category} onChange={(event) => setCategory(event.target.value as Category)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal">{Object.entries(CATEGORY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="text-xs font-bold text-brand-deepTeal">Expected file type<select value={contentType} onChange={(event) => setContentType(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal">{Object.entries(CONTENT_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="text-xs font-bold text-brand-deepTeal">Document date (optional)<input type="date" value={documentDate} onChange={(event) => setDocumentDate(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal" /></label>
                <label className="text-xs font-bold text-brand-deepTeal">Financial year (optional)<input value={financialYear} placeholder="2026-27" pattern="\d{4}-\d{2}" onChange={(event) => setFinancialYear(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal" /></label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={!displayName.trim() || Boolean(busy)} onClick={() => void createMetadata()} className="min-h-11 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white disabled:opacity-50">Save record</button><button type="button" onClick={() => setShowCreate(false)} className="min-h-11 rounded-xl border border-border px-4 text-sm font-bold text-brand-deepTeal">Cancel</button></div>
            </div>
          )}

          {!ready ? <p aria-busy="true" className="text-sm text-brand-deepTeal/65">Loading document records…</p> : documents.length === 0 ? <p className="rounded-xl bg-surface-mint p-4 text-sm text-brand-deepTeal/65">No document records yet.</p> : <div className="space-y-3">{documents.map((document) => <article key={document.id} className="rounded-2xl border border-border p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold text-brand-deepTeal">{document.displayName}</p><p className="mt-1 text-sm text-brand-deepTeal/65">{CATEGORY_LABEL[document.category]} · {CONTENT_LABEL[document.contentType] ?? "Document"}{dateOnly(document.documentDate) ? ` · ${dateOnly(document.documentDate)}` : ""}{document.financialYear ? ` · FY ${document.financialYear}` : ""}</p><p className="mt-1 text-xs font-semibold text-brand-teal">Record only · file not uploaded</p></div><button type="button" onClick={() => void mutate({ action: "DELETE", documentId: document.id }, document.id, "Document record deleted. No file cleanup was required.")} className="inline-flex min-h-10 items-center gap-1 self-start rounded-full border border-border px-3 text-xs font-bold text-danger-red"><Trash2 aria-hidden="true" className="h-3.5 w-3.5" />Delete record</button></div><details className="mt-3 border-t border-border pt-3"><summary className="min-h-10 cursor-pointer text-sm font-bold text-brand-deepTeal">Links ({document.links.length})</summary><div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end"><label className="flex-1 text-xs font-bold text-brand-deepTeal">Link to one of your records<select value={linkByDocument[document.id] ?? ""} onChange={(event) => setLinkByDocument((current) => ({ ...current, [document.id]: event.target.value }))} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-normal"><option value="">Choose a record or report</option>{linkCandidates.map((candidate) => <option key={`${candidate.targetType}:${candidate.targetKey}`} value={`${candidate.targetType}|${candidate.targetKey}|${candidate.targetEntityId ?? ""}`}>{candidate.title} · {candidate.detail}</option>)}</select></label><button type="button" disabled={!linkByDocument[document.id] || Boolean(busy)} onClick={() => {
              const [targetType, targetKey, targetEntityId] = (linkByDocument[document.id] ?? "").split("|");
              const input = targetEntityId ? { action: "LINK", documentId: document.id, targetType, targetEntityId } : { action: "LINK", documentId: document.id, targetType, targetKey };
              void mutate(input, `link-${document.id}`, "Document record linked.");
            }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal disabled:opacity-50"><Link2 aria-hidden="true" className="h-4 w-4" />Add link</button></div>{document.links.length > 0 && <ul className="mt-3 space-y-2">{document.links.map((link) => <li key={link.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-mint p-3"><span className="text-sm font-semibold text-brand-deepTeal">{link.targetType.replaceAll("_", " ").toLowerCase()}</span><button type="button" onClick={() => void mutate({ action: "UNLINK", documentId: document.id, linkId: link.id }, link.id, "Document link removed.")} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-brand-deepTeal"><Unlink aria-hidden="true" className="h-3.5 w-3.5" />Remove link</button></li>)}</ul>}</details></article>)}</div>}

          <div className="flex items-start gap-2 rounded-xl bg-surface-mint p-3 text-xs leading-5 text-brand-deepTeal/70"><ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-teal" /><p>Document records are private to your account. OCR, AI extraction, public support uploads and external storage are not active.</p></div>
        </div>
      </details>
    </section>
  );
}
