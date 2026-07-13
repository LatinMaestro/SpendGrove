import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const componentPath = new URL("../components/category-budgets.tsx", import.meta.url);
const homePath = new URL("../app/page.tsx", import.meta.url);
const routePath = new URL("../app/api/account/budgets/route.ts", import.meta.url);

describe("category budget UI and API boundaries", () => {
  it("shows user-entered monthly create, edit, archive and progress controls", async () => {
    const component = await readFile(componentPath, "utf8");

    for (const copy of [
      "Monthly budgets",
      "Create budget",
      "Used this month",
      "Budget left",
      "Over by",
      "Save budget changes",
      "Archive this monthly budget?",
      "Archived budgets ({archivedBudgets.length})",
      "Restore budget",
      "Set a monthly amount for the categories you want to watch",
    ]) {
      expect(component).toContain(copy);
    }
    expect(component).not.toMatch(/automatic budget|rollover|weekly budget|fortnightly budget|financial advice|tax deductible|claimable|ATO-ready|debt advice|credit advice|net worth|property profit|yield|equity|valuation|due soon|overdue|reminder/i);
  });

  it("places budgets on Home without adding a navigation tab", async () => {
    const [home, component] = await Promise.all([
      readFile(homePath, "utf8"),
      readFile(componentPath, "utf8"),
    ]);

    expect(home).toContain("<CategoryBudgets");
    expect(home).toContain("accountPersistenceAvailable");
    expect(component).toContain('fetch("/api/account/budgets"');
    expect(home).not.toContain('href="/budgets"');
  });

  it("keeps the budget API authenticated with safe errors", async () => {
    const route = await readFile(routePath, "utf8");

    expect(route).toContain("getCurrentUserContext");
    expect(route).toContain("getCategoryBudgetSnapshot");
    expect(route).toContain("applyCategoryBudgetMutation");
    expect(route).toContain("CategoryBudgetConflictError");
    expect(route).not.toMatch(/console\.|error\.stack|DATABASE_URL|DIRECT_DATABASE_URL/);
  });

  it("states the no-double-count exclusions in beginner-friendly copy", async () => {
    const component = await readFile(componentPath, "utf8");

    expect(component).toContain("Transfers, split containers and loan repayment breakdowns are not added.");
    expect(component).toContain("Budgets reset each month and do not roll over.");
    expect(component).not.toMatch(/principal total|interest total|fee total|loan balance|property statistic|tax statistic/i);
  });
});
