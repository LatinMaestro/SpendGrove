import { z } from "zod";
import { getManualCategory, manualCategories } from "@/lib/manual-categories";
import {
  containsPrivateBankIdentifier,
  sanitizeTransactionNarration,
} from "@/lib/validation/privacy";

export const MERCHANT_RULE_STORAGE_KEY = "spendgrove.phase1.merchant-rules.v1";
export const MERCHANT_RULE_STORAGE_VERSION = 1 as const;
export const MERCHANT_PROFILE_LIMIT = 200;
export const MERCHANT_ALIAS_LIMIT = 500;
export const MERCHANT_RULE_LIMIT = 500;

export type LocalMerchantRuleType = "EXACT" | "CONTAINS" | "STARTS_WITH";
export type MerchantSuggestionSource = "USER_RULE" | "USER_ALIAS" | "KEYWORD" | "FALLBACK";
export type MerchantSuggestionConfidence = "HIGH" | "MEDIUM" | "LOW";

export type LocalMerchantProfile = {
  id: string;
  name: string;
  normalizedName: string;
  defaultCategoryId: string;
  createdAt: string;
  updatedAt: string;
};

export type LocalMerchantAlias = {
  id: string;
  merchantProfileId: string;
  normalizedAlias: string;
  createdAt: string;
};

export type LocalMerchantRule = {
  id: string;
  merchantProfileId: string;
  categoryId: string;
  type: LocalMerchantRuleType;
  normalizedPattern: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LocalMerchantData = {
  profiles: LocalMerchantProfile[];
  aliases: LocalMerchantAlias[];
  rules: LocalMerchantRule[];
};

export type MerchantCategorySuggestion = {
  merchantName: string;
  categoryId: string;
  source: MerchantSuggestionSource;
  confidence: MerchantSuggestionConfidence;
  reason: string;
  requiresReview: true;
};

export type MerchantRuleStorageResult = {
  data: LocalMerchantData;
  recoveredFromCorruption: boolean;
};

export type MerchantRuleStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

const emptyMerchantData: LocalMerchantData = {
  profiles: [],
  aliases: [],
  rules: [],
};

const unsafeMerchantStoragePattern = /\b(?:bsb|account\s*(?:number|no|id)|customer\s*(?:number|no|id)|card\s*(?:number|no|ending)|loan\s*(?:number|no|id|reference))\b/i;

const safeMerchantNameSchema = z.string()
  .trim()
  .min(2)
  .max(80)
  .refine((value) => !containsPrivateBankIdentifier(value), "Private banking identifiers are not permitted.")
  .refine((value) => !unsafeMerchantStoragePattern.test(value), "Unsafe banking references are not permitted.");

const normalizedMerchantKeySchema = z.string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?: [a-z0-9]+)*$/, "Merchant keys must contain safe normalised words only.");

