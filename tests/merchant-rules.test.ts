import { describe, expect, it } from "vitest";
import { manualCategories } from "@/lib/manual-categories";
import {
  deleteMerchantAlias,
  emptyLocalMerchantData,
  loadMerchantRulesFromStorage,
  MERCHANT_RULE_STORAGE_KEY,
  MerchantConflictError,
  normalizeMerchantName,
  parseMerchantRuleStorage,
  renameMerchantAlias,
  renameMerchantProfile,
  saveConfirmedMerchantRule,
  saveMerchantAlias,
  saveMerchantRulesToStorage,
  serializeMerchantRuleStorage,
  setMerchantAliasActive,
  setMerchantRuleActive,
  suggestMerchantCategory,
  updateMerchantProfile,
} from "@/lib/merchant-rules";

function categoryId(name: string) {
  return manualCategories.find((category) => category.name === name)!.id;
}

const now = new Date("2026-06-15T00:00:00.000Z");

describe("browser-local merchant aliases and rules", () => {
  it("cleans merchant names deterministically before matching", () => {
    expect(normalizeMerchantName("WOOLWORTHS METRO terminal 1234")).toBe("woolworths");
    expect(normalizeMerchantName("Blue Lantern Café Pty Ltd")).toBe("blue lantern cafe");
    expect(normalizeMerchantName("Domino's store Wynnum")).toBe("domino s");
  });

  it("uses user rules before aliases, aliases before keywords, and keywords before review", () => {
    const aliased = saveMerchantAlias(emptyLocalMerchantData(), {
      alias: "Fresh Foods",
      canonicalName: "Coles",
      categoryId: categoryId("Groceries"),
      now,
    });
    const ruled = saveConfirmedMerchantRule(aliased, {
      merchantName: "Fresh Foods",
      categoryId: categoryId("Dining out"),
      now: new Date("2026-06-15T01:00:00.000Z"),
    });

    expect(suggestMerchantCategory("Fresh Foods", ruled)).toMatchObject({
      source: "USER_RULE",
      categoryId: categoryId("Dining out"),
      requiresReview: true,
    });
    expect(suggestMerchantCategory("Fresh Foods", aliased)).toMatchObject({
      source: "USER_ALIAS",
      merchantName: "Coles",
      categoryId: categoryId("Groceries"),
      requiresReview: true,
    });
    expect(suggestMerchantCategory("Woolworths Metro", emptyLocalMerchantData())).toMatchObject({
      source: "KEYWORD",
      categoryId: categoryId("Groceries"),
      requiresReview: true,
    });
    expect(suggestMerchantCategory("Blue Lantern Cafe", emptyLocalMerchantData())).toMatchObject({
      source: "FALLBACK",
      confidence: "LOW",
      categoryId: categoryId("Needs review"),
      requiresReview: true,
    });
  });

  it("keeps ambiguous payments conservative while suggesting clear transfers", () => {
    expect(suggestMerchantCategory("BPAY levy", emptyLocalMerchantData())).toMatchObject({
      source: "FALLBACK",
      categoryId: categoryId("Needs review"),
    });
    expect(suggestMerchantCategory("Payment", emptyLocalMerchantData())).toMatchObject({
      source: "FALLBACK",
      categoryId: categoryId("Needs review"),
    });
    expect(suggestMerchantCategory("Internal account movement", emptyLocalMerchantData())).toMatchObject({
      source: "KEYWORD",
      confidence: "MEDIUM",
      categoryId: categoryId("Transfer"),
    });
    expect(suggestMerchantCategory("Loan repayment", emptyLocalMerchantData())).toMatchObject({
      source: "KEYWORD",
      categoryId: categoryId("Loan repayment"),
    });
  });

  it("supports alias rename, disable, restore, and delete", () => {
    const saved = saveMerchantAlias(emptyLocalMerchantData(), {
      alias: "Fresh Foods",
      canonicalName: "Coles",
      categoryId: categoryId("Groceries"),
      now,
    });
    const aliasId = saved.aliases[0].id;
    const renamed = renameMerchantAlias(saved, aliasId, "Fresh Market", undefined, now);
    expect(suggestMerchantCategory("Fresh Market", renamed).source).toBe("USER_ALIAS");

    const disabled = setMerchantAliasActive(renamed, aliasId, false, now);
    expect(suggestMerchantCategory("Fresh Market", disabled).source).toBe("FALLBACK");

    const restored = setMerchantAliasActive(disabled, aliasId, true, now);
    expect(suggestMerchantCategory("Fresh Market", restored).source).toBe("USER_ALIAS");

    const deleted = deleteMerchantAlias(restored, aliasId);
    expect(deleted.aliases).toHaveLength(0);
    expect(suggestMerchantCategory("Fresh Market", deleted).source).toBe("FALLBACK");
  });

  it("renames the safe canonical merchant and keeps its exact rule aligned", () => {
    const saved = saveConfirmedMerchantRule(emptyLocalMerchantData(), {
      merchantName: "Blue Lantern",
      categoryId: categoryId("Coffee / takeaway"),
      now,
    });
    const profileId = saved.profiles[0].id;
    const renamed = renameMerchantProfile(saved, profileId, "Blue Lantern Cafe", now);

    expect(renamed.profiles[0]).toMatchObject({
      name: "Blue Lantern Cafe",
      normalizedName: "blue lantern cafe",
    });
    expect(renamed.rules[0].normalizedPattern).toBe("blue lantern cafe");
    expect(suggestMerchantCategory("Blue Lantern Cafe", renamed)).toMatchObject({
      source: "USER_RULE",
      categoryId: categoryId("Coffee / takeaway"),
    });
  });

  it("edits the safe merchant profile and preserves child lifecycle state through remove and restore", () => {
    const saved = saveMerchantAlias(emptyLocalMerchantData(), {
      alias: "Lantern Coffee",
      canonicalName: "Blue Lantern",
      categoryId: categoryId("Coffee / takeaway"),
      now,
    });
    const profileId = saved.profiles[0].id;
    const aliasId = saved.aliases[0].id;
    const aliasDisabled = setMerchantAliasActive(saved, aliasId, false, now);
    const updated = updateMerchantProfile(aliasDisabled, profileId, {
      name: "Blue Lantern Cafe",
      categoryId: categoryId("Dining out"),
    }, now);

    expect(updated.profiles[0]).toMatchObject({
      name: "Blue Lantern Cafe",
      defaultCategoryId: categoryId("Dining out"),
      isActive: true,
    });
    expect(updated.rules.every((rule) => rule.categoryId === categoryId("Dining out"))).toBe(true);
    expect(updated.aliases[0].isActive).toBe(false);

    const removed = updateMerchantProfile(updated, profileId, { isActive: false }, now);
    expect(suggestMerchantCategory("Blue Lantern Cafe", removed).source).toBe("FALLBACK");
    const restored = updateMerchantProfile(removed, profileId, { isActive: true }, now);
    expect(suggestMerchantCategory("Blue Lantern Cafe", restored)).toMatchObject({
      source: "USER_RULE",
      categoryId: categoryId("Dining out"),
    });
    expect(restored.aliases[0].isActive).toBe(false);
  });

  it("requires an explicit choice when a saved rule conflicts", () => {
    const saved = saveConfirmedMerchantRule(emptyLocalMerchantData(), {
      merchantName: "Blue Lantern",
      categoryId: categoryId("Coffee / takeaway"),
      now,
    });

    expect(() => saveConfirmedMerchantRule(saved, {
      merchantName: "Blue Lantern",
      categoryId: categoryId("Dining out"),
      now,
    })).toThrow(MerchantConflictError);

    const kept = saveConfirmedMerchantRule(saved, {
      merchantName: "Blue Lantern",
      categoryId: categoryId("Dining out"),
      resolution: "KEEP_EXISTING",
      now,
    });
    expect(kept.rules[0].categoryId).toBe(categoryId("Coffee / takeaway"));

    const replaced = saveConfirmedMerchantRule(saved, {
      merchantName: "Blue Lantern",
      categoryId: categoryId("Dining out"),
      resolution: "REPLACE",
      now,
    });
    expect(replaced.rules[0].categoryId).toBe(categoryId("Dining out"));
  });

  it("requires an explicit choice when an alias belongs to another merchant", () => {
    const saved = saveMerchantAlias(emptyLocalMerchantData(), {
      alias: "Corner Market",
      canonicalName: "Coles",
      categoryId: categoryId("Groceries"),
      now,
    });

    expect(() => saveMerchantAlias(saved, {
      alias: "Corner Market",
      canonicalName: "Woolworths",
      categoryId: categoryId("Groceries"),
      now,
    })).toThrow(MerchantConflictError);

    const replaced = saveMerchantAlias(saved, {
      alias: "Corner Market",
      canonicalName: "Woolworths",
      categoryId: categoryId("Groceries"),
      resolution: "REPLACE",
      now,
    });
    expect(suggestMerchantCategory("Corner Market", replaced)).toMatchObject({
      source: "USER_ALIAS",
      merchantName: "Woolworths",
    });
  });

  it("can disable and restore a user-confirmed rule without deleting it", () => {
    const saved = saveConfirmedMerchantRule(emptyLocalMerchantData(), {
      merchantName: "Blue Lantern",
      categoryId: categoryId("Dining out"),
      now,
    });
    const ruleId = saved.rules[0].id;
    const disabled = setMerchantRuleActive(saved, ruleId, false, now);
    expect(suggestMerchantCategory("Blue Lantern", disabled).source).toBe("USER_ALIAS");
    const restored = setMerchantRuleActive(disabled, ruleId, true, now);
    expect(suggestMerchantCategory("Blue Lantern", restored).source).toBe("USER_RULE");
  });

  it("rejects private identifiers and full bank descriptions from saved helpers", () => {
    expect(() => saveConfirmedMerchantRule(emptyLocalMerchantData(), {
      merchantName: "Synthetic account number 12345678",
      categoryId: categoryId("Groceries"),
    })).toThrow("Private banking identifiers");
    expect(() => saveMerchantAlias(emptyLocalMerchantData(), {
      alias: "Card xx4321",
      canonicalName: "Synthetic Merchant",
      categoryId: categoryId("Shopping"),
    })).toThrow("Private banking identifiers");
    expect(() => saveConfirmedMerchantRule(emptyLocalMerchantData(), {
      merchantName: "Synthetic Merchant terminal receipt",
      categoryId: categoryId("Shopping"),
    })).toThrow("short cleaned merchant name");
  });

  it("stores only versioned safe merchant metadata", () => {
    const data = saveMerchantAlias(emptyLocalMerchantData(), {
      alias: "Woolies",
      canonicalName: "Woolworths",
      categoryId: categoryId("Groceries"),
      now,
    });
    const serialized = serializeMerchantRuleStorage(data);
    const parsed = JSON.parse(serialized);

    expect(parsed.version).toBe(2);
    expect(parsed.profiles[0]).toMatchObject({
      name: "Woolworths",
      normalizedName: "woolworths",
      isActive: true,
    });
    expect(parsed.aliases[0]).toMatchObject({
      name: "Woolies",
      normalizedAlias: "woolies",
      isActive: true,
    });
    expect(parsed.rules[0]).toMatchObject({
      type: "EXACT",
      normalizedPattern: "woolworths",
      isActive: true,
    });
    expect(serialized).not.toContain("rawDescription");
    expect(serialized).not.toContain("accountNumber");
    expect(serialized).not.toContain("filename");
    expect(serialized).not.toContain("amount");
  });

  it("migrates the approved v1 browser-local shape safely", () => {
    const timestamp = now.toISOString();
    const legacy = JSON.stringify({
      version: 1,
      profiles: [{
        id: "merchant-1",
        name: "Woolworths",
        normalizedName: "woolworths",
        defaultCategoryId: categoryId("Groceries"),
        createdAt: timestamp,
        updatedAt: timestamp,
      }],
      aliases: [{
        id: "alias-1",
        merchantProfileId: "merchant-1",
        normalizedAlias: "woolies",
        createdAt: timestamp,
      }],
      rules: [{
        id: "rule-1",
        merchantProfileId: "merchant-1",
        categoryId: categoryId("Groceries"),
        type: "EXACT",
        normalizedPattern: "woolworths",
        priority: 10,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      }],
    });

    const result = parseMerchantRuleStorage(legacy);
    expect(result).toMatchObject({
      recoveredFromCorruption: false,
      migrated: true,
      unsupportedVersion: false,
      staleReferenceCount: 0,
    });
    expect(result.data.profiles[0].isActive).toBe(true);
    expect(result.data.aliases[0]).toMatchObject({ name: "Woolies", isActive: true });
  });

  it("removes stale category references during safe recovery", () => {
    const timestamp = now.toISOString();
    const result = parseMerchantRuleStorage(JSON.stringify({
      version: 2,
      profiles: [{
        id: "merchant-stale",
        name: "Blue Lantern",
        normalizedName: "blue lantern",
        defaultCategoryId: "missing-category",
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      }],
      aliases: [],
      rules: [],
    }));

    expect(result.staleReferenceCount).toBe(1);
    expect(result.data).toEqual(emptyLocalMerchantData());
  });

  it("recovers safely from corrupted, over-broad, or unsupported storage", () => {
    expect(parseMerchantRuleStorage("not-json")).toMatchObject({
      data: emptyLocalMerchantData(),
      recoveredFromCorruption: true,
      migrated: false,
      unsupportedVersion: false,
    });
    expect(parseMerchantRuleStorage(JSON.stringify({
      version: 2,
      profiles: [],
      aliases: [],
      rules: [],
      rawRows: ["not permitted"],
    }))).toMatchObject({
      data: emptyLocalMerchantData(),
      recoveredFromCorruption: true,
    });
    expect(parseMerchantRuleStorage(JSON.stringify({
      version: 99,
      profiles: [],
      aliases: [],
      rules: [],
    }))).toMatchObject({
      data: emptyLocalMerchantData(),
      unsupportedVersion: true,
    });
  });

  it("falls back safely when browser storage is unavailable", () => {
    const unavailableStorage = {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("blocked"); },
    };

    expect(loadMerchantRulesFromStorage(unavailableStorage)).toMatchObject({
      data: emptyLocalMerchantData(),
      recoveredFromCorruption: false,
      migrated: false,
      unsupportedVersion: false,
      staleReferenceCount: 0,
      storageAvailable: false,
    });
    expect(saveMerchantRulesToStorage(unavailableStorage, emptyLocalMerchantData())).toBe(false);
  });

  it("writes the v2 key only when browser storage accepts it", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem(key: string) { return values.get(key) ?? null; },
      setItem(key: string, value: string) { values.set(key, value); },
    };
    const data = saveConfirmedMerchantRule(emptyLocalMerchantData(), {
      merchantName: "Blue Lantern",
      categoryId: categoryId("Dining out"),
      now,
    });

    expect(saveMerchantRulesToStorage(storage, data)).toBe(true);
    expect(values.has(MERCHANT_RULE_STORAGE_KEY)).toBe(true);
  });
});
