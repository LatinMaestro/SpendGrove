"use client";

import { useEffect, useState } from "react";
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

export function useCustomCategoryCatalogue() {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [storageMode, setStorageMode] = useState<"loading" | "account" | "unavailable">("loading");
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [recoveredFromCorruption, setRecoveredFromCorruption] = useState(false);
  const [unsupportedVersion, setUnsupportedVersion] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    void listAccountCustomCategories().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setStorageMode("unavailable");
        setStorageAvailable(false);
        setNotice(result.error);
        return;
      }

      setCategories(result.categories);
      setRuntimeCustomCategories(result.categories);
      setStorageMode("account");
      setStorageAvailable(true);
    }).catch(() => {
      if (cancelled) return;
      setStorageMode("unavailable");
      setStorageAvailable(false);
      setNotice("Account categories are unavailable right now. Your browser-only categories were not changed.");
    });

    return () => { cancelled = true; };
  }, []);

  function setCatalogue(nextCategories: CustomCategory[]) {
    setCategories(nextCategories);
    setRuntimeCustomCategories(nextCategories);
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

    if (storageMode !== "account") {
      throw new Error("Account categories are still loading. Please try again.");
    }

    const previous = categories;
    setCatalogue(nextCategories);
    setNotice("Saving category to your account…");
    void createAccountCustomCategory(newCategory).then((result) => {
      if (result.ok) {
        setCatalogue(result.categories);
        setNotice("Category created and saved to your account.");
      } else {
        setCatalogue(previous);
        setNotice(result.error);
      }
    }).catch(() => {
      setCatalogue(previous);
      setNotice("The category could not be saved to your account. Please try again.");
    });
    return newCategory;
  }

  function rename(categoryId: string, name: string) {
    const nextCategories = renameCustomCategory(categories, categoryId, name);
    if (storageMode !== "account") {
      setNotice("Account categories are unavailable. Your browser-only categories were not changed.");
      return;
    }

    const previous = categories;
    setCatalogue(nextCategories);
    void updateAccountCustomCategory(categoryId, { name }).then((result) => {
      if (result.ok) {
        setCatalogue(result.categories);
        setNotice("Category renamed in your account.");
      } else {
        setCatalogue(previous);
        setNotice(result.error);
      }
    }).catch(() => {
      setCatalogue(previous);
      setNotice("The category name could not be saved to your account.");
    });
  }

  function setArchived(categoryId: string, isArchived: boolean) {
    const nextCategories = setCustomCategoryArchived(categories, categoryId, isArchived);
    if (storageMode !== "account") {
      setNotice("Account categories are unavailable. Your browser-only categories were not changed.");
      return;
    }

    const previous = categories;
    setCatalogue(nextCategories);
    void updateAccountCustomCategory(categoryId, { isArchived }).then((result) => {
      if (result.ok) {
        setCatalogue(result.categories);
        setNotice(isArchived ? "Category archived in your account." : "Category restored in your account.");
      } else {
        setCatalogue(previous);
        setNotice(result.error);
      }
    }).catch(() => {
      setCatalogue(previous);
      setNotice("The category change could not be saved to your account.");
    });
  }

  return {
    categories,
    storageMode,
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
        className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
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
                className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
              />
            </label>
            <label className="text-sm font-bold text-brand-deepTeal">
              Group
              <select
                value={group}
                onChange={(event) => handleGroupChange(event.target.value as CustomCategoryGroup)}
                className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
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
                className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
              >
                {financialTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          )}
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
  const [accountBacked, setAccountBacked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listAccountCustomCategories().then((result) => {
      if (!cancelled) setAccountBacked(result.ok);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

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
    <section className="rounded-[2rem] border border-border bg-surface-base p-5 shadow-soft sm:p-6" aria-labelledby="saved-categories-heading">
      <div>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">{accountBacked && <Cloud aria-hidden="true" className="h-4 w-4" />}{accountBacked ? "Saved to your account" : "Saved on this device"}</p>
        <h2 id="saved-categories-heading" className="mt-1 text-xl font-bold text-brand-deepTeal">Your categories</h2>
        <p className="mt-2 text-sm leading-6 text-brand-deepTeal/70">Categories you create appear in the normal category groups. SpendGrove’s included categories stay unchanged.</p>
      </div>

      {categories.length > 0 ? (
        <details className="mt-4 rounded-2xl border border-border p-4">
          <summary className="cursor-pointer font-bold text-brand-deepTeal">Manage saved categories ({categories.length})</summary>
          <div className="mt-4 space-y-3">
            {categories.map((category) => (
              <article key={category.id} className="rounded-2xl bg-surface-mint p-4">
                {editingId === category.id ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      aria-label="Saved category name"
                      className="min-h-11 flex-1 rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                    />
                    <button type="button" onClick={() => finishRename(category.id)} className="min-h-11 rounded-full bg-brand-deepTeal px-4 text-sm font-bold text-white">Save name</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-brand-deepTeal">{category.name}</p>
                      <p className="mt-1 text-xs text-brand-deepTeal/60">{getCategoryGroupLabel(category.group)} · {category.isArchived ? "Archived" : "Available"}</p>
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
        <p className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">No saved categories yet.</p>
      )}

      {!accountBacked && !storageAvailable && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Browser storage is unavailable. New categories last only while this page is open.</p>}
      {recoveredFromCorruption && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Unreadable saved categories were ignored and safely reset.</p>}
      {unsupportedVersion && <p className="mt-4 rounded-2xl bg-warning-amber/10 p-4 text-sm font-semibold text-brand-deepTeal">Saved categories from a newer app version were ignored for safety.</p>}
      {notice && <p role="status" className="mt-4 rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">{notice}</p>}
    </section>
  );
}
