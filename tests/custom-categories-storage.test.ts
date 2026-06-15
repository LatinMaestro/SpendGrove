import { describe, expect, it } from "vitest";
import {
  CUSTOM_CATEGORY_STORAGE_KEY,
  createCustomCategory,
  loadCustomCategoriesFromStorage,
  parseCustomCategoryStorage,
  resetCustomCategoriesInStorage,
  saveCustomCategoriesToStorage,
  serializeCustomCategoryStorage,
  type CustomCategoryStorage,
} from "@/lib/custom-categories";

function createMemoryStorage(initialValue: string | null = null): CustomCategoryStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  if (initialValue !== null) values.set(CUSTOM_CATEGORY_STORAGE_KEY, initialValue);
  return {
    values,
    getItem(key) {
      return this.values.get(key) ?? null;
    },
    setItem(key, value) {
      this.values.set(key, value);
    },
    removeItem(key) {
      this.values.delete(key);
    },
  };
}

function createSafeCategories() {
  return createCustomCategory([], {
    id: "custom-category-work-parking",
    name: "Work parking",
    group: "Work and tax",
    now: new Date("2026-06-15T00:00:00.000Z"),
  });
}

describe("custom category privacy and browser storage", () => {
  it("serializes safe category metadata only and rejects private banking identifiers", () => {
    const serialized = serializeCustomCategoryStorage(createSafeCategories());
    const parsed = JSON.parse(serialized) as Record<string, unknown>;

    expect(parsed).toEqual({
      version: 2,
      categories: [{
        id: "custom-category-work-parking",
        name: "Work parking",
        type: "EXPENSE",
        group: "Work and tax",
        isArchived: false,
        createdAt: "2026-06-15T00:00:00.000Z",
        updatedAt: "2026-06-15T00:00:00.000Z",
      }],
    });
    expect(serialized).not.toContain("rawRow");
    expect(serialized).not.toContain("fileName");
    expect(serialized).not.toContain("amountCents");
    expect(() => createCustomCategory([], { name: "BSB 000-000", group: "Everyday spending" })).toThrow("private bank identifier");
    expect(() => createCustomCategory([], { name: "Account 12345678", group: "Financial" })).toThrow("private bank identifier");
  });

  it("recovers safely from corrupted or unsupported browser data", () => {
    expect(parseCustomCategoryStorage("not-json")).toMatchObject({
      categories: [],
      recoveredFromCorruption: true,
      migrated: false,
      unsupportedVersion: false,
    });
    expect(parseCustomCategoryStorage(JSON.stringify({ version: 99, categories: [] }))).toMatchObject({
      categories: [],
      recoveredFromCorruption: false,
      migrated: false,
      unsupportedVersion: true,
    });
  });

  it("migrates the earlier custom-group format into normal category groups", () => {
    const result = parseCustomCategoryStorage(JSON.stringify({
      version: 1,
      categories: [{
        id: "custom-category-weekend-markets",
        name: "Weekend markets",
        type: "EXPENSE",
        group: "Custom expenses",
        isArchived: true,
        createdAt: "2026-06-15T00:00:00.000Z",
        updatedAt: "2026-06-15T00:00:00.000Z",
      }],
    }));

    expect(result).toMatchObject({ migrated: true, recoveredFromCorruption: false, unsupportedVersion: false });
    expect(result.categories[0]).toEqual({
      id: "custom-category-weekend-markets",
      name: "Weekend markets",
      type: "EXPENSE",
      group: "Everyday spending",
      isArchived: true,
      createdAt: "2026-06-15T00:00:00.000Z",
      updatedAt: "2026-06-15T00:00:00.000Z",
    });
  });

  it("migrates safe legacy categories without retaining obsolete fields", () => {
    const result = parseCustomCategoryStorage(JSON.stringify({
      version: 0,
      categories: [{
        id: "custom-category-family-transfer",
        name: "Family transfer",
        type: "TRANSFER",
        archived: true,
        createdAt: "2026-06-15T00:00:00.000Z",
        updatedAt: "2026-06-15T00:00:00.000Z",
      }],
    }));

    expect(result).toMatchObject({ migrated: true, recoveredFromCorruption: false, unsupportedVersion: false });
    expect(result.categories[0]).toEqual({
      id: "custom-category-family-transfer",
      name: "Family transfer",
      type: "TRANSFER",
      group: "Financial",
      isArchived: true,
      createdAt: "2026-06-15T00:00:00.000Z",
      updatedAt: "2026-06-15T00:00:00.000Z",
    });
    expect(result.categories[0]).not.toHaveProperty("archived");
  });

  it("handles storage read, write and reset failures without blocking the review flow", () => {
    const unavailableStorage: CustomCategoryStorage = {
      getItem() {
        throw new Error("unavailable");
      },
      setItem() {
        throw new Error("unavailable");
      },
      removeItem() {
        throw new Error("unavailable");
      },
    };

    expect(loadCustomCategoriesFromStorage(unavailableStorage)).toMatchObject({
      categories: [],
      storageAvailable: false,
    });
    expect(saveCustomCategoriesToStorage(unavailableStorage, createSafeCategories())).toBe(false);
    expect(resetCustomCategoriesInStorage(unavailableStorage)).toBe(false);
  });

  it("saves and resets the versioned browser-local value", () => {
    const storage = createMemoryStorage();
    expect(saveCustomCategoriesToStorage(storage, createSafeCategories())).toBe(true);
    expect(storage.values.get(CUSTOM_CATEGORY_STORAGE_KEY)).toContain("Work parking");
    expect(loadCustomCategoriesFromStorage(storage)).toMatchObject({
      storageAvailable: true,
      categories: [{ name: "Work parking", group: "Work and tax" }],
    });
    expect(resetCustomCategoriesInStorage(storage)).toBe(true);
    expect(storage.values.has(CUSTOM_CATEGORY_STORAGE_KEY)).toBe(false);
    expect(storage.getItem(CUSTOM_CATEGORY_STORAGE_KEY)).toBeNull();
  });
});
