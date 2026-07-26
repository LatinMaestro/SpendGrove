import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  buildEverydayFinancialYearReport,
  type EverydayFinancialYearRecord,
  type EverydayFinancialYearReport,
  type EverydayFinancialYearSourceMode,
} from "@/src/server/everyday-financial-year-report";
import {
  createEverydayFinancialYearReconciliationJson,
  EverydayFinancialYearReconciliationError,
} from "@/src/server/everyday-financial-year-reconciliation-output";

const fixturePath = new URL("../fixtures/phase-c4-everyday-fy-reconciliation.json", import.meta.url);
const generatedAt = new Date("2026-07-26T00:00:00.000Z");

type Fixture = {
  ownerUserId: string;
  financialYear: { endingYear: number };
  transactions: EverydayFinancialYearRecord[];
  loanAnalyticalRepayments: unknown[];
};

async function loadFixture() {
  return JSON.parse(await readFile(fixturePath, "utf8")) as Fixture;
}

async function fixtureReport(
  sourceMode: EverydayFinancialYearSourceMode = "OWNER_SCOPED_DIAGNOSTIC",
) {
  const fixture = await loadFixture();
  const startDate = `${fixture.financialYear.endingYear - 1}-07-01`;
  const endDate = `${fixture.financialYear.endingYear}-06-30`;
  const owned = fixture.transactions.filter((record) => record.userId === fixture.ownerUserId);
  const records = sourceMode === "ELIGIBLE_ONLY"
    ? owned.filter((record) => (
        record.date >= startDate
        && record.date <= endDate
        && record.status === "ACTIVE"
        && record.deletedAt === null
        && record.splitRole !== "PARENT"
      ))
    : owned;

  return buildEverydayFinancialYearReport(
    fixture.ownerUserId,
    records,
    fixture.financialYear.endingYear,
    {
      generatedAt,
      sourceMode,
      analyticalLoanRepaymentCount: fixture.loanAnalyticalRepayments.length,
    },
  );
}

function expectReason(action: () => unknown, reasonCode: string) {
  try {
    action();
    throw new Error("Expected reconciliation error.");
  } catch (error) {
    expect(error).toBeInstanceOf(EverydayFinancialYearReconciliationError);
    expect((error as EverydayFinancialYearReconciliationError).reasonCode).toBe(reasonCode);
  }
}

