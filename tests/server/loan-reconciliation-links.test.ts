import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { resolveReconciliationLinkDecision, type ReconciliationLinkRequest } from "@/lib/loan-reconciliation";
import { AuthenticationRequiredError, OwnershipError } from "@/src/server/auth/ownership";
import {
  linkLoanRepayment,
  unlinkLoanRepayment,
  type LoanReconciliationLinkStore,
} from "@/src/server/loan-reconciliation-links";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

function memoryStore() {
  const links = new Map<string, { userId: string; transactionId: string; active: boolean }>();
  const store: LoanReconciliationLinkStore & { links: typeof links } = {
    links,
    async link(userId, repaymentId, request) {
      if (userId !== "user_1") throw new OwnershipError("loan repayment");
      const decision = resolveReconciliationLinkDecision({
        repaymentTotalCents: 160000,
        repaymentDate: "2026-06-18",
        transactionId: request.transactionId,
        transactionDate: "2026-06-18",
        transactionAmountCents: -320000,
        existingAllocationCents: 160000,
        mode: request.selectionMode,
        selectionMode: request.selectionMode,
        mismatchConfirmed: request.mismatchConfirmed,
      });
      links.set(repaymentId, { userId, transactionId: request.transactionId, active: true });
      return decision;
    },
    async unlink(userId, repaymentId) {
      if (userId !== "user_1") throw new OwnershipError("loan repayment");
      const link = links.get(repaymentId);
      if (!link?.active) return { alreadyUnlinked: true };
      link.active = false;
      return { alreadyUnlinked: false };
    },
  };
  return store;
}

const request: ReconciliationLinkRequest = {
  transactionId: "transaction_1",
  selectionMode: "SUGGESTED",
  mismatchConfirmed: false,
};

describe("manual loan reconciliation links", () => {
  it("links, unlinks, and safely relinks one repayment while supporting split allocation", async () => {
    const store = memoryStore();
    const user = createTestUserContext("user_1");
    const linked = await linkLoanRepayment(user, "repayment_1", request, store);
    expect(linked).toMatchObject({ confidence: "HIGH", existingAllocationCents: 160000, amountVarianceCents: 0 });
    expect((await unlinkLoanRepayment(user, "repayment_1", store)).alreadyUnlinked).toBe(false);
    await linkLoanRepayment(user, "repayment_1", { ...request, transactionId: "transaction_2" }, store);
    expect(store.links.get("repayment_1")).toMatchObject({ transactionId: "transaction_2", active: true });
  });

  it("requires authentication, ownership, and a strict privacy-safe payload", async () => {
    const store = memoryStore();
    await expect(linkLoanRepayment(null, "repayment_1", request, store)).rejects.toThrow(AuthenticationRequiredError);
    await expect(linkLoanRepayment(createTestUserContext("user_2"), "repayment_1", request, store)).rejects.toThrow(OwnershipError);
    await expect(linkLoanRepayment(createTestUserContext("user_1"), "repayment_1", { ...request, rawNarration: "not allowed" } as ReconciliationLinkRequest, store)).rejects.toThrow();
  });

  it("never writes or duplicates an everyday transaction", async () => {
    const source = await readFile(new URL("../../src/server/loan-reconciliation-links.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/transaction\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/);
    expect(source).toContain('data: { reconciliationStatus: "LINKED" }');
    expect(source).toContain('data: { reconciliationStatus: "UNMATCHED" }');
  });
});
