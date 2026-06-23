import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  assessLoanCsvColumns,
  buildLoanCsvReview,
  buildSuggestedLoanCsvMapping,
  scanLoanCsv,
} from "@/lib/loan-csv-review";
import { parseCsvDocument } from "@/lib/csv-import";

async function fixture(name: string) {
  return readFile(new URL(`../sample-data/synthetic/${name}`, import.meta.url), "utf8");
}

describe("browser-local loan CSV review", () => {
  it("maps synthetic home-loan repayments into a narration-free review model", async () => {
    const scan = scanLoanCsv(await fixture("home_loan_synthetic.csv"));

    expect(scan.mappingIssues).toEqual([]);
    expect(scan.rows[0]).toMatchObject({
      date: "2026-05-01",
      totalPaymentCents: 220000,
      principalCents: 65000,
      interestCents: 155000,
      feeCents: 0,
      balanceAfterCents: 54835000,
      warningCodes: [],
    });
    expect(JSON.stringify(scan.rows)).not.toContain("HOME LOAN REPAYMENT");
    expect(JSON.stringify(scan.rows)).not.toContain("Description");
  });

  it("supports personal-loan CSVs and preserves missing versus zero components", async () => {
    const scan = scanLoanCsv(await fixture("personal_loan_synthetic.csv"));

    expect(scan.rows).toHaveLength(2);
    expect(scan.rows[0].feeCents).toBe(0);
    expect(scan.rows[0].totalPaymentCents).toBe(42500);
  });

  it("locks private identifier columns out of mapping and review", () => {
    const document = parseCsvDocument([
      "Date,Payment,Principal,Interest,Account Number,Loan Reference,Description",
      "03/05/2026,425.00,320.00,105.00,12345678,REF-987654321,PRIVATE NARRATION",
    ].join("\n"));
    const columns = assessLoanCsvColumns(document);
    const mapping = buildSuggestedLoanCsvMapping(columns);
    const review = buildLoanCsvReview(document, columns, {
      ...mapping,
      4: "TOTAL_PAYMENT",
      5: "INTEREST",
      6: "PRINCIPAL",
    });

    expect(columns[4]).toMatchObject({ isPrivate: true, safeLabel: "Private column 5" });
    expect(columns[5]).toMatchObject({ isPrivate: true, safeLabel: "Private column 6" });
    expect(review.mapping[4]).toBe("PRIVATE");
    expect(review.mapping[5]).toBe("PRIVATE");
    expect(JSON.stringify(review)).not.toContain("12345678");
    expect(JSON.stringify(review)).not.toContain("987654321");
    expect(JSON.stringify(review.rows)).not.toContain("PRIVATE NARRATION");
  });

  it("uses the approved two-cent component tolerance and flags larger differences", () => {
    const withinTolerance = scanLoanCsv("Date,Payment,Principal,Interest,Fees\n01/06/2026,100.00,70.00,29.98,0.00");
    const outsideTolerance = scanLoanCsv("Date,Payment,Principal,Interest,Fees\n01/06/2026,100.00,70.00,29.97,0.00");
    const exceeds = scanLoanCsv("Date,Payment,Principal,Interest,Fees\n01/06/2026,100.00,80.00,21.00,0.00");

    expect(withinTolerance.rows[0].warningCodes).toEqual([]);
    expect(outsideTolerance.rows[0].warningCodes).toContain("COMPONENTS_DO_NOT_MATCH_PAYMENT");
    expect(exceeds.rows[0].warningCodes).toContain("COMPONENTS_EXCEED_PAYMENT");
  });
});
