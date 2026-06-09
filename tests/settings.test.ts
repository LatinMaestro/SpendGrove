import { describe, expect, it } from "vitest";
import {
  defaultFeatureFlags,
  defaultUserSettings,
  featureFlagDefinitions,
  normaliseUserSettings,
  parseStoredUserSettings,
} from "@/lib/settings";

describe("Phase 1 settings foundation", () => {
  it("defaults to Simple Mode and privacy-first analytics preference", () => {
    expect(defaultUserSettings.simpleMode).toBe(true);
    expect(defaultUserSettings.analyticsOptOut).toBe(true);
    expect(defaultUserSettings.currency).toBe("AUD");
    expect(defaultUserSettings.locale).toBe("en-AU");
    expect(defaultUserSettings.financialYearStartMonth).toBe(7);
  });

  it("keeps every advanced feature disabled", () => {
    expect(Object.values(defaultFeatureFlags).every((enabled) => enabled === false)).toBe(true);
    expect(featureFlagDefinitions).toHaveLength(Object.keys(defaultFeatureFlags).length);
  });

  it("does not allow stored browser data to activate advanced modules", () => {
    const settings = normaliseUserSettings({
      simpleMode: false,
      featureFlags: {
        loanTracking: true,
        propertyTracking: true,
        enhancedMerchantLookup: true,
        aiFeatures: true,
      },
    });

    expect(settings.simpleMode).toBe(false);
    expect(settings.featureFlags).toEqual(defaultFeatureFlags);
  });

  it("preserves supported local preferences", () => {
    const settings = parseStoredUserSettings(JSON.stringify({
      simpleMode: false,
      analyticsOptOut: false,
      onboardingComplete: true,
    }));

    expect(settings.simpleMode).toBe(false);
    expect(settings.analyticsOptOut).toBe(false);
    expect(settings.onboardingComplete).toBe(true);
  });

  it("falls back safely when stored settings are malformed", () => {
    expect(parseStoredUserSettings("not-json")).toEqual(defaultUserSettings);
    expect(normaliseUserSettings({ simpleMode: "yes" })).toEqual(defaultUserSettings);
  });
});
