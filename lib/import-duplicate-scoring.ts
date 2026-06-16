import type { ImportReviewRow } from "@/lib/import-review";
import {
  listActiveManualTransactions,
  type ManualTransaction,
} from "@/lib/manual-transactions";
import { normalizeMerchantName } from "@/lib/merchant-rules";
import { sanitizeBankDescription } from "@/lib/validation/privacy";

export const DUPLICATE_SCORE_WEIGHTS = {
  amount: 35,
  date: 25,
  merchant: 20,
  description: 10,
  consistency: 10,
} as const;

export type DuplicateConfidenceBand = "LIKELY" | "POSSIBLE";
export type DuplicateCandidateSource = "MANUAL_TRANSACTION" | "SAME_IMPORT";

export type DuplicateCandidate = {
  source: DuplicateCandidateSource;
  candidateId: string;
  label: string;
  date: string;
  amountCents: number;
  merchantName: string;
  description: string;
  categoryId: string | null;
  score: number;
  confidence: DuplicateConfidenceBand;
  reasons: string[];
  canMergeTarget: boolean;
  rowNumber?: number;
};

type DuplicateScoringOptions = {
  userId?: string;
  limit?: number;
};

type ComparableCandidate = {
  source: DuplicateCandidateSource;
  candidateId: string;
  label: string;
  date: string | null;
  amountCents: number | null;
  merchantName: string;
  description: string;
  categoryId: string | null;
  type?: string;
  canMergeTarget: boolean;
  rowNumber?: number;
  raw?: unknown;
};

function parseDateOnly(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return date;
}

function daysBetween(left: string | null, right: string | null) {
  const leftDate = parseDateOnly(left);
  const rightDate = parseDateOnly(right);
  if (!leftDate || !rightDate) return null;
  return Math.abs(Math.round((leftDate.getTime() - rightDate.getTime()) / 86_400_000));
}

function moneyDirection(amountCents: number | null) {
  if (amountCents === null || amountCents === 0) return null;
  return amountCents > 0 ? "IN" : "OUT";
}

function dateScore(dayDifference: number) {
  if (dayDifference === 0) return DUPLICATE_SCORE_WEIGHTS.date;
  if (dayDifference <= 3) return 20;
  if (dayDifference <= 7) return 8;
  return 0;
}

function safeMerchantKey(value: string) {
  try {
    return normalizeMerchantName(value || "Payment");
  } catch {
    return "";
  }
}

