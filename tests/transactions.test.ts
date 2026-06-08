import { describe, expect, it } from "vitest";
import { transactionCreateSchema, transactionTotalsFilter } from "@/lib/validation/transactions";

describe("transaction validation", () => {
  it("validates manual transactions with integer cents", () => {
    const transaction = transactionCreateSchema.parse({
      userId: "user_1",
      type: "EXPENSE",
      source: "MANUAL",
      amountCents: -2500,
      date: "2026-06-09",
      description: "Groceries",
    });

    expect(transaction.amountCents).toBe(-2500);
    expect(transaction.status).toBe("ACTIVE");
  });

  it("requires split children to reference a parent", () => {
    expect(() => transactionCreateSchema.parse({
      userId: "user_1",
      type: "EXPENSE",
      source: "MANUAL",
      splitRole: "CHILD",
      amountCents: -1000,
      date: "2026-06-09",
      description: "Split child",
    })).toThrow();
  });

  it("excludes split parents from totals by query convention", () => {
    expect(transactionTotalsFilter.splitRole).toEqual({ not: "PARENT" });
  });
});
