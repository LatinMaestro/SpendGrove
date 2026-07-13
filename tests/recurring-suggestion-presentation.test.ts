import { describe, expect, it } from "vitest";
import {
  uniqueSuggestionsByIdentity,
  visibleRecurringSuggestions,
} from "@/lib/recurring-suggestion-presentation";

describe("recurring suggestion presentation", () => {
  it("suppresses only repeated deterministic suggestion identities", () => {
    const suggestions = [
      { key: "same-key", label: "Synthetic service", amountCents: -1500 },
      { key: "same-key", label: "Synthetic service", amountCents: -1500 },
      { key: "different-key", label: "Synthetic service", amountCents: -2500 },
    ];

    expect(uniqueSuggestionsByIdentity(suggestions)).toEqual([
      suggestions[0],
      suggestions[2],
    ]);
  });

  it("keeps distinct payments for the same merchant separate", () => {
    const suggestions = [
      { key: "merchant:weekly:-1500", label: "Synthetic service", amountCents: -1500 },
      { key: "merchant:monthly:-2500", label: "Synthetic service", amountCents: -2500 },
    ];

    expect(uniqueSuggestionsByIdentity(suggestions)).toHaveLength(2);
  });

  it("shows three suggestions by default and all suggestions only on request", () => {
    const suggestions = ["one", "two", "three", "four"];

    expect(visibleRecurringSuggestions(suggestions, false)).toEqual(["one", "two", "three"]);
    expect(visibleRecurringSuggestions(suggestions, true)).toEqual(suggestions);
  });
});
