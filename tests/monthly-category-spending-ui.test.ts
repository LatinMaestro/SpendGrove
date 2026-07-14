import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const transactions = readFileSync("components/durable-manual-transactions.tsx", "utf8");
const chart = readFileSync("components/monthly-category-spending.tsx", "utf8");
const shell = readFileSync("components/app-shell.tsx", "utf8");

describe("monthly category spending presentation", () => {
  it("places the whole-month chart between the month toolbar and transaction list", () => {
    expect(transactions.indexOf('aria-label="Transaction month and search"')).toBeLessThan(transactions.indexOf("<MonthlyCategoryChart"));
    expect(transactions.indexOf("<MonthlyCategoryChart")).toBeLessThan(transactions.indexOf('aria-labelledby="transaction-list-heading"'));
    expect(transactions).toContain("spending={categorySpending}");
    expect(transactions).not.toContain("spending={filteredTransactions}");
  });

  it("keeps search list-only and adds a removable same-month category filter", () => {
    expect(transactions).toContain("categoryFilteredTransactions");
    expect(transactions).toContain("category filter");
    expect(transactions).toContain("Clear filter");
    expect(transactions).toContain("Search is limited to {selectedMonthLabel}");
    expect(transactions).toContain("setShowBreakdown(false); setCategoryFilter(null); setSelectedMonth");
  });

  it("provides visible and accessible chart and breakdown actions", () => {
    expect(chart).toContain('role="img"');
    expect(chart).toContain("<title>Spending by category for {monthLabel}</title>");
    expect(chart).toContain("<desc id={descriptionId}>{description}</desc>");
    expect(chart).toContain("View spending breakdown for");
    expect(chart).toContain("Back to transactions");
    expect(chart).toContain("transactions");
    expect(chart).toContain("No spending to show");
    expect(chart).toContain("Expense categories will appear here when this month has transactions.");
  });

  it("uses text labels and compact responsive sizing without colour-only meaning", () => {
    expect(chart).toContain("Category spending legend for");
    expect(chart).toContain("{segment.name}");
    expect(chart).toContain("formatAudFromCents(segment.amountCents)");
    expect(chart).toContain("h-32 w-32 sm:h-36 sm:w-36");
    expect(chart).toContain("truncate");
    expect(chart).not.toContain("animate-");
  });

  it("does not add a primary destination or expose private source fields", () => {
    for (const destination of ["Home", "Transactions", "Loans", "Import", "Settings"]) {
      expect(shell).toContain(destination);
    }
    const surfaces = transactions + chart;
    expect(surfaces).not.toMatch(/raw csv|bank account|bsb|card reference|customer identifier|exact property address/i);
    expect(chart).not.toMatch(/property profit|tax|loan balance|net worth|equity|valuation/i);
  });
});
