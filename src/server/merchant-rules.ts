import type { Prisma, PrismaClient } from "@prisma/client";
import { getManualCategory, manualCategories, type ManualCategory, type ManualCategoryType } from "@/lib/manual-categories";
import {
  deleteMerchantAlias,
  deleteMerchantRule,
  emptyLocalMerchantData,
  MerchantConflictError,
  renameMerchantAlias,
  renameMerchantProfile,
  saveConfirmedMerchantRule,
  saveMerchantAlias,
  serializeMerchantRuleStorage,
  setMerchantAliasActive,
  setMerchantRuleActive,
  updateMerchantProfile,
  type LocalMerchantData,
  type MerchantConflictResolution,
} from "@/lib/merchant-rules";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import { OwnershipError, requireAuthenticatedUserContext } from "@/src/server/auth/ownership";
import { getPrismaClient } from "@/src/server/db";

type MerchantDb = PrismaClient | Prisma.TransactionClient;

type DbCategoryRecord = {
  id: string;
  name: string;
  type: ManualCategoryType | string;
  parent?: { name: string } | null;
};

type DbMerchantProfileRecord = {
  id: string;
  userId: string;
  name: string;
  normalizedName: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  defaultCategory?: DbCategoryRecord | null;
};

type DbMerchantAliasRecord = {
  id: string;
  userId: string;
  merchantProfileId: string;
  aliasName: string;
  normalizedAlias: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type DbMerchantRuleRecord = {
  id: string;
  userId: string;
  merchantProfileId?: string | null;
  categoryId?: string | null;
  type: string;
  pattern: string;
  normalizedPattern: string;
  priority: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  category?: DbCategoryRecord | null;
};

export type MerchantPersistenceStore = {
  list(userId: string): Promise<LocalMerchantData>;
  categoryAvailable?(userId: string, categoryId: string): Promise<boolean>;
  saveSnapshot(userId: string, data: LocalMerchantData, now?: Date): Promise<LocalMerchantData>;
};

const categoryGroupTypes: Record<string, ManualCategoryType> = {
  Income: "INCOME",
  "Everyday spending": "EXPENSE",
  "Bills and household": "EXPENSE",
  Financial: "EXPENSE",
  "Work and tax": "EXPENSE",
  Review: "EXPENSE",
};

const categoryGroupOrder = ["Income", "Everyday spending", "Bills and household", "Financial", "Work and tax", "Review"];
const supportedRuleTypes = ["EXACT", "CONTAINS", "STARTS_WITH"] as const;

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toLocalCategoryId(category: DbCategoryRecord | null | undefined) {
  if (!category) return "";
  const matching = manualCategories.find((candidate) =>
    candidate.name === category.name &&
    candidate.type === category.type &&
    (!category.parent?.name || candidate.group === category.parent.name),
  );
  return matching?.id ?? category.id;
}

function childSortOrder(category: ManualCategory) {
  const index = manualCategories.filter((candidate) => candidate.group === category.group).findIndex((candidate) => candidate.id === category.id);
  return index >= 0 ? index : 0;
}

async function resolveCategoryId(db: MerchantDb, userId: string, categoryId: string) {
  const owned = await db.category.findFirst({
    where: { id: categoryId, userId, deletedAt: null },
    select: { id: true },
  });
  if (owned) return owned.id;

  const category = getManualCategory(categoryId);
  if (!category) throw new Error("Choose an approved category.");
  const parent = await db.category.upsert({
    where: {
      userId_name_type: {
        userId,
        name: category.group,
        type: categoryGroupTypes[category.group] ?? category.type,
      },
    },
    update: {
      isSeeded: true,
      isArchived: false,
      deletedAt: null,
      sortOrder: Math.max(0, categoryGroupOrder.indexOf(category.group)),
    },
    create: {
      userId,
      name: category.group,
      type: categoryGroupTypes[category.group] ?? category.type,
      isSeeded: true,
      sortOrder: Math.max(0, categoryGroupOrder.indexOf(category.group)),
    },
  });
  const child = await db.category.upsert({
    where: {
      userId_name_type: {
        userId,
        name: category.name,
        type: category.type,
      },
    },
    update: {
      parentId: parent.id,
      isSeeded: true,
      isArchived: false,
      deletedAt: null,
      sortOrder: childSortOrder(category),
    },
    create: {
      userId,
      name: category.name,
      type: category.type,
      parentId: parent.id,
      isSeeded: true,
      sortOrder: childSortOrder(category),
    },
  });
  return child.id;
}

async function loadSnapshot(db: MerchantDb, userId: string): Promise<LocalMerchantData> {
  const [profiles, aliases, rules] = await Promise.all([
    db.merchantProfile.findMany({
      where: { userId, deletedAt: null },
      include: { defaultCategory: { include: { parent: true } } },
      orderBy: { createdAt: "asc" },
    }) as unknown as Promise<DbMerchantProfileRecord[]>,
    db.merchantAlias.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    }) as unknown as Promise<DbMerchantAliasRecord[]>,
    db.merchantRule.findMany({
      where: { userId, deletedAt: null, type: { in: [...supportedRuleTypes] } },
      include: { category: { include: { parent: true } } },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    }) as unknown as Promise<DbMerchantRuleRecord[]>,
  ]);

  const profileData = profiles.flatMap((profile) => {
    const defaultCategoryId = toLocalCategoryId(profile.defaultCategory);
    return defaultCategoryId ? [{
      id: profile.id,
      name: profile.name,
      normalizedName: profile.normalizedName,
      defaultCategoryId,
      isActive: profile.isActive,
      createdAt: toIsoString(profile.createdAt),
      updatedAt: toIsoString(profile.updatedAt),
    }] : [];
  });
  const profileIds = new Set(profileData.map((profile) => profile.id));

  return {
    profiles: profileData,
    aliases: aliases.filter((alias) => profileIds.has(alias.merchantProfileId)).map((alias) => ({
      id: alias.id,
      merchantProfileId: alias.merchantProfileId,
      name: alias.aliasName,
      normalizedAlias: alias.normalizedAlias,
      isActive: alias.isActive,
      createdAt: toIsoString(alias.createdAt),
      updatedAt: toIsoString(alias.updatedAt),
    })),
    rules: rules.flatMap((rule) => {
      const categoryId = toLocalCategoryId(rule.category);
      if (!rule.merchantProfileId || !profileIds.has(rule.merchantProfileId) || !categoryId) return [];
      return [{
        id: rule.id,
        merchantProfileId: rule.merchantProfileId,
        categoryId,
        type: rule.type as "EXACT" | "CONTAINS" | "STARTS_WITH",
        normalizedPattern: rule.normalizedPattern,
        priority: rule.priority,
        isActive: rule.isActive,
        createdAt: toIsoString(rule.createdAt),
        updatedAt: toIsoString(rule.updatedAt),
      }];
    }),
  };
}

