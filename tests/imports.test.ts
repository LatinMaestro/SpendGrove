import { describe, expect, it } from "vitest";
import { importBatchMetadataSchema, importRowReviewSchema } from "@/lib/validation/imports";

describe("import validation", () => {
  it("stores safe import batch metadata without raw CSV content", () => {
    const batch = importBatchMetadataSchema.parse({
      userId: "user_1",
      safeFileName: "june-transactions.csv",
      fileNameHash: "a".repeat(64),
      rowCount: 10,
      excludedPrivateHeaders: ["Account Number", "BSB"],
    });

    expect(batch.safeFileName).toBe("june-transactions.csv");
    expect(batch.excludedPrivateHeaders).toContain("BSB");
  });

  it("redacts unsafe filename tokens before storage", () => {
    const batch = importBatchMetadataSchema.parse({
      userId: "user_1",
      originalFileNameRedacted: "Account Number 12345678.csv",
    });

    expect(batch.originalFileNameRedacted).toContain("[private field removed]");
    expect(batch.originalFileNameRedacted).not.toContain("12345678");
  });

  it("rejects private identifiers and raw CSV payload keys in metadata", () => {
    expect(() => importBatchMetadataSchema.parse({
      userId: "user_1",
      safeFileName: "statement.csv",
      mappingSummary: { note: "BSB 123-456" },
    })).toThrow();

    expect(() => importBatchMetadataSchema.parse({
      userId: "user_1",
      mappingSummary: { rawCsv: "Date,Description,Amount" },
    })).toThrow();
  });

  it("requires merge rows to reference a matched transaction", () => {
    expect(() => importRowReviewSchema.parse({
      userId: "user_1",
      importBatchId: "batch_1",
      rowNumber: 1,
      action: "MERGE",
    })).toThrow();
  });

  it("accepts sanitized import row review data", () => {
    const row = importRowReviewSchema.parse({
      userId: "user_1",
      importBatchId: "batch_1",
      rowNumber: 1,
      action: "IMPORT",
      mappedDate: "2026-06-09",
      amountCents: -1200,
      description: "Translink travel",
      merchantName: "Translink",
      warningCodes: ["CATEGORY_REVIEW"],
    });

    expect(row.action).toBe("IMPORT");
    expect(row.warningCodes).toEqual(["CATEGORY_REVIEW"]);
  });
});
