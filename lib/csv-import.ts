import { parseMoneyToCents } from "@/lib/validation/money";
import { confirmedEverydayCsvProfiles } from "@/lib/csv-bank-profiles";
import {
  containsPrivateBankIdentifier,
  normalizeSafeText,
  sanitizeBankDescription,
  sanitizeTransactionNarration,
} from "@/lib/validation/privacy";

export const MAX_CSV_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_CSV_ROWS = 5000;
export const CSV_PREVIEW_ROW_LIMIT = 8;
export const SAFE_SELECTED_CSV_LABEL = "Selected CSV file";

export type CsvColumnRole =
  | "DATE"
  | "AMOUNT"
  | "DEBIT"
  | "CREDIT"
  | "DESCRIPTION"
  | "MERCHANT"
  | "IGNORE"
  | "PRIVATE";

export type CsvDateFormat =
  | "YYYY-MM-DD"
  | "DD/MM/YYYY"
  | "DD-MM-YYYY"
  | "DD/MM/YY"
  | "DD-MM-YY";

export type CsvAmountMode = "SIGNED_AMOUNT" | "DEBIT_CREDIT";

export type CsvWarningCode =
  | "HEADER_NOT_DETECTED"
  | "HEADER_CONFIDENCE_LOW"
  | "MANUAL_MAPPING_REQUIRED"
  | "MAPPING_INCOMPLETE"
  | "INCONSISTENT_COLUMN_COUNT"
  | "PRIVATE_COLUMNS_EXCLUDED"
  | "STRUCTURE_NOT_RECOGNIZED"
  | "ROWS_NEED_REVIEW";

export type CsvMapping = Record<number, CsvColumnRole>;

export type TransientCsvDocument = {
  headers: string[];
  rows: string[][];
  hasHeader: boolean;
  headerConfidence: number;
  structuralWarningCodes: CsvWarningCode[];
};

export type CsvProfileDetection = {
  profileId: string | null;
  bankName: string;
  displayName: string;
  confidence: number;
  requiresManualMapping: boolean;
};

export type CsvColumnAssessment = {
  index: number;
  safeLabel: string;
  isPrivate: boolean;
  isNarrative: boolean;
  privacyReason?: string;
  suggestedRole: CsvColumnRole;
  roleSource: "HEADER" | "VALUES" | "NONE";
  roleConfidence: number;
};

export type SanitizedCsvPreviewRow = {
  rowNumber: number;
  date: string | null;
  amountCents: number | null;
  description: string;
  merchantName: string;
  warningCodes: string[];
};

export type CsvScanResult = {
  hasHeader: boolean;
  profile: CsvProfileDetection;
  columns: CsvColumnAssessment[];
  mapping: CsvMapping;
  privateColumnCount: number;
  parsedRowCount: number;
  previewRows: SanitizedCsvPreviewRow[];
  mappingIssues: string[];
  warningCodes: CsvWarningCode[];
  detectedDateFormats: CsvDateFormat[];
  amountMode: CsvAmountMode;
};

const privateHeaderRules: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bbsb\b/i, reason: "BSB" },
  { pattern: /\baccount\s*(?:number|no|name|id)\b/i, reason: "Account identifier" },
  { pattern: /\b(?:card|credit card)\s*(?:number|no|fragment|ending)\b/i, reason: "Card identifier" },
  { pattern: /\b(?:customer|client|member)\s*(?:number|no|id)\b/i, reason: "Customer identifier" },
  { pattern: /\bloan\s*(?:account)?\s*(?:number|no|id|reference)\b/i, reason: "Loan identifier" },
];

const headerRoleRules: Array<{ role: CsvColumnRole; patterns: RegExp[] }> = [
  { role: "DATE", patterns: [/^date$/i, /transaction\s*date/i, /posted\s*date/i] },
  { role: "AMOUNT", patterns: [/^amount$/i, /transaction\s*amount/i, /^value$/i] },
  { role: "DEBIT", patterns: [/debit/i, /money\s*out/i, /withdrawal/i] },
  { role: "CREDIT", patterns: [/credit/i, /money\s*in/i, /deposit/i] },
  { role: "DESCRIPTION", patterns: [/description/i, /details/i, /narrative/i, /transaction\s*details/i, /particulars/i, /memo/i, /what\s*happened/i] },
  { role: "MERCHANT", patterns: [/merchant/i, /payee/i] },
];

