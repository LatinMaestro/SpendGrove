import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  createPropertyLinkAuditEvent,
  linkTransactionToProperty,
  propertyTransactionLinkRequestSchema,
  unlinkTransactionFromProperty,
  type PropertyTransactionLinkStore,
} from "@/src/server/property-transaction-links";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/property-transaction-links.ts", import.meta.url);
const panelPath = new URL("../../components/transaction-property-link-panel.tsx", import.meta.url);

function createMemoryStore() {
  const calls: Array<{ action: string; userId: string; transactionId: string; propertyId?: string }> = [];
  let linked = false;
  const store: PropertyTransactionLinkStore & { calls: typeof calls } = {
    calls,
    async snapshot(userId, transactionId) {
      calls.push({ action: "snapshot", userId, transactionId });
      return {
        properties: [{ id: "property_1", nickname: "Test Property", usage: "OTHER", isArchived: false }],
        link: linked ? {
          id: "link_1",
          property: { id: "property_1", nickname: "Test Property", usage: "OTHER", isArchived: false },
        } : null,
      };
    },
    async link(userId, transactionId, propertyId) {
      calls.push({ action: "link", userId, transactionId, propertyId });
      const alreadyLinked = linked;
      linked = true;
      return { alreadyLinked, relinked: false };
    },
    async unlink(userId, transactionId) {
      calls.push({ action: "unlink", userId, transactionId });
      const alreadyUnlinked = !linked;
      linked = false;
      return { alreadyUnlinked };
    },
  };
  return store;
}

describe("Property transaction links", () => {
  it("accepts only one explicit Property ID", () => {
    expect(propertyTransactionLinkRequestSchema.parse({ propertyId: "property_1" })).toEqual({ propertyId: "property_1" });
    expect(() => propertyTransactionLinkRequestSchema.parse({ propertyId: "" })).toThrow();
    expect(() => propertyTransactionLinkRequestSchema.parse({ propertyId: "property_1", automatic: true })).toThrow();
  });

  it("scopes link, snapshot and unlink calls to the authenticated user", async () => {
    const store = createMemoryStore();
    const context = createTestUserContext("user_1");

    const linked = await linkTransactionToProperty(
      context,
      "transaction_1",
      { propertyId: "property_1" },
      store,
      new Date("2026-07-02T00:00:00.000Z"),
    );
    expect(linked.snapshot.link?.property.nickname).toBe("Test Property");

    await expect(unlinkTransactionFromProperty(
      context,
      "transaction_1",
      store,
      new Date("2026-07-02T01:00:00.000Z"),
    )).resolves.toEqual({ alreadyUnlinked: false });

    expect(store.calls).toEqual([
      { action: "link", userId: "user_1", transactionId: "transaction_1", propertyId: "property_1" },
      { action: "snapshot", userId: "user_1", transactionId: "transaction_1" },
      { action: "unlink", userId: "user_1", transactionId: "transaction_1" },
    ]);
  });

  it("audits safe state and reason codes without Property details", () => {
    expect(createPropertyLinkAuditEvent("user_1", "transaction_1", "RELINKED")).toEqual({
      userId: "user_1",
      entityType: "TRANSACTION",
      entityId: "transaction_1",
      action: "UPDATED",
      metadata: {
        propertyLinkState: "RELINKED",
        reasonCode: "MANUAL_USER_ACTION",
      },
    });
    expect(createPropertyLinkAuditEvent("user_1", "transaction_2", "LINKED", "IMPORT_REVIEW_PROPERTY_LINK")).toMatchObject({
      entityType: "TRANSACTION",
      entityId: "transaction_2",
      action: "UPDATED",
      metadata: {
        propertyLinkState: "LINKED",
        reasonCode: "IMPORT_REVIEW_PROPERTY_LINK",
      },
    });
    expect(JSON.stringify(createPropertyLinkAuditEvent("user_1", "transaction_2", "LINKED", "IMPORT_REVIEW_PROPERTY_LINK"))).not.toMatch(/amount|merchant|description|filename|narration|address|account/i);
  });

  it("revalidates active ownership and never mutates the transaction", async () => {
    const service = await readFile(servicePath, "utf8");

    expect(service).toContain('status: "ACTIVE"');
    expect(service).toContain("deletedAt: null");
    expect(service).toContain('splitRole: { not: "PARENT" }');
    expect(service).toContain('isArchived: false');
    expect(service).toContain("where: { id: propertyId, userId");
    expect(service).toContain("where: { transactionId }");
    expect(service).toContain("Unlink the current Property before choosing another one.");
    expect(service).not.toMatch(/tx\.transaction\.(?:update|updateMany|delete|deleteMany)\s*\(/);
  });

  it("keeps UI wording neutral and requires explicit unlink confirmation", async () => {
    const panel = await readFile(panelPath, "utf8");

    expect(panel).toContain("Property record keeping");
    expect(panel).toContain("Link transaction to Property");
    expect(panel).toContain("Confirm unlink");
    expect(panel).toContain("does not change this transaction or create another payment");
    expect(panel).not.toMatch(/deduct|EOFY|tax advice|profit|yield|equity|valuation|net worth/i);
  });
});
