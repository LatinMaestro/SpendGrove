import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import {
  getPropertyRecordReview,
  type PropertyRecordReviewStore,
  type SafePropertyRecordReview,
  type SafePropertyReviewRecord,
} from "@/src/server/property-report-review";

export type PropertyRecordSummaryGroup = { count: number; totalCents: number };

export type SafePropertyRecordSummary = {
  moneyIn: PropertyRecordSummaryGroup;
  moneyOut: PropertyRecordSummaryGroup;
  loanPaymentCashflow: PropertyRecordSummaryGroup;
  transferContextCount: number;
  totalLinkedRecordCount: number;
};

function emptyGroup(): PropertyRecordSummaryGroup {
  return { count: 0, totalCents: 0 };
}

function addChecked(group: PropertyRecordSummaryGroup, cents: number) {
  const next = group.totalCents + cents;
  if (!Number.isSafeInteger(next)) throw new Error("PROPERTY_REPORT_SUMMARY_OVERFLOW");
  group.totalCents = next;
  group.count += 1;
}

export function summarizePropertyRecords(review: SafePropertyRecordReview): SafePropertyRecordSummary {
  const summary: SafePropertyRecordSummary = {
    moneyIn: emptyGroup(),
    moneyOut: emptyGroup(),
    loanPaymentCashflow: emptyGroup(),
    transferContextCount: 0,
    totalLinkedRecordCount: review.records.length,
  };

  for (const record of review.records) {
    if (record.type === "INCOME" && record.amountCents > 0) addChecked(summary.moneyIn, record.amountCents);
    if (record.type === "EXPENSE" && record.amountCents < 0) addChecked(summary.moneyOut, Math.abs(record.amountCents));
    if (record.type === "EXPENSE" && record.amountCents < 0 && record.provenance !== "MANUAL_PROPERTY_LINK") {
      addChecked(summary.loanPaymentCashflow, Math.abs(record.amountCents));
    }
    if (record.type === "TRANSFER") summary.transferContextCount += 1;
  }
  return summary;
}

const exportColumns = [
  "record_id",
  "financial_year",
  "property_nickname",
  "transaction_date",
  "transaction_type",
  "amount_aud",
  "category_label",
  "connection_source",
  "spendgrove_notice",
] as const;

function signedAud(cents: number) {
  const absolute = Math.abs(cents);
  return `${cents < 0 ? "-" : ""}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

function csvCell(value: string, protectFormula = false) {
  const injectionSafe = protectFormula && /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${injectionSafe.replaceAll('"', '""')}"`;
}

function exportRow(review: SafePropertyRecordReview, record: SafePropertyReviewRecord) {
  return [
    csvCell(record.transactionId),
    csvCell(review.financialYear.label),
    csvCell(review.property.nickname, true),
    csvCell(record.date),
    csvCell(record.type),
    csvCell(signedAud(record.amountCents)),
    csvCell(record.categoryName ?? "Uncategorised", true),
    csvCell(record.provenance),
    csvCell("Record keeping only - not tax advice."),
  ].join(",");
}

export function createPropertyRecordCsv(review: SafePropertyRecordReview) {
  const rows = review.records.map((record) => exportRow(review, record));
  return [exportColumns.map((column) => csvCell(column)).join(","), ...rows].join("\r\n");
}

export async function getPropertyRecordCsv(
  context: AuthenticatedUserContext | null | undefined,
  propertyId: string,
  endingYear: unknown,
  store?: PropertyRecordReviewStore,
) {
  const review = await getPropertyRecordReview(context, propertyId, endingYear, store);
  return {
    csv: createPropertyRecordCsv(review),
    financialYearLabel: review.financialYear.label,
  };
}
