import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const componentPath = new URL("../components/category-budgets.tsx", import.meta.url);
const homePath = new URL("../app/page.tsx", import.meta.url);
const insightsPath = new URL("../components/everyday-insights.tsx", import.meta.url);
const budgetPagePath = new URL("../app/budgets/page.tsx", import.meta.url);
const navigationPath = new URL("../components/bottom-nav.tsx", import.meta.url);
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
      "Delete this monthly budget from the active list?",
      "Deleted budgets ({archivedBudgets.length})",
      "Restore budget",
      "Set a monthly amount for the categories you want to watch",
    ]) {
      expect(component).toContain(copy);
    }
    expect(component).not.toMatch(/automatic budget|rollover|weekly budget|fortnightly budget|financial advice|tax deductible|claimable|ATO-ready|debt advice|credit advice|net worth|property profit|yield|equity|valuation|due soon|overdue|reminder/i);
  });

  it("keeps a compact budget preview on Home and the full manager in a subordinate view", async () => {
    const [home, insights, budgetPage, navigation, component] = await Promise.all([
      readFile(homePath, "utf8"),
      readFile(insightsPath, "utf8"),
      readFile(budgetPagePath, "utf8"),
      readFile(navigationPath, "utf8"),
      readFile(componentPath, "utf8"),
    ]);

    expect(home).toContain("<EverydayInsights");
    expect(insights).toContain("snapshot.budgets.slice(0, 3)");
    expect(insights).toContain('href="/budgets"');
    expect(budgetPage).toContain("<CategoryBudgets");
    expect(component).toContain('fetch("/api/account/budgets"');
    expect(navigation).not.toContain('label: "Budgets"');
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
