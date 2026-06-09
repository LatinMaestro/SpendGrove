const privateBankPatterns = [
  /\bBSB\s*[:#-]?\s*\d{3}[-\s]?\d{3}\b/i,
  /\b(?:account|acct|loan|customer|client|member)\s*(?:number|no|id)?\s*[:#-]?\s*\d{4,}\b/i,
  /\b(?:card)\s*(?:number|no)?\s*[:#-]?\s*(?:\d[\s-]?){8,}\b/i,
  /\b(?:xx|x{2,})\d{3,6}\b/i,
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
