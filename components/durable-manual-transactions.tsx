"use client";

import { useEffect, useMemo, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Copy,
  FileSearch,
  Home,
  LockKeyhole,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  X,
} from "lucide-react";
import { formatAudFromCents } from "@/lib/money";
import { getManualCategory, getManualCategoryGroups } from "@/lib/manual-categories";
import {
  duplicateManualTransactionToDraft,
  findManualTransactionDuplicates,
  formatAustralianTransactionDate,
  listActiveManualTransactions,
  validateManualTransactionDraft,
  type ManualTransaction,
  type ManualTransactionDraft,
  type ManualTransactionType,
} from "@/lib/manual-transactions";
import { ManualTransactions } from "@/components/manual-transactions";
import { TransactionPropertyLinkPanel } from "@/components/transaction-property-link-panel";

type AccountTransaction = Omit<ManualTransaction, "source"> & { source: "MANUAL" | "IMPORTED" };
type PropertyOption = { id: string; nickname: string; usage: "OWNER_OCCUPIED" | "INVESTMENT" | "OTHER"; isArchived?: boolean };
type PropertyOptionsStatus = "LOADING" | "READY" | "UNAVAILABLE";
type PropertyLinkSnapshotResult =
  | { ok: true; snapshot: { link: { property: PropertyOption } | null; properties: PropertyOption[] } }
  | { ok: false; error: string };

const typeLabels: Record<ManualTransactionType, string> = {
  EXPENSE: "Expense",
  INCOME: "Income",
  TRANSFER: "Transfer",
};

type AccountTransactionResult =
  | {
      ok: true;
      transactions: AccountTransaction[];
      savedTransaction?: AccountTransaction;
      month?: { key: string; label: string };
      hasLaterTransactions?: boolean;
    }
  | { ok: false; error: string };

type LoanMetadataResult =
  | { ok: true; properties: PropertyOption[] }
  | { ok: false; error: string };

const propertyUsageLabels: Record<PropertyOption["usage"], string> = {
  OWNER_OCCUPIED: "Owner-occupied",
  INVESTMENT: "Investment",
  OTHER: "Other",
};

function localDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function brisbaneMonthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "2-digit",
    timeZone: "Australia/Brisbane",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? String(date.getUTCFullYear());
  const month = parts.find((part) => part.type === "month")?.value ?? String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function monthLabelFromKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "Australia/Brisbane",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function shiftMonthKey(monthKey: string, offset: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

function createEmptyDraft(): ManualTransactionDraft {
  const category = getManualCategoryGroups("EXPENSE")[0].categories[0];
  return {
    type: "EXPENSE",
    amountInput: "",
    date: localDateInputValue(),
    description: "",
    categoryId: category.id,
    notes: "",
    csvMatchHint: false,
  };
}

type EditorState = {
  mode: "create" | "edit" | "duplicate";
  transactionId?: string;
  draft: ManualTransactionDraft;
  propertyLinkEnabled: boolean;
  propertyLinkPropertyId: string | null;
  initialPropertyLinkPropertyId: string | null;
  propertyLinkStatus: PropertyOptionsStatus;
};

async function readAccountTransactionResponse(response: Response): Promise<AccountTransactionResult> {
  try {
    const payload = await response.json() as AccountTransactionResult;
    if (payload.ok) return payload;
    return { ok: false, error: payload.error || "We could not save that transaction safely. Please try again." };
  } catch {
    return { ok: false, error: "We could not read the account response safely. Please try again." };
  }
}

async function listAccountTransactions(monthKey: string) {
  return readAccountTransactionResponse(await fetch(`/api/account/manual-transactions?month=${encodeURIComponent(monthKey)}`, {
    method: "GET",
    cache: "no-store",
  }));
}

async function createAccountManualTransaction(draft: ManualTransactionDraft) {
  return readAccountTransactionResponse(await fetch("/api/account/manual-transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  }));
}

async function updateAccountTransaction(transactionId: string, draft: ManualTransactionDraft) {
  return readAccountTransactionResponse(await fetch(`/api/account/manual-transactions/${encodeURIComponent(transactionId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  }));
}

async function deleteAccountTransaction(transactionId: string) {
  return readAccountTransactionResponse(await fetch(`/api/account/manual-transactions/${encodeURIComponent(transactionId)}`, {
    method: "DELETE",
  }));
}

async function listActiveProperties(): Promise<{ ok: true; properties: PropertyOption[] } | { ok: false; error: string }> {
  try {
    const response = await fetch("/api/account/loans", { cache: "no-store" });
    const payload = await response.json() as LoanMetadataResult;
    if (!response.ok || !payload.ok) return { ok: false, error: payload.ok === false ? payload.error : "Properties could not be loaded safely." };
    return { ok: true, properties: payload.properties.filter((property) => !property.isArchived) };
  } catch {
    return { ok: false, error: "Properties could not be loaded safely." };
  }
}

async function getTransactionPropertySnapshot(transactionId: string): Promise<PropertyLinkSnapshotResult> {
  try {
    const response = await fetch(`/api/account/manual-transactions/${encodeURIComponent(transactionId)}/property-link`, { cache: "no-store" });
    const payload = await response.json() as PropertyLinkSnapshotResult;
    if (!response.ok || !payload.ok) return { ok: false, error: payload.ok === false ? payload.error : "Property link could not be loaded safely." };
    return payload;
  } catch {
    return { ok: false, error: "Property link could not be loaded safely." };
  }
}

async function setTransactionPropertyLink(transactionId: string, propertyId: string | null, initialPropertyId: string | null) {
  if (propertyId === initialPropertyId) return { ok: true as const };
  if (initialPropertyId) {
    const unlink = await fetch(`/api/account/manual-transactions/${encodeURIComponent(transactionId)}/property-link`, { method: "DELETE" });
    const unlinkResult = await unlink.json() as { ok?: boolean; error?: string };
    if (!unlink.ok || !unlinkResult.ok) return { ok: false as const, error: unlinkResult.error ?? "Property link could not be updated safely." };
  }
  if (!propertyId) return { ok: true as const };
  const link = await fetch(`/api/account/manual-transactions/${encodeURIComponent(transactionId)}/property-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ propertyId }),
  });
  const linkResult = await link.json() as { ok?: boolean; error?: string };
  if (!link.ok || !linkResult.ok) return { ok: false as const, error: linkResult.error ?? "Property link could not be updated safely." };
  return { ok: true as const };
}

function ModalFrame({ title, description, onClose, children }: Readonly<{ title: string; description: string; onClose: () => void; children: React.ReactNode }>) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-deepTeal/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"><section role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-surface-base p-5 shadow-2xl sm:rounded-[2rem] sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 id="transaction-modal-title" className="text-2xl font-bold text-brand-deepTeal">{title}</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">{description}</p></div><button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-border p-3 text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green"><X aria-hidden="true" className="h-5 w-5" /></button></div>{children}</section></div>;
}