export function createPrismaMerchantStore(prisma: PrismaClient = getPrismaClient()): MerchantPersistenceStore {
  return {
    list(userId) {
      return loadSnapshot(prisma, userId);
    },
    async categoryAvailable(userId, categoryId) {
      if (getManualCategory(categoryId)) return true;
      return Boolean(await prisma.category.findFirst({
        where: { id: categoryId, userId, isArchived: false, deletedAt: null },
        select: { id: true },
      }));
    },
    async saveSnapshot(userId, data, now = new Date()) {
      serializeMerchantRuleStorage(data);
      return prisma.$transaction(async (tx) => {
        const profileIdMap = new Map<string, string>();
        const desiredProfileNames: string[] = [];

        for (const profile of data.profiles) {
          const defaultCategoryId = await resolveCategoryId(tx, userId, profile.defaultCategoryId);
          const saved = await tx.merchantProfile.upsert({
            where: { userId_normalizedName: { userId, normalizedName: profile.normalizedName } },
            update: {
              name: profile.name,
              defaultCategoryId,
              isActive: profile.isActive,
              deletedAt: null,
            },
            create: {
              userId,
              name: profile.name,
              normalizedName: profile.normalizedName,
              defaultCategoryId,
              isActive: profile.isActive,
            },
          });
          profileIdMap.set(profile.id, saved.id);
          desiredProfileNames.push(profile.normalizedName);
        }

        const missingProfiles = desiredProfileNames.length === 0
          ? { userId, deletedAt: null }
          : { userId, deletedAt: null, normalizedName: { notIn: desiredProfileNames } };
        await tx.merchantProfile.updateMany({
          where: missingProfiles,
          data: { isActive: false, deletedAt: now },
        });

        const desiredAliasNames: string[] = [];
        for (const alias of data.aliases) {
          const merchantProfileId = profileIdMap.get(alias.merchantProfileId);
          if (!merchantProfileId) throw new Error("Saved alias merchant is unavailable.");
          await tx.merchantAlias.upsert({
            where: { userId_normalizedAlias: { userId, normalizedAlias: alias.normalizedAlias } },
            update: {
              merchantProfileId,
              aliasName: alias.name,
              isActive: alias.isActive,
              deactivatedAt: alias.isActive ? null : now,
              deletedAt: null,
            },
            create: {
              userId,
              merchantProfileId,
              aliasName: alias.name,
              normalizedAlias: alias.normalizedAlias,
              isActive: alias.isActive,
              deactivatedAt: alias.isActive ? null : now,
            },
          });
          desiredAliasNames.push(alias.normalizedAlias);
        }
        const missingAliases = desiredAliasNames.length === 0
          ? { userId, deletedAt: null }
          : { userId, deletedAt: null, normalizedAlias: { notIn: desiredAliasNames } };
        await tx.merchantAlias.updateMany({
          where: missingAliases,
          data: { isActive: false, deactivatedAt: now, deletedAt: now },
        });

        const existingRules = await tx.merchantRule.findMany({
          where: { userId, type: { in: [...supportedRuleTypes] } },
          orderBy: { createdAt: "asc" },
        });
        const keptRuleIds = new Set<string>();
        for (const rule of data.rules) {
          const merchantProfileId = profileIdMap.get(rule.merchantProfileId);
          if (!merchantProfileId) throw new Error("Saved rule merchant is unavailable.");
          const categoryId = await resolveCategoryId(tx, userId, rule.categoryId);
          const existing = existingRules.find((candidate) =>
            !keptRuleIds.has(candidate.id) &&
            candidate.type === rule.type &&
            candidate.normalizedPattern === rule.normalizedPattern,
          );
          const saved = existing
            ? await tx.merchantRule.update({
                where: { id: existing.id },
                data: {
                  merchantProfileId,
                  categoryId,
                  pattern: rule.normalizedPattern,
                  normalizedPattern: rule.normalizedPattern,
                  priority: rule.priority,
                  isActive: rule.isActive,
                  deactivatedAt: rule.isActive ? null : now,
                  deletedAt: null,
                },
              })
            : await tx.merchantRule.create({
                data: {
                  userId,
                  merchantProfileId,
                  categoryId,
                  type: rule.type,
                  pattern: rule.normalizedPattern,
                  normalizedPattern: rule.normalizedPattern,
                  priority: rule.priority,
                  isActive: rule.isActive,
                  deactivatedAt: rule.isActive ? null : now,
                },
              });
          keptRuleIds.add(saved.id);
        }

        const rulesToDelete = existingRules.filter((rule) => !keptRuleIds.has(rule.id)).map((rule) => rule.id);
        if (rulesToDelete.length > 0) {
          await tx.merchantRule.updateMany({
            where: { userId, id: { in: rulesToDelete } },
            data: { isActive: false, deactivatedAt: now, deletedAt: now },
          });
        }

        return loadSnapshot(tx, userId);
      });
    },
  };
}

