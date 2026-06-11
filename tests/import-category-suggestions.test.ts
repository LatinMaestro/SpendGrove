import { describe, expect, it } from "vitest";
import { parseCsvDocument, scanCsvDocument } from "@/lib/csv-import";
import { suggestImportReviewCategory } from "@/lib/import-category-suggestions";
import {
  applyCategoryToSameMerchant,
  createTransientImportReviewRows,
  updateImportReviewDetails,
} from "@/lib/import-review";
import { getManualCategory, manualCategories } from "@/lib/manual-categories";
import { emptyLocalMerchantData } from "@/lib/merchant-rules";

function categoryName(categoryId: string) {
  return getManualCategory(categoryId)?.name;
}

describe("import category suggestions", () => {
  it.each([
    ["Domino's Wynnum", "Domino's", "Dining out"],
    ["Bunnings Warehouse Fictional Suburb", "Bunnings", "Home maintenance"],
    ["Translink go card", "Translink", "Public transport"],
    ["Uber trip", "Uber", "Rideshare / taxi"],
    ["Uber Eats order", "Uber Eats", "Dining out"],
    ["AGL electricity", "AGL", "Electricity"],
    ["Loan repayment", "Loan repayment", "Loan repayment"],
    ["Credit card payment", "Credit card payment", "Credit card payment"],
    ["Bank transfer", "Bank transfer", "Transfer to review"],
  ])("suggests a reviewable category for %s", (input, expectedMerchant, expectedCategory) => {
    const suggestion = suggestImportReviewCategory(input, emptyLocalMerchantData());

    expect(suggestion.merchantName).toBe(expectedMerchant);
    expect(categoryName(suggestion.categoryId)).toBe(expectedCategory);
    expect(suggestion.requiresReview).toBe(true);
    expect(suggestion.source).not.toBe("FALLBACK");
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

  it("keeps canonical review rows free of synthetic private identifier fragments", () => {
    const document = parseCsvDocument([
      "01/06/2026,-12.50,Domino's Wynnum terminal 76543210 card xx4321",
      "02/06/2026,-18.00,OSKO transfer to Fictional Person account 12345678 reference 987654321",
    ].join("\n"));
    const scan = scanCsvDocument(document, {
      0: "DATE",
      1: "AMOUNT",
      2: "DESCRIPTION",
    });
    const rows = createTransientImportReviewRows(document, scan.columns, scan.mapping);
    const serialized = JSON.stringify(rows);

    expect(rows[0].merchantName).toBe("Domino's");
    expect(rows[1].merchantName).toBe("Bank transfer");
    expect(serialized).not.toContain("76543210");
    expect(serialized).not.toContain("4321");
    expect(serialized).not.toContain("Fictional Person");
    expect(serialized).not.toContain("12345678");
    expect(serialized).not.toContain("987654321");
  });
});
