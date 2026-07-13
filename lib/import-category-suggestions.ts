import { manualCategories } from "@/lib/manual-categories";
import { suggestGroupedMerchantCategory } from "@/lib/import-review-merchant-identity";
import { suggestMerchantCategory, type LocalMerchantData, type MerchantCategorySuggestion, type MerchantSuggestionConfidence } from "@/lib/merchant-rules";
import { sanitizeBankDescription, sanitizeTransactionNarration } from "@/lib/validation/privacy";

type DeterministicSuggestion = {
  pattern: RegExp;
  categoryName: string;
  confidence: MerchantSuggestionConfidence;
  reason: string;
};

const deterministicSuggestions: DeterministicSuggestion[] = [
  {
    pattern: /\b(?:pizza|sushi|red[\s-]*rooster|kfc|mcdonald(?:'|’)?s|hungry[\s-]*jack(?:'|’)?s|domino(?:'|’)?s|uber[\s-]*eats|door[\s-]*dash|menulog)\b/i,
    categoryName: "Coffee / takeaway",
    confidence: "HIGH",
    reason: "Suggested from a clear local takeaway or food-delivery match. Please review before using it.",
  },
  { pattern: /\bbunnings\b/i, categoryName: "Home maintenance", confidence: "MEDIUM", reason: "Suggested from a common home-maintenance merchant. Please review the category." },
  { pattern: /\buber\b/i, categoryName: "Rideshare / taxi", confidence: "MEDIUM", reason: "Suggested from a clear rideshare merchant. Please review before using it." },
  { pattern: /\bcredit[\s-]*card[\s-]*payment\b/i, categoryName: "Credit card payment", confidence: "MEDIUM", reason: "Possible credit card account movement. Review the transfer category before using it." },
  { pattern: /\bato[\s-]*refund\b/i, categoryName: "ATO refund", confidence: "HIGH", reason: "Suggested from a clear ATO refund description. Please review before using it." },
  { pattern: /\btax[\s-]*agent[\s-]*fees?\b/i, categoryName: "Tax agent fees", confidence: "MEDIUM", reason: "Suggested from clear tax-agent wording. Please review before using it." },
  { pattern: /\bprofessional[\s-]*memberships?\b/i, categoryName: "Professional memberships", confidence: "MEDIUM", reason: "Suggested from clear professional-membership wording. Please review before using it." },
  { pattern: /\bdonations?\b/i, categoryName: "Donations", confidence: "MEDIUM", reason: "Suggested from clear donation wording. Please review before using it." },
  { pattern: /\bwork[\s-]*travel\b/i, categoryName: "Work travel", confidence: "MEDIUM", reason: "Suggested from clear work-travel wording. Please review before using it." },
  { pattern: /\bhome[\s-]*office\b/i, categoryName: "Home office", confidence: "MEDIUM", reason: "Suggested from clear home-office wording. Please review before using it." },
  { pattern: /\b(?:training|education[\s-]*course)\b/i, categoryName: "Training / education", confidence: "MEDIUM", reason: "Suggested from clear training or education wording. Please review before using it." },
  { pattern: /\b(?:uniform|protective[\s-]*clothing)\b/i, categoryName: "Uniforms / protective clothing", confidence: "MEDIUM", reason: "Suggested from clear uniform or protective-clothing wording. Please review before using it." },
  { pattern: /\b(?:tools?|equipment)\b/i, categoryName: "Tools / equipment", confidence: "MEDIUM", reason: "Suggested from clear tools or equipment wording. Please review before using it." },
];

const transferContextSuggestions: DeterministicSuggestion[] = [
  { pattern: /\bloan[\s-]*repayment\b/i, categoryName: "Loan repayment", confidence: "HIGH", reason: "Suggested from clear loan-repayment wording. Please review before using it." },
  { pattern: /\brent\b/i, categoryName: "Rent", confidence: "HIGH", reason: "Suggested from a clear user-entered rent purpose. Please review before using it." },
  { pattern: /\bgifts?\b/i, categoryName: "Gifts", confidence: "HIGH", reason: "Suggested from a clear user-entered gift purpose. Please review before using it." },
  { pattern: /\b(?:pizza|sushi|red[\s-]*rooster|kfc|mcdonald(?:'|’)?s|hungry[\s-]*jack(?:'|’)?s|domino(?:'|’)?s|uber[\s-]*eats|door[\s-]*dash|menulog)\b/i, categoryName: "Coffee / takeaway", confidence: "HIGH", reason: "Suggested from a clear user-entered takeaway purpose. Please review before using it." },
  { pattern: /\b(?:translink|public[\s-]*transport|go[\s-]*card)\b/i, categoryName: "Public transport", confidence: "HIGH", reason: "Suggested from clear public-transport wording. Please review before using it." },
  { pattern: /\belectricity\b/i, categoryName: "Electricity", confidence: "HIGH", reason: "Suggested from a clear user-entered electricity purpose. Please review before using it." },
  { pattern: /\b(?:internet|broadband)\b/i, categoryName: "Internet", confidence: "HIGH", reason: "Suggested from a clear user-entered internet purpose. Please review before using it." },
];

const transferStylePattern = /\b(?:osko|bank[\s-]*transfer|transfer|xfer|pay[\s-]*anyone|account[\s-]*movement|between[\s-]*accounts)\b/i;
const internalTransferPattern = /\b(?:internal[\s-]*transfer|account[\s-]*movement|between[\s-]*accounts|own[\s-]*account|to[\s-]*savings|from[\s-]*savings|savings[\s-]*transfer)\b/i;

function categoryIdByName(name: string) {
  const category = manualCategories.find((candidate) => candidate.name === name);
  if (!category) throw new Error(`Missing seeded category: ${name}`);
  return category.id;
}

function needsReviewSuggestion(merchantName: string, reason: string): MerchantCategorySuggestion {
  return { merchantName, categoryId: categoryIdByName("Needs review"), source: "FALLBACK", confidence: "LOW", reason, requiresReview: true };
}

function suggestionFromRule(merchantName: string, rule: DeterministicSuggestion): MerchantCategorySuggestion {
  return {
    merchantName,
    categoryId: categoryIdByName(rule.categoryName),
    source: "KEYWORD",
    confidence: rule.confidence,
    reason: rule.reason,
    requiresReview: true,
  };
}

function suggestTransferCategory(merchantValue: string, bankDescription?: string): MerchantCategorySuggestion | null {
  const safeMerchant = sanitizeTransactionNarration(merchantValue) || "Payment";
  const safeDescription = sanitizeBankDescription(bankDescription || merchantValue);
  const context = `${safeMerchant} ${safeDescription}`.trim();
  if (!transferStylePattern.test(context)) return null;
  const contextual = transferContextSuggestions.find((candidate) => candidate.pattern.test(context));
  if (contextual) return suggestionFromRule(safeMerchant, contextual);
  if (internalTransferPattern.test(context)) return { merchantName: safeMerchant, categoryId: categoryIdByName("Transfer"), source: "KEYWORD", confidence: "MEDIUM", reason: "Suggested from a clear movement between accounts. Please review before using it.", requiresReview: true };
  return needsReviewSuggestion(safeMerchant, "This may be an account transfer or a payment to someone else. Confirm what happened before saving.");
}

export function suggestImportReviewCategory(merchantValue: string, data: LocalMerchantData, bankDescription?: string): MerchantCategorySuggestion {
  const localSuggestion = suggestMerchantCategory(merchantValue, data);
  if (localSuggestion.source === "USER_RULE" || localSuggestion.source === "USER_ALIAS") return localSuggestion;

  const grouped = suggestGroupedMerchantCategory(merchantValue, data);
  if (grouped) return grouped;

  const transferSuggestion = suggestTransferCategory(merchantValue, bankDescription);
  if (transferSuggestion) return transferSuggestion;

  if (localSuggestion.source !== "FALLBACK") return localSuggestion;

  const safeDescription = sanitizeBankDescription(bankDescription || merchantValue);
  const context = `${localSuggestion.merchantName} ${safeDescription}`.trim();
  const deterministic = deterministicSuggestions.find((candidate) => candidate.pattern.test(context));
  if (!deterministic) return localSuggestion;
  return suggestionFromRule(localSuggestion.merchantName, deterministic);
}
