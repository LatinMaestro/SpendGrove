import { describe, expect, it } from "vitest";
import {
  createCustomCategory,
  getCategoryCatalogueSections,
  getSelectableCustomCategories,
  inferCustomCategoryGroup,
  renameCustomCategory,
  setCustomCategoryArchived,
} from "@/lib/custom-categories";
import { manualCategories, setRuntimeCustomCategories } from "@/lib/manual-categories";
import { parseCsvDocument, scanCsvDocument } from "@/lib/csv-import";
import { createTransientImportReviewRows, updateImportReviewDetails } from "@/lib/import-review";

function createWorkCategory() {
  return createCustomCategory([], {
    id: "custom-category-work-parking",
    name: "Work parking",
    group: "Work and tax",
    now: new Date("2026-06-15T00:00:00.000Z"),
  });
}

describe("custom category lifecycle", () => {
  it("creates categories under a selected normal group with plain defaults", () => {
    expect(inferCustomCategoryGroup({ amountCents: -1250, merchantName: "Local market" })).toBe("Everyday spending");
    expect(inferCustomCategoryGroup({ amountCents: 1250, merchantName: "Refund" })).toBe("Income");
    expect(inferCustomCategoryGroup({ amountCents: -1250, merchantName: "Bank transfer" })).toBe("Financial");

    const workCategories = createWorkCategory();
    const incomeCategories = createCustomCategory(workCategories, {
      id: "custom-category-new-allowance",
      name: "New allowance",
      group: "Income",
      now: new Date("2026-06-15T01:00:00.000Z"),
    });
    const financialCategories = createCustomCategory(incomeCategories, {
      id: "custom-category-family-transfer",
      name: "Family transfer",
      group: "Financial",
      type: "TRANSFER",
      now: new Date("2026-06-15T02:00:00.000Z"),
    });

    expect(workCategories[0]).toMatchObject({ name: "Work parking", type: "EXPENSE", group: "Work and tax", isArchived: false });
    expect(incomeCategories.find((category) => category.id === "custom-category-new-allowance")).toMatchObject({ type: "INCOME", group: "Income" });
    expect(financialCategories.find((category) => category.id === "custom-category-family-transfer")).toMatchObject({ type: "TRANSFER", group: "Financial" });
  });

  it("places saved categories in normal selector sections without a separate custom group", () => {
    const sections = getCategoryCatalogueSections(createWorkCategory());
    const workSection = sections.find((section) => section.label === "Work / tax");

    expect(sections.map((section) => section.label)).toEqual([
      "Everyday",
      "Bills and household",
      "Financial / transfers",
      "Income / refunds",
      "Work / tax",
      "Review",
    ]);
    expect(sections.some((section) => section.label.toLocaleLowerCase("en-AU").includes("custom"))).toBe(false);
    expect(workSection?.categories.some((category) => category.name === "Work parking")).toBe(true);
  });

  it("prevents duplicates across seeded and saved categories", () => {
    const categories = createWorkCategory();
    expect(() => createCustomCategory(categories, { name: "  WORK   PARKING ", group: "Work and tax" })).toThrow("already exists");
    expect(() => createCustomCategory(categories, { name: "groceries", group: "Everyday spending" })).toThrow("already exists");
  });

  it("renames a saved category without moving its group and keeps seeded categories immutable", () => {
    const categories = createWorkCategory();
    const renamed = renameCustomCategory(categories, categories[0].id, "Client site parking", new Date("2026-06-16T00:00:00.000Z"));
    const archived = setCustomCategoryArchived(renamed, renamed[0].id, true);
    const restored = setCustomCategoryArchived(archived, archived[0].id, false);

    expect(renamed[0]).toMatchObject({ name: "Client site parking", group: "Work and tax" });
    expect(archived[0].isArchived).toBe(true);
    expect(restored[0].isArchived).toBe(false);
    expect(() => renameCustomCategory(categories, manualCategories[0].id, "Changed seed")).toThrow("Seeded categories cannot be renamed");
    expect(() => setCustomCategoryArchived(categories, manualCategories[0].id, true)).toThrow("Seeded categories cannot be archived");
  });

  it("hides archived categories from new selections but preserves one already used in transient review", () => {
    const categories = setCustomCategoryArchived(createWorkCategory(), "custom-category-work-parking", true);
    expect(getSelectableCustomCategories(categories)).toEqual([]);
    expect(getSelectableCustomCategories(categories, categories[0].id)).toEqual(categories);
    expect(getCategoryCatalogueSections(categories).find((section) => section.value === "Work and tax")?.categories.some((category) => category.id === categories[0].id)).toBe(false);
    expect(getCategoryCatalogueSections(categories, categories[0].id).find((section) => section.value === "Work and tax")?.categories.some((category) => category.id === categories[0].id)).toBe(true);

    setRuntimeCustomCategories(categories);
    const document = parseCsvDocument("15/06/2026,-12.50,Synthetic parking purchase");
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
