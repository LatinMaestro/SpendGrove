import { describe, expect, it } from "vitest";
import { shouldCountTransactionInTotals, validateSplitTotal } from "@/lib/validation/splits";

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

  it("excludes split parents and counts split children", () => {
    expect(shouldCountTransactionInTotals("PARENT")).toBe(false);
    expect(shouldCountTransactionInTotals("CHILD")).toBe(true);
  });
});
