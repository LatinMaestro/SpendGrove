"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { CategoryBreakdownView, MonthlyCategoryChart } from "@/components/monthly-category-spending";
import type { MonthlyCategorySpending, MonthlyCategorySpendingCategory } from "@/lib/monthly-category-spending";

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
      categorySpending?: MonthlyCategorySpending;
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

async function listAccountTransactions(monthKey: string, initial = false) {
  const initialQuery = initial ? "&initial=true" : "";
  return readAccountTransactionResponse(await fetch(`/api/account/manual-transactions?month=${encodeURIComponent(monthKey)}${initialQuery}`, {
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
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"><section role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-surface-base p-5 shadow-2xl sm:rounded-3xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 id="transaction-modal-title" className="text-2xl font-bold text-brand-deepTeal">{title}</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">{description}</p></div><button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-border p-3 text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green"><X aria-hidden="true" className="h-5 w-5" /></button></div>{children}</section></div>;
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
  const [categorySpending, setCategorySpending] = useState<MonthlyCategorySpending | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<MonthlyCategorySpendingCategory | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(brisbaneMonthKey);
  const initialMonthRequest = useRef(true);
  const [selectedMonthLabel, setSelectedMonthLabel] = useState(() => monthLabelFromKey(brisbaneMonthKey()));
  const [hasLaterTransactions, setHasLaterTransactions] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [accountWarning, setAccountWarning] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorError, setEditorError] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyOptions, setPropertyOptions] = useState<PropertyOption[]>([]);
  const [propertyOptionsStatus, setPropertyOptionsStatus] = useState<PropertyOptionsStatus>("LOADING");

  useEffect(() => {
    let cancelled = false;
    async function loadTransactions() {
      setIsReady(false);
      setAccountWarning("");
      const useLatestPopulatedFallback = initialMonthRequest.current;
      initialMonthRequest.current = false;
      const result = await listAccountTransactions(selectedMonth, useLatestPopulatedFallback);
      if (cancelled) return;
      if (result.ok) {
        setTransactions(result.transactions);
        setCategorySpending(result.categorySpending ?? null);
        const resolvedMonth = result.month?.key ?? selectedMonth;
        setSelectedMonthLabel(result.month?.label ?? monthLabelFromKey(resolvedMonth));
        setHasLaterTransactions(Boolean(result.hasLaterTransactions));
        if (resolvedMonth !== selectedMonth) setSelectedMonth(resolvedMonth);
      } else {
        setTransactions([]);
        setCategorySpending(null);
        setSelectedMonthLabel(monthLabelFromKey(selectedMonth));
        setHasLaterTransactions(false);
        setAccountWarning(result.error);
      }
      setIsReady(true);
    }
    void loadTransactions();
    return () => { cancelled = true; };
  }, [selectedMonth, refreshKey]);
  useEffect(() => { let cancelled = false; async function loadProperties() { setPropertyOptionsStatus("LOADING"); const result = await listActiveProperties(); if (cancelled) return; if (result.ok) { setPropertyOptions(result.properties); setPropertyOptionsStatus("READY"); } else { setPropertyOptions([]); setPropertyOptionsStatus("UNAVAILABLE"); } } void loadProperties(); return () => { cancelled = true; }; }, []);

  const activeTransactions = useMemo(() => listActiveManualTransactions(transactions as ManualTransaction[]) as AccountTransaction[], [transactions]);
  const categoryFilteredTransactions = useMemo(() => {
    if (!categoryFilter) return activeTransactions;
    const eligibleTransactionIds = new Set(categoryFilter.transactionIds);
    return activeTransactions.filter((transaction) => eligibleTransactionIds.has(transaction.id));
  }, [activeTransactions, categoryFilter]);
  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("en-AU");
    if (!query) return categoryFilteredTransactions;
    return categoryFilteredTransactions.filter((transaction) => {
      const aggregateCategory = categorySpending?.categories.find((category) => category.categoryId === transaction.categoryId)?.name;
      const category = aggregateCategory ?? getManualCategory(transaction.categoryId)?.name ?? "";
      return transaction.description.toLocaleLowerCase("en-AU").includes(query)
        || category.toLocaleLowerCase("en-AU").includes(query);
    });
  }, [categoryFilteredTransactions, categorySpending, searchQuery]);
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
    if (savedMonth !== selectedMonth) setSelectedMonth(savedMonth);
    else setRefreshKey((current) => current + 1);
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
    if (result.ok) { setRefreshKey((current) => current + 1); setDeleteId(null); setDetailId(null); setAccountWarning(""); } else { setAccountWarning(result.error); setDeleteId(null); }
  }

  return <div className="space-y-6">
    <div className="flex justify-end">
      <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
        <Plus aria-hidden="true" className="h-4 w-4" /> Add transaction
      </button>
    </div>

    {accountWarning && <div role="status" className="flex gap-3 rounded-xl border border-warning-amber/30 bg-warning-amber/5 p-4 text-sm leading-6 text-foreground"><AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warning-amber" /><p>{accountWarning}</p></div>}

    <section className="rounded-2xl border border-border bg-surface-base p-3 sm:p-4" aria-label="Transaction month and search">
      <nav aria-label="Transaction month" className="flex items-center justify-between">
        <button type="button" aria-label="Previous month" onClick={() => { setShowBreakdown(false); setCategoryFilter(null); setSelectedMonth((month) => shiftMonthKey(month, -1)); }} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"><ChevronLeft aria-hidden="true" className="h-5 w-5" /></button>
        <h2 aria-live="polite" className="text-center text-base font-bold text-foreground sm:text-lg">{selectedMonthLabel}</h2>
        <button type="button" aria-label="Next month" disabled={!hasLaterTransactions} onClick={() => { setShowBreakdown(false); setCategoryFilter(null); setSelectedMonth((month) => shiftMonthKey(month, 1)); }} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight aria-hidden="true" className="h-5 w-5" /></button>
      </nav>
      <label className="mt-3 block">
        <span className="sr-only">Search this month</span>
        <div className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface-subtle px-3 focus-within:ring-2 focus-within:ring-focus">
          <FileSearch aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search this month" className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted" />
          {searchQuery && <button type="button" onClick={() => setSearchQuery("")} className="min-h-9 rounded-lg px-2 text-xs font-bold text-brand-evergreen">Clear</button>}
        </div>
      </label>
    </section>

    {isReady && showBreakdown && categorySpending ? (
      <CategoryBreakdownView
        monthLabel={selectedMonthLabel}
        spending={categorySpending}
        onBack={() => setShowBreakdown(false)}
        onSelectCategory={(category) => { setCategoryFilter(category); setShowBreakdown(false); }}
      />
    ) : (
      <>
        {isReady && categorySpending ? (
          <MonthlyCategoryChart monthLabel={selectedMonthLabel} spending={categorySpending} onViewBreakdown={() => setShowBreakdown(true)} />
        ) : isReady ? (
          <section className="rounded-2xl border border-border bg-surface-base p-4" role="status">
            <p className="text-sm font-semibold text-foreground">Spending summary unavailable</p>
            <button type="button" onClick={() => setRefreshKey((current) => current + 1)} className="mt-2 min-h-11 rounded-xl px-3 text-sm font-bold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Try again</button>
          </section>
        ) : null}
    {!isReady ? (
      <section className="rounded-2xl border border-border bg-surface-base p-5" aria-busy="true"><p className="text-sm font-semibold text-muted">Checking {selectedMonthLabel} transactions…</p></section>
    ) : activeTransactions.length === 0 ? (
      <section className="rounded-2xl border border-border bg-surface-base p-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-surface-mint text-brand-evergreen"><ReceiptText aria-hidden="true" className="h-5 w-5" /></div>
        <h2 className="mt-4 text-lg font-bold text-foreground">No transactions in {selectedMonthLabel}.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Move to another month, add a transaction or import a reviewed CSV.</p>
        <button type="button" onClick={openCreate} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"><Plus aria-hidden="true" className="h-4 w-4" /> Add transaction</button>
      </section>
    ) : (
      <section aria-labelledby="transaction-list-heading">
        {categoryFilter && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand-evergreen/20 bg-surface-mint px-3 py-2 text-sm">
            <span className="font-semibold text-foreground">{categoryFilter.name}</span>
            <button type="button" onClick={() => setCategoryFilter(null)} aria-label={`Remove ${categoryFilter.name} category filter`} className="min-h-9 rounded-lg px-2 font-bold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Clear filter</button>
          </div>
        )}
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <h2 id="transaction-list-heading" className="text-sm font-semibold text-muted">{filteredTransactions.length} transaction{filteredTransactions.length === 1 ? "" : "s"}</h2>
          {searchQuery && <p className="text-xs text-muted">Search is limited to {selectedMonthLabel}</p>}
        </div>
        {filteredTransactions.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-base p-6 text-center"><p className="font-semibold text-foreground">No matching transactions</p><button type="button" onClick={() => setSearchQuery("")} className="mt-3 min-h-11 rounded-xl px-3 text-sm font-bold text-brand-evergreen">Clear search</button></div>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-base">
            {filteredTransactions.map((transaction) => {
              const category = getManualCategory(transaction.categoryId);
              return (
                <article key={transaction.id}>
                  <button type="button" onClick={() => setDetailId(transaction.id)} aria-label={"Details for " + transaction.description} className="grid min-h-16 w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus sm:grid-cols-[7rem_minmax(0,1fr)_12rem_7rem_2rem]">
                    <p className="order-2 text-xs text-muted sm:order-none sm:text-sm">{formatAustralianTransactionDate(transaction.date)}</p>
                    <p className="min-w-0 truncate text-sm font-semibold text-foreground">{transaction.description}</p>
                    <p className="order-3 min-w-0 truncate text-xs text-muted sm:order-none sm:text-sm">{category?.name ?? "Category unavailable"}</p>
                    <p className={transaction.amountCents < 0 ? "money-value shrink-0 text-right text-sm font-bold text-foreground" : "money-value shrink-0 text-right text-sm font-bold text-brand-leaf"}>{formatAudFromCents(transaction.amountCents)}</p>
                    <ChevronRight aria-hidden="true" className="hidden h-4 w-4 text-muted sm:block" />
                    {transaction.csvMatchHint && <span className="order-4 col-span-2 inline-flex items-center gap-1 text-xs font-semibold text-warning-amber sm:col-span-5"><FileSearch aria-hidden="true" className="h-3.5 w-3.5" /> Possible CSV match</span>}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    )}
      </>
    )}

    <details className="border-t border-border pt-3 text-sm leading-6 text-muted">
      <summary className="min-h-11 cursor-pointer rounded-lg py-3 font-semibold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">How your transaction data is kept safe</summary>
      <p className="pb-2">Only the cleaned details you reviewed are saved to your account. Removed transactions stay out of the active list.</p>
    </details>

    {editor && <TransactionEditor editor={editor} duplicateCount={duplicateCount} error={editorError} isSaving={isSaving} propertyOptions={propertyOptions} onChange={(draft) => { setEditor({ ...editor, draft }); setEditorError(""); }} onPropertyEnabledChange={(enabled) => setEditor({ ...editor, propertyLinkEnabled: enabled, propertyLinkPropertyId: enabled ? editor.propertyLinkPropertyId : null })} onPropertyLinkChange={(propertyId) => setEditor({ ...editor, propertyLinkPropertyId: propertyId })} onCancel={() => setEditor(null)} onSubmit={saveEditor} />}
    {detailTransaction && <ModalFrame title="Transaction details" description={detailTransaction.source === "IMPORTED" ? "A cleaned transaction created from a reviewed import." : "A manual account entry."} onClose={() => setDetailId(null)}><dl className="mt-6 space-y-4 rounded-2xl bg-surface-subtle p-4"><div><dt className="text-xs font-bold text-muted">Description</dt><dd className="mt-1 text-lg font-bold text-foreground">{detailTransaction.description}</dd></div><div className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-bold text-muted">Amount</dt><dd className="mt-1 font-bold text-foreground">{formatAudFromCents(detailTransaction.amountCents)}</dd></div><div><dt className="text-xs font-bold text-muted">Date</dt><dd className="mt-1 font-bold text-foreground">{formatAustralianTransactionDate(detailTransaction.date)}</dd></div><div><dt className="text-xs font-bold text-muted">Category</dt><dd className="mt-1 font-bold text-foreground">{getManualCategory(detailTransaction.categoryId)?.name}</dd></div><div><dt className="text-xs font-bold text-muted">Source</dt><dd className="mt-1 font-bold text-foreground">{detailTransaction.source === "IMPORTED" ? "Imported" : "Manual"}</dd></div></div>{detailTransaction.notes && <div><dt className="text-xs font-bold text-muted">Notes</dt><dd className="mt-1 text-foreground">{detailTransaction.notes}</dd></div>}{detailTransaction.csvMatchHint && <div className="flex gap-2 text-sm text-foreground"><FileSearch aria-hidden="true" className="h-5 w-5 shrink-0 text-brand-teal" /><p>Marked as a possible match for a future CSV row. No CSV has been accessed.</p></div>}</dl><TransactionPropertyLinkPanel transactionId={detailTransaction.id} /><div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => openDuplicate(detailTransaction)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"><Copy aria-hidden="true" className="h-4 w-4" /> Duplicate</button><button type="button" onClick={() => { setDetailId(null); setDeleteId(detailTransaction.id); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-danger-red/40 px-4 text-sm font-bold text-danger-red focus:outline-none focus-visible:ring-2 focus-visible:ring-danger-red"><Trash2 aria-hidden="true" className="h-4 w-4" /> Delete</button><button type="button" onClick={() => openEdit(detailTransaction)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"><Pencil aria-hidden="true" className="h-4 w-4" /> Edit</button></div></ModalFrame>}
    {deleteTransaction && <ModalFrame title="Delete transaction?" description="This entry will be removed from your active transaction list and kept recoverable." onClose={() => setDeleteId(null)}><div className="mt-6 rounded-2xl bg-danger-red/5 p-4"><p className="font-bold text-foreground">{deleteTransaction.description}</p><p className="mt-1 text-sm text-muted">{formatAustralianTransactionDate(deleteTransaction.date)} · {formatAudFromCents(deleteTransaction.amountCents)}</p></div>{accountWarning && <p role="alert" className="mt-4 rounded-xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{accountWarning}</p>}<div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button disabled={isSaving} type="button" onClick={() => setDeleteId(null)} className="min-h-11 rounded-xl border border-border px-4 text-sm font-bold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Keep transaction</button><button disabled={isSaving} type="button" onClick={confirmDelete} className="min-h-11 rounded-xl bg-danger-red px-4 text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-danger-red">{isSaving ? "Deleting…" : "Delete transaction"}</button></div></ModalFrame>}
  </div>;

}

export function DurableManualTransactions() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <section className="rounded-[2rem] border border-border bg-surface-base p-8 text-center shadow-soft" aria-busy="true"><p className="font-semibold text-brand-deepTeal/70">Checking your account session…</p></section>;
  if (!isSignedIn) return <SignedOutFallback />;
  return <DurableManualTransactionsExperience />;
}
