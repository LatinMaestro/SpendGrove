import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  australianFinancialYear,
  createPropertyReviewAuditEvent,
  getPropertyRecordReview,
  isClassificationCompatible,
  resolvePropertyReviewRecords,
  type PropertyRecordReviewStore,
  type PropertyReviewLoanPath,
  type PropertyReviewManualPath,
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
    category: { name: "Synthetic category" },
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

  it("excludes ambiguous loan paths, split parents, inactive records and cross-user records", () => {
    const source = transaction();
    const ambiguous: PropertyReviewLoanPath[] = [
      { propertyId: "property_1", loanArchived: false, transaction: source },
      { propertyId: "property_2", loanArchived: false, transaction: source },
    ];
    expect(resolvePropertyReviewRecords("user_1", "property_1", [], ambiguous)).toEqual([]);
    expect(resolvePropertyReviewRecords("user_1", "property_1", [{ propertyId: "property_1", transaction: transaction({ splitRole: "PARENT" }) }], [])).toEqual([]);
    expect(resolvePropertyReviewRecords("user_1", "property_1", [{ propertyId: "property_1", transaction: transaction({ status: "NEEDS_REVIEW" }) }], [])).toEqual([]);
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
    };
    await getPropertyRecordReview(createTestUserContext("user_1"), "property_1", 2026, store);
    expect(calls).toEqual([{ userId: "user_1", propertyId: "property_1", endingYear: 2026 }]);
  });

  it("audits only safe review state and classification codes", () => {
    const audit = createPropertyReviewAuditEvent("user_1", "transaction_1", "PROPERTY_OUTGOING", "UPDATED");
    expect(audit.metadata).toEqual({
      propertyReviewState: "UPDATED",
      classification: "PROPERTY_OUTGOING",
      reasonCode: "MANUAL_USER_REVIEW",
    });
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

  it("shows record review with no totals, tax outcomes or private source detail", async () => {
    const component = await readFile(componentPath, "utf8");
    expect(component).toContain("Property record review");
    expect(component).toContain("Australian financial year");
    expect(component).toContain("No classification is chosen automatically.");
    expect(component).toContain("saved classification needs review");
    expect(component).toContain("Record keeping only - not tax advice.");
    expect(component).not.toMatch(/deduct|claimable|taxable|ATO-ready|profit|yield|equity|valuation|net worth/i);
    expect(component).not.toMatch(/description|merchantName|narration|filename|accountReference|address/);
    expect(component).not.toMatch(/reduce\(|totalCents|summaryTotal/);
  });
});
