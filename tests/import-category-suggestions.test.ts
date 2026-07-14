import { describe, expect, it } from "vitest";
import { parseCsvDocument, scanCsvDocument } from "@/lib/csv-import";
import { suggestImportReviewCategory } from "@/lib/import-category-suggestions";
import {
  applyCategoryToSameMerchant,
  createTransientImportReviewRows,
  updateImportReviewDetails,
} from "@/lib/import-review";
import { getManualCategory, manualCategories } from "@/lib/manual-categories";
import { emptyLocalMerchantData, saveConfirmedMerchantRule } from "@/lib/merchant-rules";

function categoryName(categoryId: string) {
  return getManualCategory(categoryId)?.name;
}

describe("import category suggestions", () => {
  it.each([
    ["Domino's Wynnum", "Domino's", "Coffee / takeaway"],
    ["Bunnings Warehouse Fictional Suburb", "Bunnings", "Home maintenance"],
    ["Translink go card", "Translink", "Public transport"],
    ["Uber trip", "Uber", "Rideshare / taxi"],
    ["Uber Eats order", "Uber Eats", "Coffee / takeaway"],
    ["AGL electricity", "AGL", "Electricity"],
    ["Loan repayment", "Loan repayment", "Loan repayment"],
    ["Credit card payment", "Credit card payment", "Credit card payment"],
    ["Internal transfer", "Internal transfer", "Transfer"],
  ])("suggests a reviewable category for %s", (input, expectedMerchant, expectedCategory) => {
    const suggestion = suggestImportReviewCategory(input, emptyLocalMerchantData());

    expect(suggestion.merchantName).toBe(expectedMerchant);
    expect(categoryName(suggestion.categoryId)).toBe(expectedCategory);
    expect(suggestion.requiresReview).toBe(true);
    expect(suggestion.source).not.toBe("FALLBACK");
  });

  it.each([
    ["Pizza for team", "Coffee / takeaway"],
    ["Sushi lunch", "Coffee / takeaway"],
    ["RED ROOSTER 4821", "Coffee / takeaway"],
    ["KFC order 7788", "Coffee / takeaway"],
    ["DoorDash 8842", "Coffee / takeaway"],
  ])("uses conservative word-boundary food rules for %s", (description, expectedCategory) => {
    const suggestion = suggestImportReviewCategory(description, emptyLocalMerchantData(), description);
    expect(categoryName(suggestion.categoryId)).toBe(expectedCategory);
    expect(suggestion).toMatchObject({ source: "KEYWORD", confidence: "HIGH", requiresReview: true });
  });

  it("does not match food keywords embedded inside unrelated words", () => {
    const suggestion = suggestImportReviewCategory("Sushiko consulting", emptyLocalMerchantData());
    expect(categoryName(suggestion.categoryId)).toBe("Needs review");
  });

  it("keeps unclear recipient payments in Needs review", () => {
    const suggestion = suggestImportReviewCategory(
      "Bank transfer to Alex",
      emptyLocalMerchantData(),
      "Bank transfer to Alex",
    );

    expect(suggestion.merchantName).toBe("Bank transfer to Alex");
    expect(categoryName(suggestion.categoryId)).toBe("Needs review");
    expect(suggestion).toMatchObject({
      source: "FALLBACK",
      confidence: "LOW",
      requiresReview: true,
    });
  });

  it("uses a strong safe context clue without silently finalising it", () => {
    const suggestion = suggestImportReviewCategory(
      "Bank transfer to Alex",
      emptyLocalMerchantData(),
      "Bank transfer to Alex · Gift",
    );

    expect(categoryName(suggestion.categoryId)).toBe("Gifts");
    expect(suggestion).toMatchObject({
      source: "KEYWORD",
      confidence: "HIGH",
      requiresReview: true,
    });
  });

  it("keeps unknown merchants reviewable instead of silently finalising a category", () => {
    const suggestion = suggestImportReviewCategory("Fictional Corner Shop", emptyLocalMerchantData());

    expect(categoryName(suggestion.categoryId)).toBe("Needs review");
    expect(suggestion).toMatchObject({
      source: "FALLBACK",
      confidence: "LOW",
      requiresReview: true,
    });
  });

  it("uses canonical merchant names when applying a category to the same merchant", () => {
    const document = parseCsvDocument([
      "01/06/2026,-12.50,Domino's Wynnum",
      "02/06/2026,-18.00,Domino's Tingalpa",
      "03/06/2026,-22.00,Coles Fictional Suburb",
    ].join("\n"));
    const scan = scanCsvDocument(document, {
      0: "DATE",
      1: "AMOUNT",
      2: "DESCRIPTION",
    });
    const rows = createTransientImportReviewRows(document, scan.columns, scan.mapping);
    const diningOut = manualCategories.find((category) => category.name === "Dining out")!;

    expect(rows.map((row) => row.merchantName)).toEqual(["Domino's", "Domino's", "Coles"]);

    const reviewed = updateImportReviewDetails(rows, rows[0].id, {
      merchantName: rows[0].merchantName,
      categoryId: diningOut.id,
      editType: "CATEGORY_EDIT",
    });
    const applied = applyCategoryToSameMerchant(reviewed, rows[0].id);

    expect(applied[0]).toMatchObject({ categoryId: diningOut.id, reviewState: "APPLIED_TO_MATCH" });
    expect(applied[1]).toMatchObject({ categoryId: diningOut.id, reviewState: "APPLIED_TO_MATCH" });
    expect(applied[2].categoryId).not.toBe(diningOut.id);
  });

  it("keeps review rows free of synthetic private identifier fragments", () => {
    const document = parseCsvDocument([
      "01/06/2026,-12.50,Domino's Wynnum terminal 76543210 card xx4321",
      "02/06/2026,-18.00,OSKO transfer to Alex Recipient account 12345678 reference 987654321",
    ].join("\n"));
    const scan = scanCsvDocument(document, {
      0: "DATE",
      1: "AMOUNT",
      2: "DESCRIPTION",
    });
    const rows = createTransientImportReviewRows(document, scan.columns, scan.mapping);
    const serialized = JSON.stringify(rows);

    expect(rows[0].merchantName).toBe("Domino's");
    expect(rows[1]).toMatchObject({
      merchantName: "OSKO payment to Alex",
      description: "OSKO payment to Alex",
    });
    expect(categoryName(rows[1].categoryId)).toBe("Needs review");
    expect(serialized).not.toContain("76543210");
    expect(serialized).not.toContain("4321");
    expect(serialized).not.toContain("Alex Recipient");
    expect(serialized).not.toContain("12345678");
    expect(serialized).not.toContain("987654321");
  });
  it("keeps positive takeaway refunds as money in", () => {
    const suggestion = suggestImportReviewCategory(
      "Red Rooster refund",
      emptyLocalMerchantData(),
      "Red Rooster refund",
      2599,
    );
    expect(categoryName(suggestion.categoryId)).toBe("Other income");
    expect(suggestion).toMatchObject({ source: "FALLBACK", requiresReview: true });
  });

  it("does not apply income wording to negative money out", () => {
    const suggestion = suggestImportReviewCategory(
      "ATO refund adjustment",
      emptyLocalMerchantData(),
      "ATO refund adjustment",
      -2599,
    );
    expect(categoryName(suggestion.categoryId)).toBe("Needs review");
    expect(suggestion).toMatchObject({ source: "FALLBACK", requiresReview: true });
  });

  it("ignores an incompatible user-confirmed merchant rule", () => {
    const expenseCategory = manualCategories.find((category) => category.name === "Coffee / takeaway")!;
    const learned = saveConfirmedMerchantRule(emptyLocalMerchantData(), {
      merchantName: "Red Rooster",
      categoryId: expenseCategory.id,
      now: new Date("2026-07-14T00:00:00.000Z"),
    });
    const suggestion = suggestImportReviewCategory(
      "Red Rooster",
      learned,
      "Red Rooster refund",
      2599,
    );
    expect(categoryName(suggestion.categoryId)).toBe("Other income");
    expect(suggestion.source).toBe("FALLBACK");
  });

  it("uses direction-compatible fallbacks for uncategorised rows", () => {
    expect(categoryName(suggestImportReviewCategory("Unknown credit", emptyLocalMerchantData(), undefined, 1000).categoryId)).toBe("Other income");
    expect(categoryName(suggestImportReviewCategory("Unknown debit", emptyLocalMerchantData(), undefined, -1000).categoryId)).toBe("Needs review");
  });
});
