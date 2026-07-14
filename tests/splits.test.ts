import { describe, expect, it } from "vitest";
import { shouldCountTransactionInTotals, validateSplitTotal, validateSplitTransactionDirection } from "@/lib/validation/splits";

describe("split validation", () => {
  it("requires children to equal parent amount in cents", () => {
    expect(validateSplitTotal({ parentAmountCents: -10000, childAmountsCents: [-2500, -7500] })).toEqual({
      parentAmountCents: -10000,
      childTotalCents: -10000,
    });
  });

  it("rejects imbalanced split totals", () => {
    expect(() => validateSplitTotal({ parentAmountCents: -10000, childAmountsCents: [-2000, -7000] })).toThrow();
  });

  it("rejects mixed-direction and zero-value children", () => {
    expect(() => validateSplitTotal({ parentAmountCents: -10000, childAmountsCents: [-11000, 1000] })).toThrow("same money direction");
    expect(() => validateSplitTotal({ parentAmountCents: -10000, childAmountsCents: [-10000, 0] })).toThrow("non-zero");
  });

  it("requires child types to match the parent", () => {
    expect(() => validateSplitTransactionDirection({
      parentAmountCents: -10000,
      parentType: "EXPENSE",
      children: [{ amountCents: -10000, type: "INCOME" }],
    })).toThrow();
  });

  it("excludes split parents and counts split children", () => {
    expect(shouldCountTransactionInTotals("PARENT")).toBe(false);
    expect(shouldCountTransactionInTotals("CHILD")).toBe(true);
  });
});
