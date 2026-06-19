import { describe, expect, it } from "vitest";
import { applyCategoryToMatchingMerchants, countApplySameMerchantMatches } from "@/lib/import-review-bulk";
import { canonicalMerchantGroupingKey } from "@/lib/import-review-merchant-identity";
import type { ImportReviewRow } from "@/lib/import-review";
import { manualCategories } from "@/lib/manual-categories";

const categoryId = (name: string) => manualCategories.find((category) => category.name === name)!.id;
function row(id: string, merchantName: string, overrides: Partial<ImportReviewRow> = {}): ImportReviewRow {
  return { id, rowNumber: Number(id.replace(/\D/g, "")) || 1, date: "2026-06-19", amountCents: -1000, description: merchantName, merchantName, categoryId: categoryId("Needs review"), action: "IMPORT", warningCodes: [], suggestionSource: "FALLBACK", suggestionConfidence: "LOW", suggestionReason: "Review", categoryConfirmed: false, merchantEdited: false, reviewState: "UNREVIEWED", ...overrides };
}

describe("safe merchant grouping across reference tokens", () => {
  it("groups Kindred Early and MetLife variants with unique references", () => {
    expect(canonicalMerchantGroupingKey("Kindred Early 84930271")).toBe("kindred early");
    expect(canonicalMerchantGroupingKey("Kindred Early INV-A93B772")).toBe("kindred early");
    expect(canonicalMerchantGroupingKey("MetLife policy 88392011")).toBe("metlife");
    expect(canonicalMerchantGroupingKey("MetLife 77102944")).toBe("metlife");
  });

  it("applies one reviewed category across safely grouped variants", () => {
    const rows = [
      row("1", "Kindred Early 84930271", { categoryId: categoryId("Training / education"), categoryConfirmed: true, reviewState: "MANUALLY_REVIEWED" }),
      row("2", "Kindred Early 99200114"),
      row("3", "MetLife 77102944"),
    ];
    expect(countApplySameMerchantMatches(rows, "1")).toBe(1);
    const applied = applyCategoryToMatchingMerchants(rows, "1");
    expect(applied.affectedCount).toBe(1);
    expect(applied.rows[1]).toMatchObject({ categoryId: categoryId("Training / education"), reviewState: "APPLIED_TO_MATCH" });
  });

  it("does not offer bulk grouping for ambiguous transfers and payments", () => {
    const transfers = [
      row("1", "Bank transfer to CBA", { categoryId: categoryId("Transfer"), categoryConfirmed: true }),
      row("2", "Bank transfer to CBA"),
    ];
    expect(countApplySameMerchantMatches(transfers, "1")).toBe(0);
    expect(applyCategoryToMatchingMerchants(transfers, "1")).toMatchObject({ affectedCount: 0, undo: null });

    const payments = [
      row("3", "Payment", { categoryId: categoryId("Shopping"), categoryConfirmed: true }),
      row("4", "Payment"),
    ];
    expect(countApplySameMerchantMatches(payments, "3")).toBe(0);
  });
});
