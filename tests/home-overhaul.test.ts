import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homePage = readFileSync("app/page.tsx", "utf8");
const insights = readFileSync("components/everyday-insights.tsx", "utf8");
const onboarding = readFileSync("components/onboarding-prompt.tsx", "utf8");
const budgetPage = readFileSync("app/budgets/page.tsx", "utf8");
const recurringPage = readFileSync("app/regular-payments/page.tsx", "utf8");

describe("Phase 4 Milestone 4 Home redesign", () => {
  it("uses one compact monthly overview instead of the old hero", () => {
    expect(homePage).toContain('title="Home"');
    expect(homePage).toContain("EverydayInsights");
    expect(homePage).not.toContain("See what matters this month");
    expect(homePage).not.toContain("bg-brand-deepTeal p-6");
    expect(homePage).not.toContain("CategoryBudgets");
    expect(homePage).not.toContain("RecurringSuggestions");
  });

  it("keeps only the two approved quick tasks without duplication", () => {
    expect(homePage.match(/Import transactions/g)).toHaveLength(1);
    expect(homePage.match(/Add transaction/g)).toHaveLength(1);
  });

  it("limits budget and regular-payment previews to three", () => {
    expect(insights).toContain("snapshot.budgets.slice(0, 3)");
    expect(insights).toContain("snapshot.recurring.slice(0, 3)");
    expect(insights).toContain('href="/budgets"');
    expect(insights).toContain('href="/regular-payments"');
  });

  it("keeps category comparisons behind progressive disclosure", () => {
    expect(insights).toContain("<details");
    expect(insights).toContain("Category comparisons");
    expect(insights).toContain("categoryTrendCopy");
  });

  it("shows onboarding only while existing setup is incomplete", () => {
    expect(onboarding).toContain("settings.onboardingComplete");
    expect(onboarding).toContain("return null");
    expect(onboarding).toContain("Finish setting up SpendGrove");
    expect(onboarding).not.toContain("Start with privacy, not a bank login");
  });

  it("keeps full planning workflows reachable as subordinate views", () => {
    expect(budgetPage).toContain("CategoryBudgets");
    expect(recurringPage).toContain("RecurringSuggestions");
  });
});
