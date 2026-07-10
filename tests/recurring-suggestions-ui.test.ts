import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const componentPath = new URL("../components/recurring-suggestions.tsx", import.meta.url);
const homePath = new URL("../app/page.tsx", import.meta.url);
const routePath = new URL("../app/api/account/recurring/route.ts", import.meta.url);
const enumsPath = new URL("../lib/validation/enums.ts", import.meta.url);

describe("recurring suggestions UI and API boundaries", () => {
  it("shows suggestion-only review, confirm, dismiss, edit and archive controls", async () => {
    const component = await readFile(componentPath, "utf8");

    for (const copy of [
      "Why this was suggested",
      "Suggestions only",
      "Confirm recurring item",
      "Dismiss suggestion",
      "Save changes",
      "Archive",
      "Nothing becomes recurring until you confirm it",
      "do not move money",
    ]) {
      expect(component).toContain(copy);
    }
    expect(component).not.toMatch(/guaranteed forecast|financial advice|tax deductible|claimable|ATO-ready|debt advice|credit advice|net worth|property profit|yield|equity|valuation/i);
  });

  it("places the recurring review on Home without adding a navigation tab", async () => {
    const [home, component] = await Promise.all([
      readFile(homePath, "utf8"),
      readFile(componentPath, "utf8"),
    ]);

    expect(home).toContain("<RecurringSuggestions");
    expect(home).toContain("accountPersistenceAvailable");
    expect(component).toContain('fetch("/api/account/recurring"');
    expect(home).not.toContain('href="/recurring"');
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
