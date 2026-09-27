import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const pagePath = new URL("../app/budgets/page.tsx", import.meta.url);
const componentPath = new URL("../components/savings-goals.tsx", import.meta.url);
const routePath = new URL("../app/api/account/savings-goals/route.ts", import.meta.url);
const servicePath = new URL("../src/server/savings-goals.ts", import.meta.url);
const deletionPath = new URL("../src/server/account-deletion.ts", import.meta.url);

describe("Preview savings goals experience", () => {
  it("is visible only through the verified Preview runtime and adds no navigation destination", async () => {
    const [page, service] = await Promise.all([readFile(pagePath, "utf8"), readFile(servicePath, "utf8")]);
    expect(page).toContain("<SavingsGoals available={isVerifiedPreviewRuntime()} />");
    expect(service).toContain("options.runtimeEnabled ?? isVerifiedPreviewRuntime()");
    expect(page).not.toMatch(/href=["']\/savings|SavingsGoalsNav/);
  });

  it("supports the approved planning lifecycle with progressive disclosure", async () => {
    const component = await readFile(componentPath, "utf8");
    for (const label of [
      "Add goal", "Create goal", "Save changes", "Add progress", "Pause", "Resume",
      "Mark complete", "Delete goal", "Deleted goals", "Restore", "History and more",
    ]) expect(component).toContain(label);
    expect(component).toContain("does not create a transaction or move money");
    expect(component).toContain("do not change income, spending, budgets or transaction history");
    expect(component).toContain("lg:grid-cols-2");
    expect(component).not.toMatch(/overflow-x-auto|min-w-\[/);
  });

  it("keeps every read and mutation behind authenticated owner-scoped server code", async () => {
    const [route, service] = await Promise.all([readFile(routePath, "utf8"), readFile(servicePath, "utf8")]);
    expect(route).toContain("getCurrentUserContext()");
    expect(route).toContain("listSavingsGoals");
    expect(route).toContain("mutateSavingsGoal");
    expect(service).toContain("requireAuthenticatedUserContext(context)");
    expect(service).toContain("where: { id: goalId, userId");
    expect(service).toContain("where: { userId }");
  });

  it("never creates cashflow records and deletes owned planning records in dependency order", async () => {
    const [service, deletion] = await Promise.all([readFile(servicePath, "utf8"), readFile(deletionPath, "utf8")]);
    expect(service).not.toMatch(/\.transaction\.(create|createMany|update|updateMany|delete|deleteMany)/);
    expect(deletion.indexOf("savingsGoalContribution.deleteMany")).toBeLessThan(deletion.indexOf("savingsGoal.deleteMany"));
    expect(deletion).toContain("if (isVerifiedPreviewRuntime())");
  });

  it("uses labelled controls and plain planning language", async () => {
    const component = await readFile(componentPath, "utf8");
    expect(component).toContain("<label");
    expect(component).toContain('role="alert"');
    expect(component).toContain('role="status"');
    expect(component).toContain('aria-label=');
    expect(component).toContain("Savings goals are planning records");
  });
});
