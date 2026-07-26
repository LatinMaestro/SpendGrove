import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const componentPath = new URL("../components/activity-history.tsx", import.meta.url);
const propertyPanelPath = new URL("../components/transaction-property-link-panel.tsx", import.meta.url);
const settingsPath = new URL("../app/settings/page.tsx", import.meta.url);
const accountRoutePath = new URL("../app/api/account/activity-history/route.ts", import.meta.url);
const transactionRoutePath = new URL("../app/api/account/manual-transactions/[transactionId]/activity/route.ts", import.meta.url);
const servicePath = new URL("../src/server/activity-history.ts", import.meta.url);

describe("activity history UI and route boundaries", () => {
  it("places recent activity in existing advanced account tools", async () => {
    const [component, settings] = await Promise.all([
      readFile(componentPath, "utf8"),
      readFile(settingsPath, "utf8"),
    ]);

    expect(settings).toContain('import { AccountActivityHistory } from "@/components/activity-history"');
    expect(settings).toContain("<AccountActivityHistory />");
    expect(settings).toContain("Advanced account tools");
    expect(component).toContain("Recent activity");
    expect(component).toContain("privacy-safe summary");
    expect(component).toContain("Financial values and raw import details are not shown here.");
    expect(component).toContain('timeZone: "Australia/Brisbane"');
    expect(component).toContain('aria-live="polite"');
    expect(component).toContain('role="alert"');
  });

  it("adds a transaction-specific read-only surface to transaction details", async () => {
    const [component, propertyPanel] = await Promise.all([
      readFile(componentPath, "utf8"),
      readFile(propertyPanelPath, "utf8"),
    ]);
    expect(component).toContain("export function TransactionActivityHistory");
    expect(component).toContain("Read-only change history for this transaction.");
    expect(propertyPanel).toContain('import { TransactionActivityHistory } from "@/components/activity-history"');
    expect(propertyPanel).toContain("<TransactionActivityHistory transactionId={transactionId} />");
    expect(component).not.toMatch(/undo transaction|restore transaction|edit transaction|delete transaction/i);
  });

  it("exposes GET-only authenticated routes with neutral errors", async () => {
    const [accountRoute, transactionRoute] = await Promise.all([
      readFile(accountRoutePath, "utf8"),
      readFile(transactionRoutePath, "utf8"),
    ]);

    expect(accountRoute).toContain("getCurrentUserContext()");
    expect(accountRoute).toContain("listRecentActivityHistory(context)");
    expect(transactionRoute).toContain("getCurrentUserContext()");
    expect(transactionRoute).toContain("listTransactionActivityHistory(context");
    expect(transactionRoute).toContain("That transaction could not be found for your account.");
    expect(accountRoute).not.toMatch(/export async function (?:POST|PATCH|DELETE)/);
    expect(transactionRoute).not.toMatch(/export async function (?:POST|PATCH|DELETE)/);
  });

  it("never returns raw metadata or private financial fields", async () => {
    const service = await readFile(servicePath, "utf8");
    const itemType = service.match(/export type ActivityHistoryItem = \{[\s\S]*?\n\};/)?.[0] ?? "";

    expect(itemType).toContain("summary: string");
    expect(itemType).not.toMatch(/metadata|description|merchant|amount|balance|filename|accountNumber|address|provider/i);
    expect(service).toContain("mapActivityHistoryItem");
    expect(service).toContain("listRecent(user.userId, 100)");
    expect(service).toContain("listForTransaction(user.userId, transactionId, 50)");
    expect(service).toContain("assertUserOwnsRecord(user, transaction, \"transaction\")");
    expect(service).not.toMatch(/metadata:\s*record\.metadata/);
    expect(service).not.toMatch(/JSON\.stringify\(record\.metadata\)/);
  });
});
