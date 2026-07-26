import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const componentPath = new URL("../components/durable-manual-transactions.tsx", import.meta.url);

async function source() {
  return readFile(componentPath, "utf8");
}

describe("Phase C1 responsive transaction ledger polish", () => {
  it("provides the same bounded Direction and Category criteria on mobile and desktop", async () => {
    const component = await source();

    expect(component).toContain("Filter transactions");
    expect(component).toContain("lg:hidden");
    expect(component).toContain("lg:grid lg:grid-cols-[1fr_1fr_auto]");
    expect(component).toContain('<option value="ALL">All directions</option>');
    expect(component).toContain('<option value="EXPENSE">Money out</option>');
    expect(component).toContain('<option value="INCOME">Money in</option>');
    expect(component).toContain('<option value="TRANSFER">Transfers</option>');
    expect(component).toContain("availableLedgerCategories.map");
    expect(component).toContain("Filters apply only to {selectedMonthLabel} and are not saved.");
  });

  it("keeps search transient and tied to the polite results summary", async () => {
    const component = await source();

    expect(component).toContain('type="search"');
    expect(component).toContain("aria-describedby={resultSummaryId}");
    expect(component).toContain('const resultSummaryId = "transaction-result-summary"');
    expect(component).toContain('role="status"');
    expect(component).toContain('aria-live="polite"');
    expect(component).toContain('aria-atomic="true"');
    expect(component).toContain("aria-busy={!isReady}");
    expect(component).toContain("activeCriterionCount");
  });

  it("centralises complete recovery without changing the selected month", async () => {
    const component = await source();
    const helper = component.slice(
      component.indexOf("function clearAllCriteria()"),
      component.indexOf("function clearNonSearchFilters()"),
    );

    expect(helper).toContain('setSearchQuery("")');
    expect(helper).toContain('setLedgerDirectionFilter("ALL")');
    expect(helper).toContain('setLedgerCategoryFilter("ALL")');
    expect(helper).toContain("setCategoryFilter(null)");
    expect(helper).toContain("setShowBreakdown(false)");
    expect(helper).not.toContain("setSelectedMonth");
    expect(component).toContain("Clear search and filters");
    expect(component).toContain("onClick={clearAllCriteria}");
    expect(component).toContain("Search and filters apply only to {selectedMonthLabel}.");
  });

  it("resets only a stale transient ledger Category after a completed load", async () => {
    const component = await source();
    const staleGuard = component.slice(
      component.indexOf('if (!isReady || ledgerCategoryFilter === "ALL") return;'),
      component.indexOf("const categoryFilteredTransactions"),
    );

    expect(staleGuard).toContain("availableLedgerCategories.some");
    expect(staleGuard).toContain('setLedgerCategoryFilter("ALL")');
    expect(staleGuard).not.toContain("setSearchQuery");
    expect(staleGuard).not.toContain("setLedgerDirectionFilter");
    expect(staleGuard).not.toContain("setCategoryFilter");
  });

  it("closes Category breakdown when direct filters change", async () => {
    const component = await source();
    const directionHandler = component.slice(
      component.indexOf("function changeDirectionFilter"),
      component.indexOf("function changeCategoryFilter"),
    );
    const categoryHandler = component.slice(
      component.indexOf("function changeCategoryFilter"),
      component.indexOf("function changeMonth"),
    );

    expect(directionHandler).toContain("setShowBreakdown(false)");
    expect(directionHandler).toContain("setLedgerDirectionFilter(value)");
    expect(categoryHandler).toContain("setShowBreakdown(false)");
    expect(categoryHandler).toContain("setLedgerCategoryFilter(value)");
  });

  it("preserves transaction lifecycle, charts, mobile cards and the desktop table", async () => {
    const component = await source();

    expect(component).toContain("<MonthlyCategoryChart");
    expect(component).toContain("<CategoryBreakdownView");
    expect(component).toContain("<TransactionPropertyLinkPanel");
    expect(component).toContain('title="Transaction details"');
    expect(component).toContain('title="Delete transaction?"');
    expect(component).toContain("bg-surface-base lg:hidden");
    expect(component).toContain('className="w-full table-fixed border-collapse text-left text-sm"');
    expect(component).toContain('aria-label={"Details for " + transaction.description}');
  });

  it("does not introduce persistence, saved-view language or new query behaviour", async () => {
    const component = await source();

    expect(component).toContain("const ledgerFilteredTransactions = useMemo");
    expect(component).toContain("if (!query) return ledgerFilteredTransactions");
    expect(component).not.toMatch(/localStorage|sessionStorage|URLSearchParams/);
    expect(component).not.toMatch(/Save view|Saved view|Default view/);
    expect(component).not.toContain("loadAllTransactions");
    expect(component).not.toContain("Select all transactions");
  });
});
