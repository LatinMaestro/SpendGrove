import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { defaultUserSettings } from "@/lib/settings";

const paths = {
  home: new URL("../app/page.tsx", import.meta.url),
  shell: new URL("../components/app-shell.tsx", import.meta.url),
  importFlow: new URL("../components/csv-import-foundation.tsx", import.meta.url),
  importReview: new URL("../components/import-review-foundation.tsx", import.meta.url),
  importDomain: new URL("../lib/import-review.ts", import.meta.url),
  importCommit: new URL("../components/import-commit-panel.tsx", import.meta.url),
  transactions: new URL("../components/durable-manual-transactions.tsx", import.meta.url),
  recurring: new URL("../components/recurring-suggestions.tsx", import.meta.url),
  budgets: new URL("../components/category-budgets.tsx", import.meta.url),
  loans: new URL("../components/loans-manager.tsx", import.meta.url),
  property: new URL("../components/property-record-keeping-activity.tsx", import.meta.url),
  settings: new URL("../components/settings-panel.tsx", import.meta.url),
  settingsPage: new URL("../app/settings/page.tsx", import.meta.url),
  navigation: new URL("../components/bottom-nav.tsx", import.meta.url),
  recurringServer: new URL("../src/server/recurring-suggestions.ts", import.meta.url),
  budgetServer: new URL("../src/server/category-budgets.ts", import.meta.url),
};

describe("Phase 4 Milestone 3 beginner-first UI contract", () => {
  it("keeps Simple Mode as the default and removes unavailable feature clutter", async () => {
    const [settings, settingsPage] = await Promise.all([readFile(paths.settings, "utf8"), readFile(paths.settingsPage, "utf8")]);
    expect(defaultUserSettings.simpleMode).toBe(true);
    expect(settings).toContain("Everyday preferences");
    expect(settings).toContain("Show the essentials first.");
    expect(settings).not.toContain("Future features");
    expect(settings).not.toContain("All off");
    expect(settingsPage).toContain("Advanced account tools");
    expect(settingsPage).toContain("<details");
  });

  it("gives Home one dominant entry action and removes repeated feature cards", async () => {
    const [home, navigation] = await Promise.all([readFile(paths.home, "utf8"), readFile(paths.navigation, "utf8")]);
    expect(home).toContain("Import transactions");
    expect(home).toContain("Review transactions");
    expect(home).toContain("See what matters this month.");
    expect(home).toContain('aria-labelledby="home-overview-heading"');
    expect(home).not.toContain("<FeatureCard");
    expect(home).not.toContain("Privacy stays visible");
    expect(navigation).not.toContain('label: "Reports"');
    expect(navigation).not.toContain('label: "Properties"');
  });

  it("uses progressive disclosure for mapping, review options and advanced tools", async () => {
    const [importFlow, importReview, settingsPage] = await Promise.all([readFile(paths.importFlow, "utf8"), readFile(paths.importReview, "utf8"), readFile(paths.settingsPage, "utf8")]);
    expect(importFlow).toContain("Columns ready");
    expect(importFlow).toContain("More column options");
    expect(importFlow).toContain("Review transactions");
    expect(importReview).toContain("Review options");
    expect(importReview).toContain("<details");
    expect(settingsPage).toContain("<details");
  });

  it("keeps essential transaction/import decisions and duplicate-submit protection", async () => {
    const [transactions, importDomain, importCommit] = await Promise.all([readFile(paths.transactions, "utf8"), readFile(paths.importDomain, "utf8"), readFile(paths.importCommit, "utf8")]);
    expect(transactions).toContain("Add transaction");
    expect(transactions).toContain("Details");
    for (const action of ["Edit", "Duplicate", "Delete"]) expect(transactions).toContain(action);
    for (const decision of ["IMPORT", "SKIP", "MERGE"]) expect(importDomain).toContain(decision);
    expect(importCommit).toContain("disabled={isCommitting || blockingRows.length > 0}");
  });

  it("uses beginner regular-payment and budget wording with contextual history", async () => {
    const [recurring, budgets] = await Promise.all([readFile(paths.recurring, "utf8"), readFile(paths.budgets, "utf8")]);
    for (const copy of ["Suggested regular payments", "Confirmed regular payments", "Every 2 weeks", "Show suggestion again", "Restore regular payment"]) expect(recurring).toContain(copy);
    expect(recurring).not.toContain("High confidence");
    expect(recurring).not.toContain("High confidence");
    expect(recurring).toContain("<details");
    for (const copy of ["Monthly budgets", "Used this month", "Budget left", "Over by", "Deleted budgets"]) expect(budgets).toContain(copy);
    expect(budgets).toContain("<details");
  });

  it("uses plain loan and Property wording while preserving essential advanced actions", async () => {
    const [loans, property] = await Promise.all([readFile(paths.loans, "utf8"), readFile(paths.property, "utf8")]);
    expect(loans).toContain("Your loans");
    expect(loans).toContain("Loan repayments");
    expect(loans).toContain("Suggested transactions");
    expect(loans).toContain("Edit repayment");
    expect(loans).toContain("Unlink repayment");
    expect(loans).toContain("Delete repayment");
    expect(loans).toContain("<details");
    expect(property).toContain("Property records");
    expect(property).toContain("Record keeping only - not tax advice.");
  });

  it("adds mobile overflow and accessible disclosure safeguards", async () => {
    const [shell, recurring, budgets, property] = await Promise.all([readFile(paths.shell, "utf8"), readFile(paths.recurring, "utf8"), readFile(paths.budgets, "utf8"), readFile(paths.property, "utf8")]);
    expect(shell).toContain("overflow-x-hidden");
    expect(recurring).toContain("focus:ring-2");
    expect(budgets).toContain("aria-label");
    expect(property).toContain("aria-expanded={isOpen}");
  });

  it("does not change recurring evidence or monthly budget calculation rules", async () => {
    const [recurringServer, budgetServer] = await Promise.all([readFile(paths.recurringServer, "utf8"), readFile(paths.budgetServer, "utf8")]);
    expect(recurringServer).toContain("const cadenceWindows");
    expect(recurringServer).toContain("minimumDays: 6, maximumDays: 8");
    expect(recurringServer).toContain("minimumDays: 13, maximumDays: 16");
    expect(recurringServer).toContain("minimumDays: 27, maximumDays: 34");
    expect(budgetServer).toContain('splitRole: { not: "PARENT" }');
    expect(budgetServer).toContain('type: "EXPENSE"');
    expect(budgetServer).not.toMatch(/loanRepayment\.(?:find|count|aggregate)/);
  });
});
