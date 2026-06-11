import { manualCategories } from "@/lib/manual-categories";
import {
  suggestMerchantCategory,
  type LocalMerchantData,
  type MerchantCategorySuggestion,
  type MerchantSuggestionConfidence,
} from "@/lib/merchant-rules";

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

function categoryIdByName(name: string) {
  const category = manualCategories.find((candidate) => candidate.name === name);
  if (!category) throw new Error(`Missing seeded category: ${name}`);
  return category.id;
}

export function suggestImportReviewCategory(
  merchantValue: string,
  data: LocalMerchantData,
): MerchantCategorySuggestion {
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
