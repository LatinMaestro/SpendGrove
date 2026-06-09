import { parseMoneyToCents } from "@/lib/validation/money";
import {
  containsPrivateBankIdentifier,
  normalizeSafeText,
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

export type CsvMapping = Record<number, CsvColumnRole>;

export type TransientCsvDocument = {
  headers: string[];
  rows: string[][];
  hasHeader: boolean;
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
  privacyReason?: string;
  suggestedRole: CsvColumnRole;
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
  warningCodes: string[];
};

type BankProfileDefinition = {
  id: string;
  bankName: string;
  displayName: string;
  requiredHeaders: string[];
  optionalHeaders: string[];
};

const bankProfiles: BankProfileDefinition[] = [
  {
    id: "commbank-everyday-v1",
    bankName: "Commonwealth Bank",
    displayName: "CommBank transaction CSV",
    requiredHeaders: ["date", "amount", "description"],
    optionalHeaders: ["balance", "account number"],
  },
  {
    id: "anz-everyday-v1",
    bankName: "ANZ",
    displayName: "ANZ transaction CSV",
    requiredHeaders: ["date", "amount", "details"],
    optionalHeaders: ["type", "balance"],
  },
  {
    id: "nab-everyday-v1",
    bankName: "NAB",
    displayName: "NAB transaction CSV",
    requiredHeaders: ["date", "amount", "transaction details"],
    optionalHeaders: ["balance"],
  },
  {
    id: "westpac-everyday-v1",
    bankName: "Westpac",
    displayName: "Westpac transaction CSV",
    requiredHeaders: ["date", "narrative", "debit amount", "credit amount"],
    optionalHeaders: ["balance"],
  },
];

const privateHeaderRules: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bbsb\b/i, reason: "BSB" },
  { pattern: /\baccount\s*(?:number|no|name|id)\b/i, reason: "Account identifier" },
  { pattern: /\b(?:card|credit card)\s*(?:number|no|fragment|ending)\b/i, reason: "Card identifier" },
  { pattern: /\b(?:customer|client|member)\s*(?:number|no|id)\b/i, reason: "Customer identifier" },
  { pattern: /\bloan\s*(?:account)?\s*(?:number|no|id)\b/i, reason: "Loan identifier" },
];

const headerRoleRules: Array<{ role: CsvColumnRole; patterns: RegExp[] }> = [
  { role: "DATE", patterns: [/^date$/i, /transaction\s*date/i, /posted\s*date/i] },
  { role: "AMOUNT", patterns: [/^amount$/i, /transaction\s*amount/i] },
  { role: "DEBIT", patterns: [/debit/i, /money\s*out/i, /withdrawal/i] },
  { role: "CREDIT", patterns: [/credit/i, /money\s*in/i, /deposit/i] },
  { role: "DESCRIPTION", patterns: [/description/i, /details/i, /narrative/i, /transaction\s*details/i, /particulars/i] },
  { role: "MERCHANT", patterns: [/merchant/i, /payee/i] },
];

const supportingHeaderPatterns = [/^balance$/i, /^reference$/i, /^type$/i, /^status$/i, /^category$/i];

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

export function hasConfidentCsvHeader(firstRecord: string[]) {
  const normalizedRecord = firstRecord.map((value) => value.trim());
  const dataLikeCount = normalizedRecord.filter((value) =>
    Boolean(parseAustralianCsvDate(value)) || isMoneyLike(value),
  ).length;
  const recognizedHeaderCount = normalizedRecord.filter(isRecognizedHeader).length;

  if (dataLikeCount >= 2) return false;
  if (recognizedHeaderCount >= 2) return true;
  return recognizedHeaderCount >= 1 && dataLikeCount === 0;
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

  const hasHeader = hasConfidentCsvHeader(records[0]);
  if (hasHeader && records.length < 2) {
    throw new Error("The CSV needs at least one data row after its header.");
  }

  const columnCount = Math.max(...records.map((record) => record.length));
  if (columnCount < 2) throw new Error("The CSV needs at least two columns.");

  const sourceRows = hasHeader ? records.slice(1) : records;
  if (sourceRows.length > MAX_CSV_ROWS) {
    throw new Error(`This Phase 1 foundation supports up to ${MAX_CSV_ROWS.toLocaleString("en-AU")} rows per file.`);
  }

  const headers = hasHeader
    ? Array.from({ length: columnCount }, (_, index) => records[0][index]?.trim() || `Column ${index + 1}`)
    : Array.from({ length: columnCount }, (_, index) => `Column ${index + 1}`);
  const rows = sourceRows.map((row) =>
    Array.from({ length: columnCount }, (_, index) => row[index]?.trim() ?? ""),
  );

  return { headers, rows, hasHeader };
}

