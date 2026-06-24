import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  assessLoanCsvColumns,
  buildLoanCsvReview,
  buildSuggestedLoanCsvMapping,
  classifyLoanEvent,
  detectLoanCsvMappingMode,
  scanLoanCsv,
  shouldSuggestPropertyRecordKeeping,
  validateLoanCsvMapping,
} from "@/lib/loan-csv-review";
import { parseCsvDocument } from "@/lib/csv-import";

async function fixture(name: string) {
  return readFile(new URL(`../sample-data/synthetic/${name}`, import.meta.url), "utf8");
}

const syntheticLedger = [
  "01/05/2026,-500.00,Regular repayment,24500.00",
  "02/05/2026,75.25,Interest charge,24575.25",
  "03/05/2026,8.50,Monthly service fee,24583.75",
  "04/05/2026,1200.00,Loan drawdown,25783.75",
  "05/05/2026,-4.00,Account correction,25779.75",
  "06/05/2026,3.00,Unclassified entry,25782.75",
].join("\n");

const groupedRepaymentLedger = [
  "12/05/2026,-3000.00,Scheduled payment,220000.00",
  "12/05/2026,2100.00,Interest charge,219100.00",
].join("\n");

describe("browser-local loan CSV review", () => {
  it("auto-detects and maps a headerless four-column row-event ledger", () => {
    const scan = scanLoanCsv(syntheticLedger);

    expect(scan.document.hasHeader).toBe(false);
    expect(scan.document.rows[0]).toEqual(["01/05/2026", "-500.00", "Regular repayment", "24500.00"]);
    expect(scan.mode).toBe("ROW_EVENT_LEDGER");
    expect(scan.mapping).toEqual({
      0: "DATE",
      1: "SIGNED_AMOUNT",
      2: "EVENT_TYPE",
      3: "BALANCE_AFTER",
    });
    expect(new Set(Object.values(scan.mapping)).size).toBe(4);
    expect(scan.mappingIssues).toEqual([]);
  });

  it("groups a same-date repayment and interest row into one repayment breakdown", () => {
    const scan = scanLoanCsv(groupedRepaymentLedger);

    expect(scan.rows).toHaveLength(1);
    expect(scan.rows[0]).toMatchObject({
      isGroupedRepayment: true,
      sourceRowCount: 2,
      classification: "REPAYMENT",
      totalPaymentCents: 300000,
      interestCents: 210000,
      feeCents: 0,
      principalCents: 90000,
      balanceAfterCents: 21910000,
      warningCodes: [],
    });
    expect(scan.rows[0].componentNotes).toEqual(expect.arrayContaining(["interest identified", "principal calculated"]));
  });

  it("groups same-date repayment, interest and fee rows and derives principal safely", () => {
    const scan = scanLoanCsv([
      "15/05/2026,-1800.00,Scheduled payment,150000.00",
      "15/05/2026,700.00,Interest charge,149300.00",
      "15/05/2026,25.00,Monthly service fee,149275.00",
    ].join("\n"));

    expect(scan.rows).toHaveLength(1);
    expect(scan.rows[0]).toMatchObject({
      totalPaymentCents: 180000,
      interestCents: 70000,
      feeCents: 2500,
      principalCents: 107500,
      balanceAfterCents: 14927500,
      warningCodes: [],
    });
  });

  it("keeps interest-only and fee-only ledger entries as warning review items, not repayments", () => {
    const scan = scanLoanCsv([
      "16/05/2026,650.00,Interest charge,148625.00",
      "17/05/2026,12.50,Monthly service fee,148637.50",
    ].join("\n"));

    expect(scan.rows).toHaveLength(2);
    expect(scan.rows[0]).toMatchObject({
      isGroupedRepayment: false,
      classification: "INTEREST",
      totalPaymentCents: null,
      interestCents: 65000,
      warningCodes: expect.arrayContaining(["NON_REPAYMENT_NEEDS_REVIEW"]),
    });
    expect(scan.rows[1]).toMatchObject({
      isGroupedRepayment: false,
      classification: "FEE",
      totalPaymentCents: null,
      feeCents: 1250,
      warningCodes: expect.arrayContaining(["NON_REPAYMENT_NEEDS_REVIEW"]),
    });
  });

  it("does not treat loan advances or ambiguous adjustments as repayments", () => {
    const scan = scanLoanCsv([
      "18/05/2026,1200.00,Loan advance,149837.50",
      "19/05/2026,-4.00,Account correction,149833.50",
    ].join("\n"));

    expect(scan.rows[0]).toMatchObject({
      classification: "LOAN_ADVANCE",
      totalPaymentCents: null,
      principalCents: null,
      warningCodes: expect.arrayContaining(["NON_REPAYMENT_NEEDS_REVIEW"]),
    });
    expect(scan.rows[1]).toMatchObject({
      classification: "ADJUSTMENT",
      totalPaymentCents: null,
      principalCents: null,
      warningCodes: expect.arrayContaining(["ADJUSTMENT_NEEDS_REVIEW", "NON_REPAYMENT_NEEDS_REVIEW"]),
    });
  });

  it("handles multiple same-date repayment rows conservatively without deriving principal", () => {
    const scan = scanLoanCsv([
      "20/05/2026,-900.00,Scheduled payment,148900.00",
      "20/05/2026,-850.00,Extra payment,148050.00",
      "20/05/2026,500.00,Interest charge,147550.00",
    ].join("\n"));

    expect(scan.rows).toHaveLength(1);
    expect(scan.rows[0]).toMatchObject({
      isGroupedRepayment: true,
      totalPaymentCents: 175000,
      interestCents: 50000,
      principalCents: null,
      balanceAfterCents: 14755000,
      warningCodes: expect.arrayContaining(["MULTIPLE_REPAYMENTS_NEED_REVIEW"]),
    });
  });

  it("keeps row-event classifications safe without exposing raw event text", () => {
    const scan = scanLoanCsv(syntheticLedger);

    expect(scan.rows[0]).toMatchObject({
      classification: "REPAYMENT",
      eventAmountCents: 50000,
      totalPaymentCents: 50000,
      interestCents: 0,
      feeCents: 0,
    });
    expect(scan.rows[1]).toMatchObject({
      classification: "INTEREST",
      eventAmountCents: 7525,
      totalPaymentCents: null,
      interestCents: 7525,
      warningCodes: expect.arrayContaining(["NON_REPAYMENT_NEEDS_REVIEW"]),
    });
    expect(scan.rows[2]).toMatchObject({
      classification: "FEE",
      eventAmountCents: 850,
      feeCents: 850,
      principalCents: null,
      warningCodes: expect.arrayContaining(["NON_REPAYMENT_NEEDS_REVIEW"]),
    });
    expect(scan.rows[3]).toMatchObject({
      classification: "LOAN_ADVANCE",
      eventAmountCents: 120000,
      totalPaymentCents: null,
      principalCents: null,
    });
    expect(scan.rows[4]).toMatchObject({
      classification: "ADJUSTMENT",
      warningCodes: expect.arrayContaining(["ADJUSTMENT_NEEDS_REVIEW"]),
    });
    expect(scan.rows[5]).toMatchObject({
      classification: "UNKNOWN",
      warningCodes: expect.arrayContaining(["UNKNOWN_EVENT_NEEDS_REVIEW"]),
    });
    expect(JSON.stringify(scan.rows)).not.toContain("Regular repayment");
    expect(JSON.stringify(scan.rows)).not.toContain("Interest charge");
    expect(JSON.stringify(scan.rows)).not.toContain("Monthly service fee");
  });

  it("never returns raw event text in row-event review rows", () => {
    const privateLookingText = "Repayment account 12345678 reference 987654321";
    const scan = scanLoanCsv(`01/05/2026,-100.00,${privateLookingText},9900.00`);

    expect(scan.mode).toBe("ROW_EVENT_LEDGER");
    expect(scan.rows[0].classification).toBe("REPAYMENT");
    expect(scan.rows[0].isGroupedRepayment).toBe(true);
    expect(JSON.stringify(scan.rows)).not.toContain(privateLookingText);
    expect(JSON.stringify(scan.rows)).not.toContain("12345678");
    expect(JSON.stringify(scan.rows)).not.toContain("987654321");
  });

  it("retains component-column mode for repayment breakdown exports", async () => {
    const scan = scanLoanCsv(await fixture("home_loan_synthetic.csv"));

    expect(scan.mode).toBe("COMPONENT_COLUMNS");
    expect(scan.mappingIssues).toEqual([]);
    expect(scan.rows[0]).toMatchObject({
      classification: null,
      date: "2026-05-01",
      totalPaymentCents: 220000,
      principalCents: 65000,
      interestCents: 155000,
      feeCents: 0,
      balanceAfterCents: 54835000,
      warningCodes: [],
    });
    expect(JSON.stringify(scan.rows)).not.toContain("HOME LOAN REPAYMENT");
  });

  it("treats a generic Amount header as total payment in component mode", () => {
    const document = parseCsvDocument("Date,Amount,Principal\n01/05/2026,-100.00,70.00");
    const columns = assessLoanCsvColumns(document);
    const mapping = buildSuggestedLoanCsvMapping(columns, "COMPONENT_COLUMNS");

    expect(mapping).toMatchObject({ 0: "DATE", 1: "TOTAL_PAYMENT", 2: "PRINCIPAL" });
  });

  it("lets component mode use a meaningful component without forcing total payment", () => {
    const document = parseCsvDocument("Date,Interest,Balance\n01/05/2026,75.25,24575.25");
    const columns = assessLoanCsvColumns(document);
    const mapping = buildSuggestedLoanCsvMapping(columns, "COMPONENT_COLUMNS");
    const review = buildLoanCsvReview(document, columns, mapping, "COMPONENT_COLUMNS");

    expect(review.mappingIssues).toEqual([]);
    expect(review.rows[0]).toMatchObject({ totalPaymentCents: null, interestCents: 7525 });
    expect(review.rows[0].warningCodes).not.toContain("PAYMENT_NEEDS_REVIEW");
  });

  it("uses mode-specific validation guidance", () => {
    expect(validateLoanCsvMapping({ 0: "DATE", 1: "SIGNED_AMOUNT", 2: "IGNORE" }, "ROW_EVENT_LEDGER")).toEqual([
      "Choose a loan event type column so SpendGrove can tell repayments, interest and fees apart.",
    ]);
    expect(validateLoanCsvMapping({ 0: "DATE", 1: "EVENT_TYPE", 2: "IGNORE" }, "ROW_EVENT_LEDGER")).toEqual([
      "Choose a signed amount column.",
    ]);
    expect(validateLoanCsvMapping({ 0: "DATE", 1: "SIGNED_AMOUNT", 2: "EVENT_TYPE" }, "ROW_EVENT_LEDGER")).toEqual([]);
    expect(validateLoanCsvMapping({ 0: "DATE", 1: "IGNORE" }, "COMPONENT_COLUMNS")).toEqual([
      "Choose at least one total payment, principal, interest or fees column.",
    ]);
  });

  it("keeps separate suggested mappings available when the user switches formats", () => {
    const document = parseCsvDocument(syntheticLedger);
    const columns = assessLoanCsvColumns(document);
    const detected = detectLoanCsvMappingMode(document, columns);
    const componentMapping = buildSuggestedLoanCsvMapping(columns, "COMPONENT_COLUMNS");
    const rowEventMapping = buildSuggestedLoanCsvMapping(columns, "ROW_EVENT_LEDGER");
    const correctedRowEventMapping = { ...rowEventMapping, 3: "IGNORE" as const };

    expect(detected).toBe("ROW_EVENT_LEDGER");
    expect(correctedRowEventMapping[3]).toBe("IGNORE");
    expect(rowEventMapping[3]).toBe("BALANCE_AFTER");
    expect(componentMapping).toEqual({ 0: "IGNORE", 1: "IGNORE", 2: "IGNORE", 3: "IGNORE" });
  });

  it("locks private identifier columns out of either mapping mode", () => {
    const document = parseCsvDocument([
      "Date,Amount,Event Type,Balance,Account Number,Loan Reference",
      "03/05/2026,-425.00,Regular repayment,18420.00,12345678,REF-987654321",
    ].join("\n"));
    const columns = assessLoanCsvColumns(document);
    const mapping = buildSuggestedLoanCsvMapping(columns, "ROW_EVENT_LEDGER");
    const review = buildLoanCsvReview(document, columns, {
      ...mapping,
      4: "SIGNED_AMOUNT",
      5: "EVENT_TYPE",
    }, "ROW_EVENT_LEDGER");

    expect(columns[4]).toMatchObject({ isPrivate: true, safeLabel: "Private column 5" });
    expect(columns[5]).toMatchObject({ isPrivate: true, safeLabel: "Private column 6" });
    expect(review.mapping[4]).toBe("PRIVATE");
    expect(review.mapping[5]).toBe("PRIVATE");
    expect(JSON.stringify(review)).not.toContain("12345678");
    expect(JSON.stringify(review)).not.toContain("987654321");
  });

  it("uses the approved two-cent component tolerance and flags larger differences", () => {
    const withinTolerance = scanLoanCsv("Date,Payment,Principal,Interest,Fees\n01/06/2026,100.00,70.00,29.98,0.00");
    const outsideTolerance = scanLoanCsv("Date,Payment,Principal,Interest,Fees\n01/06/2026,100.00,70.00,29.97,0.00");
    const exceeds = scanLoanCsv("Date,Payment,Principal,Interest,Fees\n01/06/2026,100.00,80.00,21.00,0.00");

    expect(withinTolerance.rows[0].warningCodes).toEqual([]);
    expect(outsideTolerance.rows[0].warningCodes).toContain("COMPONENTS_DO_NOT_MATCH_PAYMENT");
    expect(exceeds.rows[0].warningCodes).toContain("COMPONENTS_EXCEED_PAYMENT");
  });

  it("uses fictional classification terms only", () => {
    expect(classifyLoanEvent("Scheduled payment")).toBe("REPAYMENT");
    expect(classifyLoanEvent("Interest charge")).toBe("INTEREST");
    expect(classifyLoanEvent("Service fee")).toBe("FEE");
    expect(classifyLoanEvent("Loan advance")).toBe("LOAN_ADVANCE");
    expect(classifyLoanEvent("Balance adjustment")).toBe("ADJUSTMENT");
    expect(classifyLoanEvent("Interest correction")).toBe("ADJUSTMENT");
    expect(classifyLoanEvent("Other entry")).toBe("UNKNOWN");
  });

  it("suggests neutral property record-keeping only for investment loan interest", () => {
    const row = scanLoanCsv(groupedRepaymentLedger).rows[0];

    expect(shouldSuggestPropertyRecordKeeping("INVESTMENT", row)).toBe(true);
    expect(shouldSuggestPropertyRecordKeeping("OWNER_OCCUPIER", row)).toBe(false);
    expect(shouldSuggestPropertyRecordKeeping("PERSONAL", row)).toBe(false);
    expect(shouldSuggestPropertyRecordKeeping("OTHER", row)).toBe(false);
    expect(shouldSuggestPropertyRecordKeeping("INVESTMENT", { interestCents: 0 })).toBe(false);
  });
});
