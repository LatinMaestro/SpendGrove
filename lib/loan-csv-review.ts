import {
  parseAustralianCsvDate,
  parseCsvDocument,
  type TransientCsvDocument,
} from "@/lib/csv-import";
import { containsPrivateBankIdentifier, normalizeSafeText } from "@/lib/validation/privacy";
import { parseMoneyToCents } from "@/lib/validation/money";

export type LoanCsvMappingMode = "COMPONENT_COLUMNS" | "ROW_EVENT_LEDGER";

export type LoanCsvColumnRole =
  | "DATE"
  | "TOTAL_PAYMENT"
  | "PRINCIPAL"
  | "INTEREST"
  | "FEES"
  | "SIGNED_AMOUNT"
  | "EVENT_TYPE"
  | "BALANCE_AFTER"
  | "IGNORE"
  | "PRIVATE";

export type LoanCsvMapping = Record<number, LoanCsvColumnRole>;

export type LoanCsvColumn = {
  index: number;
  safeLabel: string;
  isPrivate: boolean;
  componentSuggestedRole: LoanCsvColumnRole;
  rowEventSuggestedRole: LoanCsvColumnRole;
};

export type LoanEventClassification =
  | "REPAYMENT"
  | "INTEREST"
  | "FEE"
  | "LOAN_ADVANCE"
  | "ADJUSTMENT"
  | "UNKNOWN";

export type LoanCsvReviewWarning =
  | "DATE_NEEDS_REVIEW"
  | "PAYMENT_NEEDS_REVIEW"
  | "EVENT_AMOUNT_NEEDS_REVIEW"
  | "EVENT_TYPE_NEEDS_REVIEW"
  | "ADJUSTMENT_NEEDS_REVIEW"
  | "UNKNOWN_EVENT_NEEDS_REVIEW"
  | "MULTIPLE_REPAYMENTS_NEED_REVIEW"
  | "NON_REPAYMENT_NEEDS_REVIEW"
  | "COMPONENTS_EXCEED_PAYMENT"
  | "COMPONENTS_DO_NOT_MATCH_PAYMENT";

export type LoanCsvReviewRow = {
  rowNumber: number;
  sourceRowNumbers: number[];
  sourceRowCount: number;
  isGroupedRepayment: boolean;
  date: string | null;
  classification: LoanEventClassification | null;
  eventAmountCents: number | null;
  totalPaymentCents: number | null;
  principalCents: number | null;
  interestCents: number | null;
  feeCents: number | null;
  balanceAfterCents: number | null;
  componentNotes: string[];
  warningCodes: LoanCsvReviewWarning[];
};

export type LoanPurposeForRecordKeeping = "OWNER_OCCUPIER" | "INVESTMENT" | "PERSONAL" | "OTHER";

const privateHeaderRules = [
  /\bbsb\b/i,
  /\baccount\s*(?:number|no|name|id|reference)\b/i,
  /\b(?:card|credit card)\s*(?:number|no|fragment|ending|reference)\b/i,
  /\b(?:customer|client|member)\s*(?:number|no|id|reference)\b/i,
  /\bloan\s*(?:account)?\s*(?:number|no|id|reference)\b/i,
  /\b(?:lender|bank)\s*reference\b/i,
];

const headerRoleRules: Array<{ role: LoanCsvColumnRole; patterns: RegExp[] }> = [
  { role: "DATE", patterns: [/^date$/i, /value\s*date/i, /payment\s*date/i, /transaction\s*date/i, /event\s*date/i] },
  { role: "TOTAL_PAYMENT", patterns: [/^payment$/i, /^repayment$/i, /total\s*(?:payment|repayment)/i, /payment\s*amount/i, /repayment\s*amount/i] },
  { role: "PRINCIPAL", patterns: [/principal/i] },
  { role: "INTEREST", patterns: [/interest/i] },
  { role: "FEES", patterns: [/^fees?$/i, /charges?/i, /service\s*fee/i] },
  { role: "SIGNED_AMOUNT", patterns: [/signed\s*amount/i, /^amount$/i, /event\s*amount/i, /transaction\s*amount/i] },
  { role: "EVENT_TYPE", patterns: [/event\s*type/i, /transaction\s*type/i, /event\s*class/i, /^type$/i, /^event$/i] },
  { role: "BALANCE_AFTER", patterns: [/^balance$/i, /running\s*balance/i, /closing\s*balance/i, /balance\s*after/i] },
];

