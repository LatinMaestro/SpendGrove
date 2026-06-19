import { describe, expect, it } from "vitest";
import { learnEditedMerchantName, learnMerchantCategory } from "@/lib/import-review-merchant-learning";
import { manualCategories } from "@/lib/manual-categories";
import { emptyLocalMerchantData, MerchantConflictError, suggestMerchantCategory } from "@/lib/merchant-rules";

function categoryId(name: string) {
  return manualCategories.find((category) => category.name === name)!.id;
}

describe("automatic merchant learning during import review", () => {
  it("learns a manually selected category for future suggestions", () => {
    const learned = learnMerchantCategory(emptyLocalMerchantData(), {
      merchantName: "Blue Lantern Cafe",
      categoryId: categoryId("Dining out"),
    });

    expect(suggestMerchantCategory("Blue Lantern Cafe", learned)).toMatchObject({
      source: "USER_RULE",
      categoryId: categoryId("Dining out"),
    });
  });

  it("remembers a cleaned merchant name using only safe alias metadata", () => {
    const learned = learnEditedMerchantName(emptyLocalMerchantData(), {
      previousMerchantName: "Blue Lantern",
      merchantName: "Blue Lantern Cafe",
      categoryId: categoryId("Coffee / takeaway"),
    });

    expect(suggestMerchantCategory("Blue Lantern", learned)).toMatchObject({
      source: "USER_ALIAS",
      merchantName: "Blue Lantern Cafe",
      categoryId: categoryId("Coffee / takeaway"),
    });
    expect(JSON.stringify(learned)).not.toMatch(/rawDescription|filename|accountNumber|amountCents/);
  });

  it("does not silently overwrite a conflicting saved category", () => {
    const learned = learnMerchantCategory(emptyLocalMerchantData(), {
      merchantName: "Blue Lantern",
      categoryId: categoryId("Coffee / takeaway"),
    });

    expect(() => learnMerchantCategory(learned, {
      merchantName: "Blue Lantern",
      categoryId: categoryId("Dining out"),
    })).toThrow(MerchantConflictError);
  });

  it("rejects private identifiers and raw banking narration", () => {
    expect(() => learnMerchantCategory(emptyLocalMerchantData(), {
      merchantName: "Synthetic account number 12345678",
      categoryId: categoryId("Shopping"),
    })).toThrow("Private banking identifiers");
    expect(() => learnEditedMerchantName(emptyLocalMerchantData(), {
      previousMerchantName: "Synthetic Merchant",
      merchantName: "Synthetic Merchant terminal receipt",
      categoryId: categoryId("Shopping"),
    })).toThrow("short cleaned merchant name");
  });
});
