import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const componentPath = new URL("../components/everyday-insights.tsx", import.meta.url);
const homePath = new URL("../app/page.tsx", import.meta.url);
const routePath = new URL("../app/api/account/insights/route.ts", import.meta.url);

describe("everyday dashboard and trend insight UI", () => {
  it("shows only contract-approved transparent metrics and empty states", async () => {
    const component = await readFile(componentPath, "utf8");

    for (const copy of [
      "This month at a glance",
      "Spending this month",
      "Compared with last month",
      "Budget progress",
      "Regular payments",
      "Add another month of transactions to see a comparison",
      "Your reviewed everyday transactions, kept simple.",
    ]) {
      expect(component).toContain(copy);
    }
  });

  it("uses neutral up, down and unchanged comparison copy", async () => {
    const component = await readFile(componentPath, "utf8");

    expect(component).toContain("You spent more than last month");
    expect(component).toContain("You spent less than last month");
    expect(component).toContain("Spending is about the same as last month");
    expect(component).not.toMatch(/bad spending|overspending problem|you should|you must cut|guaranteed forecast/i);
  });

  it("keeps Property, tax, loan-balance and advice statistics out of the dashboard", async () => {
    const component = await readFile(componentPath, "utf8");

    expect(component).not.toMatch(/net worth|property profit|property yield|equity|valuation|investment performance|deductible|claimable|ATO-ready|tax liability|loan balance|principal total|interest total|debt advice|credit advice|AI advice/i);
    expect(component).toContain("Split containers and loan repayment breakdowns are not added again");
  });

  it("places the overview on Home without adding a navigation tab", async () => {
    const [home, component] = await Promise.all([
      readFile(homePath, "utf8"),
      readFile(componentPath, "utf8"),
    ]);

    expect(home).toContain("<EverydayInsights");
    expect(component).toContain('fetch("/api/account/insights"');
    expect(home).not.toContain('href="/insights"');
  });

  it("keeps the read-only API authenticated and error-safe", async () => {
    const route = await readFile(routePath, "utf8");

    expect(route).toContain("getCurrentUserContext");
    expect(route).toContain("getEverydayInsights");
    expect(route).toContain("Sign in to view everyday insights.");
    expect(route).not.toMatch(/console\.|error\.stack|DATABASE_URL|DIRECT_DATABASE_URL/);
    expect(route).not.toContain("POST");
  });
});
