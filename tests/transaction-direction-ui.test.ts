import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("transaction direction user experience", () => {
  it("shows quiet direction labels during CSV review", () => {
    const row = source("components/import-review-row-card.tsx");
    expect(row).toContain("transactionDirectionLabel");
    expect(row).toContain("displayedDirection");
    expect(row).toContain("formatReviewDate(row.date)} · {displayedDirection}");
  });

  it("limits the category picker to direction-compatible choices", () => {
    const picker = source("components/review-category-picker.tsx");
    expect(picker).toContain("deriveTransactionType");
    expect(picker).toContain("Choose a category for {directionLabel}");
    expect(picker).toContain("compatible categories");
    expect(picker).toContain("categoryTypeIsAllowed");
  });

  it("shows correction guidance only for inconsistent transactions", () => {
    for (const path of [
      "components/durable-manual-transactions.tsx",
      "components/manual-transactions.tsx",
    ]) {
      const transactionUi = source(path);
      expect(transactionUi).toContain("transactionNeedsDirectionCorrection");
      expect(transactionUi).toContain("Needs correction");
      expect(transactionUi).toContain("This transaction needs correction");
      expect(transactionUi).toContain("The amount and transaction direction do not agree.");
      expect(transactionUi).toContain("Review transaction");
      expect(transactionUi).toContain('mode: "duplicate", draft: draftForDirectionCorrection(transaction)');
      expect(transactionUi).not.toContain("global direction warning");
    }
  });

  it("uses beginner-facing money direction wording", () => {
    const durable = source("components/durable-manual-transactions.tsx");
    expect(durable).toContain('EXPENSE: "Money out"');
    expect(durable).toContain('INCOME: "Money in"');
    expect(durable).not.toContain("TYPE_SIGN_MISMATCH");
    expect(durable).not.toContain("CATEGORY_DIRECTION_MISMATCH");
  });
});