const supportingHeaderPatterns = [/^balance$/i, /running\s*balance/i, /^reference$/i, /^type$/i, /^status$/i, /^category$/i];

const warningMessages: Record<CsvWarningCode, string> = {
  HEADER_NOT_DETECTED: "No confident header row was found, so the first line remains a transaction and generic column labels are used.",
  HEADER_CONFIDENCE_LOW: "The header layout is unusual. Check the suggested column matches before continuing.",
  MANUAL_MAPPING_REQUIRED: "This bank layout is not a confirmed profile yet. Check the suggested column matches.",
  MAPPING_INCOMPLETE: "Match the required date, amount and description columns before continuing.",
  INCONSISTENT_COLUMN_COUNT: "Some lines contain a different number of columns. Those transactions need an extra check.",
  PRIVATE_COLUMNS_EXCLUDED: "Private account-detail columns were found and excluded from mapping and preview.",
  STRUCTURE_NOT_RECOGNIZED: "The file structure could not be identified confidently. Manual column matching is required.",
  ROWS_NEED_REVIEW: "One or more transaction examples contain a date, amount or description that needs review.",
};

function uniqueValues<T>(values: T[]) {
  return Array.from(new Set(values));
}

function normalizeHeader(value: string) {
  return normalizeSafeText(value).toLocaleLowerCase("en-AU");
}

function safeHeaderLabel(value: string, index: number, isPrivate: boolean) {
  if (isPrivate && containsPrivateBankIdentifier(value)) return `Private column ${index + 1}`;
  const normalized = normalizeSafeText(value);
  return normalized || `Column ${index + 1}`;
}

function findPrivateHeaderReason(header: string) {
  return privateHeaderRules.find((rule) => rule.pattern.test(header))?.reason;
}

function suggestColumnRole(header: string) {
  for (const rule of headerRoleRules) {
    if (rule.patterns.some((pattern) => pattern.test(header))) return rule.role;
  }
  return "IGNORE";
}

function isMoneyLike(value: string) {
  try {
    parseMoneyToCents(value);
    return true;
  } catch {
    return false;
  }
}

function isRecognizedHeader(value: string) {
  return Boolean(findPrivateHeaderReason(value)) ||
    suggestColumnRole(value) !== "IGNORE" ||
    supportingHeaderPatterns.some((pattern) => pattern.test(value));
}

function countDataLikeValues(record: string[]) {
  return record.filter((value) => Boolean(parseAustralianCsvDate(value)) || isMoneyLike(value)).length;
}

export function detectCsvHeader(records: string[][]): CsvHeaderDetection {
  const firstRecord = records[0]?.map((value) => value.trim()) ?? [];
  const secondRecord = records[1]?.map((value) => value.trim()) ?? [];
  const firstDataLikeCount = countDataLikeValues(firstRecord);
  const secondDataLikeCount = countDataLikeValues(secondRecord);
  const recognizedHeaderCount = firstRecord.filter(isRecognizedHeader).length;
  const firstTextCount = firstRecord.filter((value) => /[a-z]/i.test(value)).length;

  if (firstDataLikeCount >= 2) return { hasHeader: false, confidence: 95 };
  if (recognizedHeaderCount >= 2) return { hasHeader: true, confidence: 95 };
  if (secondDataLikeCount >= 2 && firstDataLikeCount === 0 && firstTextCount >= 2) {
    return { hasHeader: true, confidence: recognizedHeaderCount > 0 ? 80 : 70 };
  }
  if (recognizedHeaderCount === 1 && firstDataLikeCount === 0) {
    return { hasHeader: true, confidence: 65 };
  }
  return { hasHeader: false, confidence: 45 };
}

export function hasConfidentCsvHeader(firstRecord: string[]) {
  return detectCsvHeader([firstRecord]).hasHeader;
}

function parseCsvRecords(csvText: string) {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"') {
      if (quoted && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === "," && !quoted) {
      record.push(field);
      field = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      record.push(field);
      if (record.some((value) => value.trim().length > 0)) records.push(record);
      record = [];
      field = "";
      continue;
    }

    field += character;
  }

  if (quoted) throw new Error("The CSV contains an unclosed quoted field.");
  record.push(field);
  if (record.some((value) => value.trim().length > 0)) records.push(record);
  return records;
}

