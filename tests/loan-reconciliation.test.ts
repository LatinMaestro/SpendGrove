import { describe, expect, it } from "vitest";
import { resolveReconciliationLinkDecision, scoreReconciliationCandidate } from "@/lib/loan-reconciliation";

const base = {
  repaymentTotalCents: 180000,
  repaymentDate: "2026-06-18",
  transactionId: "transaction_1",
  transactionDate: "2026-06-18",
  transactionAmountCents: -180000,
  mode: "SUGGESTED" as const,
};

describe("loan reconciliation candidate scoring", () => {
  it("uses the approved high confidence exact-amount 0-1 day band", () => {
    expect(scoreReconciliationCandidate(base)).toMatchObject({ confidence: "HIGH", amountVarianceCents: 0, dateDifferenceDays: 0, reasonCode: "EXACT_AMOUNT_NEAR_DATE" });
    expect(scoreReconciliationCandidate({ ...base, transactionDate: "2026-06-19" })?.confidence).toBe("HIGH");
  });

  it("uses the approved medium confidence rounding and delayed-date bands", () => {
    expect(scoreReconciliationCandidate({ ...base, transactionAmountCents: -180002, transactionDate: "2026-06-21" })).toMatchObject({ confidence: "MEDIUM", amountVarianceCents: 2, reasonCode: "ROUNDING_VARIANCE" });
    expect(scoreReconciliationCandidate({ ...base, transactionDate: "2026-06-25" })).toMatchObject({ confidence: "MEDIUM", dateDifferenceDays: 7, reasonCode: "EXACT_AMOUNT_DELAYED_DATE" });
  });

  it("shows the one-dollar/manual seven-day band only in an explicit manual flow", () => {
    const candidate = { ...base, transactionAmountCents: -180100, transactionDate: "2026-06-25" };
    expect(scoreReconciliationCandidate(candidate)).toBeNull();
    expect(scoreReconciliationCandidate({ ...candidate, mode: "MANUAL" })).toMatchObject({ confidence: "MANUAL", amountVarianceCents: 100, dateDifferenceDays: 7 });
    expect(scoreReconciliationCandidate({ ...candidate, mode: "MANUAL", transactionAmountCents: -180101 })).toBeNull();
  });

  it("accounts for existing split-loan allocations without changing transaction cashflow", () => {
    expect(scoreReconciliationCandidate({
      ...base,
      repaymentTotalCents: 160000,
      transactionAmountCents: -320000,
      existingAllocationCents: 160000,
    })).toMatchObject({ confidence: "HIGH", amountVarianceCents: 0, existingAllocationCents: 160000 });
  });

  it("requires displayed mismatch confirmation for medium, manual and override links", () => {
    const medium = { ...base, transactionAmountCents: -180002, selectionMode: "SUGGESTED" as const, mismatchConfirmed: false };
    expect(() => resolveReconciliationLinkDecision(medium)).toThrow(/confirm the displayed/i);
    expect(resolveReconciliationLinkDecision({ ...medium, mismatchConfirmed: true })).toMatchObject({ confidence: "MEDIUM", method: "SUGGESTED" });

    const override = { ...base, transactionAmountCents: -250000, transactionDate: "2026-08-01", selectionMode: "OVERRIDE" as const, mismatchConfirmed: false };
    expect(() => resolveReconciliationLinkDecision(override)).toThrow(/confirm the displayed/i);
    expect(resolveReconciliationLinkDecision({ ...override, mismatchConfirmed: true })).toMatchObject({ confidence: "MANUAL", method: "MANUAL", reasonCode: "MANUAL_OVERRIDE" });
  });

  it("does not allow a manual-band transaction through the suggested-link path", () => {
    expect(() => resolveReconciliationLinkDecision({
      ...base,
      transactionAmountCents: -180050,
      selectionMode: "SUGGESTED",
      mismatchConfirmed: true,
    })).toThrow(/outside the selected matching flow/i);
  });
});
