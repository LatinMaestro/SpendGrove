import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  applyPropertyRecordSuggestions,
  australianFinancialYear,
  createPropertyReviewAuditEvent,
  getPropertyRecordReview,
  isClassificationCompatible,
  propertyBulkSuggestionRequestSchema,
  resolvePropertyReviewRecords,
  selectApplicablePropertySuggestions,
  suggestPropertyRecordClassification,
  type PropertyRecordReviewStore,
  type PropertyReviewLoanPath,
  type PropertyReviewManualPath,
  type SafePropertyReviewRecord,
} from "@/src/server/property-report-review";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const servicePath = new URL("../../src/server/property-report-review.ts", import.meta.url);
const componentPath = new URL("../../components/property-record-review.tsx", import.meta.url);

function transaction(overrides: Partial<PropertyReviewManualPath["transaction"]> = {}): PropertyReviewManualPath["transaction"] {
  return {
    id: "transaction_1",
    userId: "user_1",
    date: new Date("2025-07-01T00:00:00.000Z"),
    amountCents: -12500,
    type: "EXPENSE",
    status: "ACTIVE",
    splitRole: "NONE",
    deletedAt: null,
    updatedAt: new Date("2026-07-03T00:00:00.000Z"),
    category: { name: "Synthetic category", isSeeded: false },
    propertyReportReview: null,
    ...overrides,
  };
}

