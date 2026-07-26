import {
  EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT,
  EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION,
  type EverydayFinancialYearReport,
} from "@/src/server/everyday-financial-year-report";

export const EVERYDAY_FINANCIAL_YEAR_CSV_NOTICE =
  "Organisational cashflow preparation only - not tax, accounting or financial advice.";

export type EverydayFinancialYearCsvReasonCode =
  | "REPORT_CONTRACT_INVALID"
  | "REPORT_VALUE_INVALID"
  | "REPORT_RECONCILIATION_INVALID";

export class EverydayFinancialYearCsvError extends Error {
  constructor(
    message: string,
    readonly reasonCode: EverydayFinancialYearCsvReasonCode,
  ) {
    super(message);
    this.name = "EverydayFinancialYearCsvError";
  }
}

const summaryColumns = [
  "financial_year",
  "direction",
  "record_count",
  "total_aud",
  "spendgrove_notice",
] as const;

const categoryColumns = [
  "financial_year",
  "direction",
  "category",
  "record_count",
  "total_aud",
  "spendgrove_notice",
] as const;

function assertSafeNonNegativeInteger(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new EverydayFinancialYearCsvError(
      "The report contains an invalid numeric value.",
      "REPORT_VALUE_INVALID",
    );
  }
}

function addChecked(current: number, value: number) {
  assertSafeNonNegativeInteger(value);
  const next = current + value;
  if (!Number.isSafeInteger(next)) {
    throw new EverydayFinancialYearCsvError(
      "The report could not be reconciled safely.",
      "REPORT_RECONCILIATION_INVALID",
    );
  }
  return next;
}

function assertReport(report: EverydayFinancialYearReport) {
  if (
    report.contract !== EVERYDAY_FINANCIAL_YEAR_REPORT_CONTRACT
    || report.version !== EVERYDAY_FINANCIAL_YEAR_REPORT_VERSION
    || report.currency !== "AUD"
    || report.moneyRepresentation !== "integer cents"
    || !/^\d{4}-\d{2}$/.test(report.financialYear.label)
  ) {
    throw new EverydayFinancialYearCsvError(
      "The report contract is unsupported.",
      "REPORT_CONTRACT_INVALID",
    );
  }

  const values = [
    report.moneyIn.count,
    report.moneyIn.totalCents,
    report.moneyOut.count,
    report.moneyOut.totalCents,
    report.transfers.count,
    report.transfers.incomingCount,
    report.transfers.outgoingCount,
    report.countedTransactionCount,
    report.countedSplitChildCount,
  ];
  values.forEach(assertSafeNonNegativeInteger);

  if (
    report.transfers.count !== report.transfers.incomingCount + report.transfers.outgoingCount
    || report.countedTransactionCount
      !== report.moneyIn.count + report.moneyOut.count + report.transfers.count
  ) {
    throw new EverydayFinancialYearCsvError(
      "The report counts do not reconcile.",
      "REPORT_RECONCILIATION_INVALID",
    );
  }

  let moneyInCount = 0;
  let moneyInCents = 0;
  let moneyOutCount = 0;
  let moneyOutCents = 0;

  for (const row of report.categories) {
    if (
      (row.direction !== "MONEY_IN" && row.direction !== "MONEY_OUT")
      || !row.categoryName.trim()
    ) {
      throw new EverydayFinancialYearCsvError(
        "The report contains an invalid Category row.",
        "REPORT_VALUE_INVALID",
      );
    }
    assertSafeNonNegativeInteger(row.count);
    assertSafeNonNegativeInteger(row.totalCents);
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
    throw new EverydayFinancialYearCsvError(
      "The report Categories do not reconcile.",
      "REPORT_RECONCILIATION_INVALID",
    );
  }
}

function csvCell(value: string, protectFormula = false) {
  const protectedValue = protectFormula && /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${protectedValue.replaceAll('"', '""')}"`;
}

function csvRow(values: Array<{ value: string; protectFormula?: boolean }>) {
  return values.map(({ value, protectFormula }) => csvCell(value, protectFormula)).join(",");
}

function audMagnitude(cents: number) {
  assertSafeNonNegativeInteger(cents);
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

function directionLabel(direction: "MONEY_IN" | "MONEY_OUT") {
  return direction === "MONEY_IN" ? "Money in" : "Money out";
}

export function createEverydayFinancialYearSummaryCsv(report: EverydayFinancialYearReport) {
  assertReport(report);
  const year = report.financialYear.label;
  const rows = [
    [year, "Money in", String(report.moneyIn.count), audMagnitude(report.moneyIn.totalCents)],
    [year, "Money out", String(report.moneyOut.count), audMagnitude(report.moneyOut.totalCents)],
    [year, "Incoming transfer context", String(report.transfers.incomingCount), ""],
    [year, "Outgoing transfer context", String(report.transfers.outgoingCount), ""],
  ].map(([financialYear, direction, count, totalAud]) => csvRow([
    { value: financialYear },
    { value: direction },
    { value: count },
    { value: totalAud },
    { value: EVERYDAY_FINANCIAL_YEAR_CSV_NOTICE },
  ]));

  return [summaryColumns.map((column) => csvCell(column)).join(","), ...rows].join("\r\n");
}

export function createEverydayFinancialYearCategoryCsv(report: EverydayFinancialYearReport) {
  assertReport(report);
  const rows = report.categories.map((row) => csvRow([
    { value: report.financialYear.label },
    { value: directionLabel(row.direction) },
    { value: row.categoryName, protectFormula: true },
    { value: String(row.count) },
    { value: audMagnitude(row.totalCents) },
    { value: EVERYDAY_FINANCIAL_YEAR_CSV_NOTICE },
  ]));

  return [categoryColumns.map((column) => csvCell(column)).join(","), ...rows].join("\r\n");
}
