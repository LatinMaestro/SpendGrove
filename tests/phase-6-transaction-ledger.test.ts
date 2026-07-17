import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function source() {
  return readFile(new URL("../components/durable-manual-transactions.tsx", import.meta.url), "utf8");
}

describe("Phase 6 desktop transaction ledger", () => {
  it("keeps the bounded selected-month server query", async () => {
    const component = await source();

    expect(component).toContain('fetch(`/api/account/manual-transactions?month=${encodeURIComponent(monthKey)}${initialQuery}`');
    expect(component).toContain("useLatestPopulatedFallback");
    expect(component).not.toContain("loadAllTransactions");
  });

  it("renders a semantic ledger only on large screens", async () => {
    const component = await source();

    expect(component).toContain('className="w-full table-fixed border-collapse text-left text-sm"');
    expect(component).toContain('<caption className="sr-only">{selectedMonthLabel} transactions</caption>');
    expect(component).toContain('<th scope="col" className="px-4 py-3">Date</th>');
    expect(component).toContain('<th scope="col" className="px-4 py-3">Transaction</th>');
    expect(component).toContain('<th scope="col" className="px-4 py-3">Category</th>');
    expect(component).toContain('<th scope="col" className="px-4 py-3">Direction</th>');
    expect(component).toContain('className="hidden overflow-hidden rounded-2xl border border-border bg-surface-base lg:block"');
  });

  it("retains the compact non-table list below the desktop breakpoint", async () => {
    const component = await source();

    expect(component).toContain("bg-surface-base lg:hidden");
    expect(component).toContain('aria-label={"Details for " + transaction.description}');
    expect(component).toContain("grid-cols-[1fr_auto]");
    expect(component).not.toContain("overflow-x-auto");
  });

  it("adds transient direction and category filters without storing them", async () => {
    const component = await source();

    expect(component).toContain('useState<LedgerDirectionFilter>("ALL")');
    expect(component).toContain('useState("ALL")');
    expect(component).toContain('<option value="EXPENSE">Money out</option>');
    expect(component).toContain('<option value="INCOME">Money in</option>');
    expect(component).toContain('<option value="TRANSFER">Transfers</option>');
    expect(component).toContain("availableLedgerCategories.map");
    expect(component).toContain('ledgerCategoryFilter !== "ALL"');
    expect(component).not.toContain("localStorage");
    expect(component).not.toContain("sessionStorage");
  });

  it("keeps search scoped after the selected-month ledger filters", async () => {
    const component = await source();

    expect(component).toContain("const ledgerFilteredTransactions = useMemo");
    expect(component).toContain("if (!query) return ledgerFilteredTransactions");
    expect(component).toContain("ledgerFilteredTransactions.filter");
    expect(component).toContain("Search is limited to {selectedMonthLabel}");
  });

  it("keeps details and correction guidance reachable without bulk controls", async () => {
    const component = await source();

    expect(component).toContain(">View</button>");
    expect(component).toContain("Needs correction");
    expect(component).toContain("Possible CSV match");
    expect(component).not.toContain("Select all transactions");
    expect(component).not.toContain("Bulk delete");
  });
});
