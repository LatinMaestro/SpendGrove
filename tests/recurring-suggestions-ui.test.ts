import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const componentPath = new URL("../components/recurring-suggestions.tsx", import.meta.url);
const homePath = new URL("../app/page.tsx", import.meta.url);
const insightsPath = new URL("../components/everyday-insights.tsx", import.meta.url);
const recurringPagePath = new URL("../app/regular-payments/page.tsx", import.meta.url);
const navigationPath = new URL("../components/bottom-nav.tsx", import.meta.url);
const routePath = new URL("../app/api/account/recurring/route.ts", import.meta.url);
const enumsPath = new URL("../lib/validation/enums.ts", import.meta.url);

describe("recurring suggestions UI and API boundaries", () => {
  it("shows suggestion-only review, confirm, dismiss, edit and archive controls", async () => {
    const component = await readFile(componentPath, "utf8");

    for (const copy of [
      "Why was this suggested?",
      "Edit details",
      "Review all",
      "Suggested regular payments",
      "Confirm",
      "Dismiss",
      "Save changes",
      "Delete",
      "Dismissed ({dismissedSuggestions.length})",
      "Show suggestion again",
      "Deleted regular payments ({archivedItems.length})",
      "Restore regular payment",
      "Nothing is confirmed until you choose it",
      "do not move money",
      "Every 2 weeks",
    ]) {
      expect(component).toContain(copy);
    }
    expect(component).not.toMatch(/High confidence|Suggestions only|guaranteed forecast|financial advice|tax deductible|claimable|ATO-ready|debt advice|credit advice|net worth|property profit|yield|equity|valuation|due soon|overdue|reminder/i);
  });

  it("keeps a compact regular-payment preview on Home and full review in a subordinate view", async () => {
    const [home, insights, recurringPage, navigation, component] = await Promise.all([
      readFile(homePath, "utf8"),
      readFile(insightsPath, "utf8"),
      readFile(recurringPagePath, "utf8"),
      readFile(navigationPath, "utf8"),
      readFile(componentPath, "utf8"),
    ]);

    expect(home).toContain("<EverydayInsights");
    expect(insights).toContain("snapshot.recurring.slice(0, 3)");
    expect(insights).toContain('href="/regular-payments"');
    expect(recurringPage).toContain("<RecurringSuggestions");
    expect(component).toContain('fetch("/api/account/recurring"');
    expect(navigation).not.toContain('label: "Regular payments"');
  });

  it("keeps the account API authenticated and returns safe errors", async () => {
    const route = await readFile(routePath, "utf8");

    expect(route).toContain("getCurrentUserContext");
    expect(route).toContain("getRecurringSnapshot");
    expect(route).toContain("applyRecurringMutation");
    expect(route).toContain("RecurringSuggestionUnavailableError");
    expect(route).not.toMatch(/console\.|error\.stack|DATABASE_URL|DIRECT_DATABASE_URL/);
  });

  it("allows only the approved Phase 4 audit entity codes", async () => {
    const enums = await readFile(enumsPath, "utf8");

    expect(enums).toContain('"RECURRING_ITEM"');
    expect(enums).toContain('"RECURRING_SUGGESTION_DISMISSAL"');
    expect(enums).toContain('"CATEGORY_BUDGET"');
  });
});
