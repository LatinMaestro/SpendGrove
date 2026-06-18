import type { PrismaClient } from "@prisma/client";
import {
  CUSTOM_CATEGORY_GROUPS,
  createCustomCategory,
  normalizeCategoryName,
  type CustomCategory,
  type CustomCategoryGroup,
} from "@/lib/custom-categories";
import type { ManualCategoryType } from "@/lib/manual-categories";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { assertUserOwnsRecord, requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

export type DbCustomCategoryRecord = {
  id: string;
  userId: string;
  name: string;
  type: ManualCategoryType | string;
  isSeeded: boolean;
  isArchived: boolean;
  deletedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  parent?: {
    name: string;
  } | null;
};

export type DurableCustomCategoryInput = {
  id?: string;
  name: string;
  group: CustomCategoryGroup;
  type?: ManualCategoryType;
  isArchived?: boolean;
};

export type CustomCategoryPersistenceStore = {
  listCustom(userId: string): Promise<DbCustomCategoryRecord[]>;
  listOwnedNames(userId: string): Promise<Array<{ id: string; name: string }>>;
  findCustomById(userId: string, categoryId: string): Promise<DbCustomCategoryRecord | null>;
  ensureGroup(userId: string, group: CustomCategoryGroup): Promise<string>;
  create(userId: string, input: Required<Pick<DurableCustomCategoryInput, "id" | "name" | "group" | "type">> & { isArchived: boolean; parentId: string }): Promise<DbCustomCategoryRecord>;
  update(userId: string, categoryId: string, input: { name?: string; isArchived?: boolean }): Promise<DbCustomCategoryRecord>;
};

const categoryGroupTypes: Record<CustomCategoryGroup, ManualCategoryType> = {
  Income: "INCOME",
  "Everyday spending": "EXPENSE",
  "Bills and household": "EXPENSE",
  Financial: "EXPENSE",
  "Work and tax": "EXPENSE",
  Review: "EXPENSE",
};

const categoryGroupOrder = CUSTOM_CATEGORY_GROUPS.map((group) => group.value);
const reservedGroupNames = new Set(CUSTOM_CATEGORY_GROUPS.flatMap((group) => [
  normalizeCategoryName(group.value),
  normalizeCategoryName(group.label),
]));

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function fallbackGroup(type: ManualCategoryType): CustomCategoryGroup {
  if (type === "INCOME") return "Income";
  if (type === "TRANSFER") return "Financial";
  return "Everyday spending";
}

function recordGroup(record: DbCustomCategoryRecord): CustomCategoryGroup {
  const parentName = record.parent?.name;
  const knownGroup = CUSTOM_CATEGORY_GROUPS.find((group) => group.value === parentName);
  return knownGroup?.value ?? fallbackGroup(record.type as ManualCategoryType);
}

function toCustomCategory(record: DbCustomCategoryRecord): CustomCategory {
  return {
    id: record.id,
    name: record.name,
    type: record.type as ManualCategoryType,
    group: recordGroup(record),
    isArchived: record.isArchived,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

function validateInput(input: DurableCustomCategoryInput) {
  const category = createCustomCategory([], {
    id: input.id,
    name: input.name,
    group: input.group,
    type: input.type,
  })[0];

  if (reservedGroupNames.has(normalizeCategoryName(category.name))) {
    throw new Error("Choose a category name that is different from the category group names.");
  }

  return category;
}

function assertNameAvailable(name: string, existing: Array<{ id: string; name: string }>, excludedId?: string) {
  const normalized = normalizeCategoryName(name);
  if (existing.some((category) => category.id !== excludedId && normalizeCategoryName(category.name) === normalized)) {
    throw new Error("A category with this name already exists.");
  }
}

export function createPrismaCustomCategoryStore(prisma: PrismaClient = getPrismaClient()): CustomCategoryPersistenceStore {
  return {
    async listCustom(userId) {
      return prisma.category.findMany({
        where: {
          userId,
          isSeeded: false,
          deletedAt: null,
        },
        include: {
          parent: true,
        },
        orderBy: {
          name: "asc",
        },
      }) as unknown as Promise<DbCustomCategoryRecord[]>;
    },
    async listOwnedNames(userId) {
      return prisma.category.findMany({
        where: {
          userId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
        },
      });
    },
    async findCustomById(userId, categoryId) {
      return prisma.category.findFirst({
        where: {
          id: categoryId,
          userId,
          isSeeded: false,
          deletedAt: null,
        },
        include: {
          parent: true,
        },
      }) as unknown as Promise<DbCustomCategoryRecord | null>;
    },
    async ensureGroup(userId, group) {
      const parent = await prisma.category.upsert({
        where: {
          userId_name_type: {
            userId,
            name: group,
            type: categoryGroupTypes[group],
          },
        },
        update: {
          isSeeded: true,
          isArchived: false,
          deletedAt: null,
          sortOrder: categoryGroupOrder.indexOf(group),
        },
        create: {
          userId,
          name: group,
          type: categoryGroupTypes[group],
          isSeeded: true,
          sortOrder: categoryGroupOrder.indexOf(group),
        },
      });
      return parent.id;
    },
    async create(userId, input) {
      return prisma.category.create({
        data: {
          id: input.id,
          userId,
          name: input.name,
          type: input.type,
          parentId: input.parentId,
          isSeeded: false,
          isArchived: input.isArchived,
          sortOrder: 1000,
        },
        include: {
          parent: true,
        },
      }) as unknown as Promise<DbCustomCategoryRecord>;
    },
    async update(_userId, categoryId, input) {
      return prisma.category.update({
        where: {
          id: categoryId,
        },
        data: input,
        include: {
          parent: true,
        },
      }) as unknown as Promise<DbCustomCategoryRecord>;
    },
  };
}

export async function listDurableCustomCategories(
  context: AuthenticatedUserContext | null | undefined,
  store: CustomCategoryPersistenceStore = createPrismaCustomCategoryStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  const records = await store.listCustom(user.userId);
  return records.map(toCustomCategory);
}

export async function createDurableCustomCategory(
  context: AuthenticatedUserContext | null | undefined,
  input: DurableCustomCategoryInput,
  store: CustomCategoryPersistenceStore = createPrismaCustomCategoryStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  const category = validateInput(input);
  const existing = await store.listOwnedNames(user.userId);
  assertNameAvailable(category.name, existing);
  const parentId = await store.ensureGroup(user.userId, category.group);
  const record = await store.create(user.userId, {
    id: category.id,
    name: category.name,
    group: category.group,
    type: category.type,
    isArchived: input.isArchived ?? false,
    parentId,
  });
  assertUserOwnsRecord(user, record, "category");
  return toCustomCategory(record);
}

export async function updateDurableCustomCategory(
  context: AuthenticatedUserContext | null | undefined,
  categoryId: string,
  input: { name?: string; isArchived?: boolean },
  store: CustomCategoryPersistenceStore = createPrismaCustomCategoryStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  const existing = await store.findCustomById(user.userId, categoryId);
  assertUserOwnsRecord(user, existing, "category");

  const update: { name?: string; isArchived?: boolean } = {};
  if (input.name !== undefined) {
    const validated = validateInput({
      id: existing.id,
      name: input.name,
      group: recordGroup(existing),
      type: existing.type as ManualCategoryType,
    });
    const names = await store.listOwnedNames(user.userId);
    assertNameAvailable(validated.name, names, existing.id);
    update.name = validated.name;
  }
  if (input.isArchived !== undefined) update.isArchived = input.isArchived;
  if (Object.keys(update).length === 0) throw new Error("Choose a category change before saving.");

  const record = await store.update(user.userId, categoryId, update);
  assertUserOwnsRecord(user, record, "category");
  return toCustomCategory(record);
}

export async function migrateDurableCustomCategories(
  context: AuthenticatedUserContext | null | undefined,
  localCategories: DurableCustomCategoryInput[],
  store: CustomCategoryPersistenceStore = createPrismaCustomCategoryStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  const validated: CustomCategory[] = [];

  for (const input of localCategories) {
    const next = createCustomCategory(validated, {
      id: input.id,
      name: input.name,
      group: input.group,
      type: input.type,
    });
    validated.splice(0, validated.length, ...next);
  }

  const existing = await store.listOwnedNames(user.userId);
  const existingIds = new Set(existing.map((category) => category.id));
  const existingNames = new Set(existing.map((category) => normalizeCategoryName(category.name)));
  let importedCount = 0;
  let skippedCount = 0;

  for (const category of validated) {
    if (existingIds.has(category.id) || existingNames.has(normalizeCategoryName(category.name))) {
      skippedCount += 1;
      continue;
    }
    if (reservedGroupNames.has(normalizeCategoryName(category.name))) {
      throw new Error("Choose category names that are different from the category group names.");
    }
    const parentId = await store.ensureGroup(user.userId, category.group);
    const record = await store.create(user.userId, {
      id: category.id,
      name: category.name,
      group: category.group,
      type: category.type,
      isArchived: localCategories.find((local) => local.id === category.id)?.isArchived ?? false,
      parentId,
    });
    assertUserOwnsRecord(user, record, "category");
    existingIds.add(category.id);
    existingNames.add(normalizeCategoryName(category.name));
    importedCount += 1;
  }

  return {
    categories: (await store.listCustom(user.userId)).map(toCustomCategory),
    importedCount,
    skippedCount,
  };
}