const profileSchema = z.object({
  id: z.string().min(1),
  name: safeMerchantNameSchema,
  normalizedName: normalizedMerchantKeySchema,
  defaultCategoryId: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict().superRefine((profile, context) => {
  if (!getManualCategory(profile.defaultCategoryId)) {
    context.addIssue({ code: "custom", path: ["defaultCategoryId"], message: "Choose an approved category." });
  }
  if (normalizeMerchantName(profile.name) !== profile.normalizedName) {
    context.addIssue({ code: "custom", path: ["normalizedName"], message: "Canonical merchant name does not match its normalised key." });
  }
});

const aliasSchema = z.object({
  id: z.string().min(1),
  merchantProfileId: z.string().min(1),
  normalizedAlias: normalizedMerchantKeySchema,
  createdAt: z.string().datetime(),
}).strict();

const ruleSchema = z.object({
  id: z.string().min(1),
  merchantProfileId: z.string().min(1),
  categoryId: z.string().min(1),
  type: z.enum(["EXACT", "CONTAINS", "STARTS_WITH"]),
  normalizedPattern: normalizedMerchantKeySchema,
  priority: z.number().int().min(1).max(999),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict().superRefine((rule, context) => {
  if (!getManualCategory(rule.categoryId)) {
    context.addIssue({ code: "custom", path: ["categoryId"], message: "Choose an approved category." });
  }
});

const merchantStorageSchema = z.object({
  version: z.literal(MERCHANT_RULE_STORAGE_VERSION),
  profiles: z.array(profileSchema).max(MERCHANT_PROFILE_LIMIT),
  aliases: z.array(aliasSchema).max(MERCHANT_ALIAS_LIMIT),
  rules: z.array(ruleSchema).max(MERCHANT_RULE_LIMIT),
}).strict().superRefine((data, context) => {
  const profileIds = new Set(data.profiles.map((profile) => profile.id));
  const normalizedProfiles = new Set<string>();
  const normalizedAliases = new Set<string>();

  data.profiles.forEach((profile, index) => {
    if (normalizedProfiles.has(profile.normalizedName)) {
      context.addIssue({ code: "custom", path: ["profiles", index, "normalizedName"], message: "Merchant profile names must be unique." });
    }
    normalizedProfiles.add(profile.normalizedName);
  });
  data.aliases.forEach((alias, index) => {
    if (!profileIds.has(alias.merchantProfileId)) {
      context.addIssue({ code: "custom", path: ["aliases", index, "merchantProfileId"], message: "Alias merchant profile is missing." });
    }
    if (normalizedAliases.has(alias.normalizedAlias)) {
      context.addIssue({ code: "custom", path: ["aliases", index, "normalizedAlias"], message: "Merchant aliases must be unique." });
    }
    normalizedAliases.add(alias.normalizedAlias);
  });
  data.rules.forEach((rule, index) => {
    if (!profileIds.has(rule.merchantProfileId)) {
      context.addIssue({ code: "custom", path: ["rules", index, "merchantProfileId"], message: "Rule merchant profile is missing." });
    }
  });
});

type KeywordSuggestion = {
  keywords: string[];
  categoryName: string;
  merchantName?: string;
  confidence: MerchantSuggestionConfidence;
};

const keywordSuggestions: KeywordSuggestion[] = [
  { keywords: ["woolworths", "coles", "aldi", "iga"], categoryName: "Groceries", confidence: "HIGH" },
  { keywords: ["translink", "go card"], categoryName: "Public transport", merchantName: "Translink", confidence: "HIGH" },
  { keywords: ["ampol", "caltex", "shell", "bp"], categoryName: "Fuel", confidence: "MEDIUM" },
  { keywords: ["telstra", "optus", "vodafone"], categoryName: "Mobile phone", confidence: "MEDIUM" },
  { keywords: ["agl", "energex", "energy australia"], categoryName: "Electricity", confidence: "MEDIUM" },
  { keywords: ["salary", "wages", "payroll"], categoryName: "Salary / wages", merchantName: "Salary", confidence: "MEDIUM" },
  { keywords: ["refund", "rebate"], categoryName: "Refunds / rebates", merchantName: "Refund", confidence: "MEDIUM" },
  { keywords: ["bank transfer", "transfer", "osko"], categoryName: "Transfer to review", merchantName: "Bank transfer", confidence: "MEDIUM" },
  { keywords: ["loan repayment"], categoryName: "Loan repayment", merchantName: "Loan repayment", confidence: "MEDIUM" },
];

function categoryIdByName(name: string) {
  const category = manualCategories.find((candidate) => candidate.name === name);
  if (!category) throw new Error(`Missing seeded category: ${name}`);
  return category.id;
}

function createLocalId(prefix: string) {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function safeCanonicalMerchantName(value: string) {
  const sanitized = sanitizeTransactionNarration(value);
  return safeMerchantNameSchema.parse(sanitized);
}

export function normalizeMerchantName(value: string) {
  const sanitized = sanitizeTransactionNarration(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-AU")
    .replace(/\b(?:pty|ltd|limited|australia|aus)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalizedMerchantKeySchema.parse(sanitized);
}

function ruleMatches(rule: LocalMerchantRule, normalizedMerchant: string) {
  if (!rule.isActive) return false;
  if (rule.type === "EXACT") return normalizedMerchant === rule.normalizedPattern;
  if (rule.type === "STARTS_WITH") return normalizedMerchant.startsWith(rule.normalizedPattern);
  return normalizedMerchant.includes(rule.normalizedPattern);
}

function getProfile(data: LocalMerchantData, profileId: string) {
  return data.profiles.find((profile) => profile.id === profileId);
}

export function suggestMerchantCategory(
  merchantValue: string,
  data: LocalMerchantData = emptyMerchantData,
): MerchantCategorySuggestion {
  const merchantName = safeCanonicalMerchantName(merchantValue || "Payment");
  const normalizedMerchant = normalizeMerchantName(merchantName);

  const matchingRule = [...data.rules]
    .filter((rule) => ruleMatches(rule, normalizedMerchant))
    .sort((left, right) => left.priority - right.priority)[0];
  if (matchingRule) {
    const profile = getProfile(data, matchingRule.merchantProfileId);
    if (profile) {
      return {
        merchantName: profile.name,
        categoryId: matchingRule.categoryId,
        source: "USER_RULE",
        confidence: "HIGH",
        reason: "Suggested by your confirmed local merchant rule.",
        requiresReview: true,
      };
    }
  }

  const alias = data.aliases.find((candidate) => candidate.normalizedAlias === normalizedMerchant);
  if (alias) {
    const profile = getProfile(data, alias.merchantProfileId);
    if (profile) {
      return {
        merchantName: profile.name,
        categoryId: profile.defaultCategoryId,
        source: "USER_ALIAS",
        confidence: "HIGH",
        reason: "Suggested from your local merchant alias.",
        requiresReview: true,
      };
    }
  }

  const keyword = keywordSuggestions.find((candidate) =>
    candidate.keywords.some((value) => normalizedMerchant.includes(normalizeMerchantName(value))),
  );
  if (keyword) {
    return {
      merchantName: keyword.merchantName ?? merchantName,
      categoryId: categoryIdByName(keyword.categoryName),
      source: "KEYWORD",
      confidence: keyword.confidence,
      reason: "Suggested by a local keyword. Please review before using it.",
      requiresReview: true,
    };
  }

  return {
    merchantName,
    categoryId: categoryIdByName("Needs review"),
    source: "FALLBACK",
    confidence: "LOW",
    reason: "No confident local match. Category needs review.",
    requiresReview: true,
  };
}

export function saveConfirmedMerchantRule(
  data: LocalMerchantData,
  input: { merchantName: string; categoryId: string; now?: Date },
) {
  const name = safeCanonicalMerchantName(input.merchantName);
  const normalizedName = normalizeMerchantName(name);
  if (!getManualCategory(input.categoryId)) throw new Error("Choose an approved category.");
  const timestamp = (input.now ?? new Date()).toISOString();
  const existingProfile = data.profiles.find((profile) => profile.normalizedName === normalizedName);
  const profile: LocalMerchantProfile = profileSchema.parse(existingProfile
    ? { ...existingProfile, name, defaultCategoryId: input.categoryId, updatedAt: timestamp }
    : {
        id: createLocalId("merchant"),
        name,
        normalizedName,
        defaultCategoryId: input.categoryId,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
  const profiles = existingProfile
    ? data.profiles.map((candidate) => candidate.id === profile.id ? profile : candidate)
    : [...data.profiles, profile];
  const existingRule = data.rules.find((rule) =>
    rule.type === "EXACT" && rule.normalizedPattern === normalizedName,
  );
  const rule: LocalMerchantRule = ruleSchema.parse(existingRule
    ? { ...existingRule, merchantProfileId: profile.id, categoryId: input.categoryId, isActive: true, updatedAt: timestamp }
    : {
        id: createLocalId("rule"),
        merchantProfileId: profile.id,
        categoryId: input.categoryId,
        type: "EXACT",
        normalizedPattern: normalizedName,
        priority: 10,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
  const rules = existingRule
    ? data.rules.map((candidate) => candidate.id === rule.id ? rule : candidate)
    : [...data.rules, rule];
  return merchantStorageSchema.parse({ version: 1, profiles, aliases: data.aliases, rules });
}

export function saveMerchantAlias(
  data: LocalMerchantData,
  input: { alias: string; canonicalName: string; categoryId: string; now?: Date },
) {
  const withRule = saveConfirmedMerchantRule(data, {
    merchantName: input.canonicalName,
    categoryId: input.categoryId,
    now: input.now,
  });
  const normalizedAlias = normalizeMerchantName(input.alias);
  const canonicalKey = normalizeMerchantName(input.canonicalName);
  if (normalizedAlias === canonicalKey) throw new Error("Alias must differ from the canonical merchant name.");
  const profile = withRule.profiles.find((candidate) => candidate.normalizedName === canonicalKey);
  if (!profile) throw new Error("Canonical merchant profile could not be created.");
  const timestamp = (input.now ?? new Date()).toISOString();
  const existingAlias = withRule.aliases.find((alias) => alias.normalizedAlias === normalizedAlias);
  const alias: LocalMerchantAlias = aliasSchema.parse(existingAlias
    ? { ...existingAlias, merchantProfileId: profile.id }
    : {
        id: createLocalId("alias"),
        merchantProfileId: profile.id,
        normalizedAlias,
        createdAt: timestamp,
      });
  const aliases = existingAlias
    ? withRule.aliases.map((candidate) => candidate.id === alias.id ? alias : candidate)
    : [...withRule.aliases, alias];
  return merchantStorageSchema.parse({ version: 1, profiles: withRule.profiles, aliases, rules: withRule.rules });
}

export function parseMerchantRuleStorage(rawValue: string | null): MerchantRuleStorageResult {
  if (!rawValue) return { data: emptyMerchantData, recoveredFromCorruption: false };
  try {
    const parsed = merchantStorageSchema.safeParse(JSON.parse(rawValue));
    if (!parsed.success) return { data: emptyMerchantData, recoveredFromCorruption: true };
    return {
      data: { profiles: parsed.data.profiles, aliases: parsed.data.aliases, rules: parsed.data.rules },
      recoveredFromCorruption: false,
    };
  } catch {
    return { data: emptyMerchantData, recoveredFromCorruption: true };
  }
}

export function serializeMerchantRuleStorage(data: LocalMerchantData) {
  return JSON.stringify(merchantStorageSchema.parse({ version: 1, ...data }));
}

export function loadMerchantRulesFromStorage(storage: MerchantRuleStorage) {
  try {
    return {
      ...parseMerchantRuleStorage(storage.getItem(MERCHANT_RULE_STORAGE_KEY)),
      storageAvailable: true,
    };
  } catch {
    return { data: emptyMerchantData, recoveredFromCorruption: false, storageAvailable: false };
  }
}

export function saveMerchantRulesToStorage(storage: MerchantRuleStorage, data: LocalMerchantData) {
  try {
    storage.setItem(MERCHANT_RULE_STORAGE_KEY, serializeMerchantRuleStorage(data));
    return true;
  } catch {
    return false;
  }
}

export function emptyLocalMerchantData(): LocalMerchantData {
  return { profiles: [], aliases: [], rules: [] };
}
