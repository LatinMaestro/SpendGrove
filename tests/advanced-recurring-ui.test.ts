import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const pagePath = new URL("../app/regular-payments/page.tsx", import.meta.url);
const panelPath = new URL("../components/advanced-recurring-lifecycle.tsx", import.meta.url);
const routePath = new URL("../app/api/account/advanced-recurring/route.ts", import.meta.url);
const servicePath = new URL("../src/server/advanced-recurring.ts", import.meta.url);
const deletionPath = new URL("../src/server/account-deletion.ts", import.meta.url);

describe("Preview recurring lifecycle experience", () => {
  it("extends the existing regular-payments destination only in verified Preview", async () => {
    const [page, service] = await Promise.all([readFile(pagePath, "utf8"), readFile(servicePath, "utf8")]);
    expect(page).toContain("<AdvancedRecurringLifecycle available={isVerifiedPreviewRuntime()} />");
    expect(service).toContain("options.runtimeEnabled ?? isVerifiedPreviewRuntime()");
    expect(page).not.toMatch(/href=["']\/recurring-lifecycle/);
  });

  it("keeps lifecycle and history progressively disclosed", async () => {
    const panel = await readFile(panelPath, "utf8");
    expect(panel.trimStart()).toContain('"use client"');
    expect(panel).toContain("<details");
    for (const label of [
      "Payment status and history", "Pause", "Mark active", "Mark cancelled", "Needs review",
      "Delete", "Deleted regular payments", "Restore", "Link transaction", "Payment history", "Unlink",
    ]) expect(panel).toContain(label);
    expect(panel).toContain("No predicted transaction is created");
  });

  it("shows only safe date and amount candidate details and revalidates server-side", async () => {
    const [panel, service, route] = await Promise.all([
      readFile(panelPath, "utf8"), readFile(servicePath, "utf8"), readFile(routePath, "utf8"),
    ]);
    expect(panel).toContain("candidate.date");
    expect(panel).toContain("formatAudFromCents(candidate.amountCents)");
    expect(panel).not.toMatch(/description|merchant|narration|account number|bsb|filename/i);
    expect(service).toContain("recurringInstanceCompatibility");
    expect(service).toContain("where: { id: transactionId, userId }");
    expect(route).toContain("getCurrentUserContext()");
  });

  it("preserves one cashflow record and approved detector thresholds", async () => {
    const service = await readFile(servicePath, "utf8");
    expect(service).not.toMatch(/(?:prisma|tx)\.transaction\.(?:create|update|delete)\s*\(/);
    expect(service).toContain('type: { in: ["EXPENSE", "INCOME"] }');
    expect(service).toContain('splitRole: { not: "PARENT" }');
    expect(service).toContain("transaction.amountCents < range.minimum");
  });

  it("deletes instance links before recurring items and remains mobile safe", async () => {
    const [panel, deletion] = await Promise.all([readFile(panelPath, "utf8"), readFile(deletionPath, "utf8")]);
    expect(deletion.indexOf("recurringInstance.deleteMany")).toBeLessThan(deletion.indexOf("recurringItem.deleteMany"));
    expect(panel).toContain("sm:flex-row");
    expect(panel).not.toMatch(/overflow-x-auto|min-w-\[/);
    expect(panel).toContain('role="alert"');
    expect(panel).toContain('aria-label=');
  });
});
