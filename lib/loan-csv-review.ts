import {
  parseAustralianCsvDate,
  parseCsvDocument,
  type TransientCsvDocument,
} from "@/lib/csv-import";
import { containsPrivateBankIdentifier, normalizeSafeText } from "@/lib/validation/privacy";
import { parseMoneyToCents } from "@/lib/validation/money";

export type LoanCsvColumnRole =
  | "DATE"
  | "TOTAL_PAYMENT"
  | "PRINCIPAL"
  | "INTEREST"
  | "FEES"
  | "BALANCE_AFTER"
  | "IGNORE"
  | "PRIVATE";

export type LoanCsvMapping = Record<number, LoanCsvColumnRole>;

export type LoanCsvColumn = {
  index: number;
  safeLabel: string;
  isPrivate: boolean;
  suggestedRole: LoanCsvColumnRole;
};

export type LoanCsvReviewRow = {
  rowNumber: number;
  date: string | null;
  totalPaymentCents: number | null;
  principalCents: number | null;
  interestCents: number | null;
  feeCents: number | null;
  balanceAfterCents: number | null;
  warningCodes: Array<
    | "DATE_NEEDS_REVIEW"
    | "PAYMENT_NEEDS_REVIEW"
    | "COMPONENTS_EXCEED_PAYMENT"
    | "COMPONENTS_DO_NOT_MATCH_PAYMENT"
  >;
};

const privateHeaderRules = [
  /\bbsb\b/i,
  /\baccount\s*(?:number|no|name|id|reference)\b/i,
  /\b(?:card|credit card)\s*(?:number|no|fragment|ending|reference)\b/i,
  /\b(?:customer|client|member)\s*(?:number|no|id|reference)\b/i,
  /\bloan\s*(?:account)?\s*(?:number|no|id|reference)\b/i,
  /\b(?:lender|bank)\s*reference\b/i,
];

const roleRules: Array<{ role: LoanCsvColumnRole; patterns: RegExp[] }> = [
  { role: "DATE", patterns: [/^date$/i, /value\s*date/i, /payment\s*date/i, /transaction\s*date/i] },
  { role: "TOTAL_PAYMENT", patterns: [/^payment$/i, /^repayment$/i, /total\s*(?:payment|repayment)/i, /payment\s*amount/i, /repayment\s*amount/i] },
  { role: "PRINCIPAL", patterns: [/principal/i] },
  { role: "INTEREST", patterns: [/interest/i] },
  { role: "FEES", patterns: [/^fees?$/i, /charges?/i, /service\s*fee/i] },
  { role: "BALANCE_AFTER", patterns: [/^balance$/i, /running\s*balance/i, /closing\s*balance/i, /balance\s*after/i] },
];

function suggestedRole(header: string): LoanCsvColumnRole {
  return roleRules.find((rule) => rule.patterns.some((pattern) => pattern.test(header)))?.role ?? "IGNORE";
}

function isPrivateHeader(header: string) {
  return privateHeaderRules.some((pattern) => pattern.test(header)) || containsPrivateBankIdentifier(header);
}

function safeHeaderLabel(header: string, index: number, isPrivate: boolean) {
  if (isPrivate) return `Private column ${index + 1}`;
  return normalizeSafeText(header) || `Column ${index + 1}`;
}

export function assessLoanCsvColumns(document: TransientCsvDocument): LoanCsvColumn[] {
  return document.headers.map((header, index) => {
    const proposedRole = suggestedRole(header);
    const values = document.rows.slice(0, 25).map((row) => row[index]?.trim() ?? "").filter(Boolean);
    const privateValueRatio = values.length === 0
      ? 0
      : values.filter(containsPrivateBankIdentifier).length / values.length;
    const isPrivate = (document.hasHeader && isPrivateHeader(header)) ||
      (proposedRole === "IGNORE" && privateValueRatio >= 0.5);
    return {
      index,
      safeLabel: document.hasHeader ? safeHeaderLabel(header, index, isPrivate) : `Column ${index + 1}`,
      isPrivate,
      suggestedRole: isPrivate ? "PRIVATE" : proposedRole,
    };
  });
}

export function buildSuggestedLoanCsvMapping(columns: LoanCsvColumn[]): LoanCsvMapping {
  const mapping: LoanCsvMapping = Object.fromEntries(
    columns.map((column) => [column.index, column.isPrivate ? "PRIVATE" : "IGNORE"]),
  );

  const singularRoles: LoanCsvColumnRole[] = [
    "DATE",
    "TOTAL_PAYMENT",
    "PRINCIPAL",
    "INTEREST",
    "FEES",
    "BALANCE_AFTER",
  ];
  singularRoles.forEach((role) => {
    const candidate = columns.find((column) => !column.isPrivate && column.suggestedRole === role);
    if (candidate) mapping[candidate.index] = role;
  });
  return mapping;
}

export function validateLoanCsvMapping(mapping: LoanCsvMapping) {
  const roles = Object.values(mapping);
  const issues: string[] = [];
  const count = (role: LoanCsvColumnRole) => roles.filter((mappedRole) => mappedRole === role).length;

  if (count("DATE") === 0) issues.push("Choose a repayment date column.");
  if (count("DATE") > 1) issues.push("Choose only one repayment date column.");
  if (count("TOTAL_PAYMENT") === 0) issues.push("Choose a total payment column.");
  if (count("TOTAL_PAYMENT") > 1) issues.push("Choose only one total payment column.");
  for (const role of ["PRINCIPAL", "INTEREST", "FEES", "BALANCE_AFTER"] as const) {
    if (count(role) > 1) issues.push(`Choose only one ${role.toLocaleLowerCase("en-AU").replaceAll("_", " ")} column.`);
  }
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

export function buildLoanCsvReview(
  document: TransientCsvDocument,
  columns: LoanCsvColumn[],
  mapping: LoanCsvMapping,
) {
  const safeMapping = { ...mapping };
  columns.forEach((column) => {
    if (column.isPrivate) safeMapping[column.index] = "PRIVATE";
  });

  const mappingIssues = validateLoanCsvMapping(safeMapping);
  const rows = document.rows.map((row, index): LoanCsvReviewRow => {
    const warningCodes: LoanCsvReviewRow["warningCodes"] = [];
    const date = parseAustralianCsvDate(valueForRole(row, safeMapping, "DATE"));
    if (!date) warningCodes.push("DATE_NEEDS_REVIEW");

    const totalPaymentCents = safeMoney(valueForRole(row, safeMapping, "TOTAL_PAYMENT"));
    if (totalPaymentCents === null) warningCodes.push("PAYMENT_NEEDS_REVIEW");

    const principalCents = safeMoney(valueForRole(row, safeMapping, "PRINCIPAL"));
    const interestCents = safeMoney(valueForRole(row, safeMapping, "INTEREST"));
    const feeCents = safeMoney(valueForRole(row, safeMapping, "FEES"));
    const balanceAfterCents = safeMoney(valueForRole(row, safeMapping, "BALANCE_AFTER"));
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
      rowNumber: index + (document.hasHeader ? 2 : 1),
      date,
      totalPaymentCents,
      principalCents,
      interestCents,
      feeCents,
      balanceAfterCents,
      warningCodes,
    };
  });

  return { mapping: safeMapping, mappingIssues, rows };
}

export function scanLoanCsv(csvText: string) {
  const document = parseCsvDocument(csvText);
  const columns = assessLoanCsvColumns(document);
  const mapping = buildSuggestedLoanCsvMapping(columns);
  return { columns, ...buildLoanCsvReview(document, columns, mapping) };
}
