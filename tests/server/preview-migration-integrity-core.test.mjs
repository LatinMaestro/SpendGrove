import { describe, expect, it } from "vitest";
import { primaryAndForeignKeyNames } from "../../scripts/preview-migration-integrity-core.mjs";

describe("Preview migration constraint filtering", () => {
  it("keeps only primary and foreign keys and ignores unrelated constraints", () => {
    const names = primaryAndForeignKeyNames([
      { name: "unrelated_check", type: "c" },
      { name: "PropertyReportReview_userId_fkey", type: "f" },
      { name: "unrelated_unique_constraint", type: "u" },
      { name: "PropertyReportReview_pkey", type: "p" },
      { name: "PropertyReportReview_transactionId_fkey", type: "f" },
      { name: "PropertyReportReview_propertyId_fkey", type: "f" },
      { name: "unrelated_exclusion", type: "x" },
    ]);

    expect(names).toEqual([
      "PropertyReportReview_pkey",
      "PropertyReportReview_propertyId_fkey",
      "PropertyReportReview_transactionId_fkey",
      "PropertyReportReview_userId_fkey",
    ]);
  });
});
