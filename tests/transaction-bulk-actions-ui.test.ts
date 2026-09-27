import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("Phase 6 Preview bulk transaction activation", () => {
  it("shows bounded accessible selection and the four approved desktop actions only in the guarded flow", async () => {
    const [ledger, actions, page] = await Promise.all([
      source("components/durable-manual-transactions.tsx"),
      source("components/transaction-bulk-actions.tsx"),
      source("app/transactions/page.tsx"),
    ]);

    expect(page).toContain("isVerifiedPreviewRuntime()");
    expect(page).toContain("bulkOperationsAvailable={bulkOperationsAvailable}");
    expect(ledger).toContain("bulkOperationsAvailable &&");
    expect(ledger).toContain('aria-label="Select all visible transactions"');
    expect(ledger).toContain("slice(0, 250)");
    expect(actions).toContain("Change category");
    expect(actions).toContain("Apply to matching merchant");
    expect(actions).toContain("Link to Property");
    expect(actions).toContain("Unlink from Property");
    expect(actions).toContain('className="mb-3 hidden');
    expect(actions).not.toMatch(/bulk delete|bulk split|change amount|change date/i);
  });

  it("keeps category and merchant actions direction-compatible and selected-record scoped", async () => {
    const actions = await source("components/transaction-bulk-actions.tsx");

    expect(actions).toContain('selectedType !== "TRANSFER"');
    expect(actions).toContain("category.type === selectedType");
    expect(actions).toContain("commonMerchantProfileId");
    expect(actions).toContain("transactionIds: selectedTransactions.map");
    expect(actions).toContain("merchantProfileId: commonMerchantProfileId");
    expect(actions).toContain("SpendGrove will recheck every selected transaction");
  });

  it("returns safe partial counts and keeps undo available without exposing record data", async () => {
    const actions = await source("components/transaction-bulk-actions.tsx");

    expect(actions).toContain("appliedCount");
    expect(actions).toContain("skippedCount");
    expect(actions).toContain("failedCount");
    expect(actions).toContain("undoBlockedCount");
    expect(actions).toContain("Undo bulk change");
    expect(actions).not.toMatch(/reasonCounts|description:|amountCents|bank|account reference|filename/i);
  });

  it("adds only safe operation summaries to export and Preview-scoped deletion", async () => {
    const [accountExport, accountDeletion] = await Promise.all([
      source("src/server/account-export.ts"),
      source("src/server/account-deletion.ts"),
    ]);

    expect(accountExport).toContain("bulkOperations: ExportRecord[]");
    expect(accountExport).toContain("isVerifiedPreviewRuntime()");
    expect(accountExport).not.toContain("db.bulkOperationItem.findMany");
    expect(accountDeletion).toContain("if (isVerifiedPreviewRuntime())");
    expect(accountDeletion).toContain("bulkOperationItem.deleteMany");
    expect(accountDeletion).toContain("bulkOperation.deleteMany");
  });
});