export function parseCsvDocument(csvText: string): TransientCsvDocument {
  const normalizedText = csvText.replace(/^\uFEFF/, "");
  if (!normalizedText.trim()) throw new Error("The selected CSV is empty.");

  const records = parseCsvRecords(normalizedText);
  if (records.length === 0) throw new Error("The selected CSV is empty.");

  const headerDetection = detectCsvHeader(records);
  if (headerDetection.hasHeader && records.length < 2) {
    throw new Error("The CSV needs at least one data row after its header.");
  }

  const columnCounts = records.map((record) => record.length);
  const columnCount = Math.max(...columnCounts);
  if (columnCount < 2) throw new Error("The CSV needs at least two columns.");

  const sourceRows = headerDetection.hasHeader ? records.slice(1) : records;
  if (sourceRows.length > MAX_CSV_ROWS) {
    throw new Error(`This import supports up to ${MAX_CSV_ROWS.toLocaleString("en-AU")} rows per file.`);
  }

  const structuralWarningCodes: CsvWarningCode[] = [];
  if (headerDetection.confidence < 70) structuralWarningCodes.push("HEADER_CONFIDENCE_LOW");
  if (columnCounts.some((count) => count !== columnCount)) structuralWarningCodes.push("INCONSISTENT_COLUMN_COUNT");

  const headers = headerDetection.hasHeader
    ? Array.from({ length: columnCount }, (_, index) => records[0][index]?.trim() || `Column ${index + 1}`)
    : Array.from({ length: columnCount }, (_, index) => `Column ${index + 1}`);
  const rows = sourceRows.map((row) =>
    Array.from({ length: columnCount }, (_, index) => row[index]?.trim() ?? ""),
  );

  return {
    headers,
    rows,
    hasHeader: headerDetection.hasHeader,
    headerConfidence: headerDetection.confidence,
    structuralWarningCodes,
  };
}

export function detectCsvProfile(headers: string[]): CsvProfileDetection {
  const normalizedHeaders = headers.map(normalizeHeader);
  const ranked = confirmedEverydayCsvProfiles
    .map((profile) => {
      const requiredMatches = profile.requiredHeaders.filter((required) => normalizedHeaders.includes(required)).length;
      const optionalMatches = profile.optionalHeaders.filter((optional) => normalizedHeaders.includes(optional)).length;
      const requiredScore = requiredMatches / profile.requiredHeaders.length;
      const confidence = Math.round(requiredScore * 85 + Math.min(optionalMatches, 3) * 5);
      return { profile, confidence };
    })
    .sort((left, right) => right.confidence - left.confidence);

  const best = ranked[0];
  if (!best || best.confidence < 50) {
    return {
      profileId: null,
      bankName: "Unknown bank or custom CSV",
      displayName: "Check column matches",
      confidence: best?.confidence ?? 0,
      requiresManualMapping: true,
    };
  }

  return {
    profileId: best.profile.id,
    bankName: best.profile.bankName,
    displayName: best.profile.displayName,
    confidence: best.confidence,
    requiresManualMapping: best.confidence < 80,
  };
}

function inferColumnRole(values: string[]) {
  const nonEmptyValues = values.filter((value) => value.trim().length > 0);
  if (nonEmptyValues.length === 0) return { role: "IGNORE" as CsvColumnRole, confidence: 0 };

  const dateRatio = nonEmptyValues.filter((value) => Boolean(parseAustralianCsvDate(value))).length / nonEmptyValues.length;
  if (dateRatio >= 0.7) return { role: "DATE" as CsvColumnRole, confidence: Math.round(dateRatio * 85) };

  const moneyValues = nonEmptyValues.filter(isMoneyLike);
  const moneyRatio = moneyValues.length / nonEmptyValues.length;
  if (moneyRatio >= 0.7) {
    const hasNegative = moneyValues.some((value) => value.trim().startsWith("-"));
    const hasPositive = moneyValues.some((value) => !value.trim().startsWith("-"));
    const confidence = Math.min(95, Math.round(moneyRatio * 70) + (hasNegative ? 15 : 0) + (hasNegative && hasPositive ? 10 : 0));
    return { role: "AMOUNT" as CsvColumnRole, confidence };
  }

  const narrativeRatio = nonEmptyValues.filter((value) => /[a-z]/i.test(value)).length / nonEmptyValues.length;
  if (narrativeRatio >= 0.5) {
    return { role: "DESCRIPTION" as CsvColumnRole, confidence: Math.round(narrativeRatio * 75) };
  }

  return { role: "IGNORE" as CsvColumnRole, confidence: 0 };
}

