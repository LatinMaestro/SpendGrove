"use client";

import { useEffect, useRef, useState } from "react";
import { Archive, Cloud, Pencil, Plus, RotateCcw } from "lucide-react";
import {
  createAccountCustomCategory,
  listAccountCustomCategories,
  updateAccountCustomCategory,
} from "@/lib/account-custom-categories";
import {
  CUSTOM_CATEGORY_GROUPS,
  createCustomCategory,
  defaultTypeForCategoryGroup,
  getCategoryCatalogueSections,
  getCategoryGroupLabel,
  getReviewCategory,
  inferCustomCategoryGroup,
  renameCustomCategory,
  setCustomCategoryArchived,
  type CustomCategory,
  type CustomCategoryGroup,
} from "@/lib/custom-categories";
import {
  setRuntimeCustomCategories,
  type ManualCategoryType,
} from "@/lib/manual-categories";
import type { ImportReviewEditType, ImportReviewRow } from "@/lib/import-review";

const CREATE_CATEGORY_VALUE = "__create_new_category__";

export type CategoryStorageMode = "loading" | "account" | "unavailable";
export type PendingCategoryOperation =
  | null
  | { kind: "CREATE" }
  | { kind: "RENAME"; categoryId: string }
  | { kind: "ARCHIVE"; categoryId: string }
  | { kind: "RESTORE"; categoryId: string };

const financialTypeOptions: Array<{ value: ManualCategoryType; label: string }> = [
  { value: "TRANSFER", label: "Transfer / account movement" },
  { value: "EXPENSE", label: "Fee, repayment or other money out" },
  { value: "INCOME", label: "Refund or other money in" },
];

function fallbackGroupForType(type: ManualCategoryType): CustomCategoryGroup {
  if (type === "INCOME") return "Income";
  if (type === "TRANSFER") return "Financial";
  return "Everyday spending";
}

function operationMessage(operation: Exclude<PendingCategoryOperation, null>) {
  if (operation.kind === "CREATE") return "Saving category to your account…";
  if (operation.kind === "RENAME") return "Saving name…";
  if (operation.kind === "ARCHIVE") return "Archiving…";
  return "Restoring…";
}

function looksLikeErrorMessage(value: string) {
  return /could not|unavailable|not accepted|failed|try again/i.test(value);
}

