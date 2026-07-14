import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const transactionPage = readFileSync("app/transactions/page.tsx", "utf8");
const transactions = readFileSync("components/durable-manual-transactions.tsx", "utf8");
const csvImport = readFileSync("components/csv-import-foundation.tsx", "utf8");
const importReview = readFileSync("components/import-review-foundation.tsx", "utf8");
const importRow = readFileSync("components/import-review-row-card.tsx", "utf8");
const importCommit = readFileSync("components/import-commit-panel.tsx", "utf8");
const budgetPage = readFileSync("app/budgets/page.tsx", "utf8");
const budgets = readFileSync("components/category-budgets.tsx", "utf8");
const recurringPage = readFileSync("app/regular-payments/page.tsx", "utf8");
const recurring = readFileSync("components/recurring-suggestions.tsx", "utf8");

describe("Phase 4 Milestone 4 core workflow presentation", () => {
  it("uses compact month-scoped transaction rows with a focused detail surface", () => {
    expect(transactionPage).toContain('title="Transactions"');
    expect(transactions).toContain('aria-label="Transaction month and search"');
    expect(transactions).toContain('placeholder="Search this month"');
    expect(transactions).toContain("filteredTransactions");
    expect(transactions).toContain("divide-y divide-border");
    expect(transactions).toContain('title="Transaction details"');
    expect(transactions).toContain("TransactionPropertyLinkPanel");
    expect(transactions).toContain("Previous month");
    expect(transactions).toContain("Next month");
    expect(transactions).not.toContain("Manual and imported transactions are shown together");
  });

  it("shows the approved four-stage import journey without changing review decisions", () => {
    for (const label of ["Choose file", "Confirm columns", "Review", "Import"]) {
      expect(csvImport).toContain(label);
    }
    expect(csvImport).toContain("Step {step} of 4");
    expect(csvImport).toContain("How this import stays private");
    for (const decision of ["IMPORT", "SKIP", "MERGE"]) expect(importRow).toContain(decision);
    expect(importReview).toContain("<ImportReviewRowCard");
    expect(importCommit).toContain("sticky bottom-20");
    expect(importCommit).toContain("disabled={isCommitting || blockingRows.length > 0}");
  });

  it("keeps uncommon import controls behind progressive disclosure", () => {
    expect(importReview).toContain("Import settings");
    expect(importRow).toContain("More review options");
    expect(importRow.indexOf("More review options")).toBeLessThan(importRow.indexOf("Needs record-keeping review?"));
    expect(importRow).toContain('row.action === "IMPORT"');
    expect(importRow).toContain("Include in property records");
    expect(importRow).toContain("Review possible duplicate");
  });

  it("keeps budget creation contextual and management subordinate", () => {
    expect(budgetPage).toContain('title="Budgets"');
    expect(budgetPage).toContain("Back to Home");
    expect(budgets).toContain("!showCreateForm");
    expect(budgets).toContain("Add budget");
    expect(budgets).toContain("Cancel");
    expect(budgets).toContain("Used this month");
    expect(budgets).toContain("Budget left");
    expect(budgets).toContain("Deleted budgets");
    expect(budgets).toContain("divide-y divide-border");
  });

  it("keeps regular-payment review compact and reviewable", () => {
    expect(recurringPage).toContain('title="Regular payments"');
    expect(recurringPage).toContain("Back to Home");
    expect(recurring).toContain("visibleRecurringSuggestions");
    expect(recurring).toContain("editingSuggestionKey");
    expect(recurring).toContain("Why was this suggested?");
    expect(recurring).toContain("Confirm");
    expect(recurring).toContain("Dismiss");
    expect(recurring).toContain("Deleted regular payments");
    expect(recurring).not.toContain("High confidence");
  });

  it("does not introduce prohibited product language", () => {
    const beginnerSurface = [transactionPage, transactions, csvImport, importReview, importRow, budgetPage, budgets, recurringPage, recurring].join("\n");
    expect(beginnerSurface).not.toMatch(/net worth|property profit|property yield|equity valuation|ATO-ready|accountant approved|AI advice|bank connection/i);
  });
});
