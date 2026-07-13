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
const reviewRoutePath = new URL("../../app/api/account/properties/[propertyId]/report-review/route.ts", import.meta.url);
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
  it("calculates simple linked-record groups without report classifications", () => {
    const summary = summarizePropertyRecords(review([
      record({ transactionId: "income", type: "INCOME", amountCents: 20000, classification: null }),
      record({ transactionId: "outgoing", amountCents: -12500, classification: null }),
      record({ transactionId: "loan", amountCents: -45000, provenance: "LOAN_RECONCILIATION", classification: null }),
      record({ transactionId: "both", amountCents: -10000, provenance: "BOTH", classification: "EXCLUDED" }),
      record({ transactionId: "transfer", type: "TRANSFER", amountCents: -5000, classificationNeedsReview: true }),
    ]));
    expect(summary).toEqual({
      moneyIn: { count: 1, totalCents: 20000 },
      moneyOut: { count: 3, totalCents: 67500 },
      loanPaymentCashflow: { count: 2, totalCents: 55000 },
      transferContextCount: 1,
      totalLinkedRecordCount: 5,
    });
    expect(summary).not.toHaveProperty("net");
    expect(summary).not.toHaveProperty("profit");
    expect(summary).not.toHaveProperty("deductible");
  });

  it("exports every eligible linked record without a report classification", () => {
    const csv = createPropertyRecordCsv(review([
      record({ classification: null }),
      record({ transactionId: "excluded", classification: "EXCLUDED" }),
      record({ transactionId: "unclassified", classification: null, provenance: "LOAN_RECONCILIATION" }),
      record({ transactionId: "stale", classificationNeedsReview: true }),
    ]));
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(5);
    expect(lines[0]).toBe('"record_id","financial_year","property_nickname","transaction_date","transaction_type","amount_aud","category_label","connection_source","spendgrove_notice"');
    expect(lines[1]).toContain('"-125.00"');
    expect(lines[1]).toContain('"Record keeping only - not tax advice."');
    expect(csv).toContain('"excluded"');
    expect(csv).toContain('"unclassified"');
    expect(csv).toContain('"LOAN_RECONCILIATION"');
    expect(csv).toContain('"stale"');
    expect(csv).not.toContain("record_classification");
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
    const [output, route, reviewRoute, component] = await Promise.all([
      readFile(outputPath, "utf8"),
      readFile(exportRoutePath, "utf8"),
      readFile(reviewRoutePath, "utf8"),
      readFile(componentPath, "utf8"),
    ]);
    expect(route).toContain('"Cache-Control": "private, no-store, max-age=0"');
    expect(route).toContain('"Content-Disposition"');
    expect(output).not.toMatch(/merchant|description|notes|narration|filename|accountReference|userId|email|address|balance/i);
    expect(output).not.toMatch(/propertyReportReview\.(?:create|update|upsert|delete)/);
    expect(component).toContain("Export options");
    expect(component).toContain("Download CSV");
    expect(component).toContain("Record keeping only - not tax advice.");
    expect(component).toContain("Transactions already linked to this property appear automatically");
    expect(component).not.toContain("Record classification");
    expect(component).not.toContain("Suggested classification");
    expect(component).not.toContain("Apply suggested classifications");
    expect(reviewRoute).not.toMatch(/export async function (?:PUT|POST)/);
    expect(component).not.toMatch(/deductible|claimable|ATO-ready|yield|equity|valuation|net worth/i);
  });
});