const repaymentPattern = /\b(?:repayment|payment|direct debit|instalment)\b/i;
const interestPattern = /\binterest\b/i;
const feePattern = /\b(?:fee|charge)\b/i;
const advancePattern = /\b(?:advance|drawdown|draw down|loan funds|disbursement)\b/i;
const adjustmentPattern = /\b(?:adjustment|correction|reversal|refund)\b/i;

function headerSuggestedRole(header: string): LoanCsvColumnRole {
  return headerRoleRules.find((rule) => rule.patterns.some((pattern) => pattern.test(header)))?.role ?? "IGNORE";
}

function isPrivateHeader(header: string) {
  return privateHeaderRules.some((pattern) => pattern.test(header)) || containsPrivateBankIdentifier(header);
}

function safeHeaderLabel(header: string, index: number, isPrivate: boolean) {
  if (isPrivate) return `Private column ${index + 1}`;
  return normalizeSafeText(header) || `Column ${index + 1}`;
}

function moneyValue(value: string) {
  try {
    return parseMoneyToCents(value);
  } catch {
    return null;
  }
}

function evidence(values: string[]) {
  const nonEmpty = values.filter(Boolean);
  const denominator = Math.max(1, nonEmpty.length);
  const parsedMoney = nonEmpty.map(moneyValue);
  const moneyValues = parsedMoney.filter((value): value is number => value !== null);
  const textValues = nonEmpty.filter((value) => /[a-z]/i.test(value) && moneyValue(value) === null && !parseAustralianCsvDate(value));

  return {
    dateRatio: nonEmpty.filter((value) => Boolean(parseAustralianCsvDate(value))).length / denominator,
    moneyRatio: moneyValues.length / denominator,
    signedMoneyRatio: moneyValues.filter((value) => value < 0).length / denominator,
    textRatio: textValues.length / denominator,
    shortTextRatio: textValues.filter((value) => value.length <= 60).length / denominator,
    distinctShortTextCount: new Set(textValues.map((value) => value.toLocaleLowerCase("en-AU"))).size,
  };
}

function inferRowEventRole(values: string[]): LoanCsvColumnRole {
  const columnEvidence = evidence(values);
  if (columnEvidence.dateRatio >= 0.7) return "DATE";
  if (
    columnEvidence.textRatio >= 0.7 &&
    columnEvidence.shortTextRatio >= 0.7 &&
    columnEvidence.distinctShortTextCount > 0
  ) return "EVENT_TYPE";
  if (columnEvidence.moneyRatio >= 0.7 && columnEvidence.signedMoneyRatio > 0) return "SIGNED_AMOUNT";
  return "IGNORE";
}

