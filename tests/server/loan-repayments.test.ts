import { describe, expect, it } from "vitest";
import {
  createLoanRepaymentCommitRequest,
  loanRepaymentCommitRequestSchema,
  type LoanRepaymentCommitRequest,
} from "@/lib/loan-repayment-commit";
import { scanLoanCsv } from "@/lib/loan-csv-review";
import { AuthenticationRequiredError, OwnershipError } from "@/src/server/auth/ownership";
import {
  commitReviewedLoanRepayments,
  listSafeLoanImportHistory,
  type LoanRepaymentStore,
} from "@/src/server/loan-repayments";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const request: LoanRepaymentCommitRequest = {
  requestId: "11111111-1111-4111-8111-111111111111",
  loanAccountId: "loan_owned",
  reviewedRowCount: 2,
  excludedRowCount: 1,
  privateFieldCount: 2,
  rows: [{
    repaymentDate: "2026-06-18",
    totalPaymentCents: 180000,
    principalCents: 107500,
    interestCents: 70000,
    feeCents: 2500,
    balanceAfterCents: 14927500,
  }],
};

function memoryStore() {
  const batches = new Map<string, {
    id: string; userId: string; type: string; status: string; rowCount: number;
    importedCount: number; skippedCount: number; createdAt: Date; completedAt: Date | null;
    loanAccountIds: string[];
  }>();
  const repayments: Array<Record<string, unknown>> = [];
  const store: LoanRepaymentStore & { repayments: typeof repayments } = {
    repayments,
    async commit(userId, input, now) {
      const existing = batches.get(input.requestId);
      if (existing) {
        if (existing.userId !== userId) throw new OwnershipError("loan import batch");
        return { batchId: existing.id, totalCount: existing.rowCount, savedCount: existing.importedCount, excludedCount: existing.skippedCount, alreadyCommitted: true };
      }
      const next = input.rows.map((row) => ({ ...row, userId, loanAccountId: input.loanAccountId, source: "LOAN_CSV", reconciliationStatus: "UNMATCHED" }));
      repayments.push(...next);
      batches.set(input.requestId, {
        id: input.requestId, userId, type: "LOAN_CSV", status: "COMPLETED",
        rowCount: input.reviewedRowCount, importedCount: input.rows.length, skippedCount: input.excludedRowCount,
        createdAt: now, completedAt: now, loanAccountIds: [input.loanAccountId],
      });
      return { batchId: input.requestId, totalCount: input.reviewedRowCount, savedCount: input.rows.length, excludedCount: input.excludedRowCount, alreadyCommitted: false };
    },
    async listImports(userId, limit) {
      return [...batches.values()].filter((batch) => batch.userId === userId).slice(0, limit);
    },
  };
  return store;
}

describe("durable reviewed loan repayment commit", () => {
  it("saves only structured reviewed values and returns the original result on retry", async () => {
    const store = memoryStore();
    const user = createTestUserContext("user_1");
    const first = await commitReviewedLoanRepayments(user, request, store, new Date("2026-06-18T00:00:00.000Z"));
    const retry = await commitReviewedLoanRepayments(user, request, store);

    expect(first).toMatchObject({ savedCount: 1, excludedCount: 1, alreadyCommitted: false });
    expect(retry.alreadyCommitted).toBe(true);
    expect(store.repayments).toHaveLength(1);
    expect(store.repayments[0]).toMatchObject({ loanAccountId: "loan_owned", totalPaymentCents: 180000, source: "LOAN_CSV", reconciliationStatus: "UNMATCHED" });
    expect(JSON.stringify(store.repayments)).not.toMatch(/raw|filename|narration|accountNumber|reference|bsb|card|customer/i);
  });

  it("requires authentication and rejects cross-user retry ownership", async () => {
    const store = memoryStore();
    await expect(commitReviewedLoanRepayments(null, request, store)).rejects.toThrow(AuthenticationRequiredError);
    await commitReviewedLoanRepayments(createTestUserContext("user_1"), request, store);
    await expect(commitReviewedLoanRepayments(createTestUserContext("user_2"), request, store)).rejects.toThrow(OwnershipError);
  });

  it("rejects extra private or raw source fields and unsafe component totals", () => {
    expect(() => loanRepaymentCommitRequestSchema.parse({ ...request, filename: "loan.csv" })).toThrow();
    expect(() => loanRepaymentCommitRequestSchema.parse({ ...request, rows: [{ ...request.rows[0], rawNarration: "not allowed" }] })).toThrow();
    expect(() => loanRepaymentCommitRequestSchema.parse({
      ...request,
      rows: [{ ...request.rows[0], principalCents: 200000 }],
    })).toThrow(/components cannot exceed/i);
  });

  it("excludes warning and non-repayment rows before building the payload", () => {
    const review = scanLoanCsv([
      "01/06/2026,-500.00,Regular repayment,24500.00",
      "02/06/2026,75.25,Interest charge,24575.25",
    ].join("\n"));
    const selected = new Set(review.rows.map((row) => row.rowNumber));
    expect(() => createLoanRepaymentCommitRequest({
      requestId: request.requestId,
      loanAccountId: request.loanAccountId,
      rows: review.rows,
      selectedRowNumbers: selected,
      privateFieldCount: 0,
    })).toThrow(/clear repayment breakdowns/i);
  });

  it("returns aggregate-only loan import history", async () => {
    const store = memoryStore();
    const user = createTestUserContext("user_1");
    await commitReviewedLoanRepayments(user, request, store, new Date("2026-06-18T00:00:00.000Z"));
    const history = await listSafeLoanImportHistory(user, store);
    expect(history).toEqual([{
      completedAt: "2026-06-18T00:00:00.000Z",
      reviewedCount: 2,
      savedCount: 1,
      excludedCount: 1,
    }]);
    expect(JSON.stringify(history)).not.toMatch(/batchId|loanAccount|amount|balance|filename|raw|narration/i);
  });
});