function requireProfile(data: LocalMerchantData, profileId: string) {
  if (!data.profiles.some((profile) => profile.id === profileId)) throw new OwnershipError("merchant profile");
}

function requireAlias(data: LocalMerchantData, aliasId: string) {
  if (!data.aliases.some((alias) => alias.id === aliasId)) throw new OwnershipError("merchant alias");
}

function requireRule(data: LocalMerchantData, ruleId: string) {
  if (!data.rules.some((rule) => rule.id === ruleId)) throw new OwnershipError("merchant rule");
}

async function ownedSnapshot(
  context: AuthenticatedUserContext | null | undefined,
  store: MerchantPersistenceStore,
) {
  const user = requireAuthenticatedUserContext(context);
  return { user, data: await store.list(user.userId) };
}

export async function listDurableMerchantData(
  context: AuthenticatedUserContext | null | undefined,
  store: MerchantPersistenceStore = createPrismaMerchantStore(),
) {
  return (await ownedSnapshot(context, store)).data;
}

export async function saveDurableMerchantRule(
  context: AuthenticatedUserContext | null | undefined,
  input: { merchantName: string; categoryId: string; resolution?: MerchantConflictResolution },
  store: MerchantPersistenceStore = createPrismaMerchantStore(),
) {
  const { user, data } = await ownedSnapshot(context, store);
  const next = saveConfirmedMerchantRule(data, input);
  return next === data ? data : store.saveSnapshot(user.userId, next);
}

export async function saveDurableMerchantAlias(
  context: AuthenticatedUserContext | null | undefined,
  input: { alias: string; canonicalName: string; categoryId: string; resolution?: MerchantConflictResolution },
  store: MerchantPersistenceStore = createPrismaMerchantStore(),
) {
  const { user, data } = await ownedSnapshot(context, store);
  const next = saveMerchantAlias(data, input);
  return next === data ? data : store.saveSnapshot(user.userId, next);
}

export async function updateDurableMerchantProfile(
  context: AuthenticatedUserContext | null | undefined,
  profileId: string,
  input: { name?: string; categoryId?: string; isActive?: boolean },
  store: MerchantPersistenceStore = createPrismaMerchantStore(),
) {
  const { user, data } = await ownedSnapshot(context, store);
  requireProfile(data, profileId);
  if (input.categoryId !== undefined && store.categoryAvailable && !await store.categoryAvailable(user.userId, input.categoryId)) {
    throw new OwnershipError("available category");
  }
  return store.saveSnapshot(user.userId, updateMerchantProfile(data, profileId, input));
}

