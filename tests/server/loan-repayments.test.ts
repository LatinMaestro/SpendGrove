import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import {
  createLoanRepaymentCommitRequest,
  isCommittableLoanRepaymentRow,
  loanRepaymentCommitRequestSchema,
  type LoanRepaymentCommitRequest,
} from "@/lib/loan-repayment-commit";
import { assessLoanRepaymentDuplicates, type ComparableLoanRepayment } from "@/lib/loan-repayment-duplicates";
import { scanLoanCsv } from "@/lib/loan-csv-review";
import { AuthenticationRequiredError, OwnershipError } from "@/src/server/auth/ownership";
import {
  commitReviewedLoanRepayments,
  assessReviewedLoanRepaymentDuplicates,
  listSafeLoanImportHistory,
  LoanRepaymentDuplicateReviewRequiredError,
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
    reviewRowNumber: 1,
    duplicateOverrideConfirmed: false,
    repaymentDate: "2026-06-18",
    totalPaymentCents: 180000,
    principalCents: 107500,
    interestCents: 70000,
    feeCents: 2500,
    balanceAfterCents: 14927500,
  }],
};

function memoryStore(existingRepayments: ComparableLoanRepayment[] = []) {
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
      const duplicateSignals = assessLoanRepaymentDuplicates(input.rows, existingRepayments);
      const likelyRows = new Set(duplicateSignals.filter((signal) => signal.classification === "LIKELY_DUPLICATE").map((signal) => signal.reviewRowNumber));
      if (input.rows.some((row) => likelyRows.has(row.reviewRowNumber) && !row.duplicateOverrideConfirmed)) {
        throw new LoanRepaymentDuplicateReviewRequiredError();
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
    async assessDuplicates(_userId, input) {
      return assessLoanRepaymentDuplicates(input.rows, existingRepayments);
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

  it("default-excludes exact structured matches and requires a per-row Save anyway override", async () => {
    const existing = request.rows.map(({ reviewRowNumber: _reviewRowNumber, duplicateOverrideConfirmed: _override, ...row }) => row);
    const store = memoryStore(existing);
    const user = createTestUserContext("user_1");
    const signals = await assessReviewedLoanRepaymentDuplicates(user, {
      loanAccountId: request.loanAccountId,
      rows: request.rows.map(({ duplicateOverrideConfirmed: _override, ...row }) => row),
    }, store);

    expect(signals).toEqual([{ reviewRowNumber: 1, classification: "LIKELY_DUPLICATE", reasonCode: "EXACT_STRUCTURED_MATCH" }]);
    await expect(commitReviewedLoanRepayments(user, request, store)).rejects.toThrow(LoanRepaymentDuplicateReviewRequiredError);
    await expect(commitReviewedLoanRepayments(user, {
      ...request,
      rows: [{ ...request.rows[0], duplicateOverrideConfirmed: true }],
    }, store)).resolves.toMatchObject({ savedCount: 1 });
  });

  it("shows same-date/same-total component differences as possible overlaps without blocking save", async () => {
    const existing = request.rows.map(({ reviewRowNumber: _reviewRowNumber, duplicateOverrideConfirmed: _override, ...row }) => ({ ...row, principalCents: 107499 }));
    const store = memoryStore(existing);
    const user = createTestUserContext("user_1");
    const signals = await assessReviewedLoanRepaymentDuplicates(user, {
      loanAccountId: request.loanAccountId,
      rows: request.rows.map(({ duplicateOverrideConfirmed: _override, ...row }) => row),
    }, store);

    expect(signals).toEqual([{ reviewRowNumber: 1, classification: "POSSIBLE_OVERLAP", reasonCode: "SAME_DATE_AND_TOTAL" }]);
    await expect(commitReviewedLoanRepayments(user, request, store)).resolves.toMatchObject({ savedCount: 1 });
  });

  it("treats only the later exact row in one review as likely and never uses private source text", () => {
    const row = { ...request.rows[0] };
    expect(assessLoanRepaymentDuplicates([
      row,
      { ...row, reviewRowNumber: 2 },
    ], [])).toEqual([{ reviewRowNumber: 2, classification: "LIKELY_DUPLICATE", reasonCode: "EXACT_STRUCTURED_MATCH" }]);
    expect(JSON.stringify(assessLoanRepaymentDuplicates([row], []))).not.toMatch(/narration|filename|fingerprint|account|reference/i);
  });

  it("rechecks active and archived non-deleted repayments inside a serializable commit", async () => {
    const source = await readFile(new URL("../../src/server/loan-repayments.ts", import.meta.url), "utf8");

    expect(source).toContain("loanAccountId: loan.id, deletedAt: null");
    expect(source).toContain("TransactionIsolationLevel.Serializable");
    expect(source).toContain('error.code === "P2034"');
  });

  it("excludes warning and non-repayment rows before building the payload", () => {
    const review = scanLoanCsv([
      "01/06/2026,-500.00,Regular repayment,24500.00",
      "02/06/2026,75.25,Interest charge,24575.25",
      "03/06/2026,-500.00,Regular repayment,24075.25",
    ].join("\n"));
    const selected = new Set(review.rows.map((row) => row.rowNumber));
    expect(() => createLoanRepaymentCommitRequest({
      requestId: request.requestId,
      loanAccountId: request.loanAccountId,
      rows: review.rows,
      selectedRowNumbers: selected,
      privateFieldCount: 0,
    })).toThrow(/clear repayment breakdowns/i);

    const clearRows = review.rows.filter(isCommittableLoanRepaymentRow);
    expect(clearRows).toHaveLength(2);
    const oneSelected = new Set([clearRows[0].rowNumber]);
    expect(createLoanRepaymentCommitRequest({
      requestId: request.requestId,
      loanAccountId: request.loanAccountId,
      rows: review.rows,
      selectedRowNumbers: oneSelected,
      privateFieldCount: 0,
    })).toMatchObject({ reviewedRowCount: 3, excludedRowCount: 2, rows: [expect.any(Object)] });
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
