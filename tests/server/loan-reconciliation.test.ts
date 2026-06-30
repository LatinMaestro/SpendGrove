import { describe, expect, it } from "vitest";
import { AuthenticationRequiredError, OwnershipError } from "@/src/server/auth/ownership";
import {
  listLoanReconciliationCandidates,
  type LoanReconciliationCandidateStore,
} from "@/src/server/loan-reconciliation";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

function store(options: { linked?: boolean } = {}): LoanReconciliationCandidateStore {
  return {
    async findRepayment(userId, repaymentId) {
      if (userId !== "user_1" || repaymentId !== "repayment_1") return null;
      return {
        id: repaymentId, userId, repaymentDate: new Date("2026-06-18T00:00:00.000Z"), totalPaymentCents: 180000,
        isArchived: false, deletedAt: null, reconciliationLink: options.linked ? { unlinkedAt: null } : null,
      };
    },
    async listTransactions(userId) {
      return [
        {
          id: "transaction_exact", userId, date: new Date("2026-06-19T00:00:00.000Z"), amountCents: -180000,
          status: "ACTIVE", splitRole: "NONE", deletedAt: null, loanReconciliationLinks: [],
        },
        {
          id: "transaction_manual", userId, date: new Date("2026-06-25T00:00:00.000Z"), amountCents: -180050,
          status: "ACTIVE", splitRole: "NONE", deletedAt: null, loanReconciliationLinks: [],
        },
        {
          id: "transaction_parent", userId, date: new Date("2026-06-18T00:00:00.000Z"), amountCents: -180000,
          status: "ACTIVE", splitRole: "PARENT", deletedAt: null, loanReconciliationLinks: [],
        },
        {
          id: "transaction_deleted", userId, date: new Date("2026-06-18T00:00:00.000Z"), amountCents: -180000,
          status: "DELETED", splitRole: "NONE", deletedAt: new Date(), loanReconciliationLinks: [],
        },
      ];
    },
  };
}

describe("loan reconciliation candidate suggestions", () => {
  it("returns deterministic safe candidates and excludes incompatible transactions", async () => {
    const candidates = await listLoanReconciliationCandidates(createTestUserContext("user_1"), "repayment_1", "SUGGESTED", store());
    expect(candidates).toEqual([expect.objectContaining({ transactionId: "transaction_exact", confidence: "HIGH" })]);
    expect(JSON.stringify(candidates)).not.toMatch(/description|merchant|narration|filename|raw|account|reference|bsb|card|customer/i);
  });

  it("returns no candidates for an already-linked repayment", async () => {
    expect(await listLoanReconciliationCandidates(createTestUserContext("user_1"), "repayment_1", "SUGGESTED", store({ linked: true }))).toEqual([]);
  });

  it("shows the approved $1 and 7-day band only after wider manual search", async () => {
    const user = createTestUserContext("user_1");
    const suggested = await listLoanReconciliationCandidates(user, "repayment_1", "SUGGESTED", store());
    expect(suggested.map((candidate) => candidate.transactionId)).not.toContain("transaction_manual");

    const manual = await listLoanReconciliationCandidates(user, "repayment_1", "MANUAL", store());
    expect(manual).toContainEqual(expect.objectContaining({
      transactionId: "transaction_manual",
      confidence: "MANUAL",
      amountVarianceCents: 50,
      dateDifferenceDays: 7,
    }));
  });

  it("requires authentication and repayment ownership", async () => {
    await expect(listLoanReconciliationCandidates(null, "repayment_1", "SUGGESTED", store())).rejects.toThrow(AuthenticationRequiredError);
    await expect(listLoanReconciliationCandidates(createTestUserContext("user_2"), "repayment_1", "SUGGESTED", store())).rejects.toThrow(OwnershipError);
  });
});
