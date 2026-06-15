import { manualCategories } from "@/lib/manual-categories";
import {
  suggestMerchantCategory,
  type LocalMerchantData,
  type MerchantCategorySuggestion,
  type MerchantSuggestionConfidence,
} from "@/lib/merchant-rules";
import {
  sanitizeBankDescription,
  sanitizeTransactionNarration,
} from "@/lib/validation/privacy";

const deterministicSuggestions: Array<{
  merchants: string[];
  categoryName: string;
  confidence: MerchantSuggestionConfidence;
  reason: string;
}> = [
  {
    merchants: ["Domino's"],
    categoryName: "Dining out",
    confidence: "HIGH",
    reason: "Suggested from a clear local merchant match. Please review before using it.",
  },
  {
    merchants: ["Bunnings"],
    categoryName: "Home maintenance",
    confidence: "MEDIUM",
    reason: "Suggested from a common home-maintenance merchant. Please review the category.",
  },
  {
    merchants: ["Uber Eats"],
    categoryName: "Dining out",
    confidence: "MEDIUM",
    reason: "Suggested from a clear food-delivery merchant. Please review before using it.",
  },
  {
    merchants: ["Uber"],
    categoryName: "Rideshare / taxi",
    confidence: "MEDIUM",
    reason: "Suggested from a clear rideshare merchant. Please review before using it.",
  },
  {
    merchants: ["Credit card payment"],
    categoryName: "Credit card payment",
    confidence: "MEDIUM",
    reason: "Possible credit card account movement. Review the transfer category before using it.",
  },
  {
    merchants: ["ATO refund"],
    categoryName: "ATO refund",
    confidence: "HIGH",
    reason: "Suggested from a clear ATO refund description. Please review before using it.",
  },
  {
    merchants: ["Tax agent fee", "Tax agent fees"],
    categoryName: "Tax agent fees",
    confidence: "MEDIUM",
    reason: "Suggested from clear tax-agent wording. Please review deductibility before using it.",
  },
  {
    merchants: ["Professional membership", "Professional memberships"],
    categoryName: "Professional memberships",
    confidence: "MEDIUM",
    reason: "Suggested from clear professional-membership wording. Please review before using it.",
  },
  {
    merchants: ["Donation", "Donations"],
    categoryName: "Donations",
    confidence: "MEDIUM",
    reason: "Suggested from clear donation wording. Please review before using it.",
  },
  {
    merchants: ["Work travel"],
    categoryName: "Work travel",
    confidence: "MEDIUM",
    reason: "Suggested from clear work-travel wording. Please review before using it.",
  },
  {
    merchants: ["Home office"],
    categoryName: "Home office",
    confidence: "MEDIUM",
    reason: "Suggested from clear home-office wording. Please review before using it.",
  },
  {
    merchants: ["Training", "Education course"],
    categoryName: "Training / education",
    confidence: "MEDIUM",
    reason: "Suggested from clear training or education wording. Please review before using it.",
  },
  {
    merchants: ["Uniform", "Protective clothing"],
    categoryName: "Uniforms / protective clothing",
    confidence: "MEDIUM",
    reason: "Suggested from clear uniform or protective-clothing wording. Please review before using it.",
  },
  {
    merchants: ["Tools", "Equipment"],
    categoryName: "Tools / equipment",
    confidence: "MEDIUM",
    reason: "Suggested from clear tools or equipment wording. Please review before using it.",
  },
];

const transferContextSuggestions: Array<{
  pattern: RegExp;
  categoryName: string;
  confidence: MerchantSuggestionConfidence;
  reason: string;
}> = [
  {
    pattern: /\bloan repayment\b/i,
    categoryName: "Loan repayment",
    confidence: "HIGH",
    reason: "Suggested from clear loan-repayment wording. Please review before using it.",
  },
  {
    pattern: /\brent\b/i,
    categoryName: "Rent",
    confidence: "MEDIUM",
    reason: "Suggested from clear rent wording. Please review before using it.",
  },
  {
    pattern: /\bgift\b/i,
    categoryName: "Gifts",
    confidence: "MEDIUM",
    reason: "Suggested from clear gift wording. Please review before using it.",
  },
  {
    pattern: /\b(?:translink|public transport|go card)\b/i,
    categoryName: "Public transport",
    confidence: "HIGH",
    reason: "Suggested from clear public-transport wording. Please review before using it.",
  },
];

const transferStylePattern = /\b(?:osko|bank transfer|transfer|xfer|pay anyone|account movement|between accounts)\b/i;
const internalTransferPattern = /\b(?:internal transfer|account movement|between accounts|own account|to savings|from savings|savings transfer)\b/i;

function categoryIdByName(name: string) {
  const category = manualCategories.find((candidate) => candidate.name === name);
  if (!category) throw new Error(`Missing seeded category: ${name}`);
  return category.id;
}

function needsReviewSuggestion(merchantName: string, reason: string): MerchantCategorySuggestion {
  return {
    merchantName,
    categoryId: categoryIdByName("Needs review"),
    source: "FALLBACK",
    confidence: "LOW",
    reason,
    requiresReview: true,
  };
}

function suggestTransferCategory(
  merchantValue: string,
  bankDescription?: string,
): MerchantCategorySuggestion | null {
  const safeMerchant = sanitizeTransactionNarration(merchantValue) || "Payment";
  const safeDescription = sanitizeBankDescription(bankDescription || merchantValue);
  const context = `${safeMerchant} ${safeDescription}`.trim();
  if (!transferStylePattern.test(context)) return null;

  const contextual = transferContextSuggestions.find((candidate) => candidate.pattern.test(context));
  if (contextual) {
    return {
      merchantName: safeMerchant,
      categoryId: categoryIdByName(contextual.categoryName),
      source: "KEYWORD",
      confidence: contextual.confidence,
      reason: contextual.reason,
      requiresReview: true,
    };
  }

  if (internalTransferPattern.test(context)) {
    return {
      merchantName: safeMerchant,
      categoryId: categoryIdByName("Transfer"),
      source: "KEYWORD",
      confidence: "MEDIUM",
      reason: "Suggested from a clear movement between accounts. Please review before using it.",
      requiresReview: true,
    };
  }

  return needsReviewSuggestion(
    safeMerchant,
    "This looks like a payment or transfer to another party. Choose the category that best describes it.",
  );
}

export function suggestImportReviewCategory(
  merchantValue: string,
  data: LocalMerchantData,
  bankDescription?: string,
): MerchantCategorySuggestion {
  const transferSuggestion = suggestTransferCategory(merchantValue, bankDescription);
  if (transferSuggestion) return transferSuggestion;

  const baseSuggestion = suggestMerchantCategory(merchantValue, data);
  if (baseSuggestion.source !== "FALLBACK") return baseSuggestion;

  const deterministic = deterministicSuggestions.find((candidate) =>
    candidate.merchants.some((merchant) => merchant.toLocaleLowerCase("en-AU") === baseSuggestion.merchantName.toLocaleLowerCase("en-AU")),
  );
  if (!deterministic) return baseSuggestion;

  return {
    merchantName: baseSuggestion.merchantName,
    categoryId: categoryIdByName(deterministic.categoryName),
    source: "KEYWORD",
    confidence: deterministic.confidence,
    reason: deterministic.reason,
    requiresReview: true,
  };
}
