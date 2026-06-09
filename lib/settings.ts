import { z } from "zod";

export const featureFlagDefinitions = [
  {
    key: "splitTransactions",
    label: "Split transactions",
    description: "Split one transaction across multiple categories.",
  },
  {
    key: "taxReporting",
    label: "Tax reporting",
    description: "Tax groups and EOFY reporting are planned for a later phase.",
  },
  {
    key: "propertyTracking",
    label: "Property tracking",
    description: "Property records and reports are not available in Phase 1.",
  },
  {
    key: "loanTracking",
    label: "Loan tracking",
    description: "Home and personal loan imports remain outside the current scope.",
  },
  {
    key: "recurringDetection",
    label: "Recurring payments",
    description: "Subscription and recurring detection will be reviewed later.",
  },
  {
    key: "enhancedMerchantLookup",
    label: "Enhanced merchant lookup",
    description: "External merchant lookup is optional, privacy-reviewed and currently off.",
  },
  {
    key: "aiFeatures",
    label: "AI features",
    description: "No AI provider or AI processing is connected.",
  },
  {
    key: "payments",
    label: "Payments and plans",
    description: "Payments and paywalls require separate client approval.",
  },
] as const;

export type FeatureFlagKey = (typeof featureFlagDefinitions)[number]["key"];
export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export type UserPreferenceSettings = {
  simpleMode: boolean;
  analyticsOptOut: boolean;
  onboardingComplete: boolean;
  currency: "AUD";
  locale: "en-AU";
  financialYearStartMonth: 7;
  featureFlags: FeatureFlags;
};

export const settingsStorageKey = "spendgrove.phase1.settings";

export const defaultFeatureFlags: FeatureFlags = {
  splitTransactions: false,
  taxReporting: false,
  propertyTracking: false,
  loanTracking: false,
  recurringDetection: false,
  enhancedMerchantLookup: false,
  aiFeatures: false,
  payments: false,
};

export const defaultUserSettings: UserPreferenceSettings = {
  simpleMode: true,
  analyticsOptOut: true,
  onboardingComplete: false,
  currency: "AUD",
  locale: "en-AU",
  financialYearStartMonth: 7,
  featureFlags: defaultFeatureFlags,
};

const storedSettingsSchema = z.object({
  simpleMode: z.boolean().optional(),
  analyticsOptOut: z.boolean().optional(),
  onboardingComplete: z.boolean().optional(),
  currency: z.literal("AUD").optional(),
  locale: z.literal("en-AU").optional(),
  financialYearStartMonth: z.literal(7).optional(),
  featureFlags: z.record(z.boolean()).optional(),
});

export function normaliseUserSettings(value: unknown): UserPreferenceSettings {
  const parsed = storedSettingsSchema.safeParse(value);

  if (!parsed.success) {
    return defaultUserSettings;
  }

  return {
    ...defaultUserSettings,
    simpleMode: parsed.data.simpleMode ?? defaultUserSettings.simpleMode,
    analyticsOptOut: parsed.data.analyticsOptOut ?? defaultUserSettings.analyticsOptOut,
    onboardingComplete: parsed.data.onboardingComplete ?? defaultUserSettings.onboardingComplete,
    featureFlags: defaultFeatureFlags,
  };
}

export function parseStoredUserSettings(rawValue: string | null): UserPreferenceSettings {
  if (!rawValue) {
    return defaultUserSettings;
  }

  try {
    return normaliseUserSettings(JSON.parse(rawValue));
  } catch {
    return defaultUserSettings;
  }
}
