import { z } from "zod";
import {
  manualCategories,
  type ManualCategory,
  type ManualCategoryType,
} from "@/lib/manual-categories";
import { assertNoPrivateBankIdentifiers } from "@/lib/validation/privacy";

export const CUSTOM_CATEGORY_STORAGE_KEY = "spendgrove.phase2.custom-categories.v1";
export const CUSTOM_CATEGORY_STORAGE_VERSION = 1 as const;
export const CUSTOM_CATEGORY_LIMIT = 100;

export type CustomCategory = ManualCategory & {
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomCategoryStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type CustomCategoryStorageResult = {
  categories: CustomCategory[];
  recoveredFromCorruption: boolean;
  migrated: boolean;
  unsupportedVersion: boolean;
};

const categoryTypeSchema = z.enum(["INCOME", "EXPENSE", "TRANSFER"]);
const customCategoryIdSchema = z.string().regex(/^custom-category-[a-z0-9-]+$/i);

const safeCategoryNameSchema = z.string()
  .trim()
  .min(2, "Enter a category name.")
  .max(60, "Category names must be 60 characters or fewer.")
  .superRefine((value, context) => {
    try {
      assertNoPrivateBankIdentifiers(value, "category name");
    } catch (error) {
      context.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Category names cannot contain private banking details.",
      });
    }
  })
  .transform((value) => value.normalize("NFKC").replace(/\s+/g, " ").trim());

