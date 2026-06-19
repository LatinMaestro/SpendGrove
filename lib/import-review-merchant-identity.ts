import { sanitizeTransactionNarration } from "@/lib/validation/privacy";

const genericMerchantKeys = new Set([
  "bank transfer", "transfer", "payment", "deposit", "cba", "commonwealth bank",
]);
const referenceMarkerPattern = /\b(?:ref(?:erence)?|invoice|inv|receipt|transaction|txn|payment id|member|policy|account)\s*[:#-]?\s*[a-z0-9-]{4,}\b/gi;
const referenceTokenPattern = /^(?=.{5,}$)(?:\d{4,}|(?=[a-z0-9-]*\d[a-z0-9-]*\d[a-z0-9-]*\d)[a-z0-9-]+)$/i;

function baseWords(value: string) {
  return sanitizeTransactionNarration(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-AU")
    .replace(/\b(?:pty|ltd|limited|australia|aus)\b/g, " ")
    .replace(/[^a-z0-9-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalMerchantGroupingKey(value: string) {
  const original = baseWords(value);
  if (!original || genericMerchantKeys.has(original)) return original;
  const withoutMarkedReferences = baseWords(value.replace(referenceMarkerPattern, " "));
  const filtered = withoutMarkedReferences
    .split(" ")
    .filter((token) => !referenceTokenPattern.test(token))
    .join(" ")
    .trim();
  if (filtered.length < 3 || genericMerchantKeys.has(filtered)) return original;
  return filtered;
}

export function canonicalMerchantDisplayName(value: string) {
  const key = canonicalMerchantGroupingKey(value);
  if (!key) return sanitizeTransactionNarration(value) || "Payment";
  return key.replace(/\b\w/g, (letter) => letter.toLocaleUpperCase("en-AU"));
}

export function isAmbiguousTransferText(merchantName: string, description = "") {
  const safe = `${sanitizeTransactionNarration(merchantName)} ${sanitizeTransactionNarration(description)}`;
  return /\b(?:bank transfer|transfer to|transfer from|pay anyone|osko|to cba|from cba)\b/i.test(safe) &&
    !/\b(?:internal transfer|between accounts|own account|to savings|from savings)\b/i.test(safe);
}
