import { describe, expect, it } from "vitest";
import {
  assertCategoryTypeCompatible,
  assertTransactionTypeCompatible,
  deriveTransactionType,
  directionCompatibleFallbackCategoryName,
  normaliseAmountForTransactionType,
  transactionDirectionLabel,
  transactionNeedsDirectionCorrection,
} from "@/lib/transaction-direction";
import { validateSplitTransactionDirection } from "@/lib/validation/splits";
import { transactionCreateSchema, transactionUpdateSchema } from "@/lib/validation/transactions";

describe("transaction direction integrity", () => {
  it("derives ordinary direction from signed integer cents", () => {
    expect(deriveTransactionType(1250)).toBe("INCOME");
    expect(deriveTransactionType(-1250)).toBe("EXPENSE");
    expect(directionCompatibleFallbackCategoryName(1250)).toBe("Other income");
    expect(directionCompatibleFallbackCategoryName(-1250)).toBe("Needs review");
  });

  it("gives confirmed transfers precedence for either sign", () => {
    expect(deriveTransactionType(1250, true)).toBe("TRANSFER");
    expect(deriveTransactionType(-1250, true)).toBe("TRANSFER");
    expect(transactionDirectionLabel("TRANSFER", 1250)).toBe("Incoming transfer");
    expect(transactionDirectionLabel("TRANSFER", -1250)).toBe("Outgoing transfer");
  });

  it("rejects zero values and incompatible stored types", () => {
    expect(() => deriveTransactionType(0)).toThrow("non-zero");
    expect(() => assertTransactionTypeCompatible("EXPENSE", 1250)).toThrow("do not agree");
    expect(() => assertTransactionTypeCompatible("INCOME", -1250)).toThrow("do not agree");
    expect(() => assertTransactionTypeCompatible("TRANSFER", 1250)).not.toThrow();
  });

  it("normalises manual money in and money out without changing transfer signs", () => {
    expect(normaliseAmountForTransactionType("EXPENSE", 1250)).toBe(-1250);
    expect(normaliseAmountForTransactionType("INCOME", -1250)).toBe(1250);
    expect(normaliseAmountForTransactionType("TRANSFER", -1250)).toBe(-1250);
    expect(normaliseAmountForTransactionType("TRANSFER", 1250)).toBe(1250);
  });

  it("keeps categories subordinate to transaction direction", () => {
    expect(() => assertCategoryTypeCompatible("EXPENSE", "INCOME")).toThrow("money in");
    expect(() => assertCategoryTypeCompatible("INCOME", "EXPENSE")).toThrow("money out");
    expect(() => assertCategoryTypeCompatible("INCOME", "INCOME")).not.toThrow();
    expect(() => assertCategoryTypeCompatible("TRANSFER", "TRANSFER")).not.toThrow();
  });

  it("identifies existing anomalies without rewriting them", () => {
    expect(transactionNeedsDirectionCorrection({ type: "EXPENSE", amountCents: 250000 })).toBe(true);
    expect(transactionNeedsDirectionCorrection({ type: "INCOME", amountCents: -250000 })).toBe(true);
    expect(transactionNeedsDirectionCorrection({ type: "EXPENSE", amountCents: -250000 })).toBe(false);
  });

  it("accepts exact same-direction splits", () => {
    expect(validateSplitTransactionDirection({
      parentAmountCents: -10000,
      parentType: "EXPENSE",
      children: [
        { amountCents: -6000, type: "EXPENSE" },
        { amountCents: -4000, type: "EXPENSE" },
      ],
    })).toBeTruthy();
  });

  it("rejects mixed, zero, mismatched-type, and imbalanced split children", () => {
    expect(() => validateSplitTransactionDirection({
      parentAmountCents: -10000,
      parentType: "EXPENSE",
      children: [
        { amountCents: -11000, type: "EXPENSE" },
        { amountCents: 1000, type: "INCOME" },
      ],
    })).toThrow("same money direction");
    expect(() => validateSplitTransactionDirection({
      parentAmountCents: -10000,
      parentType: "EXPENSE",
      children: [
        { amountCents: -10000, type: "EXPENSE" },
        { amountCents: 0, type: "EXPENSE" },
      ],
    })).toThrow("non-zero");
    expect(() => validateSplitTransactionDirection({
      parentAmountCents: -10000,
      parentType: "EXPENSE",
      children: [{ amountCents: -10000, type: "INCOME" }],
    })).toThrow("do not agree");
    expect(() => validateSplitTransactionDirection({
      parentAmountCents: -10000,
      parentType: "EXPENSE",
      children: [{ amountCents: -9000, type: "EXPENSE" }],
    })).toThrow("must equal");
  });
  it("enforces the invariant at generic transaction create and material update boundaries", () => {
    const base = {
      userId: "user_1",
      type: "EXPENSE" as const,
      source: "MANUAL" as const,
      amountCents: -2500,
      date: new Date("2026-07-14T00:00:00.000Z"),
      description: "Synthetic payment",
    };
    expect(transactionCreateSchema.safeParse(base).success).toBe(true);
    expect(transactionCreateSchema.safeParse({ ...base, amountCents: 2500 }).success).toBe(false);
    expect(transactionCreateSchema.safeParse({ ...base, type: "INCOME", amountCents: -2500 }).success).toBe(false);
    expect(transactionCreateSchema.safeParse({ ...base, type: "TRANSFER", amountCents: 2500 }).success).toBe(true);
    expect(transactionUpdateSchema.safeParse({ type: "EXPENSE", amountCents: 2500 }).success).toBe(false);
    expect(transactionUpdateSchema.safeParse({ type: "INCOME", amountCents: 2500 }).success).toBe(true);
  });

});
