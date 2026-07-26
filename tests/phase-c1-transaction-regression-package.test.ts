import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const files = {
  ledger: new URL("../components/durable-manual-transactions.tsx", import.meta.url),
  manualServer: new URL("../src/server/manual-transactions.ts", import.meta.url),
  importCommit: new URL("../src/server/import-commit.ts", import.meta.url),
  eligibility: new URL("../lib/everyday-spending-eligibility.ts", import.meta.url),
  transferLinks: new URL("../src/server/transfer-links.ts", import.meta.url),
  bulkOperations: new URL("../src/server/bulk-operations.ts", import.meta.url),
  activityHistory: new URL("../src/server/activity-history.ts", import.meta.url),
};

async function sources() {
  const entries = await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, "utf8")] as const));
  return Object.fromEntries(entries) as Record<keyof typeof files, string>;
}

describe("Phase C1 consolidated transaction regression package", () => {
  it("keeps durable transaction reads owner-scoped, active and split-parent safe", async () => {
    const { manualServer } = await sources();

    expect(manualServer).toContain("userId,");
    expect(manualServer).toContain('status: "ACTIVE"');
    expect(manualServer).toContain("deletedAt: null");
    expect(manualServer).toContain('not: "PARENT"');
    expect(manualServer).toContain('{ date: "desc" }');
    expect(manualServer).toContain('{ updatedAt: "desc" }');
    expect(manualServer).toContain('source: "MANUAL"');
    expect(manualServer).toContain('splitRole: "NONE"');
    expect(manualServer).toContain('status: "DELETED"');
  });

  it("keeps everyday spending limited to owned negative active expenses and excludes split parents", async () => {
    const { eligibility } = await sources();

    expect(eligibility).toContain("record.userId !== userId");
    expect(eligibility).toContain('record.type !== "EXPENSE"');
    expect(eligibility).toContain('record.status !== "ACTIVE"');
    expect(eligibility).toContain('record.splitRole === "PARENT"');
    expect(eligibility).toContain("!Number.isInteger(record.amountCents)");
    expect(eligibility).toContain("record.amountCents >= 0");
    expect(eligibility).toContain("time >= window.dateFrom.getTime() && time < window.dateTo.getTime()");
  });

  it("keeps import commit reviewed, privacy-filtered, owner-scoped and direction-compatible", async () => {
    const { importCommit } = await sources();

    expect(importCommit).toContain('row.action === "IMPORT"');
    expect(importCommit).toContain('row.action === "SKIP"');
    expect(importCommit).toContain('row.action === "MERGE"');
    expect(importCommit).toContain('row.action !== "SKIP"');
    expect(importCommit).toContain('source: "MANUAL"');
    expect(importCommit).toContain('splitRole: { not: "PARENT" }');
    expect(importCommit).toContain("deriveTransactionType(row.amountCents");
    expect(importCommit).toContain("assertCategoryTypeCompatible(category.type, resolvedType)");
    expect(importCommit).toContain("sanitizeBankDescription");
    expect(importCommit).toContain("sanitizeTransactionNarration");
    expect(importCommit).toContain("assertNoPrivateBankIdentifiers");
  });

  it("keeps durable transfer linking exact, unique, user-confirmed and Australian-calendar bounded", async () => {
    const { transferLinks } = await sources();

    expect(transferLinks).toContain("TRANSFER_LINK_MAX_CALENDAR_DAY_DIFFERENCE = 2");
    expect(transferLinks).toContain('record.type === "TRANSFER"');
    expect(transferLinks).toContain('record.status === "ACTIVE"');
    expect(transferLinks).toContain('record.splitRole === "NONE"');
    expect(transferLinks).toContain("outgoing.amountCents < 0");
    expect(transferLinks).toContain("incoming.amountCents > 0");
    expect(transferLinks).toContain("outgoing.amountCents === -incoming.amountCents");
    expect(transferLinks).toContain('timeZone: "Australia/Brisbane"');
    expect(transferLinks).toContain("exactCandidates.length !== 1");
    expect(transferLinks).toContain('reasonCode: "USER_CONFIRMED" | "USER_UNLINKED"');
    expect(transferLinks).toContain('where: { id: input.outgoingTransactionId, userId }');
    expect(transferLinks).toContain('where: { id: input.incomingTransactionId, userId }');
  });

  it("keeps bulk operations bounded, fail-closed, direction-aware and safely undoable", async () => {
    const { bulkOperations } = await sources();

    expect(bulkOperations).toContain("BULK_OPERATIONS_RUNTIME_ENABLED = false");
    expect(bulkOperations).toContain("BULK_OPERATION_UNDO_WINDOW_MS = 30 * 60 * 1000");
    expect(bulkOperations).toContain("MAX_BULK_OPERATION_ITEMS = 250");
    expect(bulkOperations).toContain("Choose each transaction only once.");
    expect(bulkOperations).toContain('"SPLIT_PARENT"');
    expect(bulkOperations).toContain('"DIRECTION_NEEDS_CORRECTION"');
    expect(bulkOperations).toContain('"STALE_RECORD"');
    expect(bulkOperations).toContain('"NOT_FOUND_OR_NOT_OWNED"');
    expect(bulkOperations).toContain("isCategoryTypeCompatible");
    expect(bulkOperations).toContain("isTransactionTypeCompatible");
    expect(bulkOperations).toContain('where: { id: resolvedCategoryId,');
    expect(bulkOperations).toContain("userId,");
  });

  it("keeps Activity history owner-scoped and excludes raw audit metadata from client responses", async () => {
    const { activityHistory } = await sources();
    const responseType = activityHistory.match(/export type ActivityHistoryItem = \{[\s\S]*?\n\};/)?.[0] ?? "";

    expect(responseType).toContain("summary: string");
    expect(responseType).not.toMatch(/metadata|description|merchant|amount|balance|filename|accountNumber|address|provider/i);
    expect(activityHistory).toContain("requireAuthenticatedUserContext(context)");
    expect(activityHistory).toContain("assertUserOwnsRecord(user, transaction, \"transaction\")");
    expect(activityHistory).toContain("listRecent(user.userId, 100)");
    expect(activityHistory).toContain("listForTransaction(user.userId, transactionId, 50)");
    expect(activityHistory).not.toMatch(/metadata:\s*record\.metadata/);
    expect(activityHistory).not.toMatch(/JSON\.stringify\(record\.metadata\)/);
  });

  it("keeps responsive ledger criteria transient and preserves established lifecycle surfaces", async () => {
    const { ledger } = await sources();

    expect(ledger).toContain("Filter transactions");
    expect(ledger).toContain('type="search"');
    expect(ledger).toContain("aria-describedby={resultSummaryId}");
    expect(ledger).toContain('aria-live="polite"');
    expect(ledger).toContain("Clear search and filters");
    expect(ledger).toContain("<MonthlyCategoryChart");
    expect(ledger).toContain("<CategoryBreakdownView");
    expect(ledger).toContain("<TransactionPropertyLinkPanel");
    expect(ledger).toContain('title="Transaction details"');
    expect(ledger).toContain('title="Delete transaction?"');
    expect(ledger).not.toMatch(/localStorage|sessionStorage|URLSearchParams/);
    expect(ledger).not.toMatch(/Save view|Saved view|Default view/);
  });
});