export function assessLoanCsvColumns(document: TransientCsvDocument): LoanCsvColumn[] {
  const preliminary = document.headers.map((header, index) => {
    const values = document.rows.slice(0, 25).map((row) => row[index]?.trim() ?? "").filter(Boolean);
    const headerRole = document.hasHeader ? headerSuggestedRole(header) : "IGNORE";
    const inferredRowRole = headerRole === "IGNORE" ? inferRowEventRole(values) : headerRole;
    const narrative = inferredRowRole === "EVENT_TYPE";
    const privateValueRatio = values.length === 0
      ? 0
      : values.filter(containsPrivateBankIdentifier).length / values.length;
    const isPrivate = (document.hasHeader && isPrivateHeader(header)) ||
      (!narrative && headerRole === "IGNORE" && privateValueRatio >= 0.5);

    return {
      index,
      header,
      values,
      headerRole,
      inferredRowRole,
      isPrivate,
    };
  });

  const availableMoneyColumns = preliminary.filter((column) =>
    !column.isPrivate && evidence(column.values).moneyRatio >= 0.7,
  );
  const signedAmountIndex = availableMoneyColumns.find((column) =>
    evidence(column.values).signedMoneyRatio > 0,
  )?.index ?? (!document.hasHeader ? availableMoneyColumns[0]?.index : undefined);
  const balanceIndex = [...availableMoneyColumns]
    .reverse()
    .find((column) => column.index !== signedAmountIndex)?.index;

  return preliminary.map((column): LoanCsvColumn => {
    const componentSuggestedRole = column.isPrivate
      ? "PRIVATE"
      : column.headerRole === "SIGNED_AMOUNT"
        ? "TOTAL_PAYMENT"
        : column.headerRole === "EVENT_TYPE" ? "IGNORE" : column.headerRole;
    let rowEventSuggestedRole = column.isPrivate ? "PRIVATE" : column.inferredRowRole;

    if (!column.isPrivate && column.index === signedAmountIndex) rowEventSuggestedRole = "SIGNED_AMOUNT";
    if (!column.isPrivate && column.index === balanceIndex) rowEventSuggestedRole = "BALANCE_AFTER";
    if (rowEventSuggestedRole === "TOTAL_PAYMENT" || rowEventSuggestedRole === "PRINCIPAL" || rowEventSuggestedRole === "INTEREST" || rowEventSuggestedRole === "FEES") {
      rowEventSuggestedRole = "IGNORE";
    }

    return {
      index: column.index,
      safeLabel: document.hasHeader
        ? safeHeaderLabel(column.header, column.index, column.isPrivate)
        : `Column ${column.index + 1}`,
      isPrivate: column.isPrivate,
      componentSuggestedRole,
      rowEventSuggestedRole,
    };
  });
}

function hasDistinctRequiredSuggestions(columns: LoanCsvColumn[], roles: LoanCsvColumnRole[]) {
  return roles.every((role) => columns.filter((column) => column.rowEventSuggestedRole === role).length === 1);
}

export function detectLoanCsvMappingMode(document: TransientCsvDocument, columns: LoanCsvColumn[]): LoanCsvMappingMode {
  const isFourColumnHeaderlessLedger = !document.hasHeader &&
    document.headers.length === 4 &&
    hasDistinctRequiredSuggestions(columns, ["DATE", "SIGNED_AMOUNT", "EVENT_TYPE", "BALANCE_AFTER"]);
  if (isFourColumnHeaderlessLedger) return "ROW_EVENT_LEDGER";

  const rowEventHeaderEvidence = columns.some((column) => column.rowEventSuggestedRole === "EVENT_TYPE") &&
    columns.some((column) => column.rowEventSuggestedRole === "SIGNED_AMOUNT");
  return rowEventHeaderEvidence ? "ROW_EVENT_LEDGER" : "COMPONENT_COLUMNS";
}

export function buildSuggestedLoanCsvMapping(
  columns: LoanCsvColumn[],
  mode: LoanCsvMappingMode,
): LoanCsvMapping {
  const mapping: LoanCsvMapping = Object.fromEntries(
    columns.map((column) => [column.index, column.isPrivate ? "PRIVATE" : "IGNORE"]),
  );
  const suggestionKey = mode === "ROW_EVENT_LEDGER" ? "rowEventSuggestedRole" : "componentSuggestedRole";
  const allowedRoles = mode === "ROW_EVENT_LEDGER"
    ? ["DATE", "SIGNED_AMOUNT", "EVENT_TYPE", "BALANCE_AFTER"]
    : ["DATE", "TOTAL_PAYMENT", "PRINCIPAL", "INTEREST", "FEES", "BALANCE_AFTER"];

  for (const role of allowedRoles) {
    const candidate = columns.find((column) => !column.isPrivate && column[suggestionKey] === role);
    if (candidate) mapping[candidate.index] = role as LoanCsvColumnRole;
  }
  return mapping;
}