export function detectCsvProfile(headers: string[]): CsvProfileDetection {
  const normalizedHeaders = headers.map(normalizeHeader);
  const ranked = bankProfiles
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
      displayName: "Manual mapping required",
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

export function assessCsvColumns(document: TransientCsvDocument) {
  return document.headers.map((header, index): CsvColumnAssessment => {
    const headerReason = document.hasHeader ? findPrivateHeaderReason(header) : undefined;
    const hasPrivateValue = document.rows.slice(0, 25).some((row) =>
      row[index] ? containsPrivateBankIdentifier(row[index]) : false,
    );
    const privacyReason = headerReason ?? (hasPrivateValue ? "Private identifier pattern" : undefined);
    const isPrivate = Boolean(privacyReason);

    return {
      index,
      safeLabel: document.hasHeader
        ? safeHeaderLabel(header, index, isPrivate)
        : `Column ${index + 1}`,
      isPrivate,
      privacyReason,
      suggestedRole: isPrivate ? "PRIVATE" : document.hasHeader ? suggestColumnRole(header) : "IGNORE",
    };
  });
}

export function buildSuggestedCsvMapping(columns: CsvColumnAssessment[]): CsvMapping {
  return Object.fromEntries(columns.map((column) => [column.index, column.suggestedRole]));
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

function validateMapping(mapping: CsvMapping) {
  const roles = Object.values(mapping);
  const issues: string[] = [];
  if (!roles.includes("DATE")) issues.push("Choose a date column.");
  if (!roles.includes("AMOUNT") && !roles.includes("DEBIT") && !roles.includes("CREDIT")) {
    issues.push("Choose an amount column, or debit/credit columns.");
  }
  if (!roles.includes("DESCRIPTION") && !roles.includes("MERCHANT")) {
    issues.push("Choose a description or merchant column.");
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

  const mappingIssues = validateMapping(safeMapping);
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

    const description = normalizeSafeText(firstValueForRole(row, safeMapping, "DESCRIPTION"));
    const merchantName = normalizeSafeText(firstValueForRole(row, safeMapping, "MERCHANT"));
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

export function scanCsvDocument(document: TransientCsvDocument, mapping?: CsvMapping): CsvScanResult {
  const profile = document.hasHeader
    ? detectCsvProfile(document.headers)
    : {
        profileId: null,
        bankName: "Headerless or custom CSV",
        displayName: "Manual mapping required",
        confidence: 0,
        requiresManualMapping: true,
      };
  const columns = assessCsvColumns(document);
  const suggestedMapping = mapping ?? buildSuggestedCsvMapping(columns);
  const sanitized = buildSanitizedCsvPreview(document, columns, suggestedMapping);
  const warningCodes = [
    ...(!document.hasHeader ? ["HEADER_NOT_DETECTED"] : []),
    ...(profile.requiresManualMapping ? ["MANUAL_MAPPING_REQUIRED"] : []),
    ...(sanitized.mappingIssues.length > 0 ? ["MAPPING_INCOMPLETE"] : []),
    ...(sanitized.previewRows.some((row) => row.warningCodes.length > 0) ? ["ROWS_NEED_REVIEW"] : []),
  ];

  return {
    hasHeader: document.hasHeader,
    profile,
    columns,
    mapping: sanitized.mapping,
    privateColumnCount: columns.filter((column) => column.isPrivate).length,
    parsedRowCount: document.rows.length,
    previewRows: sanitized.previewRows,
    mappingIssues: sanitized.mappingIssues,
    warningCodes,
  };
}

export function getSafeSelectedCsvLabel(_originalFileName?: string) {
  return SAFE_SELECTED_CSV_LABEL;
}
