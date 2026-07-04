import type { PropertyRecordClassification } from "@prisma/client";
import type { AuthenticatedUserContext } from "@/src/server/auth/current-user";
import {
  getPropertyRecordReview,
  type PropertyRecordReviewStore,
  type SafePropertyRecordReview,
  type SafePropertyReviewRecord,
} from "@/src/server/property-report-review";

export type PropertyRecordSummaryGroup = { count: number; totalCents: number };

export type SafePropertyRecordSummary = {
  propertyIncome: PropertyRecordSummaryGroup;
  propertyOutgoing: PropertyRecordSummaryGroup;
  refundOrReversal: PropertyRecordSummaryGroup;
  loanPaymentCashflow: PropertyRecordSummaryGroup;
  transferContextCount: number;
  otherPropertyRecordCount: number;
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
    propertyIncome: emptyGroup(),
    propertyOutgoing: emptyGroup(),
    refundOrReversal: emptyGroup(),
    loanPaymentCashflow: emptyGroup(),
    transferContextCount: 0,
    otherPropertyRecordCount: 0,
  };

  for (const record of review.records) {
    if (!record.classification || record.classificationNeedsReview) continue;
    if (record.classification === "PROPERTY_INCOME") addChecked(summary.propertyIncome, record.amountCents);
    if (record.classification === "PROPERTY_OUTGOING") addChecked(summary.propertyOutgoing, Math.abs(record.amountCents));
    if (record.classification === "REFUND_OR_REVERSAL") addChecked(summary.refundOrReversal, record.amountCents);
    if (record.classification === "LOAN_PAYMENT_CONTEXT") addChecked(summary.loanPaymentCashflow, Math.abs(record.amountCents));
    if (record.classification === "TRANSFER_CONTEXT") summary.transferContextCount += 1;
    if (record.classification === "OTHER_PROPERTY_RECORD") summary.otherPropertyRecordCount += 1;
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
  "record_classification",
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

function exportableClassification(classification: PropertyRecordClassification | null): classification is Exclude<PropertyRecordClassification, "EXCLUDED"> {
  return classification !== null && classification !== "EXCLUDED";
}

function exportRow(review: SafePropertyRecordReview, record: SafePropertyReviewRecord) {
  if (!exportableClassification(record.classification) || record.classificationNeedsReview) return null;
  return [
    csvCell(record.transactionId),
    csvCell(review.financialYear.label),
    csvCell(review.property.nickname, true),
    csvCell(record.date),
    csvCell(record.type),
    csvCell(signedAud(record.amountCents)),
    csvCell(record.categoryName ?? "Uncategorised", true),
    csvCell(record.classification),
    csvCell(record.provenance),
    csvCell("Record keeping only - not tax advice."),
  ].join(",");
}

export function createPropertyRecordCsv(review: SafePropertyRecordReview) {
  const rows = review.records.flatMap((record) => {
    const row = exportRow(review, record);
    return row ? [row] : [];
  });
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
