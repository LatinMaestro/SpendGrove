import { describe, expect, it } from "vitest";
import { manualCategories } from "@/lib/manual-categories";
import { emptyLocalMerchantData, saveMerchantAlias, type LocalMerchantData } from "@/lib/merchant-rules";
import { AuthenticationRequiredError, OwnershipError } from "@/src/server/auth/ownership";
import {
  clearDurableMerchantData,
  deleteDurableMerchantAlias,
  deleteDurableMerchantRule,
  listDurableMerchantData,
  migrateDurableMerchantData,
  renameDurableMerchantProfile,
  saveDurableMerchantAlias,
  saveDurableMerchantRule,
  updateDurableMerchantAlias,
  updateDurableMerchantRule,
  type MerchantPersistenceStore,
} from "@/src/server/merchant-rules";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

function categoryId(name: string) {
  return manualCategories.find((category) => category.name === name)!.id;
}

function cloneData(data: LocalMerchantData): LocalMerchantData {
  return structuredClone(data);
}

function createMemoryStore() {
  const snapshots = new Map<string, LocalMerchantData>();
  let writes = 0;
  const store: MerchantPersistenceStore & { writes(): number } = {
    writes: () => writes,
    async list(userId) {
      return cloneData(snapshots.get(userId) ?? emptyLocalMerchantData());
    },
    async saveSnapshot(userId, data) {
      writes += 1;
      snapshots.set(userId, cloneData(data));
      return cloneData(data);
    },
  };
  return store;
}

const groceries = categoryId("Groceries");
const dining = categoryId("Dining out");

