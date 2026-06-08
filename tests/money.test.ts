import { describe, expect, it } from "vitest";
import { moneyInputToCentsSchema, parseMoneyToCents } from "@/lib/validation/money";

describe("money validation", () => {
  it("parses AUD input to integer cents", () => {
    expect(parseMoneyToCents("$1,234.56")).toBe(123456);
    expect(parseMoneyToCents("AUD 12.30")).toBe(1230);
    expect(moneyInputToCentsSchema.parse("(42.05)")).toBe(-4205);
  });

  it("rejects more than two decimal places", () => {
    expect(() => parseMoneyToCents("10.999")).toThrow();
  });
});
