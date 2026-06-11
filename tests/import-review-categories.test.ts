import { describe, expect, it } from "vitest";
import { manualCategories } from "@/lib/manual-categories";

const requiredImportReviewCategories = [
  "Groceries",
  "Dining out",
  "Fuel",
  "Electricity",
  "Internet",
  "Insurance",
  "Savings transfer",
  "Credit card payment",
  "Loan repayment",
  "Transfer to review",
  "Salary / wages",
  "Refunds / rebates",
  "Uncategorised",
  "Needs review",
];

describe("import review category catalogue", () => {
  it("includes the full Phase 1 groups needed for imported bank transactions", () => {
    const groups = new Set(manualCategories.map((category) => category.group));

    expect(groups).toEqual(new Set([
      "Income",
      "Everyday spending",
      "Bills and household",
      "Financial",
      "Review",
    ]));
  });

  it("includes everyday, household, financial, transfer, income and review choices", () => {
    const names = new Set(manualCategories.map((category) => category.name));

    requiredImportReviewCategories.forEach((name) => {
      expect(names.has(name), `Missing import review category: ${name}`).toBe(true);
    });
  });
});