export async function renameDurableMerchantProfile(
  context: AuthenticatedUserContext | null | undefined,
  profileId: string,
  name: string,
  store: MerchantPersistenceStore = createPrismaMerchantStore(),
) {
  return updateDurableMerchantProfile(context, profileId, { name }, store);
}

export async function updateDurableMerchantAlias(
  context: AuthenticatedUserContext | null | undefined,
  aliasId: string,
  input: { name?: string; isActive?: boolean; resolution?: MerchantConflictResolution },
  store: MerchantPersistenceStore = createPrismaMerchantStore(),
) {
  const { user, data } = await ownedSnapshot(context, store);
  requireAlias(data, aliasId);
  let next = data;
  if (input.name !== undefined) next = renameMerchantAlias(next, aliasId, input.name, input.resolution);
  if (input.isActive !== undefined) next = setMerchantAliasActive(next, aliasId, input.isActive);
  if (input.name === undefined && input.isActive === undefined) throw new Error("Choose an alias change before saving.");
  return next === data ? data : store.saveSnapshot(user.userId, next);
}

export async function deleteDurableMerchantAlias(
  context: AuthenticatedUserContext | null | undefined,
  aliasId: string,
  store: MerchantPersistenceStore = createPrismaMerchantStore(),
) {
  const { user, data } = await ownedSnapshot(context, store);
  requireAlias(data, aliasId);
  return store.saveSnapshot(user.userId, deleteMerchantAlias(data, aliasId));
}

export async function updateDurableMerchantRule(
  context: AuthenticatedUserContext | null | undefined,
  ruleId: string,
  input: { isActive?: boolean },
  store: MerchantPersistenceStore = createPrismaMerchantStore(),
) {
  const { user, data } = await ownedSnapshot(context, store);
  requireRule(data, ruleId);
  if (input.isActive === undefined) throw new Error("Choose a rule change before saving.");
  return store.saveSnapshot(user.userId, setMerchantRuleActive(data, ruleId, input.isActive));
}

export async function deleteDurableMerchantRule(
  context: AuthenticatedUserContext | null | undefined,
  ruleId: string,
  store: MerchantPersistenceStore = createPrismaMerchantStore(),
) {
  const { user, data } = await ownedSnapshot(context, store);
  requireRule(data, ruleId);
  return store.saveSnapshot(user.userId, deleteMerchantRule(data, ruleId));
}

export async function clearDurableMerchantData(
  context: AuthenticatedUserContext | null | undefined,
  store: MerchantPersistenceStore = createPrismaMerchantStore(),
) {
  const user = requireAuthenticatedUserContext(context);
  return store.saveSnapshot(user.userId, emptyLocalMerchantData());
}

export async function migrateDurableMerchantData(
  context: AuthenticatedUserContext | null | undefined,
  localData: LocalMerchantData,
  store: MerchantPersistenceStore = createPrismaMerchantStore(),
) {
  const { user, data: accountData } = await ownedSnapshot(context, store);
  serializeMerchantRuleStorage(localData);
  const merged: LocalMerchantData = {
    profiles: [...accountData.profiles],
    aliases: [...accountData.aliases],
    rules: [...accountData.rules],
  };
  const profileMap = new Map<string, string>();
  let importedCount = 0;
  let skippedCount = 0;

  for (const profile of localData.profiles) {
    const existing = merged.profiles.find((candidate) => candidate.normalizedName === profile.normalizedName);
    if (existing) {
      profileMap.set(profile.id, existing.id);
      skippedCount += 1;
    } else {
      merged.profiles.push(profile);
      profileMap.set(profile.id, profile.id);
      importedCount += 1;
    }
  }
  for (const alias of localData.aliases) {
    const mappedProfileId = profileMap.get(alias.merchantProfileId);
    const conflicts = merged.aliases.some((candidate) => candidate.normalizedAlias === alias.normalizedAlias) ||
      merged.profiles.some((profile) => profile.normalizedName === alias.normalizedAlias && profile.id !== mappedProfileId);
    if (!mappedProfileId || conflicts) {
      skippedCount += 1;
    } else {
      merged.aliases.push({ ...alias, merchantProfileId: mappedProfileId });
      importedCount += 1;
    }
  }
  for (const rule of localData.rules) {
    const mappedProfileId = profileMap.get(rule.merchantProfileId);
    const exists = merged.rules.some((candidate) =>
      candidate.type === rule.type && candidate.normalizedPattern === rule.normalizedPattern,
    );
    if (!mappedProfileId || exists) {
      skippedCount += 1;
    } else {
      merged.rules.push({ ...rule, merchantProfileId: mappedProfileId });
      importedCount += 1;
    }
  }

  const data = importedCount > 0 ? await store.saveSnapshot(user.userId, merged) : accountData;
  return { data, importedCount, skippedCount };
}

export { MerchantConflictError };
