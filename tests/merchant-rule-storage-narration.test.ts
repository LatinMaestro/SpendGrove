import { describe, expect, it } from "vitest";
import { manualCategories } from "@/lib/manual-categories";
import {
  emptyLocalMerchantData,
  saveConfirmedMerchantRule,
  saveMerchantAlias,
  serializeMerchantRuleStorage,
} from "@/lib/merchant-rules";

function categoryId(name: string) {
  return manualCategories.find((category) => category.name === name)!.id;
}

describe("merchant helper storage for card narrations", () => {
  it("stores cleaned merchant names instead of raw full bank narration", () => {
    const rawNarration = "7-ELEVEN 4235 Fictional Suburb QL AUS Card Value Date: 27/05/2026";
    const ruled = saveConfirmedMerchantRule(emptyLocalMerchantData(), {
      merchantName: rawNarration,
      categoryId: categoryId("Fuel"),
      now: new Date("2026-06-16T00:00:00.000Z"),
    });
    const aliased = saveMerchantAlias(ruled, {
      alias: "Synthetic convenience store",
      canonicalName: rawNarration,
      categoryId: categoryId("Fuel"),
      now: new Date("2026-06-16T00:00:00.000Z"),
    });
    const serialized = serializeMerchantRuleStorage(aliased);

    expect(serialized).toContain("7-ELEVEN");
    expect(serialized).toContain("synthetic convenience store");
    expect(serialized).not.toContain("4235");
    expect(serialized).not.toContain("Fictional Suburb");
    expect(serialized).not.toContain("Card Value Date");
    expect(serialized).not.toContain("27/05/2026");
  });

  it("stores a short OpenAI merchant name instead of subscription narration", () => {
    const rawNarration = "OPENAI *CHATGPT SUBSCR AU AUS Card Value Date: 27/05/2026";
    const saved = saveConfirmedMerchantRule(emptyLocalMerchantData(), {
      merchantName: rawNarration,
      categoryId: categoryId("Subscriptions"),
      now: new Date("2026-06-16T00:00:00.000Z"),
    });
    const serialized = serializeMerchantRuleStorage(saved);

    expect(serialized).toContain("OpenAI / ChatGPT");
    expect(serialized).not.toContain("SUBSCR");
    expect(serialized).not.toContain("Card Value Date");
    expect(serialized).not.toContain("27/05/2026");
  });
});
