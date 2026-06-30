import { describe, expect, it } from "vitest";
import {
  loanRepaymentBulkArchiveSchema,
  loanRepaymentCorrectionSchema,
  type LoanRepaymentCorrectionInput,
} from "@/lib/loan-repayment-history";
import { AuthenticationRequiredError, OwnershipError } from "@/src/server/auth/ownership";
import {
  LoanRepaymentArchiveConflictError,
  LoanRepaymentCorrectionConflictError,
  LoanRepaymentCorrectionNoChangesError,
  LoanRepaymentCorrectionStateError,
  createLoanRepaymentArchiveAuditEvent,
  createLoanRepaymentCorrectionAuditEvent,
  correctLoanRepayment,
  bulkUpdateLoanRepaymentArchiveState,
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
    importBatchId: "batch_1",
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
    updatedAt: new Date("2026-06-18T01:00:00.000Z"),
    reconciliationLink: null,
    ...overrides,
  };
}

function memoryStore(rows = [repayment()], options: { activeLoan?: boolean } = {}) {
  const stored = [...rows];
  const store: LoanRepaymentHistoryStore & { rows: StoredLoanRepayment[] } = {
    rows: stored,
    async listRepayments(userId) {
      return stored.filter((row) => row.userId === userId);
    },
    async findRepayment(userId, repaymentId) {
      return stored.find((row) => row.userId === userId && row.id === repaymentId) ?? null;
    },
    async isActiveLoanAccount(userId, loanAccountId) {
      return options.activeLoan !== false && userId === "user_1" && loanAccountId === "loan_1";
    },
    async updateArchiveState(userId, repaymentId, isArchived) {
      const row = stored.find((item) => item.userId === userId && item.id === repaymentId);
      if (!row) throw new Error("not found");
      row.isArchived = isArchived;
      return row;
    },
    async bulkUpdateArchiveState(userId, input, now) {
      const selected = input.repayments.map((selection) => stored.find((row) => row.id === selection.repaymentId));
      if (selected.some((row) => !row || row.userId !== userId || row.deletedAt !== null)) throw new OwnershipError("loan repayments");
      let changedCount = 0;
      let skippedCount = 0;
      input.repayments.forEach((selection, index) => {
        const row = selected[index]!;
        if (
          row.updatedAt.toISOString() !== selection.expectedUpdatedAt
          || row.isArchived === input.isArchived
          || (input.isArchived && row.reconciliationLink?.unlinkedAt === null)
        ) {
          skippedCount += 1;
          return;
        }
        row.isArchived = input.isArchived;
        row.updatedAt = now;
        changedCount += 1;
      });
      return { requestedCount: input.repayments.length, changedCount, skippedCount, isArchived: input.isArchived };
    },
    async correctRepayment(userId, repaymentId, input, _changedFieldCodes, now) {
      const row = stored.find((item) => item.userId === userId && item.id === repaymentId);
      if (!row || row.updatedAt.toISOString() !== input.expectedUpdatedAt) throw new LoanRepaymentCorrectionConflictError();
      row.repaymentDate = new Date(`${input.repayment.repaymentDate}T00:00:00.000Z`);
      row.totalPaymentCents = input.repayment.totalPaymentCents;
      row.principalCents = input.repayment.principalCents;
      row.interestCents = input.repayment.interestCents;
      row.feeCents = input.repayment.feeCents;
      row.balanceAfterCents = input.repayment.balanceAfterCents;
      row.reconciliationStatus = "UNMATCHED";
      row.updatedAt = now;
      return row;
    },
  };
  return store;
}

