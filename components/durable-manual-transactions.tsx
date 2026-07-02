"use client";

import { useEffect, useMemo, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Copy,
  FileSearch,
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

const typeLabels: Record<ManualTransactionType, string> = {
  EXPENSE: "Expense",
  INCOME: "Income",
  TRANSFER: "Transfer",
};

type AccountTransactionResult =
  | { ok: true; transactions: AccountTransaction[] }
  | { ok: false; error: string };

function localDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

async function listAccountTransactions() {
  return readAccountTransactionResponse(await fetch("/api/account/manual-transactions", {
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

function ModalFrame({ title, description, onClose, children }: Readonly<{ title: string; description: string; onClose: () => void; children: React.ReactNode }>) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-deepTeal/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"><section role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-surface-base p-5 shadow-2xl sm:rounded-[2rem] sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 id="transaction-modal-title" className="text-2xl font-bold text-brand-deepTeal">{title}</h2><p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">{description}</p></div><button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-border p-3 text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green"><X aria-hidden="true" className="h-5 w-5" /></button></div>{children}</section></div>;
}

function TransactionEditor({ editor, duplicateCount, error, isSaving, onChange, onCancel, onSubmit }: Readonly<{ editor: EditorState; duplicateCount: number; error: string; isSaving: boolean; onChange: (draft: ManualTransactionDraft) => void; onCancel: () => void; onSubmit: () => void }>) {
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
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-surface-mint p-4 text-sm text-brand-deepTeal"><input disabled={isSaving} type="checkbox" checked={editor.draft.csvMatchHint} onChange={(event) => onChange({ ...editor.draft, csvMatchHint: event.target.checked })} className="mt-1 h-5 w-5 accent-brand-green" /><span><strong className="block">May match a future CSV row</strong><span className="mt-1 block leading-5 text-brand-deepTeal/70">A review hint only. It does not upload or inspect a CSV.</span></span></label>
      {duplicateCount > 0 && <div role="status" className="flex gap-3 rounded-2xl border border-warning-amber bg-warning-amber/10 p-4 text-sm text-brand-deepTeal"><AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warning-amber" /><p><strong>Possible duplicate.</strong> {duplicateCount} active transaction{duplicateCount === 1 ? " has" : "s have"} the same date, amount and description. You can still save.</p></div>}
      {error && <p role="alert" className="rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button disabled={isSaving} type="button" onClick={onCancel} className="min-h-12 rounded-full border border-border px-5 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">Cancel</button><button disabled={isSaving} type="submit" className="min-h-12 rounded-full bg-brand-green px-6 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal">{isSaving ? "Saving…" : "Save transaction"}</button></div>
    </form>
  </ModalFrame>;
}

function SignedOutFallback() {
  return <div className="space-y-5"><section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6"><div className="flex items-start gap-4"><div className="rounded-2xl bg-surface-mint p-3 text-brand-green"><Cloud aria-hidden="true" className="h-6 w-6" /></div><div><p className="text-sm font-semibold text-brand-teal">Account storage available</p><h2 className="mt-1 text-2xl font-bold text-brand-deepTeal">Sign in to view account transactions</h2><p className="mt-2 max-w-xl text-sm leading-6 text-brand-deepTeal/70">You can still use the browser-local manual prototype below. Signed-in manual and imported transactions are saved server-side and scoped to your SpendGrove user.</p><SignInButton mode="modal"><button className="mt-4 min-h-12 rounded-full bg-brand-green px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal" type="button">Sign in for account storage</button></SignInButton></div></div></section><ManualTransactions /></div>;
}

function DurableManualTransactionsExperience() {
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [accountWarning, setAccountWarning] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorError, setEditorError] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { let cancelled = false; async function loadTransactions() { setIsReady(false); setAccountWarning(""); const result = await listAccountTransactions(); if (cancelled) return; if (result.ok) setTransactions(result.transactions); else { setTransactions([]); setAccountWarning(result.error); } setIsReady(true); } void loadTransactions(); return () => { cancelled = true; }; }, []);

  const activeTransactions = useMemo(() => listActiveManualTransactions(transactions as ManualTransaction[]) as AccountTransaction[], [transactions]);
  const detailTransaction = activeTransactions.find((transaction) => transaction.id === detailId);
  const deleteTransaction = activeTransactions.find((transaction) => transaction.id === deleteId);
  const duplicateCount = useMemo(() => { if (!editor) return 0; try { const candidate = validateManualTransactionDraft(editor.draft); return findManualTransactionDuplicates(transactions as ManualTransaction[], candidate, editor.transactionId).length; } catch { return 0; } }, [editor, transactions]);

  function openCreate() { setEditorError(""); setEditor({ mode: "create", draft: createEmptyDraft() }); }
  function openEdit(transaction: AccountTransaction) { setDetailId(null); setEditorError(""); setEditor({ mode: "edit", transactionId: transaction.id, draft: duplicateManualTransactionToDraft(transaction as ManualTransaction) }); }
  function openDuplicate(transaction: AccountTransaction) { setDetailId(null); setEditorError(""); setEditor({ mode: "duplicate", draft: duplicateManualTransactionToDraft(transaction as ManualTransaction) }); }

  async function saveEditor() {
    if (!editor || isSaving) return;
    setIsSaving(true); setEditorError("");
    const result = editor.mode === "edit" && editor.transactionId ? await updateAccountTransaction(editor.transactionId, editor.draft) : await createAccountManualTransaction(editor.draft);
    setIsSaving(false);
    if (result.ok) { setTransactions(result.transactions); setEditor(null); setEditorError(""); setAccountWarning(""); } else setEditorError(result.error);
  }

  async function confirmDelete() {
    if (!deleteId || isSaving) return;
    setIsSaving(true); const result = await deleteAccountTransaction(deleteId); setIsSaving(false);
    if (result.ok) { setTransactions(result.transactions); setDeleteId(null); setDetailId(null); setAccountWarning(""); } else { setAccountWarning(result.error); setDeleteId(null); }
  }

  return <div className="space-y-5">
    <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-4"><div className="rounded-2xl bg-surface-mint p-3 text-brand-green"><LockKeyhole aria-hidden="true" className="h-6 w-6" /></div><div><p className="text-sm font-semibold text-brand-teal">Account storage</p><h2 className="mt-1 text-2xl font-bold text-brand-deepTeal">Transactions</h2><p className="mt-2 max-w-xl text-sm leading-6 text-brand-deepTeal/70">Manual and imported transactions are shown together and scoped to your authenticated SpendGrove account.</p></div></div><button type="button" onClick={openCreate} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-green px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal"><Plus aria-hidden="true" className="h-5 w-5" /> Add transaction</button></div></section>
    {accountWarning && <div role="status" className="flex gap-3 rounded-2xl border border-warning-amber bg-warning-amber/10 p-4 text-sm leading-6 text-brand-deepTeal"><AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warning-amber" /><p>{accountWarning}</p></div>}
    {!isReady ? <section className="rounded-[2rem] border border-border bg-surface-base p-8 text-center shadow-soft" aria-busy="true"><p className="font-semibold text-brand-deepTeal/70">Checking your account transactions…</p></section> : activeTransactions.length === 0 ? <section className="rounded-[2rem] border border-border bg-surface-base p-8 text-center shadow-soft"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-mint text-brand-green"><ReceiptText aria-hidden="true" className="h-7 w-7" /></div><h2 className="mt-5 text-2xl font-bold text-brand-deepTeal">No transactions yet.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-deepTeal/70">Add a manual transaction or commit a reviewed CSV import; both will appear here.</p><button type="button" onClick={openCreate} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-deepTeal px-6 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-green"><Plus aria-hidden="true" className="h-5 w-5" /> Add first transaction</button></section> : <section aria-labelledby="transaction-list-heading"><div className="flex items-end justify-between gap-4 px-1"><div><p className="text-sm font-semibold text-brand-teal">Your entries</p><h2 id="transaction-list-heading" className="mt-1 text-2xl font-bold text-brand-deepTeal">{activeTransactions.length} active transaction{activeTransactions.length === 1 ? "" : "s"}</h2></div><span className="rounded-full bg-surface-mint px-3 py-2 text-xs font-bold text-brand-deepTeal">AUD · Account</span></div><div className="mt-4 space-y-3">{activeTransactions.map((transaction) => { const category = getManualCategory(transaction.categoryId); return <article key={transaction.id} className="rounded-3xl border border-border bg-surface-base p-5 shadow-soft"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-lg font-bold text-brand-deepTeal">{transaction.description}</p><p className="mt-1 text-sm text-brand-deepTeal/65">{formatAustralianTransactionDate(transaction.date)} · {category?.name ?? "Category unavailable"}</p></div><p className={`shrink-0 text-lg font-bold ${transaction.amountCents < 0 ? "text-brand-deepTeal" : "text-brand-green"}`}>{formatAudFromCents(transaction.amountCents)}</p></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-surface-mint px-3 py-1.5 text-xs font-semibold text-brand-deepTeal">{typeLabels[transaction.type]}</span><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${transaction.source === "IMPORTED" ? "bg-brand-green/10 text-brand-green" : "bg-surface-mint text-brand-teal"}`}>{transaction.source === "IMPORTED" ? "Imported" : "Manual"}</span>{transaction.csvMatchHint && <span className="inline-flex items-center gap-1 rounded-full bg-warning-amber/15 px-3 py-1.5 text-xs font-semibold text-brand-deepTeal"><FileSearch aria-hidden="true" className="h-3.5 w-3.5" /> CSV match hint</span>}</div><button type="button" onClick={() => setDetailId(transaction.id)} className="min-h-11 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">View details</button></div></article>; })}</div></section>}
    <section className="rounded-3xl bg-surface-mint p-5 text-sm leading-6 text-brand-deepTeal/75"><p className="flex items-center gap-2 font-bold text-brand-deepTeal"><CheckCircle2 aria-hidden="true" className="h-5 w-5 text-brand-green" /> Privacy boundary</p><p className="mt-2">Account transactions contain cleaned reviewed fields only. They are user-owned; deleted entries are soft-deleted and excluded from the active list. ImportBatch and ImportRow history remains intact.</p></section>
    {editor && <TransactionEditor editor={editor} duplicateCount={duplicateCount} error={editorError} isSaving={isSaving} onChange={(draft) => { setEditor({ ...editor, draft }); setEditorError(""); }} onCancel={() => setEditor(null)} onSubmit={saveEditor} />}
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
