import { describe, expect, it } from "vitest";
import { centsSchema, moneyInputToCentsSchema, parseMoneyToCents } from "@/lib/validation/money";

describe("money validation", () => {
  it("parses AUD input to integer cents", () => {
    expect(parseMoneyToCents("$1,234.56")).toBe(123456);
    expect(parseMoneyToCents("AUD 12.30")).toBe(1230);
    expect(parseMoneyToCents("+27.45")).toBe(2745);
    expect(moneyInputToCentsSchema.parse("(42.05)")).toBe(-4205);
  });

  it("rejects more than two decimal places", () => {
    expect(() => parseMoneyToCents("10.999")).toThrow();
  });

  it("rejects values outside the safe integer-cent range", () => {
    expect(() => parseMoneyToCents("90071992547409.92")).toThrow();
    expect(() => centsSchema.parse(Number.MAX_SAFE_INTEGER + 1)).toThrow();
  });
});
