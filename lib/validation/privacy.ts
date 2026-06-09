const privateBankPatterns = [
  /\bBSB\s*[:#-]?\s*\d{3}[-\s]?\d{3}\b/i,
  /\b\d{3}-\d{3}\b/,
  /\b(?:account|acct|loan|customer|client|member)\s*(?:number|no|id)?\s*[:#-]?\s*\d{4,}\b/i,
  /\b(?:card)\s*(?:number|no)?\s*[:#-]?\s*(?:\d[\s-]?){8,}\b/i,
  /\b(?:xx|x{2,}|\*{2,})\d{3,6}\b/i,
  /\b\d{7,}\b/,
];

const rawPayloadKeys = new Set([
  "rawcsv",
  "rawrow",
  "rawrows",
  "csvcontent",
  "csvrows",
  "filecontents",
  "originalrow",
]);

const forbiddenAuditKeys = new Set([
  ...rawPayloadKeys,
  "bsb",
  "accountnumber",
  "accountname",
  "cardnumber",
  "customerid",
  "loanaccountnumber",
  "originaldescription",
  "transactiondescription",
]);

const safeReplacement = "[private field removed]";

const merchantNarrationRules: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bwoolworths\b/i, label: "Woolworths" },
  { pattern: /\bcoles\b/i, label: "Coles" },
  { pattern: /\baldi\b/i, label: "Aldi" },
  { pattern: /\biga\b/i, label: "IGA" },
];

const loanRepaymentPattern = /\bloan\b.*\b(?:repayment|payment)\b|\b(?:repayment|payment)\b.*\bloan\b/i;
const transferNarrationPattern = /\b(?:osko|transfer|xfer|pay anyone|internet banking|bank transfer)\b/i;
const paymentNarrationPattern = /\b(?:payment|direct debit|eftpos|card purchase)\b/i;

function normalizeMetadataKey(key: string) {
  return key.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export function containsPrivateBankIdentifier(value: string) {
  return privateBankPatterns.some((pattern) => pattern.test(value));
}

export function redactPrivateBankTokens(value: string) {
  return privateBankPatterns.reduce((current, pattern) => current.replace(pattern, safeReplacement), value);
}

export function assertNoPrivateBankIdentifiers(value: string, fieldName: string) {
  if (containsPrivateBankIdentifier(value)) {
    throw new Error(`${fieldName} contains a private bank identifier and must be redacted before storage.`);
  }
}

export function normalizeSafeText(value: string) {
  return redactPrivateBankTokens(value).replace(/\s+/g, " ").trim();
}

export function sanitizeTransactionNarration(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const merchantRule = merchantNarrationRules.find((rule) => rule.pattern.test(normalized));
  if (merchantRule) return merchantRule.label;
  if (loanRepaymentPattern.test(normalized)) return "Loan repayment";
  if (transferNarrationPattern.test(normalized)) return "Bank transfer";
  if (paymentNarrationPattern.test(normalized)) return "Payment";

  const sanitized = normalizeSafeText(normalized)
    .replaceAll(safeReplacement, " ")
    .replace(/\b(?:ref(?:erence)?|receipt|trace|terminal|card|account|acct)\b\s*[:#-]?\s*[^,;|]*/gi, " ")
    .replace(/[|;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized && !containsPrivateBankIdentifier(sanitized) ? sanitized : "Payment";
}

function inspectSafeJson(input: unknown, path: string, forbiddenKeys: Set<string>): void {
  if (input === null || typeof input === "boolean") return;

  if (typeof input === "number") {
    if (!Number.isFinite(input)) throw new Error(`${path} must contain only finite JSON numbers.`);
    return;
  }

  if (typeof input === "string") {
    assertNoPrivateBankIdentifiers(input, path);
    return;
  }

  if (Array.isArray(input)) {
    input.forEach((item, index) => inspectSafeJson(item, `${path}[${index}]`, forbiddenKeys));
    return;
  }

  if (input && typeof input === "object") {
    Object.entries(input as Record<string, unknown>).forEach(([key, nestedValue]) => {
      const normalizedKey = normalizeMetadataKey(key);
      if (forbiddenKeys.has(normalizedKey)) {
        throw new Error(`${path}.${key} is not permitted in stored metadata.`);
      }
      inspectSafeJson(nestedValue, `${path}.${key}`, forbiddenKeys);
    });
    return;
  }

  throw new Error(`${path} must contain JSON-safe metadata only.`);
}

export function assertSafeJson(value: unknown, fieldName = "metadata") {
  inspectSafeJson(value, fieldName, rawPayloadKeys);
  return value;
}

export function assertSafeAuditMetadata(value: unknown) {
  inspectSafeJson(value, "audit.metadata", forbiddenAuditKeys);
  return value;
}
