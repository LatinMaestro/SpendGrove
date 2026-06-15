import { describe, expect, it } from "vitest";
import {
  createCustomCategory,
  getSelectableCustomCategories,
  inferCustomCategoryType,
  renameCustomCategory,
  setCustomCategoryArchived,
} from "@/lib/custom-categories";
import { manualCategories, setRuntimeCustomCategories } from "@/lib/manual-categories";
import { parseCsvDocument, scanCsvDocument } from "@/lib/csv-import";
import { createTransientImportReviewRows, updateImportReviewDetails } from "@/lib/import-review";

function createExpenseCategory() {
  return createCustomCategory([], {
    id: "custom-category-weekend-markets",
    name: "Weekend markets",
    type: "EXPENSE",
    now: new Date("2026-06-15T00:00:00.000Z"),
  });
}

describe("custom category lifecycle", () => {
  it("creates safe category metadata with inferred or overridden types", () => {
    expect(inferCustomCategoryType({ amountCents: -1250, merchantName: "Local market" })).toBe("EXPENSE");
    expect(inferCustomCategoryType({ amountCents: 1250, merchantName: "Refund" })).toBe("INCOME");
    expect(inferCustomCategoryType({ amountCents: -1250, merchantName: "Bank transfer" })).toBeNull();

    const categories = createExpenseCategory();
    const transfer = createCustomCategory(categories, {
      id: "custom-category-family-transfer",
      name: "Family transfer",
      type: "TRANSFER",
      now: new Date("2026-06-15T01:00:00.000Z"),
    });
    expect(categories[0]).toMatchObject({ name: "Weekend markets", type: "EXPENSE", group: "Custom expenses", isArchived: false });
    expect(transfer.find((category) => category.id === "custom-category-family-transfer")).toMatchObject({ type: "TRANSFER", group: "Custom transfers" });
  });

  it("prevents duplicates across seeded and custom categories", () => {
    const categories = createExpenseCategory();
    expect(() => createCustomCategory(categories, { name: "  WEEKEND   MARKETS ", type: "EXPENSE" })).toThrow("already exists");
    expect(() => createCustomCategory(categories, { name: "groceries", type: "EXPENSE" })).toThrow("already exists");
  });

  it("renames, archives and restores custom categories while seeded categories remain immutable", () => {
    const categories = createExpenseCategory();
    const renamed = renameCustomCategory(categories, categories[0].id, "Community markets", new Date("2026-06-16T00:00:00.000Z"));
    const archived = setCustomCategoryArchived(renamed, renamed[0].id, true);
    const restored = setCustomCategoryArchived(archived, archived[0].id, false);

    expect(renamed[0].name).toBe("Community markets");
    expect(archived[0].isArchived).toBe(true);
    expect(restored[0].isArchived).toBe(false);
    expect(() => renameCustomCategory(categories, manualCategories[0].id, "Changed seed")).toThrow("Seeded categories cannot be renamed");
    expect(() => setCustomCategoryArchived(categories, manualCategories[0].id, true)).toThrow("Seeded categories cannot be archived");
  });

  it("hides archived categories from new selections but preserves one already used in transient review", () => {
    const categories = setCustomCategoryArchived(createExpenseCategory(), "custom-category-weekend-markets", true);
    expect(getSelectableCustomCategories(categories)).toEqual([]);
    expect(getSelectableCustomCategories(categories, categories[0].id)).toEqual(categories);

    setRuntimeCustomCategories(categories);
    const document = parseCsvDocument("15/06/2026,-12.50,Synthetic market purchase");
    const scan = scanCsvDocument(document, { 0: "DATE", 1: "AMOUNT", 2: "DESCRIPTION" });
    const rows = createTransientImportReviewRows(document, scan.columns, scan.mapping);
    const updated = updateImportReviewDetails(rows, rows[0].id, {
      merchantName: rows[0].merchantName,
      categoryId: categories[0].id,
      editType: "CATEGORY_EDIT",
    });
    expect(updated[0].categoryId).toBe(categories[0].id);
    setRuntimeCustomCategories([]);
  });
});
