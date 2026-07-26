import { describe, expect, it } from "vitest";
import {
  buildEverydayFinancialYearReport,
  EverydayFinancialYearReportError,
  type EverydayFinancialYearRecord,
  type EverydayFinancialYearReportReasonCode,
} from "@/src/server/everyday-financial-year-report";

const generatedAt = new Date("2026-07-26T00:00:00.000Z");

function record(overrides: Partial<EverydayFinancialYearRecord> = {}): EverydayFinancialYearRecord {
  return {
    id: "synthetic-record",
    userId: "synthetic-user-1",
    date: "2026-01-01",
    type: "EXPENSE",
    amountCents: -100,
    status: "ACTIVE",
    deletedAt: null,
    splitRole: "NONE",
    categoryId: "synthetic-category",
    categoryName: "Synthetic Category",
    ...overrides,
  };
}

function expectReason(action: () => unknown, reasonCode: EverydayFinancialYearReportReasonCode) {
  try {
    action();
    throw new Error("Expected report error.");
  } catch (error) {
    expect(error).toBeInstanceOf(EverydayFinancialYearReportError);
    expect((error as EverydayFinancialYearReportError).reasonCode).toBe(reasonCode);
  }
}

describe("everyday financial-year report final hardening", () => {
  it("rejects an unsupported source mode before aggregation", () => {
    expectReason(() => buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [],
      2026,
      { sourceMode: "OTHER" as never, generatedAt },
    ), "SOURCE_MODE_INVALID");
  });

  it("rejects inconsistent labels for the same direction and Category identity", () => {
    expectReason(() => buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [
        record({ id: "one", categoryId: "same-category", categoryName: "First label" }),
        record({ id: "two", categoryId: "same-category", categoryName: "Second label" }),
      ],
      2026,
      { generatedAt },
    ), "CATEGORY_IDENTITY_MISMATCH");
  });

  it("uses shared type/sign rules while preserving transfer context", () => {
    expectReason(() => buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [record({ type: "INCOME", amountCents: -100 })],
      2026,
      { generatedAt },
    ), "RECORD_TYPE_SIGN_MISMATCH");
    expectReason(() => buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [record({ type: "EXPENSE", amountCents: 100 })],
      2026,
      { generatedAt },
    ), "RECORD_TYPE_SIGN_MISMATCH");

    const report = buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [
        record({ id: "transfer-in", type: "TRANSFER", amountCents: 100 }),
        record({ id: "transfer-out", type: "TRANSFER", amountCents: -100 }),
      ],
      2026,
      { generatedAt },
    );
    expect(report.transfers).toEqual({ count: 2, incomingCount: 1, outgoingCount: 1 });
    expect(report.moneyIn).toEqual({ count: 0, totalCents: 0 });
    expect(report.moneyOut).toEqual({ count: 0, totalCents: 0 });
    expect(report.categories).toEqual([]);
  });

  it("fails immediately on cross-user candidates and returns no cross-user diagnostic", () => {
    expectReason(() => buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [record({ userId: "synthetic-user-2" })],
      2026,
      { generatedAt },
    ), "OWNER_SCOPE_VIOLATION");

    const report = buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [record()],
      2026,
      { generatedAt },
    );
    expect(report.reconciliation.ownerScopeVerified).toBe(true);
    expect(report.reconciliation).not.toHaveProperty("crossUserCount");
  });
});
