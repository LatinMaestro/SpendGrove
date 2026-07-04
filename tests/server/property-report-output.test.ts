import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  createPropertyRecordCsv,
  getPropertyRecordCsv,
  summarizePropertyRecords,
} from "@/src/server/property-report-output";
import type {
  PropertyRecordReviewStore,
  SafePropertyRecordReview,
  SafePropertyReviewRecord,
} from "@/src/server/property-report-review";
import { createTestUserContext } from "@/tests/server/auth-test-helpers";

const outputPath = new URL("../../src/server/property-report-output.ts", import.meta.url);
const exportRoutePath = new URL("../../app/api/account/properties/[propertyId]/report-export/route.ts", import.meta.url);
const componentPath = new URL("../../components/property-record-review.tsx", import.meta.url);

function record(overrides: Partial<SafePropertyReviewRecord> = {}): SafePropertyReviewRecord {
  return {
    transactionId: "transaction_1",
    date: "2025-07-01",
    amountCents: -12500,
    type: "EXPENSE",
    categoryName: "Synthetic category",
    transactionUpdatedAt: "2026-07-04T00:00:00.000Z",
    provenance: "MANUAL_PROPERTY_LINK",
    relationshipConflict: false,
    archivedLoanContext: false,
    classification: "PROPERTY_OUTGOING",
    classificationNeedsReview: false,
    suggestedClassification: null,
    suggestionReasonCode: null,
    reviewUpdatedAt: "2026-07-04T00:00:00.000Z",
    ...overrides,
  };
}

function review(records: SafePropertyReviewRecord[]): SafePropertyRecordReview {
  return {
    property: { id: "property_1", nickname: "Synthetic Property", isArchived: false },
    financialYear: { endingYear: 2026, label: "2025-26", startDate: "2025-07-01", endDate: "2026-06-30" },
    records,
  };
}

describe("Phase 3C approved Property summary and export", () => {
  it("calculates only the approved separate gross groups and counts", () => {
    const summary = summarizePropertyRecords(review([
      record({ transactionId: "income", type: "INCOME", amountCents: 20000, classification: "PROPERTY_INCOME" }),
      record({ transactionId: "outgoing", amountCents: -12500, classification: "PROPERTY_OUTGOING" }),
      record({ transactionId: "refund", type: "INCOME", amountCents: 3000, classification: "REFUND_OR_REVERSAL" }),
      record({ transactionId: "loan", amountCents: -45000, provenance: "LOAN_RECONCILIATION", classification: "LOAN_PAYMENT_CONTEXT" }),
      record({ transactionId: "transfer", type: "TRANSFER", amountCents: -5000, classification: "TRANSFER_CONTEXT" }),
      record({ transactionId: "other", classification: "OTHER_PROPERTY_RECORD" }),
      record({ transactionId: "excluded", classification: "EXCLUDED" }),
      record({ transactionId: "unclassified", classification: null, suggestedClassification: "PROPERTY_OUTGOING", suggestionReasonCode: "MANUAL_PROPERTY_EXPENSE" }),
      record({ transactionId: "stale", classificationNeedsReview: true }),
    ]));
    expect(summary).toEqual({
      propertyIncome: { count: 1, totalCents: 20000 },
      propertyOutgoing: { count: 1, totalCents: 12500 },
      refundOrReversal: { count: 1, totalCents: 3000 },
      loanPaymentCashflow: { count: 1, totalCents: 45000 },
      transferContextCount: 1,
      otherPropertyRecordCount: 1,
    });
    expect(summary).not.toHaveProperty("net");
    expect(summary).not.toHaveProperty("profit");
    expect(summary).not.toHaveProperty("deductible");
  });

  it("exports exactly the approved columns and omits excluded, unclassified and stale rows", () => {
    const csv = createPropertyRecordCsv(review([
      record(),
      record({ transactionId: "excluded", classification: "EXCLUDED" }),
      record({ transactionId: "unclassified", classification: null }),
      record({ transactionId: "stale", classificationNeedsReview: true }),
    ]));
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('"record_id","financial_year","property_nickname","transaction_date","transaction_type","amount_aud","category_label","record_classification","connection_source","spendgrove_notice"');
    expect(lines[1]).toContain('"-125.00"');
    expect(lines[1]).toContain('"Record keeping only - not tax advice."');
    expect(csv).not.toContain("excluded");
    expect(csv).not.toContain("unclassified");
    expect(csv).not.toContain("stale");
  });

  it("neutralises spreadsheet formula prefixes in user-reviewed safe labels", () => {
    const csv = createPropertyRecordCsv({
      ...review([record({ categoryName: "+Synthetic formula" })]),
      property: { id: "property_1", nickname: "=Synthetic Property", isArchived: false },
    });
    expect(csv).toContain('"\'=Synthetic Property"');
    expect(csv).toContain('"\'+Synthetic formula"');
  });

  it("scopes export generation to the authenticated user and reuses the review store", async () => {
    const calls: Array<{ userId: string; propertyId: string; endingYear: number }> = [];
    const store: PropertyRecordReviewStore = {
      async read(userId, propertyId, endingYear) {
        calls.push({ userId, propertyId, endingYear });
        return review([record()]);
      },
      async classify() {
        throw new Error("not used");
      },
      async applySuggestions() {
        throw new Error("not used");
      },
    };
    const result = await getPropertyRecordCsv(createTestUserContext("user_1"), "property_1", 2026, store);
    expect(calls).toEqual([{ userId: "user_1", propertyId: "property_1", endingYear: 2026 }]);
    expect(result.financialYearLabel).toBe("2025-26");
  });

  it("keeps export ephemeral, no-store and free of forbidden source fields", async () => {
    const [output, route, component] = await Promise.all([
      readFile(outputPath, "utf8"),
      readFile(exportRoutePath, "utf8"),
      readFile(componentPath, "utf8"),
    ]);
    expect(route).toContain('"Cache-Control": "private, no-store, max-age=0"');
    expect(route).toContain('"Content-Disposition"');
    expect(output).not.toMatch(/merchant|description|notes|narration|filename|accountReference|userId|email|address|balance/i);
    expect(output).not.toMatch(/propertyReportReview\.(?:create|update|upsert|delete)/);
    expect(component).toContain("Prepare CSV export");
    expect(component).toContain("Download reviewed CSV");
    expect(component).toContain("SpendGrove provides record-keeping information only, not tax advice.");
    expect(component).toContain("No net result, profit or tax outcome is calculated.");
    expect(component).not.toMatch(/deductible|claimable|ATO-ready|yield|equity|valuation|net worth/i);
  });
});
