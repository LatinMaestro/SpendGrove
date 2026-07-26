import { describe, expect, it } from "vitest";
import {
  buildEverydayFinancialYearReport,
  EverydayFinancialYearReportError,
  type BuildEverydayFinancialYearReportOptions,
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

describe("everyday financial-year aggregation hardening", () => {
  it("rejects an unsupported source mode at the pure helper boundary", () => {
    const options = {
      sourceMode: "UNBOUNDED_SOURCE",
      generatedAt,
    } as unknown as BuildEverydayFinancialYearReportOptions;

    expectReason(() => buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [record()],
      2026,
      options,
    ), "SOURCE_MODE_INVALID");
  });

  it("rejects conflicting labels for the same direction and Category identity", () => {
    expectReason(() => buildEverydayFinancialYearReport(
      "synthetic-user-1",
      [
        record({ id: "one", categoryName: "Synthetic Category" }),
        record({ id: "two", categoryName: "Different Label" }),
      ],
      2026,
      { generatedAt },
    ), "CATEGORY_IDENTITY_MISMATCH");
  });
});