function isLikelyNarrativeColumn(values: string[]) {
  const nonEmptyValues = values.filter((value) => value.trim().length > 0);
  if (nonEmptyValues.length === 0) return false;

  const narrativeValues = nonEmptyValues.filter((value) =>
    /[a-z]/i.test(value) && !parseAustralianCsvDate(value) && !isMoneyLike(value),
  );
  return narrativeValues.length / nonEmptyValues.length >= 0.5;
}

function isPrivateIdentifierOnlyColumn(values: string[], isNarrative: boolean) {
  if (isNarrative) return false;
  const nonEmptyValues = values.filter((value) => value.trim().length > 0);
  if (nonEmptyValues.length === 0) return false;
  const privateValueCount = nonEmptyValues.filter(containsPrivateBankIdentifier).length;
  return privateValueCount > 0 && privateValueCount / nonEmptyValues.length >= 0.5;
}

export function assessCsvColumns(document: TransientCsvDocument) {
  return document.headers.map((header, index): CsvColumnAssessment => {
    const values = document.rows.slice(0, 25).map((row) => row[index] ?? "");
    const headerRole = document.hasHeader ? suggestColumnRole(header) : "IGNORE";
    const isSupportingHeader = document.hasHeader && supportingHeaderPatterns.some((pattern) => pattern.test(header));
    const inferredRole = headerRole === "IGNORE" && !isSupportingHeader
      ? inferColumnRole(values)
      : { role: "IGNORE" as CsvColumnRole, confidence: 0 };
    const proposedRole = headerRole !== "IGNORE" ? headerRole : inferredRole.role;
    const isNarrative = proposedRole === "DESCRIPTION" || proposedRole === "MERCHANT" || isLikelyNarrativeColumn(values);
    const headerReason = document.hasHeader ? findPrivateHeaderReason(header) : undefined;
    const privateValueReason = isPrivateIdentifierOnlyColumn(values, isNarrative)
      ? "Private identifier-only column"
      : undefined;
    const privacyReason = headerReason ?? privateValueReason;
    const isPrivate = Boolean(privacyReason);

    return {
      index,
      safeLabel: document.hasHeader
        ? safeHeaderLabel(header, index, isPrivate)
        : `Column ${index + 1}`,
      isPrivate,
      isNarrative,
      privacyReason,
      suggestedRole: isPrivate ? "PRIVATE" : proposedRole,
      roleSource: isPrivate || proposedRole === "IGNORE"
        ? "NONE"
        : headerRole !== "IGNORE" ? "HEADER" : "VALUES",
      roleConfidence: isPrivate || proposedRole === "IGNORE"
        ? 0
        : headerRole !== "IGNORE" ? 100 : inferredRole.confidence,
    };
  });
}

export function buildSuggestedCsvMapping(columns: CsvColumnAssessment[]): CsvMapping {
  const mapping: CsvMapping = Object.fromEntries(columns.map((column) => [
    column.index,
    column.isPrivate ? "PRIVATE" : "IGNORE",
  ]));

  columns
    .filter((column) => !column.isPrivate && (column.suggestedRole === "DEBIT" || column.suggestedRole === "CREDIT"))
    .forEach((column) => {
      mapping[column.index] = column.suggestedRole;
    });

  const hasSplitAmounts = Object.values(mapping).includes("DEBIT") || Object.values(mapping).includes("CREDIT");
  const singularRoles: CsvColumnRole[] = ["DATE", "DESCRIPTION", "MERCHANT", ...(hasSplitAmounts ? [] : ["AMOUNT" as CsvColumnRole])];
  singularRoles.forEach((role) => {
    const candidate = columns
      .filter((column) => !column.isPrivate && column.suggestedRole === role)
      .sort((left, right) => right.roleConfidence - left.roleConfidence || left.index - right.index)[0];
    if (candidate) mapping[candidate.index] = role;
  });

  return mapping;
}