describe("durable merchant aliases and rules", () => {
  it("creates account-owned profiles, aliases and user-confirmed rules", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();

    const ruled = await saveDurableMerchantRule(user, {
      merchantName: "Blue Lantern",
      categoryId: dining,
    }, store);
    expect(ruled).toMatchObject({
      profiles: [expect.objectContaining({ name: "Blue Lantern", defaultCategoryId: dining })],
      rules: [expect.objectContaining({ normalizedPattern: "blue lantern", categoryId: dining, isActive: true })],
    });

    const aliased = await saveDurableMerchantAlias(user, {
      alias: "Blue Cafe",
      canonicalName: "Blue Lantern",
      categoryId: dining,
    }, store);
    expect(aliased.aliases[0]).toMatchObject({ name: "Blue Cafe", normalizedAlias: "blue cafe", isActive: true });
    expect(await listDurableMerchantData(user, store)).toEqual(aliased);
  });

  it("requires explicit conflict choices and preserves keep-existing behavior", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();
    await saveDurableMerchantRule(user, { merchantName: "Blue Lantern", categoryId: dining }, store);

    await expect(saveDurableMerchantRule(user, {
      merchantName: "Blue Lantern",
      categoryId: groceries,
    }, store)).rejects.toMatchObject({ name: "MerchantConflictError" });

    const kept = await saveDurableMerchantRule(user, {
      merchantName: "Blue Lantern",
      categoryId: groceries,
      resolution: "KEEP_EXISTING",
    }, store);
    expect(kept.rules[0].categoryId).toBe(dining);

    const replaced = await saveDurableMerchantRule(user, {
      merchantName: "Blue Lantern",
      categoryId: groceries,
      resolution: "REPLACE",
    }, store);
    expect(replaced.rules[0].categoryId).toBe(groceries);
  });

  it("supports rename, disable, restore and soft-delete style lifecycle snapshots", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();
    let data = await saveDurableMerchantAlias(user, {
      alias: "Lantern Coffee",
      canonicalName: "Blue Lantern",
      categoryId: dining,
    }, store);
    const profileId = data.profiles[0].id;
    const aliasId = data.aliases[0].id;
    const ruleId = data.rules[0].id;

    data = await renameDurableMerchantProfile(user, profileId, "Blue Lantern Cafe", store);
    expect(data.profiles[0].normalizedName).toBe("blue lantern cafe");
    expect(data.rules[0].normalizedPattern).toBe("blue lantern cafe");

    data = await updateDurableMerchantAlias(user, aliasId, { isActive: false }, store);
    expect(data.aliases[0].isActive).toBe(false);
    data = await updateDurableMerchantAlias(user, aliasId, { isActive: true }, store);
    expect(data.aliases[0].isActive).toBe(true);

    data = await updateDurableMerchantRule(user, ruleId, { isActive: false }, store);
    expect(data.rules[0].isActive).toBe(false);
    data = await updateDurableMerchantRule(user, ruleId, { isActive: true }, store);
    expect(data.rules[0].isActive).toBe(true);

    data = await deleteDurableMerchantAlias(user, aliasId, store);
    expect(data.aliases).toEqual([]);
    data = await deleteDurableMerchantRule(user, ruleId, store);
    expect(data.rules).toEqual([]);
  });

  it("blocks cross-user entity access and requires auth before store access", async () => {
    const userOne = createTestUserContext("user_1");
    const userTwo = createTestUserContext("user_2");
    const store = createMemoryStore();
    const data = await saveDurableMerchantAlias(userOne, {
      alias: "Woolies",
      canonicalName: "Woolworths",
      categoryId: groceries,
    }, store);

    await expect(listDurableMerchantData(null, store)).rejects.toThrow(AuthenticationRequiredError);
    await expect(renameDurableMerchantProfile(userTwo, data.profiles[0].id, "Other", store)).rejects.toThrow(OwnershipError);
    await expect(updateDurableMerchantAlias(userTwo, data.aliases[0].id, { isActive: false }, store)).rejects.toThrow(OwnershipError);
    await expect(updateDurableMerchantRule(userTwo, data.rules[0].id, { isActive: false }, store)).rejects.toThrow(OwnershipError);
    expect(await listDurableMerchantData(userTwo, store)).toEqual(emptyLocalMerchantData());
  });

  it("migrates safe browser-local data without overwriting account conflicts", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();
    await saveDurableMerchantRule(user, { merchantName: "Blue Lantern", categoryId: dining }, store);
    const local = saveMerchantAlias(emptyLocalMerchantData(), {
      alias: "Woolies",
      canonicalName: "Woolworths",
      categoryId: groceries,
      now: new Date("2026-06-18T00:00:00.000Z"),
    });

    const result = await migrateDurableMerchantData(user, local, store);
    expect(result.importedCount).toBe(3);
    expect(result.skippedCount).toBe(0);
    expect(result.data.profiles.map((profile) => profile.name)).toEqual(expect.arrayContaining(["Blue Lantern", "Woolworths"]));
  });

  it("rejects private identifiers and raw narration before durable writes", async () => {
    const user = createTestUserContext("user_1");
    const store = createMemoryStore();

    await expect(saveDurableMerchantRule(user, {
      merchantName: "Account 12345678",
      categoryId: groceries,
    }, store)).rejects.toThrow(/private banking identifiers/i);
    await expect(saveDurableMerchantAlias(user, {
      alias: "Synthetic Merchant terminal receipt",
      canonicalName: "Synthetic Merchant",
      categoryId: groceries,
    }, store)).rejects.toThrow(/short cleaned merchant name/i);
    expect(store.writes()).toBe(0);
  });

  it("clears only the authenticated account snapshot and stores no private CSV data", async () => {
    const userOne = createTestUserContext("user_1");
    const userTwo = createTestUserContext("user_2");
    const store = createMemoryStore();
    await saveDurableMerchantRule(userOne, { merchantName: "Blue Lantern", categoryId: dining }, store);
    await saveDurableMerchantRule(userTwo, { merchantName: "Woolworths", categoryId: groceries }, store);

    expect(await clearDurableMerchantData(userOne, store)).toEqual(emptyLocalMerchantData());
    expect((await listDurableMerchantData(userTwo, store)).profiles).toHaveLength(1);
    const stored = JSON.stringify(await listDurableMerchantData(userTwo, store));
    expect(stored).not.toMatch(/rawRow|filename|accountNumber|bsb|balance|cardFragment/i);
  });
});
