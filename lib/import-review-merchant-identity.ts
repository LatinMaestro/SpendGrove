import { getManualCategory } from "@/lib/manual-categories";
import type { ImportReviewRow } from "@/lib/import-review";
import type { LocalMerchantData, MerchantCategorySuggestion } from "@/lib/merchant-rules";
import { sanitizeTransactionNarration } from "@/lib/validation/privacy";

const genericMerchantKeys = new Set([
  "bank transfer",
  "transfer",
  "payment",
  "payments",
  "deposit",
  "withdrawal",
  "direct debit",
  "credit",
  "debit",
  "refund",
  "salary",
  "cba",
  "commonwealth bank",
  "osko",
  "pay anyone",
]);
const genericReferenceWords = new Set([
  "account",
  "acct",
  "bill",
  "billing",
  "confirmation",
  "customer",
  "details",
  "id",
  "inv",
  "invoice",
  "member",
  "no",
  "number",
  "order",
  "payment",
  "payments",
  "policy",
  "receipt",
  "ref",
  "reference",
  "remittance",
  "trace",
  "transaction",
  "txn",
]);
const genericTransferWords = new Set([
  "bank",
  "direct",
  "from",
  "internet",
  "osko",
  "pay",
  "payment",
  "to",
  "transfer",
  "via",
  "xfer",
]);
const transferStylePattern = /\b(?:bank transfer|transfer|xfer|pay anyone|osko|internet banking)\b/i;
const ownAccountTransferPattern = /\b(?:internal transfer|between accounts|own account|to savings|from savings)\b/i;
const referenceMarkerPattern = /\b(?:ref(?:erence)?|invoice|inv|receipt|transaction|txn|payment id|member|policy|account|order|confirmation|trace)\s*[:#./-]?\s*[a-z0-9][a-z0-9._/-]{2,}\b/gi;
const dateLikeTokenPattern = /^(?:\d{1,2}[/-]){1,2}\d{2,4}$|^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/;
const prefixedReferenceTokenPattern = /^(?:inv|invoice|ref|txn|trx|id|ord|order|receipt|policy|member)[-_]?[a-z0-9]{3,}$/i;

function baseWords(value: string) {
  return sanitizeTransactionNarration(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-AU")
    .replace(/\b(?:pty|ltd|limited|australia|aus)\b/g, " ")
    .replace(/\b(?:store|shop|branch)\s+[a-z0-9]+\b/g, " ")
    .replace(/[^a-z0-9-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isReferenceLikeToken(token: string) {
  const compact = token.replace(/[^a-z0-9]/gi, "");
  if (!compact) return true;
  if (dateLikeTokenPattern.test(token)) return true;
  if (prefixedReferenceTokenPattern.test(token)) return true;
  const digits = compact.match(/\d/g)?.length ?? 0;
  const letters = compact.match(/[a-z]/gi)?.length ?? 0;
  if (digits >= 4 && letters === 0) return true;
  if (compact.length >= 5 && digits >= 2 && (digits >= letters || digits >= 3)) return true;
  return false;
}

export function isSafeCanonicalMerchantGroupingKey(key: string) {
  if (!key || genericMerchantKeys.has(key)) return false;
  const meaningfulWords = key.split(" ").filter((token) =>
    token.length >= 2 &&
    !genericReferenceWords.has(token) &&
    !genericTransferWords.has(token),
  );
  return meaningfulWords.length > 0;
}

export function canonicalMerchantGroupingKey(value: string) {
  const original = baseWords(value);
  if (!original) return original;
  const withoutMarkedReferences = baseWords(value.replace(referenceMarkerPattern, " "));
  const tokens = withoutMarkedReferences.split(" ").filter(Boolean);
  const meaningfulTokens = tokens.filter((token) =>
    !genericReferenceWords.has(token) &&
    !isReferenceLikeToken(token),
  );
  const withoutTransferNoise = meaningfulTokens.filter((token) => !genericTransferWords.has(token));
  const filtered = (withoutTransferNoise.length > 0 ? withoutTransferNoise : meaningfulTokens).join(" ").trim();
  if (!filtered) {
    return [...genericMerchantKeys].find((key) => original === key || original.startsWith(`${key} `)) ?? original;
  }
  if (genericMerchantKeys.has(filtered)) return filtered;
  return filtered;
}

export function canonicalMerchantDisplayName(value: string) { const key = canonicalMerchantGroupingKey(value); if (!key) return sanitizeTransactionNarration(value) || "Payment"; return key.replace(/\b\w/g, (letter) => letter.toLocaleUpperCase("en-AU")); }

export function suggestGroupedMerchantCategory(value: string, data: LocalMerchantData): MerchantCategorySuggestion | null {
  const key = canonicalMerchantGroupingKey(value);
  if (!isSafeCanonicalMerchantGroupingKey(key) || isAmbiguousTransferText(value)) return null;
  const profile = data.profiles.find((candidate) => candidate.isActive && canonicalMerchantGroupingKey(candidate.name) === key);
  if (!profile) return null;
  const rule = data.rules.find((candidate) => candidate.isActive && candidate.merchantProfileId === profile.id && Boolean(getManualCategory(candidate.categoryId)));
  const categoryId = rule?.categoryId ?? profile.defaultCategoryId;
  if (!getManualCategory(categoryId)) return null;
  return { merchantName: profile.name, categoryId, source: rule ? "USER_RULE" : "USER_ALIAS", confidence: "HIGH", reason: "Suggested from your safely grouped merchant choice.", requiresReview: true };
}

export function isAmbiguousTransferText(merchantName: string, description = "") {
  const safe = `${sanitizeTransactionNarration(merchantName)} ${sanitizeTransactionNarration(description)}`;
  if (!transferStylePattern.test(safe) || ownAccountTransferPattern.test(safe)) return false;
  const key = canonicalMerchantGroupingKey(merchantName);
  if (!isSafeCanonicalMerchantGroupingKey(key)) return true;
  const meaningfulWords = key.split(" ");
  return meaningfulWords.length === 1 && meaningfulWords[0].length < 8;
}

export function hasPossibleOppositeTransferPair(row: ImportReviewRow, rows: ImportReviewRow[]) {
  if (!row.date || row.amountCents === null || row.amountCents === 0) return false;
  const amountCents = row.amountCents;
  const rowDate = new Date(`${row.date}T00:00:00.000Z`).getTime();
  return rows.some((candidate) => { if (candidate.id === row.id || !candidate.date || candidate.amountCents !== -amountCents) return false; const candidateDate = new Date(`${candidate.date}T00:00:00.000Z`).getTime(); return Math.abs(candidateDate - rowDate) <= 2 * 24 * 60 * 60 * 1000 && isAmbiguousTransferText(candidate.merchantName, candidate.description); });
}