describe("safe loan repayment history", () => {
  const correction: LoanRepaymentCorrectionInput = {
    expectedUpdatedAt: "2026-06-18T01:00:00.000Z",
    repayment: {
      repaymentDate: "2026-06-19",
      totalPaymentCents: 180000,
      principalCents: 107400,
      interestCents: 70100,
      feeCents: 2500,
      balanceAfterCents: 14747500,
    },
  };

  it("builds privacy-safe archive and restore audit events with the approved entity value", () => {
    const archived = createLoanRepaymentArchiveAuditEvent("user_1", "repayment_1", true);
    const restored = createLoanRepaymentArchiveAuditEvent("user_1", "repayment_1", false);

    expect(archived).toMatchObject({ entityType: "LOAN_REPAYMENT", action: "ARCHIVED", metadata: { stateCode: "ARCHIVED" } });
    expect(restored).toMatchObject({ entityType: "LOAN_REPAYMENT", action: "UPDATED", metadata: { stateCode: "ACTIVE" } });
    expect(JSON.stringify([archived, restored])).not.toMatch(/amount|balance|narration|filename|account|reference|bsb|card|customer/i);
  });

  it("lists owned structured breakdowns without raw source details", async () => {
    const result = await listSafeLoanRepayments(createTestUserContext("user_1"), memoryStore());
    expect(result[0]).toMatchObject({
      loanAccountId: "loan_1",
      repaymentDate: "2026-06-18",
      totalPaymentCents: 180000,
      reconciliationStatus: "UNMATCHED",
      linkedTransaction: null,
      updatedAt: "2026-06-18T01:00:00.000Z",
    });
    expect(JSON.stringify(result)).not.toMatch(/filename|raw|narration|accountNumber|reference|bsb|card|customer/i);
  });

  it("corrects approved structured fields while preserving ownership, source and import lineage", async () => {
    const store = memoryStore();
    const corrected = await correctLoanRepayment(
      createTestUserContext("user_1"),
      "repayment_1",
      correction,
      store,
      new Date("2026-06-20T01:00:00.000Z"),
    );

    expect(corrected).toMatchObject({
      repaymentDate: "2026-06-19",
      principalCents: 107400,
      interestCents: 70100,
      reconciliationStatus: "UNMATCHED",
      updatedAt: "2026-06-20T01:00:00.000Z",
    });
    expect(store.rows[0]).toMatchObject({ userId: "user_1", loanAccountId: "loan_1", importBatchId: "batch_1", source: "LOAN_CSV" });
  });

  it("uses privacy-safe changed-field codes in correction audit metadata", () => {
    const audit = createLoanRepaymentCorrectionAuditEvent("user_1", "repayment_1", ["REPAYMENT_DATE", "PRINCIPAL", "INTEREST", "BALANCE_AFTER"]);
    expect(audit).toMatchObject({
      entityType: "LOAN_REPAYMENT",
      action: "UPDATED",
      metadata: { stateCode: "CORRECTED", changedFieldCodes: ["REPAYMENT_DATE", "PRINCIPAL", "INTEREST", "BALANCE_AFTER"] },
    });
    expect(Object.keys(audit.metadata).sort()).toEqual(["changedFieldCodes", "stateCode"]);
    expect(audit.metadata).not.toHaveProperty("oldAmount");
    expect(audit.metadata).not.toHaveProperty("newAmount");
    expect(audit.metadata).not.toHaveProperty("balanceAfterCents");
    expect(audit.metadata).not.toHaveProperty("repaymentDate");
  });

  it("rejects linked, archived, inactive-loan, stale and unchanged corrections", async () => {
    const user = createTestUserContext("user_1");
    const linked = repayment({ reconciliationLink: {
      unlinkedAt: null,
      transaction: { id: "transaction_1", userId: "user_1", date: new Date(), amountCents: -180000, status: "ACTIVE", splitRole: "NONE", deletedAt: null },
    } });
    await expect(correctLoanRepayment(user, "repayment_1", correction, memoryStore([linked]))).rejects.toThrow(LoanRepaymentCorrectionStateError);
    await expect(correctLoanRepayment(user, "repayment_1", correction, memoryStore([repayment({ isArchived: true })]))).rejects.toThrow(LoanRepaymentCorrectionStateError);
    await expect(correctLoanRepayment(user, "repayment_1", correction, memoryStore([repayment({ reconciliationStatus: "NEEDS_REVIEW" })]))).rejects.toThrow(LoanRepaymentCorrectionStateError);
    await expect(correctLoanRepayment(user, "repayment_1", correction, memoryStore(undefined, { activeLoan: false }))).rejects.toThrow(LoanRepaymentCorrectionStateError);
    await expect(correctLoanRepayment(user, "repayment_1", { ...correction, expectedUpdatedAt: "2026-06-18T02:00:00.000Z" }, memoryStore())).rejects.toThrow(LoanRepaymentCorrectionConflictError);
    await expect(correctLoanRepayment(user, "repayment_1", {
      expectedUpdatedAt: correction.expectedUpdatedAt,
      repayment: {
        repaymentDate: "2026-06-18", totalPaymentCents: 180000, principalCents: 107500,
        interestCents: 70000, feeCents: 2500, balanceAfterCents: 14927500,
      },
    }, memoryStore())).rejects.toThrow(LoanRepaymentCorrectionNoChangesError);
  });

  it("validates correction component rules and rejects unknown or cross-user input", async () => {
    expect(() => loanRepaymentCorrectionSchema.parse({
      ...correction,
      repayment: { ...correction.repayment, principalCents: 180001 },
    })).toThrow(/components cannot exceed/i);
    expect(() => loanRepaymentCorrectionSchema.parse({ ...correction, rawNarration: "not allowed" })).toThrow();
    await expect(correctLoanRepayment(null, "repayment_1", correction, memoryStore())).rejects.toThrow(AuthenticationRequiredError);
    await expect(correctLoanRepayment(createTestUserContext("user_2"), "repayment_1", correction, memoryStore())).rejects.toThrow(OwnershipError);
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

  it("bulk archives owned fresh unlinked repayments and reports stale or newly linked selections as skipped", async () => {
    const linkedTransaction = {
      id: "transaction_1", userId: "user_1", date: new Date(), amountCents: -180000,
      status: "ACTIVE", splitRole: "NONE", deletedAt: null,
    };
    const rows = [
      repayment({ id: "repayment_fresh" }),
      repayment({ id: "repayment_stale" }),
      repayment({ id: "repayment_linked", reconciliationLink: { unlinkedAt: null, transaction: linkedTransaction } }),
    ];
    const store = memoryStore(rows);
    const summary = await bulkUpdateLoanRepaymentArchiveState(createTestUserContext("user_1"), {
      isArchived: true,
      confirmed: true,
      repayments: [
        { repaymentId: "repayment_fresh", expectedUpdatedAt: "2026-06-18T01:00:00.000Z" },
        { repaymentId: "repayment_stale", expectedUpdatedAt: "2026-06-18T02:00:00.000Z" },
        { repaymentId: "repayment_linked", expectedUpdatedAt: "2026-06-18T01:00:00.000Z" },
      ],
    }, store, new Date("2026-07-01T00:00:00.000Z"));

    expect(summary).toEqual({ requestedCount: 3, changedCount: 1, skippedCount: 2, isArchived: true });
    expect(store.rows.find((row) => row.id === "repayment_fresh")?.isArchived).toBe(true);
    expect(store.rows.find((row) => row.id === "repayment_linked")?.reconciliationLink?.transaction).toEqual(linkedTransaction);
  });

  it("bulk restores archived repayments without changing source, lineage, or linked transaction evidence", async () => {
    const row = repayment({ isArchived: true });
    const store = memoryStore([row]);
    const summary = await bulkUpdateLoanRepaymentArchiveState(createTestUserContext("user_1"), {
      isArchived: false,
      confirmed: true,
      repayments: [{ repaymentId: row.id, expectedUpdatedAt: row.updatedAt.toISOString() }],
    }, store, new Date("2026-07-01T00:00:00.000Z"));

    expect(summary.changedCount).toBe(1);
    expect(store.rows[0]).toMatchObject({ isArchived: false, source: "LOAN_CSV", importBatchId: "batch_1" });
  });

  it("caps confirmed bulk cleanup at 100 unique selections and rejects cross-user or deleted IDs", async () => {
    const selection = { repaymentId: "repayment_1", expectedUpdatedAt: "2026-06-18T01:00:00.000Z" };
    expect(() => loanRepaymentBulkArchiveSchema.parse({ isArchived: true, confirmed: false, repayments: [selection] })).toThrow();
    expect(() => loanRepaymentBulkArchiveSchema.parse({ isArchived: true, confirmed: true, repayments: [selection, selection] })).toThrow(/only once/i);
    expect(() => loanRepaymentBulkArchiveSchema.parse({
      isArchived: true,
      confirmed: true,
      repayments: Array.from({ length: 101 }, (_, index) => ({ ...selection, repaymentId: `repayment_${index}` })),
    })).toThrow();
    await expect(bulkUpdateLoanRepaymentArchiveState(createTestUserContext("user_1"), {
      isArchived: true,
      confirmed: true,
      repayments: [{ repaymentId: "repayment_other", expectedUpdatedAt: selection.expectedUpdatedAt }],
    }, memoryStore([repayment({ id: "repayment_other", userId: "user_2" })]))).rejects.toThrow(OwnershipError);
    await expect(bulkUpdateLoanRepaymentArchiveState(createTestUserContext("user_1"), {
      isArchived: true,
      confirmed: true,
      repayments: [{ repaymentId: "repayment_deleted", expectedUpdatedAt: selection.expectedUpdatedAt }],
    }, memoryStore([repayment({ id: "repayment_deleted", deletedAt: new Date() })]))).rejects.toThrow(OwnershipError);
  });
});
