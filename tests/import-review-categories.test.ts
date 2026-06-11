import { describe, expect, it } from "vitest";
import { manualCategories } from "@/lib/manual-categories";

const requiredImportReviewCategories = [
  "Groceries",
  "Dining out",
  "Fuel",
  "Public transport",
  "Electricity",
  "Internet",
  "Insurance",
  "Transfer",
  "Savings transfer",
  "Credit card payment",
  "Loan repayment",
  "Salary / wages",
  "Refunds / rebates",
  "Work travel",
  "Uniforms / protective clothing",
  "Training / education",
  "Professional memberships",
  "Home office",
  "Tools / equipment",
  "Donations",
  "Tax agent fees",
  "Other deductible expense",
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
      "Work and tax",
      "Review",
    ]));
  });

  it("includes everyday, household, financial, transfer, income, work/tax and review choices", () => {
    const names = new Set(manualCategories.map((category) => category.name));

    requiredImportReviewCategories.forEach((name) => {
      expect(names.has(name), `Missing import review category: ${name}`).toBe(true);
    });
    expect(names.has("Transfer to review")).toBe(false);
  });
});
