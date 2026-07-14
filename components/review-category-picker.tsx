"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import type { CustomCategory, CustomCategoryGroup } from "@/lib/custom-categories";
import {
  CUSTOM_CATEGORY_GROUPS,
  defaultTypeForCategoryGroup,
  getCategoryCatalogueSections,
  getReviewCategory,
  inferCustomCategoryGroup,
} from "@/lib/custom-categories";
import type { ImportReviewEditType, ImportReviewRow } from "@/lib/import-review";
import type { ManualCategoryType } from "@/lib/manual-categories";
import { deriveTransactionType } from "@/lib/transaction-direction";

const financialTypeOptions: Array<{ value: ManualCategoryType; label: string }> = [
  { value: "TRANSFER", label: "Transfer / account movement" },
  { value: "EXPENSE", label: "Fee, repayment or other money out" },
  { value: "INCOME", label: "Refund or other money in" },
];

export function ReviewCategoryPicker({
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
  const directionType = row.amountCents
    ? (currentCategory?.type === "TRANSFER" ? "TRANSFER" : deriveTransactionType(row.amountCents))
    : null;
  const directionLabel = directionType === "INCOME" ? "money in" : directionType === "EXPENSE" ? "money out" : "a transfer";
  const categoryTypeIsAllowed = (type: ManualCategoryType) => directionType === null
    || type === directionType
    || (directionType !== "TRANSFER" && type === "TRANSFER");
  const suggestedGroup = inferCustomCategoryGroup({
    amountCents: row.amountCents,
    merchantName: row.merchantName,
    currentCategoryGroup: currentCategory?.group,
    currentCategoryType: currentCategory?.type,
  });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [group, setGroup] = useState<CustomCategoryGroup>(suggestedGroup);
  const [financialType, setFinancialType] = useState<ManualCategoryType>("TRANSFER");
  const [error, setError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const groups = useMemo(
    () => getCategoryCatalogueSections(customCategories, row.categoryId)
      .map((section) => ({
        ...section,
        categories: section.categories.filter((category) => categoryTypeIsAllowed(category.type)),
      }))
      .filter((section) => section.categories.length > 0),
    [customCategories, row.categoryId, directionType],
  );
  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("en-AU");
    if (!needle) return groups;
    return groups.map((section) => ({
      ...section,
      categories: section.categories.filter((category) =>
        category.name.toLocaleLowerCase("en-AU").includes(needle)
        || section.label.toLocaleLowerCase("en-AU").includes(needle)),
    })).filter((section) => section.categories.length > 0);
  }, [groups, query]);
  const resultCount = filteredGroups.reduce((count, section) => count + section.categories.length, 0);

  useEffect(() => {
    if (!open || showCreate) return;
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open, showCreate]);

  function chooseCategory(categoryId: string) {
    onDetails({ merchantName: row.merchantName, categoryId, editType: "CATEGORY_EDIT" });
    setOpen(false);
    setQuery("");
    setShowCreate(false);
  }

  function beginCreate() {
    const compatibleGroup = categoryTypeIsAllowed(defaultTypeForCategoryGroup(suggestedGroup))
      ? suggestedGroup
      : directionType === "INCOME"
        ? "Income"
        : directionType === "TRANSFER"
          ? "Financial"
          : "Everyday spending";
    setGroup(compatibleGroup);
    setFinancialType(directionType ?? defaultTypeForCategoryGroup(compatibleGroup));
    setShowCreate(true);
    setError("");
  }

  function saveCategory() {
    try {
      const categoryType = defaultTypeForCategoryGroup(group, financialType);
      if (!categoryTypeIsAllowed(categoryType)) throw new Error(`Choose a category for ${directionLabel}.`);
      const category = onCreate({
        name,
        group,
        type: categoryType,
      });
      setName("");
      setError("");
      chooseCategory(category.id);
    } catch (categoryError) {
      setError(categoryError instanceof Error ? categoryError.message : "The category could not be created.");
    }
  }

  return (
    <div className="mt-4">
      <span className="text-sm font-bold text-brand-deepTeal">Category</span>
      <button
        type="button"
        onClick={() => { setOpen(true); setQuery(""); setShowCreate(false); setError(""); }}
        aria-haspopup="dialog"
        className="mt-2 flex min-h-12 w-full items-center justify-between rounded-2xl border border-border bg-white px-4 text-left text-sm font-semibold text-brand-deepTeal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
      >
        <span>{currentCategory?.name ?? "Choose a category"}</span>
        <span className="text-brand-teal">Change</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-brand-deepTeal/35 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby={`category-picker-${row.id}`} className="max-h-[82dvh] w-full max-w-xl overflow-hidden rounded-t-[2rem] bg-surface-base shadow-soft sm:rounded-[2rem]">
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div><h3 id={`category-picker-${row.id}`} className="text-xl font-bold text-brand-deepTeal">Choose a category for {directionLabel}</h3><p className="mt-1 text-sm text-brand-deepTeal/65">Search or browse compatible categories. Your reviewed choice can be remembered for this merchant.</p></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close category picker" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-white text-brand-deepTeal"><X aria-hidden="true" className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[calc(82dvh-7rem)] overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4">
              {!showCreate ? (
                <div className="space-y-5">
                  <label className="block text-sm font-bold text-brand-deepTeal">
                    Search categories
                    <span className="relative mt-2 block">
                      <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-teal" />
                      <input
                        ref={searchRef}
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Try food, rent or utilities"
                        aria-label="Search categories"
                        className="min-h-12 w-full rounded-2xl border border-border bg-white py-3 pl-11 pr-4 text-sm font-normal outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                      />
                    </span>
                  </label>
                  {resultCount === 0 ? (
                    <p role="status" className="rounded-2xl bg-surface-mint p-4 text-sm font-semibold text-brand-deepTeal">No categories found.</p>
                  ) : filteredGroups.map((section) => (
                    <div key={section.value}><p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">{section.label}</p><div className="grid gap-2 sm:grid-cols-2">{section.categories.map((category) => {
                      const selected = category.id === row.categoryId;
                      return <button key={category.id} type="button" onClick={() => chooseCategory(category.id)} className={`flex min-h-12 items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${selected ? "border-brand-green bg-surface-mint text-brand-deepTeal" : "border-border bg-white text-brand-deepTeal"}`}><span>{category.name}{"isArchived" in category && category.isArchived ? " (archived)" : ""}</span>{selected && <Check aria-hidden="true" className="h-4 w-4 text-brand-green" />}</button>;
                    })}</div></div>
                  ))}
                  <button type="button" onClick={beginCreate} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-brand-teal bg-white px-4 text-sm font-bold text-brand-deepTeal"><Plus aria-hidden="true" className="h-4 w-4" /> Create new category</button>
                </div>
              ) : (
                <div className="rounded-2xl bg-surface-mint p-4">
                  <p className="font-bold text-brand-deepTeal">Create new category</p>
                  <label className="mt-3 block text-sm font-bold text-brand-deepTeal">Category name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} autoFocus className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm" /></label>
                  <label className="mt-3 block text-sm font-bold text-brand-deepTeal">Group<select value={group} onChange={(event) => { const next = event.target.value as CustomCategoryGroup; setGroup(next); setFinancialType(defaultTypeForCategoryGroup(next)); }} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm">{CUSTOM_CATEGORY_GROUPS.filter((option) => categoryTypeIsAllowed(option.defaultType) || option.value === "Financial").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  {group === "Financial" && <label className="mt-3 block text-sm font-bold text-brand-deepTeal">What kind?<select value={financialType} onChange={(event) => setFinancialType(event.target.value as ManualCategoryType)} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm">{financialTypeOptions.filter((option) => categoryTypeIsAllowed(option.value)).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}
                  {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger-red">{error}</p>}
                  <div className="mt-4 flex gap-2"><button type="button" onClick={saveCategory} className="min-h-11 rounded-full bg-brand-deepTeal px-4 text-sm font-bold text-white">Create category</button><button type="button" onClick={() => setShowCreate(false)} className="min-h-11 rounded-full border border-brand-teal px-4 text-sm font-bold text-brand-deepTeal">Back</button></div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
