import { describe, expect, it } from "vitest";
import { manualCategories } from "@/lib/manual-categories";
import { parseCsvDocument, scanCsvDocument } from "@/lib/csv-import";
import {
  applyCategoryToSameMerchant,
  applyMerchantSuggestionsToRows,
  createTransientImportReviewRows,
  updateImportReviewDetails,
} from "@/lib/import-review";
import {
  emptyLocalMerchantData,
  loadMerchantRulesFromStorage,
  normalizeMerchantName,
  parseMerchantRuleStorage,
  saveConfirmedMerchantRule,
  saveMerchantAlias,
  saveMerchantRulesToStorage,
  serializeMerchantRuleStorage,
  suggestMerchantCategory,
} from "@/lib/merchant-rules";

function categoryId(name: string) {
  return manualCategories.find((category) => category.name === name)!.id;
}

function syntheticRows() {
  const document = parseCsvDocument([
    "01/06/2026,-20.00,Woolworths terminal 1234",
    "02/06/2026,-15.00,Woolworths store 5678",
    "03/06/2026,-9.50,Blue Lantern Cafe",
  ].join("\n"));
  const scan = scanCsvDocument(document, {
    0: "DATE",
    1: "AMOUNT",
    2: "DESCRIPTION",
  });
  return { document, scan };
}

describe("local merchant rule foundation", () => {
  it("cleans merchant names deterministically before matching", () => {
    expect(normalizeMerchantName("WOOLWORTHS METRO terminal 1234")).toBe("woolworths");
    expect(normalizeMerchantName("Blue Lantern Café Pty Ltd")).toBe("blue lantern cafe");
  });

  it("uses user rules before aliases and generic keywords", () => {
    const aliased = saveMerchantAlias(emptyLocalMerchantData(), {
      alias: "Fresh Foods",
      canonicalName: "Coles",
      categoryId: categoryId("Groceries"),
      now: new Date("2026-06-10T00:00:00.000Z"),
    });
    const ruled = saveConfirmedMerchantRule(aliased, {
      merchantName: "Fresh Foods",
      categoryId: categoryId("Dining out"),
      now: new Date("2026-06-10T01:00:00.000Z"),
    });

    expect(suggestMerchantCategory("Fresh Foods", ruled)).toMatchObject({
      source: "USER_RULE",
      categoryId: categoryId("Dining out"),
      requiresReview: true,
    });
    expect(suggestMerchantCategory("Coles", aliased)).toMatchObject({
      source: "USER_RULE",
      categoryId: categoryId("Groceries"),
      requiresReview: true,
    });
    expect(suggestMerchantCategory("Fresh Foods", aliased)).toMatchObject({
      source: "USER_ALIAS",
      merchantName: "Coles",
      categoryId: categoryId("Groceries"),
      requiresReview: true,
    });
  });

  it("uses local keywords before a low-confidence review fallback", () => {
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

  it("rejects private banking identifiers from saved rules and aliases", () => {
    expect(() => saveConfirmedMerchantRule(emptyLocalMerchantData(), {
      merchantName: "Synthetic account number 12345678",
      categoryId: categoryId("Groceries"),
    })).toThrow("Private banking identifiers");
    expect(() => saveMerchantAlias(emptyLocalMerchantData(), {
      alias: "Card xx4321",
      canonicalName: "Synthetic Merchant",
      categoryId: categoryId("Shopping"),
    })).toThrow("Private banking identifiers");
  });

  it("stores only versioned cleaned profiles, aliases and rules", () => {
    const data = saveMerchantAlias(emptyLocalMerchantData(), {
      alias: "Woolies",
      canonicalName: "Woolworths",
      categoryId: categoryId("Groceries"),
      now: new Date("2026-06-10T00:00:00.000Z"),
    });
    const serialized = serializeMerchantRuleStorage(data);
    const parsed = JSON.parse(serialized);

    expect(parsed.version).toBe(1);
    expect(parsed.profiles[0]).toMatchObject({ name: "Woolworths", normalizedName: "woolworths" });
    expect(parsed.aliases[0]).toMatchObject({ normalizedAlias: "woolies" });
    expect(parsed.rules[0]).toMatchObject({ type: "EXACT", normalizedPattern: "woolworths" });
    expect(serialized).not.toContain("rawDescription");
    expect(serialized).not.toContain("accountNumber");
    expect(serialized).not.toContain("filename");
  });

  it("recovers from corrupted or over-broad browser storage", () => {
    expect(parseMerchantRuleStorage("not-json")).toEqual({
      data: emptyLocalMerchantData(),
      recoveredFromCorruption: true,
    });
    expect(parseMerchantRuleStorage(JSON.stringify({
      version: 1,
      profiles: [],
      aliases: [],
      rules: [],
      rawRows: ["not permitted"],
    }))).toEqual({
      data: emptyLocalMerchantData(),
      recoveredFromCorruption: true,
    });
  });

  it("falls back safely when browser storage is unavailable", () => {
    const unavailableStorage = {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("blocked"); },
    };

    expect(loadMerchantRulesFromStorage(unavailableStorage)).toEqual({
      data: emptyLocalMerchantData(),
      recoveredFromCorruption: false,
      storageAvailable: false,
    });
    expect(saveMerchantRulesToStorage(unavailableStorage, emptyLocalMerchantData())).toBe(false);
  });

  it("applies a reviewed category to matching cleaned merchants only", () => {
    const { document, scan } = syntheticRows();
    const initial = createTransientImportReviewRows(document, scan.columns, scan.mapping);
    const reviewed = updateImportReviewDetails(initial, initial[0].id, {
      merchantName: initial[0].merchantName,
      categoryId: categoryId("Groceries"),
    });
    const applied = applyCategoryToSameMerchant(reviewed, reviewed[0].id);

    expect(applied[0]).toMatchObject({ categoryId: categoryId("Groceries"), categoryConfirmed: true });
    expect(applied[1]).toMatchObject({ categoryId: categoryId("Groceries"), categoryConfirmed: true });
    expect(applied[2]).toMatchObject({ categoryId: categoryId("Needs review"), categoryConfirmed: false });
  });

  it("refreshes unconfirmed suggestions after a local rule save without overriding reviewed edits", () => {
    const { document, scan } = syntheticRows();
    const initial = createTransientImportReviewRows(document, scan.columns, scan.mapping);
    const reviewed = updateImportReviewDetails(initial, initial[2].id, {
      merchantName: initial[2].merchantName,
      categoryId: categoryId("Coffee / takeaway"),
    });
    const data = saveConfirmedMerchantRule(emptyLocalMerchantData(), {
      merchantName: "Woolworths",
      categoryId: categoryId("Shopping"),
    });
    const refreshed = applyMerchantSuggestionsToRows(reviewed, data);

    expect(refreshed[0]).toMatchObject({ source: undefined });
    expect(refreshed[0].suggestionSource).toBe("USER_RULE");
    expect(refreshed[0].categoryId).toBe(categoryId("Shopping"));
    expect(refreshed[2]).toMatchObject({
      categoryId: categoryId("Coffee / takeaway"),
      categoryConfirmed: true,
    });
  });
});