export function validateLoanCsvMapping(mapping: LoanCsvMapping, mode: LoanCsvMappingMode) {
  const roles = Object.values(mapping);
  const issues: string[] = [];
  const count = (role: LoanCsvColumnRole) => roles.filter((mappedRole) => mappedRole === role).length;
  const dateLabel = mode === "ROW_EVENT_LEDGER" ? "event date" : "repayment date";

  if (count("DATE") === 0) issues.push(`Choose an ${dateLabel} column.`);
  if (count("DATE") > 1) issues.push(`Choose only one ${dateLabel} column.`);

  if (mode === "ROW_EVENT_LEDGER") {
    if (count("SIGNED_AMOUNT") === 0) issues.push("Choose a signed amount column.");
    if (count("SIGNED_AMOUNT") > 1) issues.push("Choose only one signed amount column.");
    if (count("EVENT_TYPE") === 0) issues.push("Choose a loan event type column so SpendGrove can tell repayments, interest and fees apart.");
    if (count("EVENT_TYPE") > 1) issues.push("Choose only one loan event type column.");
  } else {
    const amountRoles = ["TOTAL_PAYMENT", "PRINCIPAL", "INTEREST", "FEES"] as const;
    if (!amountRoles.some((role) => count(role) > 0)) {
      issues.push("Choose at least one total payment, principal, interest or fees column.");
    }
    for (const role of amountRoles) {
      if (count(role) > 1) issues.push(`Choose only one ${role.toLocaleLowerCase("en-AU").replaceAll("_", " ")} column.`);
    }
  }

  if (count("BALANCE_AFTER") > 1) issues.push("Choose only one balance after column.");
  return issues;
}

function valueForRole(row: string[], mapping: LoanCsvMapping, role: LoanCsvColumnRole) {
  const index = Object.entries(mapping).find(([, mappedRole]) => mappedRole === role)?.[0];
  return index === undefined ? "" : row[Number(index)] ?? "";
}

function optionalMoney(value: string) {
  if (!value.trim()) return null;
  return Math.abs(parseMoneyToCents(value));
}

function safeMoney(value: string) {
  try {
    return optionalMoney(value);
  } catch {
    return null;
  }
}

export function classifyLoanEvent(value: string): LoanEventClassification {
  if (adjustmentPattern.test(value)) return "ADJUSTMENT";
  if (advancePattern.test(value)) return "LOAN_ADVANCE";
  if (interestPattern.test(value)) return "INTEREST";
  if (feePattern.test(value)) return "FEE";
  if (repaymentPattern.test(value)) return "REPAYMENT";
  return "UNKNOWN";
}

function combineWarnings(...warnings: LoanCsvReviewWarning[][]) {
  return Array.from(new Set(warnings.flat()));
}

