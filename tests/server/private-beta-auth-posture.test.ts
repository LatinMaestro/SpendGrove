import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const protectedPages = [
  "app/page.tsx",
  "app/transactions/page.tsx",
  "app/import/page.tsx",
  "app/loans/page.tsx",
  "app/loans/import/page.tsx",
  "app/budgets/page.tsx",
  "app/regular-payments/page.tsx",
  "app/reports/page.tsx",
  "app/settings/page.tsx",
];

describe("private-beta authentication posture", () => {
  it("guards every operational screen through the authenticated app shell", async () => {
    const shell = await readFile("components/app-shell.tsx", "utf8");
    const pageSources = await Promise.all(protectedPages.map((path) => readFile(path, "utf8")));

    expect(shell).toContain("await requireAuthenticatedPage()");
    for (const [index, source] of pageSources.entries()) {
      expect(source, protectedPages[index]).toContain("<AppShell");
      expect(source, protectedPages[index]).not.toContain("<AppShell publicAccess");
    }
  });

  it("keeps only onboarding explicitly public inside the application shell", async () => {
    const onboarding = await readFile("app/onboarding/page.tsx", "utf8");
    expect(onboarding).toContain("<AppShell publicAccess>");
  });

  it("fails closed for protected requests and returns APIs to sign-in safely", async () => {
    const middleware = await readFile("middleware.ts", "utf8");
    expect(middleware).toContain("isProtectedPath");
    expect(middleware).toContain("isProtectedApiPath");
    expect(middleware).toContain('{ status: 401 }');
    expect(middleware).toContain('new URL("/sign-in", request.url)');
    expect(middleware).toContain("Fail closed for operational routes");
  });

  it("does not expose the old browser-to-account migration panel", async () => {
    const transactions = await readFile("app/transactions/page.tsx", "utf8");
    expect(transactions).not.toContain("ManualTransactionMigrationPanel");
    expect(transactions).not.toContain("<ManualTransactions");
    expect(transactions).toContain("LocalPrototypeDataNotice");
  });
});