export function useCustomCategoryCatalogue() {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [storageMode, setStorageMode] = useState<CategoryStorageMode>("loading");
  const [pendingOperation, setPendingOperation] = useState<PendingCategoryOperation>(null);
  const [notice, setNotice] = useState("Loading account categories…");
  const [error, setError] = useState("");
  const pendingRef = useRef<PendingCategoryOperation>(null);

  useEffect(() => {
    let cancelled = false;

    void listAccountCustomCategories().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setStorageMode("unavailable");
        setNotice(result.error);
        setError(result.error);
        return;
      }

      setCategories(result.categories);
      setRuntimeCustomCategories(result.categories);
      setStorageMode("account");
      setNotice("");
      setError("");
    }).catch(() => {
      if (cancelled) return;
      const message = "Account categories are unavailable right now. Existing browser-only data was not changed.";
      setStorageMode("unavailable");
      setNotice(message);
      setError(message);
    });

    return () => { cancelled = true; };
  }, []);

  function setCatalogue(nextCategories: CustomCategory[]) {
    setCategories(nextCategories);
    setRuntimeCustomCategories(nextCategories);
  }

  function clearMessages() {
    setNotice("");
    setError("");
  }

  function beginOperation(operation: Exclude<PendingCategoryOperation, null>) {
    if (storageMode !== "account") {
      throw new Error(storageMode === "loading"
        ? "Account categories are still loading. Please try again."
        : "Account categories cannot be changed right now.");
    }
    if (pendingRef.current) {
      throw new Error("Another Category change is still saving. Please wait for it to finish.");
    }
    pendingRef.current = operation;
    setPendingOperation(operation);
    setNotice(operationMessage(operation));
    setError("");
  }

  function endOperation() {
    pendingRef.current = null;
    setPendingOperation(null);
  }

  function create(input: {
    name: string;
    type: ManualCategoryType;
    group?: CustomCategoryGroup;
  }) {
    const nextCategories = createCustomCategory(categories, {
      ...input,
      group: input.group ?? fallbackGroupForType(input.type),
    });
    const newCategory = nextCategories.find((category) =>
      !categories.some((existing) => existing.id === category.id),
    );
    if (!newCategory) throw new Error("The category could not be created.");

    beginOperation({ kind: "CREATE" });
    const previous = categories;
    setCatalogue(nextCategories);

    void createAccountCustomCategory(newCategory).then((result) => {
      if (result.ok) {
        setCatalogue(result.categories);
        setNotice("Category created and saved to your account.");
        setError("");
      } else {
        setCatalogue(previous);
        setNotice(result.error);
        setError(result.error);
      }
    }).catch(() => {
      const message = "The category could not be saved to your account. Please try again.";
      setCatalogue(previous);
      setNotice(message);
      setError(message);
    }).finally(endOperation);

    return newCategory;
  }

  async function rename(categoryId: string, name: string) {
    const nextCategories = renameCustomCategory(categories, categoryId, name);
    beginOperation({ kind: "RENAME", categoryId });
    const previous = categories;
    setCatalogue(nextCategories);

    try {
      const result = await updateAccountCustomCategory(categoryId, { name });
      if (!result.ok) {
        setCatalogue(previous);
        setNotice(result.error);
        setError(result.error);
        return false;
      }
      setCatalogue(result.categories);
      setNotice("Category renamed in your account.");
      setError("");
      return true;
    } catch {
      const message = "The category name could not be saved to your account.";
      setCatalogue(previous);
      setNotice(message);
      setError(message);
      return false;
    } finally {
      endOperation();
    }
  }

  async function setArchived(categoryId: string, isArchived: boolean) {
    const nextCategories = setCustomCategoryArchived(categories, categoryId, isArchived);
    beginOperation({ kind: isArchived ? "ARCHIVE" : "RESTORE", categoryId });
    const previous = categories;
    setCatalogue(nextCategories);

    try {
      const result = await updateAccountCustomCategory(categoryId, { isArchived });
      if (!result.ok) {
        setCatalogue(previous);
        setNotice(result.error);
        setError(result.error);
        return false;
      }
      setCatalogue(result.categories);
      setNotice(isArchived ? "Category archived in your account." : "Category restored in your account.");
      setError("");
      return true;
    } catch {
      const message = "The category change could not be saved to your account.";
      setCatalogue(previous);
      setNotice(message);
      setError(message);
      return false;
    } finally {
      endOperation();
    }
  }

  return {
    categories,
    storageMode,
    storageAvailable: storageMode !== "unavailable",
    recoveredFromCorruption: false,
    unsupportedVersion: false,
    pendingOperation,
    notice,
    error,
    setNotice,
    clearMessages,
    create,
    rename,
    setArchived,
  };
}

