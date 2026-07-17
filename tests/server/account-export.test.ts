import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  ACCOUNT_EXPORT_CONTRACT,
  ACCOUNT_EXPORT_VERSION,
  AccountExportUnavailableError,
  accountExportFileName,
  createAccountExport,
  type AccountExportData,
  type AccountExportStore,
} from "@/src/server/account-export";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/account-export.ts", import.meta.url);
const routePath = new URL("../../app/api/account/export/route.ts", import.meta.url);
const componentPath = new URL("../../components/account-data-export.tsx", import.meta.url);
const settingsPath = new URL("../../components/settings-panel.tsx", import.meta.url);
const schemaPath = new URL("../../prisma/schema.prisma", import.meta.url);

function emptyData(): AccountExportData {
  return {
    profile: {
      id: "user_1",
      email: "person@example.test",
      name: "Synthetic Person",
      status: "ACTIVE",
      country: "AU",
      timezone: "Australia/Brisbane",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-07-17T00:00:00.000Z",
    },
    settings: null,
    categories: [],
    transactions: [],
    importBatches: [],
    importRows: [],
    bankImportProfiles: [],
    merchantProfiles: [],
    merchantAliases: [],
    merchantRules: [],
    properties: [],
    loanAccounts: [],
    loanRepayments: [],
    loanReconciliationLinks: [],
    propertyTransactionLinks: [],
    propertyReportReviews: [],
    recurringItems: [],
    recurringSuggestionDismissals: [],
    categoryBudgets: [],
    auditEvents: [],
  };
}

function memoryStore(data: AccountExportData | null) {
  const requestedUserIds: string[] = [];
  const store: AccountExportStore = {
    async read(userId) {
      requestedUserIds.push(userId);
      return data;
    },
  };
  return { store, requestedUserIds };
}

