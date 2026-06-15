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

function createMemoryStorage(initialValue: string | null = null): CustomCategoryStorage & { value: string | null } {
  return {
    value: initialValue,
    getItem() {
      return this.value;
    },
    setItem(_key, value) {
      this.value = value;
    },
    removeItem() {
      this.value = null;
    },
  };
}

function createSafeCategories() {
  return createCustomCategory([], {
    id: "custom-category-weekend-markets",
    name: "Weekend markets",
    type: "EXPENSE",
    now: new Date("2026-06-15T00:00:00.000Z"),
  });
}

describe("custom category privacy and browser storage", () => {
  it("serializes safe category metadata only and rejects private banking identifiers", () => {
    const serialized = serializeCustomCategoryStorage(createSafeCategories());
    const parsed = JSON.parse(serialized) as Record<string, unknown>;

    expect(parsed).toEqual({
      version: 1,
      categories: [{
        id: "custom-category-weekend-markets",
        name: "Weekend markets",
        type: "EXPENSE",
        group: "Custom expenses",
        isArchived: false,
        createdAt: "2026-06-15T00:00:00.000Z",
        updatedAt: "2026-06-15T00:00:00.000Z",
      }],
    });
    expect(serialized).not.toContain("rawRow");
    expect(serialized).not.toContain("fileName");
    expect(serialized).not.toContain("amountCents");
    expect(() => createCustomCategory([], { name: "BSB 000-000", type: "EXPENSE" })).toThrow("private bank identifier");
    expect(() => createCustomCategory([], { name: "Account 12345678", type: "EXPENSE" })).toThrow("private bank identifier");
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

  it("migrates safe legacy categories without retaining obsolete fields", () => {
    const result = parseCustomCategoryStorage(JSON.stringify({
      version: 0,
      categories: [{
        id: "custom-category-weekend-markets",
        name: "Weekend markets",
        type: "EXPENSE",
        archived: true,
        createdAt: "2026-06-15T00:00:00.000Z",
        updatedAt: "2026-06-15T00:00:00.000Z",
      }],
    }));

    expect(result).toMatchObject({ migrated: true, recoveredFromCorruption: false, unsupportedVersion: false });
    expect(result.categories[0]).toEqual({
      id: "custom-category-weekend-markets",
      name: "Weekend markets",
      type: "EXPENSE",
      group: "Custom expenses",
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
    expect(storage.value).toContain("Weekend markets");
    expect(loadCustomCategoriesFromStorage(storage)).toMatchObject({
      storageAvailable: true,
      categories: [{ name: "Weekend markets" }],
    });
    expect(resetCustomCategoriesInStorage(storage)).toBe(true);
    expect(storage.value).toBeNull();
    expect(storage.getItem(CUSTOM_CATEGORY_STORAGE_KEY)).toBeNull();
  });
});
