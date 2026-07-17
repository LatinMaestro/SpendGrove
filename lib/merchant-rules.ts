import { z } from "zod";
import { getManualCategory, manualCategories } from "@/lib/manual-categories";
import {
  containsPrivateBankIdentifier,
  sanitizeTransactionNarration,
} from "@/lib/validation/privacy";

export const MERCHANT_RULE_STORAGE_KEY = "spendgrove.phase2.merchant-rules.v2";
export const LEGACY_MERCHANT_RULE_STORAGE_KEY = "spendgrove.phase1.merchant-rules.v1";
export const MERCHANT_RULE_STORAGE_VERSION = 2 as const;
export const MERCHANT_PROFILE_LIMIT = 200;
export const MERCHANT_ALIAS_LIMIT = 500;
export const MERCHANT_RULE_LIMIT = 500;

export type LocalMerchantRuleType = "EXACT" | "CONTAINS" | "STARTS_WITH";
export type MerchantSuggestionSource = "USER_RULE" | "USER_ALIAS" | "KEYWORD" | "FALLBACK";
export type MerchantSuggestionConfidence = "HIGH" | "MEDIUM" | "LOW";
export type MerchantConflictResolution = "REPLACE" | "KEEP_EXISTING" | "CANCEL";

export type LocalMerchantProfile = {
  id: string;
  name: string;
  normalizedName: string;
  defaultCategoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LocalMerchantAlias = {
  id: string;
  merchantProfileId: string;
  name: string;
  normalizedAlias: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  migrated: boolean;
  unsupportedVersion: boolean;
  staleReferenceCount: number;
};

export type MerchantRuleStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type MerchantConflict = {
  kind: "RULE" | "ALIAS";
  existingMerchantName: string;
  existingCategoryId: string;
  requestedMerchantName: string;
  requestedCategoryId: string;
};

export class MerchantConflictError extends Error {
  conflict: MerchantConflict;

  constructor(conflict: MerchantConflict) {
    super(conflict.kind === "ALIAS"
      ? "This matching name is already used by another saved merchant."
      : "This merchant already has a different saved category.");
    this.name = "MerchantConflictError";
    this.conflict = conflict;
  }
}

const unsafeMerchantStoragePattern = /\b(?:bsb|account\s*(?:number|no|id)|customer\s*(?:number|no|id)|card\s*(?:number|no|ending)|loan\s*(?:number|no|id|reference)|bank\s*reference)\b/i;
const rawBankDescriptionPattern = /\b(?:terminal|receipt|trace|reference|ref\s*[:#-]|eftpos|card purchase|internet banking|payment id)\b/i;

const safeMerchantNameSchema = z.string()
  .trim()
  .min(2, "Enter a merchant name.")
  .max(80, "Merchant names must be 80 characters or fewer.")
  .refine((value) => !containsPrivateBankIdentifier(value), "Private banking identifiers are not permitted.")
  .refine((value) => !unsafeMerchantStoragePattern.test(value), "Unsafe banking references are not permitted.")
  .refine((value) => !rawBankDescriptionPattern.test(value), "Use a short cleaned merchant name, not a full bank description.");

const normalizedMerchantKeySchema = z.string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?: [a-z0-9]+)*$/, "Merchant keys must contain safe normalised words only.");

const profileSchema = z.object({
  id: z.string().min(1),
  name: safeMerchantNameSchema,
  normalizedName: normalizedMerchantKeySchema,
  defaultCategoryId: z.string().min(1),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict().superRefine((profile, context) => {
  if (normalizeMerchantName(profile.name) !== profile.normalizedName) {
    context.addIssue({ code: "custom", path: ["normalizedName"], message: "Saved merchant name does not match its safe key." });
  }
});

const aliasSchema = z.object({
  id: z.string().min(1),
  merchantProfileId: z.string().min(1),
  name: safeMerchantNameSchema,
  normalizedAlias: normalizedMerchantKeySchema,
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict().superRefine((alias, context) => {
  if (normalizeMerchantName(alias.name) !== alias.normalizedAlias) {
    context.addIssue({ code: "custom", path: ["normalizedAlias"], message: "Saved matching name does not match its safe key." });
  }
});

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
}).strict();

const merchantStorageSchema = z.object({
  version: z.literal(MERCHANT_RULE_STORAGE_VERSION),
  profiles: z.array(profileSchema).max(MERCHANT_PROFILE_LIMIT),
  aliases: z.array(aliasSchema).max(MERCHANT_ALIAS_LIMIT),
  rules: z.array(ruleSchema).max(MERCHANT_RULE_LIMIT),
}).strict().superRefine((data, context) => {
  const profileIds = new Set(data.profiles.map((profile) => profile.id));
  const profileKeys = new Set<string>();
  const aliasKeys = new Set<string>();
  const ruleKeys = new Set<string>();

  data.profiles.forEach((profile, index) => {
    if (profileKeys.has(profile.normalizedName)) {
      context.addIssue({ code: "custom", path: ["profiles", index, "normalizedName"], message: "Merchant names must be unique." });
    }
    profileKeys.add(profile.normalizedName);
  });
  data.aliases.forEach((alias, index) => {
    if (!profileIds.has(alias.merchantProfileId)) {
      context.addIssue({ code: "custom", path: ["aliases", index, "merchantProfileId"], message: "Alias merchant is missing." });
    }
    if (aliasKeys.has(alias.normalizedAlias)) {
      context.addIssue({ code: "custom", path: ["aliases", index, "normalizedAlias"], message: "Matching merchant names must be unique." });
    }
    aliasKeys.add(alias.normalizedAlias);
  });
  data.rules.forEach((rule, index) => {
    if (!profileIds.has(rule.merchantProfileId)) {
      context.addIssue({ code: "custom", path: ["rules", index, "merchantProfileId"], message: "Rule merchant is missing." });
    }
    const ruleKey = `${rule.type}:${rule.normalizedPattern}`;
    if (ruleKeys.has(ruleKey)) {
      context.addIssue({ code: "custom", path: ["rules", index, "normalizedPattern"], message: "Merchant rules must be unique." });
    }
    ruleKeys.add(ruleKey);
  });
});

const legacyProfileSchema = z.object({
  id: z.string().min(1),
  name: safeMerchantNameSchema,
  normalizedName: normalizedMerchantKeySchema,
  defaultCategoryId: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict();

const legacyAliasSchema = z.object({
  id: z.string().min(1),
  merchantProfileId: z.string().min(1),
  normalizedAlias: normalizedMerchantKeySchema,
  createdAt: z.string().datetime(),
}).strict();

const legacyStorageSchema = z.object({
  version: z.literal(1),
  profiles: z.array(legacyProfileSchema).max(MERCHANT_PROFILE_LIMIT),
  aliases: z.array(legacyAliasSchema).max(MERCHANT_ALIAS_LIMIT),
  rules: z.array(ruleSchema).max(MERCHANT_RULE_LIMIT),
}).strict();

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
  { keywords: ["bank transfer", "transfer", "osko"], categoryName: "Transfer", merchantName: "Bank transfer", confidence: "MEDIUM" },
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

function assertSafeStoredMerchantInput(value: string) {
  safeMerchantNameSchema.parse(value);
}

function safeStoredMerchantName(value: string) {
  assertSafeStoredMerchantInput(value);
  const sanitized = sanitizeTransactionNarration(value);
  return safeMerchantNameSchema.parse(sanitized);
}

function containsWholePhrase(value: string, phrase: string) {
  return ` ${value} `.includes(` ${phrase} `);
}

function ruleMatches(rule: LocalMerchantRule, normalizedMerchant: string) {
  if (!rule.isActive) return false;
  if (rule.type === "EXACT") return normalizedMerchant === rule.normalizedPattern;
  if (rule.type === "STARTS_WITH") return normalizedMerchant.startsWith(rule.normalizedPattern);
  return normalizedMerchant.includes(rule.normalizedPattern);
}

function getProfile(data: LocalMerchantData, profileId: string) {
  return data.profiles.find((profile) => profile.id === profileId && profile.isActive);
}

function toLocalMerchantData(input: z.infer<typeof merchantStorageSchema>): LocalMerchantData {
  return { profiles: input.profiles, aliases: input.aliases, rules: input.rules };
}

function validateCurrentData(data: LocalMerchantData) {
  return toLocalMerchantData(merchantStorageSchema.parse({ version: MERCHANT_RULE_STORAGE_VERSION, ...data }));
}

function filterStaleReferences(data: LocalMerchantData) {
  const validProfiles = data.profiles.filter((profile) => Boolean(getManualCategory(profile.defaultCategoryId)));
  const validProfileIds = new Set(validProfiles.map((profile) => profile.id));
  const validAliases = data.aliases.filter((alias) => validProfileIds.has(alias.merchantProfileId));
  const validRules = data.rules.filter((rule) => validProfileIds.has(rule.merchantProfileId) && Boolean(getManualCategory(rule.categoryId)));
  return {
    data: validateCurrentData({ profiles: validProfiles, aliases: validAliases, rules: validRules }),
    staleReferenceCount:
      data.profiles.length - validProfiles.length +
      data.aliases.length - validAliases.length +
      data.rules.length - validRules.length,
  };
}

function profileNameForConflict(data: LocalMerchantData, profileId: string) {
  return data.profiles.find((profile) => profile.id === profileId)?.name ?? "Saved merchant";
}

export function normalizeMerchantName(value: string) {
  const sanitized = sanitizeTransactionNarration(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-AU")
    .replace(/\b(?:pty|ltd|limited|australia|aus)\b/g, " ")
    .replace(/\b(?:store|shop|branch)\s+[a-z0-9]+\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalizedMerchantKeySchema.parse(sanitized);
}

export function findMerchantRuleConflict(
  data: LocalMerchantData,
  input: { merchantName: string; categoryId: string },
): MerchantConflict | null {
  const merchantName = safeStoredMerchantName(input.merchantName);
  const normalizedName = normalizeMerchantName(merchantName);
  const existingRule = data.rules.find((rule) => rule.type === "EXACT" && rule.normalizedPattern === normalizedName);
  if (!existingRule || (existingRule.categoryId === input.categoryId && existingRule.isActive)) return null;
  return {
    kind: "RULE",
    existingMerchantName: profileNameForConflict(data, existingRule.merchantProfileId),
    existingCategoryId: existingRule.categoryId,
    requestedMerchantName: merchantName,
    requestedCategoryId: input.categoryId,
  };
}

export function findMerchantAliasConflict(
  data: LocalMerchantData,
  input: { alias: string; canonicalName: string; categoryId: string; excludedAliasId?: string },
): MerchantConflict | null {
  const aliasName = safeStoredMerchantName(input.alias);
  const canonicalName = safeStoredMerchantName(input.canonicalName);
  const normalizedAlias = normalizeMerchantName(aliasName);
  const canonicalKey = normalizeMerchantName(canonicalName);
  const requestedProfile = data.profiles.find((profile) => profile.normalizedName === canonicalKey);
  const existingAlias = data.aliases.find((alias) =>
    alias.id !== input.excludedAliasId && alias.normalizedAlias === normalizedAlias,
  );
  if (existingAlias && existingAlias.merchantProfileId !== requestedProfile?.id) {
    return {
      kind: "ALIAS",
      existingMerchantName: profileNameForConflict(data, existingAlias.merchantProfileId),
      existingCategoryId: data.profiles.find((profile) => profile.id === existingAlias.merchantProfileId)?.defaultCategoryId ?? input.categoryId,
      requestedMerchantName: canonicalName,
      requestedCategoryId: input.categoryId,
    };
  }
  const existingProfile = data.profiles.find((profile) =>
    profile.normalizedName === normalizedAlias && profile.normalizedName !== canonicalKey,
  );
  if (existingProfile) {
    return {
      kind: "ALIAS",
      existingMerchantName: existingProfile.name,
      existingCategoryId: existingProfile.defaultCategoryId,
      requestedMerchantName: canonicalName,
      requestedCategoryId: input.categoryId,
    };
  }
  return null;
}

export function suggestMerchantCategory(
  merchantValue: string,
  data: LocalMerchantData = emptyLocalMerchantData(),
): MerchantCategorySuggestion {
  const merchantName = sanitizeTransactionNarration(merchantValue || "Payment") || "Payment";
  const normalizedMerchant = normalizeMerchantName(merchantName);

  const matchingRule = [...data.rules]
    .filter((rule) => ruleMatches(rule, normalizedMerchant) && Boolean(getManualCategory(rule.categoryId)))
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

  const alias = data.aliases.find((candidate) =>
    candidate.isActive && candidate.normalizedAlias === normalizedMerchant,
  );
  if (alias) {
    const profile = getProfile(data, alias.merchantProfileId);
    if (profile && getManualCategory(profile.defaultCategoryId)) {
      return {
        merchantName: profile.name,
        categoryId: profile.defaultCategoryId,
        source: "USER_ALIAS",
        confidence: "HIGH",
        reason: "Suggested from a matching merchant name saved on this device.",
        requiresReview: true,
      };
    }
  }

  const canonicalProfile = data.profiles.find((profile) =>
    profile.isActive && profile.normalizedName === normalizedMerchant && Boolean(getManualCategory(profile.defaultCategoryId)),
  );
  if (canonicalProfile) {
    return {
      merchantName: canonicalProfile.name,
      categoryId: canonicalProfile.defaultCategoryId,
      source: "USER_ALIAS",
      confidence: "HIGH",
      reason: "Suggested from a merchant name saved on this device.",
      requiresReview: true,
    };
  }

  const keyword = keywordSuggestions.find((candidate) =>
    candidate.keywords.some((value) => containsWholePhrase(normalizedMerchant, normalizeMerchantName(value))),
  );
  if (keyword) {
    return {
      merchantName: keyword.merchantName ?? merchantName,
      categoryId: categoryIdByName(keyword.categoryName),
      source: "KEYWORD",
      confidence: keyword.confidence,
      reason: keyword.categoryName === "Transfer"
        ? "Possible account movement. Please review the transfer category before using it."
        : "Suggested by a clear local keyword. Please review before using it.",
      requiresReview: true,
    };
  }

  return {
    merchantName,
    categoryId: categoryIdByName("Needs review"),
    source: "FALLBACK",
    confidence: "LOW",
    reason: "No confident local match. Choose a category manually.",
    requiresReview: true,
  };
}

export function saveConfirmedMerchantRule(
  data: LocalMerchantData,
  input: {
    merchantName: string;
    categoryId: string;
    resolution?: MerchantConflictResolution;
    now?: Date;
  },
): LocalMerchantData {
  const name = safeStoredMerchantName(input.merchantName);
  const normalizedName = normalizeMerchantName(name);
  if (!getManualCategory(input.categoryId)) throw new Error("Choose an approved category.");
  const conflict = findMerchantRuleConflict(data, input);
  if (conflict && !input.resolution) throw new MerchantConflictError(conflict);
  if (conflict && input.resolution !== "REPLACE") return data;

  const timestamp = (input.now ?? new Date()).toISOString();
  const existingProfile = data.profiles.find((profile) => profile.normalizedName === normalizedName);
  const profile: LocalMerchantProfile = profileSchema.parse(existingProfile
    ? { ...existingProfile, name, defaultCategoryId: input.categoryId, isActive: true, updatedAt: timestamp }
    : {
        id: createLocalId("merchant"),
        name,
        normalizedName,
        defaultCategoryId: input.categoryId,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
  const profiles = existingProfile
    ? data.profiles.map((candidate) => candidate.id === profile.id ? profile : candidate)
    : [...data.profiles, profile];
  const existingRule = data.rules.find((rule) => rule.type === "EXACT" && rule.normalizedPattern === normalizedName);
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
  return validateCurrentData({ profiles, aliases: data.aliases, rules });
}

export function saveMerchantAlias(
  data: LocalMerchantData,
  input: {
    alias: string;
    canonicalName: string;
    categoryId: string;
    resolution?: MerchantConflictResolution;
    now?: Date;
  },
): LocalMerchantData {
  const aliasName = safeStoredMerchantName(input.alias);
  const canonicalName = safeStoredMerchantName(input.canonicalName);
  const normalizedAlias = normalizeMerchantName(aliasName);
  const canonicalKey = normalizeMerchantName(canonicalName);
  if (normalizedAlias === canonicalKey) throw new Error("Matching name must differ from the main merchant name.");
  const conflict = findMerchantAliasConflict(data, input);
  if (conflict && !input.resolution) throw new MerchantConflictError(conflict);
  if (conflict && input.resolution !== "REPLACE") return data;

  const withRule = saveConfirmedMerchantRule(data, {
    merchantName: canonicalName,
    categoryId: input.categoryId,
    resolution: input.resolution,
    now: input.now,
  });
  const profile = withRule.profiles.find((candidate) => candidate.normalizedName === canonicalKey);
  if (!profile) throw new Error("Main merchant could not be saved.");
  const timestamp = (input.now ?? new Date()).toISOString();
  const existingAlias = withRule.aliases.find((alias) => alias.normalizedAlias === normalizedAlias);
  const alias: LocalMerchantAlias = aliasSchema.parse(existingAlias
    ? { ...existingAlias, merchantProfileId: profile.id, name: aliasName, isActive: true, updatedAt: timestamp }
    : {
        id: createLocalId("alias"),
        merchantProfileId: profile.id,
        name: aliasName,
        normalizedAlias,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
  const aliases = existingAlias
    ? withRule.aliases.map((candidate) => candidate.id === alias.id ? alias : candidate)
    : [...withRule.aliases, alias];
  return validateCurrentData({ profiles: withRule.profiles, aliases, rules: withRule.rules });
}

export function renameMerchantProfile(
  data: LocalMerchantData,
  profileId: string,
  name: string,
  now = new Date(),
) {
  const safeName = safeStoredMerchantName(name);
  const normalizedName = normalizeMerchantName(safeName);
  const profile = data.profiles.find((candidate) => candidate.id === profileId);
  if (!profile) throw new Error("Saved merchant not found.");
  if (data.profiles.some((candidate) => candidate.id !== profileId && candidate.normalizedName === normalizedName)) {
    throw new Error("Another saved merchant already uses this name.");
  }
  if (data.aliases.some((alias) => alias.merchantProfileId !== profileId && alias.normalizedAlias === normalizedName)) {
    throw new Error("This name is already used for matching another merchant.");
  }
  const updatedProfile = profileSchema.parse({
    ...profile,
    name: safeName,
    normalizedName,
    updatedAt: now.toISOString(),
  });
  const profiles = data.profiles.map((candidate) => candidate.id === profileId ? updatedProfile : candidate);
  const rules = data.rules.map((rule) => rule.merchantProfileId === profileId && rule.type === "EXACT"
    ? ruleSchema.parse({ ...rule, normalizedPattern: normalizedName, updatedAt: now.toISOString() })
    : rule);
  return validateCurrentData({ profiles, aliases: data.aliases, rules });
}

export function updateMerchantProfile(
  data: LocalMerchantData,
  profileId: string,
  input: { name?: string; categoryId?: string; isActive?: boolean },
  now = new Date(),
) {
  if (input.name === undefined && input.categoryId === undefined && input.isActive === undefined) {
    throw new Error("Choose a merchant change before saving.");
  }
  let next = input.name === undefined ? data : renameMerchantProfile(data, profileId, input.name, now);
  const profile = next.profiles.find((candidate) => candidate.id === profileId);
  if (!profile) throw new Error("Saved merchant not found.");
  const categoryId = input.categoryId?.trim();
  if (input.categoryId !== undefined && !categoryId) throw new Error("Choose a category.");

  const updatedProfile = profileSchema.parse({
    ...profile,
    ...(categoryId ? { defaultCategoryId: categoryId } : {}),
    ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    updatedAt: now.toISOString(),
  });
  next = {
    profiles: next.profiles.map((candidate) => candidate.id === profileId ? updatedProfile : candidate),
    aliases: next.aliases,
    rules: categoryId
      ? next.rules.map((rule) => rule.merchantProfileId === profileId
        ? ruleSchema.parse({ ...rule, categoryId, updatedAt: now.toISOString() })
        : rule)
      : next.rules,
  };
  return validateCurrentData(next);
}

export function renameMerchantAlias(
  data: LocalMerchantData,
  aliasId: string,
  name: string,
  resolution?: MerchantConflictResolution,
  now = new Date(),
) {
  const alias = data.aliases.find((candidate) => candidate.id === aliasId);
  if (!alias) throw new Error("Matching merchant name not found.");
  const profile = data.profiles.find((candidate) => candidate.id === alias.merchantProfileId);
  if (!profile) throw new Error("Saved merchant not found.");
  const safeName = safeStoredMerchantName(name);
  const conflict = findMerchantAliasConflict(data, {
    alias: safeName,
    canonicalName: profile.name,
    categoryId: profile.defaultCategoryId,
    excludedAliasId: aliasId,
  });
  if (conflict && !resolution) throw new MerchantConflictError(conflict);
  if (conflict && resolution !== "REPLACE") return data;
  const normalizedAlias = normalizeMerchantName(safeName);
  const aliases = data.aliases
    .filter((candidate) => !(
      candidate.id !== aliasId &&
      candidate.normalizedAlias === normalizedAlias &&
      resolution === "REPLACE"
    ))
    .map((candidate) => candidate.id === aliasId
      ? aliasSchema.parse({ ...candidate, name: safeName, normalizedAlias, isActive: true, updatedAt: now.toISOString() })
      : candidate);
  return validateCurrentData({ profiles: data.profiles, aliases, rules: data.rules });
}

export function setMerchantAliasActive(data: LocalMerchantData, aliasId: string, isActive: boolean, now = new Date()) {
  if (!data.aliases.some((alias) => alias.id === aliasId)) throw new Error("Matching merchant name not found.");
  return validateCurrentData({
    profiles: data.profiles,
    aliases: data.aliases.map((alias) => alias.id === aliasId
      ? aliasSchema.parse({ ...alias, isActive, updatedAt: now.toISOString() })
      : alias),
    rules: data.rules,
  });
}

export function deleteMerchantAlias(data: LocalMerchantData, aliasId: string) {
  return validateCurrentData({
    profiles: data.profiles,
    aliases: data.aliases.filter((alias) => alias.id !== aliasId),
    rules: data.rules,
  });
}

export function setMerchantRuleActive(data: LocalMerchantData, ruleId: string, isActive: boolean, now = new Date()) {
  if (!data.rules.some((rule) => rule.id === ruleId)) throw new Error("Saved merchant rule not found.");
  return validateCurrentData({
    profiles: data.profiles,
    aliases: data.aliases,
    rules: data.rules.map((rule) => rule.id === ruleId
      ? ruleSchema.parse({ ...rule, isActive, updatedAt: now.toISOString() })
      : rule),
  });
}

export function deleteMerchantRule(data: LocalMerchantData, ruleId: string) {
  return validateCurrentData({
    profiles: data.profiles,
    aliases: data.aliases,
    rules: data.rules.filter((rule) => rule.id !== ruleId),
  });
}

export function parseMerchantRuleStorage(rawValue: string | null): MerchantRuleStorageResult {
  if (!rawValue) {
    return {
      data: emptyLocalMerchantData(),
      recoveredFromCorruption: false,
      migrated: false,
      unsupportedVersion: false,
      staleReferenceCount: 0,
    };
  }
  try {
    const json: unknown = JSON.parse(rawValue);
    const current = merchantStorageSchema.safeParse(json);
    if (current.success) {
      const filtered = filterStaleReferences(toLocalMerchantData(current.data));
      return {
        ...filtered,
        recoveredFromCorruption: false,
        migrated: false,
        unsupportedVersion: false,
      };
    }

    const legacy = legacyStorageSchema.safeParse(json);
    if (legacy.success) {
      const migratedData: LocalMerchantData = {
        profiles: legacy.data.profiles.map((profile) => ({ ...profile, isActive: true })),
        aliases: legacy.data.aliases.map((alias) => ({
          ...alias,
          name: alias.normalizedAlias.replace(/\b\w/g, (letter) => letter.toLocaleUpperCase("en-AU")),
          isActive: true,
          updatedAt: alias.createdAt,
        })),
        rules: legacy.data.rules,
      };
      const filtered = filterStaleReferences(validateCurrentData(migratedData));
      return {
        ...filtered,
        recoveredFromCorruption: false,
        migrated: true,
        unsupportedVersion: false,
      };
    }

    const version = typeof json === "object" && json !== null && "version" in json
      ? (json as { version?: unknown }).version
      : undefined;
    return {
      data: emptyLocalMerchantData(),
      recoveredFromCorruption: version === undefined || version === MERCHANT_RULE_STORAGE_VERSION,
      migrated: false,
      unsupportedVersion: typeof version === "number" && version > MERCHANT_RULE_STORAGE_VERSION,
      staleReferenceCount: 0,
    };
  } catch {
    return {
      data: emptyLocalMerchantData(),
      recoveredFromCorruption: true,
      migrated: false,
      unsupportedVersion: false,
      staleReferenceCount: 0,
    };
  }
}

export function serializeMerchantRuleStorage(data: LocalMerchantData) {
  return JSON.stringify(merchantStorageSchema.parse({ version: MERCHANT_RULE_STORAGE_VERSION, ...data }));
}

export function loadMerchantRulesFromStorage(storage: MerchantRuleStorage) {
  try {
    const currentValue = storage.getItem(MERCHANT_RULE_STORAGE_KEY);
    const legacyValue = currentValue ? null : storage.getItem(LEGACY_MERCHANT_RULE_STORAGE_KEY);
    return {
      ...parseMerchantRuleStorage(currentValue ?? legacyValue),
      storageAvailable: true,
    };
  } catch {
    return {
      data: emptyLocalMerchantData(),
      recoveredFromCorruption: false,
      migrated: false,
      unsupportedVersion: false,
      staleReferenceCount: 0,
      storageAvailable: false,
    };
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