const customCategorySchema = z.object({
  id: customCategoryIdSchema,
  name: safeCategoryNameSchema,
  type: categoryTypeSchema,
  group: z.enum(["Custom income", "Custom expenses", "Custom transfers"]),
  isArchived: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict().superRefine((category, context) => {
  if (category.group !== groupForCategoryType(category.type)) {
    context.addIssue({
      code: "custom",
      path: ["group"],
      message: "Custom category group must match its category type.",
    });
  }
});

const customCategoryStorageSchema = z.object({
  version: z.literal(CUSTOM_CATEGORY_STORAGE_VERSION),
  categories: z.array(customCategorySchema).max(CUSTOM_CATEGORY_LIMIT),
}).strict().superRefine((storage, context) => {
  const ids = new Set<string>();
  const names = new Set<string>();
  storage.categories.forEach((category, index) => {
    const normalizedName = normalizeCategoryName(category.name);
    if (ids.has(category.id)) {
      context.addIssue({ code: "custom", path: ["categories", index, "id"], message: "Custom category IDs must be unique." });
    }
    if (names.has(normalizedName)) {
      context.addIssue({ code: "custom", path: ["categories", index, "name"], message: "Custom category names must be unique." });
    }
    ids.add(category.id);
    names.add(normalizedName);
  });
});

const legacyCustomCategoryStorageSchema = z.object({
  version: z.literal(0),
  categories: z.array(z.object({
    id: customCategoryIdSchema,
    name: safeCategoryNameSchema,
    type: categoryTypeSchema,
    archived: z.boolean().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }).strict()).max(CUSTOM_CATEGORY_LIMIT),
}).strict();

function createLocalId() {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return `custom-category-${globalThis.crypto.randomUUID()}`;
  }
  return `custom-category-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sortedCategories(categories: CustomCategory[]) {
  return [...categories].sort((left, right) => left.name.localeCompare(right.name, "en-AU", { sensitivity: "base" }));
}

function assertUniqueCategoryName(
  name: string,
  categories: CustomCategory[],
  excludedCategoryId?: string,
) {
  const normalizedName = normalizeCategoryName(name);
  const duplicateSeeded = manualCategories.some((category) => normalizeCategoryName(category.name) === normalizedName);
  const duplicateCustom = categories.some((category) =>
    category.id !== excludedCategoryId && normalizeCategoryName(category.name) === normalizedName,
  );
  if (duplicateSeeded || duplicateCustom) {
    throw new Error("A category with this name already exists.");
  }
}

export function normalizeCategoryName(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-AU");
}

export function groupForCategoryType(type: ManualCategoryType) {
  if (type === "INCOME") return "Custom income" as const;
  if (type === "TRANSFER") return "Custom transfers" as const;
  return "Custom expenses" as const;
}

export function isCustomCategoryId(categoryId: string) {
  return customCategoryIdSchema.safeParse(categoryId).success;
}

export function getCustomCategory(categories: CustomCategory[], categoryId: string) {
  return categories.find((category) => category.id === categoryId);
}

export function getReviewCategory(
  categories: CustomCategory[],
  categoryId: string,
) {
  return manualCategories.find((category) => category.id === categoryId) ?? getCustomCategory(categories, categoryId);
}

export function inferCustomCategoryType(input: {
  amountCents: number | null;
  merchantName: string;
  currentCategoryType?: ManualCategoryType;
}): ManualCategoryType | null {
  const merchant = input.merchantName.normalize("NFKC").toLocaleLowerCase("en-AU");
  const transferStyle = input.currentCategoryType === "TRANSFER" ||
    /\b(?:transfer|account movement|osko|credit card payment|savings transfer)\b/i.test(merchant);
  if (transferStyle) return null;
  if (input.amountCents === null || input.amountCents === 0) return null;
  return input.amountCents > 0 ? "INCOME" : "EXPENSE";
}

export function createCustomCategory(
  categories: CustomCategory[],
  input: { name: string; type: ManualCategoryType; id?: string; now?: Date },
) {
  const name = safeCategoryNameSchema.parse(input.name);
  assertUniqueCategoryName(name, categories);
  const timestamp = (input.now ?? new Date()).toISOString();
  const category = customCategorySchema.parse({
    id: input.id ?? createLocalId(),
    name,
    type: input.type,
    group: groupForCategoryType(input.type),
    isArchived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return sortedCategories([...categories, category]).slice(0, CUSTOM_CATEGORY_LIMIT);
}

export function renameCustomCategory(
  categories: CustomCategory[],
  categoryId: string,
  name: string,
  now = new Date(),
) {
  if (!isCustomCategoryId(categoryId)) throw new Error("Seeded categories cannot be renamed.");
  if (!categories.some((category) => category.id === categoryId)) throw new Error("Custom category not found.");
  const safeName = safeCategoryNameSchema.parse(name);
  assertUniqueCategoryName(safeName, categories, categoryId);
  return sortedCategories(categories.map((category) => category.id === categoryId
    ? customCategorySchema.parse({ ...category, name: safeName, updatedAt: now.toISOString() })
    : category));
}

export function setCustomCategoryArchived(
  categories: CustomCategory[],
  categoryId: string,
  isArchived: boolean,
  now = new Date(),
) {
  if (!isCustomCategoryId(categoryId)) throw new Error("Seeded categories cannot be archived.");
  if (!categories.some((category) => category.id === categoryId)) throw new Error("Custom category not found.");
  return sortedCategories(categories.map((category) => category.id === categoryId
    ? customCategorySchema.parse({ ...category, isArchived, updatedAt: now.toISOString() })
    : category));
}

export function getSelectableCustomCategories(
  categories: CustomCategory[],
  selectedCategoryId?: string,
) {
  return categories.filter((category) => !category.isArchived || category.id === selectedCategoryId);
}

export function parseCustomCategoryStorage(rawValue: string | null): CustomCategoryStorageResult {
  if (!rawValue) {
    return { categories: [], recoveredFromCorruption: false, migrated: false, unsupportedVersion: false };
  }
  try {
    const json: unknown = JSON.parse(rawValue);
    const current = customCategoryStorageSchema.safeParse(json);
    if (current.success) {
      return {
        categories: sortedCategories(current.data.categories),
        recoveredFromCorruption: false,
        migrated: false,
        unsupportedVersion: false,
      };
    }

    const legacy = legacyCustomCategoryStorageSchema.safeParse(json);
    if (legacy.success) {
      return {
        categories: sortedCategories(legacy.data.categories.map((category) => customCategorySchema.parse({
          ...category,
          group: groupForCategoryType(category.type),
          isArchived: category.archived ?? false,
        }))),
        recoveredFromCorruption: false,
        migrated: true,
        unsupportedVersion: false,
      };
    }

    const version = typeof json === "object" && json !== null && "version" in json
      ? (json as { version?: unknown }).version
      : undefined;
    return {
      categories: [],
      recoveredFromCorruption: version === undefined || version === CUSTOM_CATEGORY_STORAGE_VERSION,
      migrated: false,
      unsupportedVersion: typeof version === "number" && version > CUSTOM_CATEGORY_STORAGE_VERSION,
    };
  } catch {
    return { categories: [], recoveredFromCorruption: true, migrated: false, unsupportedVersion: false };
  }
}

export function serializeCustomCategoryStorage(categories: CustomCategory[]) {
  return JSON.stringify(customCategoryStorageSchema.parse({
    version: CUSTOM_CATEGORY_STORAGE_VERSION,
    categories: sortedCategories(categories),
  }));
}

export function loadCustomCategoriesFromStorage(storage: CustomCategoryStorage) {
  try {
    return {
      ...parseCustomCategoryStorage(storage.getItem(CUSTOM_CATEGORY_STORAGE_KEY)),
      storageAvailable: true,
    };
  } catch {
    return {
      categories: [],
      recoveredFromCorruption: false,
      migrated: false,
      unsupportedVersion: false,
      storageAvailable: false,
    };
  }
}

export function saveCustomCategoriesToStorage(
  storage: CustomCategoryStorage,
  categories: CustomCategory[],
) {
  try {
    storage.setItem(CUSTOM_CATEGORY_STORAGE_KEY, serializeCustomCategoryStorage(categories));
    return true;
  } catch {
    return false;
  }
}

export function resetCustomCategoriesInStorage(storage: CustomCategoryStorage) {
  try {
    storage.removeItem(CUSTOM_CATEGORY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
