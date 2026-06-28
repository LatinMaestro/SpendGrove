import { describe, expect, it } from "vitest";
import { AuthenticationRequiredError, OwnershipError } from "@/src/server/auth/ownership";
import {
  LoanRepaymentArchiveConflictError,
  listSafeLoanRepayments,
  updateLoanRepaymentArchiveState,
  type LoanRepaymentHistoryStore,
  type StoredLoanRepayment,
} from "@/src/server/loan-repayment-history";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

function repayment(overrides: Partial<StoredLoanRepayment> = {}): StoredLoanRepayment {
  return {
    id: "repayment_1",
    userId: "user_1",
    loanAccountId: "loan_1",
    repaymentDate: new Date("2026-06-18T00:00:00.000Z"),
    totalPaymentCents: 180000,
    principalCents: 107500,
    interestCents: 70000,
    feeCents: 2500,
    balanceAfterCents: 14927500,
    source: "LOAN_CSV",
    reconciliationStatus: "UNMATCHED",
    isArchived: false,
    deletedAt: null,
    reconciliationLink: null,
    ...overrides,
  };
}

function memoryStore(rows = [repayment()]) {
  const stored = [...rows];
  const store: LoanRepaymentHistoryStore & { rows: StoredLoanRepayment[] } = {
    rows: stored,
    async listRepayments(userId) {
      return stored.filter((row) => row.userId === userId);
    },
    async findRepayment(userId, repaymentId) {
      return stored.find((row) => row.userId === userId && row.id === repaymentId) ?? null;
    },
    async updateArchiveState(userId, repaymentId, isArchived) {
      const row = stored.find((item) => item.userId === userId && item.id === repaymentId);
      if (!row) throw new Error("not found");
      row.isArchived = isArchived;
      return row;
    },
  };
  return store;
}

describe("safe loan repayment history", () => {
  it("lists owned structured breakdowns without raw source details", async () => {
    const result = await listSafeLoanRepayments(createTestUserContext("user_1"), memoryStore());
    expect(result[0]).toMatchObject({
      loanAccountId: "loan_1",
      repaymentDate: "2026-06-18",
      totalPaymentCents: 180000,
      reconciliationStatus: "UNMATCHED",
      linkedTransaction: null,
    });
    expect(JSON.stringify(result)).not.toMatch(/filename|raw|narration|accountNumber|reference|bsb|card|customer/i);
  });

  it("shows safe linked transaction context only for an active link", async () => {
    const linked = repayment({
      reconciliationStatus: "LINKED",
      reconciliationLink: {
        unlinkedAt: null,
        transaction: {
          id: "transaction_1", userId: "user_1", date: new Date("2026-06-19T00:00:00.000Z"),
          amountCents: -180000, status: "ACTIVE", splitRole: "NONE", deletedAt: null,
        },
      },
    });
    const [result] = await listSafeLoanRepayments(createTestUserContext("user_1"), memoryStore([linked]));
    expect(result.linkedTransaction).toEqual({ transactionId: "transaction_1", date: "2026-06-19", amountCents: -180000 });
    expect(result.reconciliationStatus).toBe("LINKED");
  });

  it("archives and restores an owned unmatched repayment", async () => {
    const store = memoryStore();
    const user = createTestUserContext("user_1");
    expect((await updateLoanRepaymentArchiveState(user, "repayment_1", { isArchived: true }, store)).isArchived).toBe(true);
    expect((await updateLoanRepaymentArchiveState(user, "repayment_1", { isArchived: false }, store)).isArchived).toBe(false);
  });

  it("requires authentication, ownership, and unlinking before archive", async () => {
    const linked = repayment({
      reconciliationLink: {
        unlinkedAt: null,
        transaction: { id: "transaction_1", userId: "user_1", date: new Date(), amountCents: -180000, status: "ACTIVE", splitRole: "NONE", deletedAt: null },
      },
    });
    await expect(listSafeLoanRepayments(null, memoryStore())).rejects.toThrow(AuthenticationRequiredError);
    await expect(updateLoanRepaymentArchiveState(createTestUserContext("user_2"), "repayment_1", { isArchived: true }, memoryStore())).rejects.toThrow(OwnershipError);
    await expect(updateLoanRepaymentArchiveState(createTestUserContext("user_1"), "repayment_1", { isArchived: true }, memoryStore([linked]))).rejects.toThrow(LoanRepaymentArchiveConflictError);
  });
});
