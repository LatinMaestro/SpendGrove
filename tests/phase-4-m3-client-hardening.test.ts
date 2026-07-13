import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const transactionUiPath = new URL("../components/durable-manual-transactions.tsx", import.meta.url);
const transactionServicePath = new URL("../src/server/manual-transactions.ts", import.meta.url);
const categoryPickerPath = new URL("../components/review-category-picker.tsx", import.meta.url);
const reviewRowPath = new URL("../components/import-review-row-card.tsx", import.meta.url);
const budgetUiPath = new URL("../components/category-budgets.tsx", import.meta.url);
const recurringUiPath = new URL("../components/recurring-suggestions.tsx", import.meta.url);
const insightUiPath = new URL("../components/everyday-insights.tsx", import.meta.url);

describe("Phase 4 Milestone 3 client-feedback UI hardening", () => {
  it("uses a month-focused transaction view with accessible navigation and concise empty states", async () => {
    const [ui, service] = await Promise.all([
      readFile(transactionUiPath, "utf8"),
      readFile(transactionServicePath, "utf8"),
    ]);
    expect(ui).toContain('aria-label="Previous month"');
    expect(ui).toContain('aria-label="Next month"');
    expect(ui).toContain("No transactions in {selectedMonthLabel}.");
    expect(ui).toContain("?month=");
    expect(service).toContain("listDurableManualTransactionsForMonth");
    expect(service).toContain('timeZone: "Australia/Brisbane"');
    expect(service).toContain("date: { gte: dateFrom, lt: dateTo }");
  });

  it("keeps category search local, responsive and accessible", async () => {
    const source = await readFile(categoryPickerPath, "utf8");
    expect(source).toContain('aria-label="Search categories"');
    expect(source).toContain("No categories found.");
    expect(source).toContain("useMemo");
    expect(source).toContain("toLocaleLowerCase");
    expect(source).not.toMatch(/fetch\s*\(/);
  });

  it("reveals Property choices only after the user opts in", async () => {
    const [reviewRow, manualUi] = await Promise.all([
      readFile(reviewRowPath, "utf8"),
      readFile(transactionUiPath, "utf8"),
    ]);
    for (const source of [reviewRow, manualUi]) {
      expect(source).toContain("Include in property records");
      expect(source).toContain('type="checkbox"');
    }
    expect(reviewRow).toContain("propertyEnabled &&");
    expect(reviewRow).toContain("onPropertyLinkChange(null)");
    expect(manualUi).toContain("propertyLinkEnabled &&");
  });

  it("uses Delete wording while preserving the internal recovery lifecycle", async () => {
    const [budgetUi, recurringUi] = await Promise.all([
      readFile(budgetUiPath, "utf8"),
      readFile(recurringUiPath, "utf8"),
    ]);
    expect(budgetUi).toContain("Delete this monthly budget");
    expect(budgetUi).toContain("Deleted budgets");
    expect(budgetUi).toContain("Restore budget");
    expect(recurringUi).toContain("Deleted regular payments");
    expect(recurringUi).toContain("Restore regular payment");
    expect(budgetUi).toContain('"ARCHIVE"');
    expect(recurringUi).toContain('"ARCHIVE"');
  });

  it("shows calm category-level comparisons without Property, tax or loan statistics", async () => {
    const source = await readFile(insightUiPath, "utf8");
    expect(source).toContain("more than last month");
    expect(source).toContain("less than last month");
    expect(source).toContain("About the same");
    expect(source).toContain("New this month");
    expect(source).not.toMatch(/net worth|valuation|equity|deductible|tax liability|loan balance/i);
  });
});
