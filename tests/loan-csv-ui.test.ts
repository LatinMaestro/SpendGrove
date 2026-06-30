import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const reviewPath = new URL("../components/loan-csv-review.tsx", import.meta.url);
const pagePath = new URL("../app/loans/import/page.tsx", import.meta.url);
const loansPath = new URL("../components/loans-manager.tsx", import.meta.url);

describe("loan CSV review UI contract", () => {
  it("uses Import Loan CSV as the main title with review-before-save copy", async () => {
    const review = await readFile(reviewPath, "utf8");

    expect(review).toContain("Import Loan CSV");
    expect(review).toContain("review repayment breakdowns before anything is saved");
    expect(review).toContain("Review first, then confirm what to save");
    expect(review).not.toContain("Review a loan CSV safely");
  });

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

  it("keeps source data browser-local while sending only reviewed structured repayment fields", async () => {
    const [review, page, loans] = await Promise.all([
      readFile(reviewPath, "utf8"),
      readFile(pagePath, "utf8"),
      readFile(loansPath, "utf8"),
    ]);

    expect(review).toContain("Choose the clear repayments to save");
    expect(review).toContain("filename is not retained");
    expect(review).toContain("Raw narration is not shown");
    expect(review).toContain('method: "POST"');
    expect(review).toContain("createLoanRepaymentCommitRequest");
    expect(review).toContain("Save reviewed repayments");
    expect(review).not.toContain("FormData");
    expect(review).not.toContain("localStorage");
    expect(review).not.toContain("sessionStorage");
    expect(review).not.toContain("console.");
    expect(review).toContain("/api/account/loan-repayments");
    expect(page).toContain("force-dynamic");
    expect(loans).toContain('href="/loans/import"');
  });

  it("offers both mapping formats and mode-specific row-event guidance", async () => {
    const review = await readFile(reviewPath, "utf8");

    expect(review).toContain("Loan CSV format");
    expect(review).toContain("Loan ledger");
    expect(review).toContain("Repayment breakdown");
    expect(review).toContain("Event date");
    expect(review).toContain("Signed amount");
    expect(review).toContain("Loan event type");
    expect(review).toContain("Same-day repayment, interest and fee rows are grouped into one repayment breakdown where safe.");
    expect(review).toContain("classificationLabels");
    expect(review).toContain("Needs review");
  });

  it("renders grouped repayment breakdown cards without raw event text", async () => {
    const review = await readFile(reviewPath, "utf8");

    expect(review).toContain("Repayment breakdown");
    expect(review).toContain("Repayment date");
    expect(review).toContain("Total repayment");
    expect(review).toContain("Principal");
    expect(review).toContain("Interest");
    expect(review).toContain("Fees");
    expect(review).toContain("Balance after");
    expect(review).toContain("Grouped from");
    expect(review).toContain("componentNotes");
    expect(review).not.toContain("rawEvent");
    expect(review).not.toContain("eventText");
  });

  it("shows automatically excluded rows as status text rather than a broken checkbox", async () => {
    const review = await readFile(reviewPath, "utf8");

    expect(review).toContain("Excluded automatically");
    expect(review).toContain("This row cannot be saved because it needs review or is not a repayment.");
    expect(review).toContain("Save this repayment breakdown");
    expect(review).toContain("disabled={selectionLocked}");
    expect(review).not.toContain("disabled={!committable || selectionLocked}");
  });

  it("uses neutral investment-interest record-keeping wording only", async () => {
    const review = await readFile(reviewPath, "utf8");

    expect(review).toContain("Potential property tax record");
    expect(review).toContain("review later for record-keeping");
    expect(review).toContain("shouldSuggestPropertyRecordKeeping");
    expect(review).not.toMatch(/\bdeductible\b/i);
    expect(review).not.toMatch(/\btax deductible\b/i);
    expect(review).not.toMatch(/\bclaim\b/i);
    expect(review).not.toMatch(/\bATO\b/i);
  });

  it("keeps independent mappings when switching formats", async () => {
    const review = await readFile(reviewPath, "utf8");

    expect(review).toContain("Record<LoanCsvMappingMode, LoanCsvMapping>");
    expect(review).toContain("COMPONENT_COLUMNS: buildSuggestedLoanCsvMapping");
    expect(review).toContain("ROW_EVENT_LEDGER: buildSuggestedLoanCsvMapping");
    expect(review).toContain("[mode]: { ...mapping");
  });

  it("default-excludes likely duplicates and requires a visible per-row Save anyway confirmation", async () => {
    const review = await readFile(reviewPath, "utf8");

    expect(review).toContain("/api/account/loan-repayments/duplicates");
    expect(review).toContain("Likely duplicate — excluded by default");
    expect(review).toContain("Possible overlap — review before saving");
    expect(review).toContain("Save anyway");
    expect(review).toContain("duplicateOverrideRowNumbers");
    expect(review).toContain("Retry duplicate check");
    expect(review).not.toContain("fingerprint");
  });
});
