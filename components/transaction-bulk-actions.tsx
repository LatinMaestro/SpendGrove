"use client";

import { useMemo, useState } from "react";
import type { ManualTransactionType } from "@/lib/manual-transactions";

type SelectedBulkTransaction = {
  id: string;
  type: ManualTransactionType;
  merchantProfileId: string | null;
};

type CategoryOption = {
  id: string;
  name: string;
  type: ManualTransactionType;
};

type PropertyOption = {
  id: string;
  nickname: string;
};

type BulkAction = "SET_CATEGORY" | "APPLY_MERCHANT_CATEGORY" | "LINK_PROPERTY" | "UNLINK_PROPERTY";

type BulkSummary = {
  id: string;
  type: BulkAction;
  status: "RUNNING" | "COMPLETED" | "PARTIAL" | "FAILED" | "REVERTED" | "PARTIALLY_REVERTED";
  requestedCount: number;
  appliedCount: number;
  skippedCount: number;
  failedCount: number;
  undoBlockedCount: number;
  undoExpiresAt: string | null;
  revertedAt: string | null;
};

type BulkResponse =
  | { ok: true; operation: BulkSummary }
  | { ok: false; error: string };

type Props = Readonly<{
  selectedTransactions: SelectedBulkTransaction[];
  categoryOptions: CategoryOption[];
  propertyOptions: PropertyOption[];
  onClearSelection: () => void;
  onOperationChange: () => void;
}>;

const actionLabels: Record<BulkAction, string> = {
  SET_CATEGORY: "Change category",
  APPLY_MERCHANT_CATEGORY: "Apply category to selected merchant records",
  LINK_PROPERTY: "Link to Property",
  UNLINK_PROPERTY: "Unlink from Property",
};

async function readBulkResponse(response: Response): Promise<BulkResponse> {
  try {
    const payload = await response.json() as BulkResponse;
    if (response.ok && payload.ok) return payload;
    return {
      ok: false,
      error: payload.ok === false ? payload.error : "That bulk change could not be completed safely.",
    };
  } catch {
    return { ok: false, error: "That bulk change could not be completed safely." };
  }
}