describe("everyday financial-year reconciliation JSON serializer", () => {
  it("serializes exact owner-scoped aggregate reconciliation evidence", async () => {
    const output = JSON.parse(
      createEverydayFinancialYearReconciliationJson(await fixtureReport()),
    );

    expect(output).toEqual({
      contract: "spendgrove.everyday-financial-year-reconciliation",
      version: 1,
      generatedAt: "2026-07-26T00:00:00.000Z",
      financialYear: {
        endingYear: 2026,
        label: "2025-26",
        startDate: "2025-07-01",
        endDate: "2026-06-30",
      },
      currency: "AUD",
      moneyRepresentation: "integer cents",
      sourceMode: "OWNER_SCOPED_DIAGNOSTIC",
      ownerScopeVerified: true,
      sourceCounts: {
        inputTransactionCount: 15,
        countedTransactionCount: 11,
        moneyInCount: 3,
        moneyOutCount: 6,
        transferContextCount: 2,
        incomingTransferCount: 1,
        outgoingTransferCount: 1,
        countedSplitChildCount: 2,
        outsidePeriodCount: 2,
        deletedOrInactiveCount: 1,
        splitParentCount: 1,
        uncategorisedCount: 1,
        categoryRowCount: 9,
        analyticalLoanRepaymentCount: 1,
      },
      cashflowTotals: {
        moneyInCents: 513000,
        moneyOutCents: 142000,
        analyticalLoanAmountAddedToCashflowCents: 0,
      },
      notices: [
        "Counts reconcile only the bounded owner-scoped candidate set supplied to this report.",
        "Loan repayment components are analytical records and are not added to everyday cashflow.",
        "Organisational cashflow reconciliation only - not tax, accounting or financial advice.",
      ],
      disclaimer:
        "SpendGrove does not determine tax treatment or provide tax, accounting or financial advice.",
    });
  });

  it("keeps unavailable exclusion counts null for eligible-only service input", async () => {
    const output = JSON.parse(
      createEverydayFinancialYearReconciliationJson(
        await fixtureReport("ELIGIBLE_ONLY"),
      ),
    );

    expect(output.sourceMode).toBe("ELIGIBLE_ONLY");
    expect(output.sourceCounts).toMatchObject({
      inputTransactionCount: null,
      countedTransactionCount: 11,
      outsidePeriodCount: null,
      deletedOrInactiveCount: null,
      splitParentCount: null,
    });
    expect(output.notices[0]).toContain("exclusion counts are unavailable");
  });

  it("is deterministic and excludes source, Category and private identifiers", async () => {
    const report = await fixtureReport();
    const first = createEverydayFinancialYearReconciliationJson(report);
    const second = createEverydayFinancialYearReconciliationJson(report);

    expect(first).toBe(second);
    expect(first.endsWith("\n")).toBe(false);
    expect(first).not.toMatch(/category(Id|Name)|transactionId|sourceRecordId/i);
    expect(first).not.toMatch(/synthetic-(user|salary|refund|groceries|loan|transport|utilities)/i);
    expect(first).not.toMatch(/filename|narration|accountNumber|bsb|providerPayload/i);
  });

  it("rejects unsupported contracts, timestamps and financial-year boundaries", async () => {
    const report = await fixtureReport();
    expectReason(() => createEverydayFinancialYearReconciliationJson({
      ...report,
      contract: "unsupported",
    } as unknown as EverydayFinancialYearReport), "REPORT_CONTRACT_INVALID");
    expectReason(() => createEverydayFinancialYearReconciliationJson({
      ...report,
      generatedAt: "not-a-time",
    }), "REPORT_CONTRACT_INVALID");
    expectReason(() => createEverydayFinancialYearReconciliationJson({
      ...report,
      financialYear: { ...report.financialYear, endDate: "2026-07-01" },
    }), "REPORT_CONTRACT_INVALID");
  });

  it("rejects count, Category and diagnostic reconciliation mismatches", async () => {
    const report = await fixtureReport();
    expectReason(() => createEverydayFinancialYearReconciliationJson({
      ...report,
      countedTransactionCount: report.countedTransactionCount + 1,
    }), "REPORT_RECONCILIATION_INVALID");
    expectReason(() => createEverydayFinancialYearReconciliationJson({
      ...report,
      categories: report.categories.slice(1),
    }), "REPORT_RECONCILIATION_INVALID");
    expectReason(() => createEverydayFinancialYearReconciliationJson({
      ...report,
      reconciliation: {
        ...report.reconciliation,
        inputTransactionCount: (report.reconciliation.inputTransactionCount ?? 0) + 1,
      },
    }), "REPORT_RECONCILIATION_INVALID");
  });

  it("rejects fabricated eligible diagnostics and analytical Loan cashflow", async () => {
    const eligible = await fixtureReport("ELIGIBLE_ONLY");
    expectReason(() => createEverydayFinancialYearReconciliationJson({
      ...eligible,
      reconciliation: { ...eligible.reconciliation, outsidePeriodCount: 0 },
    }), "REPORT_RECONCILIATION_INVALID");

    const report = await fixtureReport();
    expectReason(() => createEverydayFinancialYearReconciliationJson({
      ...report,
      reconciliation: {
        ...report.reconciliation,
        analyticalLoanAmountAddedToCashflowCents: 1 as 0,
      },
    }), "REPORT_RECONCILIATION_INVALID");
  });
});
