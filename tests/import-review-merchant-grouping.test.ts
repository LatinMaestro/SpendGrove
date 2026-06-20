import { describe, expect, it } from "vitest";
import { suggestImportReviewCategory } from "@/lib/import-category-suggestions";
import { applyCategoryToMatchingMerchants, countApplySameMerchantMatches } from "@/lib/import-review-bulk";
import { canonicalMerchantGroupingKey } from "@/lib/import-review-merchant-identity";
import { learnMerchantCategory } from "@/lib/import-review-merchant-learning";
import type { ImportReviewRow } from "@/lib/import-review";
import { manualCategories } from "@/lib/manual-categories";
import { emptyLocalMerchantData, serializeMerchantRuleStorage } from "@/lib/merchant-rules";

const categoryId = (name: string) => manualCategories.find((category) => category.name === name)!.id;
function row(id: string, merchantName: string, overrides: Partial<ImportReviewRow> = {}): ImportReviewRow {
  return { id, rowNumber: Number(id.replace(/\D/g, "")) || 1, date: "2026-06-19", amountCents: -1000, description: merchantName, merchantName, categoryId: categoryId("Needs review"), action: "IMPORT", warningCodes: [], suggestionSource: "FALLBACK", suggestionConfidence: "LOW", suggestionReason: "Review", categoryConfirmed: false, merchantEdited: false, reviewState: "UNREVIEWED", ...overrides };
}

describe("safe merchant grouping across reference tokens", () => {
  it.each([
    ["Kindred Early 84930271", "kindred early"],
    ["84930271 Kindred Early", "kindred early"],
    ["Kindred INV-A93B772 Early", "kindred early"],
    ["MetLife policy 88392011", "metlife"],
    ["REF-Z91X72 MetLife", "metlife"],
    ["Superhero transfer TRX-91A72", "superhero"],
    ["Superhero confirmation 81Z-992A", "superhero"],
  ])("groups %s using stable merchant words", (input, expected) => {
    expect(canonicalMerchantGroupingKey(input)).toBe(expected);
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

  it("does not offer bulk grouping for ambiguous transfers, payments or generic labels", () => {
    const transfers = [
      row("1", "Bank transfer to CBA", { categoryId: categoryId("Transfer"), categoryConfirmed: true }),
      row("2", "Bank transfer to CBA"),
    ];
    expect(countApplySameMerchantMatches(transfers, "1")).toBe(0);
    expect(applyCategoryToMatchingMerchants(transfers, "1")).toMatchObject({ affectedCount: 0, undo: null });

    const genericRows = [
      row("3", "Payment", { categoryId: categoryId("Shopping"), categoryConfirmed: true }),
      row("4", "Payment"),
      row("5", "Withdrawal 88392011", { categoryId: categoryId("Shopping"), categoryConfirmed: true }),
      row("6", "Withdrawal 77102944"),
      row("7", "CBA 552211", { categoryId: categoryId("Transfer"), categoryConfirmed: true }),
      row("8", "CBA 448822"),
    ];
    expect(countApplySameMerchantMatches(genericRows, "3")).toBe(0);
    expect(countApplySameMerchantMatches(genericRows, "5")).toBe(0);
    expect(countApplySameMerchantMatches(genericRows, "7")).toBe(0);
  });

  it("groups named Superhero transfer variants without grouping generic transfer rows", () => {
    const rows = [
      row("1", "Superhero transfer TRX-91A72", { categoryId: categoryId("Investment contribution"), categoryConfirmed: true }),
      row("2", "Superhero transfer TRX-72B91"),
      row("3", "Bank transfer to CBA"),
    ];
    expect(countApplySameMerchantMatches(rows, "1")).toBe(1);
    expect(applyCategoryToMatchingMerchants(rows, "1").rows[1]).toMatchObject({
      categoryId: categoryId("Investment contribution"),
      reviewState: "APPLIED_TO_MATCH",
    });
  });

  it("reuses a learned canonical category without storing reference fragments", () => {
    const learned = learnMerchantCategory(emptyLocalMerchantData(), {
      merchantName: "Kindred Early INV-A93B772",
      categoryId: categoryId("Training / education"),
    });
    expect(suggestImportReviewCategory("Kindred Early REF-Z91X72", learned)).toMatchObject({
      merchantName: "Kindred Early",
      categoryId: categoryId("Training / education"),
      source: "USER_RULE",
    });
    const serialized = serializeMerchantRuleStorage(learned);
    expect(serialized).toContain("Kindred Early");
    expect(serialized).not.toMatch(/A93B772|Z91X72|invoice|reference/i);
  });
});
