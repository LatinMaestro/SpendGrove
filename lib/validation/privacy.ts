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
const safeDescriptionLimit = 120;

const merchantNarrationRules: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bpaypal\b/i, label: "PayPal" },
  { pattern: /\bdomino(?:'|’)?s\b/i, label: "Domino's" },
  { pattern: /\bwoolworths\b/i, label: "Woolworths" },
  { pattern: /\bcoles\b/i, label: "Coles" },
  { pattern: /\baldi\b/i, label: "Aldi" },
  { pattern: /\biga\b/i, label: "IGA" },
  { pattern: /\bbunnings\b/i, label: "Bunnings" },
  { pattern: /\buber\s+eats\b/i, label: "Uber Eats" },
  { pattern: /\buber\b/i, label: "Uber" },
  { pattern: /\btranslink\b|\bgo\s*card\b/i, label: "Translink" },
  { pattern: /\bampol\b/i, label: "Ampol" },
  { pattern: /\bcaltex\b/i, label: "Caltex" },
  { pattern: /\bshell\b/i, label: "Shell" },
  { pattern: /\bbp\b/i, label: "BP" },
  { pattern: /\bagl\b/i, label: "AGL" },
  { pattern: /\btelstra\b/i, label: "Telstra" },
  { pattern: /\boptus\b/i, label: "Optus" },
  { pattern: /\bvodafone\b/i, label: "Vodafone" },
];

const loanRepaymentPattern = /\bloan\b.*\b(?:repayment|payment)\b|\b(?:repayment|payment)\b.*\bloan\b/i;
const creditCardPaymentPattern = /\bcredit\s+card\b.*\b(?:repayment|payment)\b|\b(?:repayment|payment)\b.*\bcredit\s+card\b/i;
const atoRefundPattern = /\bato\b.*\b(?:refund|credit)\b|\b(?:refund|credit)\b.*\bato\b/i;
const transferNarrationPattern = /\b(?:osko|transfer|xfer|pay anyone|internet banking|bank transfer|account movement|between accounts)\b/i;
const internalTransferPattern = /\b(?:internal|account movement|between accounts|own account|to savings|from savings|savings transfer)\b/i;
const paymentNarrationPattern = /\b(?:payment|direct debit|bpay|eftpos|card purchase)\b/i;
const privateReferenceMarkerPattern = /\b(?:ref(?:erence)?|receipt|trace|terminal|transaction\s*id|payment\s*id|bank\s*reference)\b\s*[:#-]?\s*(?:[a-z0-9*-]{4,})?/gi;
const bankReferenceTokenPattern = /\b(?=[a-z0-9-]{8,}\b)(?=[a-z0-9-]*\d{4,})[a-z0-9-]+\b/gi;

function normalizeMetadataKey(key: string) {
  return key.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function titleCaseSafeWords(value: string) {
  return value
    .toLocaleLowerCase("en-AU")
    .replace(/\b[a-z]/g, (letter) => letter.toLocaleUpperCase("en-AU"));
}

function formatKnownMerchantNames(value: string) {
  return merchantNarrationRules.reduce(
    (current, rule) => current.replace(rule.pattern, rule.label),
    value,
  );
}

function cleanPrivateBankDescription(value: string) {
  return formatKnownMerchantNames(
    redactPrivateBankTokens(value)
      .replaceAll(safeReplacement, " ")
      .replace(privateReferenceMarkerPattern, " ")
      .replace(bankReferenceTokenPattern, " ")
      .replace(/\b(?:account|acct|card|customer|client|member|loan)\s*(?:number|no|id|ending)?\s*[:#-]?\s*$/gi, " ")
      .replace(/[|;]+/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function extractSafeDirection(value: string) {
  const match = /\b(to|from)\s+([a-z][a-z'’-]{1,30})\b/i.exec(value);
  if (!match) return null;
  return {
    direction: match[1].toLocaleLowerCase("en-AU"),
    party: titleCaseSafeWords(match[2]),
  };
}

function transferPurpose(value: string) {
  if (/\bgift\b/i.test(value)) return "Gift";
  if (/\brent\b/i.test(value)) return "Rent";
  if (loanRepaymentPattern.test(value)) return "Loan repayment";
  if (/\b(?:translink|public transport|go card)\b/i.test(value)) return "Public transport";
  return null;
}

function safeTransferName(value: string) {
  if (/^\s*(?:transfer|xfer)\s*$/i.test(value)) return "Transfer";
  const direction = extractSafeDirection(value);
  if (direction) {
    if (/\bosko\b/i.test(value)) return `OSKO payment ${direction.direction} ${direction.party}`;
    return `Bank transfer ${direction.direction} ${direction.party}`;
  }
  if (internalTransferPattern.test(value)) return "Internal transfer";
  return "Bank transfer";
}

function extractPaymentMerchant(value: string) {
  const candidate = value
    .replace(/^\s*(?:direct debit|bpay|eftpos|card purchase|payment)\b\s*(?:to\s+)?/i, "")
    .replace(/\b(?:direct debit|bpay|eftpos|card purchase)\b/gi, " ")
    .replace(/\b(?:payment|debit)\b\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!candidate || /^(?:payment|debit|credit|purchase)$/i.test(candidate)) return null;
  return titleCaseSafeWords(candidate.slice(0, 60));
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

export function sanitizeBankDescription(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const cleaned = cleanPrivateBankDescription(normalized);
  if (!cleaned || containsPrivateBankIdentifier(cleaned)) return "Payment";
  if (transferNarrationPattern.test(cleaned)) {
    const name = safeTransferName(cleaned);
    const purpose = transferPurpose(cleaned);
    return `${name}${purpose && !name.toLocaleLowerCase("en-AU").includes(purpose.toLocaleLowerCase("en-AU")) ? ` · ${purpose}` : ""}`.slice(0, safeDescriptionLimit);
  }
  return cleaned.slice(0, safeDescriptionLimit);
}

export function sanitizeTransactionNarration(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const merchantRule = merchantNarrationRules.find((rule) => rule.pattern.test(normalized));
  if (merchantRule) return merchantRule.label;
  if (loanRepaymentPattern.test(normalized)) return "Loan repayment";
  if (creditCardPaymentPattern.test(normalized)) return "Credit card payment";
  if (atoRefundPattern.test(normalized)) return "ATO refund";

  const safeDescription = sanitizeBankDescription(normalized);
  if (transferNarrationPattern.test(normalized)) return safeTransferName(safeDescription);
  if (paymentNarrationPattern.test(normalized)) return extractPaymentMerchant(safeDescription) ?? "Payment";
  return safeDescription || "Payment";
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