function TransactionEditor({ editor, duplicateCount, error, isSaving, propertyOptions, onChange, onPropertyEnabledChange, onPropertyLinkChange, onCancel, onSubmit }: Readonly<{ editor: EditorState; duplicateCount: number; error: string; isSaving: boolean; propertyOptions: PropertyOption[]; onChange: (draft: ManualTransactionDraft) => void; onPropertyEnabledChange: (enabled: boolean) => void; onPropertyLinkChange: (propertyId: string | null) => void; onCancel: () => void; onSubmit: () => void }>) {
  const categoryGroups = getManualCategoryGroups(editor.draft.type);
  const heading = editor.mode === "edit" ? "Edit transaction" : editor.mode === "duplicate" ? "Review duplicated draft" : "Add transaction";
  const description = editor.mode === "duplicate" ? "This is an unsaved manual copy. Review it before choosing Save transaction." : "Saved to your SpendGrove account as cleaned fields and integer cents.";

  function changeType(type: ManualTransactionType) {
    const firstCategory = getManualCategoryGroups(type)[0].categories[0];
    onChange({ ...editor.draft, type, categoryId: firstCategory.id });
  }

  return <ModalFrame title={heading} description={description} onClose={onCancel}>
    <form className="mt-6 space-y-5" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <fieldset disabled={isSaving}><legend className="text-sm font-bold text-brand-deepTeal">Transaction type</legend><div className="mt-2 grid grid-cols-3 gap-2">{(Object.keys(typeLabels) as ManualTransactionType[]).map((type) => <button key={type} type="button" aria-pressed={editor.draft.type === type} onClick={() => changeType(type)} className={`min-h-12 rounded-2xl px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-green ${editor.draft.type === type ? "bg-brand-deepTeal text-white" : "border border-border bg-surface-mint text-brand-deepTeal"}`}>{typeLabels[type]}</button>)}</div></fieldset>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-brand-deepTeal">Amount (AUD)<input disabled={isSaving} value={editor.draft.amountInput} onChange={(event) => onChange({ ...editor.draft, amountInput: event.target.value })} inputMode="decimal" placeholder="0.00" required className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" /><span className="mt-2 block text-xs font-normal leading-5 text-brand-deepTeal/65">{editor.draft.type === "TRANSFER" ? "Use a minus sign for an outgoing transfer." : "Enter a positive amount; the type controls its direction."}</span></label><label className="text-sm font-bold text-brand-deepTeal">Date<input disabled={isSaving} type="date" value={editor.draft.date} onChange={(event) => onChange({ ...editor.draft, date: event.target.value })} required className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" /></label></div>
      <label className="block text-sm font-bold text-brand-deepTeal">Description<input disabled={isSaving} value={editor.draft.description} onChange={(event) => onChange({ ...editor.draft, description: event.target.value })} maxLength={300} placeholder="What was this transaction for?" required className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" /></label>
      <label className="block text-sm font-bold text-brand-deepTeal">Category<select disabled={isSaving} value={editor.draft.categoryId} onChange={(event) => onChange({ ...editor.draft, categoryId: event.target.value })} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20">{categoryGroups.map((group) => <optgroup key={group.name} label={group.name}>{group.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</optgroup>)}</select></label>
      <label className="block text-sm font-bold text-brand-deepTeal">Notes (optional)<textarea disabled={isSaving} value={editor.draft.notes} onChange={(event) => onChange({ ...editor.draft, notes: event.target.value })} maxLength={300} rows={3} className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" /></label>
      <section aria-label="Property record link">
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-surface-mint p-4">
          <input disabled={isSaving} type="checkbox" checked={editor.propertyLinkEnabled} onChange={(event) => onPropertyEnabledChange(event.target.checked)} className="h-5 w-5 accent-brand-green" />
          <span className="flex items-center gap-2 text-sm font-bold text-brand-deepTeal"><Home aria-hidden="true" className="h-4 w-4 text-brand-teal" /> Include in property records</span>
        </label>
        {editor.propertyLinkEnabled && (
          <div className="mt-3 rounded-2xl border border-border bg-white p-4">
            {editor.propertyLinkStatus === "READY" && propertyOptions.length > 0 ? (
              <label className="block text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">Link to property<select autoFocus disabled={isSaving} value={editor.propertyLinkPropertyId ?? ""} onChange={(event) => onPropertyLinkChange(event.target.value || null)} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm font-normal normal-case tracking-normal text-brand-deepTeal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"><option value="">Choose a Property</option>{propertyOptions.map((property) => <option key={property.id} value={property.id}>{property.nickname} · {propertyUsageLabels[property.usage]}</option>)}</select><span className="mt-2 block text-xs font-normal normal-case tracking-normal text-brand-deepTeal/65">Record keeping only - not tax advice.</span></label>
            ) : editor.propertyLinkStatus === "LOADING" ? (
              <p className="text-xs font-semibold text-brand-deepTeal/60">Loading active Properties…</p>
            ) : editor.propertyLinkStatus === "UNAVAILABLE" ? (
              <p className="text-xs font-semibold text-warning-amber">Property options could not be loaded. Uncheck this option or link from transaction details later.</p>
            ) : (
              <p className="text-xs font-semibold text-brand-deepTeal/60">No active Properties are available. Save without a Property or create one from Loans first.</p>
            )}
          </div>
        )}
      </section>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-surface-mint p-4 text-sm text-brand-deepTeal"><input disabled={isSaving} type="checkbox" checked={editor.draft.csvMatchHint} onChange={(event) => onChange({ ...editor.draft, csvMatchHint: event.target.checked })} className="mt-1 h-5 w-5 accent-brand-green" /><span><strong className="block">May match a future CSV row</strong><span className="mt-1 block leading-5 text-brand-deepTeal/70">A review hint only. It does not upload or inspect a CSV.</span></span></label>
      {duplicateCount > 0 && <div role="status" className="flex gap-3 rounded-2xl border border-warning-amber bg-warning-amber/10 p-4 text-sm text-brand-deepTeal"><AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warning-amber" /><p><strong>Possible duplicate.</strong> {duplicateCount} active transaction{duplicateCount === 1 ? " has" : "s have"} the same date, amount and description. You can still save.</p></div>}
      {error && <p role="alert" className="rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button disabled={isSaving} type="button" onClick={onCancel} className="min-h-12 rounded-full border border-border px-5 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">Cancel</button><button disabled={isSaving} type="submit" className="min-h-12 rounded-full bg-brand-green px-6 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal">{isSaving ? "Saving…" : "Save transaction"}</button></div>
    </form>
  </ModalFrame>;
}

function SignedOutFallback() {
  return <div className="space-y-5"><section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6"><div className="flex items-start gap-4"><div className="rounded-2xl bg-surface-mint p-3 text-brand-green"><Cloud aria-hidden="true" className="h-6 w-6" /></div><div><p className="text-sm font-semibold text-brand-teal">Saved to your account</p><h2 className="mt-1 text-2xl font-bold text-brand-deepTeal">Sign in to view account transactions</h2><p className="mt-2 max-w-xl text-sm leading-6 text-brand-deepTeal/70">You can still use the browser-local manual prototype below. Signed-in manual and imported transactions are saved server-side and scoped to your SpendGrove user.</p><SignInButton mode="modal"><button className="mt-4 min-h-12 rounded-full bg-brand-green px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal" type="button">Sign in for account storage</button></SignInButton></div></div></section><ManualTransactions /></div>;
}

function DurableManualTransactionsExperience() {
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(brisbaneMonthKey);
  const [selectedMonthLabel, setSelectedMonthLabel] = useState(() => monthLabelFromKey(brisbaneMonthKey()));
  const [hasLaterTransactions, setHasLaterTransactions] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [accountWarning, setAccountWarning] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorError, setEditorError] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [propertyOptions, setPropertyOptions] = useState<PropertyOption[]>([]);
  const [propertyOptionsStatus, setPropertyOptionsStatus] = useState<PropertyOptionsStatus>("LOADING");

  useEffect(() => {
    let cancelled = false;
    async function loadTransactions() {
      setIsReady(false);
      setAccountWarning("");
      const result = await listAccountTransactions(selectedMonth);
      if (cancelled) return;
      if (result.ok) {
        setTransactions(result.transactions);
        setSelectedMonthLabel(result.month?.label ?? monthLabelFromKey(selectedMonth));
        setHasLaterTransactions(Boolean(result.hasLaterTransactions));
      } else {
        setTransactions([]);
        setSelectedMonthLabel(monthLabelFromKey(selectedMonth));
        setHasLaterTransactions(false);
        setAccountWarning(result.error);
      }
      setIsReady(true);
    }
    void loadTransactions();
    return () => { cancelled = true; };
  }, [selectedMonth]);
  useEffect(() => { let cancelled = false; async function loadProperties() { setPropertyOptionsStatus("LOADING"); const result = await listActiveProperties(); if (cancelled) return; if (result.ok) { setPropertyOptions(result.properties); setPropertyOptionsStatus("READY"); } else { setPropertyOptions([]); setPropertyOptionsStatus("UNAVAILABLE"); } } void loadProperties(); return () => { cancelled = true; }; }, []);

  const activeTransactions = useMemo(() => listActiveManualTransactions(transactions as ManualTransaction[]) as AccountTransaction[], [transactions]);
  const detailTransaction = activeTransactions.find((transaction) => transaction.id === detailId);
  const deleteTransaction = activeTransactions.find((transaction) => transaction.id === deleteId);
  const duplicateCount = useMemo(() => { if (!editor) return 0; try { const candidate = validateManualTransactionDraft(editor.draft); return findManualTransactionDuplicates(transactions as ManualTransaction[], candidate, editor.transactionId).length; } catch { return 0; } }, [editor, transactions]);

  function openCreate() { setEditorError(""); setEditor({ mode: "create", draft: createEmptyDraft(), propertyLinkEnabled: false, propertyLinkPropertyId: null, initialPropertyLinkPropertyId: null, propertyLinkStatus: propertyOptionsStatus }); }
  function openEdit(transaction: AccountTransaction) {
    setDetailId(null);
    setEditorError("");
    setEditor({ mode: "edit", transactionId: transaction.id, draft: duplicateManualTransactionToDraft(transaction as ManualTransaction), propertyLinkEnabled: false, propertyLinkPropertyId: null, initialPropertyLinkPropertyId: null, propertyLinkStatus: "LOADING" });
    void getTransactionPropertySnapshot(transaction.id).then((result) => {
      setEditor((current) => {
        if (!current || current.transactionId !== transaction.id) return current;
        const propertyId = result.ok ? result.snapshot.link?.property.id ?? null : null;
        return { ...current, propertyLinkEnabled: Boolean(propertyId), propertyLinkPropertyId: propertyId, initialPropertyLinkPropertyId: propertyId, propertyLinkStatus: result.ok ? propertyOptionsStatus : "UNAVAILABLE" };
      });
    });
  }
  function openDuplicate(transaction: AccountTransaction) { setDetailId(null); setEditorError(""); setEditor({ mode: "duplicate", draft: duplicateManualTransactionToDraft(transaction as ManualTransaction), propertyLinkEnabled: false, propertyLinkPropertyId: null, initialPropertyLinkPropertyId: null, propertyLinkStatus: propertyOptionsStatus }); }

  async function saveEditor() {
    if (!editor || isSaving) return;
    setIsSaving(true); setEditorError("");
    const result = editor.mode === "edit" && editor.transactionId ? await updateAccountTransaction(editor.transactionId, editor.draft) : await createAccountManualTransaction(editor.draft);
    if (!result.ok) { setIsSaving(false); setEditorError(result.error); return; }
    const savedMonth = result.savedTransaction?.date.slice(0, 7) ?? selectedMonth;
    setTransactions(result.transactions.filter((transaction) => transaction.date.startsWith(savedMonth)));
    if (savedMonth !== selectedMonth) setSelectedMonth(savedMonth);
    const savedTransactionId = result.savedTransaction?.id;
    if (savedTransactionId) {
      const linkResult = await setTransactionPropertyLink(savedTransactionId, editor.propertyLinkPropertyId, editor.initialPropertyLinkPropertyId);
      setIsSaving(false);
      if (!linkResult.ok) {
        setEditor(null);
        setEditorError("");
        setAccountWarning("The transaction was saved, but the Property link could not be updated safely. Open the transaction details to link it later.");
        return;
      }
    }
    setIsSaving(false);
    setEditor(null); setEditorError(""); setAccountWarning("");
  }

  async function confirmDelete() {
    if (!deleteId || isSaving) return;
    setIsSaving(true); const result = await deleteAccountTransaction(deleteId); setIsSaving(false);
    if (result.ok) { setTransactions(result.transactions.filter((transaction) => transaction.date.startsWith(selectedMonth))); setDeleteId(null); setDetailId(null); setAccountWarning(""); } else { setAccountWarning(result.error); setDeleteId(null); }
  }

  return <div className="space-y-5">
    <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-4"><div className="rounded-2xl bg-surface-mint p-3 text-brand-green"><LockKeyhole aria-hidden="true" className="h-6 w-6" /></div><div><p className="text-sm font-semibold text-brand-teal">Your transactions</p><h2 className="mt-1 text-2xl font-bold text-brand-deepTeal">Transactions</h2><p className="mt-2 max-w-xl text-sm leading-6 text-brand-deepTeal/70">Manual and imported transactions are shown together and scoped to your authenticated SpendGrove account.</p></div></div><button type="button" onClick={openCreate} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-green px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal"><Plus aria-hidden="true" className="h-5 w-5" /> Add transaction</button></div></section>
    {accountWarning && <div role="status" className="flex gap-3 rounded-2xl border border-warning-amber bg-warning-amber/10 p-4 text-sm leading-6 text-brand-deepTeal"><AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warning-amber" /><p>{accountWarning}</p></div>}
    <nav aria-label="Transaction month" className="flex items-center justify-between rounded-3xl border border-border bg-surface-base p-3 shadow-soft">
      <button type="button" aria-label="Previous month" onClick={() => setSelectedMonth((month) => shiftMonthKey(month, -1))} className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green"><ChevronLeft aria-hidden="true" className="h-5 w-5" /></button>
      <h2 aria-live="polite" className="text-center text-lg font-bold text-brand-deepTeal">{selectedMonthLabel}</h2>
      <button type="button" aria-label="Next month" disabled={!hasLaterTransactions} onClick={() => setSelectedMonth((month) => shiftMonthKey(month, 1))} className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight aria-hidden="true" className="h-5 w-5" /></button>
    </nav>
    {!isReady ? <section className="rounded-[2rem] border border-border bg-surface-base p-8 text-center shadow-soft" aria-busy="true"><p className="font-semibold text-brand-deepTeal/70">Checking {selectedMonthLabel} transactions…</p></section> : activeTransactions.length === 0 ? <section className="rounded-[2rem] border border-border bg-surface-base p-8 text-center shadow-soft"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-mint text-brand-green"><ReceiptText aria-hidden="true" className="h-7 w-7" /></div><h2 className="mt-5 text-2xl font-bold text-brand-deepTeal">No transactions in {selectedMonthLabel}.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-deepTeal/70">Move to another month, add a transaction or import a reviewed CSV.</p><button type="button" onClick={openCreate} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-deepTeal px-6 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-green"><Plus aria-hidden="true" className="h-5 w-5" /> Add transaction</button></section> : <section aria-labelledby="transaction-list-heading"><div className="flex items-end justify-between gap-4 px-1"><div><p className="text-sm font-semibold text-brand-teal">{selectedMonthLabel}</p><h2 id="transaction-list-heading" className="mt-1 text-2xl font-bold text-brand-deepTeal">{activeTransactions.length} transaction{activeTransactions.length === 1 ? "" : "s"}</h2></div></div><div className="mt-4 space-y-3">{activeTransactions.map((transaction) => { const category = getManualCategory(transaction.categoryId); return <article key={transaction.id} className="rounded-3xl border border-border bg-surface-base p-5 shadow-soft"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-lg font-bold text-brand-deepTeal">{transaction.description}</p><p className="mt-1 text-sm text-brand-deepTeal/65">{formatAustralianTransactionDate(transaction.date)} · {category?.name ?? "Category unavailable"}</p></div><p className={`shrink-0 text-lg font-bold ${transaction.amountCents < 0 ? "text-brand-deepTeal" : "text-brand-green"}`}>{formatAudFromCents(transaction.amountCents)}</p></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-surface-mint px-3 py-1.5 text-xs font-semibold text-brand-deepTeal">{typeLabels[transaction.type]}</span><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${transaction.source === "IMPORTED" ? "bg-brand-green/10 text-brand-green" : "bg-surface-mint text-brand-teal"}`}>{transaction.source === "IMPORTED" ? "Imported" : "Manual"}</span>{transaction.csvMatchHint && <span className="inline-flex items-center gap-1 rounded-full bg-warning-amber/15 px-3 py-1.5 text-xs font-semibold text-brand-deepTeal"><FileSearch aria-hidden="true" className="h-3.5 w-3.5" /> Possible CSV match</span>}</div><button type="button" onClick={() => setDetailId(transaction.id)} className="min-h-11 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">Details</button></div></article>; })}</div></section>}
    <details className="rounded-3xl bg-surface-mint p-5 text-sm leading-6 text-brand-deepTeal/75"><summary className="cursor-pointer font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">How your transaction data is kept safe</summary><p className="mt-2">Only the cleaned details you reviewed are saved to your account. Removed transactions stay out of the active list.</p></details>
    {editor && <TransactionEditor editor={editor} duplicateCount={duplicateCount} error={editorError} isSaving={isSaving} propertyOptions={propertyOptions} onChange={(draft) => { setEditor({ ...editor, draft }); setEditorError(""); }} onPropertyEnabledChange={(enabled) => setEditor({ ...editor, propertyLinkEnabled: enabled, propertyLinkPropertyId: enabled ? editor.propertyLinkPropertyId : null })} onPropertyLinkChange={(propertyId) => setEditor({ ...editor, propertyLinkPropertyId: propertyId })} onCancel={() => setEditor(null)} onSubmit={saveEditor} />}
    {detailTransaction && <ModalFrame title="Transaction details" description={detailTransaction.source === "IMPORTED" ? "A cleaned transaction created from a reviewed import." : "A manual account entry."} onClose={() => setDetailId(null)}><dl className="mt-6 space-y-4 rounded-3xl bg-surface-mint p-5"><div><dt className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Description</dt><dd className="mt-1 text-lg font-bold text-brand-deepTeal">{detailTransaction.description}</dd></div><div className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Amount</dt><dd className="mt-1 font-bold text-brand-deepTeal">{formatAudFromCents(detailTransaction.amountCents)}</dd></div><div><dt className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Date</dt><dd className="mt-1 font-bold text-brand-deepTeal">{formatAustralianTransactionDate(detailTransaction.date)}</dd></div><div><dt className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Category</dt><dd className="mt-1 font-bold text-brand-deepTeal">{getManualCategory(detailTransaction.categoryId)?.name}</dd></div><div><dt className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Source</dt><dd className="mt-1 font-bold text-brand-deepTeal">{detailTransaction.source === "IMPORTED" ? "Imported · Account storage" : "Manual · Account storage"}</dd></div></div>{detailTransaction.notes && <div><dt className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Notes</dt><dd className="mt-1 text-brand-deepTeal">{detailTransaction.notes}</dd></div>}{detailTransaction.csvMatchHint && <div className="flex gap-2 text-sm text-brand-deepTeal"><FileSearch aria-hidden="true" className="h-5 w-5 shrink-0 text-brand-teal" /><p>Marked as a possible match for a future CSV row. No CSV has been accessed.</p></div>}</dl><TransactionPropertyLinkPanel transactionId={detailTransaction.id} /><div className="mt-5 grid gap-3 sm:grid-cols-3"><button type="button" onClick={() => openEdit(detailTransaction)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-deepTeal px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-green"><Pencil aria-hidden="true" className="h-4 w-4" /> Edit</button><button type="button" onClick={() => openDuplicate(detailTransaction)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green"><Copy aria-hidden="true" className="h-4 w-4" /> Duplicate</button><button type="button" onClick={() => { setDetailId(null); setDeleteId(detailTransaction.id); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-danger-red px-4 text-sm font-bold text-danger-red focus:outline-none focus:ring-2 focus:ring-danger-red"><Trash2 aria-hidden="true" className="h-4 w-4" /> Delete</button></div></ModalFrame>}
    {deleteTransaction && <ModalFrame title="Delete transaction?" description="This entry will be soft-deleted from your active account list. Import history is kept." onClose={() => setDeleteId(null)}><div className="mt-6 rounded-3xl bg-danger-red/10 p-5"><p className="font-bold text-brand-deepTeal">{deleteTransaction.description}</p><p className="mt-1 text-sm text-brand-deepTeal/70">{formatAustralianTransactionDate(deleteTransaction.date)} · {formatAudFromCents(deleteTransaction.amountCents)}</p></div>{accountWarning && <p role="alert" className="mt-4 rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{accountWarning}</p>}<div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button disabled={isSaving} type="button" onClick={() => setDeleteId(null)} className="min-h-12 rounded-full border border-border px-5 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">Keep transaction</button><button disabled={isSaving} type="button" onClick={confirmDelete} className="min-h-12 rounded-full bg-danger-red px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal">{isSaving ? "Deleting…" : "Delete from active list"}</button></div></ModalFrame>}
  </div>;
}

export function DurableManualTransactions() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <section className="rounded-[2rem] border border-border bg-surface-base p-8 text-center shadow-soft" aria-busy="true"><p className="font-semibold text-brand-deepTeal/70">Checking your account session…</p></section>;
  if (!isSignedIn) return <SignedOutFallback />;
  return <DurableManualTransactionsExperience />;
}
