"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, Pencil, Plus, RotateCcw } from "lucide-react";
import {
  createCustomCategory,
  getReviewCategory,
  getSelectableCustomCategories,
  inferCustomCategoryType,
  loadCustomCategoriesFromStorage,
  renameCustomCategory,
  saveCustomCategoriesToStorage,
  setCustomCategoryArchived,
  type CustomCategory,
} from "@/lib/custom-categories";
import {
  manualCategories,
  setRuntimeCustomCategories,
  type ManualCategoryType,
} from "@/lib/manual-categories";
import type { ImportReviewEditType, ImportReviewRow } from "@/lib/import-review";

const CREATE_CATEGORY_VALUE = "__create_new_category__";

const categoryTypeOptions: Array<{ value: ManualCategoryType; label: string }> = [
  { value: "EXPENSE", label: "Expense / money out" },
  { value: "INCOME", label: "Income or refund / money in" },
  { value: "TRANSFER", label: "Transfer / account movement" },
];

const seededSections = [
  { sourceGroup: "Everyday spending", label: "Everyday" },
  { sourceGroup: "Bills and household", label: "Bills and household" },
  { sourceGroup: "Financial", label: "Financial / transfers" },
  { sourceGroup: "Income", label: "Income / refunds" },
  { sourceGroup: "Work and tax", label: "Work / tax" },
  { sourceGroup: "Review", label: "Review" },
] as const;

