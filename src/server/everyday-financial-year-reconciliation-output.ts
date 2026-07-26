import {
  EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT,
  EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION,
  type EverydayFinancialYearReport,
} from "@/src/server/everyday-financial-year-report";

export const EVERYDAY_FINANCIAL_YEAR_RECONCILIATION_CONTRACT =
  "spendgrove.everyday-financial-year-reconciliation";
export const EVERYDAY_FINANCIAL_YEAR_RECONCILIATION_VERSION = 1 as const;
export const EVERYDAY_FINANCIAL_YEAR_RECONCILIATION_NOTICE =
  "Organisational cashflow reconciliation only - not tax, accounting or financial advice.";

export type EverydayFinancialYearReconciliationReasonCode =
  | "REPORT_CONTRACT_INVALID"
  | "REPORT_VALUE_INVALID"
  | "REPORT_RECONCILIATION_INVALID";

export class EverydayFinancialYearReconciliationError extends Error {
  constructor(
    message: string,
    readonly reasonCode: EverydayFinancialYearReconciliationReasonCode,
  ) {
    super(message);
    this.name = "EverydayFinancialYearReconciliationError";
  }
}

function fail(
  message: string,
  reasonCode: EverydayFinancialYearReconciliationReasonCode,
): never {
  throw new EverydayFinancialYearReconciliationError(message, reasonCode);
}

function assertSafeNonNegativeInteger(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) {
    fail("The report contains an invalid numeric value.", "REPORT_VALUE_INVALID");
  }
}

function addChecked(current: number, value: number) {
  assertSafeNonNegativeInteger(value);
  const next = current + value;
  if (!Number.isSafeInteger(next)) {
    fail("The report could not be reconciled safely.", "REPORT_RECONCILIATION_INVALID");
  }
  return next;
}

function assertCountTotalCoherence(count: number, totalCents: number) {
  assertSafeNonNegativeInteger(count);
  assertSafeNonNegativeInteger(totalCents);
  if ((count === 0) !== (totalCents === 0)) {
    fail("The report count and total do not agree.", "REPORT_RECONCILIATION_INVALID");
  }
}

function assertFinancialYear(report: EverydayFinancialYearReport) {
  const { endingYear, label, startDate, endDate } = report.financialYear;
  if (!Number.isSafeInteger(endingYear)) {
    fail("The report financial year is invalid.", "REPORT_CONTRACT_INVALID");
  }
  const expectedLabel = `${endingYear - 1}-${String(endingYear).slice(-2).padStart(2, "0")}`;
  if (
    label !== expectedLabel
    || startDate !== `${endingYear - 1}-07-01`
    || endDate !== `${endingYear}-06-30`
  ) {
    fail("The report financial year is invalid.", "REPORT_CONTRACT_INVALID");
  }
}

function assertGeneratedAt(value: string) {
  const generatedAt = new Date(value);
  if (Number.isNaN(generatedAt.getTime()) || generatedAt.toISOString() !== value) {
    fail("The report generation time is invalid.", "REPORT_CONTRACT_INVALID");
  }
}

function assertCategories(report: EverydayFinancialYearReport) {
  let moneyInCount = 0;
  let moneyInCents = 0;
  let moneyOutCount = 0;
  let moneyOutCents = 0;

  for (const row of report.categories) {
    if (
      (row.direction !== "MONEY_IN" && row.direction !== "MONEY_OUT")
      || !row.categoryName.trim()
    ) {
      fail("The report contains an invalid Category row.", "REPORT_VALUE_INVALID");
    }
    assertSafeNonNegativeInteger(row.count);
    assertSafeNonNegativeInteger(row.totalCents);
    if (row.count === 0 || row.totalCents === 0) {
      fail("The report contains an empty Category row.", "REPORT_RECONCILIATION_INVALID");
    }

    if (row.direction === "MONEY_IN") {
      moneyInCount = addChecked(moneyInCount, row.count);
      moneyInCents = addChecked(moneyInCents, row.totalCents);
    } else {
      moneyOutCount = addChecked(moneyOutCount, row.count);
      moneyOutCents = addChecked(moneyOutCents, row.totalCents);
    }
  }

  if (
    moneyInCount !== report.moneyIn.count
    || moneyInCents !== report.moneyIn.totalCents
    || moneyOutCount !== report.moneyOut.count
    || moneyOutCents !== report.moneyOut.totalCents
  ) {
    fail("The report Categories do not reconcile.", "REPORT_RECONCILIATION_INVALID");
  }
}