export function parseAustralianCsvDate(value: string) {
  const trimmed = value.trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  const australianMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/.exec(trimmed);
  const parts = isoMatch
    ? { year: Number(isoMatch[1]), month: Number(isoMatch[2]), day: Number(isoMatch[3]) }
    : australianMatch
      ? {
          year: Number(australianMatch[3].length === 2 ? `20${australianMatch[3]}` : australianMatch[3]),
          month: Number(australianMatch[2]),
          day: Number(australianMatch[1]),
        }
      : null;

  if (!parts) return null;
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  if (
    date.getUTCFullYear() !== parts.year ||
    date.getUTCMonth() !== parts.month - 1 ||
    date.getUTCDate() !== parts.day
  ) return null;

  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function detectDateFormat(value: string): CsvDateFormat | null {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return "YYYY-MM-DD";
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) return "DD/MM/YYYY";
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) return "DD-MM-YYYY";
  if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(trimmed)) return "DD/MM/YY";
  if (/^\d{1,2}-\d{1,2}-\d{2}$/.test(trimmed)) return "DD-MM-YY";
  return null;
}

function firstValueForRole(row: string[], mapping: CsvMapping, role: CsvColumnRole) {
  const columnIndex = Object.entries(mapping).find(([, mappedRole]) => mappedRole === role)?.[0];
  return columnIndex === undefined ? "" : row[Number(columnIndex)] ?? "";
}

function parseMappedAmount(row: string[], mapping: CsvMapping) {
  const amount = firstValueForRole(row, mapping, "AMOUNT");
  if (amount) return parseMoneyToCents(amount);

  const debit = firstValueForRole(row, mapping, "DEBIT");
  const credit = firstValueForRole(row, mapping, "CREDIT");
  if (debit && credit) throw new Error("Both debit and credit contain values.");
  if (debit) return -Math.abs(parseMoneyToCents(debit));
  if (credit) return Math.abs(parseMoneyToCents(credit));
  throw new Error("No amount value is mapped.");
}

export function validateCsvMapping(mapping: CsvMapping) {
  const roles = Object.values(mapping);
  const issues: string[] = [];
  const count = (role: CsvColumnRole) => roles.filter((mappedRole) => mappedRole === role).length;

  if (count("DATE") === 0) issues.push("Choose a date column.");
  if (count("DATE") > 1) issues.push("Choose only one date column.");

  const hasAmount = count("AMOUNT") > 0;
  const hasDebit = count("DEBIT") > 0;
  const hasCredit = count("CREDIT") > 0;
  if (!hasAmount && !hasDebit && !hasCredit) {
    issues.push("Choose a transaction amount column, or both money-out and money-in columns.");
  }
  if (count("AMOUNT") > 1) issues.push("Choose only one transaction amount column.");
  if (hasAmount && (hasDebit || hasCredit)) {
    issues.push("Use either one transaction amount column or separate money-out and money-in columns.");
  }
  if (!hasAmount && hasDebit !== hasCredit) {
    issues.push("Choose both money-out and money-in columns for a split amount file.");
  }
  if (count("DEBIT") > 1 || count("CREDIT") > 1) {
    issues.push("Choose only one money-out column and one money-in column.");
  }

  if (count("DESCRIPTION") === 0 && count("MERCHANT") === 0) {
    issues.push("Choose a description or merchant column.");
  }
  if (count("DESCRIPTION") > 1 || count("MERCHANT") > 1) {
    issues.push("Choose only one description column and one merchant column.");
  }
  return issues;
}

export function buildSanitizedCsvPreview(
  document: TransientCsvDocument,
  columns: CsvColumnAssessment[],
  mapping: CsvMapping,
) {
  const safeMapping = { ...mapping };
  columns.forEach((column) => {
    if (column.isPrivate) safeMapping[column.index] = "PRIVATE";
  });

  const mappingIssues = validateCsvMapping(safeMapping);
  const previewRows = document.rows.slice(0, CSV_PREVIEW_ROW_LIMIT).map((row, index): SanitizedCsvPreviewRow => {
    const warningCodes: string[] = [];
    const rawDate = firstValueForRole(row, safeMapping, "DATE");
    const date = rawDate ? parseAustralianCsvDate(rawDate) : null;
    if (!date) warningCodes.push("DATE_NEEDS_MAPPING");

    let amountCents: number | null = null;
    try {
      amountCents = parseMappedAmount(row, safeMapping);
    } catch {
      warningCodes.push("AMOUNT_NEEDS_MAPPING");
    }

    const rawDescription = firstValueForRole(row, safeMapping, "DESCRIPTION");
    const rawMerchant = firstValueForRole(row, safeMapping, "MERCHANT");
    const description = sanitizeBankDescription(rawDescription || rawMerchant);
    const merchantName = sanitizeTransactionNarration(rawMerchant || rawDescription);
    if (!description && !merchantName) warningCodes.push("DESCRIPTION_NEEDS_MAPPING");

    return {
      rowNumber: index + (document.hasHeader ? 2 : 1),
      date,
      amountCents,
      description,
      merchantName,
      warningCodes,
    };
  });

  return { mapping: safeMapping, mappingIssues, previewRows };
}