function sumCents(values: Array<number | null>) {
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

function latestBalanceAfter(rows: LoanCsvReviewRow[]) {
  return [...rows].reverse().find((row) => row.balanceAfterCents !== null)?.balanceAfterCents ?? null;
}

function buildRowEventSourceRow(
  row: string[],
  rowNumber: number,
  mapping: LoanCsvMapping,
): LoanCsvReviewRow {
  const warningCodes: LoanCsvReviewWarning[] = [];
  const date = parseAustralianCsvDate(valueForRole(row, mapping, "DATE"));
  if (!date) warningCodes.push("DATE_NEEDS_REVIEW");

  const eventAmountCents = safeMoney(valueForRole(row, mapping, "SIGNED_AMOUNT"));
  if (eventAmountCents === null) warningCodes.push("EVENT_AMOUNT_NEEDS_REVIEW");

  const eventText = valueForRole(row, mapping, "EVENT_TYPE");
  const classification = eventText ? classifyLoanEvent(eventText) : "UNKNOWN";
  if (!eventText) warningCodes.push("EVENT_TYPE_NEEDS_REVIEW");
  if (classification === "ADJUSTMENT") warningCodes.push("ADJUSTMENT_NEEDS_REVIEW");
  if (classification === "UNKNOWN") warningCodes.push("UNKNOWN_EVENT_NEEDS_REVIEW");

  return {
    rowNumber,
    sourceRowNumbers: [rowNumber],
    sourceRowCount: 1,
    isGroupedRepayment: false,
    date,
    classification,
    eventAmountCents,
    totalPaymentCents: classification === "REPAYMENT" ? eventAmountCents : null,
    principalCents: null,
    interestCents: classification === "INTEREST" ? eventAmountCents : null,
    feeCents: classification === "FEE" ? eventAmountCents : null,
    balanceAfterCents: safeMoney(valueForRole(row, mapping, "BALANCE_AFTER")),
    componentNotes: [],
    warningCodes,
  };
}

function groupRowEventReviewRows(rows: LoanCsvReviewRow[]): LoanCsvReviewRow[] {
  const grouped = new Map<string, LoanCsvReviewRow[]>();
  const output: LoanCsvReviewRow[] = [];

  for (const row of rows) {
    if (!row.date) {
      output.push({
        ...row,
        warningCodes: combineWarnings(row.warningCodes, ["DATE_NEEDS_REVIEW"]),
      });
      continue;
    }

    if (!grouped.has(row.date)) grouped.set(row.date, []);
    grouped.get(row.date)?.push(row);
  }

  for (const sameDateRows of grouped.values()) {
    const rowNumber = sameDateRows[0].rowNumber;
    const date = sameDateRows[0].date;
    const sourceRowNumbers = sameDateRows.flatMap((row) => row.sourceRowNumbers);
    const warningCodes = combineWarnings(...sameDateRows.map((row) => row.warningCodes));
    const repaymentRows = sameDateRows.filter((row) => row.classification === "REPAYMENT");
    const interestRows = sameDateRows.filter((row) => row.classification === "INTEREST");
    const feeRows = sameDateRows.filter((row) => row.classification === "FEE");
    const advanceRows = sameDateRows.filter((row) => row.classification === "LOAN_ADVANCE");
    const adjustmentRows = sameDateRows.filter((row) => row.classification === "ADJUSTMENT");
    const unknownRows = sameDateRows.filter((row) => row.classification === "UNKNOWN");
    const componentNotes: string[] = [];

    if (repaymentRows.length === 0) {
      const firstClassification = sameDateRows[0].classification;
      const interestCents = interestRows.length > 0 ? sumCents(interestRows.map((row) => row.interestCents)) : null;
      const feeCents = feeRows.length > 0 ? sumCents(feeRows.map((row) => row.feeCents)) : null;
      if (interestCents !== null) componentNotes.push("interest identified");
      if (feeCents !== null) componentNotes.push("fee identified");

      output.push({
        rowNumber,
        sourceRowNumbers,
        sourceRowCount: sourceRowNumbers.length,
        isGroupedRepayment: false,
        date,
        classification: firstClassification,
        eventAmountCents: sameDateRows.length === 1 ? sameDateRows[0].eventAmountCents : null,
        totalPaymentCents: null,
        principalCents: null,
        interestCents,
        feeCents,
        balanceAfterCents: latestBalanceAfter(sameDateRows),
        componentNotes,
        warningCodes: combineWarnings(warningCodes, ["NON_REPAYMENT_NEEDS_REVIEW"]),
      });
      continue;
    }

    const totalPaymentCents = sumCents(repaymentRows.map((row) => row.totalPaymentCents));
    const interestCents = interestRows.length > 0 ? sumCents(interestRows.map((row) => row.interestCents)) : 0;
    const feeCents = feeRows.length > 0 ? sumCents(feeRows.map((row) => row.feeCents)) : 0;
    const hasAmbiguousCompanions = advanceRows.length > 0 || adjustmentRows.length > 0 || unknownRows.length > 0;
    const hasMultipleRepayments = repaymentRows.length > 1;
    let principalCents: number | null = null;

    if (interestRows.length > 0) componentNotes.push("interest identified");
    if (feeRows.length > 0) componentNotes.push("fee identified");

    if (hasMultipleRepayments) warningCodes.push("MULTIPLE_REPAYMENTS_NEED_REVIEW");
    if (hasAmbiguousCompanions) warningCodes.push("NON_REPAYMENT_NEEDS_REVIEW");

    if (!hasMultipleRepayments && !hasAmbiguousCompanions) {
      const derivedPrincipal = totalPaymentCents - interestCents - feeCents;
      if (derivedPrincipal >= 0) {
        principalCents = derivedPrincipal;
        componentNotes.push("principal calculated");
      } else {
        warningCodes.push("COMPONENTS_EXCEED_PAYMENT");
      }
    }

    output.push({
      rowNumber,
      sourceRowNumbers,
      sourceRowCount: sourceRowNumbers.length,
      isGroupedRepayment: true,
      date,
      classification: "REPAYMENT",
      eventAmountCents: totalPaymentCents,
      totalPaymentCents,
      principalCents,
      interestCents,
      feeCents,
      balanceAfterCents: latestBalanceAfter(sameDateRows),
      componentNotes,
      warningCodes: combineWarnings(warningCodes),
    });
  }

  return output;
}

export function shouldSuggestPropertyRecordKeeping(
  loanPurpose: LoanPurposeForRecordKeeping,
  row: Pick<LoanCsvReviewRow, "interestCents">,
) {
  return loanPurpose === "INVESTMENT" && (row.interestCents ?? 0) > 0;
}

function buildComponentReviewRow(
  row: string[],
  rowNumber: number,
  mapping: LoanCsvMapping,
): LoanCsvReviewRow {
  const warningCodes: LoanCsvReviewWarning[] = [];
  const date = parseAustralianCsvDate(valueForRole(row, mapping, "DATE"));
  if (!date) warningCodes.push("DATE_NEEDS_REVIEW");

  const totalPaymentCents = safeMoney(valueForRole(row, mapping, "TOTAL_PAYMENT"));
  const principalCents = safeMoney(valueForRole(row, mapping, "PRINCIPAL"));
  const interestCents = safeMoney(valueForRole(row, mapping, "INTEREST"));
  const feeCents = safeMoney(valueForRole(row, mapping, "FEES"));
  if (totalPaymentCents === null && principalCents === null && interestCents === null && feeCents === null) {
    warningCodes.push("PAYMENT_NEEDS_REVIEW");
  }

  const components = [principalCents, interestCents, feeCents];
  const knownComponentTotal = components.reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
  if (totalPaymentCents !== null && knownComponentTotal > totalPaymentCents + 2) {
    warningCodes.push("COMPONENTS_EXCEED_PAYMENT");
  } else if (
    totalPaymentCents !== null &&
    components.every((amount) => amount !== null) &&
    Math.abs(knownComponentTotal - totalPaymentCents) > 2
  ) {
    warningCodes.push("COMPONENTS_DO_NOT_MATCH_PAYMENT");
  }

  return {
    rowNumber,
    sourceRowNumbers: [rowNumber],
    sourceRowCount: 1,
    isGroupedRepayment: false,
    date,
    classification: null,
    eventAmountCents: null,
    totalPaymentCents,
    principalCents,
    interestCents,
    feeCents,
    balanceAfterCents: safeMoney(valueForRole(row, mapping, "BALANCE_AFTER")),
    componentNotes: [],
    warningCodes,
  };
}

export function buildLoanCsvReview(
  document: TransientCsvDocument,
  columns: LoanCsvColumn[],
  mapping: LoanCsvMapping,
  mode: LoanCsvMappingMode,
) {
  const safeMapping = { ...mapping };
  columns.forEach((column) => {
    if (column.isPrivate) safeMapping[column.index] = "PRIVATE";
  });

  const mappingIssues = validateLoanCsvMapping(safeMapping, mode);
  const sourceRows = document.rows.map((row, index) => {
    const rowNumber = index + (document.hasHeader ? 2 : 1);
    return mode === "ROW_EVENT_LEDGER"
      ? buildRowEventSourceRow(row, rowNumber, safeMapping)
      : buildComponentReviewRow(row, rowNumber, safeMapping);
  });
  const rows = mode === "ROW_EVENT_LEDGER" ? groupRowEventReviewRows(sourceRows) : sourceRows;

  return { mode, mapping: safeMapping, mappingIssues, rows };
}

export function scanLoanCsv(csvText: string) {
  const document = parseCsvDocument(csvText);
  const columns = assessLoanCsvColumns(document);
  const mode = detectLoanCsvMappingMode(document, columns);
  const mapping = buildSuggestedLoanCsvMapping(columns, mode);
  return { document, columns, ...buildLoanCsvReview(document, columns, mapping, mode) };
}