describe("Phase 3C Property record review", () => {
  it("uses start-inclusive and end-exclusive Australian financial-year boundaries", () => {
    expect(australianFinancialYear(2026)).toMatchObject({
      label: "2025-26",
      startDate: "2025-07-01",
      endDate: "2026-06-30",
    });
    expect(australianFinancialYear(2026).start.toISOString()).toBe("2025-07-01T00:00:00.000Z");
    expect(australianFinancialYear(2026).end.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("keeps a manual Property link authoritative and deduplicates matching loan provenance", () => {
    const source = transaction();
    expect(resolvePropertyReviewRecords(
      "user_1",
      "property_1",
      [{ propertyId: "property_1", transaction: source }],
      [{ propertyId: "property_1", loanArchived: false, transaction: source }],
    )).toEqual([expect.objectContaining({
      transactionId: "transaction_1",
      provenance: "BOTH",
      relationshipConflict: false,
      classification: null,
      classificationNeedsReview: false,
    })]);

    expect(resolvePropertyReviewRecords(
      "user_1",
      "property_1",
      [{ propertyId: "property_1", transaction: source }],
      [{ propertyId: "property_2", loanArchived: false, transaction: source }],
    )[0]).toMatchObject({ provenance: "MANUAL_PROPERTY_LINK", relationshipConflict: true });
  });

  it("excludes ambiguous, unlinked, split-parent, inactive, deleted and cross-user records", () => {
    const source = transaction();
    const ambiguous: PropertyReviewLoanPath[] = [
      { propertyId: "property_1", loanArchived: false, transaction: source },
      { propertyId: "property_2", loanArchived: false, transaction: source },
    ];
    expect(resolvePropertyReviewRecords("user_1", "property_1", [], ambiguous)).toEqual([]);
    expect(resolvePropertyReviewRecords("user_1", "property_1", [], [])).toEqual([]);
    expect(resolvePropertyReviewRecords("user_1", "property_1", [{ propertyId: "property_1", transaction: transaction({ splitRole: "PARENT" }) }], [])).toEqual([]);
    expect(resolvePropertyReviewRecords("user_1", "property_1", [{ propertyId: "property_1", transaction: transaction({ status: "NEEDS_REVIEW" }) }], [])).toEqual([]);
    expect(resolvePropertyReviewRecords("user_1", "property_1", [{ propertyId: "property_1", transaction: transaction({ deletedAt: new Date("2026-07-04T00:00:00.000Z") }) }], [])).toEqual([]);
    expect(resolvePropertyReviewRecords("user_1", "property_1", [{ propertyId: "property_1", transaction: transaction({ userId: "user_2" }) }], [])).toEqual([]);
  });

  it("does not silently carry a classification to another Property", () => {
    const source = transaction({
      propertyReportReview: {
        propertyId: "property_2",
        classification: "PROPERTY_OUTGOING",
        updatedAt: new Date("2026-07-03T01:00:00.000Z"),
      },
    });
    expect(resolvePropertyReviewRecords("user_1", "property_1", [{ propertyId: "property_1", transaction: source }], [])[0])
      .toMatchObject({ classification: null, reviewUpdatedAt: null });
  });

  it("marks a saved classification for re-review when the current transaction is incompatible", () => {
    const source = transaction({
      type: "INCOME",
      amountCents: 12500,
      propertyReportReview: {
        propertyId: "property_1",
        classification: "PROPERTY_OUTGOING",
        updatedAt: new Date("2026-07-03T01:00:00.000Z"),
      },
    });
    expect(resolvePropertyReviewRecords("user_1", "property_1", [{ propertyId: "property_1", transaction: source }], [])[0])
      .toMatchObject({ classification: "PROPERTY_OUTGOING", classificationNeedsReview: true });
  });

  it("enforces neutral classification compatibility", () => {
    const expense = { type: "EXPENSE" as const, amountCents: -12500, provenance: "MANUAL_PROPERTY_LINK" as const };
    expect(isClassificationCompatible("PROPERTY_OUTGOING", expense)).toBe(true);
    expect(isClassificationCompatible("PROPERTY_INCOME", expense)).toBe(false);
    expect(isClassificationCompatible("LOAN_PAYMENT_CONTEXT", expense)).toBe(false);
    expect(isClassificationCompatible("LOAN_PAYMENT_CONTEXT", { ...expense, provenance: "LOAN_RECONCILIATION" })).toBe(true);
    expect(isClassificationCompatible("TRANSFER_CONTEXT", { ...expense, type: "TRANSFER" })).toBe(true);
    expect(isClassificationCompatible("REFUND_OR_REVERSAL", { ...expense, type: "INCOME", amountCents: 12500 })).toBe(true);
    expect(isClassificationCompatible("EXCLUDED", expense)).toBe(true);
  });

  it("suggests loan, manual outgoing and transfer classifications from safe facts", () => {
    const base = {
      type: "EXPENSE" as const,
      amountCents: -12500,
      provenance: "LOAN_RECONCILIATION" as const,
      relationshipConflict: false,
      classification: null,
      classificationNeedsReview: false,
      categoryName: "Synthetic category",
      categoryIsSeeded: false,
    };
    expect(suggestPropertyRecordClassification(base)).toEqual({
      classification: "LOAN_PAYMENT_CONTEXT",
      reasonCode: "LOAN_RECONCILIATION_EXPENSE",
    });
    expect(suggestPropertyRecordClassification({ ...base, provenance: "MANUAL_PROPERTY_LINK" })).toEqual({
      classification: "PROPERTY_OUTGOING",
      reasonCode: "MANUAL_PROPERTY_EXPENSE",
    });
    expect(suggestPropertyRecordClassification({ ...base, type: "TRANSFER", amountCents: -5000 })).toEqual({
      classification: "TRANSFER_CONTEXT",
      reasonCode: "TRANSFER_RECORD",
    });
  });

  it("uses only exact seeded income labels and does not over-classify other positive income", () => {
    const income = {
      type: "INCOME" as const,
      amountCents: 12500,
      provenance: "MANUAL_PROPERTY_LINK" as const,
      relationshipConflict: false,
      classification: null,
      classificationNeedsReview: false,
      categoryName: "Rental income",
      categoryIsSeeded: true,
    };
    expect(suggestPropertyRecordClassification(income)?.classification).toBe("PROPERTY_INCOME");
    expect(suggestPropertyRecordClassification({ ...income, categoryName: "Refunds / rebates" })?.classification).toBe("REFUND_OR_REVERSAL");
    expect(suggestPropertyRecordClassification({ ...income, categoryName: "Other income" })).toBeNull();
    expect(suggestPropertyRecordClassification({ ...income, categoryIsSeeded: false })).toBeNull();
    expect(suggestPropertyRecordClassification({ ...income, relationshipConflict: true })).toBeNull();
  });

  it("excludes split parents and cross-user records while allowing eligible split children", () => {
    const child = transaction({ id: "child", splitRole: "CHILD" });
    const records = resolvePropertyReviewRecords("user_1", "property_1", [
      { propertyId: "property_1", transaction: child },
      { propertyId: "property_1", transaction: transaction({ id: "parent", splitRole: "PARENT" }) },
      { propertyId: "property_1", transaction: transaction({ id: "foreign", userId: "user_2" }) },
    ], []);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ transactionId: "child", suggestedClassification: "PROPERTY_OUTGOING" });
  });

  it("requires confirmation and selects only compatible non-stale suggestions for bulk apply", () => {
    const record: SafePropertyReviewRecord = {
      transactionId: "transaction_1",
      date: "2025-07-01",
      amountCents: -12500,
      type: "EXPENSE",
      categoryName: "Synthetic category",
      transactionUpdatedAt: "2026-07-04T00:00:00.000Z",
      provenance: "MANUAL_PROPERTY_LINK",
      relationshipConflict: false,
      archivedLoanContext: false,
      classification: null,
      classificationNeedsReview: false,
      suggestedClassification: "PROPERTY_OUTGOING",
      suggestionReasonCode: "MANUAL_PROPERTY_EXPENSE",
      reviewUpdatedAt: null,
    };
    const current = { transactionId: record.transactionId, expectedTransactionUpdatedAt: record.transactionUpdatedAt, expectedReviewUpdatedAt: null };
    expect(selectApplicablePropertySuggestions([record], [current])).toHaveLength(1);
    expect(selectApplicablePropertySuggestions([record], [{ ...current, expectedTransactionUpdatedAt: "2026-07-04T01:00:00.000Z" }])).toEqual([]);
    expect(selectApplicablePropertySuggestions([{ ...record, suggestedClassification: "PROPERTY_INCOME" }], [current])).toEqual([]);
    expect(selectApplicablePropertySuggestions([{ ...record, relationshipConflict: true }], [current])).toEqual([]);
    expect(() => propertyBulkSuggestionRequestSchema.parse({ endingYear: 2026, items: [current] })).toThrow();
    expect(() => propertyBulkSuggestionRequestSchema.parse({ endingYear: 2026, confirmed: false, items: [current] })).toThrow();
  });

  it("scopes review reads to the authenticated user", async () => {
    const calls: Array<{ userId: string; propertyId: string; endingYear: number }> = [];
    const store: PropertyRecordReviewStore = {
      async read(userId, propertyId, endingYear) {
        calls.push({ userId, propertyId, endingYear });
        return {
          property: { id: propertyId, nickname: "Synthetic Property", isArchived: false },
          financialYear: { endingYear, label: "2025-26", startDate: "2025-07-01", endDate: "2026-06-30" },
          records: [],
        };
      },
      async classify() {
        return { classification: "EXCLUDED", updatedAt: "2026-07-03T00:00:00.000Z" };
      },
      async applySuggestions() {
        return { classifiedCount: 0, skippedCount: 0, remainingReviewCount: 0 };
      },
    };
    await getPropertyRecordReview(createTestUserContext("user_1"), "property_1", 2026, store);
    expect(calls).toEqual([{ userId: "user_1", propertyId: "property_1", endingYear: 2026 }]);
  });

  it("scopes confirmed bulk suggestions to the authenticated user", async () => {
    const calls: Array<{ userId: string; propertyId: string; endingYear: number }> = [];
    const store: PropertyRecordReviewStore = {
      async read() {
        throw new Error("not used");
      },
      async classify() {
        throw new Error("not used");
      },
      async applySuggestions(userId, propertyId, input) {
        calls.push({ userId, propertyId, endingYear: input.endingYear });
        return { classifiedCount: 1, skippedCount: 1, remainingReviewCount: 2 };
      },
    };
    await expect(applyPropertyRecordSuggestions(createTestUserContext("user_1"), "property_1", {
      endingYear: 2026,
      confirmed: true,
      items: [{
        transactionId: "transaction_1",
        expectedTransactionUpdatedAt: "2026-07-04T00:00:00.000Z",
        expectedReviewUpdatedAt: null,
      }],
    }, store)).resolves.toEqual({ classifiedCount: 1, skippedCount: 1, remainingReviewCount: 2 });
    expect(calls).toEqual([{ userId: "user_1", propertyId: "property_1", endingYear: 2026 }]);
  });

  it("audits only safe review state and classification codes", () => {
    const audit = createPropertyReviewAuditEvent("user_1", "transaction_1", "PROPERTY_OUTGOING", "UPDATED");
    expect(audit.metadata).toEqual({
      propertyReviewState: "UPDATED",
      classification: "PROPERTY_OUTGOING",
      reasonCode: "MANUAL_USER_REVIEW",
    });
    expect(createPropertyReviewAuditEvent("user_1", "transaction_1", "PROPERTY_OUTGOING", "CREATED", "CONFIRMED_SUGGESTION").metadata.reasonCode)
      .toBe("CONFIRMED_SUGGESTION");
    expect(Object.keys(audit.metadata)).not.toEqual(expect.arrayContaining([
      "amountCents",
      "transactionDate",
      "merchantName",
      "description",
      "narration",
      "filename",
      "address",
      "accountReference",
    ]));
  });

  it("revalidates current eligibility and stale timestamps without selecting private source text", async () => {
    const service = await readFile(servicePath, "utf8");
    expect(service).toContain('status: "ACTIVE"');
    expect(service).toContain('splitRole: { in: ["NONE", "CHILD"] }');
    expect(service).toContain("unlinkedAt: null");
    expect(service).toContain('property: { userId, deletedAt: null }');
    expect(service).toContain("isArchived: false");
    expect(service).toContain("expectedTransactionUpdatedAt");
    expect(service).toContain("expectedReviewUpdatedAt");
    const selectedTransactionFields = service.slice(service.indexOf("const transactionSelect"), service.indexOf("export type PropertyRecordReviewStore"));
    expect(selectedTransactionFields).not.toMatch(/description|merchantName|notes|narration|filename|account/i);
    expect(service).not.toMatch(/tx\.transaction\.(?:create|update|delete)/);
  });

  it("shows record review without tax claims or private source detail", async () => {
    const component = await readFile(componentPath, "utf8");
    expect(component).toContain("Property records");
    expect(component).toContain("Australian financial year");
    expect(component).toContain("Linked records are included automatically");
    expect(component).toContain("Included because this transaction is linked to this Property");
    expect(component).toContain("Included through a linked loan repayment");
    expect(component).toContain("Record keeping only - not tax advice.");
    expect(component).not.toContain("Suggested classification");
    expect(component).not.toContain("Apply suggested classifications");
    expect(component).not.toContain("Record classification");
    expect(component).not.toMatch(/deduct|claimable|taxable|ATO-ready|yield|equity|valuation|net worth/i);
    expect(component).not.toMatch(/description|merchantName|narration|filename|accountReference|address/);
    expect(component).not.toMatch(/netCents|profitCents|deductibleCents|taxableCents/);
  });
});