export function useCustomCategoryCatalogue() {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [recoveredFromCorruption, setRecoveredFromCorruption] = useState(false);
  const [unsupportedVersion, setUnsupportedVersion] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loaded = loadCustomCategoriesFromStorage(window.localStorage);
    setCategories(loaded.categories);
    setRuntimeCustomCategories(loaded.categories);
    setStorageAvailable(loaded.storageAvailable);
    setRecoveredFromCorruption(loaded.recoveredFromCorruption);
    setUnsupportedVersion(loaded.unsupportedVersion);
    if (loaded.migrated) saveCustomCategoriesToStorage(window.localStorage, loaded.categories);
  }, []);

  function persist(nextCategories: CustomCategory[], successNotice: string) {
    setCategories(nextCategories);
    setRuntimeCustomCategories(nextCategories);
    const saved = saveCustomCategoriesToStorage(window.localStorage, nextCategories);
    setStorageAvailable(saved);
    setNotice(saved
      ? successNotice
      : "Browser storage is unavailable. This category will last only while this page is open.");
    return nextCategories;
  }

  function create(input: { name: string; type: ManualCategoryType }) {
    const nextCategories = createCustomCategory(categories, input);
    const newCategory = nextCategories.find((category) =>
      !categories.some((existing) => existing.id === category.id),
    );
    if (!newCategory) throw new Error("The category could not be created.");
    persist(nextCategories, "Category created and saved on this device.");
    return newCategory;
  }

  function rename(categoryId: string, name: string) {
    persist(renameCustomCategory(categories, categoryId, name), "Category renamed on this device.");
  }

  function setArchived(categoryId: string, isArchived: boolean) {
    persist(
      setCustomCategoryArchived(categories, categoryId, isArchived),
      isArchived ? "Category archived on this device." : "Category restored on this device.",
    );
  }

  return {
    categories,
    storageAvailable,
    recoveredFromCorruption,
    unsupportedVersion,
    notice,
    setNotice,
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
  onCreate(input: { name: string; type: ManualCategoryType }): CustomCategory;
}) {
  const currentCategory = getReviewCategory(customCategories, row.categoryId);
  const inferredType = inferCustomCategoryType({
    amountCents: row.amountCents,
    merchantName: row.merchantName,
    currentCategoryType: currentCategory?.type,
  });
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ManualCategoryType | "">(inferredType ?? "");
  const [error, setError] = useState("");

  const groups = useMemo(() => {
    const seeded = seededSections.map((section) => ({
      label: section.label,
      categories: manualCategories.filter((category) => category.group === section.sourceGroup),
    }));
    const selectableCustom = getSelectableCustomCategories(customCategories, row.categoryId);
    const custom = ["Custom expenses", "Custom income", "Custom transfers"]
      .map((group) => ({
        label: group,
        categories: selectableCustom.filter((category) => category.group === group),
      }))
      .filter((group) => group.categories.length > 0);
    return [...seeded, ...custom];
  }, [customCategories, row.categoryId]);

  function handleSelect(value: string) {
    if (value === CREATE_CATEGORY_VALUE) {
      setType(inferredType ?? "");
      setShowCreate(true);
      setError("");
      return;
    }
    setShowCreate(false);
    onDetails({ merchantName: row.merchantName, categoryId: value, editType: "CATEGORY_EDIT" });
  }

  function saveCategory() {
    if (!type) {
      setError("Choose whether this is an expense, income/refund or transfer.");
      return;
    }
    try {
      const category = onCreate({ name, type });
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
        className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
      >
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.categories.map((category) => (
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
          <p className="mt-1 text-xs leading-5 text-brand-deepTeal/65">Saved on this device only. You can change the suggested type before saving.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-brand-deepTeal">
              Category name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
                autoFocus
                className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
              />
            </label>
            <label className="text-sm font-bold text-brand-deepTeal">
              Category type
              <select
                value={type}
                onChange={(event) => setType(event.target.value as ManualCategoryType)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
              >
                <option value="">Choose a type</option>
                {categoryTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
          {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger-red">{error}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={saveCategory} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-deepTeal px-4 text-sm font-bold text-white"><Plus aria-hidden="true" className="h-4 w-4" /> Create category</button>
            <button type="button" onClick={() => setShowCreate(false)} className="min-h-11 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CustomCategoryManager({
  categories,
  storageAvailable,
  recoveredFromCorruption,
  unsupportedVersion,
  notice,
  onRename,
  onArchiveChange,
}: {
  categories: CustomCategory[];
  storageAvailable: boolean;
  recoveredFromCorruption: boolean;
  unsupportedVersion: boolean;
  notice: string;
  onRename(categoryId: string, name: string): void;
  onArchiveChange(categoryId: string, isArchived: boolean): void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  function finishRename(categoryId: string) {
    try {
      onRename(categoryId, editingName);
      setEditingId(null);
      setEditingName("");
      setError("");
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "The category could not be renamed.");
    }
  }

  return (
    <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="custom-categories-heading">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">Saved on this device</p>
        <h2 id="custom-categories-heading" className="mt-1 text-xl font-bold text-brand-deepTeal">Custom categories</h2>
        <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Create categories inside a transaction card. Seeded SpendGrove categories stay unchanged.</p>
      </div>

      {categories.length > 0 ? (
        <details className="mt-4 rounded-2xl border border-border p-4">
          <summary className="cursor-pointer font-bold text-brand-deepTeal">Manage custom categories ({categories.length})</summary>
          <div className="mt-4 space-y-3">
            {categories.map((category) => (
              <article key={category.id} className="rounded-2xl bg-surface-mint p-4">
                {editingId === category.id ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      aria-label="Custom category name"
                      className="min-h-11 flex-1 rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                    />
                    <button type="button" onClick={() => finishRename(category.id)} className="min-h-11 rounded-full bg-brand-deepTeal px-4 text-sm font-bold text-white">Save name</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-brand-deepTeal">{category.name}</p>
                      <p className="mt-1 text-xs text-brand-deepTeal/60">{category.group} · {category.isArchived ? "Archived" : "Available"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => { setEditingId(category.id); setEditingName(category.name); setError(""); }} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal"><Pencil aria-hidden="true" className="h-3.5 w-3.5" /> Rename</button>
                      <button type="button" onClick={() => onArchiveChange(category.id, !category.isArchived)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-teal px-3 text-xs font-bold text-brand-deepTeal">
                        {category.isArchived ? <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /> : <Archive aria-hidden="true" className="h-3.5 w-3.5" />}
                        {category.isArchived ? "Restore" : "Archive"}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
          {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger-red">{error}</p>}
        </details>
      ) : (
        <p className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">No custom categories yet.</p>
      )}

      {!storageAvailable && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Browser storage is unavailable. New categories last only while this page is open.</p>}
      {recoveredFromCorruption && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Unreadable saved categories were ignored and safely reset.</p>}
      {unsupportedVersion && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Saved categories from a newer app version were ignored for safety.</p>}
      {notice && <p role="status" className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">{notice}</p>}
    </section>
  );
}
