import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const transactionUiPath = new URL("../components/durable-manual-transactions.tsx", import.meta.url);
const transactionRoutePath = new URL("../app/api/account/manual-transactions/route.ts", import.meta.url);
const transactionServicePath = new URL("../src/server/manual-transactions.ts", import.meta.url);
const recurringUiPath = new URL("../components/recurring-suggestions.tsx", import.meta.url);
const budgetUiPath = new URL("../components/category-budgets.tsx", import.meta.url);
const loansUiPath = new URL("../components/loans-manager.tsx", import.meta.url);
const propertyActivityPath = new URL("../components/property-record-keeping-activity.tsx", import.meta.url);

describe("Phase 4 Milestone 3 second client-review hardening", () => {
  it("uses the latest eligible populated month only for the initial empty-month request", async () => {
    const [ui, route, service] = await Promise.all([
      readFile(transactionUiPath, "utf8"),
      readFile(transactionRoutePath, "utf8"),
      readFile(transactionServicePath, "utf8"),
    ]);

    expect(ui).toContain("&initial=true");
    expect(ui).toContain("initialMonthRequest.current");
    expect(route).toContain("fallbackToLatest");
    expect(service).toContain("latestActiveDate");
    expect(service).toContain("orderBy: [{ date: \"desc\" }, { updatedAt: \"desc\" }]");
    expect(service).toContain('timeZone: "Australia/Brisbane"');
    expect(ui).toContain('aria-label="Previous month"');
    expect(ui).toContain('aria-label="Next month"');
  });

  it("keeps regular-payment suggestions compact until one suggestion is edited", async () => {
    const source = await readFile(recurringUiPath, "utf8");

    expect(source).toContain("visibleRecurringSuggestions(uniqueSuggestions, showAllSuggestions)");
    expect(source).toContain("editingSuggestionKey === suggestion.key");
    expect(source).toContain("Edit details");
    expect(source).toContain("Why was this suggested?");
    expect(source).toContain("Review all (");
    expect(source).toContain("Show fewer");
    expect(source).toContain("Confirm");
    expect(source).toContain("Dismiss");
    expect(source).toContain("Cancel");
    expect(source).toContain("<DraftFields");
  });

  it("keeps Loan Accounts compact and caps both recent history lists at three", async () => {
    const [source, propertyActivity] = await Promise.all([
      readFile(loansUiPath, "utf8"),
      readFile(propertyActivityPath, "utf8"),
    ]);

    expect(source).toContain("selectedLoanId");
    expect(source).toContain("View loan");
    expect(source).toContain("Back to loans");
    expect(source).not.toContain("Close details");
    expect(source).toContain("visibleRepayments.slice(0, 3)");
    expect(propertyActivity).toContain("propertyTransactions.slice(0, 3)");
    expect(source).toContain("View all repayments (");
    expect(propertyActivity).toContain("View all property transactions (");
    expect(source).toContain("Needs review");
    expect(source).not.toContain("Linked everyday transactions");
  });

  it("hides monthly budget creation until requested and supports safe cancellation", async () => {
    const source = await readFile(budgetUiPath, "utf8");

    expect(source).toContain("useState(false)");
    expect(source).toContain("Add budget");
    expect(source).toContain("!showCreateForm ? (");
    expect(source).toContain("setShowCreateForm(false)");
    expect(source).toContain("Cancel");
    expect(source).toContain("Used this month");
    expect(source).toContain("Budget left");
  });

  it("does not add technical or prohibited beginner-facing concepts", async () => {
    const [recurring, budgets, loans] = await Promise.all([
      readFile(recurringUiPath, "utf8"),
      readFile(budgetUiPath, "utf8"),
      readFile(loansUiPath, "utf8"),
    ]);
    const changedUi = recurring + budgets + loans;

    expect(changedUi).not.toMatch(/confidence band|merchant normalisation|cashflow entity|tax deductible|ATO-ready|net worth|property yield|property valuation/i);
  });
});