function assertDiagnostics(report: EverydayFinancialYearReport) {
  const reconciliation = report.reconciliation;
  if (
    reconciliation.sourceMode !== "OWNER_SCOPED_DIAGNOSTIC"
    && reconciliation.sourceMode !== "ELIGIBLE_ONLY"
  ) {
    fail("The report source mode is unsupported.", "REPORT_CONTRACT_INVALID");
  }
  if (reconciliation.ownerScopeVerified !== true) {
    fail("The report owner scope is unverified.", "REPORT_CONTRACT_INVALID");
  }

  const alwaysRequired = [
    reconciliation.uncategorisedCount,
    reconciliation.analyticalLoanRepaymentCount,
    reconciliation.analyticalLoanAmountAddedToCashflowCents,
  ];
  alwaysRequired.forEach(assertSafeNonNegativeInteger);

  const financialRecordCount = addChecked(report.moneyIn.count, report.moneyOut.count);
  if (
    reconciliation.uncategorisedCount > financialRecordCount
    || reconciliation.analyticalLoanAmountAddedToCashflowCents !== 0
  ) {
    fail("The report diagnostics do not reconcile.", "REPORT_RECONCILIATION_INVALID");
  }

  const diagnosticValues = [
    reconciliation.inputTransactionCount,
    reconciliation.outsidePeriodCount,
    reconciliation.deletedOrInactiveCount,
    reconciliation.splitParentCount,
  ];

  if (reconciliation.sourceMode === "ELIGIBLE_ONLY") {
    if (diagnosticValues.some((value) => value !== null)) {
      fail("Eligible-only diagnostics must remain unavailable.", "REPORT_RECONCILIATION_INVALID");
    }
    return;
  }

  if (diagnosticValues.some((value) => value === null)) {
    fail("Owner-scoped diagnostics are incomplete.", "REPORT_RECONCILIATION_INVALID");
  }

  const numericDiagnostics = diagnosticValues as [number, number, number, number];
  numericDiagnostics.forEach(assertSafeNonNegativeInteger);
  const [
    inputTransactionCount,
    outsidePeriodCount,
    deletedOrInactiveCount,
    splitParentCount,
  ] = numericDiagnostics;

  const excludedCount = addChecked(
    addChecked(outsidePeriodCount, deletedOrInactiveCount),
    splitParentCount,
  );
  if (inputTransactionCount !== addChecked(report.countedTransactionCount, excludedCount)) {
    fail("The diagnostic source count does not reconcile.", "REPORT_RECONCILIATION_INVALID");
  }
}

function assertReport(report: EverydayFinancialYearReport) {
  if (
    report.contract !== EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT
    || report.version !== EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION
    || report.currency !== "AUD"
    || report.moneyRepresentation !== "integer cents"
  ) {
    fail("The report contract is unsupported.", "REPORT_CONTRACT_INVALID");
  }

  assertGeneratedAt(report.generatedAt);
  assertFinancialYear(report);
  assertCountTotalCoherence(report.moneyIn.count, report.moneyIn.totalCents);
  assertCountTotalCoherence(report.moneyOut.count, report.moneyOut.totalCents);

  [
    report.transfers.count,
    report.transfers.incomingCount,
    report.transfers.outgoingCount,
    report.countedTransactionCount,
    report.countedSplitChildCount,
  ].forEach(assertSafeNonNegativeInteger);

  const transferCount = addChecked(
    report.transfers.incomingCount,
    report.transfers.outgoingCount,
  );
  const financialRecordCount = addChecked(report.moneyIn.count, report.moneyOut.count);
  const countedTransactionCount = addChecked(financialRecordCount, report.transfers.count);

  if (
    report.transfers.count !== transferCount
    || report.countedTransactionCount !== countedTransactionCount
    || report.countedSplitChildCount > report.countedTransactionCount
  ) {
    fail("The report counts do not reconcile.", "REPORT_RECONCILIATION_INVALID");
  }

  assertCategories(report);
  assertDiagnostics(report);
}

export function createEverydayFinancialYearReconciliationJson(
  report: EverydayFinancialYearReport,
) {
  assertReport(report);

  const payload = {
    contract: EVERYDAY_FINANCIAL_YEAR_RECONCILIATION_CONTRACT,
    version: EVERYDAY_FINANCIAL_YEAR_RECONCILIATION_VERSION,
    generatedAt: report.generatedAt,
    financialYear: {
      endingYear: report.financialYear.endingYear,
      label: report.financialYear.label,
      startDate: report.financialYear.startDate,
      endDate: report.financialYear.endDate,
    },
    currency: report.currency,
    moneyRepresentation: report.moneyRepresentation,
    sourceMode: report.reconciliation.sourceMode,
    ownerScopeVerified: true as const,
    sourceCounts: {
      inputTransactionCount: report.reconciliation.inputTransactionCount,
      countedTransactionCount: report.countedTransactionCount,
      moneyInCount: report.moneyIn.count,
      moneyOutCount: report.moneyOut.count,
      transferContextCount: report.transfers.count,
      incomingTransferCount: report.transfers.incomingCount,
      outgoingTransferCount: report.transfers.outgoingCount,
      countedSplitChildCount: report.countedSplitChildCount,
      outsidePeriodCount: report.reconciliation.outsidePeriodCount,
      deletedOrInactiveCount: report.reconciliation.deletedOrInactiveCount,
      splitParentCount: report.reconciliation.splitParentCount,
      uncategorisedCount: report.reconciliation.uncategorisedCount,
      categoryRowCount: report.categories.length,
      analyticalLoanRepaymentCount: report.reconciliation.analyticalLoanRepaymentCount,
    },
    cashflowTotals: {
      moneyInCents: report.moneyIn.totalCents,
      moneyOutCents: report.moneyOut.totalCents,
      analyticalLoanAmountAddedToCashflowCents: 0 as const,
    },
    notices: [
      report.reconciliation.sourceMode === "ELIGIBLE_ONLY"
        ? "Only eligible active owner-scoped records were supplied; exclusion counts are unavailable."
        : "Counts reconcile only the bounded owner-scoped candidate set supplied to this report.",
      "Loan repayment components are analytical records and are not added to everyday cashflow.",
      EVERYDAY_FINANCIAL_YEAR_RECONCILIATION_NOTICE,
    ],
    disclaimer:
      "SpendGrove does not determine tax treatment or provide tax, accounting or financial advice.",
  };

  return JSON.stringify(payload, null, 2);
}
