import { describe, expect, it } from "vitest";
import { importBatchMetadataSchema, importRowReviewSchema } from "@/lib/validation/imports";

describe("import validation", () => {
  it("stores safe import batch metadata without raw CSV content", () => {
    const batch = importBatchMetadataSchema.parse({
      userId: "user_1",
      safeFileName: "june-transactions.csv",
      fileNameHash: "abc123def456ghi789",
      rowCount: 10,
      excludedPrivateHeaders: ["Account Number", "BSB"],
    });

    expect(batch.safeFileName).toBe("june-transactions.csv");
    expect(batch.excludedPrivateHeaders).toContain("BSB");
  });

  it("rejects private identifiers in metadata", () => {
    expect(() => importBatchMetadataSchema.parse({
      userId: "user_1",
      safeFileName: "statement.csv",
      mappingSummary: { note: "BSB 123-456" },
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
    });

    expect(row.action).toBe("IMPORT");
  });
});
