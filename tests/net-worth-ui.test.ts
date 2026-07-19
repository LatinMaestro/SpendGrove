import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const reportsPath = new URL("../app/reports/page.tsx", import.meta.url);
const panelPath = new URL("../components/net-worth-panel.tsx", import.meta.url);
const routePath = new URL("../app/api/account/net-worth/route.ts", import.meta.url);
const servicePath = new URL("../src/server/net-worth.ts", import.meta.url);
const deletionPath = new URL("../src/server/account-deletion.ts", import.meta.url);

describe("Preview manual net worth experience", () => {
  it("is subordinate to Reports and guarded by verified Preview", async () => {
    const [reports, service] = await Promise.all([readFile(reportsPath, "utf8"), readFile(servicePath, "utf8")]);
    expect(reports).toContain("<NetWorthPanel available={isVerifiedPreviewRuntime()} />");
    expect(service).toContain("options.runtimeEnabled ?? isVerifiedPreviewRuntime()");
    expect(reports).not.toMatch(/href=["']\/net-worth/);
  });

  it("supports assets, liabilities, values, notes, snapshots and recovery", async () => {
    const panel = await readFile(panelPath, "utf8");
    for (const label of [
      "Asset", "Liability", "Add record", "Add value", "Valuation date", "Note (optional)",
      "Value history", "Save snapshot", "Snapshot history", "Delete", "Deleted net worth records", "Restore",
    ]) expect(panel).toContain(label);
    expect(panel).toContain("Nothing is linked to a bank or market data provider");
    expect(panel).toContain("does not provide valuations, financial advice or live account balances");
  });

  it("keeps optional Property and Loan relationships owner scoped and explicit", async () => {
    const [panel, service] = await Promise.all([readFile(panelPath, "utf8"), readFile(servicePath, "utf8")]);
    expect(panel).toContain("Link existing record (optional)");
    expect(panel).toContain("Keep manual and separate");
    expect(service).toContain("property.findMany");
    expect(service).toContain("loanAccount.findMany");
    expect(service).toContain("where: { id: input.propertyId, userId");
    expect(service).toContain("where: { id: input.loanAccountId, userId");
  });

  it("keeps reads and writes behind authenticated server ownership", async () => {
    const [route, service] = await Promise.all([readFile(routePath, "utf8"), readFile(servicePath, "utf8")]);
    expect(route).toContain("getCurrentUserContext()");
    expect(route).toContain("getNetWorthOverview");
    expect(route).toContain("mutateNetWorth");
    expect(service).toContain("requireAuthenticatedUserContext(context)");
    expect(service).not.toMatch(/transaction\.(find|create|update|delete)/);
  });

  it("uses responsive accessible controls and dependency-ordered account deletion", async () => {
    const [panel, deletion] = await Promise.all([readFile(panelPath, "utf8"), readFile(deletionPath, "utf8")]);
    expect(panel).toContain("<label");
    expect(panel).toContain('role="alert"');
    expect(panel).toContain('role="status"');
    expect(panel).toContain("lg:grid-cols-2");
    expect(panel).not.toMatch(/overflow-x-auto|min-w-\[/);
    expect(deletion.indexOf("netWorthSnapshotEntry.deleteMany")).toBeLessThan(deletion.indexOf("netWorthSnapshot.deleteMany"));
    expect(deletion.indexOf("netWorthValuation.deleteMany")).toBeLessThan(deletion.indexOf("netWorthItem.deleteMany"));
  });
});
