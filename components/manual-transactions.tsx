"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
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
import {
  getManualCategory,
  getManualCategoryGroups,
} from "@/lib/manual-categories";
import {
  createManualTransaction,
  duplicateManualTransactionToDraft,
  findManualTransactionDuplicates,
  formatAustralianTransactionDate,
  listActiveManualTransactions,
  softDeleteManualTransaction,
  updateManualTransaction,
  validateManualTransactionDraft,
  type ManualTransaction,
  type ManualTransactionDraft,
  type ManualTransactionType,
} from "@/lib/manual-transactions";
import {
  loadManualTransactionsFromStorage,
  saveManualTransactionsToStorage,
} from "@/lib/manual-transaction-storage";

const typeLabels: Record<ManualTransactionType, string> = {
  EXPENSE: "Expense",
  INCOME: "Income",
  TRANSFER: "Transfer",
};

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

function ModalFrame({
  title,
  description,
  onClose,
  children,
}: Readonly<{
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}>) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-deepTeal/55 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-surface-base p-5 shadow-2xl sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="transaction-modal-title" className="text-2xl font-bold text-brand-deepTeal">{title}</h2>
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

function TransactionEditor({
  editor,
  duplicateCount,
  error,
  onChange,
  onCancel,
  onSubmit,
}: Readonly<{
  editor: EditorState;
  duplicateCount: number;
  error: string;
  onChange: (draft: ManualTransactionDraft) => void;
  onCancel: () => void;
  onSubmit: () => void;
}>) {
  const categoryGroups = getManualCategoryGroups(editor.draft.type);
  const heading = editor.mode === "edit" ? "Edit transaction" : editor.mode === "duplicate" ? "Review duplicated draft" : "Add transaction";
  const description = editor.mode === "duplicate"
    ? "This is an unsaved copy. Review it before choosing Save transaction."
    : "Stored in integer cents in this browser-only Phase 1 prototype.";

  function changeType(type: ManualTransactionType) {
    const firstCategory = getManualCategoryGroups(type)[0].categories[0];
    onChange({ ...editor.draft, type, categoryId: firstCategory.id });
  }

  return (
    <ModalFrame title={heading} description={description} onClose={onCancel}>
      <form className="mt-6 space-y-5" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <fieldset>
          <legend className="text-sm font-bold text-brand-deepTeal">Transaction type</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(Object.keys(typeLabels) as ManualTransactionType[]).map((type) => (
              <button key={type} type="button" aria-pressed={editor.draft.type === type} onClick={() => changeType(type)} className={`min-h-12 rounded-2xl px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-green ${editor.draft.type === type ? "bg-brand-deepTeal text-white" : "border border-border bg-surface-mint text-brand-deepTeal"}`}>
                {typeLabels[type]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-brand-deepTeal">
            Amount (AUD)
            <input value={editor.draft.amountInput} onChange={(event) => onChange({ ...editor.draft, amountInput: event.target.value })} inputMode="decimal" placeholder="0.00" required className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" />
            <span className="mt-2 block text-xs font-normal leading-5 text-brand-deepTeal/65">
              {editor.draft.type === "TRANSFER" ? "Use a minus sign for an outgoing transfer." : "Enter a positive amount; the type controls its direction."}
            </span>
          </label>
          <label className="text-sm font-bold text-brand-deepTeal">
            Date
            <input type="date" value={editor.draft.date} onChange={(event) => onChange({ ...editor.draft, date: event.target.value })} required className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" />
          </label>
        </div>

        <label className="block text-sm font-bold text-brand-deepTeal">
          Description
          <input value={editor.draft.description} onChange={(event) => onChange({ ...editor.draft, description: event.target.value })} maxLength={300} placeholder="What was this transaction for?" required className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" />
        </label>

        <label className="block text-sm font-bold text-brand-deepTeal">
          Category
          <select value={editor.draft.categoryId} onChange={(event) => onChange({ ...editor.draft, categoryId: event.target.value })} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20">
            {categoryGroups.map((group) => (
              <optgroup key={group.name} label={group.name}>
                {group.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="block text-sm font-bold text-brand-deepTeal">
          Notes (optional)
          <textarea value={editor.draft.notes} onChange={(event) => onChange({ ...editor.draft, notes: event.target.value })} maxLength={300} rows={3} className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20" />
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-surface-mint p-4 text-sm text-brand-deepTeal">
          <input type="checkbox" checked={editor.draft.csvMatchHint} onChange={(event) => onChange({ ...editor.draft, csvMatchHint: event.target.checked })} className="mt-1 h-5 w-5 accent-brand-green" />
          <span><strong className="block">May match a future CSV row</strong><span className="mt-1 block leading-5 text-brand-deepTeal/70">A local hint only. It does not import, upload or inspect a CSV.</span></span>
        </label>

        {duplicateCount > 0 && (
          <div role="status" className="flex gap-3 rounded-2xl border border-warning-amber bg-warning-amber/10 p-4 text-sm text-brand-deepTeal">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warning-amber" />
            <p><strong>Possible duplicate.</strong> {duplicateCount} active transaction{duplicateCount === 1 ? " has" : "s have"} the same date, amount and description. You can still save.</p>
          </div>
        )}

        {error && <p role="alert" className="rounded-2xl bg-danger-red/10 p-4 text-sm font-semibold text-danger-red">{error}</p>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="min-h-12 rounded-full border border-border px-5 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">Cancel</button>
          <button type="submit" className="min-h-12 rounded-full bg-brand-green px-6 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal">Save transaction</button>
        </div>
      </form>
    </ModalFrame>
  );
}

export function ManualTransactions() {
  const [transactions, setTransactions] = useState<ManualTransaction[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorError, setEditorError] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadManualTransactionsFromStorage(window.localStorage);
    setTransactions(loaded.transactions);
    if (!loaded.storageAvailable) {
      setStorageWarning("Browser storage is unavailable. Changes will last only until this page closes.");
    } else if (loaded.recoveredFromCorruption) {
      setStorageWarning("Unreadable local transaction data was ignored safely. No private data was uploaded.");
    }
    setIsReady(true);
  }, []);

  const activeTransactions = useMemo(() => listActiveManualTransactions(transactions), [transactions]);
  const detailTransaction = activeTransactions.find((transaction) => transaction.id === detailId);
  const deleteTransaction = activeTransactions.find((transaction) => transaction.id === deleteId);

  const duplicateCount = useMemo(() => {
    if (!editor) return 0;
    try {
      const candidate = validateManualTransactionDraft(editor.draft);
      return findManualTransactionDuplicates(transactions, candidate, editor.transactionId).length;
    } catch {
      return 0;
    }
  }, [editor, transactions]);

  function commitTransactions(nextTransactions: ManualTransaction[]) {
    setTransactions(nextTransactions);
    if (!saveManualTransactionsToStorage(window.localStorage, nextTransactions)) {
      setStorageWarning("Browser storage is unavailable. Changes will last only until this page closes.");
    }
  }

  function openCreate() {
    setEditorError("");
    setEditor({ mode: "create", draft: createEmptyDraft() });
  }

  function openEdit(transaction: ManualTransaction) {
    setDetailId(null);
    setEditorError("");
    setEditor({ mode: "edit", transactionId: transaction.id, draft: duplicateManualTransactionToDraft(transaction) });
  }

  function openDuplicate(transaction: ManualTransaction) {
    setDetailId(null);
    setEditorError("");
    setEditor({ mode: "duplicate", draft: duplicateManualTransactionToDraft(transaction) });
  }

  function saveEditor() {
    if (!editor) return;
    try {
      const nextTransactions = editor.mode === "edit" && editor.transactionId
        ? updateManualTransaction(transactions, editor.transactionId, editor.draft)
        : createManualTransaction(transactions, editor.draft);
      commitTransactions(nextTransactions);
      setEditor(null);
      setEditorError("");
    } catch (error) {
      if (error && typeof error === "object" && "issues" in error) {
        const issues = (error as { issues?: Array<{ message: string }> }).issues;
        setEditorError(issues?.[0]?.message ?? "Check the transaction details and try again.");
      } else {
        setEditorError(error instanceof Error ? error.message : "Check the transaction details and try again.");
      }
    }
  }

  function confirmDelete() {
    if (!deleteId) return;
    commitTransactions(softDeleteManualTransaction(transactions, deleteId));
    setDeleteId(null);
    setDetailId(null);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-surface-mint p-3 text-brand-green"><LockKeyhole aria-hidden="true" className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-semibold text-brand-teal">Browser-local prototype</p>
              <h2 className="mt-1 text-2xl font-bold text-brand-deepTeal">Manual transactions</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-brand-deepTeal/70">Transactions stay in this browser only. This is not cloud sync, production account storage or a runtime database connection.</p>
            </div>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-green px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal">
            <Plus aria-hidden="true" className="h-5 w-5" /> Add transaction
          </button>
        </div>
      </section>

      {storageWarning && (
        <div role="status" className="flex gap-3 rounded-2xl border border-warning-amber bg-warning-amber/10 p-4 text-sm leading-6 text-brand-deepTeal">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-warning-amber" />
          <p>{storageWarning}</p>
        </div>
      )}

      {!isReady ? (
        <section className="rounded-[2rem] border border-border bg-surface-base p-8 text-center shadow-soft" aria-busy="true">
          <p className="font-semibold text-brand-deepTeal/70">Checking this browser for your local transactions…</p>
        </section>
      ) : activeTransactions.length === 0 ? (
        <section className="rounded-[2rem] border border-border bg-surface-base p-8 text-center shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-mint text-brand-green"><ReceiptText aria-hidden="true" className="h-7 w-7" /></div>
          <h2 className="mt-5 text-2xl font-bold text-brand-deepTeal">No transactions yet.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-deepTeal/70">No example financial data is shown. Add your first manual transaction when you are ready; it will stay on this device and browser.</p>
          <button type="button" onClick={openCreate} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-deepTeal px-6 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-green">
            <Plus aria-hidden="true" className="h-5 w-5" /> Add first transaction
          </button>
        </section>
      ) : (
        <section aria-labelledby="transaction-list-heading">
          <div className="flex items-end justify-between gap-4 px-1">
            <div>
              <p className="text-sm font-semibold text-brand-teal">Your entries</p>
              <h2 id="transaction-list-heading" className="mt-1 text-2xl font-bold text-brand-deepTeal">{activeTransactions.length} active transaction{activeTransactions.length === 1 ? "" : "s"}</h2>
            </div>
            <span className="rounded-full bg-surface-mint px-3 py-2 text-xs font-bold text-brand-deepTeal">AUD · Local only</span>
          </div>
          <div className="mt-4 space-y-3">
            {activeTransactions.map((transaction) => {
              const category = getManualCategory(transaction.categoryId);
              return (
                <article key={transaction.id} className="rounded-3xl border border-border bg-surface-base p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold text-brand-deepTeal">{transaction.description}</p>
                      <p className="mt-1 text-sm text-brand-deepTeal/65">{formatAustralianTransactionDate(transaction.date)} · {category?.name ?? "Category unavailable"}</p>
                    </div>
                    <p className={`shrink-0 text-lg font-bold ${transaction.amountCents < 0 ? "text-brand-deepTeal" : "text-brand-green"}`}>{formatAudFromCents(transaction.amountCents)}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-surface-mint px-3 py-1.5 text-xs font-semibold text-brand-deepTeal">{typeLabels[transaction.type]}</span>
                      {transaction.csvMatchHint && <span className="inline-flex items-center gap-1 rounded-full bg-warning-amber/15 px-3 py-1.5 text-xs font-semibold text-brand-deepTeal"><FileSearch aria-hidden="true" className="h-3.5 w-3.5" /> CSV match hint</span>}
                    </div>
                    <button type="button" onClick={() => setDetailId(transaction.id)} className="min-h-11 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">View details</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-surface-mint p-5 text-sm leading-6 text-brand-deepTeal/75">
        <p className="flex items-center gap-2 font-bold text-brand-deepTeal"><CheckCircle2 aria-hidden="true" className="h-5 w-5 text-brand-green" /> Privacy boundary</p>
        <p className="mt-2">No bank connection, CSV upload or database call is made here. Deleted entries are soft-deleted locally and excluded from the active list.</p>
      </section>

      {editor && (
        <TransactionEditor editor={editor} duplicateCount={duplicateCount} error={editorError} onChange={(draft) => { setEditor({ ...editor, draft }); setEditorError(""); }} onCancel={() => setEditor(null)} onSubmit={saveEditor} />
      )}

      {detailTransaction && (
        <ModalFrame title="Transaction details" description="A browser-local manual entry." onClose={() => setDetailId(null)}>
          <dl className="mt-6 space-y-4 rounded-3xl bg-surface-mint p-5">
            <div><dt className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Description</dt><dd className="mt-1 text-lg font-bold text-brand-deepTeal">{detailTransaction.description}</dd></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Amount</dt><dd className="mt-1 font-bold text-brand-deepTeal">{formatAudFromCents(detailTransaction.amountCents)}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Date</dt><dd className="mt-1 font-bold text-brand-deepTeal">{formatAustralianTransactionDate(detailTransaction.date)}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Category</dt><dd className="mt-1 font-bold text-brand-deepTeal">{getManualCategory(detailTransaction.categoryId)?.name}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Source</dt><dd className="mt-1 font-bold text-brand-deepTeal">Manual · Local only</dd></div>
            </div>
            {detailTransaction.notes && <div><dt className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Notes</dt><dd className="mt-1 text-brand-deepTeal">{detailTransaction.notes}</dd></div>}
            {detailTransaction.csvMatchHint && <div className="flex gap-2 text-sm text-brand-deepTeal"><FileSearch aria-hidden="true" className="h-5 w-5 shrink-0 text-brand-teal" /><p>Marked as a possible match for a future CSV row. No CSV has been accessed.</p></div>}
          </dl>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => openEdit(detailTransaction)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-deepTeal px-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-green"><Pencil aria-hidden="true" className="h-4 w-4" /> Edit</button>
            <button type="button" onClick={() => openDuplicate(detailTransaction)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green"><Copy aria-hidden="true" className="h-4 w-4" /> Duplicate</button>
            <button type="button" onClick={() => { setDetailId(null); setDeleteId(detailTransaction.id); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-danger-red px-4 text-sm font-bold text-danger-red focus:outline-none focus:ring-2 focus:ring-danger-red"><Trash2 aria-hidden="true" className="h-4 w-4" /> Delete</button>
          </div>
        </ModalFrame>
      )}

      {deleteTransaction && (
        <ModalFrame title="Delete transaction?" description="This entry will be soft-deleted from the active local list." onClose={() => setDeleteId(null)}>
          <div className="mt-6 rounded-3xl bg-danger-red/10 p-5">
            <p className="font-bold text-brand-deepTeal">{deleteTransaction.description}</p>
            <p className="mt-1 text-sm text-brand-deepTeal/70">{formatAustralianTransactionDate(deleteTransaction.date)} · {formatAudFromCents(deleteTransaction.amountCents)}</p>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setDeleteId(null)} className="min-h-12 rounded-full border border-border px-5 text-sm font-bold text-brand-deepTeal focus:outline-none focus:ring-2 focus:ring-brand-green">Keep transaction</button>
            <button type="button" onClick={confirmDelete} className="min-h-12 rounded-full bg-danger-red px-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-deepTeal">Delete from active list</button>
          </div>
        </ModalFrame>
      )}
    </div>
  );
}