export function ReviewCategorySelector({
  row,
  customCategories,
  onDetails,
  onCreate,
}: {
  row: ImportReviewRow;
  customCategories: CustomCategory[];
  onDetails(details: { merchantName: string; categoryId: string; editType: ImportReviewEditType }): void;
  onCreate(input: { name: string; type: ManualCategoryType; group?: CustomCategoryGroup }): CustomCategory;
}) {
  const currentCategory = getReviewCategory(customCategories, row.categoryId);
  const suggestedGroup = inferCustomCategoryGroup({
    amountCents: row.amountCents,
    merchantName: row.merchantName,
    currentCategoryGroup: currentCategory?.group,
    currentCategoryType: currentCategory?.type,
  });
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [group, setGroup] = useState<CustomCategoryGroup>(suggestedGroup);
  const [financialType, setFinancialType] = useState<ManualCategoryType>(
    currentCategory?.group === "Financial" ? currentCategory.type : "TRANSFER",
  );
  const [error, setError] = useState("");
  const groups = getCategoryCatalogueSections(customCategories, row.categoryId);

  function handleSelect(value: string) {
    if (value === CREATE_CATEGORY_VALUE) {
      const nextGroup = inferCustomCategoryGroup({
        amountCents: row.amountCents,
        merchantName: row.merchantName,
        currentCategoryGroup: currentCategory?.group,
        currentCategoryType: currentCategory?.type,
      });
      setGroup(nextGroup);
      setFinancialType(
        nextGroup === "Financial" && currentCategory?.group === "Financial"
          ? currentCategory.type
          : "TRANSFER",
      );
      setShowCreate(true);
      setError("");
      return;
    }
    setShowCreate(false);
    onDetails({ merchantName: row.merchantName, categoryId: value, editType: "CATEGORY_EDIT" });
  }

  function handleGroupChange(nextGroup: CustomCategoryGroup) {
    setGroup(nextGroup);
    setFinancialType(defaultTypeForCategoryGroup(nextGroup));
  }

  function saveCategory() {
    try {
      const category = onCreate({
        name,
        group,
        type: defaultTypeForCategoryGroup(group, financialType),
      });
      onDetails({ merchantName: row.merchantName, categoryId: category.id, editType: "CATEGORY_EDIT" });
      setName("");
      setShowCreate(false);
      setError("");
    } catch (categoryError) {
      setError(categoryError instanceof Error ? categoryError.message : "The category could not be created.");
    }
  }

  return (
    <div className="mt-4">
      <label htmlFor={`category-${row.id}`} className="text-sm font-bold text-brand-deepTeal">Category</label>
      <select
        id={`category-${row.id}`}
        value={row.categoryId}
        onChange={(event) => handleSelect(event.target.value)}
        className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus-visible:ring-2 focus-visible:ring-focus"
      >
        {groups.map((section) => (
          <optgroup key={section.value} label={section.label}>
            {section.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}{"isArchived" in category && category.isArchived ? " (archived)" : ""}
              </option>
            ))}
          </optgroup>
        ))}
        <option value={CREATE_CATEGORY_VALUE}>＋ Create new category</option>
      </select>

      {showCreate && (
        <div className="mt-3 rounded-2xl border border-brand-green/30 bg-surface-mint p-4">
          <p className="font-bold text-brand-deepTeal">Create new category</p>
          <p className="mt-1 text-xs leading-5 text-brand-deepTeal/65">Choose where it should appear. New categories are saved to your account.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-brand-deepTeal">
              Category name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
                autoFocus
                className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus-visible:ring-2 focus-visible:ring-focus"
              />
            </label>
            <label className="text-sm font-bold text-brand-deepTeal">
              Group
              <select
                value={group}
                onChange={(event) => handleGroupChange(event.target.value as CustomCategoryGroup)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus-visible:ring-2 focus-visible:ring-focus"
              >
                {CUSTOM_CATEGORY_GROUPS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
          {group === "Financial" && (
            <label className="mt-3 block text-sm font-bold text-brand-deepTeal">
              What kind of financial category is this?
              <select
                value={financialType}
                onChange={(event) => setFinancialType(event.target.value as ManualCategoryType)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus-visible:ring-2 focus-visible:ring-focus"
              >
                {financialTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          )}
          {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger-red">{error}</p>}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={saveCategory} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-deepTeal px-4 text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"><Plus aria-hidden="true" className="h-4 w-4" /> Create category</button>
            <button type="button" onClick={() => setShowCreate(false)} className="min-h-11 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

type CategoryManagerProps = {
  categories: CustomCategory[];
  storageMode?: CategoryStorageMode;
  storageAvailable?: boolean;
  recoveredFromCorruption?: boolean;
  unsupportedVersion?: boolean;
  notice: string;
  error?: string;
  pendingOperation?: PendingCategoryOperation;
  onClearMessages?(): void;
  onRename(categoryId: string, name: string): void | boolean | Promise<void | boolean>;
  onArchiveChange(categoryId: string, isArchived: boolean): void | boolean | Promise<void | boolean>;
};

export function CustomCategoryManager({
  categories,
  storageMode,
  storageAvailable = true,
  notice,
  error: catalogueError,
  pendingOperation,
  onClearMessages,
  onRename,
  onArchiveChange,
}: CategoryManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editorError, setEditorError] = useState("");
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const renameButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const archiveButtonRefs = useRef(new Map<string, HTMLButtonElement>());

  const effectiveStorageMode: CategoryStorageMode = storageMode
    ?? (notice === "Loading account categories…" ? "loading" : storageAvailable ? "account" : "unavailable");
  const inferredPending: PendingCategoryOperation = pendingOperation
    ?? (notice.startsWith("Saving category") ? { kind: "CREATE" }
      : notice.startsWith("Saving name") && editingId ? { kind: "RENAME", categoryId: editingId }
      : notice.startsWith("Archiving") && confirmArchiveId ? { kind: "ARCHIVE", categoryId: confirmArchiveId }
      : notice.startsWith("Restoring") ? { kind: "RESTORE", categoryId: "pending" }
      : null);
  const inferredError = catalogueError ?? (looksLikeErrorMessage(notice) ? notice : "");
  const visibleNotice = notice && notice !== inferredError && effectiveStorageMode !== "loading" ? notice : "";
  const operationPending = Boolean(inferredPending);
  const availableCategories = categories.filter((category) => !category.isArchived);
  const archivedCategories = categories.filter((category) => category.isArchived);

  useEffect(() => {
    if (editingId) renameInputRef.current?.focus();
  }, [editingId]);

  function returnFocus(map: Map<string, HTMLButtonElement>, categoryId: string) {
    window.requestAnimationFrame(() => map.get(categoryId)?.focus());
  }

  function startRename(category: CustomCategory) {
    if (operationPending) return;
    onClearMessages?.();
    setConfirmArchiveId(null);
    setEditingId(category.id);
    setEditingName(category.name);
    setEditorError("");
  }

  function cancelRename() {
    if (!editingId || inferredPending?.kind === "RENAME") return;
    const categoryId = editingId;
    setEditingId(null);
    setEditingName("");
    setEditorError("");
    returnFocus(renameButtonRefs.current, categoryId);
  }

  async function finishRename(categoryId: string) {
    if (operationPending) return;
    try {
      const accepted = await onRename(categoryId, editingName);
      if (accepted === false) return;
      setEditingId(null);
      setEditingName("");
      setEditorError("");
      returnFocus(renameButtonRefs.current, categoryId);
    } catch (renameError) {
      setEditorError(renameError instanceof Error ? renameError.message : "The category could not be renamed.");
      window.requestAnimationFrame(() => renameInputRef.current?.focus());
    }
  }

  function startArchive(categoryId: string) {
    if (operationPending) return;
    onClearMessages?.();
    setEditingId(null);
    setEditorError("");
    setConfirmArchiveId(categoryId);
  }

  function cancelArchive(categoryId: string) {
    if (inferredPending?.kind === "ARCHIVE") return;
    setConfirmArchiveId(null);
    returnFocus(archiveButtonRefs.current, categoryId);
  }

  async function confirmArchive(categoryId: string) {
    if (operationPending) return;
    const accepted = await onArchiveChange(categoryId, true);
    if (accepted === false) return;
    setConfirmArchiveId(null);
    returnFocus(archiveButtonRefs.current, categoryId);
  }

  async function restoreCategory(categoryId: string) {
    if (operationPending) return;
    onClearMessages?.();
    await onArchiveChange(categoryId, false);
    returnFocus(archiveButtonRefs.current, categoryId);
  }

  return (
    <section
      className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6"
      aria-labelledby="saved-categories-heading"
      aria-busy={effectiveStorageMode === "loading" || operationPending}
    >
      <div>
        <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">
          {effectiveStorageMode === "account" && <Cloud aria-hidden="true" className="h-4 w-4" />}
          {effectiveStorageMode === "loading" ? "Loading account categories…" : effectiveStorageMode === "account" ? "Saved to your account" : "Account unavailable"}
        </p>
        <h2 id="saved-categories-heading" className="mt-1 text-xl font-bold text-brand-deepTeal">Your categories</h2>
        <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Categories you create appear in the normal Category groups. SpendGrove’s included Categories stay unchanged.</p>
        <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Archiving removes a Category from new choices. Existing Transactions keep the Category and their totals do not change. You can restore it later.</p>
      </div>

      {effectiveStorageMode === "loading" ? (
        <p role="status" className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-muted">Loading account categories…</p>
      ) : effectiveStorageMode === "unavailable" ? (
        <p role="alert" className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-foreground">Account Categories cannot be changed right now. Existing browser-only data was not changed.</p>
      ) : categories.length > 0 ? (
        <details className="mt-4 rounded-2xl border border-border p-4">
          <summary className="min-h-11 cursor-pointer rounded-lg py-2 font-bold text-brand-deepTeal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            Manage saved Categories · {availableCategories.length} available · {archivedCategories.length} archived
          </summary>
          <div className="mt-4 space-y-3">
            {categories.map((category) => {
              const renamePending = inferredPending?.kind === "RENAME" && inferredPending.categoryId === category.id;
              const archivePending = inferredPending?.kind === "ARCHIVE" && inferredPending.categoryId === category.id;
              const restorePending = inferredPending?.kind === "RESTORE" && (inferredPending.categoryId === category.id || inferredPending.categoryId === "pending");
              const renameErrorId = `category-rename-error-${category.id}`;
              return (
                <article key={category.id} className="min-w-0 rounded-2xl bg-surface-mint p-4">
                  {editingId === category.id ? (
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="min-w-0 flex-1">
                        <label htmlFor={`category-rename-${category.id}`} className="sr-only">New name for {category.name}</label>
                        <input
                          ref={renameInputRef}
                          id={`category-rename-${category.id}`}
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          aria-label={`New name for ${category.name}`}
                          aria-describedby={editorError ? renameErrorId : undefined}
                          disabled={renamePending}
                          className="min-h-11 w-full min-w-0 rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus-visible:ring-2 focus-visible:ring-focus"
                        />
                        {editorError && <p id={renameErrorId} role="alert" className="mt-2 text-sm font-semibold text-danger-red">{editorError}</p>}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button type="button" disabled={operationPending} onClick={() => void finishRename(category.id)} className="min-h-11 rounded-full bg-brand-deepTeal px-4 text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50">{renamePending ? "Saving name…" : "Save name"}</button>
                        <button type="button" disabled={renamePending} onClick={cancelRename} className="min-h-11 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50">Cancel</button>
                      </div>
                    </div>
                  ) : confirmArchiveId === category.id ? (
                    <div role="group" aria-labelledby={`archive-category-${category.id}`} className="rounded-xl border border-warning-amber/30 bg-warning-amber/5 p-3">
                      <p id={`archive-category-${category.id}`} className="break-words font-bold text-foreground">Archive {category.name}?</p>
                      <p className="mt-1 text-sm leading-6 text-muted">It will no longer appear in new Category choices. Existing Transactions and totals will not change, and you can restore it later.</p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <button type="button" disabled={archivePending} onClick={() => cancelArchive(category.id)} className="min-h-11 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50">Keep available</button>
                        <button type="button" disabled={operationPending} onClick={() => void confirmArchive(category.id)} className="min-h-11 rounded-full bg-brand-deepTeal px-4 text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50">{archivePending ? "Archiving…" : "Archive Category"}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words font-bold text-brand-deepTeal">{category.name}</p>
                        <p className="mt-1 break-words text-xs text-brand-deepTeal/60">{getCategoryGroupLabel(category.group)} · {category.isArchived ? "Archived" : "Available"}</p>
                      </div>
                      <div className="flex flex-col gap-2 min-[390px]:flex-row min-[390px]:flex-wrap">
                        <button
                          ref={(element) => { if (element) renameButtonRefs.current.set(category.id, element); else renameButtonRefs.current.delete(category.id); }}
                          type="button"
                          disabled={operationPending}
                          onClick={() => startRename(category)}
                          aria-label={`Rename ${category.name}`}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
                        ><Pencil aria-hidden="true" className="h-3.5 w-3.5" /> Rename</button>
                        <button
                          ref={(element) => { if (element) archiveButtonRefs.current.set(category.id, element); else archiveButtonRefs.current.delete(category.id); }}
                          type="button"
                          disabled={operationPending}
                          onClick={() => category.isArchived ? void restoreCategory(category.id) : startArchive(category.id)}
                          aria-label={`${category.isArchived ? "Restore" : "Archive"} ${category.name}`}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {category.isArchived ? <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /> : <Archive aria-hidden="true" className="h-3.5 w-3.5" />}
                          {restorePending ? "Restoring…" : category.isArchived ? "Restore" : "Archive"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </details>
      ) : (
        <p className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">No saved Categories yet.</p>
      )}

      {visibleNotice && <p role="status" aria-live="polite" className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">{visibleNotice}</p>}
      {inferredError && <p role="alert" className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-foreground">{inferredError}</p>}
    </section>
  );
}
