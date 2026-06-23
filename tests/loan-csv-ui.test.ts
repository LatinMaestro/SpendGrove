import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const reviewPath = new URL("../components/loan-csv-review.tsx", import.meta.url);
const pagePath = new URL("../app/loans/import/page.tsx", import.meta.url);
const loansPath = new URL("../components/loans-manager.tsx", import.meta.url);

describe("loan CSV review UI contract", () => {
  it("requires the owning Loan Account before local file review", async () => {
    const review = await readFile(reviewPath, "utf8");

    expect(review.indexOf("Choose the owning Loan Account")).toBeLessThan(review.indexOf("Choose and match the CSV"));
    expect(review).toContain('disabled={!selectedLoan}');
    expect(review).toContain("Choose the Loan Account that owns this CSV first.");
    expect(review).toContain("Car loan");
    expect(review).toContain("Personal loan");
    expect(review).toContain("Owner-occupier");
    expect(review).toContain("Investment");
    expect(review).toContain("Other");
  });

  it("shows optional property context without requesting property details", async () => {
    const review = await readFile(reviewPath, "utf8");

    expect(review).toContain("selectedLoan.property &&");
    expect(review).toContain("propertyUsageLabel");
    expect(review).not.toContain("Property address");
    expect(review).not.toContain("property input");
  });

  it("keeps CSV data browser-local and exposes no durable commit action", async () => {
    const [review, page, loans] = await Promise.all([
      readFile(reviewPath, "utf8"),
      readFile(pagePath, "utf8"),
      readFile(loansPath, "utf8"),
    ]);

    expect(review).toContain("Review only — nothing saved");
    expect(review).toContain("filename is not retained");
    expect(review).toContain("Raw narration is not shown");
    expect(review).not.toContain('method: "POST"');
    expect(review).not.toContain("FormData");
    expect(review).not.toContain("/api/account/loan-repayments");
    expect(page).toContain("force-dynamic");
    expect(loans).toContain('href="/loans/import"');
  });
});