function collectDetectedDateFormats(document: TransientCsvDocument, mapping: CsvMapping) {
  const formats = document.rows
    .slice(0, 25)
    .map((row) => detectDateFormat(firstValueForRole(row, mapping, "DATE")))
    .filter((format): format is CsvDateFormat => Boolean(format));
  return uniqueValues(formats);
}

function createGenericProfile(document: TransientCsvDocument, columns: CsvColumnAssessment[], mappingIssues: string[]): CsvProfileDetection {
  const mappedColumns = columns.filter((column) => column.roleConfidence > 0);
  const averageConfidence = mappedColumns.length === 0
    ? 0
    : Math.round(mappedColumns.reduce((total, column) => total + column.roleConfidence, 0) / mappedColumns.length);
  const confidence = Math.min(79, Math.max(40, Math.round((averageConfidence + document.headerConfidence) / 2)));

  return {
    profileId: mappingIssues.length === 0 ? "generic-transaction-v1" : null,
    bankName: document.hasHeader ? "Generic or custom CSV" : "Headerless or custom CSV",
    displayName: mappingIssues.length === 0 ? "Suggested generic mapping" : "Manual mapping required",
    confidence,
    requiresManualMapping: true,
  };
}

export function scanCsvDocument(document: TransientCsvDocument, mapping?: CsvMapping): CsvScanResult {
  const columns = assessCsvColumns(document);
  const suggestedMapping = mapping ?? buildSuggestedCsvMapping(columns);
  const sanitized = buildSanitizedCsvPreview(document, columns, suggestedMapping);
  const detectedProfile = document.hasHeader ? detectCsvProfile(document.headers) : null;
  const profile = detectedProfile?.profileId && !detectedProfile.requiresManualMapping
    ? detectedProfile
    : createGenericProfile(document, columns, sanitized.mappingIssues);
  const privateColumnCount = columns.filter((column) => column.isPrivate).length;
  const recognizedCoreRoles = new Set(Object.values(sanitized.mapping).filter((role) => role !== "IGNORE" && role !== "PRIVATE"));
  const structureNotRecognized = sanitized.mappingIssues.length >= 2 || recognizedCoreRoles.size < 2;
  const warningCodes = uniqueValues<CsvWarningCode>([
    ...document.structuralWarningCodes,
    ...(!document.hasHeader ? ["HEADER_NOT_DETECTED" as CsvWarningCode] : []),
    ...(privateColumnCount > 0 ? ["PRIVATE_COLUMNS_EXCLUDED" as CsvWarningCode] : []),
    ...(profile.requiresManualMapping ? ["MANUAL_MAPPING_REQUIRED" as CsvWarningCode] : []),
    ...(sanitized.mappingIssues.length > 0 ? ["MAPPING_INCOMPLETE" as CsvWarningCode] : []),
    ...(structureNotRecognized ? ["STRUCTURE_NOT_RECOGNIZED" as CsvWarningCode] : []),
    ...(sanitized.previewRows.some((row) => row.warningCodes.length > 0) ? ["ROWS_NEED_REVIEW" as CsvWarningCode] : []),
  ]);
  const amountMode: CsvAmountMode = Object.values(sanitized.mapping).includes("AMOUNT")
    ? "SIGNED_AMOUNT"
    : "DEBIT_CREDIT";

  return {
    hasHeader: document.hasHeader,
    profile,
    columns,
    mapping: sanitized.mapping,
    privateColumnCount,
    parsedRowCount: document.rows.length,
    previewRows: sanitized.previewRows,
    mappingIssues: sanitized.mappingIssues,
    warningCodes,
    detectedDateFormats: collectDetectedDateFormats(document, sanitized.mapping),
    amountMode,
  };
}

export function getCsvWarningMessages(warningCodes: CsvWarningCode[]) {
  return uniqueValues(warningCodes).map((code) => warningMessages[code]);
}

export function getSafeSelectedCsvLabel(_originalFileName?: string) {
  return SAFE_SELECTED_CSV_LABEL;
}
