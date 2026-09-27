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
    bulkOperations: [],
    transferLinks: [],
    importUndoOperations: [],
    savingsGoals: [],
    savingsGoalContributions: [],
    netWorthItems: [],
    netWorthValuations: [],
    netWorthSnapshots: [],
    netWorthSnapshotEntries: [],
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
      "bulkOperations",
      "transferLinks",
      "importUndoOperations",
      "savingsGoals",
      "savingsGoalContributions",
      "netWorthItems",
      "netWorthValuations",
      "netWorthSnapshots",
      "netWorthSnapshotEntries",
      "auditEvents",
    ]);

    data.categories.push({ id: "deleted_category", isArchived: true, deletedAt: "2026-07-01T00:00:00.000Z" });
    data.transactions.push({ id: "deleted_transaction", status: "DELETED", deletedAt: "2026-07-02T00:00:00.000Z" });
    const { store } = memoryStore(data);
    const result = await createAccountExport(createTestUserContext("user_1"), store);
    expect(result.data.categories[0]).toMatchObject({ isArchived: true });
    expect(result.data.transactions[0]).toMatchObject({ status: "DELETED" });
  });

  it("includes only safe operation-level bulk summaries in verified Preview", async () => {
    const data = emptyData();
    data.bulkOperations.push({
      id: "bulk_1",
      userId: "user_1",
      type: "SET_CATEGORY",
      status: "COMPLETED",
      requestedCount: 2,
      appliedCount: 2,
      skippedCount: 0,
      failedCount: 0,
      undoBlockedCount: 0,
    });
    const { store } = memoryStore(data);
    const result = await createAccountExport(createTestUserContext("user_1"), store);

    expect(result.data.bulkOperations).toEqual(data.bulkOperations);
    const service = await readFile(servicePath, "utf8");
    const bulkSelect = service.match(/db\.bulkOperation\.findMany\([\s\S]*?\n      \}\)/)?.[0] ?? "";
    expect(service).toContain("isVerifiedPreviewRuntime()");
    expect(bulkSelect).toContain("requestedCount: true");
    expect(bulkSelect).not.toMatch(/items|transactionId|beforeCategoryId|afterCategoryId|beforePropertyId|afterPropertyId/);
  });

  it("includes owned transfer-link lifecycle without private matching evidence", async () => {
    const data = emptyData();
    data.transferLinks.push({
      id: "link_1",
      userId: "user_1",
      outgoingTransactionId: "transaction_out",
      incomingTransactionId: "transaction_in",
      confirmedAt: "2026-07-17T00:00:00.000Z",
      unlinkedAt: null,
    });
    const { store } = memoryStore(data);
    const result = await createAccountExport(createTestUserContext("user_1"), store);

    expect(result.data.transferLinks).toEqual(data.transferLinks);
    const service = await readFile(servicePath, "utf8");
    const transferSelect = service.match(/db\.transferLink\.findMany\([\s\S]*?\n      \}\)/)?.[0] ?? "";
    expect(transferSelect).toContain("outgoingTransactionId: true");
    expect(transferSelect).toContain("incomingTransactionId: true");
    expect(transferSelect).not.toMatch(/description|merchant|amount|account|bsb|filename/i);
  });

  it("includes safe operation-level import undo lifecycle without row details", async () => {
    const data = emptyData();
    data.importUndoOperations.push({
      id: "undo_1",
      userId: "user_1",
      importBatchId: "batch_1",
      status: "PARTIAL",
      requestedCount: 3,
      undoneCount: 1,
      noChangeCount: 1,
      blockedCount: 1,
      failedCount: 0,
      restoredCount: 0,
      restoreBlockedCount: 0,
    });
    const { store } = memoryStore(data);
    const result = await createAccountExport(createTestUserContext("user_1"), store);
    expect(result.data.importUndoOperations).toEqual(data.importUndoOperations);

    const service = await readFile(servicePath, "utf8");
    const undoSelect = service.match(/db\.importUndoOperation\.findMany\([\s\S]*?\n      \}\)/)?.[0] ?? "";
    expect(undoSelect).toContain("importBatchId: true");
    expect(undoSelect).toContain("undoneCount: true");
    expect(undoSelect).not.toMatch(/items|transactionId|importRowId|description|merchant|amount/i);
  });

  it("includes savings goals and manual contribution history without transaction linkage", async () => {
    const data = emptyData();
    data.savingsGoals.push({
      id: "goal_1", userId: "user_1", name: "Synthetic goal",
      targetAmountCents: 500000, openingProgressCents: 10000, status: "ACTIVE",
    });
    data.savingsGoalContributions.push({
      id: "contribution_1", userId: "user_1", savingsGoalId: "goal_1",
      amountCents: 2500, contributionDate: "2026-07-19", note: null,
    });
    const result = await createAccountExport(createTestUserContext("user_1"), memoryStore(data).store);
    expect(result.data.savingsGoals).toEqual(data.savingsGoals);
    expect(result.data.savingsGoalContributions).toEqual(data.savingsGoalContributions);

    const service = await readFile(servicePath, "utf8");
    const goalSelect = service.match(/db\.savingsGoal\.findMany\([\s\S]*?\n        \}\)/)?.[0] ?? "";
    expect(goalSelect).toContain("targetAmountCents: true");
    expect(goalSelect).not.toMatch(/transactionId|bank|account|merchant|rawCsv/i);
  });

  it("includes manual net worth records, valuations and frozen snapshot entries", async () => {
    const data = emptyData();
    data.netWorthItems.push({ id: "item_1", userId: "user_1", kind: "ASSET", category: "CASH", name: "Manual cash" });
    data.netWorthValuations.push({ id: "value_1", userId: "user_1", netWorthItemId: "item_1", valueCents: 100000, valuationDate: "2026-07-19" });
    data.netWorthSnapshots.push({ id: "snapshot_1", userId: "user_1", snapshotDate: "2026-07-19", netWorthCents: 100000 });
    data.netWorthSnapshotEntries.push({ id: "entry_1", userId: "user_1", snapshotId: "snapshot_1", netWorthItemId: "item_1", valueCents: 100000 });
    const result = await createAccountExport(createTestUserContext("user_1"), memoryStore(data).store);
    expect(result.data.netWorthItems).toEqual(data.netWorthItems);
    expect(result.data.netWorthValuations).toEqual(data.netWorthValuations);
    expect(result.data.netWorthSnapshots).toEqual(data.netWorthSnapshots);
    expect(result.data.netWorthSnapshotEntries).toEqual(data.netWorthSnapshotEntries);
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