function safeTokens(value: string) {
  const cleaned = sanitizeBankDescription(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-AU")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return cleaned
    ? cleaned.split(" ").filter((token) => token.length > 2 && !["the", "and", "for", "with"].includes(token))
    : [];
}

function tokenOverlapRatio(left: string, right: string) {
  const leftTokens = new Set(safeTokens(left));
  const rightTokens = new Set(safeTokens(right));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  const shared = Array.from(leftTokens).filter((token) => rightTokens.has(token)).length;
  return shared / Math.max(leftTokens.size, rightTokens.size);
}

function merchantSimilarityScore(leftMerchant: string, rightMerchant: string) {
  const leftKey = safeMerchantKey(leftMerchant);
  const rightKey = safeMerchantKey(rightMerchant);
  if (leftKey && rightKey && leftKey === rightKey) return DUPLICATE_SCORE_WEIGHTS.merchant;
  const overlap = tokenOverlapRatio(leftMerchant, rightMerchant);
  if (overlap >= 0.6) return 14;
  if (overlap >= 0.35) return 8;
  return 0;
}

function descriptionSimilarityScore(leftDescription: string, rightDescription: string) {
  const overlap = tokenOverlapRatio(leftDescription, rightDescription);
  if (overlap >= 0.7) return DUPLICATE_SCORE_WEIGHTS.description;
  if (overlap >= 0.45) return 6;
  return 0;
}

function consistencyScore(row: ImportReviewRow, candidate: ComparableCandidate, directionCompatible: boolean) {
  let score = 0;
  if (directionCompatible) score += 3;
  if (candidate.categoryId && candidate.categoryId === row.categoryId) score += 5;
  if (candidate.source === "MANUAL_TRANSACTION" || candidate.source === "SAME_IMPORT") score += 2;
  return Math.min(DUPLICATE_SCORE_WEIGHTS.consistency, score);
}

function isRecurringStyleSpacing(dayDifference: number, amountExact: boolean, merchantScore: number) {
  return amountExact && merchantScore >= 14 && dayDifference >= 25 && dayDifference <= 35;
}

function isSplitParent(value: unknown) {
  const candidate = value as { splitRole?: string; isSplitParent?: boolean };
  return candidate?.splitRole === "PARENT" || candidate?.isSplitParent === true;
}

function isOwnedByCurrentUser(value: unknown, userId?: string) {
  if (!userId) return true;
  const candidate = value as { userId?: string };
  return !candidate?.userId || candidate.userId === userId;
}

function toManualCandidate(transaction: ManualTransaction): ComparableCandidate {
  return {
    source: "MANUAL_TRANSACTION",
    candidateId: transaction.id,
    label: transaction.description,
    date: transaction.date,
    amountCents: transaction.amountCents,
    merchantName: transaction.description,
    description: transaction.description,
    categoryId: transaction.categoryId,
    type: transaction.type,
    canMergeTarget: true,
    raw: transaction,
  };
}

function toSameImportCandidate(row: ImportReviewRow): ComparableCandidate {
  return {
    source: "SAME_IMPORT",
    candidateId: row.id,
    label: `Row ${row.rowNumber}`,
    date: row.date,
    amountCents: row.amountCents,
    merchantName: row.merchantName,
    description: row.description,
    categoryId: row.categoryId,
    canMergeTarget: false,
    rowNumber: row.rowNumber,
    raw: row,
  };
}

function scoreCandidate(row: ImportReviewRow, candidate: ComparableCandidate): DuplicateCandidate | null {
  if (row.action === "SKIP") return null;
  if (!row.date || row.amountCents === null || !candidate.date || candidate.amountCents === null) return null;

  const dayDifference = daysBetween(row.date, candidate.date);
  if (dayDifference === null || dayDifference > 7) return null;

  const amountExact = row.amountCents === candidate.amountCents;
  const directionCompatible = moneyDirection(row.amountCents) === moneyDirection(candidate.amountCents);
  if (!amountExact || !directionCompatible) return null;

  const merchantScore = merchantSimilarityScore(row.merchantName, candidate.merchantName);
  if (isRecurringStyleSpacing(dayDifference, amountExact, merchantScore)) return null;

  const descriptionScore = descriptionSimilarityScore(
    `${row.merchantName} ${row.description}`,
    `${candidate.merchantName} ${candidate.description}`,
  );
  const datePoints = dateScore(dayDifference);
  const consistencyPoints = consistencyScore(row, candidate, directionCompatible);
  const score = DUPLICATE_SCORE_WEIGHTS.amount + datePoints + merchantScore + descriptionScore + consistencyPoints;

  const hasSimilarText = merchantScore >= 14 || descriptionScore >= 6;
  if (!hasSimilarText) return null;

  const confidence = score >= 85 && dayDifference <= 3
    ? "LIKELY"
    : score >= 70
      ? "POSSIBLE"
      : null;
  if (!confidence) return null;

  const reasons = [
    "Same amount",
    dayDifference === 0 ? "Same day" : `${dayDifference} day${dayDifference === 1 ? "" : "s"} apart`,
    merchantScore >= 14 ? "Similar merchant" : null,
    descriptionScore >= 6 ? "Similar description" : null,
    candidate.categoryId && candidate.categoryId === row.categoryId ? "Same category" : null,
  ].filter((reason): reason is string => Boolean(reason));

  return {
    source: candidate.source,
    candidateId: candidate.candidateId,
    label: candidate.label,
    date: candidate.date,
    amountCents: candidate.amountCents,
    merchantName: candidate.merchantName,
    description: candidate.description,
    categoryId: candidate.categoryId,
    score,
    confidence,
    reasons,
    canMergeTarget: candidate.canMergeTarget,
    rowNumber: candidate.rowNumber,
  };
}

export function findImportDuplicateCandidates(
  row: ImportReviewRow,
  allRows: ImportReviewRow[],
  manualTransactions: ManualTransaction[],
  options: DuplicateScoringOptions = {},
) {
  const manualCandidates = listActiveManualTransactions(manualTransactions)
    .filter((transaction) => !isSplitParent(transaction) && isOwnedByCurrentUser(transaction, options.userId))
    .map(toManualCandidate);
  const sameImportCandidates = allRows
    .filter((candidate) => candidate.id !== row.id && candidate.action !== "SKIP")
    .map(toSameImportCandidate);

  return [...manualCandidates, ...sameImportCandidates]
    .map((candidate) => scoreCandidate(row, candidate))
    .filter((candidate): candidate is DuplicateCandidate => Boolean(candidate))
    .sort((left, right) => right.score - left.score || left.source.localeCompare(right.source))
    .slice(0, options.limit ?? 5);
}