describe("Phase 5 account export", () => {
  it("creates a versioned owner-scoped JSON document with integer cents and Australian date strings", async () => {
    const data = emptyData();
    data.transactions.push({
      id: "transaction_1",
      userId: "user_1",
      amountCents: -12345,
      date: "2026-07-16",
      type: "EXPENSE",
      description: "Synthetic committed transaction",
    });
    data.loanRepayments.push({
      id: "repayment_1",
      userId: "user_1",
      repaymentDate: "2026-07-15",
      totalPaymentCents: 90000,
    });
    const { store, requestedUserIds } = memoryStore(data);

    const result = await createAccountExport(
      createTestUserContext("user_1"),
      store,
      new Date("2026-07-17T01:02:03.000Z"),
    );

    expect(requestedUserIds).toEqual(["user_1"]);
    expect(result).toMatchObject({
      contract: ACCOUNT_EXPORT_CONTRACT,
      version: ACCOUNT_EXPORT_VERSION,
      generatedAt: "2026-07-17T01:02:03.000Z",
      currency: "AUD",
      calendarTimezone: "Australia/Brisbane",
      moneyRepresentation: "signed integer cents",
      australianDateRepresentation: "YYYY-MM-DD",
      timestampRepresentation: "UTC ISO 8601",
      recordCounts: {
        transactions: 1,
        loanRepayments: 1,
      },
    });
    expect(result.data.transactions[0]).toMatchObject({
      amountCents: -12345,
      date: "2026-07-16",
    });
  });

  it("includes every current owner-owned entity group and lifecycle records", async () => {
    const data = emptyData();
    const collectionNames = Object.entries(data)
      .filter(([, value]) => Array.isArray(value))
      .map(([key]) => key);
    expect(collectionNames).toEqual([
      "categories",
      "transactions",
      "importBatches",
      "importRows",
      "bankImportProfiles",
      "merchantProfiles",
      "merchantAliases",
      "merchantRules",
      "properties",
      "loanAccounts",
      "loanRepayments",
      "loanReconciliationLinks",
      "propertyTransactionLinks",
      "propertyReportReviews",
      "recurringItems",
      "recurringSuggestionDismissals",
      "categoryBudgets",
      "auditEvents",
    ]);

    data.categories.push({ id: "deleted_category", isArchived: true, deletedAt: "2026-07-01T00:00:00.000Z" });
    data.transactions.push({ id: "deleted_transaction", status: "DELETED", deletedAt: "2026-07-02T00:00:00.000Z" });
    const { store } = memoryStore(data);
    const result = await createAccountExport(createTestUserContext("user_1"), store);
    expect(result.data.categories[0]).toMatchObject({ isArchived: true });
    expect(result.data.transactions[0]).toMatchObject({ status: "DELETED" });
  });

  it("fails closed without authenticated ownership or a durable account", async () => {
    const available = memoryStore(emptyData());
    await expect(createAccountExport(null, available.store)).rejects.toThrow(/authenticated/i);
    expect(available.requestedUserIds).toEqual([]);

    const missing = memoryStore(null);
    await expect(createAccountExport(createTestUserContext("user_1"), missing.store))
      .rejects.toBeInstanceOf(AccountExportUnavailableError);
  });

  it("uses a stable safe filename", () => {
    expect(accountExportFileName(new Date("2026-07-17T23:59:59.000Z")))
      .toBe("spendgrove-account-export-2026-07-17.json");
  });

  it("selects only owner-scoped export fields and omits raw import and unsafe audit metadata", async () => {
    const service = await readFile(servicePath, "utf8");
    const importBatchSelect = service.match(/db\.importBatch\.findMany\([\s\S]*?\n      \}\),\n      db\.importRow/)?.[0] ?? "";
    const importRowSelect = service.match(/db\.importRow\.findMany\([\s\S]*?\n      \}\),\n      db\.bankImportProfile/)?.[0] ?? "";
    const auditSelect = service.match(/db\.auditEvent\.findMany\([\s\S]*?\n      \}\),\n    \]\);/)?.[0] ?? "";

    expect(service).toContain("where: { userId }");
    expect(service).toContain("db.$transaction([");
    expect(importBatchSelect).not.toMatch(/safeFileName|originalFileNameRedacted|fileNameHash|detectedBankName|detectedAccountType|mappingSummary|excludedPrivateHeaders/);
    expect(importRowSelect).not.toMatch(/description: true|merchantName: true|metadata: true/);
    expect(auditSelect).not.toContain("metadata: true");
    expect(service).not.toMatch(/importFingerprint: true|duplicateKey: true|csvMatchHint: true/);
  });

  it("requires strict Clerk reverification and returns an ephemeral private download", async () => {
    const [route, component, settings] = await Promise.all([
      readFile(routePath, "utf8"),
      readFile(componentPath, "utf8"),
      readFile(settingsPath, "utf8"),
    ]);

    expect(route).toContain('has({ reverification: "strict" })');
    expect(route).toContain('reverificationErrorResponse("strict")');
    expect(route).toContain('"Cache-Control": "private, no-store, max-age=0"');
    expect(route).toContain('"X-Content-Type-Options": "nosniff"');
    expect(route).toContain('"Content-Disposition"');
    expect(component).toContain("useReverification");
    expect(component).toContain("Export cancelled. No file was created.");
    expect(component).toContain("if (isPreparing) return");
    expect(settings).toContain("<AccountDataExport />");
  });

  it("does not change schema, packages or browser-local data for export", async () => {
    const [service, component, schema] = await Promise.all([
      readFile(servicePath, "utf8"),
      readFile(componentPath, "utf8"),
      readFile(schemaPath, "utf8"),
    ]);
    expect(schema).not.toMatch(/AccountExport|ExportJob|ExportFile/);
    expect(service).not.toMatch(/localStorage|sessionStorage|indexedDB/);
    expect(component).not.toMatch(/localStorage|sessionStorage|indexedDB/);
    expect(service).not.toMatch(/\.create\s*\(|\.update\s*\(|\.delete\s*\(/);
  });
});
