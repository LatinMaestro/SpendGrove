import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("Phase 7 Preview durable transfer linking", () => {
  it("shows a transfer suggestion only in the guarded transaction detail workflow", async () => {
    const [page, ledger, panel] = await Promise.all([
      source("app/transactions/page.tsx"),
      source("components/durable-manual-transactions.tsx"),
      source("components/transfer-link-panel.tsx"),
    ]);

    expect(page).toContain("transferLinksAvailable={bulkOperationsAvailable}");
    expect(ledger).toContain('transferLinksAvailable && detailTransaction.type === "TRANSFER"');
    expect(panel).toContain("Possible transfer match");
    expect(panel).toContain("Outgoing transfer");
    expect(panel).toContain("Incoming transfer");
    expect(panel).toContain("Link transfers");
    expect(panel).toContain("Not a match");
    expect(panel).not.toMatch(/account number|BSB|narration|merchant/i);
  });

  it("requires explicit confirmation and preserves transfer financial treatment", async () => {
    const panel = await source("components/transfer-link-panel.tsx");

    expect(panel).toContain('method: "POST"');
    expect(panel).toContain("Confirm only if both accounts are yours.");
    expect(panel).toContain("does not change either amount or create another transaction");
    expect(panel).toContain("Transfers remain outside income, spending and budgets");
    expect(panel).not.toMatch(/automatic|auto-link|new transaction/i);
  });

  it("keeps unlink available and reads only safe owner-scoped review data", async () => {
    const [panel, service, route] = await Promise.all([
      source("components/transfer-link-panel.tsx"),
      source("src/server/transfer-links.ts"),
      source("app/api/account/transfer-links/route.ts"),
    ]);

    expect(panel).toContain("Unlink transfer");
    expect(panel).toContain('method: "DELETE"');
    expect(service).toContain("userId: user.userId");
    expect(service).toContain("exactCandidates.length !== 1");
    expect(service).toContain("isEligibleTransferPair");
    expect(route).toContain("getCurrentUserContext()");
    expect(route).toContain("getTransferLinkReview");
  });

  it("keeps Production disabled and export/deletion Preview-scoped", async () => {
    const [service, accountExport, accountDeletion] = await Promise.all([
      source("src/server/transfer-links.ts"),
      source("src/server/account-export.ts"),
      source("src/server/account-deletion.ts"),
    ]);

    expect(service).toContain("TRANSFER_LINK_RUNTIME_ENABLED = isVerifiedPreviewRuntime()");
    expect(accountExport).toContain("db.transferLink.findMany");
    expect(accountExport).toContain("isVerifiedPreviewRuntime()");
    expect(accountDeletion).toContain("transferLink.deleteMany");
    expect(accountDeletion).toContain("if (isVerifiedPreviewRuntime())");
  });
});
