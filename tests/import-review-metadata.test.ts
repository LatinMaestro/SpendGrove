import { describe, expect, it } from "vitest";
import { parseCsvDocument, scanCsvDocument } from "@/lib/csv-import";
import {
  createTransientImportReviewRows,
  updateImportReviewDetails,
} from "@/lib/import-review";
import {
  canSaveLocalMerchantRule,
  isRowPotentiallyDeductible,
  updateTaxReviewMetadata,
} from "@/lib/import-review-metadata";
import { manualCategories } from "@/lib/manual-categories";

function syntheticReviewRow() {
  const document = parseCsvDocument("01/06/2026,-45.00,Fictional Training Course");
  const scan = scanCsvDocument(document, {
    0: "DATE",
    1: "AMOUNT",
    2: "DESCRIPTION",
  });
  return createTransientImportReviewRows(document, scan.columns, scan.mapping)[0];
}

describe("transient import review metadata", () => {
  it("keeps potentially deductible metadata transient and user-overridable", () => {
    const row = syntheticReviewRow();
    const marked = updateTaxReviewMetadata({}, row.id, true);
    const unmarked = updateTaxReviewMetadata(marked, row.id, false);

    expect(isRowPotentiallyDeductible(marked, row.id)).toBe(true);
    expect(isRowPotentiallyDeductible(unmarked, row.id)).toBe(false);
    expect(marked).toEqual({ [row.id]: true });
    expect(JSON.stringify(marked)).not.toContain(row.merchantName);
    expect(JSON.stringify(marked)).not.toContain(row.description);
    expect(JSON.stringify(marked)).not.toContain(String(row.amountCents));
  });

  it("does not allow local rule learning from an unreviewed suggestion", () => {
    const row = syntheticReviewRow();
    expect(canSaveLocalMerchantRule(row)).toBe(false);
  });

  it("allows local rule learning after a manual category decision", () => {
    const row = syntheticReviewRow();
    const training = manualCategories.find((category) => category.name === "Training / education")!;
    const reviewed = updateImportReviewDetails([row], row.id, {
      merchantName: row.merchantName,
      categoryId: training.id,
      editType: "CATEGORY_EDIT",
    })[0];

    expect(reviewed.categoryConfirmed).toBe(true);
    expect(canSaveLocalMerchantRule(reviewed)).toBe(true);
  });

  it("allows local rule learning after an explicit suggestion confirmation", () => {
    const document = parseCsvDocument("01/06/2026,-20.00,Woolworths Fictional Suburb");
    const scan = scanCsvDocument(document, { 0: "DATE", 1: "AMOUNT", 2: "DESCRIPTION" });
    const row = createTransientImportReviewRows(document, scan.columns, scan.mapping)[0];
    const confirmed = updateImportReviewDetails([row], row.id, {
      merchantName: row.merchantName,
      categoryId: row.categoryId,
      editType: "CONFIRM_SUGGESTION",
    })[0];

    expect(confirmed.reviewState).toBe("CONFIRMED_SUGGESTION");
    expect(canSaveLocalMerchantRule(confirmed)).toBe(true);
  });
});