export function TransactionBulkActions({
  selectedTransactions,
  categoryOptions,
  propertyOptions,
  onClearSelection,
  onOperationChange,
}: Props) {
  const [action, setAction] = useState<BulkAction | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BulkSummary | null>(null);

  const selectedType = useMemo(() => {
    const types = new Set(selectedTransactions.map((transaction) => transaction.type));
    return types.size === 1 ? selectedTransactions[0]?.type ?? null : null;
  }, [selectedTransactions]);
  const commonMerchantProfileId = useMemo(() => {
    const identities = new Set(selectedTransactions.map((transaction) => transaction.merchantProfileId));
    if (identities.size !== 1) return null;
    return selectedTransactions[0]?.merchantProfileId ?? null;
  }, [selectedTransactions]);
  const compatibleCategories = useMemo(
    () => selectedType && selectedType !== "TRANSFER"
      ? categoryOptions.filter((category) => category.type === selectedType)
      : [],
    [categoryOptions, selectedType],
  );

  if (selectedTransactions.length === 0 && !result) return null;

  function chooseAction(nextAction: BulkAction) {
    setAction(nextAction);
    setError("");
    if (!categoryId && compatibleCategories[0]) setCategoryId(compatibleCategories[0].id);
    if (!propertyId && propertyOptions[0]) setPropertyId(propertyOptions[0].id);
  }

  async function submit() {
    if (!action || isSubmitting || selectedTransactions.length === 0) return;
    setIsSubmitting(true);
    setError("");
    const base = {
      type: action,
      transactionIds: selectedTransactions.map((transaction) => transaction.id),
    };
    const body = action === "SET_CATEGORY"
      ? { ...base, targetCategoryId: categoryId }
      : action === "APPLY_MERCHANT_CATEGORY"
        ? { ...base, targetCategoryId: categoryId, merchantProfileId: commonMerchantProfileId }
        : action === "LINK_PROPERTY"
          ? { ...base, targetPropertyId: propertyId }
          : base;
    const response = await readBulkResponse(await fetch("/api/account/transactions/bulk-operations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));
    setIsSubmitting(false);
    if (!response.ok) {
      setError(response.error);
      return;
    }
    setResult(response.operation);
    setAction(null);
    onClearSelection();
    onOperationChange();
  }

  async function undo() {
    if (!result || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    const response = await readBulkResponse(await fetch(
      `/api/account/transactions/bulk-operations/${encodeURIComponent(result.id)}/undo`,
      { method: "POST" },
    ));
    setIsSubmitting(false);
    if (!response.ok) {
      setError(response.error);
      return;
    }
    setResult(response.operation);
    onOperationChange();
  }

  const canChooseCategory = selectedType !== null
    && selectedType !== "TRANSFER"
    && compatibleCategories.length > 0;
  const canApplyMerchant = canChooseCategory && Boolean(commonMerchantProfileId);
  const canLinkProperty = propertyOptions.length > 0;

  return (
    <section aria-label="Selected transaction actions" className="mb-3 hidden rounded-2xl border border-brand-evergreen/25 bg-surface-mint p-4 lg:block">
      {selectedTransactions.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-foreground">
              {selectedTransactions.length} selected
            </p>
            <button type="button" onClick={onClearSelection} className="min-h-10 rounded-lg px-3 text-sm font-bold text-brand-evergreen focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
              Clear selection
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={!canChooseCategory} onClick={() => chooseAction("SET_CATEGORY")} className="min-h-11 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">Change category</button>
            <button type="button" disabled={!canApplyMerchant} onClick={() => chooseAction("APPLY_MERCHANT_CATEGORY")} className="min-h-11 rounded-xl border border-border bg-surface-base px-4 text-sm font-bold text-foreground disabled:cursor-not-allowed disabled:opacity-45">Apply to matching merchant</button>
            <button type="button" disabled={!canLinkProperty} onClick={() => chooseAction("LINK_PROPERTY")} className="min-h-11 rounded-xl border border-border bg-surface-base px-4 text-sm font-bold text-foreground disabled:cursor-not-allowed disabled:opacity-45">Link to Property</button>
            <button type="button" onClick={() => chooseAction("UNLINK_PROPERTY")} className="min-h-11 rounded-xl border border-border bg-surface-base px-4 text-sm font-bold text-foreground">Unlink from Property</button>
          </div>
        </>
      )}

      {action && selectedTransactions.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-surface-base p-4">
          <h3 className="font-bold text-foreground">{actionLabels[action]}</h3>
          {(action === "SET_CATEGORY" || action === "APPLY_MERCHANT_CATEGORY") && (
            <label className="mt-3 block text-sm font-bold text-foreground">
              Category
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                {compatibleCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
          )}
          {action === "LINK_PROPERTY" && (
            <label className="mt-3 block text-sm font-bold text-foreground">
              Property
              <select value={propertyId} onChange={(event) => setPropertyId(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3 font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                {propertyOptions.map((property) => <option key={property.id} value={property.id}>{property.nickname}</option>)}
              </select>
            </label>
          )}
          <p className="mt-3 text-sm text-muted">
            SpendGrove will recheck every selected transaction before applying this change.
          </p>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button type="button" disabled={isSubmitting} onClick={() => setAction(null)} className="min-h-11 rounded-xl px-4 text-sm font-bold text-foreground">Cancel</button>
            <button type="button" disabled={isSubmitting || ((action === "SET_CATEGORY" || action === "APPLY_MERCHANT_CATEGORY") && !categoryId) || (action === "LINK_PROPERTY" && !propertyId)} onClick={submit} className="min-h-11 rounded-xl bg-brand-evergreen px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45">
              {isSubmitting ? "Applying…" : `Apply to ${selectedTransactions.length}`}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div aria-live="polite" className="mt-4 rounded-xl border border-border bg-surface-base p-4">
          <p className="font-bold text-foreground">
            {result.status === "REVERTED" ? "Bulk change undone" : "Bulk change complete"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {result.appliedCount} changed · {result.skippedCount} skipped · {result.failedCount} failed
          </p>
          {result.undoBlockedCount > 0 && <p className="mt-1 text-sm text-muted">{result.undoBlockedCount} later change could not be undone.</p>}
          {result.undoExpiresAt && !result.revertedAt && result.appliedCount > 0 && (
            <button type="button" disabled={isSubmitting} onClick={undo} className="mt-3 min-h-11 rounded-xl border border-border px-4 text-sm font-bold text-brand-evergreen disabled:opacity-45">
              {isSubmitting ? "Undoing…" : "Undo bulk change"}
            </button>
          )}
        </div>
      )}

      {error && <p role="alert" className="mt-3 rounded-xl bg-danger-red/10 p-3 text-sm font-semibold text-danger-red">{error}</p>}
    </section>
  );
}
